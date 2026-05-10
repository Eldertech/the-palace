import { describe, test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateMessage } from '../../server/validator.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// A fully §2.2-conformant baseline message.
const VALID = {
  schema_version: '1.0',
  id: 'msg-001',
  ts: '2026-05-04T07:46:00Z',
  session_id: 'songline-2026-05-04-001',
  from: 'COORDINATOR',
  to: '*',
  type: 'BROADCAST',
  board: 'GENERAL',
  health: {
    context_pct: 0.18,
    stop_reason: 'end_turn',
    iteration: 1,
    tokens_this_call: 280,
    model: 'claude-opus-4-7',
    score: 'green',
  },
  payload: { content: 'hello world' },
};

// Helper — clone VALID and mutate it.
function msg(overrides = {}) {
  return { ...VALID, ...overrides };
}
function msgHealth(healthOverrides = {}) {
  return msg({ health: { ...VALID.health, ...healthOverrides } });
}

describe('validateMessage — structural guard', () => {
  test('accepts a fully conformant message', () => {
    expect(validateMessage(VALID)).toEqual({ valid: true });
  });

  test('rejects null', () => {
    const r = validateMessage(null);
    expect(r.valid).toBe(false);
  });

  test('rejects an array', () => {
    const r = validateMessage([]);
    expect(r.valid).toBe(false);
  });

  test('rejects a non-object primitive', () => {
    const r = validateMessage('string');
    expect(r.valid).toBe(false);
  });
});

describe('validateMessage — required top-level fields', () => {
  const requiredStrings = ['schema_version', 'id', 'ts', 'session_id', 'from', 'to', 'type', 'board'];

  for (const field of requiredStrings) {
    test(`rejects when "${field}" is missing`, () => {
      const m = { ...VALID };
      delete m[field];
      const r = validateMessage(m);
      expect(r.valid).toBe(false);
      expect(r.errors.some((e) => e.path === field)).toBe(true);
    });

    test(`rejects when "${field}" is null`, () => {
      const r = validateMessage(msg({ [field]: null }));
      expect(r.valid).toBe(false);
      expect(r.errors.some((e) => e.path === field)).toBe(true);
    });

    test(`rejects when "${field}" is an empty string`, () => {
      const r = validateMessage(msg({ [field]: '' }));
      expect(r.valid).toBe(false);
      expect(r.errors.some((e) => e.path === field)).toBe(true);
    });

    test(`rejects when "${field}" is wrong type (number)`, () => {
      const r = validateMessage(msg({ [field]: 42 }));
      expect(r.valid).toBe(false);
      expect(r.errors.some((e) => e.path === field)).toBe(true);
    });
  }

  test('rejects when "health" is missing', () => {
    const m = { ...VALID };
    delete m.health;
    const r = validateMessage(m);
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.path === 'health')).toBe(true);
  });

  test('rejects when "payload" is missing', () => {
    const m = { ...VALID };
    delete m.payload;
    const r = validateMessage(m);
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.path === 'payload')).toBe(true);
  });
});

describe('validateMessage — schema_version', () => {
  test('accepts "1.0"', () => {
    expect(validateMessage(msg({ schema_version: '1.0' }))).toEqual({ valid: true });
  });

  test('rejects "2.0"', () => {
    const r = validateMessage(msg({ schema_version: '2.0' }));
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.path === 'schema_version')).toBe(true);
  });

  test('rejects "1"', () => {
    const r = validateMessage(msg({ schema_version: '1' }));
    expect(r.valid).toBe(false);
  });
});

