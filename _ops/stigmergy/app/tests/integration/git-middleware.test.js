import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import http from 'node:http';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import request from 'supertest';
import { blackboardMiddleware } from '../../server/middleware.js';

function makeServer(palaceRoot) {
  const plugin = blackboardMiddleware(palaceRoot);
  const handlers = [];
  const fakeServer = { middlewares: { use: (fn) => handlers.push(fn) } };
  plugin.configureServer(fakeServer);
  return http.createServer((req, res) => {
    let i = 0;
    const next = () => {
      if (i >= handlers.length) { res.statusCode = 404; res.end('not found'); return; }
      handlers[i++](req, res, next);
    };
    next();
  });
}

// A real git repo with a few palace-shaped commits, so we exercise the
// actual git adapter (not a mock). Each commit uses the v1.0 commit spec
// or a pre-spec subject so we cover both parsing paths.
function gitInit(root) {
  const g = (...args) => execFileSync('git', args, { cwd: root, stdio: 'pipe' });
  g('init', '-q');
  g('config', 'user.email', 'test@palace');
  g('config', 'user.name', 'Test Palace');
  g('config', 'commit.gpgsign', 'false');

  // Commit 1: a deposit (spec-form subject + trailers).
  writeFileSync(resolve(root, 'Foo.md'), '---\ntitle: Foo\ntype: concept\nstage: seed\npillars: [tools]\n---\n# Foo\nbody one\n');
  g('add', '-A');
  g('commit', '-q', '-m', 'deposit(Foo): name the foo concept\n\nPalace-Kind: deposit\nPalace-Entry: Foo\nPalace-Verify: verified\nPalace-Author: claude');

  // Commit 2: a pre-spec free-prose subject editing Foo (stage seed→sprout).
  writeFileSync(resolve(root, 'Foo.md'), '---\ntitle: Foo\ntype: concept\nstage: sprout\npillars: [tools, philosophy]\n---\n# Foo\nbody one\nbody two\n');
  g('add', '-A');
  g('commit', '-q', '-m', 'Foo: grow it to a sprout and add a pillar');

  // Commit 3: an ops commit touching app machinery.
  mkdirSync(resolve(root, '_ops/stigmergy/app/src'), { recursive: true });
  writeFileSync(resolve(root, '_ops/stigmergy/app/src/thing.js'), 'export const x = 1;\n');
  g('add', '-A');
  g('commit', '-q', '-m', 'ops(stigmergy): add a thing\n\nPalace-Kind: ops\nPalace-Verify: verified');

  return root;
}

function makeTempPalace() {
  const root = mkdtempSync(resolve(tmpdir(), 'stigmergy-git-test-'));
  mkdirSync(resolve(root, '_ops/swarm/persistent'), { recursive: true });
  writeFileSync(resolve(root, '_ops/swarm/persistent/blackboard.jsonl'), '', 'utf8');
  gitInit(root);
  return root;
}

