import { describe, it, expect } from 'vitest';
import { buildIndex, resolveWikilink, extractWikilinks } from '../../src/lib/wikilink.js';

describe('buildIndex', () => {
  it('maps basenames to paths', () => {
    const idx = buildIndex([
      { path: 'CLAUDE.md' },
      { path: 'Palace development/Two Batons, One Board.md' },
    ]);
    expect(idx.get('CLAUDE')).toBe('CLAUDE.md');
    expect(idx.get('Two Batons, One Board')).toBe('Palace development/Two Batons, One Board.md');
  });

  it('first occurrence wins on collisions', () => {
    const idx = buildIndex([
      { path: 'A/Foo.md' },
      { path: 'B/Foo.md' },
    ]);
    expect(idx.get('Foo')).toBe('A/Foo.md');
  });

  it('returns empty map on non-array', () => {
    expect(buildIndex(null).size).toBe(0);
  });
});

describe('resolveWikilink', () => {
  const idx = buildIndex([
    { path: 'CLAUDE.md' },
    { path: 'Kuramoto Coupling.md' },
  ]);

  it('returns the path when present', () => {
    expect(resolveWikilink(idx, 'CLAUDE')).toEqual({ name: 'CLAUDE', path: 'CLAUDE.md' });
  });

  it('returns null path when missing', () => {
    expect(resolveWikilink(idx, 'Missing Entry')).toEqual({ name: 'Missing Entry', path: null });
  });

  it('strips [[ ]] if accidentally passed', () => {
    expect(resolveWikilink(idx, '[[CLAUDE]]')).toEqual({ name: 'CLAUDE', path: 'CLAUDE.md' });
  });

  it('handles [[Foo|alias]] aliases', () => {
    expect(resolveWikilink(idx, '[[CLAUDE|the entry point]]')).toEqual({
      name: 'CLAUDE',
      path: 'CLAUDE.md',
    });
  });

  it('empty/null inputs yield empty name + null path', () => {
    expect(resolveWikilink(idx, '')).toEqual({ name: '', path: null });
    expect(resolveWikilink(idx, null)).toEqual({ name: '', path: null });
  });

  it('accepts a plain object as index', () => {
    expect(resolveWikilink({ Foo: 'Foo.md' }, 'Foo')).toEqual({ name: 'Foo', path: 'Foo.md' });
  });
});

describe('extractWikilinks', () => {
  it('finds all [[...]] occurrences in order', () => {
    expect(extractWikilinks('see [[A]] then [[B|alias]] and [[C]].')).toEqual(['A', 'B', 'C']);
  });

  it('returns [] for empty/non-string', () => {
    expect(extractWikilinks('')).toEqual([]);
    expect(extractWikilinks(null)).toEqual([]);
  });

  it('skips empty brackets and newlines inside', () => {
    expect(extractWikilinks('[[]] and [[ok]]')).toEqual(['ok']);
  });
});
