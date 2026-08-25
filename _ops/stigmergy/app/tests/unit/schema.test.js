import { describe, test, expect } from 'vitest';
import { validateMessage, validateAll, isConformant } from '../../src/lib/schema.js';

const SPEC_CONFORMANT = {
  schema_version: '1.0',
  id: 'msg-001',
  ts: '2026-03-28T14:23:05Z',
  session_id: 'swarm-2026-03-28-001',
  from: 'Action Potential Oscillator',
  to: '*',
  type: 'BROADCAST',
  board: 'GENERAL',
  health: { context_pct: 0.18, score: 'green', model: 'claude-sonnet-4-6' },
  payload: { content: 'hello' },
};

describe('validateMessage', () => {
  test('a fully spec-conformant message has zero warnings', () => {
    const v = validateMessage(SPEC_CONFORMANT);
    expect(v._warnings).toEqual([]);
    expect(isConformant(v)).toBe(true);
  });

  test('flags each missing required field', () => {
    const required = ['schema_version', 'id', 'ts', 'session_id', 'from', 'to', 'type', 'board'];
    for (const f of required) {
      const m = { ...SPEC_CONFORMANT };
      delete m[f];
      const v = validateMessage(m);
      expect(v._warnings).toContain(`missing-field:${f}`);
    }
  });

  test('flags missing health block', () => {
    const m = { ...SPEC_CONFORMANT };
    delete m.health;
    const v = validateMessage(m);
    expect(v._warnings).toContain('missing-health-block');
  });

  test('flags ts that is not full ISO 8601 with timezone', () => {
    expect(validateMessage({ ...SPEC_CONFORMANT, ts: '2026-04-01' })._warnings)
      .toContain('ts-not-iso8601-with-timezone');
    expect(validateMessage({ ...SPEC_CONFORMANT, ts: '14:31:07' })._warnings)
      .toContain('ts-not-iso8601-with-timezone');
    expect(validateMessage({ ...SPEC_CONFORMANT, ts: '2026-04-01T14:00:00' })._warnings)
      .toContain('ts-not-iso8601-with-timezone');
  });

  test('accepts ts with offset timezone', () => {
    const v = validateMessage({ ...SPEC_CONFORMANT, ts: '2026-04-01T14:00:00-05:00' });
    expect(v._warnings).not.toContain('ts-not-iso8601-with-timezone');
  });

  test('accepts ts with milliseconds', () => {
    const v = validateMessage({ ...SPEC_CONFORMANT, ts: '2026-04-01T14:00:00.123Z' });
    expect(v._warnings).not.toContain('ts-not-iso8601-with-timezone');
  });

  test('flags unknown type values', () => {
    const v = validateMessage({ ...SPEC_CONFORMANT, type: 'NONSENSE' });
    expect(v._warnings).toContain('unknown-type:NONSENSE');
  });

  test('flags unknown board values', () => {
    const v = validateMessage({ ...SPEC_CONFORMANT, board: 'XYZ' });
    expect(v._warnings).toContain('unknown-board:XYZ');
  });

  // The ratified §9 enum set, v1.17. QUERY / PAGE_UPDATE / HEALTH_NOTICE and the
  // BRANCHES board were design-time proposals the spec explicitly says are "not part
  // of the wire" — the validators had accepted them anyway for a year, so the gate was
  // looser than the rule it enforced. None was ever posted; they were removed in v1.17
  // and RETRACT was ratified in their place.
  test('accepts every ratified type', () => {
    const types = [
      'BROADCAST', 'REPLY', 'FLAG', 'PROOF', 'RETRACT',
      'RESOURCE_REQUEST', 'RESOURCE_GRANT', 'RESOURCE_DENY',
      'SESSION_INIT', 'SESSION_CLOSE',
    ];
    for (const t of types) {
      const v = validateMessage({ ...SPEC_CONFORMANT, type: t });
      expect(v._warnings).not.toContain(`unknown-type:${t}`);
    }
  });

  test('rejects the retired design-time proposals', () => {
    for (const t of ['QUERY', 'PAGE_UPDATE', 'HEALTH_NOTICE']) {
      const v = validateMessage({ ...SPEC_CONFORMANT, type: t });
      expect(v._warnings).toContain(`unknown-type:${t}`);
    }
    const v = validateMessage({ ...SPEC_CONFORMANT, board: 'BRANCHES' });
    expect(v._warnings).toContain('unknown-board:BRANCHES');
  });

  test('accepts every ratified board', () => {
    const boards = ['GENERAL', 'FLAGS', 'WEAVE', 'SYSTEM', 'TRICKSTER'];
    for (const b of boards) {
      const v = validateMessage({ ...SPEC_CONFORMANT, board: b });
      expect(v._warnings).not.toContain(`unknown-board:${b}`);
    }
  });

  test('handles non-object input without throwing', () => {
    expect(validateMessage(null)._warnings).toContain('not-an-object');
    expect(validateMessage(undefined)._warnings).toContain('not-an-object');
    expect(validateMessage('string')._warnings).toContain('not-an-object');
    expect(validateMessage([])._warnings).toContain('not-an-object');
  });

  test('audit-dump shape gets many warnings (covers real palace data drift)', () => {
    const auditDump = {
      session: 'old-session',
      batch: 1,
      entry: 'Wallpaper Groups',
      ts: '2026-04-07',
      result: {},
    };
    const v = validateMessage(auditDump);
    // Missing schema_version, id, session_id, from, to, type, board → 7 warnings.
    // Plus ts-not-iso8601 and missing-health-block → 9 total expected.
    expect(v._warnings.length).toBeGreaterThanOrEqual(7);
    expect(v._warnings).toContain('missing-field:schema_version');
    expect(v._warnings).toContain('missing-field:from');
    expect(v._warnings).toContain('missing-field:type');
    expect(v._warnings).toContain('missing-field:board');
  });
});

describe('validateAll', () => {
  test('annotates each message in an array', () => {
    const arr = [SPEC_CONFORMANT, { id: 'no-fields' }];
    const result = validateAll(arr);
    expect(result).toHaveLength(2);
    expect(result[0]._warnings).toEqual([]);
    expect(result[1]._warnings.length).toBeGreaterThan(0);
  });
});
