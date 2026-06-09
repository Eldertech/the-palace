import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { listEntries, readEntry } from '../../src/lib/entries.js';

let root;

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), 'stigmergy-entries-'));

  // A foundational meta entry.
  writeFileSync(
    join(root, 'CLAUDE.md'),
    '---\ntitle: CLAUDE\nversion: "1.8"\n---\n# Entry Point\nsee [[SCHEMA]].\n'
  );

  // A concept with rich frontmatter + a bundle.
  writeFileSync(
    join(root, 'Kuramoto.md'),
    '---\ntitle: Kuramoto\ntype: concept\npillars: [tools, philosophy]\nstage: mature\nlast_activated: "2026-05"\nactivation_count: 12\nlinks:\n  - target: "[[CLAUDE]]"\n    type: mirrors\nforward_vector: "I want to teach synchronization."\n---\n# Body\n\n## Active Handoff\nsee handoff.\n'
  );
  mkdirSync(join(root, 'Kuramoto'));
  writeFileSync(join(root, 'Kuramoto', 'Kuramoto — handoff.md'), '# h\n');
  writeFileSync(join(root, 'Kuramoto', '_intro.png'), 'PNGDATA');

  // A nested entry in a subdir.
  mkdirSync(join(root, 'Palace development'));
  writeFileSync(
    join(root, 'Palace development', 'Two Batons.md'),
    '---\ntitle: "Two Batons"\ntype: breakthrough\npillars:\n  - philosophy\nstage: growing\n---\n# Body\n'
  );

  // A machinery folder we should skip (under _ops/stigmergy/app/).
  mkdirSync(join(root, '_ops'));
  mkdirSync(join(root, '_ops', 'stigmergy'));
  mkdirSync(join(root, '_ops', 'stigmergy', 'app'));
  mkdirSync(join(root, '_ops', 'stigmergy', 'app', 'src'));
  writeFileSync(join(root, '_ops', 'stigmergy', 'app', 'README.md'), '# do not index\n');
  // But knowledge under _ops/ that's NOT in the excluded subpaths IS indexed.
  writeFileSync(
    join(root, '_ops', 'Substrate Skill.md'),
    '---\ntitle: Substrate Skill\ntype: meta\npillars: [tools]\nstage: foundational\n---\n# body\n'
  );

  // .obsidian/ and .git/ should be skipped entirely.
  mkdirSync(join(root, '.obsidian'));
  writeFileSync(join(root, '.obsidian', 'workspace.json'), '{}');
  mkdirSync(join(root, '.git'));
  writeFileSync(join(root, '.git', 'HEAD.md'), '# fake\n');

  // node_modules should be skipped.
  mkdirSync(join(root, 'node_modules'));
  mkdirSync(join(root, 'node_modules', 'somepkg'));
  writeFileSync(join(root, 'node_modules', 'somepkg', 'README.md'), '# nope\n');
});

afterAll(() => {
  rmSync(root, { recursive: true, force: true });
});

describe('listEntries', () => {
  it('indexes knowledge entries and skips machinery', () => {
    const list = listEntries(root);
    const paths = list.map((e) => e.path).sort();
    expect(paths).toContain('CLAUDE.md');
    expect(paths).toContain('Kuramoto.md');
    expect(paths).toContain('Palace development/Two Batons.md');
    expect(paths).toContain('_ops/Substrate Skill.md');
    // Machinery exclusions:
    expect(paths).not.toContain('_ops/stigmergy/app/README.md');
    expect(paths.find((p) => p.startsWith('.obsidian'))).toBeUndefined();
    expect(paths.find((p) => p.startsWith('.git'))).toBeUndefined();
    expect(paths.find((p) => p.startsWith('node_modules'))).toBeUndefined();
  });

  it('detects bundles', () => {
    const list = listEntries(root);
    const kuramoto = list.find((e) => e.path === 'Kuramoto.md');
    expect(kuramoto.has_bundle).toBe(true);
    const claude = list.find((e) => e.path === 'CLAUDE.md');
    expect(claude.has_bundle).toBe(false);
  });

  it('surfaces the Active Handoff marker via body probe', () => {
    const list = listEntries(root);
    const kuramoto = list.find((e) => e.path === 'Kuramoto.md');
    expect(kuramoto.has_active_handoff).toBe(true);
    const claude = list.find((e) => e.path === 'CLAUDE.md');
    expect(claude.has_active_handoff).toBe(false);
  });

  it('also surfaces the renamed Active Baton marker via body probe', () => {
    // Handoff → Baton ceremony rename: the spec now writes "## Active Baton"
    // while existing entries still carry "## Active Handoff". The probe must
    // accept both spellings, or new-style markers go invisible in STATE/PULSE.
    writeFileSync(join(root, 'BatonMarker.md'), '---\ntype: concept\n---\n# Body\n\n## Active Baton\nsee baton.\n');
    const list = listEntries(root);
    const marked = list.find((e) => e.path === 'BatonMarker.md');
    expect(marked.has_active_handoff).toBe(true);
    rmSync(join(root, 'BatonMarker.md'));
  });

  it('falls back to filename as title when frontmatter lacks one', () => {
    // Add a fresh entry with no title.
    writeFileSync(join(root, 'Untitled.md'), '---\ntype: concept\n---\nbody\n');
    const list = listEntries(root);
    const untitled = list.find((e) => e.path === 'Untitled.md');
    expect(untitled.title).toBe('Untitled');
    rmSync(join(root, 'Untitled.md'));
  });

  it('normalizes pillars and counts links', () => {
    const list = listEntries(root);
    const kuramoto = list.find((e) => e.path === 'Kuramoto.md');
    expect(kuramoto.pillars).toEqual(['tools', 'philosophy']);
    expect(kuramoto.link_count).toBe(1);
  });
});

describe('readEntry', () => {
  it('reads frontmatter + body + bundle for a real entry', () => {
    const r = readEntry(root, 'Kuramoto.md');
    expect(r).not.toBeNull();
    expect(r.title).toBe('Kuramoto');
    expect(r.frontmatter.type).toBe('concept');
    expect(r.body).toContain('## Active Handoff');
    expect(r.bundle).not.toBeNull();
    expect(r.bundle.files.find((f) => f.kind === 'image')).toBeTruthy();
    expect(r.links).toHaveLength(1);
    expect(r.links[0].target).toBe('CLAUDE');
  });

  it('returns null on path traversal', () => {
    expect(readEntry(root, '../etc/passwd.md')).toBeNull();
    expect(readEntry(root, '/etc/passwd.md')).toBeNull();
  });

  it('returns null when the file does not exist', () => {
    expect(readEntry(root, 'Nope.md')).toBeNull();
  });

  it('returns null when the path is in an excluded prefix', () => {
    expect(readEntry(root, '_ops/stigmergy/app/README.md')).toBeNull();
  });

  it('returns null on empty/null path', () => {
    expect(readEntry(root, '')).toBeNull();
    expect(readEntry(root, null)).toBeNull();
  });
});
