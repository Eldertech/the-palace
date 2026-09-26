import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import http from 'node:http';
import { resolve, join } from 'node:path';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import request from 'supertest';
import { blackboardMiddleware } from '../../server/middleware.js';
import { createStewardLane } from '../../server/steward-lane.js';
import { buildProjectRows, readScroll, writeStandingOrders } from '../../server/projects.js';
import { MARK, ORDERS_PLACEHOLDER } from '../../../orchestrator/src/scroll-file.js';

const HEALTH = { context_pct: 0, stop_reason: 'human_decision', iteration: 1, tokens_this_call: 0, model: 'loudon-trickster', score: 'green' };

function makeServer(palaceRoot) {
  const stewardLane = createStewardLane({
    palaceRoot,
    stateDir: join(palaceRoot, '_ops/stigmergy/.actuator-steward'),
    buildArgv: () => ['node', '-e', '0', '--permission-mode', 'bypassPermissions'],
    dryReap: true,
  });
  const plugin = blackboardMiddleware(palaceRoot, { stewardLane });
  const handlers = [];
  plugin.configureServer({ middlewares: { use: (fn) => handlers.push(fn) } });
  const server = http.createServer((req, res) => {
    let i = 0;
    const next = () => { if (i >= handlers.length) { res.statusCode = 404; res.end('nf'); return; } handlers[i++](req, res, next); };
    next();
  });
  return { server, stewardLane };
}

// A temp palace with two projects: one stewarded (an open ask + a later grant
// already consumed, plus a shipped thing), one untended with bundle media.
function makePalace() {
  const root = mkdtempSync(resolve(tmpdir(), 'stigmergy-projects-test-'));
  mkdirSync(resolve(root, '_ops/swarm/persistent'), { recursive: true });
  mkdirSync(resolve(root, '_ops/agents/permanent/shep'), { recursive: true });
  mkdirSync(resolve(root, 'Projects/Murmuration'), { recursive: true });
  writeFileSync(resolve(root, 'Projects/Shepard Tone Synthesizer.md'), '---\ntitle: "Shepard Tone Synthesizer"\ntype: project\nstatus: active\nstage: growing\n---\n# s\n\n**As of last consolidation:** cycle 4\n');
  writeFileSync(resolve(root, 'Projects/Murmuration.md'), '---\ntitle: "Murmuration"\ntype: project\nstatus: active\nstage: growing\n---\n# m\n');
  writeFileSync(resolve(root, 'Projects/Murmuration/flock.png'), 'png');
  writeFileSync(resolve(root, 'Projects/Done.md'), '---\ntitle: "Done"\ntype: project\nstatus: complete\nstage: mature\n---\n# d\n');
  writeFileSync(resolve(root, 'Spinoza.md'), '---\ntitle: "Spinoza"\ntype: person\n---\n# not a project\n');
  writeFileSync(resolve(root, '_ops/agents/permanent/REGISTRY.json'), JSON.stringify({ schema_version: '1.0', agents: [
    { agent_id: 'Shepard Tone Synthesizer', home: 'Shepard Tone Synthesizer', dir: '_ops/agents/permanent/shep', registered_at: '2026-05-27T00:00:00.000Z' },
  ] }, null, 2));
  writeFileSync(resolve(root, '_ops/agents/permanent/shep/manifest.json'), JSON.stringify({
    agent_id: 'Shepard Tone Synthesizer', home: 'Shepard Tone Synthesizer', session_id: 'permanent-stewardship-test',
    mode: 'long_duration_background', model: { name: 'claude-opus-5-5' }, stopping_conditions: { max_iterations: 10, stop_on: [] },
    blackboard_persistent_path: '_ops/swarm/persistent/blackboard.jsonl', stewardship: { stage_at_spawn: 'growing' },
  }));
  writeFileSync(resolve(root, '_ops/agents/permanent/shep/state.json'), JSON.stringify({ iteration: 6, last_active: '2026-06-06T18:10:00Z', last_read_cursor: 'shep-004', health: { score: 'green' } }));
  writeFileSync(resolve(root, '_ops/agents/permanent/shep/history.jsonl'), [
    JSON.stringify({ event: 'CYCLE_6_SPAWN', ts: '2026-06-06T18:00:00Z' }),
    JSON.stringify({ event: 'TOOL_CALL', ts: '2026-06-06T18:00:00Z', args: { message_id: 'shep-003' } }),
    JSON.stringify({ event: 'CYCLE_COMPLETE', ts: '2026-06-06T18:10:00Z', iteration: 6, posted_messages: ['shep-003', 'shep-004'] }),
  ].join('\n') + '\n');
  const HOME = 'Shepard Tone Synthesizer';
  const msgs = [
    { schema_version: '1.0', id: 'shep-003', ts: '2026-06-06T14:05:00-04:00', session_id: 's', from: HOME, to: '*', type: 'BROADCAST', board: 'GENERAL', health: HEALTH,
      payload: { kind: 'shipped_artifact', headline: 'Twelve drones rendered', ground: 'shipped', content: 'Catch-up — twelve drones.\n\nRendered.', artifacts: [{ path: 'Projects/Shepard Tone Synthesizer/c.wav', caption: 'C' }] } },
    { schema_version: '1.0', id: 'shep-004', request_id: 'shep-004', ts: '2026-06-06T14:08:00-04:00', session_id: 's', from: HOME, to: 'TRICKSTER', type: 'RESOURCE_REQUEST', board: 'TRICKSTER', health: HEALTH,
      payload: { resource: 'audition_verification', blocking: true, headline: 'Do the drones fuse?', rationale: 'Listen.', options: [{ id: 'APPROVE', label: 'APPROVE' }] } },
  ];
  writeFileSync(resolve(root, '_ops/swarm/persistent/blackboard.jsonl'), msgs.map((m) => JSON.stringify(m)).join('\n') + '\n');
  return root;
}

