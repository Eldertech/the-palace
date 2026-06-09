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
import { assembleGrounding, assembleGroundingByTitle } from '../src/lib/entry-grounding.js';
import { buildCompanionPrompt } from './companion-prompt.js';
import { armedWriteEntry, revertCommit, previewEdit } from './armed-write.js';
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
 * JSON object {"reply":"...","edit"?:{...},"action"?:{...}}, but a capable model
 * may wrap it; so we scan for the LAST balanced {...} that parses with a string
 * `reply`, an `edit`, or an `action`, and fall back to the raw text (fence-
 * stripped) as the reply so the user always sees something. `edit` is the entry
 * in-place edit channel; `action` is the sibling channel for the non-entry
 * capabilities (flag now; commit later). Returns { reply, edit, action }.
 */
export function extractResult(raw) {
  if (typeof raw !== 'string') return { reply: '', edit: null, action: null };
  const text = raw.trim();
  if (!text) return { reply: '', edit: null, action: null };
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
      if (obj && (typeof obj.reply === 'string'
        || (obj.edit && typeof obj.edit === 'object')
        || (obj.action && typeof obj.action === 'object'))) {
        return {
          reply: typeof obj.reply === 'string' ? obj.reply : '',
          edit: obj.edit && typeof obj.edit === 'object' ? obj.edit : null,
          action: obj.action && typeof obj.action === 'object' ? obj.action : null,
        };
      }
    } catch (_) { /* try the next candidate */ }
  }
  return { reply: text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim(), edit: null, action: null };
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
 * Build the §2.2 BROADCAST a PROPOSED edit posts — the "show before editing"
 * card. Carries the op (so [approve] can send it to /apply) + the diff data the
 * window renders (vector_change for set-vector; the op itself for body edits).
 * Nothing is written yet — status 'proposed'. Pure + validated before append.
 */
export function buildEditProposalMessage({ title, entryPath, turnId, op, summary, vectorChange, model, ts, id }) {
  const slug = slugify(title);
  return {
    schema_version: '1.0',
    id: id || `${slug}-companion-proposal-${turnId}`,
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
        note: 'Companion proposed edit (awaiting approval). Path 2 stub health.',
      },
    },
    payload: {
      kind: 'companion_edit_proposed',
      entry: title,
      entry_path: entryPath,
      turn_id: turnId,
      op,                 // the exact op; [approve] sends it back to /apply
      summary: summary || `companion ${op && op.op}`,
      status: 'proposed',
      ...(vectorChange ? { vector_change: vectorChange } : {}),
    },
  };
}

/**
 * Build the §2.2 PROOF an edit posts once it is committed (to the live palace).
 * The commit hash is the proof the write is real. `branch` is optional and
 * omitted for live commits (everything is on main). Pure + validated before append.
 */
export function buildEditProofMessage({ title, entryPath, turnId, op, shortHash, branch, summary, model, ts, id, vectorChange, author }) {
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
        note: 'Companion edit committed to the live palace (approved). Path 2 stub health.',
      },
    },
    payload: {
      kind: 'companion_edit',
      entry: title,
      entry_path: entryPath,
      turn_id: turnId,
      op,
      commit: shortHash,
      summary,
      status: 'committed',
      ...(branch ? { branch } : {}),
      // A forward-vector change is never silent — carry from→to so the window
      // flags it (the standing rule: never rewrite a forward_vector quietly).
      ...(vectorChange ? { vector_change: vectorChange } : {}),
      // Branded author when it isn't the default 'claude' — the trickster
      // stratum stays visible in the window the way it does in the LOG deck.
      ...(author && author !== 'claude' ? { author } : {}),
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
        note: 'Companion edit reverted in the live palace (a new inverse commit). Path 2 stub health.',
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
      summary: summary || `revert ${reverts}`,
      status: 'reverted',
      ...(branch ? { branch } : {}),
    },
  };
}

const TODO_SEVERITIES = new Set(['idea', 'minor', 'major']);

/**
 * Build the §2.2 FLAG a captured STIGMERGY-dev to-do posts (Stage 1). A FLAG on
 * the FLAGS board with payload.kind 'stigmergy_todo' so the QUEUE renders it as
 * a to-do (distinct from palace-weave flags, which carry payload.claim /
 * source_entries). The message id IS the QUEUE item id, so a later commit can
 * retire it with Palace-Resolves. Pure + validated by core before append.
 */
