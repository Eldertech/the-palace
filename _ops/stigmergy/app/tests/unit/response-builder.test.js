import { describe, test, expect } from 'vitest';
import { buildResponse } from '../../src/lib/response-builder.js';
import { validateMessage } from '@stigmergy/core/schema';

// A sample RESOURCE_REQUEST for all tests to use.
// Uses only `id` (no `request_id`) — backward-compat shape.
const SAMPLE_REQUEST = {
  schema_version: '1.0',
  id: 'req-abc123',
  ts: '2026-05-04T08:00:00Z',
  session_id: 'songline-2026-05-04-001',
  from: 'COOPERATION-1',
  to: 'TRICKSTER',
  type: 'RESOURCE_REQUEST',
  board: 'TRICKSTER',
  health: {
    context_pct: 0.4,
    stop_reason: 'end_turn',
    iteration: 2,
    tokens_this_call: 150,
    model: 'claude-sonnet-4-6',
    score: 'yellow',
  },
  payload: { resource: 'context_window', amount: 10000 },
};

// A request with BOTH `id` (message id) and `request_id` (correlation id).
// This is the Phase 4 shape — request_id lives at the top-level of the
// RESOURCE_REQUEST message, separate from the message's own `id`.
const SAMPLE_REQUEST_WITH_REQUEST_ID = {
  ...SAMPLE_REQUEST,
  id: 'msg-xyz789',        // message id — NOT the correlation id
  request_id: 'req-abc123', // correlation id — the one `re:` must reference
};

describe('buildResponse — GRANT decision', () => {
  test('produces a valid §2.2 message', () => {
    const out = buildResponse({ request: SAMPLE_REQUEST, decision: 'GRANT' });
    const result = validateMessage(out);
    expect(result.valid, JSON.stringify(result)).toBe(true);
  });

  test('type is RESOURCE_GRANT', () => {
    const out = buildResponse({ request: SAMPLE_REQUEST, decision: 'GRANT' });
    expect(out.type).toBe('RESOURCE_GRANT');
  });

  test('from is TRICKSTER', () => {
    const out = buildResponse({ request: SAMPLE_REQUEST, decision: 'GRANT' });
    expect(out.from).toBe('TRICKSTER');
  });

  test('to is the original requester', () => {
    const out = buildResponse({ request: SAMPLE_REQUEST, decision: 'GRANT' });
    expect(out.to).toBe(SAMPLE_REQUEST.from);
  });

  test('re falls back to message id when request_id is absent', () => {
    const out = buildResponse({ request: SAMPLE_REQUEST, decision: 'GRANT' });
    expect(out.re).toBe(SAMPLE_REQUEST.id);
  });

  test('payload.granted is true', () => {
    const out = buildResponse({ request: SAMPLE_REQUEST, decision: 'GRANT' });
    expect(out.payload.granted).toBe(true);
  });

  test('payload has no "reason" key for GRANT', () => {
    const out = buildResponse({ request: SAMPLE_REQUEST, decision: 'GRANT' });
    expect(out.payload).not.toHaveProperty('reason');
  });

  test('board is TRICKSTER', () => {
    const out = buildResponse({ request: SAMPLE_REQUEST, decision: 'GRANT' });
    expect(out.board).toBe('TRICKSTER');
  });

  test('session_id defaults to request.session_id', () => {
    const out = buildResponse({ request: SAMPLE_REQUEST, decision: 'GRANT' });
    expect(out.session_id).toBe(SAMPLE_REQUEST.session_id);
  });

  test('schema_version is "1.0"', () => {
    const out = buildResponse({ request: SAMPLE_REQUEST, decision: 'GRANT' });
    expect(out.schema_version).toBe('1.0');
  });

  test('health.model is loudon-trickster', () => {
    const out = buildResponse({ request: SAMPLE_REQUEST, decision: 'GRANT' });
    expect(out.health.model).toBe('loudon-trickster');
  });

  test('health.score is green', () => {
    const out = buildResponse({ request: SAMPLE_REQUEST, decision: 'GRANT' });
    expect(out.health.score).toBe('green');
  });

  test('health.stop_reason is human_decision', () => {
    const out = buildResponse({ request: SAMPLE_REQUEST, decision: 'GRANT' });
    expect(out.health.stop_reason).toBe('human_decision');
  });
});

describe('buildResponse — DENY decision', () => {
  test('produces a valid §2.2 message', () => {
    const out = buildResponse({ request: SAMPLE_REQUEST, decision: 'DENY' });
    const result = validateMessage(out);
    expect(result.valid, JSON.stringify(result)).toBe(true);
  });

  test('type is RESOURCE_DENY', () => {
    const out = buildResponse({ request: SAMPLE_REQUEST, decision: 'DENY' });
    expect(out.type).toBe('RESOURCE_DENY');
  });

  test('payload.granted is false', () => {
    const out = buildResponse({ request: SAMPLE_REQUEST, decision: 'DENY' });
    expect(out.payload.granted).toBe(false);
  });

  test('payload has no "constraints" key for DENY', () => {
    const out = buildResponse({ request: SAMPLE_REQUEST, decision: 'DENY' });
    expect(out.payload).not.toHaveProperty('constraints');
  });

  test('payload.reason defaults to "no reason given"', () => {
    const out = buildResponse({ request: SAMPLE_REQUEST, decision: 'DENY' });
    expect(out.payload.reason).toBe('no reason given');
  });
});

