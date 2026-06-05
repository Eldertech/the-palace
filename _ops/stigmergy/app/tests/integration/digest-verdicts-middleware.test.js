import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import http from 'node:http';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import request from 'supertest';
import { blackboardMiddleware } from '../../server/middleware.js';
import { createActuator } from '../../server/actuator.js';
import { VERDICTS_REL } from '../../server/digest-verdicts.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STUB = resolve(__dirname, '../fixtures/stub-worker.mjs');

function makeServer(palaceRoot) {
  const actuator = createActuator({
    palaceRoot, stateDir: join(palaceRoot, '.actuator'),
    buildArgv: () => ['node', STUB, '--permission-mode', 'bypassPermissions', '--sleep', '50'],
  });
  const plugin = blackboardMiddleware(palaceRoot, { actuator });
  const handlers = [];
  plugin.configureServer({ middlewares: { use: (fn) => handlers.push(fn) } });
  return http.createServer((req, res) => {
    let i = 0;
    const next = () => { if (i >= handlers.length) { res.statusCode = 404; res.end('nf'); return; } handlers[i++](req, res, next); };
    next();
  });
}

function makeTempPalace() {
  const root = mkdtempSync(resolve(tmpdir(), 'stigmergy-verdicts-'));
  mkdirSync(resolve(root, '_ops/swarm/persistent'), { recursive: true });
  writeFileSync(resolve(root, '_ops/swarm/persistent/blackboard.jsonl'), '', 'utf8');
  return root;
}

function validVerdict(over = {}) {
  return {
    id: 'v-test-' + Math.random().toString(36).slice(2, 8),
    ts: '2026-06-05T13:20:00.000Z',
    run_generated_at: '2026-06-05T04:43:11.359Z',
    request_id: 'gwl-steward-015',
    rule_id: 'grant-nonblocking-recommended-fork',
    from: 'Generative Wavetable Libraries',
    proposed_verb: 'auto-grant',
    agree: true,
    would_do: null,
    note: '',
    ...over,
  };
}

describe('POST /api/digest/verdict', () => {
  let root, server;
  beforeEach(() => { root = makeTempPalace(); server = makeServer(root); });
  afterEach(() => { rmSync(root, { recursive: true, force: true }); });

  test('valid agree verdict → 200, line appended', async () => {
    const rec = validVerdict();
    const res = await request(server)
      .post('/api/digest/verdict')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(rec));
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(typeof res.body.line).toBe('string');

    const path = resolve(root, VERDICTS_REL);
    expect(existsSync(path)).toBe(true);
    const lines = readFileSync(path, 'utf8').split('\n').filter(Boolean);
    expect(lines.length).toBe(1);
    const parsed = JSON.parse(lines[0]);
    expect(parsed.id).toBe(rec.id);
    expect(parsed.agree).toBe(true);
  });

  test('valid differ verdict with would_do → 200', async () => {
    const rec = validVerdict({ agree: false, would_do: 'TWEAK-PARAMS' });
    const res = await request(server)
      .post('/api/digest/verdict')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(rec));
    expect(res.status).toBe(200);
  });

  test('differ verdict with neither would_do nor note → 400', async () => {
    const rec = validVerdict({ agree: false, would_do: null, note: '' });
    const res = await request(server)
      .post('/api/digest/verdict')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(rec));
    expect(res.status).toBe(400);
    expect(Array.isArray(res.body.errors)).toBe(true);
  });

  test('missing agree → 400', async () => {
    const rec = validVerdict();
    delete rec.agree;
    const res = await request(server)
      .post('/api/digest/verdict')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(rec));
    expect(res.status).toBe(400);
    expect(res.body.errors.some((e) => e.path === 'agree')).toBe(true);
  });

  test('malformed JSON → 400', async () => {
    const res = await request(server)
      .post('/api/digest/verdict')
      .set('Content-Type', 'application/json')
      .send('{not json');
    expect(res.status).toBe(400);
  });

  test('multiple verdicts append cleanly', async () => {
    const a = validVerdict({ id: 'v-a', request_id: 'r1' });
    const b = validVerdict({ id: 'v-b', request_id: 'r2' });
    await request(server).post('/api/digest/verdict').set('Content-Type', 'application/json').send(JSON.stringify(a));
    await request(server).post('/api/digest/verdict').set('Content-Type', 'application/json').send(JSON.stringify(b));
    const lines = readFileSync(resolve(root, VERDICTS_REL), 'utf8').split('\n').filter(Boolean);
    expect(lines.length).toBe(2);
  });
});

describe('GET /api/digest/verdicts', () => {
  let root, server;
  beforeEach(() => { root = makeTempPalace(); server = makeServer(root); });
  afterEach(() => { rmSync(root, { recursive: true, force: true }); });

  test('empty palace → empty verdicts, zeroed stats', async () => {
    const res = await request(server).get('/api/digest/verdicts');
    expect(res.status).toBe(200);
    expect(res.body.verdicts).toEqual([]);
    expect(res.body.stats.overall).toEqual({ marked: 0, agree: 0, rate: 0 });
    expect(res.body.stats.byRule).toEqual({});
  });

  test('after posting verdicts → GET returns them with computed stats', async () => {
    const recs = [
      validVerdict({ id: 'v-1', request_id: 'r1', agree: true }),
      validVerdict({ id: 'v-2', request_id: 'r2', agree: true }),
      validVerdict({ id: 'v-3', request_id: 'r3', agree: false, would_do: 'TWEAK' }),
    ];
    for (const r of recs) {
      await request(server).post('/api/digest/verdict').set('Content-Type', 'application/json').send(JSON.stringify(r));
    }
    const res = await request(server).get('/api/digest/verdicts');
    expect(res.status).toBe(200);
    expect(res.body.verdicts.length).toBe(3);
    expect(res.body.stats.overall.marked).toBe(3);
    expect(res.body.stats.overall.agree).toBe(2);
    expect(res.body.stats.byRule['grant-nonblocking-recommended-fork'].marked).toBe(3);
  });
});
