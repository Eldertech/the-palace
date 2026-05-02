// Message-schema validator per Infrastructure Spec §2.2.
//
// Required fields on every message: schema_version, id, ts, session_id,
// from, to, type, board. The `health` block is also required per spec
// (orchestrator-written), but real palace data often lacks it — we warn
// rather than reject.
//
// `ts` must be full ISO 8601 with timezone. A bare date like "2026-04-01"
// is flagged.
//
// validateMessage returns the message annotated with a `_warnings` array.
// The UI renders warned messages with a red border.

const REQUIRED_FIELDS = ['schema_version', 'id', 'ts', 'session_id', 'from', 'to', 'type', 'board'];

const VALID_TYPES = new Set([
  'BROADCAST', 'REPLY', 'FLAG', 'PROOF',
  'RESOURCE_REQUEST', 'RESOURCE_GRANT', 'RESOURCE_DENY',
  'QUERY',
  'SESSION_INIT', 'SESSION_CLOSE',
  'PAGE_UPDATE', 'HEALTH_NOTICE',
]);

const VALID_BOARDS = new Set([
  'GENERAL', 'FLAGS', 'WEAVE', 'SYSTEM', 'TRICKSTER', 'BRANCHES',
]);

// Matches full ISO 8601 with timezone. Examples that pass:
//   2026-03-28T14:23:05Z
//   2026-03-28T14:23:05+00:00
//   2026-03-28T14:23:05.123-05:00
const ISO8601_FULL = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

export function validateMessage(msg) {
  const warnings = [];
  if (!msg || typeof msg !== 'object' || Array.isArray(msg)) {
    return { ...(msg || {}), _warnings: ['not-an-object'] };
  }

  for (const f of REQUIRED_FIELDS) {
    if (msg[f] === undefined || msg[f] === null || msg[f] === '') {
      warnings.push(`missing-field:${f}`);
    }
  }

  if (typeof msg.ts === 'string' && !ISO8601_FULL.test(msg.ts)) {
    warnings.push('ts-not-iso8601-with-timezone');
  }

  if (msg.type !== undefined && msg.type !== null && !VALID_TYPES.has(msg.type)) {
    warnings.push(`unknown-type:${msg.type}`);
  }

  if (msg.board !== undefined && msg.board !== null && !VALID_BOARDS.has(msg.board)) {
    warnings.push(`unknown-board:${msg.board}`);
  }

  if (msg.health !== undefined && msg.health !== null) {
    if (typeof msg.health !== 'object' || Array.isArray(msg.health)) {
      warnings.push('health-not-an-object');
    }
  } else {
    warnings.push('missing-health-block');
  }

  return { ...msg, _warnings: warnings };
}

export function validateAll(messages) {
  return messages.map(validateMessage);
}

// Convenience: a message is "conformant" iff its warnings list is empty.
export function isConformant(msg) {
  return Array.isArray(msg?._warnings) && msg._warnings.length === 0;
}
