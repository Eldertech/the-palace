import { describe, it, expect } from 'vitest';
import {
  filterCommits, kindCounts, authorCounts, groupByCampaign,
} from '../../src/lib/log-filter.js';

const COMMITS = [
  { hash: 'a', shortHash: 'a', kind: 'deposit', author: 'Claude', date: '2026-05-29T10:00:00Z', subject: 'deposit Foo', entries: ['Foo'], files: [{ path: 'Foo.md' }], trailers: { 'Palace-Author': ['claude'] } },
  { hash: 'b', shortHash: 'b', kind: 'edit', author: 'Loudon Stearns', date: '2026-05-28T10:00:00Z', subject: 'edit Bar', entries: ['Bar'], files: [{ path: 'Bar.md' }], trailers: {} },
  { hash: 'c', shortHash: 'c', kind: 'deposit', author: 'Claude', date: '2026-05-20T10:00:00Z', subject: 'deposit Baz', entries: ['Baz'], files: [{ path: 'sub/Baz.md' }], trailers: {}, campaign: 'weave-2026-05-20' },
  { hash: 'd', shortHash: 'd', kind: 'weave', author: 'Claude', date: '2026-05-20T11:00:00Z', subject: 'weave links', entries: ['Foo', 'Bar'], files: [{ path: 'Foo.md' }], trailers: {}, campaign: 'weave-2026-05-20' },
];

const PATH_PILLARS = new Map([
  ['Foo.md', ['tools', 'philosophy']],
  ['Bar.md', ['creation']],
  ['sub/Baz.md', ['practice']],
]);

describe('filterCommits', () => {
  it('returns all when filter empty', () => {
    expect(filterCommits(COMMITS, {})).toHaveLength(4);
  });
  it('filters by kind', () => {
    const r = filterCommits(COMMITS, { kind: 'deposit' });
    expect(r.map((c) => c.hash)).toEqual(['a', 'c']);
  });
  it('filters by entry (case-insensitive exact)', () => {
    const r = filterCommits(COMMITS, { entry: 'foo' });
    expect(r.map((c) => c.hash)).toEqual(['a', 'd']);
  });
  it('filters by author via git name', () => {
    const r = filterCommits(COMMITS, { author: 'loudon' });
    expect(r.map((c) => c.hash)).toEqual(['b']);
  });
  it('filters by author via Palace-Author trailer', () => {
    const r = filterCommits(COMMITS, { author: 'claude' });
    // a (trailer claude + git Claude), c, d (git Claude). b is Loudon.
    expect(r.map((c) => c.hash).sort()).toEqual(['a', 'c', 'd']);
  });
  it('filters by pillar via the path→pillars join', () => {
    const r = filterCommits(COMMITS, { pillar: 'tools' }, PATH_PILLARS);
    // Foo.md carries tools → commits touching Foo.md: a, d.
    expect(r.map((c) => c.hash).sort()).toEqual(['a', 'd']);
  });
  it('pillar filter matches nothing without the catalog map', () => {
    expect(filterCommits(COMMITS, { pillar: 'tools' }, null)).toHaveLength(0);
  });
  it('filters by time window (since)', () => {
    const r = filterCommits(COMMITS, { since: '2026-05-25' });
    expect(r.map((c) => c.hash).sort()).toEqual(['a', 'b']);
  });
  it('filters by text across subject/hash/entry', () => {
    expect(filterCommits(COMMITS, { text: 'weave' }).map((c) => c.hash)).toEqual(['d']);
    expect(filterCommits(COMMITS, { text: 'baz' }).map((c) => c.hash)).toEqual(['c']);
  });
  it('combines filters (AND)', () => {
    const r = filterCommits(COMMITS, { kind: 'deposit', author: 'claude' });
    expect(r.map((c) => c.hash)).toEqual(['a', 'c']);
  });
});

describe('kindCounts / authorCounts', () => {
  it('counts kinds', () => {
    const m = kindCounts(COMMITS);
    expect(m.get('deposit')).toBe(2);
    expect(m.get('weave')).toBe(1);
  });
  it('counts authors', () => {
    const m = authorCounts(COMMITS);
    expect(m.get('Claude')).toBe(3);
    expect(m.get('Loudon Stearns')).toBe(1);
  });
});

describe('groupByCampaign', () => {
  it('collapses a shared campaign into one thread, anchored at first occurrence', () => {
    const threads = groupByCampaign(COMMITS);
    // a (no campaign), b (no campaign), then the weave campaign thread (c+d).
    expect(threads).toHaveLength(3);
    expect(threads[0].campaign).toBeNull();
    expect(threads[1].campaign).toBeNull();
    expect(threads[2].campaign).toBe('weave-2026-05-20');
    expect(threads[2].commits.map((c) => c.hash)).toEqual(['c', 'd']);
  });
  it('singleton non-campaign commits stand alone', () => {
    const threads = groupByCampaign([COMMITS[0]]);
    expect(threads).toHaveLength(1);
    expect(threads[0].commits).toHaveLength(1);
  });
});