describe('GET /api/log', () => {
  let root, server;
  beforeAll(() => { root = makeTempPalace(); server = makeServer(root); });
  afterAll(() => { rmSync(root, { recursive: true, force: true }); });

  test('returns the commit stream newest-first, fully classified', async () => {
    const res = await request(server).get('/api/log');
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(3);
    const subjects = res.body.commits.map((c) => c.subject);
    expect(subjects[0]).toContain('ops(stigmergy)');
    expect(subjects[2]).toContain('deposit(Foo)');

    // Trailer-declared kind wins.
    const deposit = res.body.commits.find((c) => c.subject.includes('deposit(Foo)'));
    expect(deposit.kind).toBe('deposit');
    expect(deposit.kindSource).toBe('trailer');
    expect(deposit.entries).toContain('Foo');
    expect(deposit.verify).toBe('verified');

    // Pre-spec subject → inferred kind.
    const grow = res.body.commits.find((c) => c.subject.startsWith('Foo: grow'));
    expect(grow.kindSource).toBe('inferred');
    expect(grow.entries).toContain('Foo');

    // Each commit carries a diffstat.
    expect(deposit.fileCount).toBeGreaterThanOrEqual(1);
    expect(deposit.added).toBeGreaterThan(0);
  });

  test('?path filters to one entry history', async () => {
    const res = await request(server).get('/api/log').query({ path: 'Foo.md' });
    expect(res.status).toBe(200);
    // Two commits touched Foo.md (deposit + grow), not the ops commit.
    expect(res.body.count).toBe(2);
    for (const c of res.body.commits) {
      expect(c.subject).not.toContain('ops(stigmergy)');
    }
  });

  test('?limit caps the stream', async () => {
    const res = await request(server).get('/api/log').query({ limit: '1' });
    expect(res.body.count).toBe(1);
  });

  test('rejects an unsafe pathspec', async () => {
    const res = await request(server).get('/api/log').query({ path: '../../../etc/passwd' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/commit', () => {
  let root, server, headSha, depositSha;
  beforeAll(() => {
    root = makeTempPalace();
    server = makeServer(root);
    headSha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root }).toString().trim();
    depositSha = execFileSync('git', ['rev-parse', 'HEAD~2'], { cwd: root }).toString().trim();
  });
  afterAll(() => { rmSync(root, { recursive: true, force: true }); });

  test('returns a palace-aware diff with frontmatter field changes', async () => {
    // HEAD~1 is the "grow it to a sprout" commit -- stage seed→sprout + pillar add.
    const growSha = execFileSync('git', ['rev-parse', 'HEAD~1'], { cwd: root }).toString().trim();
    const res = await request(server).get('/api/commit').query({ sha: growSha });
    expect(res.status).toBe(200);
    const fooDiff = res.body.fileDiffs.find((f) => f.path === 'Foo.md');
    expect(fooDiff.kind).toBe('md');
    const stageChange = fooDiff.frontmatterChanges.find((c) => c.field === 'stage');
    expect(stageChange.before).toBe('seed');
    expect(stageChange.after).toBe('sprout');
    expect(fooDiff.bodyChanged).toBe(true);
  });

  test('flags a newly-added entry', async () => {
    const res = await request(server).get('/api/commit').query({ sha: depositSha });
    expect(res.status).toBe(200);
    const fooDiff = res.body.fileDiffs.find((f) => f.path === 'Foo.md');
    expect(fooDiff.wasAdded).toBe(true);
  });

  test('404 on an invalid ref', async () => {
    const res = await request(server).get('/api/commit').query({ sha: 'not-a-sha!!' });
    expect(res.status).toBe(404);
  });

  test('400 on missing sha', async () => {
    const res = await request(server).get('/api/commit');
    expect(res.status).toBe(400);
  });
});

describe('GET /api/uncommitted', () => {
  // Per-test pristine repo (beforeEach, not beforeAll) so the clean-tree test
  // and the dirty-tree test can never interact -- this was a flake source
  // under full-gate concurrency.
  let root, server;
  beforeEach(() => { root = makeTempPalace(); server = makeServer(root); });
  afterEach(() => { rmSync(root, { recursive: true, force: true }); });

  test('reports a clean tree as total 0', async () => {
    const res = await request(server).get('/api/uncommitted');
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(0);
  });

  test('surfaces an uncommitted edit (incl. an untracked spaced path)', async () => {
    writeFileSync(resolve(root, 'Foo.md'), '---\ntitle: Foo\nstage: growing\n---\nedited\n');
    // Spaced path: exercises git's C-style quoting through the real adapter.
    // (The pure dequote is also unit-tested deterministically in
    // git-log-parse.test.js, so this is belt-and-suspenders.)
    writeFileSync(resolve(root, 'Brand New.md'), '---\ntitle: Brand New\n---\nx\n');
    const res = await request(server).get('/api/uncommitted');
    expect(res.body.total).toBeGreaterThanOrEqual(2);
    expect(res.body.unstaged.some((u) => u.path === 'Foo.md')).toBe(true);
    expect(res.body.untracked.some((u) => u.path === 'Brand New.md')).toBe(true);
  });
});
