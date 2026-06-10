import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildMessageFromStaged, readStagedDiff, clearStaleLocks,
} from '../../scripts/palace-commit.mjs';
import { commitSelected } from '../../server/commit.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = resolve(__dirname, '..', '..');
const CLI = join(APP_ROOT, 'scripts', 'palace-commit.mjs');

describe('palace-commit', () => {
  let root;
  function g(...args) { return execFileSync('git', args, { cwd: root, encoding: 'utf8' }); }

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'palacecommit-'));
    g('init', '-q');
    g('config', 'user.email', 'test@palace');
    g('config', 'user.name', 'Test Palace');
    g('config', 'commit.gpgsign', 'false');
    writeFileSync(resolve(root, 'Foo.md'), '---\ntitle: Foo\ntype: concept\nstage: seed\npillars: [tools]\nforward_vector: "I will seed."\n---\n# Foo\nbody\n');
    g('add', '-A');
    g('commit', '-q', '-m', 'deposit(Foo): seed it\n\nPalace-Kind: deposit\nPalace-Verify: verified');
  });
  afterEach(() => { rmSync(root, { recursive: true, force: true }); });

  test('readStagedDiff derives md frontmatter changes for staged edits', () => {
    writeFileSync(resolve(root, 'Foo.md'), '---\ntitle: Foo\ntype: concept\nstage: sprout\npillars: [tools]\nforward_vector: "I will sprout and teach."\n---\n# Foo\nbody longer\n');
    g('add', '--', 'Foo.md');
    const { paths, mdChanges } = readStagedDiff(root);
    expect(paths).toContain('Foo.md');
    const foo = mdChanges.find((m) => m.path === 'Foo.md');
    expect(foo.frontmatterChanges.find((c) => c.field === 'stage')).toMatchObject({ before: 'seed', after: 'sprout' });
    expect(foo.frontmatterChanges.find((c) => c.field === 'forward_vector')).toBeTruthy();
    expect(foo.bodyChanged).toBe(true);
  });

  test('buildMessageFromStaged derives stage + vector + entry trailers', () => {
    writeFileSync(resolve(root, 'Foo.md'), '---\ntitle: Foo\ntype: concept\nstage: sprout\npillars: [tools]\nforward_vector: "I will sprout."\n---\n# Foo\nbody\n');
    g('add', '--', 'Foo.md');
    const msg = buildMessageFromStaged(root, { kind: 'edit', scope: 'Foo', summary: 'grow to sprout', verify: 'verified' });
    expect(msg).toMatch(/^edit\(Foo\): grow to sprout/);
    expect(msg).toMatch(/Palace-Kind: edit/);
    expect(msg).toMatch(/Palace-Entry: Foo/);
    expect(msg).toMatch(/Palace-Stage: Foo: seed->sprout/);
    expect(msg).toMatch(/Palace-Vector: Foo: changed/);
    expect(msg).toMatch(/Palace-Verify: verified/);
    expect(msg).toMatch(/Palace-Author: claude/);
  });

  test('a newly-added entry gets a born stage', () => {
    writeFileSync(resolve(root, 'New Entry.md'), '---\ntitle: New Entry\ntype: concept\nstage: seed\npillars: [philosophy]\n---\n# New Entry\nbody\n');
    g('add', '--', 'New Entry.md');
    const msg = buildMessageFromStaged(root, { kind: 'deposit', scope: 'New Entry', summary: 'file it', verify: 'verified' });
    expect(msg).toMatch(/Palace-Entry: New Entry/);
    expect(msg).toMatch(/Palace-Stage: New Entry: born->seed/);
  });

  test('the derived message round-trips the validator + carries campaign', async () => {
    writeFileSync(resolve(root, 'Foo.md'), '---\ntitle: Foo\nstage: growing\n---\nbody\n');
    g('add', '--', 'Foo.md');
    const msg = buildMessageFromStaged(root, { kind: 'edit', scope: 'Foo', summary: 'x', verify: 'verified', campaign: 'c-2026' });
    const { validateCommitMessage } = await import('../../src/lib/commit-spec.js');
    expect(validateCommitMessage(msg).valid).toBe(true);
    expect(msg).toMatch(/Palace-Campaign: c-2026/);
  });

  test('the CLI commits a structured message end-to-end (explicit path, never -A)', () => {
    writeFileSync(resolve(root, 'Foo.md'), '---\ntitle: Foo\nstage: sprout\n---\nedited\n');
    // An UNRELATED dirty file that must NOT be swept (the N-writer lesson).
    writeFileSync(resolve(root, 'Other Session.md'), 'do not commit me');
    execFileSync('node', [CLI, '--kind', 'edit', '--scope', 'Foo', '--summary', 'grow', '--verify', 'verified', '--path', 'Foo.md'], {
      cwd: root, encoding: 'utf8', env: { ...process.env, PALACE_ROOT: root },
    });
    const msg = execFileSync('git', ['log', '-1', '--format=%B'], { cwd: root, encoding: 'utf8' });
    expect(msg).toMatch(/edit\(Foo\): grow/);
    // Committed Foo is seed, staged Foo is sprout -> the derived transition.
    expect(msg).toMatch(/Palace-Stage: Foo: seed->sprout/);
    const status = execFileSync('git', ['status', '--porcelain=v1'], { cwd: root, encoding: 'utf8' });
    expect(status).toMatch(/Other Session\.md/); // never swept
  });

  test('--dry-run prints the message without committing', () => {
    writeFileSync(resolve(root, 'Foo.md'), '---\ntitle: Foo\nstage: sprout\n---\nx\n');
    g('add', '--', 'Foo.md');
    const headBefore = g('rev-parse', 'HEAD').trim();
    const out = execFileSync('node', [CLI, '--kind', 'edit', '--summary', 'x', '--verify', 'verified', '--dry-run'], {
      cwd: root, encoding: 'utf8', env: { ...process.env, PALACE_ROOT: root },
    });
    expect(out).toMatch(/edit: x/);
    expect(g('rev-parse', 'HEAD').trim()).toBe(headBefore);
  });

  test('clearStaleLocks removes a stray index.lock', () => {
    writeFileSync(resolve(root, '.git', 'index.lock'), '');
    expect(existsSync(resolve(root, '.git', 'index.lock'))).toBe(true);
    clearStaleLocks(root);
    expect(existsSync(resolve(root, '.git', 'index.lock'))).toBe(false);
  });

  // Non-ASCII filenames — every `Foo — baton.md` / `Foo — Context.md` bundle
  // file. Git's default core.quotepath=true octal-escapes + double-quotes them in
  // --name-status output; the committers must still find + commit them. We force
  // quotepath=true here so the test reproduces the default-buggy environment
  // regardless of the developer's global git config.
  describe('non-ASCII (em-dash) filenames', () => {
    const EM = 'Foo — baton.md'; // U+2014 em-dash, the bundle-file convention
    beforeEach(() => {
      g('config', 'core.quotepath', 'true');
      writeFileSync(resolve(root, EM), '---\ntitle: "Foo — baton"\nborn: 2026-06-09\n---\n# Baton\ncarry the move\n');
      g('add', '--', EM);
    });

    test('readStagedDiff finds the staged em-dash path (not octal-escaped)', () => {
      const { paths } = readStagedDiff(root);
      expect(paths).toContain(EM);
    });

    test('commitSelected commits an em-dash file (regression: it was silently dropped)', async () => {
      const r = await commitSelected(root, {
        paths: [EM], kind: 'handoff', scope: 'Foo', summary: 'carry the move',
        verify: 'unverified', author: 'claude',
      });
      expect(r.ok).toBe(true);
      expect(r.committed).toContain(EM);
      expect(g('show', `HEAD:${EM}`)).toMatch(/carry the move/);
      expect(g('status', '--porcelain=v1').trim()).toBe('');
    });
  });
});
