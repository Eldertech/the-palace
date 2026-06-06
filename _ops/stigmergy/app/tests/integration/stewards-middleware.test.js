import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import http from 'node:http';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import request from 'supertest';
import { blackboardMiddleware } from '../../server/middleware.js';
import { createStewardLane } from '../../server/steward-lane.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STUB = resolve(__dirname, '../fixtures/stub-steward-worker.mjs');

// A steward lane wired to the harmless stub worker (still carrying the
// bypassPermissions signature). dryReap:false so the REAL processCycle reap
// runs against the TEMP palace -- this is what proves a grant gets consumed.
function makeServer(palaceRoot, { extra = [] } = {}) {
  const stewardLane = createStewardLane({
    palaceRoot,
    stateDir: join(palaceRoot, '_ops/stigmergy/.actuator-steward'),
    buildArgv: () => ['node', STUB, '--permission-mode', 'bypassPermissions', ...extra],
    dryReap: false,
  });
  const plugin = blackboardMiddleware(palaceRoot, { stewardLane });
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
  return { server, stewardLane };
}

function makeTempPalace() {
  const root = mkdtempSync(resolve(tmpdir(), 'stigmergy-steward-test-'));
  mkdirSync(resolve(root, '_ops/swarm/persistent'), { recursive: true });
  mkdirSync(resolve(root, '_ops/agents/permanent'), { recursive: true });
  writeFileSync(resolve(root, '_ops/swarm/persistent/blackboard.jsonl'), '', 'utf8');
  writeFileSync(
    resolve(root, '_ops/agents/permanent/REGISTRY.json'),
    JSON.stringify({ schema_version: '1.0', agents: [] }, null, 2),
    'utf8',
  );
  return root;
}

const HEALTH = { context_pct: 0, stop_reason: 'human_decision', iteration: 1, tokens_this_call: 0, model: 'loudon-trickster', score: 'green' };

// Seed one steward: REGISTRY entry, manifest, state with the ask pending, and
// (optionally) the ask + a matching grant on the board.
function seedSteward(root, { name, slug, requestId, withGrant = true }) {
  const dirRel = `_ops/agents/permanent/${slug}`;
  const agentDir = resolve(root, dirRel);
  mkdirSync(agentDir, { recursive: true });

  // append to REGISTRY
  const regPath = resolve(root, '_ops/agents/permanent/REGISTRY.json');
  const reg = JSON.parse(readFileSync(regPath, 'utf8'));
  reg.agents.push({ agent_id: name, home: name, dir: dirRel, registered_at: '2026-05-27T00:00:00.000Z' });
  writeFileSync(regPath, JSON.stringify(reg, null, 2), 'utf8');

  writeFileSync(join(agentDir, 'manifest.json'), JSON.stringify({
    agent_id: name, home: name, session_id: 'permanent-stewardship-test',
    mode: 'long_duration_background', model: { name: 'claude-opus-4-7' },
    blackboard_persistent_path: '_ops/swarm/persistent/blackboard.jsonl',
    stewardship: { stage_at_spawn: 'sprout' },
  }, null, 2), 'utf8');

  writeFileSync(join(agentDir, 'state.json'), JSON.stringify({
    iteration: 1,
    last_active: null,
    last_read_cursor: null,
    stewardship: { stage_at_last_activation: 'sprout' },
    pending_requests: [{ request_id: requestId, resource: 'directional_decision', blocking: false, posted_at: '2026-06-03T00:00:00-04:00', options: ['A', 'B'] }],
    resolved_requests: [],
    health: { score: 'green' },
  }, null, 2), 'utf8');

  writeFileSync(join(agentDir, 'history.jsonl'), '', 'utf8');

  // board: the steward's ask + the human's grant
  const boardPath = resolve(root, '_ops/swarm/persistent/blackboard.jsonl');
  const lines = [];
  lines.push(JSON.stringify({
    schema_version: '1.0', id: requestId, request_id: requestId, ts: '2026-06-03T00:00:00-04:00',
    session_id: 'permanent-stewardship-test', from: name, to: 'TRICKSTER', type: 'RESOURCE_REQUEST', board: 'TRICKSTER',
    health: HEALTH, payload: { resource: 'directional_decision', decision_topic: 'which way', options: [{ id: 'A', label: 'A' }, { id: 'B', label: 'B' }] },
  }));
  if (withGrant) {
    lines.push(JSON.stringify({
      schema_version: '1.0', id: `grant-${requestId}`, ts: '2026-06-05T00:00:00-04:00',
      session_id: 'permanent-stewardship-test', from: 'TRICKSTER', to: name, type: 'RESOURCE_GRANT', board: 'TRICKSTER',
      re: requestId, health: HEALTH, payload: { granted: true, option_id: 'A' },
    }));
  }
  const prev = readFileSync(boardPath, 'utf8');
  writeFileSync(boardPath, prev + lines.join('\n') + '\n', 'utf8');

  return { name, dirRel, agentDir, requestId };
}

