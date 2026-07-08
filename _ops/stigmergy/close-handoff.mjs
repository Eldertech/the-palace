#!/usr/bin/env node
// close-handoff.mjs — CLOSE a handoff (the move landed; retire the card).
//
// The terminal half of the lifecycle. A handoff_closed is the ONLY thing that
// retires a card (besides a grandfathered legacy pickup) — done is never
// inferred. Two rules make the close trustworthy rather than a rubber stamp:
//
//   1. It cites a commit. The assertion "I did it" must point at the evidence,
//      so a later reader can check it against git — the same commits the claim's
//      reconciliation view shows. --commit is required and verified.
//
//   2. Complete, or re-baton the rest. "In the spirit of the original" must not
//      become a hatch for quietly leaving work undone. A --partial close MUST
//      name the --remainder, which this posts as a fresh handoff_ready so the
//      leftover reappears as open work — never a silent gap.
//
// Usage:
//   node _ops/stigmergy/close-handoff.mjs <id | entry> --commit <hash> [--note "..."]
//   node _ops/stigmergy/close-handoff.mjs <id> --commit <hash> --partial \
//        --remainder "what's left" [--remainder-baton <path>]
//   node _ops/stigmergy/close-handoff.mjs <id> --commit <hash> --dry-run
//
// Flags:
//   --commit <hash>        REQUIRED — the commit(s) that landed the move (evidence)
//   --partial              this close did not finish the whole move
//   --remainder <text>     REQUIRED with --partial — what is left to do
//   --remainder-baton <p>  baton path for the remainder (default: reuse the entry's)
//   --from <page>          who closed it (default: the claim's author, else entry)
//   --note <text>          how the move landed; any deviation from the letter
//   --model <id>           health.model (default: claude-opus-4-8)
//   --board <path>         board override (default: owner persistent board)
//   --force                skip the commit-exists verification
//   --dry-run              print what would post; write nothing

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
  if (a === '--partial') { flags.partial = true; continue; }
  if (a === '--force') { flags.force = true; continue; }
  if (a.startsWith('--')) { flags[a.slice(2)] = argv[++i]; continue; }
  positional.push(a);
}
const selector = positional[0];

function die(msg) { console.error(`${C.Rd}✗ ${msg}${C.R}`); process.exit(1); }

if (!selector) die('usage: node _ops/stigmergy/close-handoff.mjs <id | entry> --commit <hash> [--partial --remainder "..."]');
if (!flags.commit || !String(flags.commit).trim()) {
  die('a close must cite evidence — pass --commit <hash> (the commit that landed the move).');
}
if (flags.partial && (!flags.remainder || !String(flags.remainder).trim())) {
  die('a --partial close must name what is left — pass --remainder "<what remains>". It will be posted as a fresh open handoff.');
}

const ROOT = ownerRoot();
const board = boardPath(flags.board);

// Verify the commit resolves (best-effort; --force to skip). This is what makes
// the close a checkable claim rather than a self-report.
if (!flags.force) {
  let ok = false;
  try {
    ok = execSync(`git -C "${ROOT}" cat-file -t ${flags.commit}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim() === 'commit';
  } catch { ok = false; }
  if (!ok) die(`--commit "${flags.commit}" does not resolve to a commit in ${ROOT}. Pass the real hash, or --force if you know better.`);
}

const fold = foldHandoffs(loadBoard(board));
const res = resolveCard(fold, selector);

if (res.closed) {
  console.log(`${C.G}✓ already closed${C.R} — ${C.B}${res.closed.p.entry}${C.R} (${res.closed.m.id}) is retired. Nothing to do.`);
  process.exit(0);
}
if (res.error) die(res.error);

const card = res.card;
const p = card.m.payload;
const from = flags.from || (card.claim && card.claim.from) || p.entry || 'COORDINATOR';

if (card.state === 'open') {
  console.log(`${C.Y}note:${C.R} ${C.B}${p.entry}${C.R} was never formally claimed — closing an OPEN card directly. That's fine (a reconciler closing landed work).\n`);
}

// --- partial: build the remainder handoff_ready first (need its id) ----------
let remainderMsg = null;
if (flags.partial) {
  remainderMsg = {
    schema_version: '1.0',
    id: `${slug(p.entry || selector)}-remainder-${stamp()}`,
    ts: new Date().toISOString(),
    session_id: `close-${slug(p.entry || selector)}`,
    from,
    to: '*',
    type: 'BROADCAST',
    board: 'GENERAL',
    health: stubHealth(flags.model, `Remainder spawned from partial close of ${card.m.id}.`),
    payload: {
      kind: 'handoff_ready',
      entry: p.entry,
      handoff_path: flags['remainder-baton'] || p.handoff_path,
      receiving_surface: p.receiving_surface || 'Claude Code (Mac)',
      move: flags.remainder,
      worktree: p.worktree,                       // remainder lives where the work lives
      note: `Spawned from the partial close of ${card.m.id}. The rest of that move remains.`,
      invocation: p.entry ? `Read ${p.entry}.md and the baton, then pick up the remaining move.` : undefined,
    },
  };
}

// --- build the close --------------------------------------------------------
const completion = flags.partial ? 'partial' : 'complete';
const note = flags.note
  || (flags.partial
    ? `Landed part of the move in ${flags.commit}; remainder re-batoned.`
    : `Move landed in ${flags.commit}, in the spirit of the original.`);

const closeMsg = {
  schema_version: '1.0',
  id: `close-${slug(p.entry || selector)}-${stamp()}`,
  ts: new Date().toISOString(),
  session_id: `close-${slug(p.entry || selector)}`,
  from,
  to: '*',
  type: 'REPLY',
  board: 'GENERAL',
  re: card.m.id,
  health: stubHealth(flags.model, note),
  payload: {
    kind: 'handoff_closed',
    entry: p.entry,
    handoff_id: card.m.id,
    completion,                                   // "complete" | "partial"
    commit: flags.commit,
    remainder_handoff_id: remainderMsg ? remainderMsg.id : undefined,
    move: p.move,
    note,
  },
};

if (flags.dryRun) {
  console.log(`${C.D}--dry-run — would post (nothing written):${C.R}`);
  if (remainderMsg) { console.log(`\n${C.Y}① remainder handoff_ready:${C.R}`); console.log(JSON.stringify(remainderMsg, null, 2)); }
  console.log(`\n${C.G}${remainderMsg ? '②' : '①'} handoff_closed:${C.R}`);
  console.log(JSON.stringify(closeMsg, null, 2));
  process.exit(0);
}

try {
  if (remainderMsg) postMessage(board, remainderMsg);   // remainder first, so the close can reference it
  postMessage(board, closeMsg);
} catch (e) {
  die(e.message);
}

console.log(`${C.G}✓ closed${C.R} — ${C.B}${p.entry}${C.R} (${completion}) retired on the board. commit ${flags.commit}.`);
if (remainderMsg) {
  console.log(`${C.Y}◦ remainder re-batoned${C.R} — a fresh OPEN handoff for the rest: ${C.D}${remainderMsg.id}${C.R}`);
  console.log(`${C.D}  "${flags.remainder}"${C.R}`);
}
console.log(`${C.D}  Remaining housekeeping: delete the baton file & remove the Active Baton pointer, then commit.${C.R}`);
