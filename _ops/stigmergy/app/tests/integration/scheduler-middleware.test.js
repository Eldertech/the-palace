// Integration test for the scheduler route family — body parse, status-code
// mapping, palaceRoot + launchAgentsDir pass-through. Both impls are injected via
// opts so no real ~/Library/LaunchAgents read and no flag write happens here
// (the genuine reads/writes are covered in scheduler-status.test.js).

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import http from 'node:http';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import request from 'supertest';
import { blackboardMiddleware } from '../../server/middleware.js';

function makeServer(palaceRoot, opts = {}) {
  const plugin = blackboardMiddleware(palaceRoot, opts);
  const handlers = [];
  plugin.configureServer({ middlewares: { use: (fn) => handlers.push(fn) } });
  return http.createServer((req, res) => {
    let i = 0;
    const next = () => {
      if (i >= handlers.length) { res.statusCode = 404; res.end('nf'); return; }
      handlers[i++](req, res, next);
    };
    next();
  });
}

function makeTempPalace() {
  const root = mkdtempSync(resolve(tmpdir(), 'stigmergy-sched-mw-'));
  mkdirSync(resolve(root, '_ops/swarm/persistent'), { recursive: true });
  writeFileSync(resolve(root, '_ops/swarm/persistent/blackboard.jsonl'), '', 'utf8');
  return root;
}

describe('GET /api/scheduler/status', () => {
  let root;
  beforeEach(() => { root = makeTempPalace(); });
  afterEach(() => { rmSync(root, { recursive: true, force: true }); });

  test('200 + status, passing palaceRoot + launchAgentsDir through', async () => {
    let seen = null;
    const schedulerStatusImpl = (args) => { seen = args; return { ok: true, jobs: [], warnings: [], paused: false }; };
    const res = await request(makeServer(root, { schedulerStatusImpl, launchAgentsDir: '/tmp/fake-la' }))
      .get('/api/scheduler/status');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(seen.palaceRoot).toBe(root);
    expect(seen.launchAgentsDir).toBe('/tmp/fake-la');
  });

  test('maps a structured error onto the HTTP status', async () => {
    const schedulerStatusImpl = () => ({ ok: false, status: 500, error: 'no palace root configured' });
    const res = await request(makeServer(root, { schedulerStatusImpl }))
      .get('/api/scheduler/status');
    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/no palace root/);
  });
});

describe('POST /api/scheduler/pause', () => {
  let root;
  beforeEach(() => { root = makeTempPalace(); });
  afterEach(() => { rmSync(root, { recursive: true, force: true }); });

  test('passes the boolean through and returns 200', async () => {
    let seen = null;
    const schedulerPauseImpl = (args) => { seen = args; return { ok: true, paused: true, flag_path: '/x/.paused' }; };
    const res = await request(makeServer(root, { schedulerPauseImpl }))
      .post('/api/scheduler/pause').send({ paused: true });
    expect(res.status).toBe(200);
    expect(res.body.paused).toBe(true);
    expect(seen.palaceRoot).toBe(root);
    expect(seen.paused).toBe(true);
  });

  test('400 when paused is missing or non-boolean', async () => {
    const res = await request(makeServer(root)).post('/api/scheduler/pause').send({});
    expect(res.status).toBe(400);
    const res2 = await request(makeServer(root)).post('/api/scheduler/pause').send({ paused: 'yes' });
    expect(res2.status).toBe(400);
  });

  test('maps a structured error onto the HTTP status', async () => {
    const schedulerPauseImpl = () => ({ ok: false, status: 500, error: 'pause toggle failed: disk' });
    const res = await request(makeServer(root, { schedulerPauseImpl }))
      .post('/api/scheduler/pause').send({ paused: false });
    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/pause toggle failed/);
  });

  test('400 on malformed JSON', async () => {
    const res = await request(makeServer(root))
      .post('/api/scheduler/pause').set('Content-Type', 'application/json').send('{ not json');
    expect(res.status).toBe(400);
  });
});