describe('GET /api/projects', () => {
  let root, server;
  beforeEach(() => { root = makePalace(); ({ server } = makeServer(root)); });
  afterEach(() => { rmSync(root, { recursive: true, force: true }); });

  test('lists every type:project entry (active first), computed by the scroll rule', async () => {
    const res = await request(server).get('/api/projects');
    expect(res.status).toBe(200);
    const homes = res.body.projects.map((p) => p.home);
    expect(homes).toContain('Shepard Tone Synthesizer');
    expect(homes).toContain('Murmuration');
    expect(homes).toContain('Done');
    expect(homes).not.toContain('Spinoza');
    const shep = res.body.projects.find((p) => p.home === 'Shepard Tone Synthesizer');
    expect(shep).toMatchObject({ stewarded: true, iteration: 6, stage: 'growing', status: 'active', open_asks: 1, open_blocking: true, answered_unconsumed: 0, stalled: false, run_cap: 10, model: 'claude-opus-5-5' });
    expect(shep.last_shipped).toMatchObject({ id: 'shep-003', headline: 'Twelve drones rendered' });
    expect(shep.drift).toEqual({ cycles: 2, decisions: 0, consolidated_at: 4 });
    expect(shep.scroll_path).toBe('Projects/Shepard Tone Synthesizer/Shepard Tone Synthesizer — scroll.md');
    expect(shep.scroll_exists).toBe(false);
    expect(homes.indexOf('Shepard Tone Synthesizer')).toBe(0); // needs Loudon → first
    const murm = res.body.projects.find((p) => p.home === 'Murmuration');
    expect(murm).toMatchObject({ stewarded: false, iteration: null, open_asks: 0, last_shipped: null });
    expect(res.body.worker).toBeTruthy();
  });

  test('an answer filed after the steward last ran shows as answered_unconsumed with no cycle', async () => {
    const boardPath = resolve(root, '_ops/swarm/persistent/blackboard.jsonl');
    const grant = { schema_version: '1.0', id: 'g-1', ts: '2026-08-26T02:56:05Z', session_id: 's', from: 'TRICKSTER', to: 'Shepard Tone Synthesizer', type: 'RESOURCE_GRANT', board: 'TRICKSTER', re: 'shep-004', health: HEALTH, payload: { granted: true, option_id: 'APPROVE' } };
    writeFileSync(boardPath, readFileSync(boardPath, 'utf8') + JSON.stringify(grant) + '\n');
    const res = await request(server).get('/api/projects');
    const shep = res.body.projects.find((p) => p.home === 'Shepard Tone Synthesizer');
    expect(shep.open_asks).toBe(0);
    expect(shep.answered_unconsumed).toBe(1);
  });
});

