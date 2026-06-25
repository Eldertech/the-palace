// regen-lane.js — render one entry's hero/avatar through the Hero and Avatar Maker.
//
// The companion door (Maker entry, "The easy door"): in the STIGMERGY companion
// over an entry, Loudon discusses its face and asks for a regen; the companion
// worker DISTILLS the art direction and emits a `regen_visual` action; the
// companion lane hands it here. This lane is the actuator for that render —
// the sibling of companion-lane.js, but the worker it fires is a Python render
// (regen_one.py → FLUX on RunPod), not a `claude -p`.
//
// One-shot model (Loudon's call): the request IS the go-ahead. We fire the
// render immediately, and on completion COMMIT the new face directly to the live
// palace (git is the backstop; the window's [undo] reverts the commit through the
// companion lane's existing revert path). No proposal gate. The art-direction
// gate is the conversation itself — the worker echoes what it's rendering.
//
// Its own actuator lane (.actuator-regen/) so a render NEVER collides with a
// companion turn (Loudon keeps chatting while it renders) — and single-worker-
// per-lane means one face at a time (scar #4). Board posts are HAND-WRITTEN by
// Node here (no LLM call for the messages themselves), so they carry stub health.
//
// Pure builders (buildRegen{Started,Done,Failed}Message) are exported for unit
// tests; the fire/reap side-effects are integration-tested against regen_one.py
// --mock (tiny PNGs, no RunPod).

import { existsSync, readFileSync, writeFileSync, mkdirSync, appendFileSync, unlinkSync } from 'node:fs';
import { resolve, join } from 'node:path';

import { createActuator } from './actuator.js';
import { readEntry } from '../src/lib/entries.js';
import { commitSelected } from './commit.js';
import { appendMessage } from '@stigmergy/core/blackboard';
import { validateMessage } from '@stigmergy/core/schema';

const DEFAULT_REGEN_STATE_DIR_REL = '_ops/stigmergy/.actuator-regen';
// The render script lives in TRACKED Shop space (alongside the RunPod client),
// NOT gitignored _ops/scratch/, so it ships in every checkout. It takes the
// palace root explicitly (--palace) so its location never dictates resolution.
const DEFAULT_REGEN_SCRIPT_REL = 'Shop/Hero and Avatar Maker/regen_one.py';
const PERSISTENT_REL = '_ops/swarm/persistent/blackboard.jsonl';
const REGEN_SIGNATURE = 'regen_one.py';   // ps-liveness marker (scar #2)
const RENDER_MODEL = 'flux1-dev-fp8';      // the render model; health.model accepts any non-empty string
const MAKER_FROM = 'Hero and Avatar Maker'; // the steward acting (§9: `from` = the page's title)
const MAKER_SESSION = 'hero-avatar-maker';

// ── pure helpers (exported for unit tests) ──────────────────────────────────

export function slugify(s) {
  return String(s == null ? '' : s)
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'entry';
}

/** A render's one-line summary of what it remade. */
export function regenSummary(target) {
  if (target === 'hero') return 'regenerate hero via companion — visual identity (hand-drawn)';
  if (target === 'icon') return 'regenerate avatar via companion — visual identity (hand-drawn)';
  return 'regenerate hero + icon via companion — visual identity (hand-drawn)';
}

// Stub health — these board posts are hand-written by Node (no LLM call), so the
// validator's stub-health path applies (only score + model required). `model` is
// the render model that produced the artifact.
function stubHealth(note) {
  return {
    score: 'green',
    model: RENDER_MODEL,
    _orchestrator_metadata: { dispatch_mode: 'hand-authored', note },
  };
}

/**
 * The BROADCAST posted when a render STARTS — the window shows a persistent
 * "rendering…" row until the done/failed PROOF lands. Pure + validated before append.
 */
