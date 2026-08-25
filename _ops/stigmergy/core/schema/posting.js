// posting.js — outgoing-message validation + posting discipline §3.4.
//
// Imports the canonical strict §2.2 validator from STIGMERGY v0.2 (single
// source of truth — see Decisions table). Adds posting-discipline checks on
// top of the schema validation:
//   - Gap 9: `request_id` must be top-level on RESOURCE_REQUEST and the new
//            DIRECTIVE_REQUEST type. (DIRECTIVE_REQUEST is not yet in §2.2's
//            strict enum, so this orchestrator emits it as RESOURCE_REQUEST
//            with a `payload.directive: true` flag until §2.3 lands. Documented
//            as a v0.2-orchestrator follow-up.)
//   - SPINNING UP required on first cycle of an agent (per §3.4 SPAWN posture).
//   - Board routing: RESOURCE_REQUEST/RESOURCE_GRANT/RESOURCE_DENY must go to
//     the TRICKSTER board. SESSION_INIT/SESSION_CLOSE must go to SYSTEM. PROOF
//     must go to WEAVE.

import { validateMessage } from './validator.js';


const BOARD_BY_TYPE = {
  RESOURCE_REQUEST: 'TRICKSTER',
  RESOURCE_GRANT: 'TRICKSTER',
  RESOURCE_DENY: 'TRICKSTER',
  SESSION_INIT: 'SYSTEM',
  SESSION_CLOSE: 'SYSTEM',
  PROOF: 'WEAVE',
};

/**
 * Run the full posting-discipline check on an outgoing message.
 *
 * Returns { valid: true } or { valid: false, errors: [...] }. Errors are
 * a mixture of §2.2 schema errors (forwarded from validateMessage) and
 * §3.4 discipline errors (added here).
 *
 * @param {object} message
 * @param {{ priorMessages?: Array<object>, agentId?: string }} [opts]
 */
export function validateForPosting(message, opts = {}) {
  // 1. Strict §2.2 schema first — short-circuit if invalid.
  const schemaResult = validateMessage(message);
  const errors = [];
  if (!schemaResult.valid) {
    errors.push(...schemaResult.errors);
  }

  // 2. Gap 9: top-level request_id required for RESOURCE_REQUEST.
  if (message && message.type === 'RESOURCE_REQUEST') {
    if (typeof message.request_id !== 'string' || message.request_id.trim() === '') {
      errors.push({
        path: 'request_id',
        message: 'RESOURCE_REQUEST must carry a top-level "request_id" (Gap 9 — §2.5 example, NOT inside payload)',
      });
    }
  }

  // 3. Top-level `re` required for RESOURCE_GRANT and RESOURCE_DENY (correlation).
  if (message && (message.type === 'RESOURCE_GRANT' || message.type === 'RESOURCE_DENY')) {
    if (typeof message.re !== 'string' || message.re.trim() === '') {
      errors.push({
        path: 're',
        message: `${message.type} must carry a top-level "re" matching the original RESOURCE_REQUEST id`,
      });
    }
  }

  // 4. Board routing.
  if (message && typeof message.type === 'string') {
    const expectedBoard = BOARD_BY_TYPE[message.type];
    if (expectedBoard && message.board !== expectedBoard) {
      errors.push({
        path: 'board',
        message: `${message.type} must be posted to ${expectedBoard} board, not "${message.board}"`,
      });
    }
  }

  // 5. SPINNING UP discipline: an agent's first message of a session must be
  // a BROADCAST to GENERAL announcing arrival. Only checked when priorMessages
  // and agentId are provided.
  if (opts.priorMessages && opts.agentId) {
    const priorFromAgent = opts.priorMessages.filter((m) => m && m.from === opts.agentId);
    if (priorFromAgent.length === 0) {
      // This is the agent's first message — must be a BROADCAST to GENERAL.
      if (message.type !== 'BROADCAST' || message.board !== 'GENERAL') {
        errors.push({
          path: '',
          message: `posting discipline §3.4: agent "${opts.agentId}" first message must be BROADCAST to GENERAL (the SPINNING UP announcement) — got ${message.type} on ${message.board}`,
        });
      }
    }
  }

  // 6. Duplicate-FLAG suppression. If priorMessages provided, reject if this
  // FLAG's claim+target_entries exactly matches a prior FLAG from same agent.
  if (opts.priorMessages && message && message.type === 'FLAG' && message.payload) {
    const fingerprint = JSON.stringify({
      claim: message.payload.claim ?? null,
      targets: message.payload.target_entries ?? null,
    });
    const dup = opts.priorMessages.find(
      (m) => m && m.from === message.from && m.type === 'FLAG'
        && m.payload && JSON.stringify({
          claim: m.payload.claim ?? null,
          targets: m.payload.target_entries ?? null,
        }) === fingerprint
    );
    if (dup) {
      errors.push({
        path: 'payload',
        message: `posting discipline §3.4: duplicate FLAG (same claim+target_entries as prior message ${dup.id})`,
      });
    }
  }

  if (errors.length > 0) return { valid: false, errors };
  return { valid: true };
}
