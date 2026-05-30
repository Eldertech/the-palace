import { describe, it, expect } from 'vitest';
import {
  parseSubject, parseTrailers, inferKind, classifyCommit,
  derivedEntriesFromPaths, KNOWN_KINDS, kindColor,
} from '../../src/lib/commit-parse.js';

describe('parseSubject', () => {
  it('parses a spec-form subject with scope', () => {
    expect(parseSubject('ops(stigmergy): land phase 1')).toEqual({
      kind: 'ops', scope: 'stigmergy', summary: 'land phase 1', declared: true,
    });
  });
  it('parses a spec-form subject without scope', () => {
    expect(parseSubject('deposit: a new entry')).toEqual({
      kind: 'deposit', scope: null, summary: 'a new entry', declared: true,
    });
  });
  it('does not declare a kind for an unknown token', () => {
    const r = parseSubject('checkpoint(palace): full state');
    expect(r.declared).toBe(false);
    expect(r.kind).toBeNull();
    expect(r.scope).toBe('palace');
    expect(r.summary).toBe('full state');
    expect(r.subjectToken).toBe('checkpoint');
  });
  it('handles free-prose pre-spec subjects', () => {
    const r = parseSubject('Swarm Weave A/B experiment: does peer access change output?');
    expect(r.declared).toBe(false);
    expect(r.kind).toBeNull();
    // "Swarm Weave A/B experiment" has spaces so it is not a token(scope) form.
    expect(r.summary).toBe('Swarm Weave A/B experiment: does peer access change output?');
  });
  it('handles empty input', () => {
    expect(parseSubject('').summary).toBe('');
    expect(parseSubject(null).summary).toBe('');
  });
});

describe('parseTrailers', () => {
  it('parses the full trailer block', () => {
    const body = [
      'Some prose body.',
      '',
      'Palace-Kind: deposit',
      'Palace-Entry: Two Batons, One Board',
      'Palace-Entry: Handoff Ceremony',
      'Palace-Stage: Two Batons: seed→sprout',
      'Palace-Vector: Two Batons: born',
      'Palace-Resolves: queue-item-7',
      'Palace-Campaign: weave-2026-05-29',
      'Palace-Verify: verified',
      'Palace-Author: claude',
    ].join('\n');
    const t = parseTrailers(body);
    expect(t.kind).toBe('deposit');
    expect(t.entries).toEqual(['Two Batons, One Board', 'Handoff Ceremony']);
    expect(t.stage).toEqual(['Two Batons: seed→sprout']);
    expect(t.vector).toEqual(['Two Batons: born']);
    expect(t.resolves).toEqual(['queue-item-7']);
    expect(t.campaign).toBe('weave-2026-05-29');
    expect(t.verify).toBe('verified');
    expect(t.author).toBe('claude');
  });
  it('handles values with embedded colons', () => {
    const t = parseTrailers('Palace-Stage: Semantic Delay: growing→growing');
    expect(t.stage).toEqual(['Semantic Delay: growing→growing']);
  });
  it('returns empty structure for a body with no trailers', () => {
    const t = parseTrailers('just a normal commit body\nwith two lines');
    expect(t.kind).toBeNull();
    expect(t.entries).toEqual([]);
  });
  it('handles empty/null body', () => {
    expect(parseTrailers('').entries).toEqual([]);
    expect(parseTrailers(null).entries).toEqual([]);
  });
});

describe('inferKind', () => {
  it('SCHEMA.md → schema', () => {
    expect(inferKind(['SCHEMA.md'])).toBe('schema');
  });
  it('a handoff file → handoff', () => {
    expect(inferKind(['Kuramoto/Kuramoto — handoff.md'])).toBe('handoff');
  });
  it('only ops/app code → ops', () => {
    expect(inferKind(['_ops/stigmergy/app/src/App.jsx', '_ops/foo.js'])).toBe('ops');
  });
  it('media inside a bundle, no knowledge md → enrich', () => {
    expect(inferKind(['Kuramoto Coupling/fireflies.png'])).toBe('enrich');
  });
  it('knowledge + ops together → mixed', () => {
    expect(inferKind(['Some Entry.md', '_ops/foo.js'])).toBe('mixed');
  });
  it('a newly-added knowledge md → deposit', () => {
    expect(inferKind(['New Entry.md'], ['New Entry.md'])).toBe('deposit');
  });
  it('an edited knowledge md → edit', () => {
    expect(inferKind(['Existing Entry.md'], [])).toBe('edit');
  });
  it('empty paths → edit', () => {
    expect(inferKind([])).toBe('edit');
  });
});

describe('derivedEntriesFromPaths', () => {
  it('extracts basenames of knowledge md, skips machinery', () => {
    const out = derivedEntriesFromPaths([
      'Kuramoto Coupling.md',
      'Palace development/Two Batons, One Board.md',
      '_ops/stigmergy/app/src/App.jsx',
      '_ops/stigmergy/app/README.md',
      '_ops/swarm/sessions/x/blackboard.jsonl',
    ]);
    expect(out).toEqual(['Kuramoto Coupling', 'Two Batons, One Board']);
  });
  it('dedupes', () => {
    expect(derivedEntriesFromPaths(['A.md', 'sub/A.md'])).toEqual(['A']);
  });
});

describe('classifyCommit', () => {
  it('prefers a Palace-Kind trailer', () => {
    const c = classifyCommit({
      subject: 'weird subject',
      body: 'Palace-Kind: enrich\nPalace-Entry: Foo',
      paths: ['Foo.md'],
    });
    expect(c.kind).toBe('enrich');
    expect(c.kindSource).toBe('trailer');
    expect(c.entries).toEqual(['Foo']);
  });
  it('falls back to a declared subject kind', () => {
    const c = classifyCommit({
      subject: 'deposit(Foo): name it',
      body: '',
      paths: ['Foo.md'],
    });
    expect(c.kind).toBe('deposit');
    expect(c.kindSource).toBe('subject');
    expect(c.scope).toBe('Foo');
  });
  it('infers a kind for pre-spec commits', () => {
    const c = classifyCommit({
      subject: 'Two Batons, One Board: bridge the baton',
      body: '',
      paths: ['Palace development/Two Batons, One Board.md'],
    });
    expect(c.kindSource).toBe('inferred');
    expect(c.knownKind).toBe(true);
    expect(c.entries).toEqual(['Two Batons, One Board']);
  });
  it('derives entries from paths when no trailers', () => {
    const c = classifyCommit({
      subject: 'edit some things',
      body: '',
      paths: ['A.md', 'B.md'],
    });
    expect(c.entries).toEqual(['A', 'B']);
  });
});

describe('kindColor', () => {
  it('returns a CSS var for known kinds', () => {
    for (const k of KNOWN_KINDS) {
      expect(kindColor(k)).toMatch(/var\(--/);
    }
  });
  it('falls back to the other color for unknown', () => {
    expect(kindColor('nonsense')).toBe(kindColor('other'));
  });
});
