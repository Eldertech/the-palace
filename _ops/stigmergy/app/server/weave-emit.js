// weave-emit.js — run the Weave's unsung-path audit and (optionally) post it.
//
// The server-side core behind POST /api/weave/emit-unsung — the UI counterpart
// to the CLI runner (scripts/weave-emit-unsung.mjs), so the audit runs from the
// terminal, not a shell. It reuses the SAME pure pipeline: the entry scan
// (entries.js) → the palace index + unsung-edge detector (unsung-paths.js) →
// the validated proposal planner (weave-propose.js). DRY-RUN by default; only a
// `dryRun: false` call writes, and the only write is the sanctioned
// validate-then-appendMessage path (a shell write is blocked by the classifier).
//
// Honest counts, never silent caps: the result carries found / deduped /
// eligible / planned / dropped, plus the actually-posted count on a live run.

import { existsSync } from 'node:fs';
import { walkEntryRecords, listEntries } from '../src/lib/entries.js';
import { buildPalaceIndex, findUnsungEdges } from '../src/lib/unsung-paths.js';
import { findHubCandidates } from '../src/lib/hub-candidates.js';
import { findVectorTuningCandidates } from '../src/lib/vector-tuning-candidates.js';
import { planUnsungEmission, planHubEmission, selectVectorTuningCandidates, buildVectorTuningProposal } from '../src/lib/weave-propose.js';
import { generateVectorTuning } from './weave-generate.js';
import { readJsonl, appendMessage } from '@stigmergy/core/blackboard';
import { validateMessage } from '@stigmergy/core/schema';

// Scan the palace for unsung edges (the existing pure pipeline the CLI uses).
// Returns { entriesScanned, edges } — a separate seam so a test can inject a
// fixed scan without walking a real palace.
function defaultScan(palaceRoot) {
  const records = [...walkEntryRecords(palaceRoot)];
  const index = buildPalaceIndex(records);
  const edges = findUnsungEdges(records, index);
  return { entriesScanned: records.length, edges };
}

// Validate-then-append: the only sanctioned board write. Returns whether the
// message landed so the caller can report an honest posted count.
function defaultAppend(boardPath) {
  return (msg) => {
    if (!boardPath) return false;
    if (!validateMessage(msg).valid) return false;
    appendMessage(boardPath, msg);
    return true;
  };
}

// A compact, UI-friendly view of a planned proposal (the full message lands on
// the board on a live run; the response only needs the edge + id + change).
const summarize = (m) => ({
  id: m.id,
  source: m.payload.source_entry,
  target: m.payload.target_entry,
  change: m.payload.proposed_change,
});

/**
 * Run the unsung-path audit. DRY-RUN by default — returns the honest plan
 * counts and a summary of the proposals it *would* post, writing nothing.
 * With `dryRun: false`, validates + appends each planned proposal to the board
 * and reports the actually-posted count. Never throws; returns a structured
 * result with an `ok` flag.
 *
 * @param {object} args
 * @param {string}  args.palaceRoot
 * @param {string}  [args.boardPath]  — persistent blackboard to dedup against / post to
 * @param {boolean} [args.dryRun=true]
 * @param {number}  [args.limit=8]    — max proposals to emit (over-limit are dropped, counted)
 * @param {string}  [args.ts]
 * @param {Function}[args.scanImpl]   — test seam: (palaceRoot) => { entriesScanned, edges }
 * @param {Function}[args.appendImpl] — test seam: (msg) => boolean
 * @returns {Promise<{ok, status?, error?, dryRun, limit, entriesScanned, found, deduped, eligible, planned, dropped, posted?, skipped?, proposals}>}
 */
