import { describe, it, expect } from 'vitest';
import { emitYaml, emitEntryFile, formatScalar } from '../../src/lib/yaml-emit.js';
import { parseFrontmatter } from '../../src/lib/yaml-frontmatter.js';

describe('yaml-emit', () => {
  describe('emitYaml — canonical ordering', () => {
    it('puts known SCHEMA fields in canonical order', () => {
      const obj = {
        forward_vector: 'I will keep stretching.',
        type: 'concept',
        title: 'Foo',
        born: '2026-05',
        pillars: ['tools'],
        stage: 'seed',
      };
      const out = emitYaml(obj);
      const lines = out.trim().split('\n').filter((l) => !l.startsWith(' '));
      // title before type before pillars before born before stage before forward_vector
      const order = lines.map((l) => l.split(':')[0]);
      expect(order.indexOf('title')).toBeLessThan(order.indexOf('type'));
      expect(order.indexOf('type')).toBeLessThan(order.indexOf('pillars'));
      expect(order.indexOf('pillars')).toBeLessThan(order.indexOf('born'));
      expect(order.indexOf('born')).toBeLessThan(order.indexOf('stage'));
      expect(order.indexOf('stage')).toBeLessThan(order.indexOf('forward_vector'));
    });

    it('appends unknown keys after known ones in insertion order', () => {
      const obj = { title: 'X', type: 'concept', custom_z: 'z', custom_a: 'a' };
      const out = emitYaml(obj);
      const idxZ = out.indexOf('custom_z');
      const idxA = out.indexOf('custom_a');
      const idxType = out.indexOf('type');
      expect(idxType).toBeLessThan(idxZ);
      expect(idxZ).toBeLessThan(idxA);
    });
  });

  describe('emitYaml — arrays', () => {
    it('renders pillars inline-flow', () => {
      const out = emitYaml({ pillars: ['tools', 'practice'] });
      expect(out).toContain('pillars: [tools, practice]');
    });

    it('renders tags inline-flow', () => {
      const out = emitYaml({ tags: ['specialist', 'shop'] });
      expect(out).toContain('tags: [specialist, shop]');
    });

    it('renders links as block-style with target/type/label', () => {
      const out = emitYaml({
        links: [
          { target: '[[Foo]]', type: 'connects-to', label: 'midwifed' },
        ],
      });
      expect(out).toContain('links:');
      expect(out).toContain('  - target: "[[Foo]]"');
      expect(out).toContain('    type: connects-to');
      expect(out).toContain('    label: midwifed');
    });

    it('renders empty arrays as []', () => {
      const out = emitYaml({ pillars: [] });
      expect(out).toContain('pillars: []');
    });
  });

  describe('emitYaml — quoting', () => {
    it('quotes forward_vector always (even simple text)', () => {
      const out = emitYaml({ forward_vector: 'I will keep going.' });
      expect(out).toContain('forward_vector: "I will keep going."');
    });

    it('quotes wikilink targets', () => {
      const s = formatScalar('[[Foo]]', 'target');
      expect(s).toBe('"[[Foo]]"');
    });

    it('quotes strings with colons', () => {
      const out = emitYaml({ title: 'STIGMERGY v1.0 — Phase 5: Build' });
      expect(out).toMatch(/title: ".*"/);
    });

    it('does not quote bare safe scalars', () => {
      const out = emitYaml({ type: 'concept', stage: 'seed' });
      expect(out).toContain('type: concept');
      expect(out).toContain('stage: seed');
    });

    it('quotes reserved scalars (true/false/null/yes/no)', () => {
      expect(formatScalar('yes', null)).toBe('"yes"');
      expect(formatScalar('no', null)).toBe('"no"');
      expect(formatScalar('null', null)).toBe('"null"');
    });

    it('quotes number-like strings to preserve string-ness', () => {
      expect(formatScalar('2026', null)).toBe('"2026"');
    });

    it('emits bare numbers without quotes', () => {
      expect(formatScalar(42, null)).toBe('42');
      expect(formatScalar(1.5, null)).toBe('1.5');
    });
  });

  describe('emitYaml — empty / null values', () => {
    it('renders null as bare key:', () => {
      const out = emitYaml({ last_tested: null });
      expect(out).toContain('last_tested:');
      expect(out).not.toContain('last_tested: null');
    });

    it('renders empty string as bare key:', () => {
      const out = emitYaml({ last_tested: '' });
      expect(out).toContain('last_tested:');
    });
  });

  describe('emitYaml — nested objects (agency_profile)', () => {
    it('renders agency_profile as nested block', () => {
      const out = emitYaml({
        agency_profile: {
          creation: 'I want to spawn.',
          tools: 'I need GPU.',
        },
      });
      expect(out).toContain('agency_profile:');
      // Sub-field values are not in ALWAYS_QUOTE so they emit bare when
      // they don't need quoting. Both unquoted and quoted are valid YAML;
      // the round-trip test below asserts semantic equality.
      expect(out).toMatch(/  creation: "?I want to spawn\."?/);
      expect(out).toMatch(/  tools: "?I need GPU\."?/);
    });
  });

  describe('emitEntryFile', () => {
    it('wraps YAML in --- fences and joins the body', () => {
      const out = emitEntryFile({ title: 'Foo', type: 'concept' }, '\n# Foo\n\nBody.');
      expect(out.startsWith('---\n')).toBe(true);
      expect(out).toContain('title: Foo');
      expect(out).toContain('type: concept');
      expect(out).toContain('---\n');
      expect(out).toContain('# Foo');
    });

    it('normalizes the close-fence/body separator to one blank line', () => {
      // Palace convention: exactly one blank line between --- and body.
      // Bodies passed in without one get normalized; bodies with extra leading
      // whitespace get normalized down. Round-trips through parseFrontmatter.
      const out = emitEntryFile({ title: 'X' }, '# X');
      expect(out).toContain('---\n\n# X');
    });

    it('returns just the body when frontmatter is empty', () => {
      const out = emitEntryFile({}, '# Bare\n');
      expect(out).toBe('# Bare\n');
    });
  });

  describe('emitYaml — styleHints preserve on-disk array style', () => {
    it('preserves block style for pillars when hinted', () => {
      const out = emitYaml(
        { pillars: ['creation', 'tools'] },
        { styleHints: { pillars: 'block' } },
      );
      expect(out).toContain('pillars:');
      expect(out).toContain('  - creation');
      expect(out).toContain('  - tools');
      expect(out).not.toMatch(/pillars: \[/);
    });

    it('preserves inline style for tags when hinted', () => {
      const out = emitYaml(
        { tags: ['specialist', 'shop'] },
        { styleHints: { tags: 'inline' } },
      );
      expect(out).toContain('tags: [specialist, shop]');
    });

    it('falls back to INLINE_ARRAY_FIELDS default when no hint', () => {
      const out = emitYaml({ pillars: ['tools'] });
      expect(out).toContain('pillars: [tools]');
    });

    it('hints override the default both ways', () => {
      const outBlock = emitYaml(
        { tags: ['a', 'b'] },
        { styleHints: { tags: 'block' } },
      );
      expect(outBlock).toContain('  - a');
      const outInline = emitYaml(
        { pillars: ['tools', 'practice'] },
        { styleHints: { pillars: 'inline' } },
      );
      expect(outInline).toContain('pillars: [tools, practice]');
    });
  });

  describe('round-trip', () => {
    const FIXTURES = [
      {
        name: 'simple concept',
        fm: {
          title: 'Cooperation Yields Agency',
          type: 'hub',
          pillars: ['philosophy', 'tools'],
          born: '2026-03',
          stage: 'mature',
          links: [
            { target: '[[Four Pillars]]', type: 'exemplifies', label: null },
          ],
          forward_vector: 'I will keep coupling.',
        },
      },
      {
        name: 'specialist with empty/null fields',
        fm: {
          title: 'Three.js',
          type: 'specialist',
          status: 'stub',
          medium: '3d',
          tool: 'three.js',
          tool_version: 'r128',
          adopted: '2026-05-30',
          last_tested: null,
          last_gotcha: null,
          license: 'MIT',
          links: [
            { target: 'three.js (external)', type: 'connects-to', label: 'wraps' },
          ],
          tags: ['specialist', 'shop', '3d'],
        },
      },
      {
        name: 'agency_profile nested',
        fm: {
          title: 'X',
          type: 'concept',
          pillars: ['practice'],
          born: '2026-05',
          stage: 'sprout',
          agency_profile: {
            creation: 'I spawn variants.',
            tools: 'I need a webcam and a CPU.',
          },
          forward_vector: 'I will keep going.',
        },
      },
    ];

    for (const fx of FIXTURES) {
      it(`${fx.name} re-parses to the same object`, () => {
        const yaml = emitYaml(fx.fm);
        const text = `---\n${yaml}---\n\nbody\n`;
        const { frontmatter, error } = parseFrontmatter(text);
        expect(error).toBeNull();
        // Compare by JSON to handle null vs undefined and array equality.
        const normalized = (o) => JSON.parse(JSON.stringify(o));
        expect(normalized(frontmatter)).toEqual(normalized(fx.fm));
      });
    }
  });
});