export function buildRegenStartedMessage({ title, entryPath, turnId, target, idiom, note, ts, id }) {
  const slug = slugify(title);
  return {
    schema_version: '1.0',
    id: id || `${slug}-regen-started-${turnId}`,
    ts,
    session_id: MAKER_SESSION,
    from: MAKER_FROM,
    to: '*',
    type: 'BROADCAST',
    board: 'GENERAL',
    health: stubHealth('Hero and Avatar Maker render started (RunPod FLUX). Hand-written board post.'),
    payload: {
      kind: 'companion_regen_started',
      entry: title,
      entry_path: entryPath,
      turn_id: turnId,
      in_reply_to: turnId,
      target: target || 'both',
      ...(idiom ? { idiom } : {}),
      ...(note ? { note } : {}),
    },
  };
}

/**
 * The PROOF posted when a render COMMITTED — carries the commit hash (the proof
 * the new face is real) and the placed image paths the window previews + offers
 * [undo] on. Pure + validated before append.
 */
export function buildRegenDoneMessage({ title, entryPath, turnId, target, commit, heroRel, iconRel, idiom, summary, ts, id }) {
  const slug = slugify(title);
  return {
    schema_version: '1.0',
    id: id || `${slug}-regen-done-${turnId}`,
    ts,
    session_id: MAKER_SESSION,
    from: MAKER_FROM,
    to: '*',
    type: 'PROOF',
    board: 'GENERAL',
    health: stubHealth('Hero and Avatar Maker render committed to the live palace. Hand-written board post.'),
    payload: {
      kind: 'companion_regen_done',
      entry: title,
      entry_path: entryPath,
      turn_id: turnId,
      target: target || 'both',
      commit,
      ...(heroRel ? { hero_rel: heroRel } : {}),
      ...(iconRel ? { icon_rel: iconRel } : {}),
      ...(idiom ? { idiom } : {}),
      summary: summary || regenSummary(target),
      status: 'committed',
    },
  };
}

/**
 * The BROADCAST posted when a render FAILS (or could not commit) — the window
 * drops the progress row and shows the honest error. Pure + validated.
 */
export function buildRegenFailedMessage({ title, entryPath, turnId, target, error, ts, id }) {
  const slug = slugify(title);
  return {
    schema_version: '1.0',
    id: id || `${slug}-regen-failed-${turnId}`,
    ts,
    session_id: MAKER_SESSION,
    from: MAKER_FROM,
    to: '*',
    type: 'BROADCAST',
    board: 'GENERAL',
    health: stubHealth('Hero and Avatar Maker render failed. Hand-written board post.'),
    payload: {
      kind: 'companion_regen_failed',
      entry: title,
      entry_path: entryPath,
      turn_id: turnId,
      target: target || 'both',
      error: typeof error === 'string' ? error : String(error || 'render failed'),
    },
  };
}

// Pull the render script's result out of its stdout transcript. The contract is a
// single JSON object with "ok"; a capable script prints exactly that, but scan
// for the LAST balanced {...} carrying an `ok` key so stray log lines never break
// the parse. Returns the object, or null.
export function extractRenderResult(raw) {
  if (typeof raw !== 'string') return null;
  const text = raw.trim();
  if (!text) return null;
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
      if (obj && typeof obj === 'object' && 'ok' in obj) return obj;
    } catch (_) { /* try the next candidate */ }
  }
  return null;
}

// ── the lane ────────────────────────────────────────────────────────────────

/**
 * @param {object} opts
 * @param {string} opts.palaceRoot
 * @param {string} [opts.boardPath]
 * @param {string} [opts.stateDir]
 * @param {string} [opts.scriptPath]   — path to regen_one.py
 * @param {string} [opts.pythonBin]    — default 'python3'
 * @param {boolean} [opts.mock]        — pass --mock to the script (tiny PNGs, no RunPod) — tests
 * @param {(specPath:string)=>string[]} [opts.buildArgv] — stub injection (tests)
 * @returns {{ regen, status, paths }}
 */
