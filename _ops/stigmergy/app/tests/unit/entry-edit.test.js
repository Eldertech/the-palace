import { describe, it, expect } from 'vitest';
import {
  checkAllowList, isDirty, validateFrontmatter, wikilinkSuggestions,
  ENTRY_TYPES, STAGES, PILLARS, LINK_TYPES,
} from '../../src/lib/entry-edit.js';

describe('entry-edit', () => {
  describe('checkAllowList', () => {
    it('allows ordinary entries', () => {
      expect(checkAllowList('Kuramoto Coupling.md').allowed).toBe(true);
      expect(checkAllowList('Shop/Three.js.md').allowed).toBe(true);
      expect(checkAllowList('Projects/Foo.md').allowed).toBe(true);
    });

    it('refuses .git/.claude/_ops/stigmergy machinery', () => {
      expect(checkAllowList('.git/HEAD').allowed).toBe(false);
      expect(checkAllowList('.claude/settings.json').allowed).toBe(false);
      expect(checkAllowList('_ops/stigmergy/app/src/foo.js').allowed).toBe(false);
      expect(checkAllowList('_ops/swarm/persistent/blackboard.jsonl').allowed).toBe(false);
    });

    it('refuses non-.md paths', () => {
      expect(checkAllowList('Foo.py').allowed).toBe(false);
      expect(checkAllowList('Foo.html').allowed).toBe(false);
    });

    it('refuses path traversal and null bytes', () => {
      expect(checkAllowList('../escape.md').allowed).toBe(false);
      expect(checkAllowList('foo/../bar.md').allowed).toBe(false);
      expect(checkAllowList('foo\0.md').allowed).toBe(false);
    });

    it('refuses canon files (CLAUDE/SCHEMA/SUBSTRATE/...)', () => {
      expect(checkAllowList('CLAUDE.md').allowed).toBe(false);
      expect(checkAllowList('SCHEMA.md').allowed).toBe(false);
      expect(checkAllowList('SUBSTRATE.md').allowed).toBe(false);
      expect(checkAllowList('JEWEL.md').allowed).toBe(false);
      expect(checkAllowList('ROSETTA.md').allowed).toBe(false);
      expect(checkAllowList('FOUR PILLARS.md').allowed).toBe(false);
      expect(checkAllowList('README - The Palace Guide.md').allowed).toBe(false);
      expect(checkAllowList('_ops/Substrate Skill.md').allowed).toBe(false);
      expect(checkAllowList('_ops/Palace Ceremonies.md').allowed).toBe(false);
    });

    it('refuses individual ceremony cards in _ops/', () => {
      expect(checkAllowList('_ops/Deposit Ceremony.md').allowed).toBe(false);
      expect(checkAllowList('_ops/Weave Ceremony.md').allowed).toBe(false);
      expect(checkAllowList('_ops/Handoff Ceremony.md').allowed).toBe(false);
    });

    it('allows non-canon entries under _ops/ (handoffs, notes)', () => {
      expect(checkAllowList('_ops/Palace Quotes.md').allowed).toBe(true);
      expect(checkAllowList('_ops/stigmergy/v1.0-phase5-handoff.md').allowed).toBe(true);
    });
  });

  describe('isDirty', () => {
    const base = {
      frontmatter: { title: 'X', type: 'concept', stage: 'seed', pillars: ['tools'] },
      body: 'hello',
    };

    it('false for identical inputs', () => {
      expect(isDirty(base, JSON.parse(JSON.stringify(base)))).toBe(false);
    });

    it('true for body change', () => {
      const next = { ...base, body: 'changed' };
      expect(isDirty(base, next)).toBe(true);
    });

    it('true for scalar frontmatter change', () => {
      const next = { ...base, frontmatter: { ...base.frontmatter, stage: 'sprout' } };
      expect(isDirty(base, next)).toBe(true);
    });

    it('false when pillars reorder', () => {
      const a = { ...base, frontmatter: { ...base.frontmatter, pillars: ['tools', 'practice'] } };
      const b = { ...base, frontmatter: { ...base.frontmatter, pillars: ['practice', 'tools'] } };
      expect(isDirty(a, b)).toBe(false);
    });

    it('true when a link is added', () => {
      const a = { ...base, frontmatter: { ...base.frontmatter, links: [] } };
      const b = { ...base, frontmatter: { ...base.frontmatter, links: [{ target: 'Foo', type: 'connects-to' }] } };
      expect(isDirty(a, b)).toBe(true);
    });

    it('false when links reorder', () => {
      const linksA = [
        { target: 'A', type: 'connects-to', label: null },
        { target: 'B', type: 'enables', label: null },
      ];
      const linksB = [
        { target: 'B', type: 'enables', label: null },
        { target: 'A', type: 'connects-to', label: null },
      ];
      const a = { ...base, frontmatter: { ...base.frontmatter, links: linksA } };
      const b = { ...base, frontmatter: { ...base.frontmatter, links: linksB } };
      expect(isDirty(a, b)).toBe(false);
    });
  });

  describe('validateFrontmatter — required fields', () => {
    const minimal = {
      title: 'Foo',
      type: 'concept',
      pillars: ['tools'],
      born: '2026-05',
      stage: 'seed',
    };

    it('passes a minimal valid concept', () => {
      const r = validateFrontmatter(minimal);
      expect(r.valid).toBe(true);
    });

    it('requires title', () => {
      const r = validateFrontmatter({ ...minimal, title: '' });
      expect(r.valid).toBe(false);
      expect(r.errors.some((e) => e.includes('title'))).toBe(true);
    });

    it('requires type from SCHEMA §1 enum', () => {
      const r = validateFrontmatter({ ...minimal, type: 'imaginary' });
      expect(r.valid).toBe(false);
      expect(r.errors.some((e) => e.includes('type'))).toBe(true);
    });

    it('requires pillars for concept', () => {
      const r = validateFrontmatter({ ...minimal, pillars: [] });
      expect(r.valid).toBe(false);
      expect(r.errors.some((e) => e.includes('pillars'))).toBe(true);
    });

    it('does not require pillars for specialist', () => {
      const r = validateFrontmatter({
        title: 'X', type: 'specialist', born: '2026-05',
        status: 'alive', medium: 'image', tool: 'foo', tool_version: '1',
      });
      expect(r.valid).toBe(true);
    });

    it('does not require stage for specialist', () => {
      const r = validateFrontmatter({
        title: 'X', type: 'specialist', born: '2026-05',
        status: 'alive', medium: 'image', tool: 'foo', tool_version: '1',
      });
      expect(r.errors.some((e) => e.includes('stage'))).toBe(false);
    });

    it('requires born YYYY-MM', () => {
      const r = validateFrontmatter({ ...minimal, born: 'recent' });
      expect(r.valid).toBe(false);
      expect(r.errors.some((e) => e.includes('born'))).toBe(true);
    });
  });

  describe('validateFrontmatter — type-specific required', () => {
    it('project requires status', () => {
      const r = validateFrontmatter({
        title: 'P', type: 'project', pillars: ['creation'], born: '2026-05', stage: 'sprout',
      });
      expect(r.valid).toBe(false);
      expect(r.errors.some((e) => e.includes('status'))).toBe(true);
    });

    it('source requires author/year/medium', () => {
      const r = validateFrontmatter({
        title: 'S', type: 'source', pillars: ['tools'], born: '2026-05', stage: 'sprout',
      });
      expect(r.valid).toBe(false);
      expect(r.errors.some((e) => e.includes('author'))).toBe(true);
      expect(r.errors.some((e) => e.includes('year'))).toBe(true);
      expect(r.errors.some((e) => e.includes('medium'))).toBe(true);
    });

    it('specialist requires status/medium/tool/tool_version', () => {
      const r = validateFrontmatter({
        title: 'X', type: 'specialist', born: '2026-05',
      });
      expect(r.valid).toBe(false);
      expect(r.errors.some((e) => e.includes('status'))).toBe(true);
      expect(r.errors.some((e) => e.includes('tool'))).toBe(true);
    });
  });

  describe('validateFrontmatter — links', () => {
    const ok = {
      title: 'F', type: 'concept', pillars: ['tools'], born: '2026-05', stage: 'seed',
    };

    it('refuses link type not in SCHEMA §4', () => {
      const r = validateFrontmatter({
        ...ok,
        links: [{ target: 'X', type: 'fake-link-type' }],
      });
      expect(r.valid).toBe(false);
      expect(r.errors.some((e) => e.includes('fake-link-type'))).toBe(true);
    });

    it('accepts the 10 canonical link types', () => {
      for (const t of LINK_TYPES) {
        const r = validateFrontmatter({
          ...ok,
          links: [{ target: 'X', type: t }],
        });
        expect(r.valid).toBe(true);
      }
    });
  });

  describe('validateFrontmatter — forward_vector conatus warning', () => {
    const base = {
      title: 'F', type: 'concept', pillars: ['tools'], born: '2026-05', stage: 'seed',
    };

    it('warns on "I will remain X"', () => {
      const r = validateFrontmatter({ ...base, forward_vector: 'I will remain a stable hub.' });
      expect(r.valid).toBe(true);
      expect(r.warnings.some((w) => w.includes('stasis'))).toBe(true);
    });

    it('does not warn on striving forward_vector', () => {
      const r = validateFrontmatter({ ...base, forward_vector: 'I will keep teaching and spawning.' });
      expect(r.warnings.some((w) => w.includes('stasis'))).toBe(false);
    });
  });

  describe('wikilinkSuggestions', () => {
    const index = new Map([
      ['Kuramoto Coupling', 'Kuramoto Coupling.md'],
      ['Kokoro', 'Shop/Kokoro.md'],
      ['Foo Bar', 'Foo Bar.md'],
    ]);

    it('returns inactive when no [[ before caret', () => {
      const r = wikilinkSuggestions('hello world', 5, index);
      expect(r.active).toBe(false);
    });

    it('activates inside an open [[', () => {
      const text = 'See [[Kur';
      const r = wikilinkSuggestions(text, text.length, index);
      expect(r.active).toBe(true);
      expect(r.prefix).toBe('Kur');
      expect(r.candidates).toContain('Kuramoto Coupling');
    });

    it('deactivates when ]] closes the link', () => {
      const text = 'See [[Foo]] more';
      const r = wikilinkSuggestions(text, text.length, index);
      expect(r.active).toBe(false);
    });

    it('returns up to limit candidates', () => {
      const big = new Map();
      for (let i = 0; i < 20; i += 1) big.set(`Entry ${i}`, `E${i}.md`);
      const r = wikilinkSuggestions('[[Entry', 7, big, 5);
      expect(r.active).toBe(true);
      expect(r.candidates.length).toBe(5);
    });
  });

  describe('exports', () => {
    it('exposes 12 entry types from SCHEMA §1', () => {
      expect(ENTRY_TYPES.length).toBe(12);
    });
    it('exposes 7 stages from SCHEMA §2', () => {
      expect(STAGES.length).toBe(7);
    });
    it('exposes 4 pillars from §3', () => {
      expect(PILLARS.length).toBe(4);
    });
    it('exposes 10 link types from §4', () => {
      expect(LINK_TYPES.length).toBe(10);
    });
  });
});
