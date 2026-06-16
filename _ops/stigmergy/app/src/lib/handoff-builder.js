// handoff-builder.js — build the §2.2 message that marks a board-announced
// baton (a handoff_ready BROADCAST) as picked up.
//
// Mirrors the Baton Ceremony's On-pickup step ("post the paired
// handoff_picked_up referencing the handoff_ready id") and queue-model's ack
// path: buildQueue drops a handoff_ready item once a message carries
// payload.handoff_id === that handoff_ready message's id. We set both the
// `re` correlation (ceremony fidelity) and payload.handoff_id (what the queue
// actually keys on), so the QUEUE item clears and the board reads honestly.

function generateId() {
  return 'pickup-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

export function buildHandoffPickup({ handoffId, note, sessionId } = {}) {
  if (typeof handoffId !== 'string' || handoffId.trim() === '') {
    throw new Error('buildHandoffPickup requires a non-empty handoffId');
  }
  const payload = { kind: 'handoff_picked_up', handoff_id: handoffId };
  if (typeof note === 'string' && note.trim() !== '') payload.note = note.trim();

  return {
    schema_version: '1.0',
    id: generateId(),
    ts: new Date().toISOString(),
    session_id: sessionId || 'trickster-handoff-pickup',
    from: 'TRICKSTER',
    to: '*',
    type: 'BROADCAST',
    board: 'GENERAL',
    re: handoffId,
    // Human node marks the pickup — the full (Path 1) health stub the other
    // TRICKSTER-authored messages use (see response-builder.js).
    health: {
      context_pct: 0,
      stop_reason: 'human_decision',
      iteration: 1,
      tokens_this_call: 0,
      model: 'loudon-trickster',
      score: 'green',
    },
    payload,
  };
}
