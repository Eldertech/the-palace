#!/usr/bin/env node
// list-handoffs.mjs — the "list handoffs" fast path.
//
// Reads the persistent blackboard, finds every open handoff_ready card, and
// git-checks each one so a stale ghost (its entry committed after the baton was
// posted) is flagged, not presented as live work. This is the by-hand read
// Claude did on 2026-07-03, frozen into one command.
//
// Open  = a handoff_ready with no matching handoff_picked_up ack on the board.
// Live  = open AND no commit has touched its entry since it was posted.
// Ghost = open BUT a later commit touched its entry — the move already landed.
//
// Usage:  node _ops/stigmergy/list-handoffs.mjs
// Run from anywhere; paths resolve against this file.

import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));

// Resolve the OWNER (main) worktree, not wherever this copy is checked out.
// Palace convention: every worktree appends to the owner's physical board, so
// a worktree-local blackboard.jsonl can be stale — always read the owner's.
// `git worktree list --porcelain` lists the main worktree first.
function ownerRoot() {
  try {
    const out = execSync('git worktree list --porcelain', { cwd: HERE, encoding: 'utf8' });
    const first = out.split('\n').find((l) => l.startsWith('worktree '));
    if (first) return first.slice('worktree '.length).trim();
  } catch { /* fall through */ }
  return resolve(HERE, '../..');                            // fallback: this checkout's root
}

const ROOT = ownerRoot();
const BOARD = resolve(ROOT, '_ops/swarm/persistent/blackboard.jsonl');

const lines = readFileSync(BOARD, 'utf8').trim().split('\n')
  .map((l) => { try { return JSON.parse(l); } catch { return null; } })
  .filter(Boolean);

// Board-level pickup acks retire a card immediately.
const acked = new Set();
for (const m of lines) {
  const p = m.payload || {};
  if (p.kind === 'handoff_picked_up' && typeof p.handoff_id === 'string') acked.add(p.handoff_id);
}

const open = lines
  .filter((m) => (m.payload || {}).kind === 'handoff_ready' && !acked.has(m.id));

// git: most-recent commit touching an entry's files, as epoch ms (or 0).
function lastTouch(entry) {
  if (!entry) return { ms: 0, hash: null };
  try {
    const out = execSync(
      `git -C "${ROOT}" log -1 --format=%cI%x09%h -- "*${entry}*"`,
      { encoding: 'utf8' },
    ).trim();
    if (!out) return { ms: 0, hash: null };
    const [iso, hash] = out.split('\t');
    return { ms: Date.parse(iso), hash };
  } catch {
    return { ms: 0, hash: null };
  }
}

function age(ts) {
  const then = Date.parse(ts);
  if (!Number.isFinite(then)) return '?';
  const d = Math.max(0, Date.now() - then);
  const m = Math.floor(d / 60000), h = Math.floor(m / 60), day = Math.floor(h / 24);
  if (m < 60) return `${m}m`;
  if (h < 24) return `${h}h`;
  if (day < 7) return `${day}d`;
  if (day < 30) return `${Math.floor(day / 7)}w`;
  if (day < 365) return `${Math.floor(day / 30)}mo`;
  return `${Math.floor(day / 365)}y`;
}

const cards = open.map((m) => {
  const p = m.payload;
  const touch = lastTouch(p.entry);
  const posted = Date.parse(m.ts);
  const ghost = touch.ms > posted;
  return { m, p, ghost, touch, posted };
});

const live = cards.filter((c) => !c.ghost);
const ghosts = cards.filter((c) => c.ghost);

const B = '\x1b[1m', D = '\x1b[2m', G = '\x1b[32m', Y = '\x1b[33m', R = '\x1b[0m';

if (cards.length === 0) {
  console.log(`${B}HANDOFFS${R} — none open. Clean board.`);
} else {
  console.log(`${B}HANDOFFS${R} — ${cards.length} open (${G}${live.length} live${R}, ${D}${ghosts.length} superseded${R})\n`);
}

for (const c of live) {
  const wt = c.p.worktree;
  console.log(`${G}●${R} ${B}${c.p.entry}${R}  ${D}[${age(c.m.ts)} · ${c.m.from}]${R}`);
  if (c.p.move) console.log(`    ${c.p.move}`);
  if (wt) console.log(`    ${D}→ worktree ${wt.branch} (${wt.dir})${R}`);
  if (c.p.handoff_path) console.log(`    ${D}baton: ${c.p.handoff_path}${R}`);
  console.log('');
}

if (ghosts.length) {
  console.log(`${D}${Y}○ superseded — entry committed after the baton was posted:${R}`);
  for (const c of ghosts) {
    console.log(`  ${D}${c.p.entry} — ${(c.p.move || c.p.summary || '').slice(0, 60)}  [${age(c.m.ts)}, commit ${c.touch.hash} after]${R}`);
  }
}
