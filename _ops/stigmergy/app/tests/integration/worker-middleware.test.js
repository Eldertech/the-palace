import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import http from 'node:http';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import request from 'supertest';
import { blackboardMiddleware } from '../../server/middleware.js';
import { createActuator } from '../../server/actuator.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STUB = resolve(__dirname, '../fixtures/stub-worker.mjs');

// Inject an actuator whose worker is the harmless stub (still carrying the
// bypassPermissions signature so the ps-liveness check recognizes it).
function makeServer(palaceRoot, actuatorOpts = {}) {
  const actuator = createActuator({
    palaceRoot, stateDir: join(palaceRoot, '.actuator'),
    buildArgv: () => ['node', STUB, '--permission-mode', 'bypassPermissions', ...(actuatorOpts.extra ?? [])],
  });
  const plugin = blackboardMiddleware(palaceRoot, { actuator });
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
  return { server, actuator };
}

function makeTempPalace() {
  const root = mkdtempSync(resolve(tmpdir(), 'stigmergy-worker-test-'));
  mkdirSync(resolve(root, '_ops/swarm/persistent'), { recursive: true });
  writeFileSync(resolve(root, '_ops/swarm/persistent/blackboard.jsonl'), '', 'utf8');
  return root;
}

function waitFor(predicate, { timeout = 4000, interval = 40 } = {}) {
  return new Promise((res, rej) => {
    const start = Date.now();
    const tick = () => {
      let ok = false;
      try { ok = predicate(); } catch (_) { ok = false; }
      if (ok) return res(true);
      if (Date.now() - start > timeout) return rej(new Error('waitFor timeout'));
      setTimeout(tick, interval);
    };
    tick();
  });
}

describe('GET /api/worker', () => {
  let root, server;
  beforeEach(() => { root = makeTempPalace(); ({ server } = makeServer(root)); });
  afterEach(() => { rmSync(root, { recursive: true, force: true }); });

  test('reports idle status before any fire', async () => {
    const res = await request(server).get('/api/worker');
    expect(res.status).toBe(200);
    expect(res.body.running).toBe(false);
    expect(res.body.lastFire.status).toBe('none');
  });
});

describe('POST /api/worker/fire', () => {
  let root, server, actuator;
  beforeEach(() => { root = makeTempPalace(); ({ server, actuator } = makeServer(root, { extra: ['--sleep', '500'] })); });
  afterEach(async () => {
    // Let any spawned stub exit before tearing the dir down.
    try { await waitFor(() => !existsSync(actuator.paths.pidFile), { timeout: 3000 }); } catch (_) { /* ignore */ }
    rmSync(root, { recursive: true, force: true });
  });

  test('fires a worker and returns its status', async () => {
    const res = await request(server)
      .post('/api/worker/fire')
      .send({ prompt: 'do the thing' })
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(200);
    expect(res.body.fired).toBe(true);
    expect(typeof res.body.pid).toBe('number');
  });

  test('a second fire while one is alive is refused with 409 (scar #4)', async () => {
    const first = await request(server).post('/api/worker/fire').send({ prompt: 'first' });
    expect(first.body.fired).toBe(true);
    await waitFor(() => actuator.isAlive().running === true, { timeout: 3000 });
    const second = await request(server).post('/api/worker/fire').send({ prompt: 'second' });
    expect(second.status).toBe(409);
    expect(second.body.fired).toBe(false);
    expect(second.body.msg).toMatch(/already running/);
  });

  test('400 on an empty prompt', async () => {
    const res = await request(server).post('/api/worker/fire').send({ prompt: '   ' });
    expect(res.status).toBe(400);
  });

  test('400 on missing prompt', async () => {
    const res = await request(server).post('/api/worker/fire').send({});
    expect(res.status).toBe(400);
  });

  test('the .worker.log records the fire header', async () => {
    await request(server).post('/api/worker/fire').send({ prompt: 'logged fire' });
    expect(existsSync(actuator.paths.logFile)).toBe(true);
    expect(readFileSync(actuator.paths.logFile, 'utf8')).toMatch(/--- worker fire .+ ---/);
  });
});
