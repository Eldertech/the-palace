// src/lib/response-builder.js — build §2.2-conformant response messages.
//
// Builds a RESOURCE_GRANT or RESOURCE_DENY message from a pending
// RESOURCE_REQUEST and a decision. The output is immediately valid per
// server/validator.js's strict rules.
//
// Usage:
//   import { buildResponse } from '../lib/response-builder.js';
//   const msg = buildResponse({ request, decision: 'GRANT', constraints: 'limited to 3 calls' });

/**
 * Generate a collision-resistant id for a response message.
 * Uses Date.now (millisecond resolution) plus random bits — no external deps.
 * @returns {string}
 */
function generateId() {
  return 'resp-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

/**
 * Build a §2.2-conformant RESOURCE_GRANT or RESOURCE_DENY message.
 *
 * @param {object} options
 * @param {object} options.request        — the original RESOURCE_REQUEST message
 * @param {'GRANT'|'DENY'} options.decision
 * @param {string|object} [options.constraints] — reason / constraints for the decision
 * @param {string} [options.sessionId]    — override session_id (defaults to request.session_id)
 * @returns {object} a fully §2.2-conformant message ready for postMessage()
 */
export function buildResponse({ request, decision, constraints, sessionId }) {
  if (decision !== 'GRANT' && decision !== 'DENY') {
    throw new Error(`decision must be 'GRANT' or 'DENY', got "${decision}"`);
  }

  const type = decision === 'GRANT' ? 'RESOURCE_GRANT' : 'RESOURCE_DENY';

  const payload =
    decision === 'GRANT'
      ? { granted: true, constraints: constraints ?? 'no constraints' }
      : { granted: false, reason: constraints ?? 'no reason given' };

  return {
    schema_version: '1.0',
    id: generateId(),
    ts: new Date().toISOString(),
    session_id: sessionId ?? request.session_id,
    from: 'TRICKSTER',
    to: request.from,
    type,
    board: 'TRICKSTER',
    re: request.id,
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
