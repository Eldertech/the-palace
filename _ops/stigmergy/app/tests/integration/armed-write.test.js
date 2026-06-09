// Integration test for the armed write: a real git repo stands in for the
// edits worktree. Proves an op is applied, the frontmatter is preserved
// verbatim, and the change is committed through the enforced path (Palace-*
// trailers, explicit pathspec) — and that the allow-list and honesty guards
// refuse what they should.

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { resolve, join } from 'node:path';
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { armedWriteEntry, ensureEditsWorktree, revertCommit } from '../../server/armed-write.js';

function git(cwd, args) { return execFileSync('git', args, { cwd, encoding: 'utf8' }); }

function makeRepo() {
  const root = mkdtempSync(resolve(tmpdir(), 'stig-armed-'));
  git(root, ['init', '-q', '-b', 'main']);
  git(root, ['config', 'user.email', 'test@example.com']);
  git(root, ['config', 'user.name', 'Test User']);
  git(root, ['config', 'commit.gpgsign', 'false']);
  writeFileSync(
    join(root, 'Entry.md'),
    '---\ntitle: Entry\ntype: concept\nstage: seed\npillars:\n  - philosophy\nforward_vector: "I want to grow."\n---\n# Body\n\nThe lived body is the seat of perception.\n',
  );
  git(root, ['add', 'Entry.md']);
  git(root, ['commit', '-q', '-m', 'deposit: seed Entry']);
  return root;
}

describe('armedWriteEntry', () => {
  let root;
  beforeEach(() => { root = makeRepo(); });
  afterEach(() => { rmSync(root, { recursive: true, force: true }); });

  test('appends, preserves frontmatter verbatim, and commits via the enforced path', async () => {
    const before = readFileSync(join(root, 'Entry.md'), 'utf8');
    const fmBlock = before.slice(0, before.indexOf('# Body'));

    const r = await armedWriteEntry({
      editsRoot: root, relPath: 'Entry.md',
      op: { op: 'append', text: 'A new line about li.' },
      summary: 'append a line about li', verify: 'unverified', author: 'claude',
    });
    expect(r.ok).toBe(true);
    expect(r.op).toBe('append');
    expect(typeof r.shortHash).toBe('string');

    const after = readFileSync(join(root, 'Entry.md'), 'utf8');
    expect(after.startsWith(fmBlock)).toBe(true);           // frontmatter byte-identical
    expect(after).toMatch(/A new line about li\./);

    // committed: HEAD blob carries the change + Palace trailers
    expect(git(root, ['show', 'HEAD:Entry.md'])).toMatch(/A new line about li\./);
    const msg = git(root, ['log', '-1', '--format=%B']);
    expect(msg).toMatch(/^edit\(Entry\): append a line about li/);
    expect(msg).toMatch(/Palace-Kind: edit/);
    expect(msg).toMatch(/Palace-Author: claude/);

    // working tree clean (commit captured everything)
    expect(git(root, ['status', '--porcelain']).trim()).toBe('');
  });

  test('set-vector edits the frontmatter, preserves the body, and reports the change', async () => {
    const bodyBefore = readFileSync(join(root, 'Entry.md'), 'utf8');
    const body = bodyBefore.slice(bodyBefore.indexOf('# Body'));

    const r = await armedWriteEntry({
      editsRoot: root, relPath: 'Entry.md',
      op: { op: 'set-vector', text: 'I will keep weaving what I touch.' },
      summary: 'set forward vector', verify: 'unverified', author: 'claude',
    });
    expect(r.ok).toBe(true);
    expect(r.op).toBe('set-vector');
    expect(r.vectorChange).toEqual({ from: 'I want to grow.', to: 'I will keep weaving what I touch.' });

    const after = readFileSync(join(root, 'Entry.md'), 'utf8');
    expect(after).toMatch(/forward_vector: "I will keep weaving what I touch\."/);
    expect(after).not.toMatch(/I want to grow\./);
    expect(after.endsWith(body)).toBe(true);                 // body byte-identical
    expect(after).toMatch(/title: Entry\ntype: concept/);     // other fields untouched

    // committed through the enforced path
    expect(git(root, ['show', 'HEAD:Entry.md'])).toMatch(/I will keep weaving what I touch\./);
    expect(git(root, ['log', '-1', '--format=%s'])).toMatch(/^edit\(Entry\): set forward vector/);
    expect(git(root, ['status', '--porcelain']).trim()).toBe('');
  });

  test('refuses a canon path (allow-list, 403)', async () => {
    const r = await armedWriteEntry({ editsRoot: root, relPath: 'CLAUDE.md', op: { op: 'append', text: 'x' }, summary: 's', verify: 'unverified' });
    expect(r.ok).toBe(false);
    expect(r.status).toBe(403);
  });

  test('refuses a rewrite whose find is absent (422), no commit', async () => {
    const head0 = git(root, ['rev-parse', 'HEAD']).trim();
    const r = await armedWriteEntry({ editsRoot: root, relPath: 'Entry.md', op: { op: 'rewrite', find: 'nowhere', replace: 'x' }, summary: 's', verify: 'unverified' });
    expect(r.ok).toBe(false);
    expect(r.status).toBe(422);
    expect(git(root, ['rev-parse', 'HEAD']).trim()).toBe(head0); // nothing committed
  });
});

