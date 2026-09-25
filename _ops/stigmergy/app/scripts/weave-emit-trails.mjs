// weave-emit-trails.mjs — post a weave's held findings as pheromone trails.
//
// A weave holds back real but unsigned findings (single-reader, or crowded out of
// the signing). Rather than lose them, it leaves them on the WEAVE board as
// `weave_flag`s the NEXT weave reads first (Step 1c). Each trail carries its lens,
// spark, whether two independent runs found it, and `expires_after` — a trail that
// isn't picked up fades, so trails can't crowd out lateral search ([[Pheromone Trail]]).
// `expires_after` is advisory today: nothing reads it yet (the next weave's linter should).
//
// Same sanctioned path as the other weave-emit scripts: validate, then append.
// DRY-RUN by default; --post writes.
//
//   node weave-emit-trails.mjs --trails <trails.json> --weave 2026-09-24 [--board <jsonl>] [--post]

import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync, existsSync } from 'node:fs';
import { readJsonl, appendMessage } from '@stigmergy/core/blackboard';
import { validateMessage } from '@stigmergy/core/schema';

const __dir = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const palaceRoot = resolve(__dir, '..', '..', '..', '..');
const boardPath = resolve(arg('--board', join(palaceRoot, '_ops/swarm/persistent/blackboard.jsonl')));
const weave = arg('--weave');
const trails = JSON.parse(readFileSync(resolve(arg('--trails')), 'utf8'));
const post = argv.includes('--post');
if (!weave || !Array.isArray(trails)) { console.error('need --weave <date> and --trails <json array>'); process.exit(2); }

const seen = new Set((existsSync(boardPath) ? readJsonl(boardPath) : []).map((m) => m.id));
const slug = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
const msgs = trails.map((t, i) => ({
  schema_version: '1.0',
  id: `weave-trail-${weave}-${String(i + 1).padStart(2, '0')}-${slug(t.source)}`,
  ts: new Date(Date.now() + i).toISOString(),
  session_id: `weave-${weave}`,
  from: 'COORDINATOR', to: '*', type: 'BROADCAST', board: 'WEAVE',
  health: { score: 'green', model: 'claude-opus-5-5',
            _orchestrator_metadata: { dispatch_mode: 'claude-code', note: `pheromone trail from the ${weave} weave` } },
  payload: {
    kind: 'weave_flag', flag_type: 'pheromone-trail',
    source_entries: [t.source], target_entry: t.target,
    proposed_action: `Consider ${t.source} —${t.type}→ ${t.target}${t.label ? ` [${t.label}]` : ''}. Held, not signed, in the ${weave} weave.`,
    rationale: t.why,
    signal: { lens: t.lens, spark: t.spark, replicated_across_runs: !!t.replicated },
    expires_after: '2 weaves',
  },
}));

let bad = 0;
for (const m of msgs) {
  const v = validateMessage(m);
  if (!v.ok && v.valid !== true && v !== true) { bad++; console.log(`  INVALID ${m.id}: ${JSON.stringify(v.errors || v).slice(0, 300)}`); }
}
if (bad) { console.log(`\n${bad} invalid — nothing posted.`); process.exit(1); }
if (!post) {
  console.log(`dry run: ${msgs.length} valid trail(s) for ${boardPath}; pass --post to append.`);
  for (const m of msgs.slice(0, 3)) console.log('  ' + m.id + '  ' + m.payload.proposed_action);
  process.exit(0);
}
let n = 0;
for (const m of msgs) { if (seen.has(m.id)) continue; appendMessage(boardPath, m); n++; }
console.log(`posted ${n} trail(s) to ${boardPath}` + (n < msgs.length ? ` (${msgs.length - n} already there)` : ''));