export async function runUnsungEmission({
  palaceRoot, boardPath, dryRun = true, limit = 8, ts, scanImpl, appendImpl,
} = {}) {
  if (!palaceRoot) return { ok: false, status: 500, error: 'no palace root configured' };

  const lim = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 8;
  const scan = scanImpl || defaultScan;
  const { entriesScanned, edges } = scan(palaceRoot);

  // Plan against the live board (idempotent dedup of open/denied pairs + cap).
  const existing = boardPath && existsSync(boardPath) ? readJsonl(boardPath) : [];
  const stamp = ts || new Date().toISOString();
  const runId = stamp.replace(/[^0-9]/g, '').slice(0, 14);
  const plan = planUnsungEmission({ edges, existing, limit: lim, ts: stamp, runId });

  const base = {
    ok: true,
    dryRun: !!dryRun,
    limit: lim,
    entriesScanned,
    found: plan.found,
    deduped: plan.deduped,
    eligible: plan.eligible,
    planned: plan.posted,   // how many proposals were BUILT (would post on a live run)
    dropped: plan.dropped,  // eligible-but-over-limit, NOT silently swallowed
    proposals: plan.proposals.map(summarize),
  };

  if (dryRun) return base;

  // Live run: validate + append each planned proposal; count what actually landed.
  const append = appendImpl || defaultAppend(boardPath);
  let posted = 0;
  const skipped = [];
  for (const m of plan.proposals) {
    let landed = false;
    try { landed = append(m); } catch { landed = false; }
    if (landed) posted++;
    else skipped.push(m.id);
  }
  return { ...base, posted, skipped };
}

// Scan the palace for hub candidates (concept entries over the inbound-degree
// threshold). Separate seam, mirroring defaultScan, so a test can inject one.
function defaultHubScan(palaceRoot, threshold) {
  const records = [...walkEntryRecords(palaceRoot)];
  const candidates = findHubCandidates(records, { threshold });
  return { entriesScanned: records.length, candidates };
}

// A promote_hub proposal is single-entry (no edge); the summary carries the
// entry + the proposed change rather than a source→target pair.
const summarizeHub = (m) => ({
  id: m.id,
  entry: m.payload.source_entry,
  change: m.payload.proposed_change,  // the inbound-degree count lives in the change text
});

/**
 * Run the hub-promotion audit — the runHubEmission counterpart of
 * runUnsungEmission, behind POST /api/weave/emit-hub. Same shape, same DRY-RUN
 * default and honest counts; the candidates are concept entries over the
 * inbound-degree threshold and each proposal carries a `set-type` (concept→hub)
 * apply op. Never throws.
 *
 * @param {object} args
 * @param {string}  args.palaceRoot
 * @param {string}  [args.boardPath]
 * @param {boolean} [args.dryRun=true]
 * @param {number}  [args.limit=8]
 * @param {number}  [args.threshold=5] — inbound-degree floor (SCHEMA §1: ≥5)
 * @param {string}  [args.ts]
 * @param {Function}[args.scanImpl]   — test seam: (palaceRoot) => { entriesScanned, candidates }
 * @param {Function}[args.appendImpl] — test seam: (msg) => boolean
 */
export async function runHubEmission({
  palaceRoot, boardPath, dryRun = true, limit = 8, threshold = 5, ts, scanImpl, appendImpl,
} = {}) {
  if (!palaceRoot) return { ok: false, status: 500, error: 'no palace root configured' };

  const lim = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 8;
  const scan = scanImpl || ((root) => defaultHubScan(root, threshold));
  const { entriesScanned, candidates } = scan(palaceRoot);

  const existing = boardPath && existsSync(boardPath) ? readJsonl(boardPath) : [];
  const stamp = ts || new Date().toISOString();
  const runId = stamp.replace(/[^0-9]/g, '').slice(0, 14);
  const plan = planHubEmission({ candidates, existing, limit: lim, ts: stamp, runId });

  const base = {
    ok: true,
    dryRun: !!dryRun,
    limit: lim,
    threshold,
    entriesScanned,
    found: plan.found,
    deduped: plan.deduped,
    eligible: plan.eligible,
    planned: plan.posted,
    dropped: plan.dropped,
    proposals: plan.proposals.map(summarizeHub),
  };

  if (dryRun) return base;

  const append = appendImpl || defaultAppend(boardPath);
  let posted = 0;
  const skipped = [];
  for (const m of plan.proposals) {
    let landed = false;
    try { landed = append(m); } catch { landed = false; }
    if (landed) posted++;
    else skipped.push(m.id);
  }
  return { ...base, posted, skipped };
}

// Scan the palace for vector-tuning candidates (entries whose forward_vector is
// missing / stasis-leaning / thin). A separate seam mirroring defaultScan.
function defaultVectorScan(palaceRoot) {
  const entries = listEntries(palaceRoot);
  const candidates = findVectorTuningCandidates(entries);
  return { entriesScanned: entries.length, candidates };
}

// On a dry run the response carries the candidate ENTRIES (none generated yet);
// on a live run it carries the posted proposal summaries.
const summarizeVectorCandidate = (c) => ({ entry: c.path, title: c.title, reasons: c.reasons });
const summarizeVectorProposal = (m) => ({ id: m.id, entry: m.payload.source_entry, change: m.payload.proposed_change });

