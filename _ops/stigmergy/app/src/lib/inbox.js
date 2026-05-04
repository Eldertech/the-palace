// Trickster decision inbox — filtered view of the TRICKSTER board
// presenting only pending RESOURCE_REQUESTs that have no matching
// RESOURCE_GRANT or RESOURCE_DENY response.
//
// Per Infrastructure Spec §2.6, the inbox data structure is:
//   {
//     pending_requests: [
//       {
//         request_id, from, ts, resource, rationale, blocking,
//         agent_health, agent_context_pct, agent_status,
//         response_options
//       }
//     ]
//   }
// The four response_options are static per the spec (not per-request).

const RESPONSE_OPTIONS = [
  { label: 'Grant -- limited',   type: 'RESOURCE_GRANT', constraints: '<your constraints>' },
  { label: 'Grant -- unlimited', type: 'RESOURCE_GRANT', constraints: null },
  { label: 'Deny -- use palace only', type: 'RESOURCE_DENY', reason: 'Use palace material only' },
  { label: 'Custom response',   type: 'freetext' },
];

function ifPresent(v, dflt) {
  return v === undefined || v === null ? dflt : v;
}

export function buildInbox(messages) {
  if (!Array.isArray(messages)) return { pending_requests: [] };

  // Restrict to TRICKSTER-board messages — the protocol surface.
  const trickster = messages.filter((m) => m && m.board === 'TRICKSTER');

  // Build a set of request_ids that have already been responded to.
  const responded = new Set();
  for (const m of trickster) {
    if ((m.type === 'RESOURCE_GRANT' || m.type === 'RESOURCE_DENY') && m.re) {
      responded.add(m.re);
    }
  }

  // Filter for unresponded RESOURCE_REQUESTs and shape them per §2.6.
  const pending_requests = trickster
    .filter((m) => m.type === 'RESOURCE_REQUEST' && !responded.has(m.request_id))
    .map((m) => {
      const payload = m.payload || {};
      return {
        request_id: m.request_id,
        from: m.from,
        ts: m.ts,
        resource: payload.resource,
        rationale: payload.rationale,
        query_intent: payload.query_intent,
        blocking: payload.blocking === true,
        agent_health: m.health?.score,
        agent_context_pct: m.health?.context_pct,
        agent_status: payload.blocking === true
          ? 'suspended_on_this_thread'
          : 'continuing',
        response_options: RESPONSE_OPTIONS,
        // Source message fields needed by ResponseModal to build the response.
        // _message_id: the source message's own `id` field (not the correlation id).
        // _session_id: the source message's session_id.
        _message_id: m.id,
        _session_id: m.session_id,
      };
    });

  // Sort by ts ascending — oldest pending request first (longest waiting).
  pending_requests.sort((a, b) => String(a.ts).localeCompare(String(b.ts)));
  return { pending_requests };
}
