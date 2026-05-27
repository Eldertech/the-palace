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
//         response_options,        // static fallback (Grant/Deny/Custom)
//         options,                 // request-supplied options[] (a/b/c style), or null
//       }
//     ]
//   }
//
// The four response_options are static per the original §2.6. In v0.2.x, when
// a RESOURCE_REQUEST carries its own payload.options[] (request-shaped a/b/c
// choices), the inbox UI renders those instead and posts an inline response.
// The static four remain as the fallback for legacy requests with no options[].

const RESPONSE_OPTIONS = [
  { label: 'Grant -- limited',   type: 'RESOURCE_GRANT', constraints: '<your constraints>' },
  { label: 'Grant -- unlimited', type: 'RESOURCE_GRANT', constraints: null },
  { label: 'Deny -- use palace only', type: 'RESOURCE_DENY', reason: 'Use palace material only' },
  { label: 'Custom response',   type: 'freetext' },
];

// Validate and normalize a request's payload.options[] to inbox shape.
// Returns null if the field is absent or malformed.
// Each normalized option is { id, label, next? }.
//
// Two input shapes are accepted, both producing the same output shape:
//
//   1. Canonical object form:  { id, label, next? }
//
//   2. Lenient string form:    "ID — full description"
//      The id is the leading token before whitespace + em-dash, en-dash,
//      hyphen, or colon (e.g. "APPROVE", "tweak-model", "accept"); the
//      label is the entire original string. The leading-token convention
//      keeps the click surface concise while preserving the asker's prose.
//      If no separator is present, the whole string is used as both id
//      and label (truncated id at 32 chars).
//
// The lenient string form exists because asker-defined options are written
// by stewards (LLM page-agents) — a stricter contract would silently drop
// imperfect output and fall back to the generic response-options template,
// which is worse than rendering an approximate id. See Infrastructure Spec
// §2.6 (asker-defined options[]).
function normalizeRequestOptions(raw) {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const out = [];
  for (const o of raw) {
    if (o === null || o === undefined) continue;

    // Canonical object form: { id, label, next? }.
    if (typeof o === 'object' && !Array.isArray(o)) {
      const id = typeof o.id === 'string' && o.id.trim() !== '' ? o.id : null;
      const label = typeof o.label === 'string' && o.label.trim() !== '' ? o.label : null;
      if (!id || !label) continue;
      const next = typeof o.next === 'string' && o.next.trim() !== '' ? o.next : null;
      out.push(next ? { id, label, next } : { id, label });
      continue;
    }

    // Lenient string form: "ID — full description".
    if (typeof o === 'string' && o.trim() !== '') {
      const s = o.trim();
      // Leading id token: letters/digits/underscore/hyphen, then optional
      // whitespace + separator (em-dash, en-dash, ASCII hyphen, colon),
      // then mandatory whitespace. The mandatory trailing whitespace keeps
      // hyphenated ids like "tweak-model" intact.
      const m = s.match(/^([A-Za-z0-9][A-Za-z0-9_-]*)\s*[—–\-:]\s+/);
      const id = m ? m[1] : s.slice(0, 32);
      out.push({ id, label: s });
      continue;
    }
  }
  return out.length > 0 ? out : null;
}

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
        // Request-supplied options[] (a/b/c style) when the asker designed
        // its own response shape; null when the request relies on the static
        // RESPONSE_OPTIONS. The UI prefers `options` when non-null and renders
        // them inline; falls back to `response_options` otherwise.
        options: normalizeRequestOptions(payload.options),
        // Source message fields needed by ResponseModal / inline send to
        // build the response.
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
