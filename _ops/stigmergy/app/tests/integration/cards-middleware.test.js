import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import http from 'node:http';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import request from 'supertest';
import { blackboardMiddleware } from '../../server/middleware.js';
import { createActuator } from '../../server/actuator.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STUB = resolve(__dirname, '../fixtures/stub-worker.mjs');

// Inject a stub-backed actuator so /api/cards/respond never fires real claude.
function makeServer(palaceRoot) {
  const actuator = createActuator({
    palaceRoot, stateDir: join(palaceRoot, '.actuator'),
    buildArgv: () => ['node', STUB, '--permission-mode', 'bypassPermissions', '--sleep', '200'],
  });
  const plugin = blackboardMiddleware(palaceRoot, { actuator });
  const handlers = [];
  plugin.configureServer({ middlewares: { use: (fn) => handlers.push(fn) } });
  const server = http.createServer((req, res) => {
    let i = 0;
    const next = () => { if (i >= handlers.length) { res.statusCode = 404; res.end('nf'); return; } handlers[i++](req, res, next); };
    next();
  });
  return { server, actuator };
}

function makeTempPalace() {
  const root = mkdtempSync(resolve(tmpdir(), 'stigmergy-cards-'));
  mkdirSync(resolve(root, '_ops/swarm/persistent'), { recursive: true });
  writeFileSync(resolve(root, '_ops/swarm/persistent/blackboard.jsonl'), '', 'utf8');
  mkdirSync(resolve(root, 'Enrichment'), { recursive: true });
  return root;
}

function writeCard(root, id, fm, artifactName, artifactBody) {
  const dir = resolve(root, 'Enrichment', id);
  mkdirSync(dir, { recursive: true });
  const yaml = Object.entries(fm).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join('\n');
  writeFileSync(join(dir, 'card.md'), `---\n${yaml}\n---\n${id} body.\n`);
  if (artifactName) writeFileSync(join(dir, artifactName), artifactBody ?? 'artifact');
}

function waitFor(predicate, { timeout = 4000, interval = 40 } = {}) {
  return new Promise((res, rej) => {
    const start = Date.now();
    const tick = () => {
      let ok = false; try { ok = predicate(); } catch (_) { ok = false; }
      if (ok) return res(true);
      if (Date.now() - start > timeout) return rej(new Error('waitFor timeout'));
      setTimeout(tick, interval);
    };
    tick();
  });
}

describe('GET /api/cards', () => {
  let root, server;
  beforeEach(() => { root = makeTempPalace(); ({ server } = makeServer(root)); });
  afterEach(() => { rmSync(root, { recursive: true, force: true }); });

  test('returns normalized non-archived cards, sorted', async () => {
    writeCard(root, 'card-041', { target_name: 'B', purpose: 'p41', artifact_path: 'a.md', artifact_type: 'text', validator_verdict: 'pass' }, 'a.md', 'forty-one');
    writeCard(root, 'card-040', { target_name: 'A', purpose: 'p40', artifact_path: 'img.png', artifact_type: 'image' }, 'img.png', 'PNGDATA');
    writeCard(root, 'card-099', { target_name: 'Z', archived: 'true' }, 'z.md', 'gone');

    const res = await request(server).get('/api/cards');
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(2); // archived skipped
    expect(res.body.cards.map((c) => c.id)).toEqual(['card-040', 'card-041']); // sorted
    const c41 = res.body.cards.find((c) => c.id === 'card-041');
    expect(c41.target_name).toBe('B');
    expect(c41.artifact_type).toBe('text');
    expect(c41.artifact_text).toBe('forty-one'); // text body read inline
    expect(c41.validator_verdict).toBe('pass');
    const c40 = res.body.cards.find((c) => c.id === 'card-040');
    expect(c40.artifact_type).toBe('image');
    expect(c40.artifact_text).toBeNull();
  });

  test('returns an empty list when Enrichment has no cards', async () => {
    const res = await request(server).get('/api/cards');
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
  });
});

describe('POST /api/cards/respond', () => {
  let root, server, actuator;
  beforeEach(() => {
    root = makeTempPalace();
    ({ server, actuator } = makeServer(root));
    writeCard(root, 'card-050', { target_name: 'Target Fifty', purpose: 'koan' }, 'k.md', 'koan');
  });
  afterEach(async () => {
    try { await waitFor(() => !existsSync(actuator.paths.pidFile), { timeout: 3000 }); } catch (_) { /* ignore */ }
    rmSync(root, { recursive: true, force: true });
  });

  test('writes an inbox block and fires the (stub) supervisor', async () => {
    const res = await request(server)
      .post('/api/cards/respond')
      .send({ cardId: 'card-050', action: 'deposit', note: 'ship it', targetName: 'Target Fifty', purpose: 'koan' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.fired).toBe(true);

    const inbox = readFileSync(resolve(root, 'Enrichment/inbox.md'), 'utf8');
    expect(inbox).toMatch(/# Enrichment Inbox/);
    expect(inbox).toMatch(/## card-050 — Target Fifty/);
    expect(inbox).toMatch(/action: deposit/);
    expect(inbox).toMatch(/note: ship it/);
    expect(inbox).toMatch(/\n---\n/);
  });

  test('400 on an unknown action', async () => {
    const res = await request(server).post('/api/cards/respond').send({ cardId: 'card-050', action: 'nonsense' });
    expect(res.status).toBe(400);
  });

  test('400 on a missing cardId', async () => {
    const res = await request(server).post('/api/cards/respond').send({ action: 'deposit' });
    expect(res.status).toBe(400);
  });

  test('a second respond while the worker is alive still writes the inbox (not an error)', async () => {
    const first = await request(server).post('/api/cards/respond').send({ cardId: 'card-050', action: 'deposit' });
    expect(first.body.fired).toBe(true);
    await waitFor(() => actuator.isAlive().running === true, { timeout: 3000 });
    const second = await request(server).post('/api/cards/respond').send({ cardId: 'card-050', action: 'discard' });
    expect(second.status).toBe(200);
    expect(second.body.ok).toBe(true);
    expect(second.body.fired).toBe(false); // worker busy -> not re-fired, but inbox written
    const inbox = readFileSync(resolve(root, 'Enrichment/inbox.md'), 'utf8');
    expect(inbox).toMatch(/action: discard/);
  });
});
