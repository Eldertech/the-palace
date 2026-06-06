import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import http from 'node:http';
import { resolve, join } from 'node:path';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import request from 'supertest';
import { blackboardMiddleware } from '../../server/middleware.js';

function git(cwd, args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' });
}

// A throwaway git repo with one initial commit (so HEAD exists).
function makeRepo() {
  const root = mkdtempSync(resolve(tmpdir(), 'stig-commit-test-'));
  git(root, ['init', '-q', '-b', 'main']);
  git(root, ['config', 'user.email', 'test@example.com']);
  git(root, ['config', 'user.name', 'Test User']);
  git(root, ['config', 'commit.gpgsign', 'false']);
  writeFileSync(join(root, 'README.md'), '# test repo\n');
  git(root, ['add', 'README.md']);
  git(root, ['commit', '-q', '-m', 'chore: init']);
  return root;
}

function makeServer(palaceRoot) {
  const plugin = blackboardMiddleware(palaceRoot);
  const handlers = [];
  plugin.configureServer({ middlewares: { use: (fn) => handlers.push(fn) } });
  const server = http.createServer((req, res) => {
    let i = 0;
    const next = () => {
      if (i >= handlers.length) { res.statusCode = 404; res.end('nf'); return; }
      handlers[i++](req, res, next);
    };
    next();
  });
  return server;
}

describe('POST /api/commit/create', () => {
  let root, server;
  beforeEach(() => {
    root = makeRepo();
    server = makeServer(root);
    // Two independent changes: a new untracked file + a modified tracked file.
    writeFileSync(join(root, 'data.txt'), 'hello\n');
    writeFileSync(join(root, 'README.md'), '# test repo\n\nedited\n');
  });
  afterEach(() => { rmSync(root, { recursive: true, force: true }); });

  test('commits ONLY the selected file, with derived palace trailers', async () => {
    const res = await request(server).post('/api/commit/create').send({
      paths: ['data.txt'], kind: 'ops', scope: 'io', summary: 'add a data file', verify: 'verified',
    });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(typeof res.body.shortHash).toBe('string');

    // the commit subject + trailers
    const msg = git(root, ['log', '-1', '--format=%B']);
    expect(msg).toMatch(/^ops\(io\): add a data file/);
    expect(msg).toMatch(/Palace-Kind: ops/);
    expect(msg).toMatch(/Palace-Verify: verified/);
    expect(msg).toMatch(/Palace-Author: loudon/);

    // data.txt is committed; README.md's edit is STILL uncommitted (not swept).
    const status = git(root, ['status', '--porcelain=v1']);
    expect(status).not.toMatch(/data\.txt/);
    expect(status).toMatch(/README\.md/);
  });

  test('400 on an unknown kind', async () => {
    const res = await request(server).post('/api/commit/create').send({ paths: ['data.txt'], kind: 'bogus', summary: 's', verify: 'verified' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/kind/i);
  });

  test('400 on a bad verify value', async () => {
    const res = await request(server).post('/api/commit/create').send({ paths: ['data.txt'], kind: 'ops', summary: 's', verify: 'maybe' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/verify/i);
  });

  test('400 when no files are selected', async () => {
    const res = await request(server).post('/api/commit/create').send({ paths: [], kind: 'ops', summary: 's', verify: 'verified' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/no files selected/i);
  });

  test('400 on an empty summary', async () => {
    const res = await request(server).post('/api/commit/create').send({ paths: ['data.txt'], kind: 'ops', summary: '   ', verify: 'verified' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/summary/i);
  });

  test('rejects an out-of-palace path (no traversal)', async () => {
    const res = await request(server).post('/api/commit/create').send({ paths: ['../escape.txt'], kind: 'ops', summary: 's', verify: 'verified' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/unsafe|out-of-palace/i);
  });
});
