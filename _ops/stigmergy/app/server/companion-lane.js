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
import { armedWriteEntry, ensureEditsWorktree, revertCommit } from './armed-write.js';
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
 * Pull the worker's result out of its raw stdout. The contract asks for a single
 * JSON object {"reply":"...","edit"?:{...}}, but a capable model may wrap it; so
 * we scan for the LAST balanced {...} that parses with a string `reply` or an
 * `edit`, and fall back to the raw text (fence-stripped) as the reply so the
 * user always sees something. Returns { reply, edit }.
 */
export function extractResult(raw) {
  if (typeof raw !== 'string') return { reply: '', edit: null };
  const text = raw.trim();
  if (!text) return { reply: '', edit: null };
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
      if (obj && (typeof obj.reply === 'string' || (obj.edit && typeof obj.edit === 'object'))) {
        return {
          reply: typeof obj.reply === 'string' ? obj.reply : '',
          edit: obj.edit && typeof obj.edit === 'object' ? obj.edit : null,
        };
      }
    } catch (_) { /* try the next candidate */ }
  }
  return { reply: text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim(), edit: null };
}

/** Back-compat: just the reply string. */
export function extractReply(raw) {
  return extractResult(raw).reply;
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

/**
 * Build the §2.2 PROOF an edit posts once it is committed. type PROOF carries
 * "it landed in LOG": the commit hash is the proof the write is real. Pure +
 * validated by core before append.
 */
export function buildEditProofMessage({ title, entryPath, turnId, op, shortHash, branch, summary, model, ts, id, vectorChange }) {
  const slug = slugify(title);
  return {
    schema_version: '1.0',
    id: id || `${slug}-companion-edit-${turnId}`,
    ts,
    session_id: `companion-${slug}`,
    from: companionFrom(title),
    to: '*',
    type: 'PROOF',
    board: 'GENERAL',
    health: {
      score: 'green',
      model: model || DEFAULT_MODEL,
      _orchestrator_metadata: {
        dispatch_mode: 'claude-code-subagent',
        note: 'Companion edit committed to the quarantined edits branch. Path 2 stub health.',
      },
    },
    payload: {
      kind: 'companion_edit',
      entry: title,
      entry_path: entryPath,
      turn_id: turnId,
      op,
      commit: shortHash,
      branch,
      summary,
      status: 'committed',
      // A forward-vector change is never silent — carry from→to so the window
      // flags it (the standing rule: never rewrite a forward_vector quietly).
      ...(vectorChange ? { vector_change: vectorChange } : {}),
    },
  };
}

/**
 * Build the §2.2 PROOF a revert posts. An undo is honest: a NEW inverse commit,
 * carrying both its own hash and the original it reverts. Same companion_edit
 * payload kind (op:'revert', status:'reverted') so the window renders it as a
 * marker on the same conversation. Pure + validated by core before append.
 */
export function buildRevertProofMessage({ title, entryPath, turnId, reverts, revertHash, branch, summary, model, ts, id }) {
  const slug = slugify(title);
  return {
    schema_version: '1.0',
    id: id || `${slug}-companion-revert-${turnId}`,
    ts,
    session_id: `companion-${slug}`,
    from: companionFrom(title),
    to: '*',
    type: 'PROOF',
    board: 'GENERAL',
    health: {
      score: 'green',
      model: model || DEFAULT_MODEL,
      _orchestrator_metadata: {
        dispatch_mode: 'claude-code-subagent',
        note: 'Companion edit reverted on the quarantined edits branch (a new inverse commit). Path 2 stub health.',
      },
    },
    payload: {
      kind: 'companion_edit',
      entry: title,
      entry_path: entryPath,
      turn_id: turnId,
      op: 'revert',
      commit: revertHash,
      reverts,
      branch,
      summary: summary || `revert ${reverts}`,
      status: 'reverted',
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
  // The quarantined edit target. When provided (tests), used directly; else the
  // dedicated worktree is created lazily on the first edit (../palace-stigmergy-
  // edits on `stigmergy-edits`, decided 2026-06-08).
  const editsBranch = opts.editsBranch || 'stigmergy-edits';
  const editsRootOpt = opts.editsRoot ? resolve(opts.editsRoot) : null;

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

  async function resolveEditsRoot() {
    if (editsRootOpt) return editsRootOpt;
    return ensureEditsWorktree(root, { branch: editsBranch });
  }

  function postIfValid(msg) {
    if (validateMessage(msg).valid) { appendMessage(boardPath, msg); return true; }
    logLine(`ERROR: companion message invalid: ${JSON.stringify(validateMessage(msg).errors)}`);
    return false;
  }

  // The reap: runs in the worker's exit handler. async, but structured so it
  // NEVER rejects (an unhandled rejection from an exit handler is as bad as a
  // throw). It posts the reply, then — if the worker proposed an edit — applies
  // it through the enforced write path and posts a PROOF carrying the commit.
  async function reap(ctx) {
    const meta = (ctx && ctx.meta) || {};
    const { entryTitle: title, entryPath, turnId } = meta;
    try {
      if (dryReap) {
        writeLastTurn({ ok: true, stub: true, turn_id: turnId, entry: title, ts: meta.ts });
        return;
      }
      let raw = '';
      try { raw = readFileSync(meta.transcriptPath, 'utf8'); } catch (_) { raw = ''; }
      const { reply, edit } = extractResult(raw);
      // In-place edits reach only the entry kind. Other contexts (app_feedback,
      // and the later commit / trickster kinds) ignore any proposed `edit`; their
      // actions arrive on a different channel. Absent kind = legacy entry turn.
      const allowEdit = meta.kind == null || meta.kind === 'entry';
      const hasEdit = allowEdit && !!(edit && edit.op);

      // 1) the conversational reply. Adaptive narration (Plan §7.2): when an
      // edit lands, the worker stays QUIET for a clean/obvious change — the edit
      // marker speaks for it — and narrates only when there's something worth
      // saying. So post a reply bubble whenever there IS a reply; when the reply
      // is empty, post the "nothing" note ONLY if there's also no edit, so every
      // turn still yields at least one board message (the window's `sending`
      // clears on it).
      const trimmedReply = typeof reply === 'string' ? reply.trim() : '';
      if (trimmedReply) {
        postIfValid(buildCompanionMessage({
          title, entryPath, turnId, reply: trimmedReply, model: meta.model || model, ts: new Date().toISOString(),
        }));
      } else if (!hasEdit) {
        postIfValid(buildCompanionMessage({
          title, entryPath, turnId, reply: '(the companion returned nothing)',
          model: meta.model || model, ts: new Date().toISOString(),
        }));
      }

      // 2) the edit, through the enforced write path → PROOF on success
      let editSummary = null;
      if (hasEdit) {
        try {
          const editsRoot = await resolveEditsRoot();
          const w = await armedWriteEntry({
            editsRoot, relPath: entryPath, op: edit,
            summary: edit.summary || `companion ${edit.op}: ${title}`,
            verify: 'unverified', author: 'claude',
          });
          if (w.ok) {
            postIfValid(buildEditProofMessage({
              title, entryPath, turnId, op: w.op, shortHash: w.shortHash,
              branch: editsBranch, summary: edit.summary || `companion ${edit.op}`,
              model: meta.model || model, ts: new Date().toISOString(),
              vectorChange: w.vectorChange || null,
            }));
            editSummary = { ok: true, op: w.op, commit: w.shortHash };
          } else {
            postIfValid(buildCompanionMessage({
              title, entryPath, turnId, reply: `I couldn't apply that edit honestly: ${w.error}`,
              model: meta.model || model, ts: new Date().toISOString(),
              id: `${slugify(title)}-companion-editfail-${turnId}`,
            }));
            editSummary = { ok: false, error: w.error };
          }
        } catch (e) {
          logLine(`ERROR: companion edit failed: ${e.message}`);
          // Post so the turn never hangs the window when the reply was quiet.
          postIfValid(buildCompanionMessage({
            title, entryPath, turnId, reply: `I hit an error applying that edit: ${e.message}`,
            model: meta.model || model, ts: new Date().toISOString(),
            id: `${slugify(title)}-companion-editerr-${turnId}`,
          }));
          editSummary = { ok: false, error: e.message };
        }
      }
      writeLastTurn({ ok: true, turn_id: turnId, entry: title, edit: editSummary, ts: new Date().toISOString() });
    } catch (e) {
      logLine(`ERROR: companion reap failed: ${e.message}`);
      writeLastTurn({ ok: false, turn_id: turnId, error: e.message });
    }
  }

  /**
   * Fire one Companion turn. Refuses (busy) while a worker is alive (scar #4).
   * Context-aware: the open entry (kind 'entry', body/vector editing) or
   * STIGMERGY itself (kind 'app_feedback', discuss-only in Stage 0). A bare
   * `{ path }` is accepted as the entry kind for back-compat.
   * @param {{ context?:object, path?:string, message:string, history?:Array, focus?:string }} args
   * @returns {{ ok, fired, busy?, turnId?, msg }}
   */
  function turn({ context, path, message, history = [], focus = null } = {}) {
    const ctx = (context && typeof context === 'object' && context.kind)
      ? context
      : (typeof path === 'string' && path.trim() ? { kind: 'entry', path } : null);
    if (!ctx) {
      return { ok: false, fired: false, msg: 'missing entry path' };
    }
    if (typeof message !== 'string' || message.trim() === '') {
      return { ok: false, fired: false, msg: 'missing message' };
    }
    if (actuator.isAlive().running) {
      return { ok: false, fired: false, busy: true, msg: 'a companion turn is already running' };
    }

    const tsNow = new Date().toISOString();
    const stamp = tsNow.replace(/[:.]/g, '-');
    let prompt, meta, turnId;

    if (ctx.kind === 'entry') {
      const entry = readEntry(root, ctx.path);
      if (!entry) return { ok: false, fired: false, msg: 'entry not found or excluded' };
      const grounding = assembleGrounding(root, ctx.path);
      if (!grounding) return { ok: false, fired: false, msg: 'could not assemble grounding' };
      turnId = `companion-${slugify(entry.title)}-${stamp}`;
      try {
        prompt = buildCompanionPrompt({
          context: ctx, grounding, frontmatter: entry.frontmatter, body: entry.body, message, history,
          focus: typeof focus === 'string' && focus.trim() ? focus.trim() : null,
        });
      } catch (e) {
        return { ok: false, fired: false, msg: `could not build prompt: ${e.message}` };
      }
      meta = { kind: 'entry', entryPath: entry.path, entryTitle: entry.title, turnId, model };
    } else if (ctx.kind === 'app_feedback') {
      turnId = `companion-app-${slugify(ctx.deck || 'stigmergy')}-${stamp}`;
      try {
        prompt = buildCompanionPrompt({ context: ctx, message, history });
      } catch (e) {
        return { ok: false, fired: false, msg: `could not build prompt: ${e.message}` };
      }
      meta = { kind: 'app_feedback', entryPath: null, entryTitle: 'STIGMERGY', turnId, model };
    } else {
      return { ok: false, fired: false, msg: `companion can't ground in "${ctx.kind}" yet` };
    }

    const transcriptPath = join(transcriptsDir, `${turnId}.out`);
    const r = actuator.fire(prompt, { transcriptPath, meta: { ...meta, transcriptPath } });
    if (!r.fired) {
      return { ok: false, fired: false, busy: /already running/.test(r.msg), turnId, msg: r.msg };
    }
    return { ok: true, fired: true, turnId, msg: r.msg };
  }

  /**
   * Undo a committed Companion edit: revert its commit on the quarantined edits
   * branch (a new inverse commit) and post a revert PROOF on the same turn so
   * the window can mark it reverted. Honest by construction — never a silent
   * rollback. async; never throws (returns a structured result).
   * @param {{path?:string, commit:string, turnId?:string}} args
   */
  async function undo({ path, commit, turnId } = {}) {
    if (typeof commit !== 'string' || commit.trim() === '') {
      return { ok: false, msg: 'missing commit' };
    }
    const entry = typeof path === 'string' && path.trim() ? readEntry(root, path) : null;
    const title = entry ? entry.title : (path || 'entry');
    const entryPath = entry ? entry.path : (path || '');

    let editsRoot;
    try { editsRoot = await resolveEditsRoot(); }
    catch (e) { return { ok: false, msg: `could not open the edits worktree: ${e.message}` }; }

    const r = await revertCommit({ editsRoot, hash: commit.trim() });
    if (!r.ok) return { ok: false, msg: r.error };

    const tid = (typeof turnId === 'string' && turnId.trim()) ? turnId.trim() : `companion-undo-${slugify(title)}`;
    postIfValid(buildRevertProofMessage({
      title, entryPath, turnId: tid, reverts: commit.trim(), revertHash: r.revertHash,
      branch: editsBranch, summary: r.subject, model, ts: new Date().toISOString(),
    }));
    return { ok: true, revertHash: r.revertHash, reverts: commit.trim(), turnId: tid };
  }

  function status() {
    return { ...actuator.status(), last_turn: readLastTurn() };
  }

  return {
    turn,
    undo,
    status,
    paths: {
      stateDir, transcriptsDir, lastTurnFile, boardPath, editsBranch,
      logFile: actuator.paths.logFile, pidFile: actuator.paths.pidFile,
    },
  };
}
