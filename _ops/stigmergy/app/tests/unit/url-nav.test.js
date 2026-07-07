import { describe, it, expect } from 'vitest';
import {
  parseEntryFromUrl, buildEntrySearch,
  parseLensFromUrl, buildLensSearch,
  parseTreeTargetFromUrl, buildTreeTargetSearch,
  deckFromSearch, buildDeckSearch,
} from '../../src/lib/url-nav.js';

describe('parseEntryFromUrl', () => {
  it('returns null path for empty search', () => {
    expect(parseEntryFromUrl('')).toEqual({ path: null, edit: false });
    expect(parseEntryFromUrl('?')).toEqual({ path: null, edit: false });
  });

  it('reads ?entry=', () => {
    expect(parseEntryFromUrl('?entry=Kuramoto%20Coupling.md')).toEqual({
      path: 'Kuramoto Coupling.md', edit: false,
    });
  });

  it('reads ?entry=&edit=1', () => {
    expect(parseEntryFromUrl('?entry=Foo.md&edit=1')).toEqual({
      path: 'Foo.md', edit: true,
    });
  });

  it('handles entry with subdirs', () => {
    expect(parseEntryFromUrl('?entry=Shop%2FThree.js.md')).toEqual({
      path: 'Shop/Three.js.md', edit: false,
    });
  });

  it('preserves edit=1 even when no entry (the rendering layer ignores it)', () => {
    expect(parseEntryFromUrl('?edit=1')).toEqual({ path: null, edit: true });
  });

  it('SSR-safe for non-string input', () => {
    expect(parseEntryFromUrl(null)).toEqual({ path: null, edit: false });
    expect(parseEntryFromUrl(undefined)).toEqual({ path: null, edit: false });
  });
});

describe('buildEntrySearch', () => {
  it('builds an empty string when clearing entry', () => {
    expect(buildEntrySearch('?entry=Foo.md', { path: null })).toBe('');
  });

  it('builds ?entry=path when setting', () => {
    expect(buildEntrySearch('', { path: 'Foo.md' })).toBe('?entry=Foo.md');
  });

  it('builds ?entry=path&edit=1 when editing', () => {
    expect(buildEntrySearch('', { path: 'Foo.md', edit: true })).toBe(
      '?entry=Foo.md&edit=1',
    );
  });

  it('preserves other query params (deck, demo)', () => {
    const out = buildEntrySearch('?deck=STATE&demo=1', { path: 'Foo.md' });
    expect(out).toContain('deck=STATE');
    expect(out).toContain('demo=1');
    expect(out).toContain('entry=Foo.md');
  });

  it('drops edit when path cleared', () => {
    expect(buildEntrySearch('?entry=Foo.md&edit=1&deck=STATE', { path: null })).toBe('?deck=STATE');
  });

  it('drops edit when path set but edit false', () => {
    expect(buildEntrySearch('?entry=Foo.md&edit=1', { path: 'Bar.md', edit: false })).toBe('?entry=Bar.md');
  });

  it('encodes path with spaces and slashes', () => {
    expect(buildEntrySearch('', { path: 'Palace development/Two Batons.md' }))
      .toBe('?entry=Palace+development%2FTwo+Batons.md');
  });
});

describe('parseLensFromUrl', () => {
  it('defaults to pulse for empty / missing param', () => {
    expect(parseLensFromUrl('')).toBe('pulse');
    expect(parseLensFromUrl('?deck=STATE')).toBe('pulse');
  });
  it('reads ?lens=topology', () => {
    expect(parseLensFromUrl('?lens=topology')).toBe('topology');
  });
  it('reads ?lens=tree', () => {
    expect(parseLensFromUrl('?lens=tree')).toBe('tree');
  });
  it('coerces unknown lens values to pulse', () => {
    expect(parseLensFromUrl('?lens=bogus')).toBe('pulse');
    expect(parseLensFromUrl('?lens=PULSE')).toBe('pulse'); // case-strict
  });
  it('SSR-safe for non-string input', () => {
    expect(parseLensFromUrl(null)).toBe('pulse');
    expect(parseLensFromUrl(undefined)).toBe('pulse');
  });
});

