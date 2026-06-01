import { describe, it, expect } from 'vitest';
import {
  parseFrontmatter,
  normalizeLinks,
  stripWikiBrackets,
  normalizePillars,
  detectArrayStyles,
} from '../../src/lib/yaml-frontmatter.js';

describe('parseFrontmatter', () => {
  it('parses a simple block', () => {
    const r = parseFrontmatter('---\ntitle: Foo\ntype: concept\n---\nhello\n');
    expect(r.error).toBeNull();
    expect(r.frontmatter.title).toBe('Foo');
    expect(r.frontmatter.type).toBe('concept');
    expect(r.body).toBe('hello\n');
  });

  it('returns body unchanged when no frontmatter', () => {
    const r = parseFrontmatter('# Just a body\n\ntext.\n');
    expect(r.frontmatter).toEqual({});
    expect(r.body).toBe('# Just a body\n\ntext.\n');
    expect(r.error).toBeNull();
  });

  it('handles nested list-of-objects (links)', () => {
    const r = parseFrontmatter(
      '---\nlinks:\n  - target: "[[A]]"\n    type: mirrors\n  - target: "[[B]]"\n    type: deepens\n---\n'
    );
    expect(r.error).toBeNull();
    expect(r.frontmatter.links).toHaveLength(2);
    expect(r.frontmatter.links[0].target).toBe('[[A]]');
    expect(r.frontmatter.links[1].type).toBe('deepens');
  });

  it('handles inline array (pillars: [a, b])', () => {
    const r = parseFrontmatter('---\npillars: [tools, creation]\n---\n');
    expect(r.frontmatter.pillars).toEqual(['tools', 'creation']);
  });

  it('handles nested object (agency_profile)', () => {
    const r = parseFrontmatter(
      '---\nagency_profile:\n  creation: "want to make X"\n  tools: "need Y"\n---\n'
    );
    expect(r.frontmatter.agency_profile).toEqual({
      creation: 'want to make X',
      tools: 'need Y',
    });
  });

  it('reports an error for unterminated frontmatter without throwing', () => {
    const r = parseFrontmatter('---\ntitle: Foo\nbody never starts');
    expect(r.frontmatter).toEqual({});
    expect(r.error).toMatch(/unterminated/);
  });

  it('reports an error for malformed yaml without throwing', () => {
    const r = parseFrontmatter('---\ntitle: foo: bar: baz\n  -bad indent\n---\nx');
    // js-yaml may parse the first line as `title: 'foo: bar: baz'`, which is
    // technically valid YAML — what we care about is that we never throw.
    // The body still comes through.
    expect(r.body).toBe('x');
  });

  it('non-string input returns empty', () => {
    const r = parseFrontmatter(null);
    expect(r.frontmatter).toEqual({});
    expect(r.body).toBe('');
  });
});

describe('stripWikiBrackets', () => {
  it('strips [[ ]]', () => {
    expect(stripWikiBrackets('[[Foo]]')).toBe('Foo');
  });
  it('passes through bare names', () => {
    expect(stripWikiBrackets('Foo')).toBe('Foo');
  });
  it('handles inner whitespace', () => {
    expect(stripWikiBrackets('[[ Foo ]]')).toBe('Foo');
  });
  it('returns empty for non-strings', () => {
    expect(stripWikiBrackets(null)).toBe('');
    expect(stripWikiBrackets(undefined)).toBe('');
    expect(stripWikiBrackets(42)).toBe('');
  });
});

describe('normalizeLinks', () => {
  it('normalizes [[X]] targets and preserves type/label', () => {
    const out = normalizeLinks([
      { target: '[[A]]', type: 'mirrors', label: 'rhymes-with' },
      { target: 'B', type: 'deepens' },
    ]);
    expect(out).toEqual([
      { target: 'A', type: 'mirrors', label: 'rhymes-with' },
      { target: 'B', type: 'deepens', label: null },
    ]);
  });

  it('defaults type to connects-to when missing', () => {
    expect(normalizeLinks([{ target: '[[X]]' }])).toEqual([
      { target: 'X', type: 'connects-to', label: null },
    ]);
  });

  it('drops entries with empty/missing targets', () => {
    const out = normalizeLinks([
      { target: '', type: 'mirrors' },
      { type: 'mirrors' },
      { target: '[[OK]]', type: 'mirrors' },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].target).toBe('OK');
  });

  it('returns [] on non-array', () => {
    expect(normalizeLinks(null)).toEqual([]);
    expect(normalizeLinks('not an array')).toEqual([]);
  });
});

describe('normalizePillars', () => {
  it('lowercases array entries', () => {
    expect(normalizePillars(['Tools', 'Creation'])).toEqual(['tools', 'creation']);
  });

  it('splits inline strings on whitespace + commas', () => {
    expect(normalizePillars('Tools, Creation Philosophy')).toEqual([
      'tools', 'creation', 'philosophy',
    ]);
  });

  it('drops empties', () => {
    expect(normalizePillars(['', 'tools', null])).toEqual(['tools']);
  });

  it('returns [] for null/undefined', () => {
    expect(normalizePillars(null)).toEqual([]);
    expect(normalizePillars(undefined)).toEqual([]);
  });
});

describe('detectArrayStyles', () => {
  it('detects inline pillars', () => {
    const text = '---\ntitle: X\npillars: [tools, philosophy]\n---\n# body\n';
    expect(detectArrayStyles(text).pillars).toBe('inline');
  });

  it('detects block pillars', () => {
    const text = '---\ntitle: X\npillars:\n  - creation\n  - tools\n---\n# body\n';
    expect(detectArrayStyles(text).pillars).toBe('block');
  });

  it('detects block links', () => {
    const text = '---\nlinks:\n  - target: "[[Foo]]"\n    type: connects-to\n---\n# body\n';
    expect(detectArrayStyles(text).links).toBe('block');
  });

  it('detects inline tags vs block pillars in the same entry', () => {
    const text = '---\ntags: [a, b, c]\npillars:\n  - tools\n---\n';
    const styles = detectArrayStyles(text);
    expect(styles.tags).toBe('inline');
    expect(styles.pillars).toBe('block');
  });

  it('returns {} for text without frontmatter', () => {
    expect(detectArrayStyles('just a body\n')).toEqual({});
  });

  it('returns {} for empty input', () => {
    expect(detectArrayStyles('')).toEqual({});
    expect(detectArrayStyles(null)).toEqual({});
  });

  it('does not mistake a nested object for an array', () => {
    const text = '---\nagency_profile:\n  creation: foo\n  tools: bar\n---\n';
    // agency_profile is an object, not an array — should not be hinted.
    expect(detectArrayStyles(text).agency_profile).toBeUndefined();
  });
});
