import { describe, it, expect } from 'vitest';
import { parseEntryFromUrl, buildEntrySearch } from '../../src/lib/url-nav.js';

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
