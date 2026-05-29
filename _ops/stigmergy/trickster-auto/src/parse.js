// parse.js — Phase 0. The coalescing parser for RESOURCE_REQUEST messages.
//
// Ground truth from the live persistent board (probed 2026-05-29, 153 msgs):
//   - request_id : ALWAYS top-level (46/46). Gap 9 resolved toward the §2.5 split.
//   - re (on grants/denies) : ALWAYS top-level (31/31).
//   - resource   : top-level on 7, inside payload on 39 → must COALESCE.
//   - blocking   : top-level on 7, inside payload on 39 → must COALESCE.
//   - options[]  : inside payload on 45, top-level on 1 (Stage-D fallback) → COALESCE.
//                  Shapes: array-of-objects {id,label[,next]} (canonical) OR
//                  array-of-strings (lenient — derive id from leading token).
//   - resource values present: "directional_decision" (40), and 6 audition-
//                  flavoured values all containing the substring "audition".
//
// This module NORMALIZES every real shape into one stable record so that no
// downstream code (evaluator, gate, digest, write path) has to know where a
// field happened to live on the wire. It never throws on a well-formed
// RESOURCE_REQUEST; it records what it could not find rather than failing.

// Canonical lenient-id regex — MIRRORS _ops/stigmergy/app/src/lib/inbox.js
// (the single source of truth for option normalization). Leading id token
// (alphanumeric, then [A-Za-z0-9_-]*), optional whitespace, a separator
// (em-dash, en-dash, ASCII hyphen, colon), then MANDATORY whitespace. The
// mandatory trailing whitespace is what keeps hyphenated ids like
// "tweak-model" and "try-carry-phase" intact — a bare internal hyphen has no
// following space, so the greedy token consumes it.
const LENIENT_ID = /^([A-Za-z0-9][A-Za-z0-9_-]*)\s*[—–\-:]\s+/;

/**
 * Derive a stable id token from a lenient string option, per §2.6.
 * "APPROVE — pitch reads; greenlight." → "APPROVE"
 * "try-carry-phase — too tame"          → "try-carry-phase"
 * "tweak-model — reshape the partials"  → "tweak-model"
 * No separator → the whole string, truncated to 32 chars (matches the app).
 */
export function deriveOptionId(str) {
  if (typeof str !== 'string') return null;
  const s = str.trim();
  if (s === '') return null;
  const m = s.match(LENIENT_ID);
  return m ? m[1] : s.slice(0, 32);
}

/**
 * Normalize an options array (object-shape or string-shape) into a stable
 * array of { id, label, next? }. Returns [] when no options are present.
 */
export function normalizeOptions(rawOptions) {
  if (!Array.isArray(rawOptions)) return [];
  return rawOptions
    .map((opt) => {
      if (opt && typeof opt === 'object' && !Array.isArray(opt)) {
        const id = typeof opt.id === 'string' && opt.id.trim() !== ''
          ? opt.id
          : deriveOptionId(opt.label);
        const out = { id: id ?? null, label: typeof opt.label === 'string' ? opt.label : String(opt.label ?? '') };
        if (opt.next != null) out.next = opt.next;
        return out;
      }
      if (typeof opt === 'string') {
        return { id: deriveOptionId(opt), label: opt };
      }
      return null;
    })
    .filter(Boolean);
}

/** Coalesce a field that may live at top-level OR inside payload. */
function coalesce(msg, field) {
  if (msg && Object.prototype.hasOwnProperty.call(msg, field) && msg[field] != null) {
    return msg[field];
  }
  if (msg && msg.payload && Object.prototype.hasOwnProperty.call(msg.payload, field) && msg.payload[field] != null) {
    return msg.payload[field];
  }
  return undefined;
}

/**
 * Parse a raw RESOURCE_REQUEST message into a stable normalized record.
 *
 * @param {object} msg — a parsed board message (must be type RESOURCE_REQUEST)
 * @returns {{
 *   request_id: string|null,
 *   from: string|null,
 *   ts: string|null,
 *   session_id: string|null,
 *   resource: string|null,
 *   blocking: boolean,
 *   options: Array<{id:string|null,label:string,next?:any}>,
 *   steward_recommendation: string|null,
 *   rationale: string|null,
 *   subject: string|null,
 *   decision_topic: string|null,
 *   payload: object,
 *   raw: object,
 *   parse_warnings: string[]
 * }}
 */
export function parseRequest(msg) {
  const warnings = [];
  const payload = (msg && typeof msg.payload === 'object' && msg.payload && !Array.isArray(msg.payload))
    ? msg.payload
    : {};

  const request_id = (typeof msg?.request_id === 'string' && msg.request_id.trim() !== '')
    ? msg.request_id
    : null;
  if (!request_id) warnings.push('missing top-level request_id (Gap 9 — §2.5 split)');

  const resourceRaw = coalesce(msg, 'resource');
  const resource = typeof resourceRaw === 'string' && resourceRaw.trim() !== '' ? resourceRaw : null;
  if (!resource) warnings.push('no resource field found (top-level or payload)');

  const blockingRaw = coalesce(msg, 'blocking');
  // Fail safe toward the human: an unspecified blocking flag is treated as
  // BLOCKING (→ escalate). The auto-grant path requires an EXPLICIT
  // blocking:false, so ambiguity can never become an auto-grant.
  const blocking = blockingRaw === undefined ? true : Boolean(blockingRaw);
  if (blockingRaw === undefined) warnings.push('no blocking flag found; defaulted to blocking:true (fail-safe)');

  const optionsRaw = coalesce(msg, 'options');
  const options = normalizeOptions(optionsRaw);

  const str = (v) => (typeof v === 'string' && v.trim() !== '' ? v : null);

  return {
    request_id,
    from: str(msg?.from),
    ts: str(msg?.ts),
    session_id: str(msg?.session_id),
    resource,
    blocking,
    options,
    steward_recommendation: str(payload.steward_recommendation),
    rationale: str(payload.rationale),
    subject: str(payload.subject) || str(payload.decision_topic),
    decision_topic: str(payload.decision_topic),
    payload,
    raw: msg,
    parse_warnings: warnings,
  };
}