describe('buildLensSearch', () => {
  it('omits lens=pulse (the implicit default) to keep URLs clean', () => {
    expect(buildLensSearch('?lens=topology', 'pulse')).toBe('');
    expect(buildLensSearch('', 'pulse')).toBe('');
  });
  it('writes lens=topology', () => {
    expect(buildLensSearch('', 'topology')).toBe('?lens=topology');
  });
  it('writes lens=tree', () => {
    expect(buildLensSearch('', 'tree')).toBe('?lens=tree');
  });
  it('preserves other params (deck, entry, edit)', () => {
    expect(buildLensSearch('?deck=STATE&entry=Foo.md', 'topology'))
      .toBe('?deck=STATE&entry=Foo.md&lens=topology');
  });
  it('replaces an existing lens param', () => {
    expect(buildLensSearch('?lens=topology&deck=STATE', 'pulse'))
      .toBe('?deck=STATE');
  });
});

describe('parseTreeTargetFromUrl', () => {
  it('reads ?tree=<path>', () => {
    expect(parseTreeTargetFromUrl('?tree=Projects%2FFoo.md')).toBe('Projects/Foo.md');
  });
  it('returns null when absent or empty', () => {
    expect(parseTreeTargetFromUrl('?lens=tree')).toBeNull();
    expect(parseTreeTargetFromUrl('')).toBeNull();
    expect(parseTreeTargetFromUrl(null)).toBeNull();
  });
});

describe('buildTreeTargetSearch', () => {
  it('sets the tree param, preserving others', () => {
    expect(buildTreeTargetSearch('?lens=tree', 'Foo.md')).toBe('?lens=tree&tree=Foo.md');
  });
  it('clears the tree param when path is falsy', () => {
    expect(buildTreeTargetSearch('?lens=tree&tree=Foo.md', null)).toBe('?lens=tree');
  });
});

describe('deckFromSearch', () => {
  it('defaults to STATE when no deck param and no demo', () => {
    expect(deckFromSearch('')).toBe('STATE');
    expect(deckFromSearch('?entry=Foo.md')).toBe('STATE');
  });
  it('reads an explicit ?deck= (case-insensitive)', () => {
    expect(deckFromSearch('?deck=QUEUE')).toBe('QUEUE');
    expect(deckFromSearch('?deck=log')).toBe('LOG');
    expect(deckFromSearch('?deck=Trickster')).toBe('TRICKSTER');
  });
  it('ignores an unknown deck value, falling through to the default', () => {
    expect(deckFromSearch('?deck=BOGUS')).toBe('STATE');
    expect(deckFromSearch('?deck=BOGUS&demo=1')).toBe('QUEUE');
  });
  it('lands demo mode on QUEUE when no explicit deck', () => {
    expect(deckFromSearch('?demo=1')).toBe('QUEUE');
  });
  it('an explicit deck beats the demo heuristic', () => {
    expect(deckFromSearch('?deck=STATE&demo=1')).toBe('STATE');
  });
  it('SSR-safe for non-string input', () => {
    expect(deckFromSearch(null)).toBe('STATE');
    expect(deckFromSearch(undefined)).toBe('STATE');
  });
});

describe('buildDeckSearch', () => {
  it('writes the deck param, uppercased', () => {
    expect(buildDeckSearch('', 'QUEUE')).toBe('?deck=QUEUE');
    expect(buildDeckSearch('', 'log')).toBe('?deck=LOG');
  });
  it('always records the deck (even STATE, the default) so back is unambiguous', () => {
    expect(buildDeckSearch('', 'STATE')).toBe('?deck=STATE');
  });
  it('replaces an existing deck param, preserving other params', () => {
    // delete-then-set moves deck to the end, like the sibling build helpers.
    expect(buildDeckSearch('?deck=STATE&entry=Foo.md', 'LOG'))
      .toBe('?entry=Foo.md&deck=LOG');
  });
  it('preserves entry/lens/demo when switching decks', () => {
    const out = buildDeckSearch('?entry=Foo.md&lens=topology&demo=1', 'QUEUE');
    expect(out).toContain('deck=QUEUE');
    expect(out).toContain('entry=Foo.md');
    expect(out).toContain('lens=topology');
    expect(out).toContain('demo=1');
  });
});
