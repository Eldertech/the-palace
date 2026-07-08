// handoff-model.mjs — the shared read-model for the handoff lifecycle.
//
// One place folds the append-only board into handoff state, so list / claim /
// close can never disagree about what "open" means. This is the CQRS read side:
// the board is the event log, this is the projection.
//
// The lifecycle (rung 1 of the Reliable Handoff ladder — see STIGMERGY.md
// § Handoff Lifecycle):
//
//   handoff_ready                          → OPEN     (available to catch)
//   handoff_picked_up  (lifecycle: claim)  → CLAIMED  (in flight; stays visible)
//   handoff_closed                         → CLOSED   (done; retired)
//
// A card is retired ONLY by an explicit closed event — done is never inferred
// from git or the filesystem (that was the bug we removed 2026-07-07). The one
// exception is migration: a LEGACY handoff_picked_up (no `lifecycle: "claim"`
// marker — every pickup posted before this lifecycle existed) is grandfathered
// as terminal, because those pickups were start-claims for work that has since
// landed. New claims carry the marker and only a handoff_closed retires them.
//
// Rungs 2–4 (lease/TTL, heartbeat→fade, dead-letter) are deferred by design.

import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { validateMessage } from './core/schema/validator.js';
import { appendMessage } from './core/blackboard/jsonl.js';

const HERE = dirname(fileURLToPath(import.meta.url));

// ANSI — shared so every script looks the same.
export const C = {
  B: '\x1b[1m', D: '\x1b[2m', G: '\x1b[32m', Y: '\x1b[33m', Rd: '\x1b[31m', R: '\x1b[0m',
};

// Resolve the OWNER (main) worktree. Palace convention: every worktree appends
// to the owner's physical board, never its own per-branch copy, so the field
// stays single and convergent. `git worktree list --porcelain` lists main first.
export function ownerRoot() {
  try {
    const out = execSync('git worktree list --porcelain', { cwd: HERE, encoding: 'utf8' });
    const first = out.split('\n').find((l) => l.startsWith('worktree '));
    if (first) return first.slice('worktree '.length).trim();
  } catch { /* fall through */ }
  return resolve(HERE, '../..');
}

// The board to read/write: an explicit override (test scratch board), else the
// STIGMERGY_BOARD env var, else the owner's persistent board.
export function boardPath(override) {
  if (override) return resolve(override);
  if (process.env.STIGMERGY_BOARD) return resolve(process.env.STIGMERGY_BOARD);
  return resolve(ownerRoot(), '_ops/swarm/persistent/blackboard.jsonl');
}

export function loadBoard(board) {
  return readFileSync(board, 'utf8').trim().split('\n')
    .map((l) => { try { return JSON.parse(l); } catch { return null; } })
    .filter(Boolean);
}

// Does a lifecycle message point at handoff id `readyId`? Two forms are honored:
// a message-level `re` (the documented REPLY form) or a `payload.handoff_id`.
function pointsAt(m, readyId) {
  return m.re === readyId || (m.payload && m.payload.handoff_id === readyId);
}

// Fold the log into { open, claimed, closed } — each a list of cards. A card is
// { m, p, state, claim, close }: the ready message, its payload, its state, and
// the claim/close events that set that state (null when absent).
export function foldHandoffs(lines) {
  const readies = lines.filter((m) => (m.payload || {}).kind === 'handoff_ready');
  const pickups = lines.filter((m) => (m.payload || {}).kind === 'handoff_picked_up');
  const closes = lines.filter((m) => (m.payload || {}).kind === 'handoff_closed');

  const cards = readies.map((m) => {
    const close = closes.find((c) => pointsAt(c, m.id)) || null;
    const relatedPickups = pickups.filter((pk) => pointsAt(pk, m.id));
    // A legacy pickup (no claim marker) is terminal — grandfather it as a close.
    const legacyPickup = relatedPickups.find((pk) => (pk.payload || {}).lifecycle !== 'claim') || null;
    const claim = relatedPickups.find((pk) => (pk.payload || {}).lifecycle === 'claim') || null;

    let state, closedBy = null;
    if (close) { state = 'closed'; closedBy = close; }
    else if (legacyPickup) { state = 'closed'; closedBy = legacyPickup; }
    else if (claim) { state = 'claimed'; }
    else { state = 'open'; }

    return { m, p: m.payload, state, claim, close: closedBy };
  });

  return {
    open: cards.filter((c) => c.state === 'open'),
    claimed: cards.filter((c) => c.state === 'claimed'),
    closed: cards.filter((c) => c.state === 'closed'),
    all: cards,
  };
}

// Find a single OPEN-or-CLAIMED card by exact id, else by unique entry name.
// Returns { card } or { error } or { closed } (already terminal).
export function resolveCard(fold, selector) {
  const active = [...fold.open, ...fold.claimed];
  let card = active.find((c) => c.m.id === selector);
  if (!card) {
    const byEntry = active.filter(
      (c) => (c.p.entry || '').toLowerCase() === selector.toLowerCase(),
    );
    if (byEntry.length === 1) card = byEntry[0];
    else if (byEntry.length > 1) {
      return { error: `"${selector}" matches ${byEntry.length} active handoffs — pass an id:\n` +
        byEntry.map((c) => `    ${c.m.id}  [${c.state}]  ${(c.p.move || '').slice(0, 46)}`).join('\n') };
    }
  }
  if (card) return { card };
  const closed = fold.closed.find((c) => c.m.id === selector);
  if (closed) return { closed };
  return { error: `no active handoff matches "${selector}". Run list-handoffs.mjs to see open ids.` };
}

// Validate then append. Throws with the validator's errors on a bad message —
// the board never takes a malformed line.
export function postMessage(board, msg) {
  const check = validateMessage(msg);
  if (!check.valid) {
    const detail = check.errors.map((e) => `  ${e.path}: ${e.message}`).join('\n');
    throw new Error(`invalid message — not posting:\n${detail}`);
  }
  return appendMessage(board, msg);
}

export function age(ts) {
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

export function slug(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'handoff';
}

export function stamp() {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
}

// A hand-authored stub health block (§9: hand-authored + Path-2 carry a green stub).
export function stubHealth(model, note) {
  return {
    score: 'green',
    model: model || 'claude-opus-4-8',
    _orchestrator_metadata: { dispatch_mode: 'hand-authored', note },
  };
}
