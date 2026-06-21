// server/validator.js — STRICT §2.2 message validator.
//
// This is the SERVER-SIDE gatekeeper for all writes to the blackboard.
// It is separate from src/lib/schema.js (which is the lenient render-side
// validator used by the UI for red-border warnings).
//
// Rules:
// - All required fields must be present and non-empty.
// - schema_version must be exactly "1.0".
// - ts must be ISO 8601 with timezone (Z or explicit +/-HH:MM). No naive timestamps.
// - type must be one of the known enum values.
// - board must be one of the known enum values.
// - health must be an object with all required sub-fields correctly typed.
// - payload must be a plain object (any shape — not null, not array).
// - Top-level `messageVersion` field explicitly REJECTED.
// - Never coerces. Never fills defaults. Pure check only.

const REQUIRED_FIELDS = [
  'schema_version', 'id', 'ts', 'session_id', 'from', 'to', 'type', 'board',
  'health', 'payload',
];

const VALID_TYPES = new Set([
  'BROADCAST', 'FLAG', 'REPLY', 'PROOF',
  'RESOURCE_REQUEST', 'RESOURCE_GRANT', 'RESOURCE_DENY',
  'QUERY',
  'SESSION_INIT', 'SESSION_CLOSE',
  'PAGE_UPDATE', 'HEALTH_NOTICE',
]);

const VALID_BOARDS = new Set([
  'GENERAL', 'FLAGS', 'WEAVE', 'SYSTEM', 'TRICKSTER', 'BRANCHES',
]);

const VALID_SCORES = new Set(['green', 'yellow', 'red']);

// Full ISO 8601 with timezone:
//   2026-05-04T07:46:00Z
//   2026-03-28T14:23:05.123-05:00
// Rejects: bare dates, naive datetime (no timezone suffix).
const ISO8601_WITH_TZ = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

/**
 * Validate a single parsed message against §2.2 STRICT rules.
 *
 * @param {unknown} msg — the parsed message object
 * @returns {{ valid: true } | { valid: false, errors: Array<{path: string, message: string}> }}
 */
