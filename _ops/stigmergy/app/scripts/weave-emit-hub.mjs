#!/usr/bin/env node
// weave-emit-hub.mjs — run the Weave's hub-promotion audit and emit proposals.
//
// Scans the palace for hub candidates (concept entries whose INBOUND typed-link
// degree has reached the SCHEMA §1 threshold of ≥5), then builds `promote_hub`
// vector_proposals carrying a `set-type` apply op (concept → hub) — so each one
// shows up in the STIGMERGY QUEUE with a "grant & apply" that retypes the entry.
// The hub-promotion sibling of weave-emit-unsung.mjs.
//
// Reuses the detection (hub-candidates.js) + entry scan (entries.js) and the
// sanctioned validate-then-append board path (@stigmergy/core). DRY-RUN by
// default; --post actually appends. Idempotent: skips entries already carried by
// an open/denied promote_hub proposal. Caps with --limit and logs every drop.
//
//   node weave-emit-hub.mjs [--root <palace>] [--board <jsonl>]
//                           [--limit N] [--threshold N] [--post]

import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { walkEntryRecords } from '../src/lib/entries.js';
import { findHubCandidates } from '../src/lib/hub-candidates.js';
import { planHubEmission } from '../src/lib/weave-propose.js';
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
  const threshold = parseInt(arg('--threshold', '5'), 10);
  const post = has('--post');

  const records = [...walkEntryRecords(palaceRoot)];
  const candidates = findHubCandidates(records, { threshold });

  const existing = existsSync(boardPath) ? readJsonl(boardPath) : [];
  const ts = new Date().toISOString();
  const runId = ts.replace(/[^0-9]/g, '').slice(0, 14);
  const plan = planHubEmission({ candidates, existing, limit, ts, runId });

  process.stdout.write(
    `hub-promotion audit · ${records.length} entries scanned · threshold ≥${threshold} inbound\n`
    + `  ${plan.found} concept candidate(s) found · ${plan.deduped} already proposed (open) · `
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
      process.stdout.write(`    ${m.payload.source_entry}   [${m.id}]\n      ${m.payload.proposed_change}\n`);
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
    process.stdout.write(`    posted ${m.payload.source_entry} [${m.id}]\n`);
  }
  process.stdout.write(`\n  ✓ posted ${posted} proposal(s) to ${boardPath}\n`);
}

main();