describe('GET /api/projects/scroll + PUT /api/projects/orders', () => {
  let root, server;
  beforeEach(() => { root = makePalace(); ({ server } = makeServer(root)); });
  afterEach(() => { rmSync(root, { recursive: true, force: true }); });

  test('reads a live scroll for a project with none on disk (nothing written), then persists on write=1', async () => {
    const r1 = await request(server).get('/api/projects/scroll?home=' + encodeURIComponent('Shepard Tone Synthesizer'));
    expect(r1.status).toBe(200);
    expect(r1.body.exists).toBe(false);
    expect(r1.body.zones.now).toContain('**Stage:** growing');
    expect(r1.body.zones.now).toContain('`shep-004`');
    expect(r1.body.zones.orders).toBe('');
    expect(r1.body.now.open).toHaveLength(1);
    expect(existsSync(resolve(root, r1.body.path))).toBe(false);

    const r2 = await request(server).get('/api/projects/scroll?home=' + encodeURIComponent('Shepard Tone Synthesizer') + '&write=1');
    expect(r2.status).toBe(200);
    expect(r2.body.exists).toBe(true);
    expect(existsSync(resolve(root, r2.body.path))).toBe(true);
    expect(r2.body.zones.making).toContain('id="shep-003"');
    expect(r2.body.zones.making).toContain('[C](Projects/Shepard Tone Synthesizer/c.wav)');
  });

  test('404 for an unknown project; 400 without ?home', async () => {
    expect((await request(server).get('/api/projects/scroll?home=Ghost')).status).toBe(404);
    expect((await request(server).get('/api/projects/scroll')).status).toBe(400);
  });

  test('PUT orders creates the scroll if needed, writes only the orders zone, and the next read carries them', async () => {
    const put = await request(server).put('/api/projects/orders').send({ home: 'Shepard Tone Synthesizer', orders: 'Never ask about crossfades. Prefer the illusion.' });
    expect(put.status).toBe(200);
    expect(put.body.zones.orders).toBe('Never ask about crossfades. Prefer the illusion.');
    const onDisk = readFileSync(resolve(root, put.body.path), 'utf8');
    expect(onDisk).toContain(`${MARK.ordersStart}\nNever ask about crossfades. Prefer the illusion.\n${MARK.ordersEnd}`);
    expect(onDisk).not.toContain(ORDERS_PLACEHOLDER);
    expect(onDisk).toContain('id="shep-003"'); // the making trail survived the orders write
    const again = await request(server).get('/api/projects/scroll?home=' + encodeURIComponent('Shepard Tone Synthesizer'));
    expect(again.body.zones.orders).toBe('Never ask about crossfades. Prefer the illusion.');
    // clearing restores the placeholder (reads as empty)
    const clear = await request(server).put('/api/projects/orders').send({ home: 'Shepard Tone Synthesizer', orders: '' });
    expect(clear.body.zones.orders).toBe('');
    expect(readFileSync(resolve(root, put.body.path), 'utf8')).toContain(ORDERS_PLACEHOLDER);
  });

  test('PUT plan writes the agreed plan, logs the change on the trail, and the next read carries it', async () => {
    const put = await request(server).put('/api/projects/plan').send({ home: 'Shepard Tone Synthesizer', plan: 'An endless staircase you can play.\n\n1. Make the illusion hold.', why: 'agreed with Loudon' });
    expect(put.status).toBe(200);
    expect(put.body.zones.plan).toBe('An endless staircase you can play.\n\n1. Make the illusion hold.');
    expect(put.body.now.plan.agreed).toBe(true);
    const onDisk = readFileSync(resolve(root, put.body.path), 'utf8');
    expect(onDisk).toContain('agreed with Loudon');
    expect(onDisk).toContain('Loudon, on the PROJECTS deck');
    expect(onDisk).toContain('id="shep-003"'); // the making trail survived the plan write
    const again = await request(server).get('/api/projects/scroll?home=' + encodeURIComponent('Shepard Tone Synthesizer'));
    expect(again.body.zones.plan).toBe('An endless staircase you can play.\n\n1. Make the illusion hold.');
    const same = await request(server).put('/api/projects/plan').send({ home: 'Shepard Tone Synthesizer', plan: 'An endless staircase you can play.\n\n1. Make the illusion hold.' });
    expect(same.status).toBe(422);
    expect(same.body.error).toBe('unchanged');
    expect((await request(server).put('/api/projects/plan').send({ home: 'Ghost', plan: 'x' })).status).toBe(404);
    expect((await request(server).put('/api/projects/plan').send({ home: 'Murmuration', plan: 5 })).status).toBe(400);
  });

  test('PUT orders: 404 unknown project, 400 bad body', async () => {
    expect((await request(server).put('/api/projects/orders').send({ home: 'Ghost', orders: 'x' })).status).toBe(404);
    expect((await request(server).put('/api/projects/orders').send({ orders: 'x' })).status).toBe(400);
    expect((await request(server).put('/api/projects/orders').send({ home: 'Murmuration', orders: 5 })).status).toBe(400);
  });

  test('pure: buildProjectRows / readScroll / writeStandingOrders agree with the routes', () => {
    const rows = buildProjectRows({ palaceRoot: root });
    expect(rows.find((r) => r.home === 'Murmuration').stewarded).toBe(false);
    const sc = readScroll({ palaceRoot: root, home: 'Murmuration' });
    expect(sc.zones.now).toContain('**Steward:** none');
    const w = writeStandingOrders({ palaceRoot: root, home: 'Murmuration', orders: 'flock first' });
    expect(w.zones.orders).toBe('flock first');
    expect(readFileSync(resolve(root, 'Projects/Murmuration/Murmuration — scroll.md'), 'utf8')).toContain('backfilled from the bundle');
  });
});