export function validateMessage(msg) {
  const errors = [];

  if (msg === null || typeof msg !== 'object' || Array.isArray(msg)) {
    return { valid: false, errors: [{ path: '', message: 'message must be a plain object' }] };
  }

  // Explicit rejection of the historical `messageVersion: "audit-result"` variant.
  if (Object.prototype.hasOwnProperty.call(msg, 'messageVersion')) {
    errors.push({
      path: 'messageVersion',
      message: 'messageVersion field is not supported; use schema_version: "1.0"',
    });
  }

  // Required fields — present and non-empty string (for string fields).
  // health and payload checked separately.
  for (const field of ['schema_version', 'id', 'ts', 'session_id', 'from', 'to', 'type', 'board']) {
    if (!(field in msg) || msg[field] === null || msg[field] === undefined) {
      errors.push({ path: field, message: `required field "${field}" is missing` });
    } else if (typeof msg[field] !== 'string' || msg[field].trim() === '') {
      errors.push({ path: field, message: `"${field}" must be a non-empty string` });
    }
  }

  // schema_version must be exactly "1.0".
  if (typeof msg.schema_version === 'string' && msg.schema_version !== '1.0') {
    errors.push({ path: 'schema_version', message: `schema_version must be "1.0", got "${msg.schema_version}"` });
  }

  // ts must be ISO 8601 with timezone.
  if (typeof msg.ts === 'string' && msg.ts.trim() !== '') {
    if (!ISO8601_WITH_TZ.test(msg.ts)) {
      errors.push({
        path: 'ts',
        message: 'ts must be ISO 8601 with timezone (e.g. "2026-05-04T07:46:00Z" or "...+05:00")',
      });
    }
  }

  // type enum.
  if (typeof msg.type === 'string' && msg.type.trim() !== '' && !VALID_TYPES.has(msg.type)) {
    errors.push({
      path: 'type',
      message: `unknown type "${msg.type}"; valid values: ${[...VALID_TYPES].join(', ')}`,
    });
  }

  // board enum.
  if (typeof msg.board === 'string' && msg.board.trim() !== '' && !VALID_BOARDS.has(msg.board)) {
    errors.push({
      path: 'board',
      message: `unknown board "${msg.board}"; valid values: ${[...VALID_BOARDS].join(', ')}`,
    });
  }

  // re (optional) — if present, must be non-empty string.
  if (Object.prototype.hasOwnProperty.call(msg, 're')) {
    if (typeof msg.re !== 'string' || msg.re.trim() === '') {
      errors.push({ path: 're', message: '"re" must be a non-empty string when present' });
    }
  }

  // health — required object. The required sub-fields depend on whether the
  // orchestrator had authoritative API usage data (see Infrastructure Spec
  // §3.3.1, SCHEMA §9):
  //
  //   Path 1 (API-direct dispatch) — all 6 sub-fields required:
  //     context_pct, stop_reason, iteration, tokens_this_call, model, score.
  //     This is the case the orchestrator calls the Anthropic API directly and
  //     reads response.usage.input_tokens, so context_pct is authoritative.
  //
  //   Stub-health dispatch (no authoritative API usage) — only score + model
  //     required; context_pct / stop_reason / iteration / tokens_this_call are
  //     OPTIONAL (ignored if absent, structurally checked when present). When
  //     there was no direct API call, those four can't be computed, so forcing
  //     them would mean stamping fabricated zeros. The score is a "green"
  //     sentinel; real escalation requires Path 1's usage data. Signalled by
  //     `health._orchestrator_metadata.dispatch_mode` ∈ STUB_HEALTH_DISPATCH:
  //     `claude-code-subagent` (Path 2: Agent-tool dispatch, §3.3.1),
  //     `hand-authored` / `cowork` / `claude-code` (a human or agent hand-wrote
  //     the JSON — no model call at all; SCHEMA §9: "hand-authored and Path-2
  //     messages carry a green stub"). New non-API dispatch modes are added to
  //     this set, not exempted ad-hoc.
  //
  // Path 1 is the DEFAULT: a message with no _orchestrator_metadata, or an
  // API-direct dispatch_mode, keeps the full requirement. Pre-existing messages
  // with full health blocks remain valid in either case — relaxation makes the
  // four fields optional, it never rejects a message that carries the full set.
  if (!('health' in msg) || msg.health === null || msg.health === undefined) {
    errors.push({ path: 'health', message: 'required field "health" is missing' });
  } else if (typeof msg.health !== 'object' || Array.isArray(msg.health)) {
    errors.push({ path: 'health', message: '"health" must be a plain object' });
  } else {
    const h = msg.health;
    // Dispatch contexts with no authoritative API usage data → stub health OK.
    const STUB_HEALTH_DISPATCH = new Set([
      'claude-code-subagent', 'hand-authored', 'cowork', 'claude-code',
    ]);
    const isStubHealth = h._orchestrator_metadata
      && typeof h._orchestrator_metadata === 'object'
      && STUB_HEALTH_DISPATCH.has(h._orchestrator_metadata.dispatch_mode);

    // context_pct, stop_reason, iteration, tokens_this_call: required only
    // for Path 1; optional for Path 2. When present (in either path), they
    // must have the right shape.
    if (!isStubHealth || 'context_pct' in h) {
      if (!('context_pct' in h) || h.context_pct === null || h.context_pct === undefined) {
        errors.push({ path: 'health.context_pct', message: 'required field "health.context_pct" is missing (Path 1)' });
      } else if (typeof h.context_pct !== 'number') {
        errors.push({ path: 'health.context_pct', message: '"health.context_pct" must be a number' });
      } else if (h.context_pct < 0 || h.context_pct > 1) {
        errors.push({ path: 'health.context_pct', message: `"health.context_pct" must be between 0 and 1, got ${h.context_pct}` });
      }
    }

    if (!isStubHealth || 'stop_reason' in h) {
      if (!('stop_reason' in h) || h.stop_reason === null || h.stop_reason === undefined) {
        errors.push({ path: 'health.stop_reason', message: 'required field "health.stop_reason" is missing (Path 1)' });
      } else if (typeof h.stop_reason !== 'string' || h.stop_reason.trim() === '') {
        errors.push({ path: 'health.stop_reason', message: '"health.stop_reason" must be a non-empty string' });
      }
    }

    if (!isStubHealth || 'iteration' in h) {
      if (!('iteration' in h) || h.iteration === null || h.iteration === undefined) {
        errors.push({ path: 'health.iteration', message: 'required field "health.iteration" is missing (Path 1)' });
      } else if (typeof h.iteration !== 'number') {
        errors.push({ path: 'health.iteration', message: '"health.iteration" must be a number' });
      } else if (!Number.isInteger(h.iteration)) {
        errors.push({ path: 'health.iteration', message: `"health.iteration" must be an integer, got ${h.iteration}` });
      } else if (h.iteration < 1) {
        errors.push({ path: 'health.iteration', message: `"health.iteration" must be >= 1, got ${h.iteration}` });
      }
    }

    if (!isStubHealth || 'tokens_this_call' in h) {
      if (!('tokens_this_call' in h) || h.tokens_this_call === null || h.tokens_this_call === undefined) {
        errors.push({ path: 'health.tokens_this_call', message: 'required field "health.tokens_this_call" is missing (Path 1)' });
      } else if (typeof h.tokens_this_call !== 'number') {
        errors.push({ path: 'health.tokens_this_call', message: '"health.tokens_this_call" must be a number' });
      } else if (!Number.isInteger(h.tokens_this_call)) {
        errors.push({ path: 'health.tokens_this_call', message: `"health.tokens_this_call" must be an integer, got ${h.tokens_this_call}` });
      } else if (h.tokens_this_call < 0) {
        errors.push({ path: 'health.tokens_this_call', message: `"health.tokens_this_call" must be >= 0, got ${h.tokens_this_call}` });
      }
    }

    // model and score are required on BOTH paths.
    if (!('model' in h) || h.model === null || h.model === undefined) {
      errors.push({ path: 'health.model', message: 'required field "health.model" is missing' });
    } else if (typeof h.model !== 'string' || h.model.trim() === '') {
      errors.push({ path: 'health.model', message: '"health.model" must be a non-empty string' });
    }

    if (!('score' in h) || h.score === null || h.score === undefined) {
      errors.push({ path: 'health.score', message: 'required field "health.score" is missing' });
    } else if (!VALID_SCORES.has(h.score)) {
      errors.push({
        path: 'health.score',
        message: `"health.score" must be one of: green, yellow, red; got "${h.score}"`,
      });
    }
  }

  // payload — required plain object (any shape).
  if (!('payload' in msg) || msg.payload === null || msg.payload === undefined) {
    errors.push({ path: 'payload', message: 'required field "payload" is missing' });
  } else if (typeof msg.payload !== 'object' || Array.isArray(msg.payload)) {
    errors.push({ path: 'payload', message: '"payload" must be a plain object (not null, not array)' });
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }
  return { valid: true };
}
