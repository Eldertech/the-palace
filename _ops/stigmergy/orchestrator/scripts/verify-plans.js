// verify-plans.js — Phase 5 verification for the Bundle-Local Stewardship plan.
//
// Read-only. For every steward in REGISTRY.json it checks:
//   1. plan.md exists in the entry bundle and has the four sections.
//   2. Single-source-of-truth: plan.md points to the entry's forward_vector and
//      does NOT copy it verbatim.
//   3. Cold-read: the open/resolved decisions are legible from plan.md alone.
//   4. Board↔plan consistency: the plan's Open set == a fresh board reconcile's
//      still-pending set, and the plan's Resolved set ⊇ the board's resolved set
//      (plan may additionally carry pre-board-reset resolved history).
// Plus a global sweep: no entry-owned stray (.md/.html) left in
// _ops/agents/permanent/<slug>/ — only runtime/forensic machinery may remain.
//
// Exit code 0 = all green; 1 = at least one failure.

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, join, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readJsonl } from '@stigmergy/core/blackboard';
import { resolveBundleDir } from '../src/entry-paths.js';
import { readEntryMeta } from '../src/entry-frontmatter.js';
import { reconcilePendingRequests } from '../src/process-cycle.js';

const PALACE_ROOT_DEFAULT = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../..');
const argv = process.argv.slice(2);
const arg = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
const palaceRoot = resolve(arg('--root', PALACE_ROOT_DEFAULT));

const registry = JSON.parse(readFileSync(join(palaceRoot, '_ops/agents/permanent/REGISTRY.json'), 'utf8'));
const board = readJsonl(join(palaceRoot, '_ops/swarm/persistent/blackboard.jsonl'));

const SECTIONS = ['## Plan', '## Open Decisions', '## Resolved Decisions', '## Done'];
// Files a steward agent dir may legitimately keep (runtime/forensic machinery).
const ALLOWED_OPS_FILES = new Set(['manifest.json', 'state.json', 'history.jsonl', 'pending-bbs-append.jsonl']);

/** request_ids declared under a `## Section` heading in plan.md (### `id` — …). */
function idsUnder(planText, heading) {
  const start = planText.indexOf(heading);
  if (start < 0) return [];
  const rest = planText.slice(start + heading.length);
  const end = rest.search(/\n## /);
  const body = end < 0 ? rest : rest.slice(0, end);
  return [...body.matchAll(/^###\s+`([^`]+)`/gm)].map((m) => m[1]);
}

const setEq = (a, b) => a.length === b.length && [...a].sort().every((x, i) => x === [...b].sort()[i]);

let failures = 0;
const fail = (home, msg) => { console.log(`  ✗ ${home}: ${msg}`); failures++; };

for (const agent of registry.agents) {
  const home = agent.home;
  const checks = [];

  const bundle = resolveBundleDir(palaceRoot, home);
  if (!bundle) { fail(home, 'entry file not found'); continue; }
  const planPath = join(bundle.bundleDir, `${home} — plan.md`);
  if (!existsSync(planPath)) { fail(home, 'plan.md missing'); continue; }
  const plan = readFileSync(planPath, 'utf8');

  // 1. four sections
  const missing = SECTIONS.filter((s) => !plan.includes(s));
  if (missing.length) fail(home, `missing sections: ${missing.join(', ')}`); else checks.push('sections');

  // 2. single-source-of-truth: pointer present, vector not copied
  if (!plan.includes('frontmatter `forward_vector`')) fail(home, 'no forward_vector pointer'); else checks.push('pointer');
  const meta = readEntryMeta(palaceRoot, home);
  if (meta?.forward_vector && plan.includes(meta.forward_vector.trim().slice(0, 60))) {
    fail(home, 'entry forward_vector appears COPIED into plan.md (should be a pointer)');
  } else checks.push('no-copy');

  // 3 + 4. board↔plan consistency
  const { stillPending, nowResolved } = reconcilePendingRequests(board, home);
  const planOpen = idsUnder(plan, '## Open Decisions');
  const planResolved = idsUnder(plan, '## Resolved Decisions');
  const boardPending = stillPending.map((r) => r.request_id);
  const boardResolved = new Set(nowResolved.map((r) => r.request_id));
  if (!setEq(planOpen, boardPending)) {
    fail(home, `Open mismatch — plan:[${planOpen.join(',')}] board:[${boardPending.join(',')}]`);
  } else checks.push('open==board');
  const missingResolved = [...boardResolved].filter((id) => !planResolved.includes(id));
  if (missingResolved.length) fail(home, `plan Resolved missing board-resolved: ${missingResolved.join(',')}`); else checks.push('resolved⊇board');

  if (checks.length === 5) console.log(`  ✓ ${home}  [${meta?.stage}]  open=${planOpen.length} resolved=${planResolved.length}`);
}

// Global sweep: no entry-owned stray markdown/html left in the steward dirs.
console.log('\nStray sweep (_ops/agents/permanent/*/):');
let strays = 0;
for (const agent of registry.agents) {
  const dirAbs = isAbsolute(agent.dir) ? agent.dir : join(palaceRoot, agent.dir);
  if (!existsSync(dirAbs)) continue;
  for (const f of readdirSync(dirAbs)) {
    if (ALLOWED_OPS_FILES.has(f)) continue;
    if (/\.(md|html)$/i.test(f)) { console.log(`  ⚠ stray entry-owned file: ${agent.dir}/${f}`); strays++; failures++; }
  }
}
if (!strays) console.log('  ✓ none — only runtime/forensic machinery remains in _ops.');

console.log(`\n${failures === 0 ? '✓ ALL GREEN' : `✗ ${failures} FAILURE(S)`} — ${registry.agents.length} stewards verified.`);
process.exit(failures === 0 ? 0 : 1);
