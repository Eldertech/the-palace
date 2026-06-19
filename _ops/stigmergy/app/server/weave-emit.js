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
import { walkEntryRecords } from '../src/lib/entries.js';
import { buildPalaceIndex, findUnsungEdges } from '../src/lib/unsung-paths.js';
import { planUnsungEmission } from '../src/lib/weave-propose.js';
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