describe('validateMessage — ts', () => {
  test('accepts Z suffix', () => {
    expect(validateMessage(msg({ ts: '2026-05-04T07:46:00Z' }))).toEqual({ valid: true });
  });

  test('accepts positive UTC offset', () => {
    expect(validateMessage(msg({ ts: '2026-03-28T14:00:00+05:30' }))).toEqual({ valid: true });
  });

  test('accepts negative UTC offset', () => {
    expect(validateMessage(msg({ ts: '2026-03-28T14:00:00-05:00' }))).toEqual({ valid: true });
  });

  test('accepts milliseconds with Z', () => {
    expect(validateMessage(msg({ ts: '2026-04-01T14:00:00.123Z' }))).toEqual({ valid: true });
  });

  test('rejects naive datetime (no timezone)', () => {
    const r = validateMessage(msg({ ts: '2026-04-01T14:00:00' }));
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.path === 'ts')).toBe(true);
  });

  test('rejects bare date', () => {
    const r = validateMessage(msg({ ts: '2026-04-01' }));
    expect(r.valid).toBe(false);
  });

  test('rejects time-only string', () => {
    const r = validateMessage(msg({ ts: '14:31:07' }));
    expect(r.valid).toBe(false);
  });

  test('rejects empty string (covered by non-empty string check)', () => {
    const r = validateMessage(msg({ ts: '' }));
    expect(r.valid).toBe(false);
  });
});

describe('validateMessage — type enum', () => {
  const validTypes = [
    'BROADCAST', 'FLAG', 'REPLY', 'PROOF',
    'RESOURCE_REQUEST', 'RESOURCE_GRANT', 'RESOURCE_DENY',
    'QUERY', 'SESSION_INIT', 'SESSION_CLOSE', 'PAGE_UPDATE', 'HEALTH_NOTICE',
  ];

  for (const t of validTypes) {
    test(`accepts valid type: ${t}`, () => {
      expect(validateMessage(msg({ type: t }))).toEqual({ valid: true });
    });
  }

  test('rejects unknown type "PING"', () => {
    const r = validateMessage(msg({ type: 'PING' }));
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.path === 'type')).toBe(true);
  });

  test('rejects lowercase "broadcast"', () => {
    const r = validateMessage(msg({ type: 'broadcast' }));
    expect(r.valid).toBe(false);
  });
});

describe('validateMessage — board enum', () => {
  const validBoards = ['GENERAL', 'FLAGS', 'WEAVE', 'SYSTEM', 'TRICKSTER', 'BRANCHES'];

  for (const b of validBoards) {
    test(`accepts valid board: ${b}`, () => {
      expect(validateMessage(msg({ board: b }))).toEqual({ valid: true });
    });
  }

  test('rejects unknown board "LOBBY"', () => {
    const r = validateMessage(msg({ board: 'LOBBY' }));
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.path === 'board')).toBe(true);
  });
});

describe('validateMessage — re (optional field)', () => {
  test('accepts a message without "re"', () => {
    expect(validateMessage(VALID)).toEqual({ valid: true });
  });

  test('accepts a message with a non-empty "re"', () => {
    expect(validateMessage(msg({ re: 'msg-005' }))).toEqual({ valid: true });
  });

  test('rejects re: "" (empty string)', () => {
    const r = validateMessage(msg({ re: '' }));
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.path === 're')).toBe(true);
  });

  test('rejects re: 42 (non-string)', () => {
    const r = validateMessage(msg({ re: 42 }));
    expect(r.valid).toBe(false);
  });
});

