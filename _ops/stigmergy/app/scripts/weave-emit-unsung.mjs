#!/usr/bin/env node
// weave-emit-unsung.mjs — run the Weave's unsung-path audit and emit proposals.
//
// Scans the palace for unsung paths (body [[wikilinks]] to known entries that
// aren't yet typed links), then builds `promote_unsung` vector_proposals that
// carry an `add-link` apply op — so each one shows up in the STIGMERGY QUEUE with
// a "grant & apply" that formalizes the link. The posting half of the Weave loop.
//
// Reuses the existing detection (unsung-paths.js) + entry scan (entries.js) and
// the sanctioned validate-then-append board path (@stigmergy/core). DRY-RUN by
// default; --post actually appends. Idempotent: skips pairs already carried by an
// open proposal on the board. Caps with --limit and logs everything it drops.
//
//   node weave-emit-unsung.mjs [--root <palace>] [--board <jsonl>]
//                              [--limit N] [--post]
//
// Never writes the board without --post; never `git add`s; the only write is the
// validated appendMessage.

import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { walkEntryRecords } from '../src/lib/entries.js';
import { buildPalaceIndex, findUnsungEdges } from '../src/lib/unsung-paths.js';
import { planUnsungEmission } from '../src/lib/weave-propose.js';
import { readJsonl, appendMessage } from '@stigmergy/core/blackboard';
import { validateMessage } from '@stigmergy/core/schema';

const __dir = dirname(fileURLToPath(import.meta.url));            // .../app/scripts
const DEFAULT_ROOT = resolve(__dir, '../../../..');               // → palace root
const PERSISTENT_REL = '_ops/swarm/persistent/blackboard.jsonl';

function main() {
  const argv = process.argv.slice(2);
  const arg = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
  const has = (n) => argv.includes(n);

  const palaceRoot = resolve(arg('--root', DEFAULT_ROOT));
  const boardPath = resolve(arg('--board', join(palaceRoot, PERSISTENT_REL)));
  const limit = parseInt(arg('--limit', '8'), 10);
  const post = has('--post');

  // Scan + detect (the existing pure pipeline).
  const records = [...walkEntryRecords(palaceRoot)];
  const index = buildPalaceIndex(records);
  const edges = findUnsungEdges(records, index);

  // Plan against the live board (idempotent dedup + cap).
  const existing = existsSync(boardPath) ? readJsonl(boardPath) : [];
  const ts = new Date().toISOString();
  const runId = ts.replace(/[^0-9]/g, '').slice(0, 14);
  const plan = planUnsungEmission({ edges, existing, limit, ts, runId });

  process.stdout.write(
    `unsung-path audit · ${records.length} entries scanned\n`
    + `  ${plan.found} unsung edge(s) found · ${plan.deduped} already proposed (open) · `
    + `${plan.eligible} eligible · ${plan.posted} ${post ? 'to post' : 'in this dry run'}`
    + `${plan.dropped ? ` · ${plan.dropped} over --limit ${limit} NOT emitted` : ''}\n`,
  );

  if (plan.proposals.length === 0) {
    process.stdout.write('  nothing to emit.\n');
    return;
  }

  if (!post) {
    process.stdout.write('\n  (dry run — pass --post to append these to the board)\n');
    for (const m of plan.proposals) {
      process.stdout.write(`    ${m.payload.source_entry}  →  ${m.payload.target_entry}   [${m.id}]\n`);
    }
    return;
  }

  let posted = 0;
  for (const m of plan.proposals) {
    const v = validateMessage(m);
    if (!v.valid) {
      process.stderr.write(`    SKIP invalid: ${m.id} — ${JSON.stringify(v.errors)}\n`);
      continue;
    }
    appendMessage(boardPath, m);
    posted++;
    process.stdout.write(`    posted ${m.payload.source_entry} → ${m.payload.target_entry} [${m.id}]\n`);
  }
  process.stdout.write(`\n  ✓ posted ${posted} proposal(s) to ${boardPath}\n`);
}

main();
