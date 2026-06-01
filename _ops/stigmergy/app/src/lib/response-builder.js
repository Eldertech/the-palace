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
export function buildResponse({ request, decision, constraints, notes, sessionId }) {
  if (decision !== 'GRANT' && decision !== 'DENY') {
    throw new Error(`decision must be 'GRANT' or 'DENY', got "${decision}"`);
  }

  const type = decision === 'GRANT' ? 'RESOURCE_GRANT' : 'RESOURCE_DENY';

  const payload =
    decision === 'GRANT'
      ? { granted: true, constraints: constraints ?? 'no constraints' }
      : { granted: false, reason: constraints ?? 'no reason given' };

  // notes is a free-form addendum the human typed in the modal. Match the
  // existing convention (see buildRequestOptionResponse) -- a separate
  // payload key the asking agent can read on top of the structured fields.
  if (typeof notes === 'string' && notes.trim() !== '') {
    payload.notes = notes.trim();
  }

  return {
    schema_version: '1.0',
    id: generateId(),
    ts: new Date().toISOString(),
    session_id: sessionId ?? request.session_id,
    from: 'TRICKSTER',
    to: request.from,
    type,
    board: 'TRICKSTER',
    re: request.request_id ?? request.id,
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

/**
 * Build a §2.2-conformant RESOURCE_GRANT for a request-supplied option.
 *
 * Used by the inline inbox response flow when a RESOURCE_REQUEST carries
 * its own payload.options[] (a/b/c-style choices designed by the asker).
 * Either optionId/optionLabel or notes (or both) may be present; at least
 * one must be non-empty.
 *
 * The wire-type is RESOURCE_GRANT so the existing inbox-builder treats this
 * as a response to the request. The actual semantics (which option was
 * picked; what the freeform notes say) live in payload.option_id /
 * payload.option_label / payload.notes — readable by the asking agent.
 *
 * @param {object} options
 * @param {object} options.request       — the original RESOURCE_REQUEST message
 * @param {string|null} [options.optionId]    — id of the chosen option (or null for pure freeform)
 * @param {string|null} [options.optionLabel] — label of the chosen option (mirrors id)
 * @param {string} [options.notes]            — freeform text (added depth or pure-freeform reply)
 * @param {string} [options.sessionId]        — override session_id (defaults to request.session_id)
 * @returns {object} a fully §2.2-conformant message ready for postMessage()
 */
export function buildRequestOptionResponse({ request, optionId, optionLabel, notes, sessionId }) {
  const id = (typeof optionId === 'string' && optionId.trim() !== '') ? optionId : null;
  const label = (typeof optionLabel === 'string' && optionLabel.trim() !== '') ? optionLabel : null;
  const text = (typeof notes === 'string' && notes.trim() !== '') ? notes : '';

  if (!id && !text) {
    throw new Error('buildRequestOptionResponse requires at least one of optionId or notes');
  }

  return {
    schema_version: '1.0',
    id: generateId(),
    ts: new Date().toISOString(),
    session_id: sessionId ?? request.session_id,
    from: 'TRICKSTER',
    to: request.from,
    type: 'RESOURCE_GRANT',
    board: 'TRICKSTER',
    re: request.request_id ?? request.id,
    health: {
      context_pct: 0,
      stop_reason: 'human_decision',
      iteration: 1,
      tokens_this_call: 0,
      model: 'loudon-trickster',
      score: 'green',
    },
    payload: {
      granted: true,
      option_id: id,
      option_label: label,
      notes: text,
    },
  };
}