describe('validateMessage — health sub-fields', () => {
  test('rejects health: null', () => {
    const r = validateMessage(msg({ health: null }));
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.path === 'health')).toBe(true);
  });

  test('rejects health: [] (array)', () => {
    const r = validateMessage(msg({ health: [] }));
    expect(r.valid).toBe(false);
  });

  test('rejects health: "string"', () => {
    const r = validateMessage(msg({ health: 'string' }));
    expect(r.valid).toBe(false);
  });

  // context_pct
  test('accepts context_pct: 0', () => {
    expect(validateMessage(msgHealth({ context_pct: 0 }))).toEqual({ valid: true });
  });

  test('accepts context_pct: 1', () => {
    expect(validateMessage(msgHealth({ context_pct: 1 }))).toEqual({ valid: true });
  });

  test('accepts context_pct: 0.5', () => {
    expect(validateMessage(msgHealth({ context_pct: 0.5 }))).toEqual({ valid: true });
  });

  test('rejects context_pct: 1.5 (> 1)', () => {
    const r = validateMessage(msgHealth({ context_pct: 1.5 }));
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.path === 'health.context_pct')).toBe(true);
  });

  test('rejects context_pct: -0.1 (< 0)', () => {
    const r = validateMessage(msgHealth({ context_pct: -0.1 }));
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.path === 'health.context_pct')).toBe(true);
  });

  test('rejects context_pct: "0.5" (string)', () => {
    const r = validateMessage(msgHealth({ context_pct: '0.5' }));
    expect(r.valid).toBe(false);
  });

  test('rejects missing context_pct', () => {
    const h = { ...VALID.health };
    delete h.context_pct;
    const r = validateMessage(msg({ health: h }));
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.path === 'health.context_pct')).toBe(true);
  });

  // stop_reason
  test('rejects missing stop_reason', () => {
    const h = { ...VALID.health };
    delete h.stop_reason;
    const r = validateMessage(msg({ health: h }));
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.path === 'health.stop_reason')).toBe(true);
  });

  test('rejects empty stop_reason', () => {
    const r = validateMessage(msgHealth({ stop_reason: '' }));
    expect(r.valid).toBe(false);
  });

  test('accepts any non-empty stop_reason', () => {
    expect(validateMessage(msgHealth({ stop_reason: 'max_tokens' }))).toEqual({ valid: true });
  });

  // iteration
  test('accepts iteration: 1', () => {
    expect(validateMessage(msgHealth({ iteration: 1 }))).toEqual({ valid: true });
  });

  test('rejects iteration: 0 (< 1)', () => {
    const r = validateMessage(msgHealth({ iteration: 0 }));
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.path === 'health.iteration')).toBe(true);
  });

  test('rejects iteration: -1', () => {
    const r = validateMessage(msgHealth({ iteration: -1 }));
    expect(r.valid).toBe(false);
  });

  test('rejects iteration: 1.5 (non-integer)', () => {
    const r = validateMessage(msgHealth({ iteration: 1.5 }));
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.path === 'health.iteration')).toBe(true);
  });

  test('rejects iteration: "1" (string)', () => {
    const r = validateMessage(msgHealth({ iteration: '1' }));
    expect(r.valid).toBe(false);
  });

  test('rejects missing iteration', () => {
    const h = { ...VALID.health };
    delete h.iteration;
    const r = validateMessage(msg({ health: h }));
    expect(r.valid).toBe(false);
  });

  // tokens_this_call
  test('accepts tokens_this_call: 0', () => {
    expect(validateMessage(msgHealth({ tokens_this_call: 0 }))).toEqual({ valid: true });
  });

  test('rejects tokens_this_call: -1', () => {
    const r = validateMessage(msgHealth({ tokens_this_call: -1 }));
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.path === 'health.tokens_this_call')).toBe(true);
  });

  test('rejects tokens_this_call: 1.5 (non-integer)', () => {
    const r = validateMessage(msgHealth({ tokens_this_call: 1.5 }));
    expect(r.valid).toBe(false);
  });

  test('rejects missing tokens_this_call', () => {
    const h = { ...VALID.health };
    delete h.tokens_this_call;
    const r = validateMessage(msg({ health: h }));
    expect(r.valid).toBe(false);
  });

  // model
  test('accepts any non-empty model string', () => {
    expect(validateMessage(msgHealth({ model: 'claude-sonnet-4-6' }))).toEqual({ valid: true });
  });

  test('rejects empty model', () => {
    const r = validateMessage(msgHealth({ model: '' }));
    expect(r.valid).toBe(false);
  });

  test('rejects missing model', () => {
    const h = { ...VALID.health };
    delete h.model;
    const r = validateMessage(msg({ health: h }));
    expect(r.valid).toBe(false);
  });

  // score
  test('accepts score: "green"', () => {
    expect(validateMessage(msgHealth({ score: 'green' }))).toEqual({ valid: true });
  });

  test('accepts score: "yellow"', () => {
    expect(validateMessage(msgHealth({ score: 'yellow' }))).toEqual({ valid: true });
  });

  test('accepts score: "red"', () => {
    expect(validateMessage(msgHealth({ score: 'red' }))).toEqual({ valid: true });
  });

  test('rejects unknown score "blue"', () => {
    const r = validateMessage(msgHealth({ score: 'blue' }));
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.path === 'health.score')).toBe(true);
  });

  test('rejects missing score', () => {
    const h = { ...VALID.health };
    delete h.score;
    const r = validateMessage(msg({ health: h }));
    expect(r.valid).toBe(false);
  });
});

