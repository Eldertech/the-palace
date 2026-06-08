// companion-lane.js — advance one interactive Companion turn over an entry.
//
// The entry-agent window is "a blackboard client wearing an entry's face." A
// turn fires a headless `claude -p` worker (the actuator — no direct API)
// grounded in the open entry, captures its stdout to a per-turn transcript, and
// on exit REAPS: parse the worker's reply and post it to the persistent board as
// `from: "<Entry> (Companion)"` (a §2.2 convention, no new verb). The window
// reads that BROADCAST back over SSE.
//
// M1b is DISCUSS-ONLY: the worker generates a reply; it writes nothing. Node
// owns the enforced write path, which M1c adds. The lane is its own actuator
// lane (.actuator-companion/) so a Companion turn never collides with the
// Enrichment or steward lanes (scar #4: single global worker per lane).
//
// Pure helpers (slugify / companionFrom / extractReply / buildCompanionMessage)
// are exported for unit tests; the fire/reap side-effects are integration-tested
// against a stub worker so the test path never spawns a real `claude -p`.

import { existsSync, readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { resolve, join } from 'node:path';

import { createActuator } from './actuator.js';
import { readEntry } from '../src/lib/entries.js';
import { assembleGrounding } from '../src/lib/entry-grounding.js';
import { buildCompanionPrompt } from './companion-prompt.js';
import { appendMessage } from '@stigmergy/core/blackboard';
import { validateMessage } from '@stigmergy/core/schema';

const DEFAULT_STATE_DIR_REL = '_ops/stigmergy/.actuator-companion';
const PERSISTENT_REL = '_ops/swarm/persistent/blackboard.jsonl';
const DEFAULT_MODEL = 'opus'; // capability-first (Plan §5); optimize down in M3

// ── pure helpers (exported for unit tests) ──────────────────────────────────

export function slugify(s) {
  return String(s == null ? '' : s)
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'entry';
}

/** The board identity of an entry in Companion mode (the convention). */
export function companionFrom(title) {
  return `${title} (Companion)`;
}

/** The real (non-stub) Companion worker argv — a headless capability-first cycle. */
export function companionArgv(prompt, model) {
  return ['claude', '-p', prompt, '--model', model || DEFAULT_MODEL, '--permission-mode', 'bypassPermissions'];
}

/**
 * Pull the worker's reply out of its raw stdout. The contract asks for a single
 * JSON object {"reply":"..."}, but a capable model may wrap it; so we scan for
 * the LAST balanced {...} that parses with a string `reply`, and fall back to
 * the raw text (fence-stripped) so the user always sees something.
 */
export function extractReply(raw) {
  if (typeof raw !== 'string') return '';
  const text = raw.trim();
  if (!text) return '';
  const objs = [];
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] !== '{') continue;
    let depth = 0, inStr = false, esc = false;
    for (let j = i; j < text.length; j += 1) {
      const c = text[j];
      if (inStr) {
        if (esc) esc = false;
        else if (c === '\\') esc = true;
        else if (c === '"') inStr = false;
      } else if (c === '"') inStr = true;
      else if (c === '{') depth += 1;
      else if (c === '}') { depth -= 1; if (depth === 0) { objs.push(text.slice(i, j + 1)); break; } }
    }
  }
  for (let k = objs.length - 1; k >= 0; k -= 1) {
    try {
      const obj = JSON.parse(objs[k]);
      if (obj && typeof obj.reply === 'string') return obj.reply;
    } catch (_) { /* try the next candidate */ }
  }
  return text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
}

/**
 * Build the §2.2 BROADCAST the Companion posts back. Caller passes ts/id so this
 * is pure and testable. Validated by core before it is ever appended.
 */
export function buildCompanionMessage({ title, entryPath, turnId, reply, model, ts, id }) {
  const slug = slugify(title);
  return {
    schema_version: '1.0',
    id: id || `${slug}-companion-${turnId}`,
    ts,
    session_id: `companion-${slug}`,
    from: companionFrom(title),
    to: '*',
    type: 'BROADCAST',
    board: 'GENERAL',
    health: {
      score: 'green',
      model: model || DEFAULT_MODEL,
      _orchestrator_metadata: {
        dispatch_mode: 'claude-code-subagent',
        note: 'Companion turn (discuss). Path 2 (claude-code-subagent) — token metrics not authoritatively tracked.',
      },
    },
    payload: {
      kind: 'companion_reply',
      entry: title,
      entry_path: entryPath,
      turn_id: turnId,
      in_reply_to: turnId,
      reply,
    },
  };
}

// ── the lane ────────────────────────────────────────────────────────────────

/**
 * @param {object} opts
 * @param {string} opts.palaceRoot
 * @param {string} [opts.boardPath]
 * @param {string} [opts.stateDir]
 * @param {string} [opts.model]      — worker model (default 'opus')
 * @param {(prompt:string)=>string[]} [opts.buildArgv] — stub injection (tests)
 * @param {boolean} [opts.dryReap]   — fire+exit but do not post (live e2e safety)
 * @returns {{ turn, status, paths }}
 */
