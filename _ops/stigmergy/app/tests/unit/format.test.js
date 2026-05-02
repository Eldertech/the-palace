import { describe, test, expect } from 'vitest';
import { BOARDS, TYPE_GLYPHS, glyphFor, accentFor, healthColor, formatTs, padCell } from '../../src/lib/format.js';

describe('BOARDS', () => {
  test('exposes the six channels in the documented order', () => {
    expect(BOARDS).toEqual(['GENERAL', 'FLAGS', 'WEAVE', 'SYSTEM', 'TRICKSTER', 'BRANCHES']);
  });
});

describe('glyphFor', () => {
  test('returns a glyph string for every documented type', () => {
    const types = [
      'BROADCAST', 'REPLY', 'FLAG', 'PROOF',
      'RESOURCE_REQUEST', 'RESOURCE_GRANT', 'RESOURCE_DENY',
      'QUERY', 'SESSION_INIT', 'SESSION_CLOSE',
      'PAGE_UPDATE', 'HEALTH_NOTICE',
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