export function createRegenLane(opts = {}) {
  const root = resolve(opts.palaceRoot ?? process.cwd());
  const boardPath = opts.boardPath ? resolve(opts.boardPath) : join(root, PERSISTENT_REL);
  const stateDir = opts.stateDir ? resolve(opts.stateDir) : join(root, DEFAULT_REGEN_STATE_DIR_REL);
  const scriptPath = opts.scriptPath ? resolve(opts.scriptPath) : join(root, DEFAULT_REGEN_SCRIPT_REL);
  const pythonBin = opts.pythonBin || 'python3';
  const mock = opts.mock === true;
  const stubArgv = typeof opts.buildArgv === 'function' ? opts.buildArgv : null;

  const transcriptsDir = join(stateDir, 'transcripts');
  const specsDir = join(stateDir, 'specs');
  const lastRunFile = join(stateDir, 'last-run.json');

  // Always pass the palace root explicitly so the script edits THIS palace
  // regardless of where it lives on disk (decouples script location from target).
  const realArgv = (specPath) => [pythonBin, scriptPath, specPath, '--palace', root, ...(mock ? ['--mock'] : [])];

  const actuator = createActuator({
    palaceRoot: root,
    stateDir,
    signature: REGEN_SIGNATURE,
    buildArgv: stubArgv || realArgv,
    onExit: reap,
  });

  function logLine(line) {
    try { appendFileSync(actuator.paths.logFile, `${line}\n`); } catch (_) { /* best effort */ }
  }
  function writeLastRun(obj) {
    try { writeFileSync(lastRunFile, JSON.stringify(obj, null, 2) + '\n'); } catch (_) { /* best effort */ }
  }
  function readLastRun() {
    try { return JSON.parse(readFileSync(lastRunFile, 'utf8')); } catch (_) { return null; }
  }
  function postIfValid(msg) {
    if (validateMessage(msg).valid) { appendMessage(boardPath, msg); return true; }
    logLine(`ERROR: regen message invalid: ${JSON.stringify(validateMessage(msg).errors)}`);
    return false;
  }
  function cleanupSpec(specPath) {
    try { if (specPath && existsSync(specPath)) unlinkSync(specPath); } catch (_) { /* ignore */ }
  }

  // The reap: the render actuator's exit handler. async, but NEVER rejects (an
  // unhandled rejection from an exit handler crashes the dev server). Parses the
  // script's result, commits the placed face on success, and posts the PROOF the
  // window swaps the progress row for.
  async function reap(ctx) {
    const meta = (ctx && ctx.meta) || {};
    const { title, entryPath, turnId, target, idiom, transcriptPath, specPath } = meta;
    try {
      let raw = '';
      try { raw = readFileSync(transcriptPath, 'utf8'); } catch (_) { raw = ''; }
      const result = extractRenderResult(raw);

      if (!result || result.ok !== true) {
        const err = (result && result.error) || 'the render produced no result';
        postIfValid(buildRegenFailedMessage({ title, entryPath, turnId, target, error: err, ts: new Date().toISOString() }));
        writeLastRun({ ok: false, turn_id: turnId, error: err, ts: new Date().toISOString() });
        cleanupSpec(specPath);
        return;
      }

      const stage = Array.isArray(result.stage) ? result.stage.filter((p) => typeof p === 'string' && p) : [];
      if (stage.length === 0) {
        postIfValid(buildRegenFailedMessage({ title, entryPath, turnId, target, error: 'render placed nothing to commit', ts: new Date().toISOString() }));
        writeLastRun({ ok: false, turn_id: turnId, error: 'nothing to commit', ts: new Date().toISOString() });
        cleanupSpec(specPath);
        return;
      }

      const summary = regenSummary(target);
      let commit;
      try {
        commit = await commitSelected(root, {
          paths: stage,
          kind: 'enrich',
          scope: title,
          summary,
          verify: 'unverified',
          author: 'claude',
        });
      } catch (e) {
        commit = { ok: false, error: e.message };
      }
      if (!commit.ok) {
        postIfValid(buildRegenFailedMessage({ title, entryPath, turnId, target, error: `commit failed: ${commit.error}`, ts: new Date().toISOString() }));
        writeLastRun({ ok: false, turn_id: turnId, error: commit.error, ts: new Date().toISOString() });
        cleanupSpec(specPath);
        return;
      }

      postIfValid(buildRegenDoneMessage({
        title, entryPath, turnId, target,
        commit: commit.shortHash,
        heroRel: result.hero_rel || null,
        iconRel: result.icon_rel || null,
        idiom,
        summary,
        ts: new Date().toISOString(),
      }));
      writeLastRun({ ok: true, turn_id: turnId, commit: commit.shortHash, target, ts: new Date().toISOString() });
      cleanupSpec(specPath);
    } catch (e) {
      logLine(`ERROR: regen reap failed: ${e.message}`);
      try {
        postIfValid(buildRegenFailedMessage({ title, entryPath, turnId, target, error: e.message, ts: new Date().toISOString() }));
      } catch (_) { /* swallow — never throw from an exit handler */ }
      writeLastRun({ ok: false, turn_id: turnId, error: e.message });
    }
  }

  /**
   * Fire one render. Refuses (busy) while a render is alive (scar #4). Writes the
   * single-entry spec, posts the started BROADCAST, and fires the render actuator.
   * Synchronous (fire returns after spawn); the done/failed PROOF arrives later
   * from reap. Never throws — returns a structured result.
   * @param {{ path:string, target?:string, idiom?:string, heroPrompt?:string,
   *           iconPrompt?:string, note?:string, turnId?:string }} args
   */
  function regen({ path, target = 'both', idiom = '', heroPrompt = '', iconPrompt = '', note = '', turnId } = {}) {
    if (typeof path !== 'string' || path.trim() === '') return { ok: false, fired: false, msg: 'missing entry path' };
    const entry = readEntry(root, path);
    if (!entry) return { ok: false, fired: false, msg: 'entry not found or excluded' };
    const title = entry.title;
    const entryPath = entry.path;
    const tgt = ['both', 'hero', 'icon'].includes(target) ? target : 'both';
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const tid = (typeof turnId === 'string' && turnId.trim()) ? turnId.trim() : `regen-${slugify(title)}-${stamp}`;

    if (actuator.isAlive().running) {
      return { ok: false, fired: false, busy: true, turnId: tid, msg: 'a render is already running' };
    }

    // Write the spec the render script reads.
    const spec = {
      title, path: entryPath, target: tgt,
      idiom: idiom || '',
      hero_prompt: (tgt === 'both' || tgt === 'hero') ? (heroPrompt || '') : '',
      icon_prompt: (tgt === 'both' || tgt === 'icon') ? (iconPrompt || '') : '',
    };
    let specPath;
    try {
      mkdirSync(specsDir, { recursive: true });
      specPath = join(specsDir, `${tid}.json`);
      writeFileSync(specPath, JSON.stringify(spec, null, 2));
    } catch (e) {
      return { ok: false, fired: false, turnId: tid, msg: `could not write spec: ${e.message}` };
    }

    const transcriptPath = join(transcriptsDir, `${tid}.out`);
    const r = actuator.fire(specPath, {
      transcriptPath,
      meta: { title, entryPath, turnId: tid, target: tgt, idiom, specPath, transcriptPath },
    });
    if (!r.fired) {
      // Spawn failed — post the failure so the window never hangs on a started
      // row that never resolves (we have NOT posted started yet, so post failed).
      postIfValid(buildRegenFailedMessage({ title, entryPath, turnId: tid, target: tgt, error: r.msg, ts: new Date().toISOString() }));
      cleanupSpec(specPath);
      return { ok: false, fired: false, busy: /already running/.test(r.msg), turnId: tid, msg: r.msg };
    }
    // Fired — now post the started row (synchronously, before the async reap).
    postIfValid(buildRegenStartedMessage({ title, entryPath, turnId: tid, target: tgt, idiom, note, ts: new Date().toISOString() }));
    return { ok: true, fired: true, turnId: tid, msg: r.msg };
  }

  function status() {
    return { ...actuator.status(), last_run: readLastRun() };
  }

  return {
    regen,
    status,
    paths: {
      stateDir, transcriptsDir, specsDir, lastRunFile, boardPath, scriptPath,
      logFile: actuator.paths.logFile, pidFile: actuator.paths.pidFile,
    },
  };
}