export function buildTodoFlagMessage({ turnId, todo, deck, model, ts, id }) {
  const t = todo && typeof todo === 'object' ? todo : {};
  const title = typeof t.title === 'string' && t.title.trim() ? t.title.trim() : 'untitled feedback';
  const area = typeof t.area === 'string' && t.area.trim()
    ? t.area.trim().toLowerCase()
    : (deck ? String(deck).toLowerCase() : 'general');
  const severity = TODO_SEVERITIES.has(t.severity) ? t.severity : 'minor';
  return {
    schema_version: '1.0',
    id: id || `stigmergy-todo-${turnId}`,
    ts,
    session_id: 'companion-stigmergy',
    from: companionFrom('STIGMERGY'),
    to: '*',
    type: 'FLAG',
    board: 'FLAGS',
    health: {
      score: 'green',
      model: model || DEFAULT_MODEL,
      _orchestrator_metadata: {
        dispatch_mode: 'claude-code-subagent',
        note: 'Companion-captured STIGMERGY dev to-do (Stage 1). Path 2 stub health.',
      },
    },
    payload: {
      kind: 'stigmergy_todo',
      turn_id: turnId,
      title,
      detail: typeof t.detail === 'string' ? t.detail.trim() : '',
      area,
      severity,
      status: 'open',
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
  // Edits commit DIRECTLY to the live palace (`root`) — the quarantine was
  // retired 2026-06-09 in favor of show-before-editing (propose → approve).

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
      const { reply, edit, action } = extractResult(raw);
      // In-place edits reach only the entry kind. Other contexts (app_feedback,
      // and the later commit / trickster kinds) ignore any proposed `edit`; their
      // actions arrive on the `action` channel. Absent kind = legacy entry turn.
      const allowEdit = meta.kind == null || meta.kind === 'entry';
      const hasEdit = allowEdit && !!(edit && edit.op);
      // The to-do capture (Stage 1): a flag action from the app_feedback context.
      const hasFlag = meta.kind === 'app_feedback' && !!(action && action.type === 'flag');

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
      } else if (!hasEdit && !hasFlag) {
        postIfValid(buildCompanionMessage({
          title, entryPath, turnId, reply: '(the companion returned nothing)',
          model: meta.model || model, ts: new Date().toISOString(),
        }));
      }

      // 2) the edit — PROPOSED, not applied (show before editing). Preview it
      // against the LIVE entry: a clean op becomes a proposal the window renders
      // for approval (the actual commit waits for /apply); an op that can't apply
      // (find missing) or is a no-op (already in that state) gets an honest line,
      // no proposal.
      let editSummary = null;
      if (hasEdit) {
        try {
          const pv = previewEdit(root, entryPath, edit);
          if (pv.ok) {
            postIfValid(buildEditProposalMessage({
              title, entryPath, turnId, op: edit,
              summary: edit.summary || `companion ${edit.op}`,
              vectorChange: pv.vectorChange || null,
              model: meta.model || model, ts: new Date().toISOString(),
            }));
            editSummary = { ok: true, proposed: true, op: edit.op };
          } else {
            const noop = /nothing changed/i.test(pv.error || '');
            const failReply = noop
              ? "That's already in place — nothing to change (it looks like it landed in an earlier edit this session)."
              : `I can't propose that edit honestly: ${pv.error}`;
            postIfValid(buildCompanionMessage({
              title, entryPath, turnId, reply: failReply,
              model: meta.model || model, ts: new Date().toISOString(),
              id: `${slugify(title)}-companion-editfail-${turnId}`,
            }));
            editSummary = { ok: false, error: pv.error, noop };
          }
        } catch (e) {
          logLine(`ERROR: companion edit preview failed: ${e.message}`);
          // Post so the turn never hangs the window when the reply was quiet.
          postIfValid(buildCompanionMessage({
            title, entryPath, turnId, reply: `I hit an error preparing that edit: ${e.message}`,
            model: meta.model || model, ts: new Date().toISOString(),
            id: `${slugify(title)}-companion-editerr-${turnId}`,
          }));
          editSummary = { ok: false, error: e.message };
        }
      }
      // 3) the to-do capture (Stage 1): post the feedback as a FLAG/stigmergy_todo
      //    so the QUEUE renders it. The reply (above) confirms it in the window.
      let flagSummary = null;
      if (hasFlag) {
        try {
          const posted = postIfValid(buildTodoFlagMessage({
            turnId, todo: action.todo, deck: meta.deck,
            model: meta.model || model, ts: new Date().toISOString(),
          }));
          flagSummary = { ok: posted, title: action.todo && action.todo.title };
        } catch (e) {
          logLine(`ERROR: companion flag failed: ${e.message}`);
          flagSummary = { ok: false, error: e.message };
        }
      }
      writeLastTurn({ ok: true, turn_id: turnId, entry: title, edit: editSummary, flag: flagSummary, ts: new Date().toISOString() });
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
   * @param {{ context?:object, path?:string, message:string, history?:Array, focus?:string, section?:string|null }} args
   * @returns {{ ok, fired, busy?, turnId?, msg }}
   */
  function turn({ context, path, message, history = [], focus = null, section } = {}) {
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
          // null = at the top (above the first heading); undefined = no position
          // sent → the prompt omits the POSITION block entirely.
          section: typeof section === 'string' ? section : (section === null ? null : undefined),
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
      meta = { kind: 'app_feedback', entryPath: null, entryTitle: 'STIGMERGY', deck: ctx.deck || null, turnId, model };
    } else if (ctx.kind === 'trickster_request') {
      // Ground in the project behind the pending decision (its `from` title).
      // It may not resolve to an entry — then the prompt grounds in the request
      // alone. Read-only: the reap posts only a reply (no edit, no flag).
      const project = ctx.project || 'project';
      const { path, grounding } = assembleGroundingByTitle(root, project);
      turnId = `companion-trickster-${slugify(project)}-${stamp}`;
      try {
        prompt = buildCompanionPrompt({ context: ctx, grounding, message, history });
      } catch (e) {
        return { ok: false, fired: false, msg: `could not build prompt: ${e.message}` };
      }
      meta = { kind: 'trickster_request', entryPath: path || null, entryTitle: project, turnId, model };
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
   * Apply an APPROVED edit to the live entry: write + commit through the enforced
   * path (armedWriteEntry → the live palace), then post the committed PROOF the
   * window swaps the proposal for. Re-previews inside armedWriteEntry, so a stale
   * proposal that no longer applies fails honestly. Not a worker fire (a Node
   * write) so it never collides with the turn lane. async; never throws.
   * @param {{path:string, op:object, turnId?:string}} args
   */
  async function apply({ path, op, turnId } = {}) {
    if (typeof path !== 'string' || path.trim() === '') return { ok: false, msg: 'missing entry path' };
    if (!op || typeof op !== 'object' || typeof op.op !== 'string') return { ok: false, msg: 'missing edit op' };
    const entry = readEntry(root, path);
    const title = entry ? entry.title : path;
    const entryPath = entry ? entry.path : path;
    const tid = (typeof turnId === 'string' && turnId.trim())
      ? turnId.trim()
      : `companion-apply-${slugify(title)}-${new Date().toISOString().replace(/[:.]/g, '-')}`;

    let w;
    try {
      w = await armedWriteEntry({
        repoRoot: root, relPath: entryPath, op,
        summary: op.summary || `companion ${op.op}`,
        verify: 'unverified', author: 'claude',
      });
    } catch (e) {
      return { ok: false, msg: `could not apply: ${e.message}` };
    }
    if (!w.ok) return { ok: false, msg: w.error || 'apply failed', status: w.status };

    postIfValid(buildEditProofMessage({
      title, entryPath, turnId: tid, op: w.op, shortHash: w.shortHash,
      summary: op.summary || `companion ${op.op}`,
      model, ts: new Date().toISOString(), vectorChange: w.vectorChange || null,
    }));
    return { ok: true, commit: w.shortHash, op: w.op, turnId: tid, vectorChange: w.vectorChange || null };
  }

  /**
   * The TRICKSTER write: the owner's standing consent to write ANYWHERE in one
   * gesture — canon included — with no propose→approve round trip. Same enforced
   * path as apply (armedWriteEntry → commitSelected), two things inverted: the
   * CARE gate is bypassed (trickster:true → checkPathSafety only) and the commit
   * is branded `Palace-Author: trickster` + `verify: unverified` so the weird
   * stratum stays harvestable. Path-safety is NOT dropped (../, NUL, non-.md, and
   * VCS/build trees still refuse). Posts the committed PROOF the window renders as
   * an edit marker whose [undo] IS "untrick last". async; never throws.
   *
   * Distinct from the `trickster_request` context kind (the human-decision flow);
   * this is the write capability. See [[Trickster Commit]].
   * @param {{path:string, op:object, summary?:string, turnId?:string}} args
   */
  async function trickster({ path, op, summary, turnId } = {}) {
    if (typeof path !== 'string' || path.trim() === '') return { ok: false, msg: 'missing entry path' };
    if (!op || typeof op !== 'object' || typeof op.op !== 'string') return { ok: false, msg: 'missing edit op' };
    // The target may be canon (excluded from the entry index) — fall back to the
    // raw path for identity rather than refusing to name it.
    const entry = readEntry(root, path);
    const title = entry ? entry.title : path.slice(path.lastIndexOf('/') + 1).replace(/\.md$/, '');
    const entryPath = entry ? entry.path : path;
    const tid = (typeof turnId === 'string' && turnId.trim())
      ? turnId.trim()
      : `companion-trick-${slugify(title)}-${new Date().toISOString().replace(/[:.]/g, '-')}`;
    const subject = (typeof summary === 'string' && summary.trim())
      ? summary.trim()
      : (op.summary || `trickster ${op.op}`);

    let w;
    try {
      w = await armedWriteEntry({
        repoRoot: root, relPath: entryPath, op,
        summary: subject, verify: 'unverified', author: 'trickster', trickster: true,
      });
    } catch (e) {
      return { ok: false, msg: `could not trick: ${e.message}` };
    }
    if (!w.ok) return { ok: false, msg: w.error || 'trickster write failed', status: w.status };

    postIfValid(buildEditProofMessage({
      title, entryPath, turnId: tid, op: w.op, shortHash: w.shortHash,
      summary: subject, author: 'trickster',
      model, ts: new Date().toISOString(), vectorChange: w.vectorChange || null,
    }));
    return { ok: true, commit: w.shortHash, op: w.op, turnId: tid, vectorChange: w.vectorChange || null };
  }

  /**
   * Undo a committed Companion edit: revert its commit in the live palace (a new
   * inverse commit) and post a revert PROOF on the same turn so the window can
   * mark it reverted. Honest by construction — never a silent rollback. async;
   * never throws (returns a structured result).
   * @param {{path?:string, commit:string, turnId?:string}} args
   */
  async function undo({ path, commit, turnId } = {}) {
    if (typeof commit !== 'string' || commit.trim() === '') {
      return { ok: false, msg: 'missing commit' };
    }
    const entry = typeof path === 'string' && path.trim() ? readEntry(root, path) : null;
    const title = entry ? entry.title : (path || 'entry');
    const entryPath = entry ? entry.path : (path || '');

    const r = await revertCommit({ repoRoot: root, hash: commit.trim() });
    if (!r.ok) return { ok: false, msg: r.error };

    const tid = (typeof turnId === 'string' && turnId.trim()) ? turnId.trim() : `companion-undo-${slugify(title)}`;
    postIfValid(buildRevertProofMessage({
      title, entryPath, turnId: tid, reverts: commit.trim(), revertHash: r.revertHash,
      summary: r.subject, model, ts: new Date().toISOString(),
    }));
    return { ok: true, revertHash: r.revertHash, reverts: commit.trim(), turnId: tid };
  }

  function status() {
    return { ...actuator.status(), last_turn: readLastTurn() };
  }

  return {
    turn,
    apply,
    trickster,
    undo,
    status,
    paths: {
      stateDir, transcriptsDir, lastTurnFile, boardPath,
      logFile: actuator.paths.logFile, pidFile: actuator.paths.pidFile,
    },
  };
}
