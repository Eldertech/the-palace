// backfill-plans.js — one-shot, idempotent Phase 2 of the Bundle-Local
// Stewardship plan: materialize `[Entry] — plan.md` for every live steward in
// REGISTRY.json from its existing state.json + history.jsonl, so all 19 have a
// bundle-local read-model without waiting for each to next cycle.
//
// READ-ONLY against the running system: it writes ONLY plan.md files into entry
// bundles. It never touches state.json, history.jsonl, manifest.json, the
// REGISTRY, or the append-only board. Decision fidelity is preserved exactly —
// plan.md is generated from each state.json's stored pending/resolved (which
// keeps pre-board-reset history), and the board is used only to VERIFY (reconcile
// + warn on divergence), never to overwrite.
//
// Usage:
//   node scripts/backfill-plans.js [--root <palace-root>] [--dry]
//   --dry : report what would be written (paths + counts + board divergences); write nothing.

import { readFileSync, existsSync } from 'node:fs';
import { resolve, join, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readJsonl } from '@stigmergy/core/blackboard';
import { materializePlan } from '../src/plan-file.js';
import { resolveBundleDir } from '../src/entry-paths.js';
import { readEntryMeta } from '../src/entry-frontmatter.js';
import { reconcilePendingRequests } from '../src/process-cycle.js';

const PALACE_ROOT_DEFAULT = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../..');

const argv = process.argv.slice(2);
const arg = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
const palaceRoot = resolve(arg('--root', PALACE_ROOT_DEFAULT));
const dry = argv.includes('--dry');

const tsNow = new Date().toISOString();
const today = tsNow.slice(0, 10);

const registryPath = join(palaceRoot, '_ops/agents/permanent/REGISTRY.json');
const boardPath = join(palaceRoot, '_ops/swarm/persistent/blackboard.jsonl');
const registry = JSON.parse(readFileSync(registryPath, 'utf8'));
const board = readJsonl(boardPath);

const sortIds = (rs) => (rs || []).map((r) => r && r.request_id).filter(Boolean).sort();

/**
 * Reconcile stored state against the live board exactly as process-cycle does:
 * pending ← the board's still-unanswered asks; resolved ← state's resolved UNION
 * the board's newly-resolved (dedup by request_id, state's richer copy wins).
 * This makes the backfilled plan.md == what each steward's NEXT cycle would
 * write, reflects the board (ground truth), and preserves any pre-reset resolved
 * history that only state.json still holds.
 */
function reconcileState(state, home) {
  const { stillPending, nowResolved } = reconcilePendingRequests(board, home);
  const existing = new Set((state.resolved_requests || []).map((r) => r.request_id));
  const resolved = [...(state.resolved_requests || [])];
  for (const r of nowResolved) if (!existing.has(r.request_id)) resolved.push(r);
  const statePendingIds = new Set(sortIds(state.pending_requests));
  const boardPendingIds = new Set(sortIds(stillPending));
  // Stored-pending the board has since answered (the fast-forward this backfill applies).
  const fastForwarded = [...statePendingIds].filter((id) => !boardPendingIds.has(id));
  return { merged: { ...state, pending_requests: stillPending, resolved_requests: resolved }, fastForwarded };
}

const rows = [];
for (const agent of registry.agents) {
  const home = agent.home;
  const dirAbs = isAbsolute(agent.dir) ? agent.dir : join(palaceRoot, agent.dir);
  const row = { home, stage: null, open: 0, resolved: 0, written: false, note: '' };

  const statePath = join(dirAbs, 'state.json');
  if (!existsSync(statePath)) { row.note = 'no state.json'; rows.push(row); continue; }
  const state = JSON.parse(readFileSync(statePath, 'utf8'));

  const meta = readEntryMeta(palaceRoot, home);
  row.stage = meta?.stage ?? '(entry not found)';

  // Fast-forward the stored state against the board (what the next cycle would do).
  const { merged, fastForwarded } = reconcileState(state, home);
  row.open = (merged.pending_requests || []).length;
  row.resolved = (merged.resolved_requests || []).length;
  if (fastForwarded.length) row.note = `fast-forwarded (board-resolved since last cycle): ${fastForwarded.join(',')}`;

  const bundle = resolveBundleDir(palaceRoot, home);
  if (!bundle) { row.note = `${row.note} | ENTRY FILE NOT FOUND`.trim(); rows.push(row); continue; }
  row.planPath = join(bundle.bundleDir, `${home} — plan.md`);

  if (!dry) {
    const res = materializePlan({ palaceRoot, home, state: merged, stage: meta?.stage, tsNow, today, iteration: merged.iteration, historyPath: join(dirAbs, 'history.jsonl') });
    row.written = res.written;
    if (res.stagingTitle) row.note = `${row.note}${row.note ? ' · ' : ''}staging: ${res.stagingTitle}`;
  }
  rows.push(row);
}

// ── Report ────────────────────────────────────────────────────────────────
const wrote = rows.filter((r) => r.written).length;
console.log(`Bundle-Local Stewardship — Phase 2 backfill ${dry ? '(DRY RUN — nothing written)' : ''}`);
console.log(`palace: ${palaceRoot}`);
console.log(`stewards: ${rows.length}  ·  ${dry ? 'would write' : 'wrote'}: ${dry ? rows.filter((r) => r.planPath).length : wrote}  ·  ts: ${tsNow}\n`);
for (const r of rows) {
  const mark = dry ? (r.planPath ? '·' : '✗') : (r.written ? '✓' : '✗');
  console.log(`${mark} ${r.home}  [${r.stage}]  open=${r.open} resolved=${r.resolved}${r.note ? `  — ${r.note}` : ''}`);
}
const ff = rows.filter((r) => /fast-forwarded/.test(r.note)).length;
const missing = rows.filter((r) => /NOT FOUND|no state/.test(r.note));
console.log(`\n${ff} steward(s) fast-forwarded against the board (decisions answered since their last cycle — plan.md reflects the board, the next cycle will agree).`);
if (missing.length) console.log(`⚠ ${missing.length} steward(s) with missing files — listed above.`);
