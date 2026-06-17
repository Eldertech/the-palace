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

import { tsCompare } from './format.js';
import { CATCHUP_OVERRIDES } from './catchup-overrides.js';
import { artifactsFromPayload } from './artifact.js';

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

// ── Steward-lean detection (Phase 2) ──────────────────────────────────────
//
// The wire schema carries no `recommended` flag yet (voice-rule-7, pending),
// so the steward's recommended option is inferred from prose. Two signals,
// in precedence order:
//
//   1. An option LABEL carrying an explicit marker. '(recommended)' is the
//      live convention (52× on the board 2026-06-05); the rarer phrasings are
//      honored too. This is the strongest signal — the steward tagged the
//      option itself.
//   2. A lean token in the GROUND / rationale prose: "steward leans X" /
//      "steward expects X". Cross-referenced against the option ids/labels.
//      Used only when no label marker is present.
//
// Cards whose prose says "no lean" match neither and stay leanless on purpose
// — FILE ALL must never auto-file a decision the steward left to the human.
// When voice-rule-7 lands, replace pass 1 with a direct payload flag read.
const LEAN_LABEL_MARKER = /\((?:recommended|my lean|my pick|my call|expected|default)\)/i;
const GROUND_LEAN = /\bsteward\s+(?:leans|expects)\s+([A-Za-z][A-Za-z0-9_-]*)/i;

// Tag the recommended option (if any) on a normalized options[] list.
// Returns { options, recommendedOption, leanSource }:
//   - options: the same list with `recommended: true` on at most one entry
//   - recommendedOption: { id, label } | null
//   - leanSource: 'label' | 'ground' | null (kept for transparency / no silent caps)
export function tagRecommendation(options, { ground, rationale } = {}) {
  if (!Array.isArray(options) || options.length === 0) {
    return { options, recommendedOption: null, leanSource: null };
  }

  // Pass 1 — explicit marker on an option label.
  let recIdx = options.findIndex(
    (o) => typeof o.label === 'string' && LEAN_LABEL_MARKER.test(o.label)
  );
  let leanSource = recIdx >= 0 ? 'label' : null;

  // Pass 2 — lean token parsed from ground/rationale prose.
  if (recIdx < 0) {
    const prose = `${ground || ''}\n${rationale || ''}`;
    const m = prose.match(GROUND_LEAN);
    if (m) {
      const token = m[1].toLowerCase();
      recIdx = options.findIndex(
        (o) =>
          (typeof o.id === 'string' && o.id.toLowerCase() === token) ||
          (typeof o.label === 'string' && o.label.toLowerCase().startsWith(token))
      );
      if (recIdx >= 0) leanSource = 'ground';
    }
  }

  if (recIdx < 0) {
    return { options, recommendedOption: null, leanSource: null };
  }

  const tagged = options.map((o, i) => (i === recIdx ? { ...o, recommended: true } : o));
  return {
    options: tagged,
    recommendedOption: { id: tagged[recIdx].id, label: tagged[recIdx].label },
    leanSource,
  };
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
      // Catchup fields — see voice rule 6 in prompts/shared.md.
      // Priority: native payload fields > override map (for legacy requests
      // written before voice rule 6 existed) > null (renderer shows the
      // "no catchup written" dim indicator + falls back to rationale).
      // The override map is data-shaped and shrinks to empty as stewards
      // start emitting headline+ground natively on every cycle.
      const override = CATCHUP_OVERRIDES[m.request_id] || {};
      const headline =
        (typeof payload.headline === 'string' && payload.headline.trim()) || override.headline || null;
      const ground =
        (typeof payload.ground === 'string' && payload.ground.trim()) || override.ground || null;
      // Normalize request-supplied options, then detect the steward's lean.
      const normalizedOptions =
        normalizeRequestOptions(payload.options) ?? normalizeRequestOptions(m.options);
      const { options: taggedOptions, recommendedOption, leanSource } =
        tagRecommendation(normalizedOptions, { ground, rationale: payload.rationale });
      return {
        request_id: m.request_id,
        from: m.from,
        ts: m.ts,
        resource: payload.resource,
        // The request's payload.kind, surfaced so the card can recognize a
        // SESSION REQUEST — a steward that posted `kind: "interactive_session"`
        // is not asking for a grant, it is asking to be *launched* into a live
        // watch+steer session at a critical moment (the emit half of the
        // request-interactive loop). The card foregrounds the launch CTA for it.
        // null for an ordinary decision request (the common case).
        kind: typeof payload.kind === 'string' && payload.kind.trim() ? payload.kind.trim() : null,
        headline,
        ground,
        rationale: payload.rationale,
        query_intent: payload.query_intent,
        // Inline artifacts declared on the wire (payload.artifacts[] or the
        // legacy payload.artifact_path). Read straight off the message the same
        // way the message boards' ArtifactSlot does — so a steward that
        // declares its rendered files gets them on the card with zero registry
        // upkeep. The card prefers these over the hand-curated trickster-assets
        // registry, which is now a fallback (mirrors the headline/ground
        // override precedence above). Always an array, [] when none declared.
        artifacts: artifactsFromPayload(payload),
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
        //
        // Canonical location is `payload.options`. The fallback to top-level
        // `m.options` exists because stewards have empirically drifted to that
        // location (cycle-11 GSL batch run, 2026-05-27) — the validator does
        // not enforce payload shape, so a mis-placed options array would
        // otherwise silently render the generic response-options template.
        // The normalizer prefers payload.options when it yields a usable list.
        // Each option may carry `recommended: true` (see tagRecommendation).
        options: taggedOptions,
        // The steward's detected lean: { id, label } | null, plus the signal
        // it was inferred from ('label' | 'ground' | null). Drives the lean
        // panel + FILE ALL; null means a deliberately human-only decision.
        recommended_option: recommendedOption,
        lean_source: leanSource,
        // Source message fields needed by ResponseModal / inline send to
        // build the response.
        // _message_id: the source message's own `id` field (not the correlation id).
        // _session_id: the source message's session_id.
        _message_id: m.id,
        _session_id: m.session_id,
      };
    });

  // Sort newest-first (chronological, timezone-safe) so the latest request sits
  // at the top of the inbox — consistent with the message boards, so the
  // operator sees the newest pending decision the moment they open TRICKSTER.
  // (Was oldest-first / longest-waiting; flipped per operator preference
  // 2026-05-29.)
  pending_requests.sort((a, b) => tsCompare(b.ts, a.ts));
  return { pending_requests };
}