describe('validateMessage — payload', () => {
  test('accepts any plain object', () => {
    expect(validateMessage(msg({ payload: { anything: 'goes', nested: { deeply: true } } }))).toEqual({ valid: true });
  });

  test('accepts empty object', () => {
    expect(validateMessage(msg({ payload: {} }))).toEqual({ valid: true });
  });

  test('rejects null payload', () => {
    const r = validateMessage(msg({ payload: null }));
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.path === 'payload')).toBe(true);
  });

  test('rejects array payload', () => {
    const r = validateMessage(msg({ payload: [] }));
    expect(r.valid).toBe(false);
  });

  test('rejects string payload', () => {
    const r = validateMessage(msg({ payload: 'text' }));
    expect(r.valid).toBe(false);
  });

  test('accepts deeply nested payload', () => {
    const deep = { a: { b: { c: { d: [1, 2, 3] } } } };
    expect(validateMessage(msg({ payload: deep }))).toEqual({ valid: true });
  });
});

describe('validateMessage — messageVersion rejection', () => {
  test('rejects top-level messageVersion: "audit-result"', () => {
    const r = validateMessage({ ...VALID, messageVersion: 'audit-result' });
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.path === 'messageVersion')).toBe(true);
  });

  test('rejects any top-level messageVersion field', () => {
    const r = validateMessage({ ...VALID, messageVersion: '1.0' });
    expect(r.valid).toBe(false);
  });
});

describe('validateMessage — extra unknown fields', () => {
  test('passes when extra unknown field is present (open schema)', () => {
    // We only check required fields; extra fields are allowed.
    expect(validateMessage({ ...VALID, foo: 'bar', extra: 123 })).toEqual({ valid: true });
  });
});

describe('validateMessage — error accumulation', () => {
  test('reports multiple errors at once', () => {
    const m = { schema_version: '1.0', id: 'x', ts: 'bad-ts', session_id: 's', from: 'f', to: 't', type: 'UNKNOWN', board: 'BAD_BOARD', health: VALID.health, payload: null };
    const r = validateMessage(m);
    expect(r.valid).toBe(false);
    // ts error, type error, board error, payload error — at minimum 4 errors.
    expect(r.errors.length).toBeGreaterThanOrEqual(4);
  });
});

// ── Integration: every real blackboard message must pass ───────────────────
//
// The board grows as new schema-strict messages get appended (e.g. Steward
// cycles posting RESOURCE_REQUESTs, Trickster responses landing inline).
// The point of this test is that EVERY line on the live persistent board
// is §2.2-conformant — not that the board has any specific length. The
// post-reset baseline of 14 messages from session 'songline-2026-05-04-001'
// is preserved as a lower bound.

describe('integration — live blackboard.jsonl (post-2026-05-04 reset)', () => {
  test('every message on the live persistent board passes the strict validator', () => {
    const PALACE_ROOT = resolve(__dirname, '../../../../../');
    const bbPath = resolve(PALACE_ROOT, '_ops/swarm/persistent/blackboard.jsonl');
    const text = readFileSync(bbPath, 'utf8');
    const lines = text.split('\n').filter((l) => l.trim().length > 0);
    expect(lines.length).toBeGreaterThanOrEqual(14);
    for (const line of lines) {
      const m = JSON.parse(line);
      const result = validateMessage(m);
      expect(result.valid, `msg ${m.id}: ${JSON.stringify(result)}`).toBe(true);
    }
  });
});
