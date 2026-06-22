#!/usr/bin/env node
// weave-emit-vector-tuning.mjs — the Weave's first GENERATIVE proposal type.
//
// The detection emitters (weave-emit-unsung / the hub audit) post from a pure
// scan. This one needs taste: for each candidate entry it asks a model to read
// the entry against its body and propose a sharper `forward_vector` (the
// "conatus, not stasis" rule — SCHEMA §3, [[Entry Conatus]]), then builds a
// `vector_tuning` vector_proposal carrying the shipped `set-vector` apply op —
// so each shows up in the STIGMERGY QUEUE with a "grant & apply" that rewrites
// the vector, churn-free. Detection → generation, on the same scan→plan→post→
// grant&apply spine, reusing set-vector with zero new executor plumbing.
//
//   node weave-emit-vector-tuning.mjs --entry "<title>"   [--post] [--model M]
//   node weave-emit-vector-tuning.mjs --scan [--limit N]  [--post] [--model M]
//       [--root <palace>] [--board <jsonl>]
//
// --entry tunes one named entry (Loudon's pick). --scan finds candidates whose
// vector is missing / stasis-leaning / thin and tunes the top --limit (default
// 3 — each is a generation, so the cap is low and every drop is logged).
//
// DRY-RUN by default: it GENERATES (so you can read the proposed before→after —
// the point of a generative dry run) but writes nothing. --post validates +
// appends each proposal via the sanctioned @stigmergy/core path; never git-adds.
// Idempotent: skips entries already carried by an open or denied vector_tuning
// proposal on the board.

import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { listEntries } from '../src/lib/entries.js';
import { findVectorTuningCandidates } from '../src/lib/vector-tuning-candidates.js';
import { selectVectorTuningCandidates, buildVectorTuningProposal } from '../src/lib/weave-propose.js';
import { generateVectorTuning } from '../server/weave-generate.js';
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
  const limit = parseInt(arg('--limit', '3'), 10);
  const model = arg('--model', undefined);
  const post = has('--post');
  const entryArg = arg('--entry', null);
  const scan = has('--scan');

  if (!entryArg && !scan) {
    process.stderr.write('usage: weave-emit-vector-tuning.mjs (--entry "<title>" | --scan) [--limit N] [--model M] [--post]\n');
    process.exit(2);
  }

  const entries = listEntries(palaceRoot);

  // Build the candidate list. --entry is targeted (no skeleton filter — Loudon
  // named it); --scan runs the mechanical pre-filter.
  let candidates;
  let foundLabel;
  if (entryArg) {
    const want = entryArg.trim().toLowerCase();
    const e = entries.find((s) =>
      (s.title && s.title.trim().toLowerCase() === want)
      || s.path.toLowerCase().replace(/\.md$/, '') === want
      || s.path.toLowerCase() === want);
    if (!e) {
      process.stderr.write(`entry not found: "${entryArg}"\n`);
      process.exit(1);
    }
    candidates = [{ path: e.path, title: e.title, currentVector: e.forward_vector || '', reasons: ['named'] }];
    foundLabel = `targeted entry "${e.title}"`;
  } else {
    candidates = findVectorTuningCandidates(entries);
    foundLabel = `${candidates.length} candidate(s) (missing / stasis / thin)`;
  }

  // Dedup against the live board + cap (before generation — generation is the
  // expensive step, so we never read a body for an already-proposed entry).
  const existing = existsSync(boardPath) ? readJsonl(boardPath) : [];
  const sel = selectVectorTuningCandidates({ candidates, existing, limit });

  process.stdout.write(
    `vector-tuning audit · ${entries.length} entries scanned · ${foundLabel}\n`
    + `  ${sel.deduped} already proposed (open/denied) · ${sel.eligible} eligible · `
    + `${sel.selected.length} to generate`
    + `${sel.dropped ? ` · ${sel.dropped} over --limit ${limit} NOT generated` : ''}\n`,
  );

  if (sel.selected.length === 0) {
    process.stdout.write('  nothing to tune.\n');
    return;
  }

  // Generate (taste) for each selected entry. A failure is logged, never silent;
  // it simply yields no proposal for that entry.
  const ts = new Date().toISOString();
  const runId = ts.replace(/[^0-9]/g, '').slice(0, 14);
  const proposals = [];
  let genFail = 0;
  for (const [i, c] of sel.selected.entries()) {
    const g = generateVectorTuning({ palaceRoot, candidate: { path: c.path, title: c.title }, model });
    if (!g.ok) {
      genFail++;
      process.stderr.write(`    GEN FAIL ${c.title}: ${g.error}\n`);
      continue;
    }
    proposals.push(buildVectorTuningProposal(
      { path: g.path, title: g.title, currentVector: g.currentVector, proposedVector: g.proposedVector, rationale: g.rationale },
      { ts, id: `vector-tuning-${runId}-${i + 1}` },
    ));
  }

  process.stdout.write(`  generated ${proposals.length} proposal(s)${genFail ? ` · ${genFail} generation failure(s)` : ''}\n`);
  if (proposals.length === 0) {
    process.stdout.write('  nothing to emit.\n');
    return;
  }

  if (!post) {
    process.stdout.write('\n  (dry run — pass --post to append these to the board)\n');
    for (const m of proposals) {
      const p = m.payload;
      process.stdout.write(`\n    ${p.source_entry}   [${m.id}]\n`);
      if (p.current_vector) process.stdout.write(`      from: ${p.current_vector}\n`);
      process.stdout.write(`      to:   ${p.apply.text}\n`);
      if (p.rationale) process.stdout.write(`      why:  ${p.rationale}\n`);
    }
    return;
  }

  let posted = 0;
  for (const m of proposals) {
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
