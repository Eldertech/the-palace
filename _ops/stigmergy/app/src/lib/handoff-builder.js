// handoff-builder.js — build the §2.2 messages that drive a board-announced
// baton (a handoff_ready BROADCAST) through its lifecycle from the QUEUE deck.
//
// Three states (STIGMERGY.md § Handoff Lifecycle; mirrors the CLI
// _ops/stigmergy/{pickup,close}-handoff.mjs and the buildQueue fold):
//   claim  → handoff_picked_up with `lifecycle: "claim"`  → card goes CLAIMED
//            (in flight; it STAYS on the board — a claim is not a close).
//   close  → handoff_closed                                → card is retired.
//
// Both name the handoff two ways — the top-level `re` correlation (ceremony
// fidelity) and payload.handoff_id (what the queue fold keys on) — so the QUEUE
// item transitions and the board reads honestly.

function generateId(prefix) {
  return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

// The full (human-node) health stub the other TRICKSTER-authored messages use.
function tricksterHealth() {
  return {
    context_pct: 0,
    stop_reason: 'human_decision',
    iteration: 1,
    tokens_this_call: 0,
    model: 'loudon-trickster',
    score: 'green',
  };
}

function baseMessage({ idPrefix, handoffId, sessionId, payload }) {
  return {
    schema_version: '1.0',
    id: generateId(idPrefix),
    ts: new Date().toISOString(),
    session_id: sessionId || 'trickster-handoff',
    from: 'TRICKSTER',
    to: '*',
    type: 'BROADCAST',
    board: 'GENERAL',
    re: handoffId,
    health: tricksterHealth(),
    payload,
  };
}

// CLAIM — mark a baton caught and in flight. The card moves to CLAIMED and
// stays visible until it is closed.
export function buildHandoffClaim({ handoffId, note, sessionId } = {}) {
  if (typeof handoffId !== 'string' || handoffId.trim() === '') {
    throw new Error('buildHandoffClaim requires a non-empty handoffId');
  }
  const payload = { kind: 'handoff_picked_up', lifecycle: 'claim', handoff_id: handoffId };
  if (typeof note === 'string' && note.trim() !== '') payload.note = note.trim();
  return baseMessage({ idPrefix: 'claim', handoffId, sessionId: sessionId || 'trickster-handoff-claim', payload });
}

// CLOSE — retire a baton. This is the only thing (besides a grandfathered
// legacy pickup) that drops a handoff_ready from the queue. `commit` is the
// evidence when the close follows a landed move; a manual board clear may omit
// it (it is an honest human override, noted as such).
export function buildHandoffClose({ handoffId, note, commit, completion, sessionId } = {}) {
  if (typeof handoffId !== 'string' || handoffId.trim() === '') {
    throw new Error('buildHandoffClose requires a non-empty handoffId');
  }
  const payload = { kind: 'handoff_closed', handoff_id: handoffId, completion: completion === 'partial' ? 'partial' : 'complete' };
  if (typeof commit === 'string' && commit.trim() !== '') payload.commit = commit.trim();
  if (typeof note === 'string' && note.trim() !== '') payload.note = note.trim();
  return baseMessage({ idPrefix: 'close', handoffId, sessionId: sessionId || 'trickster-handoff-close', payload });
}
