// Integration test for POST /api/launch — the route wiring (body parse, status
// codes, palace-root pass-through). The launch impl is injected via opts so NO
// real Terminal opens.

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
  const root = mkdtempSync(resolve(tmpdir(), 'stigmergy-launch-mw-'));
  mkdirSync(resolve(root, '_ops/swarm/persistent'), { recursive: true });
  writeFileSync(resolve(root, '_ops/swarm/persistent/blackboard.jsonl'), '', 'utf8');
  return root;
}

describe('POST /api/launch', () => {
  let root;
  beforeEach(() => { root = makeTempPalace(); });
  afterEach(() => { rmSync(root, { recursive: true, force: true }); });

  test('400 on an empty prompt', async () => {
    const res = await request(makeServer(root)).post('/api/launch').send({ prompt: '   ' });
    expect(res.status).toBe(400);
  });

  test('200 + launched, passing the prompt and palace root to the impl', async () => {
    let seen = null;
    const launchImpl = (prompt, o) => { seen = { prompt, palaceRoot: o.palaceRoot }; return { launched: true, supported: true, scriptPath: '/tmp/x/launch.sh' }; };
    const res = await request(makeServer(root, { launchImpl })).post('/api/launch').send({ prompt: 'drive [[Foo]] — "go"' });
    expect(res.status).toBe(200);
    expect(res.body.launched).toBe(true);
    expect(seen.prompt).toBe('drive [[Foo]] — "go"');
    expect(seen.palaceRoot).toBe(root);
  });

  test('501 when the host is not macOS (client falls back to copy)', async () => {
    const launchImpl = () => ({ launched: false, supported: false, error: 'open-in-terminal is macOS-only — use copy prompt.' });
    const res = await request(makeServer(root, { launchImpl })).post('/api/launch').send({ prompt: 'x' });
    expect(res.status).toBe(501);
    expect(res.body.supported).toBe(false);
  });

  test('500 on an unexpected launch failure', async () => {
    const launchImpl = () => ({ launched: false, supported: true, error: 'osascript failed' });
    const res = await request(makeServer(root, { launchImpl })).post('/api/launch').send({ prompt: 'x' });
    expect(res.status).toBe(500);
  });
});
