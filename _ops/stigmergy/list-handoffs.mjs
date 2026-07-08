#!/usr/bin/env node
// list-handoffs.mjs — the "list handoffs" fast path.
//
// Lists the handoff board in its three lifecycle states (rung 1 of the Reliable
// Handoff ladder — STIGMERGY.md § Handoff Lifecycle). The board is the single
// source of truth; state is a fold over its events (see handoff-model.mjs), not
// a guess from git or the filesystem.
//
//   OPEN     — handoff_ready, not yet claimed. Available to catch.
//   CLAIMED  — someone posted a claim (handoff_picked_up, lifecycle: claim) but
//              no close yet. In flight. Stays visible — a claim aging with no
//              close is how a fumble surfaces.
//   (closed) — retired by an explicit handoff_closed (or a grandfathered legacy
//              pickup). Not shown.
//
//   claim a card → node _ops/stigmergy/pickup-handoff.mjs <id | entry>
//   close a card → node _ops/stigmergy/close-handoff.mjs  <id | entry> --commit <hash>
//
// Usage:  node _ops/stigmergy/list-handoffs.mjs [--board <path>]
// Run from anywhere; paths resolve against the owner worktree.

import { boardPath, loadBoard, foldHandoffs, age, C } from './handoff-model.mjs';

const boardArg = process.argv.includes('--board')
  ? process.argv[process.argv.indexOf('--board') + 1] : undefined;

const board = boardPath(boardArg);
const fold = foldHandoffs(loadBoard(board));
const { open, claimed } = fold;
const total = open.length + claimed.length;

if (total === 0) {
  console.log(`${C.B}HANDOFFS${C.R} — none open. Clean board.`);
} else {
  const claimedTail = claimed.length ? `, ${C.Y}${claimed.length} claimed${C.R}` : '';
  console.log(`${C.B}HANDOFFS${C.R} — ${C.G}${open.length} open${C.R}${claimedTail}\n`);
}

function printCard(c, dot) {
  const p = c.p, wt = p.worktree;
  console.log(`${dot} ${C.B}${p.entry}${C.R}  ${C.D}[${age(c.m.ts)} · ${c.m.from}]${C.R}  ${C.D}${c.m.id}${C.R}`);
  if (p.move) console.log(`    ${p.move}`);
  if (wt) console.log(`    ${C.D}→ worktree ${wt.branch} (${wt.dir})${C.R}`);
  if (p.handoff_path) console.log(`    ${C.D}baton: ${p.handoff_path}${C.R}`);
  console.log('');
}

for (const c of open) printCard(c, `${C.G}●${C.R}`);

if (claimed.length) {
  console.log(`${C.Y}◐ claimed — in flight, awaiting a close:${C.R}`);
  for (const c of claimed) {
    const who = (c.claim && c.claim.from) || c.m.from;
    console.log(`  ${C.Y}◐${C.R} ${C.B}${c.p.entry}${C.R}  ${C.D}[claimed ${age(c.claim ? c.claim.ts : c.m.ts)} ago · ${who}]${C.R}  ${C.D}${c.m.id}${C.R}`);
    if (c.p.move) console.log(`      ${C.D}${c.p.move.slice(0, 80)}${C.R}`);
  }
  console.log('');
}

if (total) {
  console.log(`${C.D}claim → pickup-handoff.mjs <id | entry>   ·   close → close-handoff.mjs <id> --commit <hash>${C.R}`);
}
