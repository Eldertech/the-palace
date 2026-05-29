// inbox.js — Phase 0. Rebuild the Trickster inbox from the board (§2.6).
//
// The inbox is the set of RESOURCE_REQUEST messages that have NOT yet received
// a RESOURCE_GRANT or RESOURCE_DENY correlated by top-level `re`. This mirrors
// the STIGMERGY inbox builder: scan from the beginning, track which
// request_ids have been answered, return the unanswered ones — parsed into the
// stable record shape from parse.js.

import { parseRequest } from './parse.js';

/**
 * @param {Array<object>} messages — parsed board messages, in board order
 * @returns {{
 *   pending: Array<ReturnType<typeof parseRequest>>,
 *   answeredIds: Set<string>,
 *   counts: { requests: number, answered: number, pending: number }
 * }}
 */
export function buildInbox(messages) {
  const answeredIds = new Set();
  for (const m of messages) {
    if (m && (m.type === 'RESOURCE_GRANT' || m.type === 'RESOURCE_DENY')) {
      const re = typeof m.re === 'string' && m.re.trim() !== '' ? m.re : null;
      if (re) answeredIds.add(re);
    }
  }

  const requests = messages.filter((m) => m && m.type === 'RESOURCE_REQUEST');
  // De-duplicate by request_id, keeping the LAST occurrence (a re-posted
  // request supersedes its earlier form — matches the gsl-steward-004 →
  // gsl-steward-005 supersession pattern seen on the live board).
  const byId = new Map();
  for (const r of requests) {
    const id = typeof r.request_id === 'string' ? r.request_id : `__noid__${byId.size}`;
    byId.set(id, r);
  }

  const pending = [];
  for (const [id, msg] of byId) {
    if (answeredIds.has(id)) continue;
    pending.push(parseRequest(msg));
  }

  return {
    pending,
    answeredIds,
    counts: {
      requests: byId.size,
      answered: [...byId.keys()].filter((id) => answeredIds.has(id)).length,
      pending: pending.length,
    },
  };
}
