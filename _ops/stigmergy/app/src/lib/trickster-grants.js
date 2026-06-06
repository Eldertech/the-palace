// trickster-grants.js — pure §2.2 grant builders for the Trickster deck.
//
// No React, no I/O — so the deck's write path is unit-testable without a DOM.
// buildCardGrant() maps a buildInbox() pending item onto the wire response
// builder; buildLeanGrants() turns a list of pending items into the grants
// FILE ALL / space-to-file would POST, skipping any card without a lean.

import { buildRequestOptionResponse } from './response-builder.js';

/**
 * Build a §2.2-conformant RESOURCE_GRANT for a single card decision.
 *
 * @param {object} item — a pending_requests[] entry from buildInbox()
 * @param {object} pick — { optionId?, optionLabel?, notes? }
 * @returns {object} a wire-conformant message ready for postMessage()
 */
export function buildCardGrant(item, { optionId = null, optionLabel = null, notes = '' } = {}) {
  return buildRequestOptionResponse({
    request: {
      id: item._message_id,
      from: item.from,
      request_id: item.request_id,
      session_id: item._session_id,
    },
    optionId,
    optionLabel,
    notes,
    sessionId: item._session_id,
  });
}

/**
 * Build the grants FILE ALL (or space-to-file) would POST: one per pending
 * item that carries a detected lean (item.recommended_option). Items with no
 * lean are skipped — those are deliberately the human's call, and FILE ALL
 * must never silently file them. Returns {item, message} pairs so the caller
 * can POST each and reconcile per request.
 *
 * @param {object[]} pendingRequests
 * @returns {{item: object, message: object}[]}
 */
export function buildLeanGrants(pendingRequests) {
  return (pendingRequests || [])
    .filter((p) => p && p.recommended_option && p.recommended_option.id)
    .map((p) => ({
      item: p,
      message: buildCardGrant(p, {
        optionId: p.recommended_option.id,
        optionLabel: p.recommended_option.label,
      }),
    }));
}
