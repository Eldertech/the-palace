// process-cycle.js — per-cycle post-processor for a permanent-steward dispatch.
// (Invoked via `node <file>`; no shebang so it bundles cleanly when the app
// server imports it through vite/esbuild — esbuild does not strip shebangs.)
//
// Given the JSONL transcript of a single subagent cycle, this:
//   1. extracts the fenced `json` BBS messages the steward emitted,
//   2. stamps each with the Path-2 health stub,
//   3. validates via the canonical posting surface and appends the valid ones
//      to the persistent blackboard,
//   4. reconciles the steward's pending_requests against the board (resolving
//      asks that have since been GRANT/DENY'd), and
//   5. updates state.json + history.jsonl.
//
// Promoted from /tmp/process-cycle-v2.mjs (the 2026-05-27 batch finalizer).
// Two changes from that throwaway: the palace root is configurable (no
// hardcoded absolute path), and transcript extraction is pure JS — the old
// version shelled out to an embedded python3 program, which made it both
// fragile and untestable. Extraction now lives in extractMessagesFromTranscript
// and reconciliation in reconcilePendingRequests; both are pure and unit-tested.

import { readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { resolve, join, basename } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { buildHealthBlock } from './health.js';
import { validateForPosting } from '@stigmergy/core/schema';
import { appendMessage, readJsonl } from '@stigmergy/core/blackboard';
import { scanBundleMedia, applyArtifactBackstop, lintArtifactReferences } from './artifact-backstop.js';

const PALACE_ROOT_DEFAULT = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../..');

// The §2.2 message types a steward may emit. Anything fenced that is not one of
// these is prose-with-braces, not a message, and is ignored.
const MESSAGE_TYPES = new Set([
  'BROADCAST', 'FLAG', 'REPLY', 'PROOF', 'RESOURCE_REQUEST', 'RESOURCE_GRANT',
  'RESOURCE_DENY', 'QUERY', 'SESSION_INIT', 'SESSION_CLOSE', 'PAGE_UPDATE', 'HEALTH_NOTICE',
]);

// Matches a ```json … ``` (or bare ``` … ```) fence whose body is a single JSON
// object. The trailing fence anchors the non-greedy `{…}` so nested braces are
// captured correctly (the body expands to the last `}` before the closing fence).
const FENCE_RE = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/g;

/**
 * Parse a Claude Code subagent transcript (JSONL) into the BBS messages the
 * steward emitted plus a usage summary.
 *
 * Only `assistant` records contribute. Text blocks are scanned for fenced JSON
 * objects whose `type` is a known message type. Messages are de-duplicated by
 * `id` (last occurrence wins); a fenced object without an `id` is dropped —
 * it would fail §2.2 validation anyway.
 *
 * @param {string} transcriptText — full transcript file contents
 * @returns {{ messages: object[], usage: object }}
 */
export function extractMessagesFromTranscript(transcriptText) {
  const texts = [];
  const usage = {
    n_assistant_turns: 0,
    total_input_tokens: 0,
    total_output_tokens: 0,
    cache_read_input_tokens_sum: 0,
    cache_creation_input_tokens_sum: 0,
  };

  for (const rawLine of String(transcriptText).split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;
    let rec;
    try { rec = JSON.parse(line); } catch { continue; }
    if (!rec || rec.type !== 'assistant') continue;

    const msg = rec.message || {};
    usage.n_assistant_turns += 1;
    const u = msg.usage || {};
    usage.total_input_tokens += u.input_tokens || 0;
    usage.total_output_tokens += u.output_tokens || 0;
    usage.cache_read_input_tokens_sum += u.cache_read_input_tokens || 0;
    usage.cache_creation_input_tokens_sum += u.cache_creation_input_tokens || 0;

    for (const b of (msg.content || [])) {
      if (b && b.type === 'text' && typeof b.text === 'string' && b.text.trim()) {
        texts.push(b.text);
      }
    }
  }

  const seen = new Map();
  for (const t of texts) {
    FENCE_RE.lastIndex = 0;
    let m;
    while ((m = FENCE_RE.exec(t)) !== null) {
      let obj;
      try { obj = JSON.parse(m[1]); } catch { continue; }
      if (obj && typeof obj === 'object' && !Array.isArray(obj) && MESSAGE_TYPES.has(obj.type) && obj.id) {
        seen.set(obj.id, obj);
      }
    }
  }

  return { messages: [...seen.values()], usage };
}

/**
 * Reconcile a steward's RESOURCE_REQUESTs against the whole board.
 *
 * An ask is resolved iff a RESOURCE_GRANT/RESOURCE_DENY exists whose top-level
 * `re` equals the ask's `request_id`. Returns the two partitions in the shape
 * state.json stores (pending_requests / resolved_requests entries).
 *
 * @param {object[]} board — every message on the board
 * @param {string} home — the steward's agent_id / page title (the `from` field)
 * @returns {{ stillPending: object[], nowResolved: object[] }}
 */
export function reconcilePendingRequests(board, home) {
  const myAsks = board.filter(
    (m) => m && m.type === 'RESOURCE_REQUEST' && m.from === home && m.board === 'TRICKSTER'
  );
  const responses = new Map();
  for (const m of board) {
    if (m && (m.type === 'RESOURCE_GRANT' || m.type === 'RESOURCE_DENY') && m.re) {
      responses.set(m.re, m);
    }
  }

  const stillPending = [];
  const nowResolved = [];
  for (const ask of myAsks) {
    const reqId = ask.request_id || ask.id;
    const askEntry = {
      request_id: reqId,
      resource: ask.payload?.resource,
      decision_topic: ask.payload?.decision_topic || ask.payload?.subject,
      blocking: ask.payload?.blocking === true,
      posted_at: ask.ts,
    };
    const opts = ask.payload?.options ?? ask.options;
    if (Array.isArray(opts)) {
      askEntry.options = opts.map((o) => (typeof o === 'string' ? o : o.id || o.label || String(o)));
    }
    if (ask.payload?.steward_recommendation) askEntry.steward_recommendation = ask.payload.steward_recommendation;
    if (ask.payload?.next_cycle_action_if_granted) askEntry.next_cycle_action_if_granted = ask.payload.next_cycle_action_if_granted;

    const resp = responses.get(reqId);
    if (resp) {
      askEntry.resolved_at = resp.ts;
      askEntry.resolved_by = resp.id;
      const oid = resp.payload?.option_id;
      const notes = resp.payload?.notes;
      askEntry.outcome = `${resp.type === 'RESOURCE_GRANT' ? 'GRANTED' : 'DENIED'}`
        + `${oid ? ` — option_id=${oid}` : ' — (no option_id)'}`
        + `${notes ? `; notes: "${notes}"` : ''}`;
      nowResolved.push(askEntry);
    } else {
      stillPending.push(askEntry);
    }
  }

  return { stillPending, nowResolved };
}

/**
 * Build the health-block note string for a Path-2 dispatch. The token figures
 * are telemetry only — buildHealthBlock ignores them and stamps the green stub
 * (see health.js / Infrastructure Spec §3.3.1).
 */
export function buildCycleNote(usage, leaf, cycleN) {
  const turns = Math.max(1, usage.n_assistant_turns || 0);
  const avgCache = Math.round((usage.cache_read_input_tokens_sum || 0) / turns);
  return `${leaf} cycle ${cycleN} — ${turns} assistant turn(s); `
    + `cumulative output tokens ${usage.total_output_tokens || 0}, avg cache_read/turn ${avgCache}. `
    + `Path 2 (claude-code-subagent): token-level metrics are not authoritatively tracked; see Infrastructure Spec §3.3.1.`;
}

/**
 * Run the full post-processing for one steward cycle. Writes to the board,
 * state.json and history.jsonl. See the module header for the steps.
 *
 * @param {object} opts
 * @returns {object} summary { posted_ids, valid_count, invalid_ids, errors, pending_after, resolved_count_after }
 */
export function processCycle(opts) {
  const {
    palaceRoot = PALACE_ROOT_DEFAULT,
    transcriptPath,
    agentDir,
    cycleN,
    iteration,
    tsNow,
    model: modelOverride,
    cycleNotesKey,
    cycleNotes,
    dispatchedBy = 'palace-orchestrator',
    boardPath,
    enableArtifactBackstop = true,
  } = opts;

  if (!transcriptPath) throw new Error('processCycle: transcriptPath is required');
  if (!agentDir) throw new Error('processCycle: agentDir is required');

  const agentDirAbs = resolve(palaceRoot, agentDir);
  const boardFile = boardPath
    ? resolve(boardPath)
    : resolve(palaceRoot, '_ops/swarm/persistent/blackboard.jsonl');

  const transcriptText = readFileSync(resolve(transcriptPath), 'utf8');
  const { messages, usage } = extractMessagesFromTranscript(transcriptText);

  const state = JSON.parse(readFileSync(join(agentDirAbs, 'state.json'), 'utf8'));
  const manifest = JSON.parse(readFileSync(join(agentDirAbs, 'manifest.json'), 'utf8'));
  const home = manifest.home;
  const model = modelOverride || manifest.model?.name || 'claude-opus-4-7';

  const health = buildHealthBlock({ model, note: buildCycleNote(usage, basename(agentDirAbs), cycleN) });

  // ── Layer 2: inline-asset backstop ───────────────────────────────────────
  // Guarantee every media file the steward rendered THIS cycle reaches its
  // RESOURCE_REQUEST card even if the steward forgot to declare it. Scans the
  // project bundle (Projects/<home>/) and the entry bundle (<home>/) for media
  // modified in the window (previous cycle, this cycle] and injects anything
  // undeclared. `state.last_active` here is still the PREVIOUS cycle's stamp
  // (it is overwritten to tsNow further down), which is exactly the lower
  // bound we want. First cycles (last_active null) no-op. See artifact-backstop.js.
  const windowStartMs = state.last_active ? Date.parse(state.last_active) : null;
  const windowEndMs = tsNow ? Date.parse(tsNow) : undefined;
  const mediaCandidates = enableArtifactBackstop
    ? [join('Projects', home), home].flatMap((d) => scanBundleMedia(palaceRoot, d))
    : [];
  const backstop = [];
  const messagesForBoard = messages.map((m) => {
    const res = applyArtifactBackstop(m, { candidates: mediaCandidates, windowStartMs, windowEndMs });
    if (res.reason === 'injected') {
      backstop.push({ request_id: m.request_id || m.id, added: res.added, dropped: res.dropped });
      return { ...m, payload: res.payload };
    }
    return m;
  });

  // ── Layer 3: referenced-in-prose lint (warn-only) ─────────────────────────
  // Surface (never block) any RESOURCE_REQUEST that declares artifacts whose
  // prose never refers to them, so players and words don't drift apart.
  const artifact_lint_warnings = messagesForBoard
    .map((m) => lintArtifactReferences(m))
    .filter((l) => l && l.warn);

  const valid = [];
  const invalid_ids = [];
  const errors = [];
  for (const m of messagesForBoard) {
    const withHealth = { ...m, health };
    const res = validateForPosting(withHealth);
    if (res.valid) valid.push(withHealth);
    else { invalid_ids.push(m.id); errors.push({ id: m.id, errors: res.errors }); }
  }

  const appended = [];
  for (const m of valid) {
    try {
      appendMessage(boardFile, m);
      appended.push(m.id);
    } catch (e) {
      errors.push({ id: m.id, append_error: e.message });
    }
  }

  // Reconcile against the board *after* appending this cycle's asks.
  const board = readJsonl(boardFile);
  const { stillPending, nowResolved } = reconcilePendingRequests(board, home);

  const existingResolved = new Set((state.resolved_requests || []).map((r) => r.request_id));
  state.resolved_requests = state.resolved_requests || [];
  for (const r of nowResolved) {
    if (!existingResolved.has(r.request_id)) state.resolved_requests.push(r);
  }
  state.pending_requests = stillPending;

  state.iteration = iteration;
  state.last_active = tsNow;
  state.last_read_cursor = appended[appended.length - 1] || state.last_read_cursor;
  state.health = {
    context_pct: health.context_pct ?? null,
    avg_output_tokens_last_5: null,
    duplicate_flags: 0,
    posting_discipline_violations: 0,
    max_tokens_hits: 0,
    score: health.score,
  };
  if (cycleNotesKey) {
    state._pilot_metadata = state._pilot_metadata || {};
    state._pilot_metadata[cycleNotesKey] = cycleNotes ?? '';
  }
  writeFileSync(join(agentDirAbs, 'state.json'), JSON.stringify(state, null, 2) + '\n');

  const histPath = join(agentDirAbs, 'history.jsonl');
  const events = [
    { event: `CYCLE_${cycleN}_SPAWN`, ts: tsNow, dispatched_by: dispatchedBy, model },
    ...(cycleNotes ? [{ event: 'AGENT_REASONING', ts: tsNow, summary: String(cycleNotes).slice(0, 400) }] : []),
    ...backstop.map((b) => ({ event: 'ARTIFACT_BACKSTOP', ts: tsNow, request_id: b.request_id, injected: b.added, dropped: b.dropped })),
    ...appended.map((id) => ({ event: 'TOOL_CALL', ts: tsNow, tool: 'write_blackboard', args: { message_id: id }, result: 'emitted+validated+appended' })),
    { event: 'CYCLE_COMPLETE', ts: tsNow, iteration, stop_reason: 'end_turn', posted_messages: appended, pending_after: stillPending.map((p) => p.request_id) },
  ];
  for (const e of events) appendFileSync(histPath, JSON.stringify(e) + '\n');

  return {
    posted_ids: appended,
    valid_count: valid.length,
    invalid_ids,
    errors,
    pending_after: stillPending.map((p) => p.request_id),
    resolved_count_after: state.resolved_requests.length,
    // Layer 2: which RESOURCE_REQUESTs got undeclared media injected this cycle.
    backstop,
    // Layer 3: declared-but-unreferenced artifact warnings (advisory only).
    artifact_lint_warnings,
  };
}

function main() {
  const argv = process.argv.slice(2);
  const arg = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
  const summary = processCycle({
    palaceRoot: arg('--root', PALACE_ROOT_DEFAULT),
    transcriptPath: arg('--transcript'),
    agentDir: arg('--agent-dir'),
    cycleN: parseInt(arg('--cycle-n'), 10),
    iteration: parseInt(arg('--iteration'), 10),
    tsNow: arg('--ts-now'),
    model: arg('--model'),
    cycleNotesKey: arg('--cycle-notes-key'),
    cycleNotes: arg('--cycle-notes'),
    dispatchedBy: arg('--dispatched-by', 'palace-orchestrator'),
    boardPath: arg('--board'),
  });
  process.stdout.write(JSON.stringify(summary, null, 2) + '\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
