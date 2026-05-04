import { describe, test, expect } from 'vitest';
import { buildResponse } from '../../src/lib/response-builder.js';
import { validateMessage } from '../../server/validator.js';

// A sample RESOURCE_REQUEST for all tests to use.
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

  test('re is set to the request id', () => {
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
