// slim-state.js — one-shot, idempotent SSOT cutover for the Bundle-Local
// Stewardship plan: slim every live steward's state.json to pure runtime by
// removing the duplicated `stewardship` block and the `pending_requests` /
// `resolved_requests` decision arrays.
//
// Why this is safe to do as a bulk pass: after the cutover the orchestrator
// reads stage/forward_vector LIVE from the entry frontmatter and derives
// decision state from the append-only board (process-cycle.js / plan-file.js),
// so nothing reads these fields anymore. `process-cycle` also deletes them on
// every write, so this script just brings the existing 19 to that state at once
// instead of waiting for each to next cycle.
//
// Preserves all runtime keys exactly: iteration, last_active, last_read_cursor,
// health, and any _pilot_metadata. Writes with the same 2-space + trailing-\n
// formatting process-cycle uses, so re-running is a no-op (idempotent).
//
// Usage:
//   node scripts/slim-state.js [--root <palace-root>] [--dry]
//   --dry : report which keys WOULD be removed from each state.json; write nothing.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, join, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

const PALACE_ROOT_DEFAULT = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../..');
const argv = process.argv.slice(2);
const arg = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
const palaceRoot = resolve(arg('--root', PALACE_ROOT_DEFAULT));
const dry = argv.includes('--dry');

// The keys the cutover removes — all are decision content or a duplicated
// frontmatter copy, now owned by the board / the entry frontmatter:
//   stewardship        — duplicated stage/vector (frontmatter is SSOT)
//   pending_requests   — open decisions (board is SSOT)
//   resolved_requests  — resolved decisions (board is SSOT)
//   stranded_requests  — GSL-only: a superseded ask wiped by a board reset;
//                        preserved in history.jsonl + git, so safe to drop here.
// Everything else (iteration, last_active, last_read_cursor, health, and any
// _-prefixed forensic metadata like _pilot_metadata / _demo_metadata) is pure
// runtime and is preserved untouched.
const SLIM_KEYS = ['stewardship', 'pending_requests', 'resolved_requests', 'stranded_requests'];

const registryPath = join(palaceRoot, '_ops/agents/permanent/REGISTRY.json');
const registry = JSON.parse(readFileSync(registryPath, 'utf8'));

let changed = 0;
let already = 0;
const rows = [];
for (const agent of registry.agents) {
  const dirAbs = isAbsolute(agent.dir) ? agent.dir : join(palaceRoot, agent.dir);
  const statePath = join(dirAbs, 'state.json');
  if (!existsSync(statePath)) { rows.push(`  ✗ ${agent.home} — no state.json`); continue; }

  const state = JSON.parse(readFileSync(statePath, 'utf8'));
  const present = SLIM_KEYS.filter((k) => k in state);
  if (present.length === 0) { already++; rows.push(`  · ${agent.home} — already slim`); continue; }

  for (const k of present) delete state[k];
  if (!dry) writeFileSync(statePath, JSON.stringify(state, null, 2) + '\n');
  changed++;
  rows.push(`  ${dry ? '·' : '✓'} ${agent.home} — removed: ${present.join(', ')}  (kept: ${Object.keys(state).join(', ')})`);
}

console.log(`Bundle-Local Stewardship — SSOT state slim ${dry ? '(DRY RUN — nothing written)' : ''}`);
console.log(`palace: ${palaceRoot}`);
console.log(`stewards: ${registry.agents.length}  ·  ${dry ? 'would slim' : 'slimmed'}: ${changed}  ·  already slim: ${already}\n`);
for (const r of rows) console.log(r);
console.log(`\n${changed === 0 ? 'Nothing to do — all already slim.' : `${dry ? 'Would slim' : 'Slimmed'} ${changed} steward state.json file(s) to pure runtime.`}`);
