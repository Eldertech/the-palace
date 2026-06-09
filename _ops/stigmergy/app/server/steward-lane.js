// steward-lane.js -- the bridge that lets the BBS board ADVANCE a permanent
// steward by one cycle, converging the Enrichment "board-as-actuator" pattern
// with the palace-orchestrator's permanent-steward cycle.
//
// The flow per cycle:
//   1. resolve the steward's agent dir via REGISTRY.json,
//   2. capture iteration/cycleN/tsNow from state.json BEFORE firing (processCycle
//      overwrites state.iteration),
//   3. assemble the cycle prompt with the orchestrator's buildCyclePrompt (its
//      board slice already contains the TRICKSTER grants -- the worker just sees
//      and acts on them),
//   4. fire a headless `claude -p ... --output-format stream-json` worker on a
//      dedicated lane, capturing its stdout to a per-cycle transcript file,
//   5. on the worker's exit, REAP: run the orchestrator's processCycle against
//      that transcript (strict §2.2 validate -> append -> reconcile
//      pending_requests -> write state.json + history.jsonl).
//
// A separate state dir (`.actuator-steward/`) keeps steward cycles off the
// Enrichment lane; the single-global-worker scar keeps stewards serial (correct
// -- they share one board). A small in-memory FIFO queue gives batch advance:
// the reap fires the next queued steward.
//
// The orchestrator modules import with ZERO new deps (Node built-ins + the
// shared @stigmergy/core substrate). The old back-edge -- posting.js reaching
// into this app's server/validator.js -- is gone: the strict §2.2 validator now
// lives in @stigmergy/core/schema, so app -> orchestrator is a one-way edge
// (cycle helpers only), not a circular dependency.