/**
 * Run the vector-tuning audit — the GENERATIVE counterpart of runUnsungEmission
 * / runHubEmission, behind POST /api/weave/emit-vector-tuning. It differs in ONE
 * deliberate way, forced by the generative tier: a vector_tuning proposal can
 * only be BUILT once its proposed vector exists, and generating that vector is
 * an LLM call. So the two-click split is re-cut:
 *
 *   DRY RUN — scan + select only (cheap, no generation, no write). Returns the
 *             candidate ENTRIES it WOULD tune + honest counts: the fast, safe
 *             preview the QUEUE trigger shows on the first click.
 *   LIVE    — generate (taste) for each selected entry, build the proposal, then
 *             validate + append it. The slow step lives ONLY here, behind the
 *             explicit second click ("generate & post") — the same write-needs-
 *             intent gate the detection audits use.
 *
 * (The detection runs build proposals in their dry run because their "generation"
 * is a pure scan; the generative type cannot, so its dry run shows candidates,
 * not proposals.) Never throws; honest counts, no silent caps.
 *
 * @param {object} args
 * @param {string}  args.palaceRoot
 * @param {string}  [args.boardPath]
 * @param {boolean} [args.dryRun=true]
 * @param {number}  [args.limit=3]   — generation is expensive; the cap is low
 * @param {string}  [args.model]     — generation model (default in weave-generate)
 * @param {string}  [args.ts]
 * @param {Function}[args.scanImpl]     — test seam: (palaceRoot) => { entriesScanned, candidates }
 * @param {Function}[args.generateImpl] — test seam: (candidate) => { ok, proposedVector, ... } (sync or async)
 * @param {Function}[args.appendImpl]   — test seam: (msg) => boolean
 */
export async function runVectorTuningEmission({
  palaceRoot, boardPath, dryRun = true, limit = 3, model, ts, scanImpl, generateImpl, appendImpl,
} = {}) {
  if (!palaceRoot) return { ok: false, status: 500, error: 'no palace root configured' };

  const lim = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 3;
  const scan = scanImpl || defaultVectorScan;
  const { entriesScanned, candidates } = scan(palaceRoot);

  const existing = boardPath && existsSync(boardPath) ? readJsonl(boardPath) : [];
  const sel = selectVectorTuningCandidates({ candidates, existing, limit: lim });

  const base = {
    ok: true,
    dryRun: !!dryRun,
    limit: lim,
    entriesScanned,
    found: sel.found,
    deduped: sel.deduped,
    eligible: sel.eligible,
    planned: sel.selected.length, // how many WOULD be generated + posted on a live run
    dropped: sel.dropped,         // eligible-but-over-limit, NOT silently swallowed
    candidates: sel.selected.map(summarizeVectorCandidate),
  };

  if (dryRun) return base;

  // Live run: generate (taste) for each selected entry, then build + append.
  const stamp = ts || new Date().toISOString();
  const runId = stamp.replace(/[^0-9]/g, '').slice(0, 14);
  const generate = generateImpl || ((cand) => generateVectorTuning({ palaceRoot, candidate: cand, model }));
  const append = appendImpl || defaultAppend(boardPath);

  let posted = 0;
  let genFailed = 0;
  const skipped = [];
  const proposals = [];
  for (const [i, c] of sel.selected.entries()) {
    let g;
    try {
      g = generate({ path: c.path, title: c.title });
      if (g && typeof g.then === 'function') g = await g; // tolerate an async generateImpl
    } catch (e) { g = { ok: false, error: e.message }; }
    // genFailed counts generation failures; skipped counts validate/append
    // failures — kept orthogonal so the UI can report both without double-count.
    if (!g || !g.ok) { genFailed++; continue; }
    const m = buildVectorTuningProposal(
      { path: g.path, title: g.title, currentVector: g.currentVector, proposedVector: g.proposedVector, rationale: g.rationale },
      { ts: stamp, id: `vector-tuning-${runId}-${i + 1}` },
    );
    let landed = false;
    try { landed = append(m); } catch { landed = false; }
    if (landed) { posted++; proposals.push(summarizeVectorProposal(m)); }
    else skipped.push(m.id);
  }
  return { ...base, posted, genFailed, skipped, proposals };
}
