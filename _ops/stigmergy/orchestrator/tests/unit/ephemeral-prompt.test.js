import { describe, test, expect, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { buildEphemeralPrompt } from '../../src/ephemeral-prompt.js';
import { buildManifest, buildInitialState, readPageFrontmatter, kebab } from '../../src/enchant.js';
import { buildCyclePrompt } from '../../src/build-cycle-prompt.js';

// buildEphemeralPrompt brings ANY canon page to life as a one-off — same rich
// construction as a registered steward's cycle 1, but nothing is written to the
// registry. These tests pin both halves of that contract: the construction is
// correct, and it leaves no permanent footprint.

describe('buildEphemeralPrompt', () => {
  let root;
  afterEach(() => { if (root) rmSync(root, { recursive: true, force: true }); root = null; });

  // A temp palace with the skill template, a persistent board, and one page.
  function makePalace({ home = 'Foo', stage = 'growing', body = 'BODY MARKER LINE', board = [], withFrontmatter = true } = {}) {
    root = mkdtempSync(path.join(tmpdir(), 'palace-eph-'));
    mkdirSync(path.join(root, '_ops/swarm/persistent'), { recursive: true });
    const promptsDir = path.join(root, '.claude/skills/palace-orchestrator/prompts');
    mkdirSync(promptsDir, { recursive: true });
    writeFileSync(path.join(promptsDir, 'steward.md'), 'STEWARD SYSTEM home={{home}} cycle={{cycle_id}} stage={{stage_at_last_activation}}');
    writeFileSync(path.join(root, '_ops/swarm/persistent/blackboard.jsonl'), board.map((m) => JSON.stringify(m)).join('\n'));
    const page = withFrontmatter
      ? `---\ntitle: "${home}"\nstage: ${stage}\nforward_vector: "I will keep proving the seam."\nlinks:\n  - target: "[[Neighbor A]]"\n    type: connects-to\n---\n# ${home}\n${body}\n`
      : `# ${home}\n${body}\n`;
    writeFileSync(path.join(root, `${home}.md`), page);
    return { home };
  }

  test('builds the interactive one-off prompt: identity inlined, interactive closing, ephemeral session label', () => {
    makePalace({ board: [{ id: 'x1', type: 'BROADCAST', from: 'Neighbor A', to: '*' }] });
    const r = buildEphemeralPrompt({ palaceRoot: root, title: 'Foo', today: '2026-06-23' });

    expect(r.ok).toBe(true);
    expect(r.status).toBe('built');
    expect(r.home).toBe('Foo');
    expect(r.stage).toBe('growing');
    // identity (the page) is injected in full
    expect(r.full).toContain('BODY MARKER LINE');
    expect(r.full).toContain('Your home entry — Foo');
    // interactive closing (driven live), not the headless orchestrator protocol
    expect(r.full).toContain('driven live');
    expect(r.full).toContain('Narrate every write before you make it');
    expect(r.full).not.toContain('# Output protocol');
    // the one honest divergence: an ephemeral session label, never "permanent-stewardship"
    expect(r.full).toContain('ephemeral-foo-2026-06-23');
    expect(r.full).not.toContain('permanent-stewardship');
  });

  test('leaves NO permanent footprint — no steward dir, no registry, tmp cleaned', () => {
    makePalace();
    const before = readdirSync(tmpdir()).filter((n) => n.startsWith('stigmergy-ephemeral-')).length;
    const r = buildEphemeralPrompt({ palaceRoot: root, title: 'Foo', today: '2026-06-23' });
    expect(r.ok).toBe(true);
    // nothing under _ops/agents/permanent and no REGISTRY written
    expect(existsSync(path.join(root, '_ops/agents/permanent'))).toBe(false);
    expect(existsSync(path.join(root, '_ops/agents/permanent/REGISTRY.json'))).toBe(false);
    // the throwaway tmp dir is removed (count of our staging dirs unchanged)
    const after = readdirSync(tmpdir()).filter((n) => n.startsWith('stigmergy-ephemeral-')).length;
    expect(after).toBe(before);
  });

  test('tight correlation: identical to a staged steward cycle-1, modulo session label + the throwaway dir path', () => {
    const { home } = makePalace({ board: [{ id: 'x1', type: 'BROADCAST', from: 'Neighbor A', to: '*' }] });
    const today = '2026-06-23';

    // Stage a real steward dir the way enchantSteward would (same buildManifest +
    // buildInitialState + empty history) and run the SAME builder at cycle 1.
    const fm = readPageFrontmatter(path.join(root, `${home}.md`));
    const slug = kebab(home);
    const dir = path.join(root, '_ops/agents/permanent', slug);
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(buildManifest({ title: home, fm, slug, today }), null, 2) + '\n');
    writeFileSync(path.join(dir, 'state.json'), JSON.stringify(buildInitialState(), null, 2) + '\n');
    writeFileSync(path.join(dir, 'history.jsonl'), '');
    const steward = buildCyclePrompt({ palaceRoot: root, agentDir: dir, cycleN: 1, today, mode: 'interactive' });

    const ephemeral = buildEphemeralPrompt({ palaceRoot: root, title: home, today });

    // Normalize the two known, intentional divergences: the session label
    // (permanent-stewardship-* vs ephemeral-*) and the first-activation line that
    // names the agent's directory (a throwaway tmp path vs the permanent dir).
    const norm = (s) => s
      .replace(/permanent-stewardship-foo-2026-06-23|ephemeral-foo-2026-06-23/g, 'SESSION')
      .replace(/The directory at `[^`]*` was created today/g, 'The directory at `DIR` was created today');

    expect(norm(ephemeral.full)).toBe(norm(steward.full));
  });

  test('a title with no page returns not_found', () => {
    makePalace();
    const r = buildEphemeralPrompt({ palaceRoot: root, title: 'Ghost', today: '2026-06-23' });
    expect(r.ok).toBe(false);
    expect(r.status).toBe('not_found');
  });

  test('a frontmatter-less page (a learning material, not a canon entry) returns no_frontmatter', () => {
    makePalace({ home: 'Plain', withFrontmatter: false });
    const r = buildEphemeralPrompt({ palaceRoot: root, title: 'Plain', today: '2026-06-23' });
    expect(r.ok).toBe(false);
    expect(r.status).toBe('no_frontmatter');
  });
});