describe('revertCommit', () => {
  let root;
  beforeEach(() => { root = makeRepo(); });
  afterEach(() => { rmSync(root, { recursive: true, force: true }); });

  test('reverts a committed edit as a new inverse commit (honest, not a rollback)', async () => {
    const w = await armedWriteEntry({
      editsRoot: root, relPath: 'Entry.md',
      op: { op: 'append', text: 'A line to be reverted.' },
      summary: 'append a line', verify: 'unverified', author: 'claude',
    });
    expect(w.ok).toBe(true);
    expect(readFileSync(join(root, 'Entry.md'), 'utf8')).toMatch(/A line to be reverted\./);
    const editHash = git(root, ['rev-parse', 'HEAD']).trim();

    const r = await revertCommit({ editsRoot: root, hash: w.shortHash });
    expect(r.ok).toBe(true);
    expect(typeof r.revertHash).toBe('string');

    // the content is gone again …
    expect(readFileSync(join(root, 'Entry.md'), 'utf8')).not.toMatch(/A line to be reverted\./);
    // … but as a NEW commit on top, not a history rewrite (the edit is still there)
    const head = git(root, ['rev-parse', 'HEAD']).trim();
    expect(head).not.toBe(editHash);
    const log = git(root, ['log', '--format=%H']).trim().split('\n');
    expect(log).toContain(editHash);          // the original commit survives
    expect(git(root, ['status', '--porcelain']).trim()).toBe(''); // clean tree
  });

  test('preserves a later edit to the same entry (3-way revert, not a reset)', async () => {
    const first = await armedWriteEntry({
      editsRoot: root, relPath: 'Entry.md', op: { op: 'append', text: 'FIRST insertion.' },
      summary: 'first', verify: 'unverified', author: 'claude',
    });
    await armedWriteEntry({
      editsRoot: root, relPath: 'Entry.md', op: { op: 'prepend', text: 'SECOND insertion at the top.' },
      summary: 'second', verify: 'unverified', author: 'claude',
    });
    const r = await revertCommit({ editsRoot: root, hash: first.shortHash });
    expect(r.ok).toBe(true);
    const text = readFileSync(join(root, 'Entry.md'), 'utf8');
    expect(text).not.toMatch(/FIRST insertion\./);   // the reverted edit is undone
    expect(text).toMatch(/SECOND insertion at the top\./); // the later edit survives
  });

  test('refuses a bad hash and a commit absent from the worktree', async () => {
    expect((await revertCommit({ editsRoot: root, hash: 'nothex!' })).ok).toBe(false);
    expect((await revertCommit({ editsRoot: root, hash: 'deadbeef' })).ok).toBe(false);
    expect((await revertCommit({ editsRoot: null, hash: 'abcdef0' })).ok).toBe(false);
  });
});

describe('ensureEditsWorktree', () => {
  let root;
  beforeEach(() => { root = makeRepo(); });
  afterEach(() => {
    try { git(root, ['worktree', 'prune']); } catch (_) { /* ignore */ }
    rmSync(root, { recursive: true, force: true });
  });

  test('creates a worktree on its own branch and is idempotent', async () => {
    const editsPath = resolve(root, '..', `edits-${root.split('/').pop()}`);
    try {
      const p1 = await ensureEditsWorktree(root, { editsPath, branch: 'stigmergy-edits-test' });
      expect(p1).toBe(editsPath);
      expect(readFileSync(join(editsPath, 'Entry.md'), 'utf8')).toMatch(/seat of perception/);
      const p2 = await ensureEditsWorktree(root, { editsPath, branch: 'stigmergy-edits-test' });
      expect(p2).toBe(editsPath); // idempotent, no throw
    } finally {
      rmSync(editsPath, { recursive: true, force: true });
    }
  });
});
