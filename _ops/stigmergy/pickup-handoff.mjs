#!/usr/bin/env node
// pickup-handoff.mjs — CLAIM a handoff (catch the baton, start the work).
//
// Rung 1 of the Reliable Handoff ladder splits "I've got it" from "it's done."
// This is the first half: posting a claim (handoff_picked_up, lifecycle: claim)
// moves the card from OPEN to CLAIMED. It does NOT retire the card — the work
// isn't done yet, and a claim that ages with no close is exactly the fumble we
// want visible. When the move actually lands, close it:
//
//     node _ops/stigmergy/close-handoff.mjs <id | entry> --commit <hash>
//
// Before it claims, it prints a reconciliation view — every commit that touched
// the entry since the baton was posted — because the move may already have
// landed ([[Baton Ceremony]] § On pickup: "this may already be done; check
// before continuing"). Read that list before you commit to the work.
//
// Usage:
//   node _ops/stigmergy/pickup-handoff.mjs <handoff-id | entry-name>
//   node _ops/stigmergy/pickup-handoff.mjs BLUELINE --note "caught on feature/x; move confirmed still needed"
//   node _ops/stigmergy/pickup-handoff.mjs <id> --dry-run     # show the claim, write nothing
//
// Flags:
//   --from <page>     who is catching it (default: the handoff's entry)
//   --surface <text>  receiving_surface note (default: "Claude Code (Mac)")
//   --note <text>     free-text note on the claim + health metadata
//   --model <id>      health.model (default: claude-opus-4-8)
//   --board <path>    board file override (default: owner persistent board)
//   --dry-run         print the claim + reconciliation view; do not post

import { execSync } from 'node:child_process';
import {
  ownerRoot, boardPath, loadBoard, foldHandoffs, resolveCard,
  postMessage, slug, stamp, stubHealth, C,
} from './handoff-model.mjs';

// --- args -------------------------------------------------------------------
const argv = process.argv.slice(2);
const flags = {};
const positional = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--dry-run') { flags.dryRun = true; continue; }
  if (a.startsWith('--')) { flags[a.slice(2)] = argv[++i]; continue; }
  positional.push(a);
}
const selector = positional[0];

function die(msg) { console.error(`${C.Rd}✗ ${msg}${C.R}`); process.exit(1); }

if (!selector) {
  die('usage: node _ops/stigmergy/pickup-handoff.mjs <handoff-id | entry-name> [--note "..."] [--dry-run]');
}

const ROOT = ownerRoot();
const board = boardPath(flags.board);
const fold = foldHandoffs(loadBoard(board));
const res = resolveCard(fold, selector);

if (res.closed) {
  console.log(`${C.G}✓ already closed${C.R} — ${C.B}${res.closed.p.entry}${C.R} (${res.closed.m.id}) is retired. Nothing to claim.`);
  process.exit(0);
}
if (res.error) die(res.error);

const card = res.card;
const p = card.m.payload;

if (card.state === 'claimed') {
  const who = (card.claim && card.claim.from) || '?';
  console.log(`${C.Y}◐ already claimed${C.R} — ${C.B}${p.entry}${C.R} is in flight (claimed by ${who}). Re-claiming; close it when the move lands.\n`);
}

// --- reconciliation heads-up: what changed on the entry since the baton? -----
console.log(`${C.B}CLAIMING${C.R} ${C.B}${p.entry}${C.R}  ${C.D}(${card.m.id})${C.R}`);
if (p.move) console.log(`  move: ${p.move}`);
if (p.handoff_path) console.log(`  baton: ${p.handoff_path}`);
console.log('');

if (p.entry) {
  let hist = '';
  try {
    hist = execSync(
      `git -C "${ROOT}" log --since="${card.m.ts}" --format="%h %cs %s" -- "*${p.entry}*"`,
      { encoding: 'utf8' },
    ).trim();
  } catch { /* ignore */ }
  if (hist) {
    console.log(`${C.Y}⚠ commits touched "${p.entry}" since this baton was posted — the move may already have landed:${C.R}`);
    for (const l of hist.split('\n').slice(0, 8)) console.log(`  ${C.D}${l}${C.R}`);
    console.log(`  ${C.D}→ confirm the move still needs doing before you continue (Baton Ceremony § On pickup).${C.R}`);
  } else {
    console.log(`${C.D}no commits have touched "${p.entry}" since the baton was posted — likely still fresh.${C.R}`);
  }
  console.log('');
}

// --- build the claim --------------------------------------------------------
const note = flags.note || 'Baton caught; starting the move. Will post a close (handoff_closed) when it lands.';
const msg = {
  schema_version: '1.0',
  id: `claim-${slug(p.entry || selector)}-${stamp()}`,
  ts: new Date().toISOString(),
  session_id: flags.from ? slug(flags.from) : `claim-${slug(p.entry || selector)}`,
  from: flags.from || p.entry || 'COORDINATOR',
  to: '*',
  type: 'REPLY',
  board: 'GENERAL',
  re: card.m.id,
  health: stubHealth(flags.model, note),
  payload: {
    kind: 'handoff_picked_up',
    lifecycle: 'claim',                 // marks this a lifecycle-v1 claim, not a legacy terminal pickup
    entry: p.entry,
    handoff_id: card.m.id,
    handoff_path: p.handoff_path,
    receiving_surface: flags.surface || 'Claude Code (Mac)',
    move: p.move,
    note,
  },
};

if (flags.dryRun) {
  console.log(`${C.D}--dry-run — would post (nothing written):${C.R}`);
  console.log(JSON.stringify(msg, null, 2));
  process.exit(0);
}

try {
  postMessage(board, msg);
} catch (e) {
  die(e.message);
}
console.log(`${C.Y}◐ claimed${C.R} — ${C.B}${p.entry}${C.R} is in flight (re: ${card.m.id}). It stays on the board until you close it.`);
console.log(`${C.D}  When the move lands: node _ops/stigmergy/close-handoff.mjs ${card.m.id} --commit <hash>${C.R}`);
