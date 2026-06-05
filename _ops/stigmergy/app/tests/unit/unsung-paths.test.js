import { describe, it, expect } from 'vitest';
import {
  findUnsungInEntry, findUnsungEdges, buildPalaceIndex,
} from '../../src/lib/unsung-paths.js';

describe('findUnsungInEntry', () => {
  it('returns body wikilinks not present in YAML links', () => {
    const entry = {
      links: [{ target: 'Cooperation Yields Agency', type: 'connects-to' }],
      body: 'See [[Cooperation Yields Agency]] and also [[Kuramoto Coupling]] for context.',
    };
    expect(findUnsungInEntry(entry)).toEqual(['Kuramoto Coupling']);
  });
  it('dedupes repeated mentions in document order', () => {
    const entry = {
      links: [],
      body: '[[Foo]] then [[Foo]] then [[Bar]] then [[Foo]]',
    };
    expect(findUnsungInEntry(entry)).toEqual(['Foo', 'Bar']);
  });
  it('YAML coverage is case-insensitive', () => {
    const entry = {
      links: [{ target: 'kuramoto coupling', type: 'connects-to' }],
      body: 'see [[Kuramoto Coupling]]',
    };
    expect(findUnsungInEntry(entry)).toEqual([]);
  });
  it('returns [] when body is missing or empty', () => {
    expect(findUnsungInEntry({ links: [] })).toEqual([]);
    expect(findUnsungInEntry({ links: [], body: '' })).toEqual([]);
    expect(findUnsungInEntry(null)).toEqual([]);
  });
  it('handles aliased wikilinks ([[Foo|alias]]) using the bare name', () => {
    const entry = {
      links: [],
      body: 'see [[Cooperation Yields Agency|cooperation]]',
    };
    expect(findUnsungInEntry(entry)).toEqual(['Cooperation Yields Agency']);
  });
});

describe('buildPalaceIndex', () => {
  it('indexes by filename and by title, lowercased', () => {
    const idx = buildPalaceIndex([
      { path: 'Foo.md', title: 'Foo' },
      { path: 'Nested/Bar Baz.md', title: 'Bar Baz' },
    ]);
    expect(idx.get('foo')).toBe('Foo.md');
    expect(idx.get('bar baz')).toBe('Nested/Bar Baz.md');
  });
  it('filename takes precedence on conflict', () => {
    const idx = buildPalaceIndex([
      { path: 'Foo.md', title: 'Aliased Title' },
      { path: 'Other.md', title: 'foo' },
    ]);
    expect(idx.get('foo')).toBe('Foo.md');
  });
  it('returns an empty Map for non-array input', () => {
    expect(buildPalaceIndex(null).size).toBe(0);
  });
});

describe('findUnsungEdges', () => {
  const entries = [
    {
      path: 'A.md', title: 'A',
      links: [{ target: 'B', type: 'connects-to' }],
      body: '[[B]] is typed. [[C]] is unsung. [[Off-palace concept]] is a mention.',
    },
    {
      path: 'B.md', title: 'B',
      links: [],
      body: 'no body wikilinks here',
    },
  ];
  const idx = buildPalaceIndex([
    { path: 'A.md', title: 'A' },
    { path: 'B.md', title: 'B' },
    { path: 'C.md', title: 'C' },
  ]);

  it('emits an edge for each body wikilink not in YAML AND resolving to a palace entry', () => {
    const out = findUnsungEdges(entries, idx);
    expect(out).toEqual([
      { source: 'A.md', target_name: 'C', target_path: 'C.md' },
    ]);
  });
  it('drops body wikilinks to off-palace concepts', () => {
    const out = findUnsungEdges(entries, idx);
    expect(out.find((e) => e.target_name === 'Off-palace concept')).toBeUndefined();
  });
  it('drops self-loops', () => {
    const self = [{
      path: 'X.md', title: 'X', links: [], body: '[[X]] points to itself',
    }];
    const out = findUnsungEdges(self, buildPalaceIndex([{ path: 'X.md', title: 'X' }]));
    expect(out).toEqual([]);
  });
  it('returns [] for non-array input', () => {
    expect(findUnsungEdges(null, idx)).toEqual([]);
  });
});
