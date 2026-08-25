import { describe, test, expect } from 'vitest';
import { BOARDS, TYPE_GLYPHS, glyphFor, accentFor, healthColor, formatTs, padCell, tsToEpoch, tsCompare } from '../../src/lib/format.js';

describe('BOARDS', () => {
  test('exposes the five ratified channels in the documented order', () => {
    expect(BOARDS).toEqual(['GENERAL', 'FLAGS', 'WEAVE', 'SYSTEM', 'TRICKSTER']);
  });
});

describe('glyphFor', () => {
  test('returns a glyph string for every documented type', () => {
    const types = [
      'BROADCAST', 'REPLY', 'FLAG', 'PROOF', 'RETRACT',
      'RESOURCE_REQUEST', 'RESOURCE_GRANT', 'RESOURCE_DENY',
      'SESSION_INIT', 'SESSION_CLOSE',
    ];
    for (const t of types) {
      expect(typeof glyphFor(t)).toBe('string');
    }
  });

  test('FLAG uses ! prefix', () => {
    expect(glyphFor('FLAG')).toBe('!');
  });

  test('REPLY uses > prefix', () => {
    expect(glyphFor('REPLY')).toBe('>');
  });

  test('RESOURCE_REQUEST uses ? prefix', () => {
    expect(glyphFor('RESOURCE_REQUEST')).toBe('?');
  });

  test('RESOURCE_DENY uses x prefix', () => {
    expect(glyphFor('RESOURCE_DENY')).toBe('x');
  });

  test('BROADCAST has no prefix', () => {
    expect(glyphFor('BROADCAST')).toBe('');
  });

  test('unknown types return empty string', () => {
    expect(glyphFor('NONSENSE')).toBe('');
    expect(glyphFor(undefined)).toBe('');
  });

  test('does not contain emoji', () => {
    for (const v of Object.values(TYPE_GLYPHS)) {
      // Match any character outside basic ASCII + a small set of CP437 glyphs.
      expect(/[\u{1F300}-\u{1F9FF}]/u.test(v)).toBe(false);
    }
  });
});

describe('accentFor', () => {
  test('FLAG accent is amber/warn', () => {
    expect(accentFor('FLAG')).toMatch(/--warn/);
  });

  test('RESOURCE_DENY accent is error/red', () => {
    expect(accentFor('RESOURCE_DENY')).toMatch(/--error/);
  });

  test('BROADCAST accent is phosphor', () => {
    expect(accentFor('BROADCAST')).toBe('var(--phosphor)');
  });
});

describe('healthColor', () => {
  test('green→phosphor, yellow→warn, red→error', () => {
    expect(healthColor('green')).toMatch(/--phosphor/);
    expect(healthColor('yellow')).toMatch(/--warn/);
    expect(healthColor('red')).toMatch(/--error/);
  });

  test('unknown score → dim', () => {
    expect(healthColor('teal')).toMatch(/--phosphor-dim/);
    expect(healthColor(undefined)).toMatch(/--phosphor-dim/);
  });
});

describe('formatTs', () => {
  test('extracts hh:mm:ss + tz from full ISO', () => {
    expect(formatTs('2026-04-01T14:31:07Z')).toBe('14:31:07Z');
    expect(formatTs('2026-04-01T14:31:07+00:00')).toBe('14:31:07+00:00');
    expect(formatTs('2026-04-01T14:31:07.123-05:00')).toBe('14:31:07-05:00');
  });

  test('returns the input unchanged for non-ISO strings', () => {
    expect(formatTs('2026-04-01')).toBe('2026-04-01');
    expect(formatTs('14:31:07')).toBe('14:31:07');
  });

  test('returns em-dash placeholder for non-strings', () => {
    expect(formatTs(undefined)).toBe('—');
    expect(formatTs(null)).toBe('—');
    expect(formatTs(42)).toBe('—');
  });
});

describe('padCell', () => {
  test('pads a short string with spaces', () => {
    expect(padCell('a', 4)).toBe('a   ');
  });

  test('returns the string as-is when length matches', () => {
    expect(padCell('abcd', 4)).toBe('abcd');
  });

  test('truncates with double-period when too long', () => {
    expect(padCell('abcdef', 4)).toBe('ab..');
  });

  test('handles undefined / null gracefully', () => {
    expect(padCell(undefined, 4)).toBe('    ');
    expect(padCell(null, 4)).toBe('    ');
  });
});

describe('tsToEpoch', () => {
  test('parses full ISO with Z and with explicit offset', () => {
    expect(tsToEpoch('2026-05-04T07:46:00Z')).toBe(Date.parse('2026-05-04T07:46:00Z'));
    expect(tsToEpoch('2026-05-27T19:56:00-04:00')).toBe(Date.parse('2026-05-27T19:56:00-04:00'));
  });
  test('parses date-only strings', () => {
    expect(tsToEpoch('2026-04-30')).toBe(Date.parse('2026-04-30'));
  });
  test('returns -Infinity for missing / empty / non-string / unparseable', () => {
    expect(tsToEpoch(undefined)).toBe(-Infinity);
    expect(tsToEpoch(null)).toBe(-Infinity);
    expect(tsToEpoch('')).toBe(-Infinity);
    expect(tsToEpoch('   ')).toBe(-Infinity);
    expect(tsToEpoch('not a date')).toBe(-Infinity);
    expect(tsToEpoch(42)).toBe(-Infinity);
  });
});

describe('tsCompare', () => {
  test('orders older before newer within the same timezone', () => {
    expect(tsCompare('2026-04-01T14:00:00Z', '2026-04-01T15:00:00Z')).toBeLessThan(0);
    expect(tsCompare('2026-04-01T15:00:00Z', '2026-04-01T14:00:00Z')).toBeGreaterThan(0);
    expect(tsCompare('2026-04-01T15:00:00Z', '2026-04-01T15:00:00Z')).toBe(0);
  });
  test('is CHRONOLOGICAL, not lexical, across mixed timezone offsets', () => {
    // 19:30-04:00 = 23:30Z is later than 23:00Z, though "19" < "23" lexically.
    const eastern = '2026-04-01T19:30:00-04:00';
    const utc = '2026-04-01T23:00:00Z';
    expect(tsCompare(eastern, utc)).toBeGreaterThan(0);          // eastern is newer
    expect(String(eastern).localeCompare(String(utc))).toBeLessThan(0); // lexical disagrees
  });
  test('newest-first sort puts the latest message on top', () => {
    const msgs = [
      { id: 'a', ts: '2026-04-01T10:00:00Z' },
      { id: 'b', ts: '2026-04-01T12:00:00Z' },
      { id: 'c', ts: '2026-04-01T11:00:00Z' },
    ];
    const sorted = [...msgs].sort((x, y) => tsCompare(y.ts, x.ts));
    expect(sorted.map((m) => m.id)).toEqual(['b', 'c', 'a']);
  });
  test('missing/invalid ts sink to the bottom of a newest-first sort (no NaN)', () => {
    const msgs = [
      { id: 'noTs' },
      { id: 'real', ts: '2026-04-01T10:00:00Z' },
      { id: 'bad', ts: 'garbage' },
    ];
    const sorted = [...msgs].sort((x, y) => tsCompare(y.ts, x.ts));
    expect(sorted[0].id).toBe('real');
  });
});
