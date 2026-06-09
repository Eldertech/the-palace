import { describe, test, expect, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  kebab,
  parseFrontmatter,
  buildManifest,
  buildInitialState,
  enchantSteward,
} from '../../src/enchant.js';
import { validateManifest } from '../../src/manifest.js';

describe('kebab', () => {
  test('lowercases, drops apostrophes, collapses non-word runs, trims hyphens', () => {
    expect(kebab('Generative Sample Libraries')).toBe('generative-sample-libraries');
    expect(kebab("Meadows and an Artist's Career")).toBe('meadows-and-an-artists-career');
    expect(kebab('2D Torus Wavetable Synthesizer')).toBe('2d-torus-wavetable-synthesizer');
    expect(kebab('  Leading/Trailing  ')).toBe('leading-trailing');
  });
});

describe('parseFrontmatter', () => {
  test('extracts stage, quoted forward_vector, and link targets', () => {
    const text = [
      '---',
      'title: "Foo"',
      'stage: growing',
      'forward_vector: "I will keep exploring the edge."',
      'links:',
      '  - target: "[[Bar]]"',
      '    type: connects-to',
      '  - target: "[[Baz Qux]]"',
      '---',
      '# Foo',
    ].join('\n');
    const fm = parseFrontmatter(text);
    expect(fm.stage).toBe('growing');
    expect(fm.forward_vector).toBe('I will keep exploring the edge.');
    expect(fm.links).toEqual([{ target: 'Bar' }, { target: 'Baz Qux' }]);
  });

  test('handles a bare (unquoted) forward_vector and missing links', () => {
    const text = '---\nstage: seed\nforward_vector: keep going\n---\nbody';
    const fm = parseFrontmatter(text);
    expect(fm.stage).toBe('seed');
    expect(fm.forward_vector).toBe('keep going');
    expect(fm.links).toEqual([]);
  });

  test('throws when there is no frontmatter', () => {
    expect(() => parseFrontmatter('no frontmatter here')).toThrow(/no frontmatter/);
  });
});

describe('buildManifest', () => {
  const fm = { stage: 'growing', forward_vector: 'keep building', links: [{ target: 'Neighbor One' }] };

  test('produces a manifest that passes validateManifest', () => {
    const manifest = buildManifest({ title: 'My Project', fm, slug: 'my-project', today: '2026-05-27' });
    const res = validateManifest(manifest);
    expect(res.valid).toBe(true);
  });

  test('home == agent_id == title and session_id embeds the slug + date', () => {
    const manifest = buildManifest({ title: 'My Project', fm, slug: 'my-project', today: '2026-05-27' });
    expect(manifest.home).toBe('My Project');
    expect(manifest.agent_id).toBe('My Project');
    expect(manifest.session_id).toBe('permanent-stewardship-my-project-2026-05-27');
    expect(manifest.mode).toBe('long_duration_background');
  });

  test('neighborhood = link targets + the two stewardship anchors', () => {
    const manifest = buildManifest({ title: 'My Project', fm, slug: 'my-project', today: '2026-05-27' });
    expect(manifest.neighborhood).toEqual(['Neighbor One', 'Substrate Skill', 'Project Stewardship System']);
  });
});

describe('buildInitialState', () => {
  test('seeds iteration 0 and is born slim — pure runtime, no stewardship/decision arrays (SSOT cutover)', () => {
    const state = buildInitialState();
    expect(state.iteration).toBe(0);
    expect(state.last_active).toBeNull();
    expect(state.last_read_cursor).toBeNull();
    expect(state.health.score).toBe('green');
    // stage/forward_vector live in the entry frontmatter; decisions on the board.
    expect(state.stewardship).toBeUndefined();
    expect(state.pending_requests).toBeUndefined();
    expect(state.resolved_requests).toBeUndefined();
    expect(Object.keys(state).sort()).toEqual(['health', 'iteration', 'last_active', 'last_read_cursor']);
  });
});

describe('enchantSteward (integration)', () => {
  let root;
  afterEach(() => { if (root) rmSync(root, { recursive: true, force: true }); root = null; });

  function makePalace() {
    root = mkdtempSync(path.join(tmpdir(), 'palace-ench-'));
    mkdirSync(path.join(root, 'Projects'), { recursive: true });
    mkdirSync(path.join(root, '_ops/agents/permanent'), { recursive: true });
  }

  function writePage(title, body) {
    writeFileSync(path.join(root, 'Projects', `${title}.md`), body);
  }

  test('enchants a project: writes the steward dir + files and registers it', () => {
    makePalace();
    writePage('Cool Project', '---\nstage: growing\nforward_vector: "I will keep cooling."\nlinks:\n  - target: "[[Heat Sink]]"\n---\n# Cool Project\n');

    const result = enchantSteward({ palaceRoot: root, title: 'Cool Project', today: '2026-05-27' });
    expect(result.status).toBe('enchanted');
    expect(result.slug).toBe('cool-project');
    expect(result.stage).toBe('growing');

    const dir = path.join(root, '_ops/agents/permanent/cool-project');
    expect(existsSync(path.join(dir, 'manifest.json'))).toBe(true);
    expect(existsSync(path.join(dir, 'state.json'))).toBe(true);
    expect(existsSync(path.join(dir, 'history.jsonl'))).toBe(true);

    const manifest = JSON.parse(readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
    expect(manifest.home).toBe('Cool Project');
    expect(manifest.neighborhood).toContain('Heat Sink');
    expect(manifest.neighborhood).toContain('Project Stewardship System');

    const state = JSON.parse(readFileSync(path.join(dir, 'state.json'), 'utf8'));
    // Born slim (SSOT cutover): pure runtime; stage is read live from frontmatter.
    expect(state.iteration).toBe(0);
    expect(state.stewardship).toBeUndefined();
    expect(state.pending_requests).toBeUndefined();

    const registry = JSON.parse(readFileSync(path.join(root, '_ops/agents/permanent/REGISTRY.json'), 'utf8'));
    expect(registry.agents.map((a) => a.agent_id)).toContain('Cool Project');
    expect(registry.agents.find((a) => a.agent_id === 'Cool Project').dir).toBe('_ops/agents/permanent/cool-project');
  });

  test('a second enchant of the same page is a no-op (already_enchanted)', () => {
    makePalace();
    writePage('Cool Project', '---\nstage: growing\nforward_vector: x\n---\n# Cool Project\n');
    expect(enchantSteward({ palaceRoot: root, title: 'Cool Project' }).status).toBe('enchanted');
    const second = enchantSteward({ palaceRoot: root, title: 'Cool Project' });
    expect(second.status).toBe('already_enchanted');
  });

  test('a title with no page returns not_found', () => {
    makePalace();
    const result = enchantSteward({ palaceRoot: root, title: 'Ghost Project' });
    expect(result.status).toBe('not_found');
  });
});