export function createCompanionLane(opts = {}) {
  const root = resolve(opts.palaceRoot ?? process.cwd());
  const boardPath = opts.boardPath ? resolve(opts.boardPath) : join(root, PERSISTENT_REL);
  const stateDir = opts.stateDir ? resolve(opts.stateDir) : join(root, DEFAULT_STATE_DIR_REL);
  const model = opts.model || DEFAULT_MODEL;
  const stubArgv = typeof opts.buildArgv === 'function' ? opts.buildArgv : null;
  const dryReap = opts.dryReap === true;

  const transcriptsDir = join(stateDir, 'transcripts');
  const lastTurnFile = join(stateDir, 'last-turn.json');

  const realArgv = (prompt) => companionArgv(prompt, model);

  const actuator = createActuator({
    palaceRoot: root,
    stateDir,
    buildArgv: stubArgv || realArgv,
    onExit: reap,
  });

  function logLine(line) {
    try { appendFileSync(actuator.paths.logFile, `${line}\n`); } catch (_) { /* best effort */ }
  }
  function writeLastTurn(obj) {
    try { writeFileSync(lastTurnFile, JSON.stringify(obj, null, 2) + '\n'); } catch (_) { /* best effort */ }
  }
  function readLastTurn() {
    try { return JSON.parse(readFileSync(lastTurnFile, 'utf8')); } catch (_) { return null; }
  }

  // The reap: runs in the worker's exit handler. Never let a throw escape
  // (an uncaught error in an exit handler crashes the Vite host).
  function reap(ctx) {
    const meta = (ctx && ctx.meta) || {};
    try {
      if (dryReap) {
        writeLastTurn({ ok: true, stub: true, turn_id: meta.turnId, entry: meta.entryTitle, ts: meta.ts });
        return;
      }
      let raw = '';
      try { raw = readFileSync(meta.transcriptPath, 'utf8'); } catch (_) { raw = ''; }
      const reply = extractReply(raw) || '(the companion returned nothing)';
      const msg = buildCompanionMessage({
        title: meta.entryTitle,
        entryPath: meta.entryPath,
        turnId: meta.turnId,
        reply,
        model: meta.model || model,
        ts: new Date().toISOString(),
      });
      const v = validateMessage(msg);
      if (!v.valid) {
        logLine(`ERROR: companion message invalid: ${JSON.stringify(v.errors)}`);
        writeLastTurn({ ok: false, turn_id: meta.turnId, error: 'invalid message', errors: v.errors });
        return;
      }
      appendMessage(boardPath, msg);
      writeLastTurn({ ok: true, turn_id: meta.turnId, entry: meta.entryTitle, message_id: msg.id, ts: msg.ts });
    } catch (e) {
      logLine(`ERROR: companion reap failed: ${e.message}`);
      writeLastTurn({ ok: false, turn_id: meta && meta.turnId, error: e.message });
    }
  }

  /**
   * Fire one Companion turn. Refuses (busy) while a worker is alive (scar #4).
   * @returns {{ ok, fired, busy?, turnId?, msg }}
   */
  function turn({ path, message, history = [] } = {}) {
    if (typeof path !== 'string' || path.trim() === '') {
      return { ok: false, fired: false, msg: 'missing entry path' };
    }
    if (typeof message !== 'string' || message.trim() === '') {
      return { ok: false, fired: false, msg: 'missing message' };
    }
    if (actuator.isAlive().running) {
      return { ok: false, fired: false, busy: true, msg: 'a companion turn is already running' };
    }

    const entry = readEntry(root, path);
    if (!entry) return { ok: false, fired: false, msg: 'entry not found or excluded' };
    const grounding = assembleGrounding(root, path);
    if (!grounding) return { ok: false, fired: false, msg: 'could not assemble grounding' };

    const tsNow = new Date().toISOString();
    const turnId = `companion-${slugify(entry.title)}-${tsNow.replace(/[:.]/g, '-')}`;
    const transcriptPath = join(transcriptsDir, `${turnId}.out`);

    let prompt;
    try {
      prompt = buildCompanionPrompt({ grounding, body: entry.body, message, history });
    } catch (e) {
      return { ok: false, fired: false, msg: `could not build prompt: ${e.message}` };
    }

    const r = actuator.fire(prompt, {
      transcriptPath,
      meta: { entryPath: entry.path, entryTitle: entry.title, turnId, transcriptPath, model },
    });
    if (!r.fired) {
      return { ok: false, fired: false, busy: /already running/.test(r.msg), turnId, msg: r.msg };
    }
    return { ok: true, fired: true, turnId, msg: r.msg };
  }

  function status() {
    return { ...actuator.status(), last_turn: readLastTurn() };
  }

  return {
    turn,
    status,
    paths: {
      stateDir, transcriptsDir, lastTurnFile, boardPath,
      logFile: actuator.paths.logFile, pidFile: actuator.paths.pidFile,
    },
  };
}