function waitFor(predicate, { timeout = 8000, interval = 50 } = {}) {
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

const readState = (agentDir) => JSON.parse(readFileSync(join(agentDir, 'state.json'), 'utf8'));

describe('GET /api/stewards', () => {
  let root, server;
  beforeEach(() => { root = makeTempPalace(); ({ server } = makeServer(root)); });
  afterEach(() => { rmSync(root, { recursive: true, force: true }); });

  test('reports a grant waiting to be consumed', async () => {
    seedSteward(root, { name: 'Test Steward', slug: 'test-steward', requestId: 'test-steward-001' });
    const res = await request(server).get('/api/stewards');
    expect(res.status).toBe(200);
    const row = res.body.stewards.find((s) => s.agent_id === 'Test Steward');
    expect(row).toBeTruthy();
    expect(row.grants_waiting).toBe(1);
    expect(row.pending_count).toBe(1);
    expect(row.stage).toBe('sprout');
    expect(res.body.worker.running).toBe(false);
  });

  test('a steward with no grant on the board shows grants_waiting 0', async () => {
    seedSteward(root, { name: 'Quiet Steward', slug: 'quiet-steward', requestId: 'quiet-steward-001', withGrant: false });
    const res = await request(server).get('/api/stewards');
    const row = res.body.stewards.find((s) => s.agent_id === 'Quiet Steward');
    expect(row.grants_waiting).toBe(0);
    expect(row.pending_count).toBe(1);
  });
});

describe('POST /api/steward/advance', () => {
  let root, server, stewardLane;
  beforeEach(() => { root = makeTempPalace(); ({ server, stewardLane } = makeServer(root, { extra: ['--from', 'Test Steward', '--msg-id', 'stub-msg-001', '--sleep', '400'] })); });
  afterEach(async () => {
    try { await waitFor(() => !existsSync(stewardLane.paths.pidFile), { timeout: 4000 }); } catch (_) { /* ignore */ }
    rmSync(root, { recursive: true, force: true });
  });

  test('advances a steward and the reaper consumes the grant (THE proof)', async () => {
    const { agentDir } = seedSteward(root, { name: 'Test Steward', slug: 'test-steward', requestId: 'test-steward-001' });

    const res = await request(server).post('/api/steward/advance').send({ name: 'Test Steward' });
    expect(res.status).toBe(200);
    expect(res.body.fired).toBe(true);
    expect(res.body.cycle_n).toBe(2);

    // Wait for the worker to exit AND the reap to record a last-cycle summary.
    await waitFor(() => !existsSync(stewardLane.paths.pidFile), { timeout: 6000 });
    await waitFor(() => existsSync(stewardLane.paths.lastCycleFile), { timeout: 4000 });

    // (a) the stub's emitted BROADCAST landed on the board
    const board = readFileSync(resolve(root, '_ops/swarm/persistent/blackboard.jsonl'), 'utf8');
    expect(board).toMatch(/stub-msg-001/);

    // (b) the grant was CONSUMED: pending -> resolved in state.json
    const state = readState(agentDir);
    expect(state.pending_requests.map((p) => p.request_id)).not.toContain('test-steward-001');
    expect(state.resolved_requests.map((r) => r.request_id)).toContain('test-steward-001');
    expect(state.iteration).toBe(2);

    // (c) history records a BBS-actuator-dispatched cycle
    const history = readFileSync(join(agentDir, 'history.jsonl'), 'utf8');
    expect(history).toMatch(/"dispatched_by":"bbs-actuator"/);

    // (d) GET /api/stewards now shows grants_waiting back to 0
    const after = await request(server).get('/api/stewards');
    const row = after.body.stewards.find((s) => s.agent_id === 'Test Steward');
    expect(row.grants_waiting).toBe(0);
  }, 20000);

  test('404 on an unknown steward', async () => {
    const res = await request(server).post('/api/steward/advance').send({ name: 'Nobody' });
    expect(res.status).toBe(404);
    expect(res.body.found).toBe(false);
  });

  test('400 on a missing name', async () => {
    const res = await request(server).post('/api/steward/advance').send({});
    expect(res.status).toBe(400);
  });

  test('409 when a steward cycle is already running', async () => {
    seedSteward(root, { name: 'Test Steward', slug: 'test-steward', requestId: 'test-steward-001' });
    seedSteward(root, { name: 'Other Steward', slug: 'other-steward', requestId: 'other-steward-001' });
    const first = await request(server).post('/api/steward/advance').send({ name: 'Test Steward' });
    expect(first.body.fired).toBe(true);
    await waitFor(() => stewardLane.status().running === true, { timeout: 3000 });
    const second = await request(server).post('/api/steward/advance').send({ name: 'Other Steward' });
    expect(second.status).toBe(409);
    expect(second.body.busy).toBe(true);
  });
});

describe('POST /api/stewards/advance-all', () => {
  let root, server, stewardLane;
  beforeEach(() => { root = makeTempPalace(); ({ server, stewardLane } = makeServer(root, { extra: ['--sleep', '40'] })); });
  afterEach(async () => {
    try { await waitFor(() => !existsSync(stewardLane.paths.pidFile) && stewardLane.status().queue.length === 0, { timeout: 8000 }); } catch (_) { /* ignore */ }
    rmSync(root, { recursive: true, force: true });
  });

  test('advances every ready steward serially and consumes both grants', async () => {
    const a = seedSteward(root, { name: 'Alpha Steward', slug: 'alpha-steward', requestId: 'alpha-001' });
    const b = seedSteward(root, { name: 'Beta Steward', slug: 'beta-steward', requestId: 'beta-001' });

    const res = await request(server).post('/api/stewards/advance-all').send({});
    expect(res.status).toBe(200);
    expect(res.body.queued.sort()).toEqual(['Alpha Steward', 'Beta Steward']);

    // Wait for the batch to fully drain (both reaped, queue empty, worker idle).
    await waitFor(() => {
      const st = stewardLane.status();
      return !st.running && st.queue.length === 0
        && readState(a.agentDir).resolved_requests.some((r) => r.request_id === 'alpha-001')
        && readState(b.agentDir).resolved_requests.some((r) => r.request_id === 'beta-001');
    }, { timeout: 10000 });

    expect(readState(a.agentDir).pending_requests).toHaveLength(0);
    expect(readState(b.agentDir).pending_requests).toHaveLength(0);
  }, 20000);

  test('reports nothing to do when no steward has a grant waiting', async () => {
    seedSteward(root, { name: 'Quiet Steward', slug: 'quiet-steward', requestId: 'quiet-001', withGrant: false });
    const res = await request(server).post('/api/stewards/advance-all').send({});
    expect(res.status).toBe(200);
    expect(res.body.queued).toEqual([]);
  });
});