import { existsSync, readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { resolve, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createActuator } from './actuator.js';
import { buildCyclePrompt } from '../../orchestrator/src/build-cycle-prompt.js';
import { processCycle, reconcilePendingRequests } from '../../orchestrator/src/process-cycle.js';
import { readRegistry, findAgent } from '../../orchestrator/src/registry.js';
import { readEntryMeta } from '../../orchestrator/src/entry-frontmatter.js';
import { readJsonl } from '@stigmergy/core/blackboard';

const DEFAULT_REGISTRY_REL = '_ops/agents/permanent/REGISTRY.json';
const DEFAULT_STATE_DIR_REL = '_ops/stigmergy/.actuator-steward';
const PERSISTENT_REL = '_ops/swarm/persistent/blackboard.jsonl';
const FALLBACK_MODEL = 'claude-opus-4-7';

// The steward-cycle prompt templates are part of the CODEBASE, not the palace
// data dir. Resolve them from this module's location (palace/_ops/stigmergy/
// app/server/) so the prompt assembles correctly even when palaceRoot is a temp
// dir under test. buildCyclePrompt's default (skillRoot = palaceRoot/.claude…)
// would otherwise miss the templates.
const SKILL_ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../../.claude/skills/palace-orchestrator');

// ── pure helpers (exported for unit tests) ──────────────────────────────────

/** Filesystem-safe steward slug from its agent dir (the dir basename). */
export function slugFromDir(dir) {
  return basename(String(dir == null ? '' : dir));
}

/** Per-cycle transcript filename. The ts is colon/dot-sanitized for the FS. */
export function transcriptNameFor(slug, cycleN, tsIso) {
  const safeTs = String(tsIso).replace(/[:.]/g, '-');
  return `${slug}-cycle-${cycleN}-${safeTs}.jsonl`;
}

/** The real (non-stub) worker argv: a headless stream-json claude cycle. */
export function stewardArgv(prompt, model) {
  return [
    'claude', '-p', prompt,
    '--model', model || FALLBACK_MODEL,
    '--output-format', 'stream-json',
    '--verbose',
    '--permission-mode', 'bypassPermissions',
  ];
}

/**
 * Count of grants WAITING to be consumed for one steward: grants that answer one
 * of this steward's asks and landed on the board AFTER its `last_read_cursor` —
 * i.e. not yet read. The board is append-only, so array index == chronological
 * order, and processCycle advances the cursor each cycle, so this drops to 0 once
 * a cycle reads past the grants -- the precise "ready to advance" signal.
 * (Reconcile alone never drops to 0: the ask+grant live on the board forever.)
 *
 * After the Bundle-Local Stewardship SSOT cutover, state.json no longer records
 * consumed decisions (the old `resolved_requests` array is gone), so the cursor —
 * not a stored array — is the consumed boundary. A null/absent cursor (never
 * cycled) means nothing is consumed yet: every answered ask counts.
 */
export function grantsWaitingFor(board, home, state) {
  const { nowResolved } = reconcilePendingRequests(board, home);
  if (!nowResolved.length) return 0;
  // A grant is "waiting" if it landed AFTER the steward last ran (`last_active`).
  // last_active advances every cycle (regardless of what the steward posts), so
  // once a cycle runs past a grant it stops counting -- the faithful board-native
  // reconstruction of the old "answered but not in resolved_requests" signal now
  // that state no longer stores consumed decisions. Never-cycled (null
  // last_active) means nothing is consumed yet: every answered ask counts. An
  // unknown grant timestamp counts too (safe over-report, never silent drop).
  const lastActiveMs = state.last_active ? Date.parse(state.last_active) : NaN;
  if (Number.isNaN(lastActiveMs)) return nowResolved.length;
  return nowResolved.filter((r) => {
    const ts = r.resolved_at ? Date.parse(r.resolved_at) : NaN;
    return Number.isNaN(ts) || ts > lastActiveMs;
  }).length;
}

/**
 * Map a registry entry + its on-disk state to a UI row (or a `missing` stub).
 * Post-SSOT-cutover: stage is read LIVE from the entry frontmatter (the single
 * source of truth), and open-asks / grants-waiting are board-derived — state.json
 * carries only pure runtime (iteration, cursor, health). `palaceRoot` enables the
 * live stage read; without it (pure-helper callers) it falls back to the
 * manifest's immutable spawn snapshot.
 */
export function stewardRow({ entry, state, manifest, board, palaceRoot }) {
  if (!state || !manifest) {
    return { agent_id: entry.agent_id, home: entry.home, dir: entry.dir, missing: true };
  }
  const liveStage = (palaceRoot ? readEntryMeta(palaceRoot, entry.home)?.stage : undefined)
    ?? manifest.stewardship?.stage_at_spawn
    ?? null;
  // Open (un-granted) asks are board-derived; grants-waiting is the cursor-based
  // count above. The two are orthogonal: an ask is either still open OR granted
  // and waiting to be consumed.
  const { stillPending } = reconcilePendingRequests(board, entry.home);
  return {
    agent_id: entry.agent_id,
    home: entry.home,
    dir: entry.dir,
    stage: liveStage,
    iteration: Number.isFinite(state.iteration) ? state.iteration : 0,
    last_active: state.last_active ?? null,
    pending_count: stillPending.length,
    grants_waiting: grantsWaitingFor(board, entry.home, state),
    health: state.health?.score ?? null,
    model: manifest.model?.name ?? null,
  };
}

// ── the lane ────────────────────────────────────────────────────────────────

/**
 * Create a steward lane bound to a palace root.
 *
 * @param {object} opts
 * @param {string} opts.palaceRoot
 * @param {string} [opts.registryPath]
 * @param {string} [opts.stateDir]   — the lane's actuator state dir
 * @param {string} [opts.boardPath]  — the persistent blackboard
 * @param {(prompt:string)=>string[]} [opts.buildArgv] — stub injection; when set,
 *        the lane fires this instead of the real `claude -p` argv (tests).
 * @returns {{ list, advance, advanceAll, status, paths }}
 */
export function createStewardLane(opts = {}) {
  const root = resolve(opts.palaceRoot ?? process.cwd());
  const registryPath = opts.registryPath ? resolve(opts.registryPath) : join(root, DEFAULT_REGISTRY_REL);
  const stateDir = opts.stateDir ? resolve(opts.stateDir) : join(root, DEFAULT_STATE_DIR_REL);
  const boardPath = opts.boardPath ? resolve(opts.boardPath) : join(root, PERSISTENT_REL);
  const stubArgv = typeof opts.buildArgv === 'function' ? opts.buildArgv : null;

  const transcriptsDir = join(stateDir, 'transcripts');
  const lastCycleFile = join(stateDir, 'last-cycle.json');

  // dryReap: fire + exit + status, but DO NOT run processCycle. The stub gate
  // on the live dev server sets this so an e2e fire never mutates the real
  // palace (state.json / blackboard). The integration test, which wants the
  // genuine consume, uses a temp palace with dryReap off.
  const dryReap = opts.dryReap === true;

  // Per-fire model, read by the real argv builder. Race-free: scar #4 admits
  // at most one in-flight worker, and `advance`/the reap set this synchronously
  // immediately before each `fire`.
  let pendingModel = FALLBACK_MODEL;

  // Batch state (in-memory; lost on server restart -- acceptable for v1).
  let queue = [];
  let batch = { total: 0, done: 0 };
  let current = null;

  const realArgv = (prompt) => stewardArgv(prompt, pendingModel);

  const actuator = createActuator({
    palaceRoot: root,
    stateDir,
    buildArgv: stubArgv || realArgv,
    onExit: reap,
  });

  function logLine(line) {
    try { appendFileSync(actuator.paths.logFile, `${line}\n`); } catch (_) { /* best effort */ }
  }

  function writeLastCycle(obj) {
    try { writeFileSync(lastCycleFile, JSON.stringify(obj, null, 2) + '\n'); } catch (_) { /* best effort */ }
  }

  function readLastCycle() {
    try { return JSON.parse(readFileSync(lastCycleFile, 'utf8')); } catch (_) { return null; }
  }

  function readJson(path) {
    return JSON.parse(readFileSync(path, 'utf8'));
  }

  // The reap: runs in the worker's exit handler (after pid cleanup). Wrapped so
  // a throw can never escape into the exit handler -- that would crash Vite.
  function reap(ctx) {
    const meta = ctx && ctx.meta;
    try {
      if (dryReap) {
        writeLastCycle({ ok: true, stub: true, name: meta && meta.home, cycle_n: meta && meta.cycleN, ts: meta && meta.tsNow });
        return;
      }
      if (!meta || !meta.transcriptPath) throw new Error('reap: missing fire metadata');
      const summary = processCycle({
        palaceRoot: root,
        transcriptPath: meta.transcriptPath,
        agentDir: meta.agentDir,
        cycleN: meta.cycleN,
        iteration: meta.cycleN,        // state.iteration := cycleN (matches the orchestrator)
        tsNow: meta.tsNow,
        dispatchedBy: 'bbs-actuator',
        boardPath,
      });
      writeLastCycle({ ok: true, name: meta.home, cycle_n: meta.cycleN, ts: meta.tsNow, ...summary });
    } catch (e) {
      logLine(`ERROR: steward reap failed: ${e.message}`);
      writeLastCycle({ ok: false, name: meta && meta.home, error: e.message, ts: meta && meta.tsNow });
    } finally {
      drainQueue();
    }
  }

  // Advance the batch: count the finished cycle, then fire the next queued one.
  function drainQueue() {
    if (batch.total > 0 && batch.done < batch.total) batch.done += 1;
    current = null;
    if (queue.length > 0) {
      const next = queue.shift();
      fireOne(next);
    } else if (batch.total > 0 && batch.done >= batch.total) {
      // batch complete -- leave totals for status() to report, reset queue.
      queue = [];
    }
  }

  // Resolve, build the prompt, and fire ONE steward cycle. Returns a structured
  // result; never throws.
  function fireOne(name) {
    let registry;
    try { registry = readRegistry(registryPath); } catch (e) {
      return { ok: false, fired: false, found: false, msg: `registry unreadable: ${e.message}`, name };
    }
    const entry = findAgent(registry, name);
    if (!entry) return { ok: false, fired: false, found: false, msg: `unknown steward "${name}"`, name };

    const agentDirAbs = resolve(root, entry.dir); // resolve() leaves absolute dirs untouched
    let state, manifest;
    try {
      state = readJson(join(agentDirAbs, 'state.json'));
      manifest = readJson(join(agentDirAbs, 'manifest.json'));
    } catch (e) {
      return { ok: false, fired: false, found: true, msg: `steward state/manifest unreadable: ${e.message}`, name };
    }

    const iteration = Number.isFinite(state.iteration) ? state.iteration : 0;
    const cycleN = iteration + 1;
    const tsNow = new Date().toISOString();
    const model = manifest.model?.name || FALLBACK_MODEL;

    let prompt;
    try {
      ({ full: prompt } = buildCyclePrompt({
        palaceRoot: root,
        agentDir: entry.dir,
        cycleN,
        boardPath,
        skillRoot: SKILL_ROOT,
        today: tsNow.slice(0, 10),
      }));
    } catch (e) {
      return { ok: false, fired: false, found: true, msg: `could not build cycle prompt: ${e.message}`, name };
    }

    const transcriptPath = join(transcriptsDir, transcriptNameFor(slugFromDir(entry.dir), cycleN, tsNow));
    pendingModel = model; // read by realArgv on the very next fire (synchronous)

    const r = actuator.fire(prompt, {
      transcriptPath,
      meta: { agentDir: entry.dir, home: entry.home, cycleN, tsNow, transcriptPath, model },
    });
    current = r.fired ? name : null;
    return { ok: !!r.fired, fired: !!r.fired, found: true, msg: r.msg, name, cycle_n: cycleN, model };
  }

  // ── public surface ──

  /** Every registered steward, with its grants_waiting / pending counts. */
  function list() {
    let registry;
    try { registry = readRegistry(registryPath); } catch (_) { return []; }
    const board = existsSync(boardPath) ? readJsonl(boardPath) : [];
    const rows = [];
    for (const entry of registry.agents || []) {
      const agentDirAbs = resolve(root, entry.dir);
      let state = null, manifest = null;
      try { state = readJson(join(agentDirAbs, 'state.json')); } catch (_) { /* missing */ }
      try { manifest = readJson(join(agentDirAbs, 'manifest.json')); } catch (_) { /* missing */ }
      rows.push(stewardRow({ entry, state, manifest, board, palaceRoot: root }));
    }
    return rows;
  }

  /** Names of stewards with at least one grant waiting (the default batch set). */
  function readyNames() {
    return list().filter((r) => !r.missing && r.grants_waiting > 0).map((r) => r.agent_id);
  }

  /** Advance one steward by a cycle. Refuses (busy) if a worker is alive. */
  function advance({ name } = {}) {
    if (typeof name !== 'string' || name.trim() === '') {
      return { ok: false, fired: false, found: false, msg: 'missing steward name' };
    }
    if (actuator.isAlive().running) {
      return { ok: false, fired: false, busy: true, msg: 'a steward cycle is already running' };
    }
    // Not part of a batch: clear batch state so status() reads cleanly.
    queue = [];
    batch = { total: 0, done: 0 };
    return fireOne(name);
  }

  /** Advance every ready steward serially (or an explicit `names` list). */
  function advanceAll({ names } = {}) {
    if (actuator.isAlive().running) {
      return { ok: false, busy: true, msg: 'a steward cycle is already running', ...status() };
    }
    const targets = Array.isArray(names) && names.length ? names.slice() : readyNames();
    if (targets.length === 0) {
      return { ok: true, queued: [], msg: 'no stewards have grants waiting', ...status() };
    }
    queue = targets.slice();
    batch = { total: targets.length, done: 0 };
    const first = queue.shift();
    const r = fireOne(first);
    return { ok: r.ok, queued: targets, first: r, ...status() };
  }

  /** Lane + actuator status, including batch progress and the last reap summary. */
  function status() {
    const a = actuator.status();
    return {
      ...a,
      current,
      queue: queue.slice(),
      batch: { total: batch.total, done: batch.done, remaining: queue.length },
      last_cycle: readLastCycle(),
    };
  }

  return {
    list,
    readyNames,
    advance,
    advanceAll,
    status,
    paths: {
      stateDir, transcriptsDir, lastCycleFile, registryPath, boardPath,
      logFile: actuator.paths.logFile, pidFile: actuator.paths.pidFile,
    },
  };
}
