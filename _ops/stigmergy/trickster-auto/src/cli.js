#!/usr/bin/env node
// cli.js — the Automated Trickster runner.
//
// Default mode is SHADOW: it reads the board, evaluates every pending request,
// writes a ranked digest artifact, and posts NOTHING. Write authority is opt-in
// via --live and is earned only after the shadow proposals match Loudon's own
// decisions. The audition/irreversible hard gate applies in every mode.
//
// Usage:
//   node src/cli.js                      # shadow over the live persistent board
//   node src/cli.js --board path.jsonl   # shadow over a specific board
//   node src/cli.js --live               # ALSO post auto-grant/deny to the board
//   node src/cli.js --out dir            # where to write digest-latest.{json,md}
//   node src/cli.js --budget N           # daily auto-grant cap (Phase 4)
//   node src/cli.js --json               # print the digest JSON to stdout
//
// Flags default to the safe choice. --shadow is the default; --live must be typed.

import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadBoard, PERSISTENT_BOARD } from './board.js';
import { buildInbox } from './inbox.js';
import { loadRuleset } from './ruleset.js';
import { evaluateBatch } from './evaluate.js';
import { buildDigest, renderDigestMarkdown } from './digest.js';
import { loadBudget, applyDecisions, summarizeBudget } from './budget.js';
import { postDecisions } from './decide.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = resolve(__dirname, '..');

export function parseArgs(argv) {
  const args = { mode: 'shadow', board: null, out: PKG_ROOT, rules: null, budget: null, json: false };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--live') args.mode = 'live';
    else if (a === '--shadow') args.mode = 'shadow';
    else if (a === '--json') args.json = true;
    else if (a === '--board') { args.board = argv[++i]; }
    else if (a === '--out') { args.out = argv[++i]; }
    else if (a === '--rules') { args.rules = argv[++i]; }
    else if (a === '--budget') { args.budget = Number(argv[++i]); }
  }
  return args;
}

/**
 * Run one cycle. Pure-ish: takes an explicit `now` (ISO string) so callers/
 * tests control time; the digest and any posted messages stamp this value.
 *
 * @returns {{ digest: object, posted: Array, budget: object }}
 */
export function runCycle({ boardPath, mode = 'shadow', rulesPath, now, budgetCap, budgetStatePath }) {
  const board = loadBoard(boardPath || PERSISTENT_BOARD);
  const { pending } = buildInbox(board);
  const ruleset = loadRuleset(rulesPath || undefined);

  const budget = loadBudget({ today: (now || '').slice(0, 10), cap: budgetCap, statePath: budgetStatePath });
  const results = evaluateBatch(pending, ruleset, budget.state);

  const digest = buildDigest(results, {
    mode,
    generatedAt: now || null,
    board: boardPath || PERSISTENT_BOARD,
  });

  let posted = [];
  if (mode === 'live') {
    posted = postDecisions(results, { boardPath: boardPath || PERSISTENT_BOARD, now });
    applyDecisions(budget, results); // decrement budget for grants actually posted
  }

  return { digest, posted, budget };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  // CLI uses real wall-clock for `now`; the engine itself is pure and takes it
  // as input. (Date is fine here — this is the I/O edge, not a workflow script.)
  const now = new Date().toISOString();

  const { digest, posted } = runCycle({
    boardPath: args.board,
    mode: args.mode,
    rulesPath: args.rules,
    now,
    budgetCap: args.budget,
  });

  mkdirSync(args.out, { recursive: true });
  const jsonPath = resolve(args.out, 'digest-latest.json');
  const mdPath = resolve(args.out, 'digest-latest.md');
  writeFileSync(jsonPath, JSON.stringify(digest, null, 2) + '\n', 'utf8');
  writeFileSync(mdPath, renderDigestMarkdown(digest), 'utf8');

  if (args.json) {
    process.stdout.write(JSON.stringify(digest, null, 2) + '\n');
  } else {
    const c = digest.counts;
    process.stdout.write(
      `[trickster-auto] mode=${args.mode}  pending=${c.pending}  escalate=${c.escalate}  auto-grant=${c.auto_grant}  auto-deny=${c.auto_deny}\n` +
      `  digest → ${jsonPath}\n  digest → ${mdPath}\n` +
      (args.mode === 'live' ? `  posted ${posted.length} decision(s) to the board\n` : '  (shadow — nothing posted)\n'),
    );
  }
}

// Run main only when invoked directly.
if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main();
}