describe('buildResponse — constraints / reason', () => {
  test('GRANT with constraints string', () => {
    const out = buildResponse({
      request: SAMPLE_REQUEST,
      decision: 'GRANT',
      constraints: 'limited to 3 calls',
    });
    expect(out.payload.constraints).toBe('limited to 3 calls');
    expect(validateMessage(out).valid).toBe(true);
  });

  test('DENY with constraints/reason string', () => {
    const out = buildResponse({
      request: SAMPLE_REQUEST,
      decision: 'DENY',
      constraints: 'context too high',
    });
    expect(out.payload.reason).toBe('context too high');
    expect(validateMessage(out).valid).toBe(true);
  });

  test('GRANT without constraints uses "no constraints"', () => {
    const out = buildResponse({ request: SAMPLE_REQUEST, decision: 'GRANT' });
    expect(out.payload.constraints).toBe('no constraints');
  });
});

describe('buildResponse — sessionId override', () => {
  test('uses provided sessionId when given', () => {
    const out = buildResponse({
      request: SAMPLE_REQUEST,
      decision: 'GRANT',
      sessionId: 'override-session-xyz',
    });
    expect(out.session_id).toBe('override-session-xyz');
    expect(validateMessage(out).valid).toBe(true);
  });
});

describe('buildResponse — id uniqueness', () => {
  test('multiple calls produce distinct ids', () => {
    const ids = new Set();
    for (let i = 0; i < 20; i++) {
      const out = buildResponse({ request: SAMPLE_REQUEST, decision: 'GRANT' });
      ids.add(out.id);
    }
    // All 20 should be unique.
    expect(ids.size).toBe(20);
  });

  test('id starts with "resp-"', () => {
    const out = buildResponse({ request: SAMPLE_REQUEST, decision: 'GRANT' });
    expect(out.id).toMatch(/^resp-/);
  });
});

describe('buildResponse — invalid decision', () => {
  test('throws on invalid decision value', () => {
    expect(() =>
      buildResponse({ request: SAMPLE_REQUEST, decision: 'MAYBE' })
    ).toThrow();
  });
});

describe('buildResponse — ts', () => {
  test('ts is a valid ISO 8601 with Z timezone', () => {
    const out = buildResponse({ request: SAMPLE_REQUEST, decision: 'GRANT' });
    // The validator accepts Z suffix.
    expect(out.ts).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z$/);
  });
});

describe('buildResponse — re: correlation (Phase 2 bug fix)', () => {
  test('prefers request_id over message id when both are present', () => {
    const out = buildResponse({ request: SAMPLE_REQUEST_WITH_REQUEST_ID, decision: 'GRANT' });
    // Must correlate to the request_id, not the message id.
    expect(out.re).toBe('req-abc123');
    expect(out.re).not.toBe('msg-xyz789');
  });

  test('prefers request_id for DENY as well', () => {
    const out = buildResponse({ request: SAMPLE_REQUEST_WITH_REQUEST_ID, decision: 'DENY' });
    expect(out.re).toBe('req-abc123');
  });

  test('falls back to id when request_id is absent', () => {
    // SAMPLE_REQUEST has no request_id; re: should fall back to id.
    const out = buildResponse({ request: SAMPLE_REQUEST, decision: 'GRANT' });
    expect(out.re).toBe(SAMPLE_REQUEST.id);
  });

  test('output is still §2.2-valid when request_id is used for re:', () => {
    const out = buildResponse({ request: SAMPLE_REQUEST_WITH_REQUEST_ID, decision: 'GRANT' });
    const result = validateMessage(out);
    expect(result.valid, JSON.stringify(result)).toBe(true);
  });
});

describe('buildResponse — notes addendum', () => {
  test('GRANT carries notes as a separate payload field when provided', () => {
    const out = buildResponse({
      request: SAMPLE_REQUEST,
      decision: 'GRANT',
      notes: 'Excited to see the curves work.',
    });
    expect(out.payload.notes).toBe('Excited to see the curves work.');
    expect(out.payload.granted).toBe(true);
    expect(out.payload.constraints).toBe('no constraints');
  });

  test('DENY carries notes alongside reason', () => {
    const out = buildResponse({
      request: SAMPLE_REQUEST,
      decision: 'DENY',
      constraints: 'budget exhausted',
      notes: 'try again next month',
    });
    expect(out.payload.notes).toBe('try again next month');
    expect(out.payload.reason).toBe('budget exhausted');
    expect(out.payload.granted).toBe(false);
  });

  test('empty / whitespace notes do not leak into the payload', () => {
    const out1 = buildResponse({ request: SAMPLE_REQUEST, decision: 'GRANT', notes: '' });
    expect('notes' in out1.payload).toBe(false);
    const out2 = buildResponse({ request: SAMPLE_REQUEST, decision: 'GRANT', notes: '   ' });
    expect('notes' in out2.payload).toBe(false);
  });

  test('notes are trimmed of surrounding whitespace', () => {
    const out = buildResponse({
      request: SAMPLE_REQUEST,
      decision: 'GRANT',
      notes: '   keep going   ',
    });
    expect(out.payload.notes).toBe('keep going');
  });
});
