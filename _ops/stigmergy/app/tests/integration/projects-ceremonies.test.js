import { describe, test, expect, afterEach } from 'vitest';
import http from 'node:http';
import { resolve, join } from 'node:path';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import request from 'supertest';
import { blackboardMiddleware } from '../../server/middleware.js';
import { createStewardLane } from '../../server/steward-lane.js';
import { buildCeremonyRows, buildServiceRows, ceremonyStates, writeStandingOrders } from '../../server/projects.js';
import { MARK, CEREMONY_ORDERS_PLACEHOLDER } from '../../../orchestrator/src/scroll-file.js';

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
  return http.createServer((req, res) => {
    let i = 0;
    const next = () => { if (i >= handlers.length) { res.statusCode = 404; res.end('nf'); return; } handlers[i++](req, res, next); };
    next();
  });
}

// A temp palace in a git repo: one project, one ceremony (Return, v1.0, one
// run line since), and one stewarded page that is not a project (a service).
const LEDGER_REL = '_ops/Return Ceremony/Return Ceremony — tuning.md';
function makePalace({ withGit = true } = {}) {
  const root = mkdtempSync(resolve(tmpdir(), 'stigmergy-ceremonies-test-'));
  const git = (...args) => execFileSync('git', args, { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] });
  mkdirSync(resolve(root, '_ops/swarm/persistent'), { recursive: true });
  mkdirSync(resolve(root, '_ops/Return Ceremony'), { recursive: true });
  mkdirSync(resolve(root, '_ops/agents/permanent/shopkeeper'), { recursive: true });
  mkdirSync(resolve(root, 'Projects'), { recursive: true });
  mkdirSync(resolve(root, 'Shop'), { recursive: true });
  writeFileSync(resolve(root, '_ops/swarm/persistent/blackboard.jsonl'), '');
  writeFileSync(resolve(root, 'Projects/Murmuration.md'), '---\ntitle: "Murmuration"\ntype: project\nstatus: active\nstage: growing\n---\n# m\n');
  writeFileSync(resolve(root, 'Shop/Shopkeeper.md'), '---\ntitle: "Shopkeeper"\ntype: maker\nstatus: alive\n---\n# the shopkeeper\n');
  writeFileSync(resolve(root, '_ops/agents/permanent/REGISTRY.json'), JSON.stringify({ schema_version: '1.0', agents: [
    { agent_id: 'Shopkeeper', home: 'Shopkeeper', dir: '_ops/agents/permanent/shopkeeper', registered_at: '2026-09-25T00:00:00.000Z' },
  ] }));
  writeFileSync(resolve(root, '_ops/agents/permanent/shopkeeper/state.json'), JSON.stringify({ iteration: 1, last_active: '2026-09-25T10:00:00Z' }));
  writeFileSync(resolve(root, '_ops/Return Ceremony.md'), '---\ntitle: "Return Ceremony"\ntype: practice\nstage: growing\nversion: "1.0"\n---\n# Return Ceremony\n');
  writeFileSync(resolve(root, '_ops/Return Ceremony/Return Ceremony — tuning.md'), '# Return Ceremony — tuning\n\n## From the first return — 2026-09-25\n\n7. **A probe.** Spec change owed: the probe joins the block.\n');
  if (withGit) {
    git('init', '-q'); git('config', 'user.email', 't@t'); git('config', 'user.name', 't');
    git('add', '-A'); git('commit', '-q', '-m', 'edit(Return Ceremony): v1.0 — version, tuning ledger');
    writeFileSync(resolve(root, LEDGER_REL), readFileSync(resolve(root, LEDGER_REL), 'utf8') + '- run · 2026-09-25 · v1.0 · ten hours · taught item 7\n');
    git('add', '-A'); git('commit', '-q', '-m', 'return(2026-09-25): ten hours');
  }
  return root;
}

let root;
afterEach(() => { if (root) rmSync(root, { recursive: true, force: true }); root = null; });

describe('the deck lists ceremonies and services', () => {
  test('GET /api/projects carries all three groups', async () => {
    root = makePalace();
    const res = await request(makeServer(root)).get('/api/projects');
    expect(res.status).toBe(200);
    expect(res.body.projects.map((r) => r.home)).toEqual(['Murmuration']);
    expect(res.body.services.map((r) => r.home)).toEqual(['Shopkeeper']);
    expect(res.body.services[0]).toMatchObject({ kind: 'service', type: 'maker', stewarded: true });
    const [c] = res.body.ceremonies;
    expect(c).toMatchObject({ kind: 'ceremony', home: 'Return Ceremony', version: '1.0', runs_since: 1, owed: ['7'], orders_owed: 0 });
    expect(c.last_run).toEqual({ ts: '2026-09-25', subject: 'ten hours · taught item 7', version: '1.0' });
  });

  test('ceremony state is cached until HEAD moves', () => {
    root = makePalace();
    const a = ceremonyStates({ palaceRoot: root })[0];
    expect(ceremonyStates({ palaceRoot: root })[0]).toBe(a);   // same object: served from cache
    writeFileSync(resolve(root, LEDGER_REL), readFileSync(resolve(root, LEDGER_REL), 'utf8') + '- run · 2026-09-26 · v1.0 · again · nothing new\n');
    execFileSync('git', ['commit', '-q', '-am', 'return(2026-09-26): again'], { cwd: root, stdio: 'ignore' });
    const b = ceremonyStates({ palaceRoot: root })[0];
    expect(b).not.toBe(a);
    expect(b.runs_since).toHaveLength(2);
  });

  test('without git the ceremony still lists, and its run lines still count', () => {
    root = makePalace({ withGit: false });
    writeFileSync(resolve(root, LEDGER_REL), readFileSync(resolve(root, LEDGER_REL), 'utf8') + '- run · 2026-09-25 · v1.0 · ten hours · nothing new\n');
    const [c] = buildCeremonyRows({ palaceRoot: root });
    expect(c).toMatchObject({ home: 'Return Ceremony', version: '1.0', runs_since: 1, owed: ['7'] });
    expect(c.spec_changed.hash).toBe(null);
    expect(buildServiceRows({ palaceRoot: root }).map((r) => r.home)).toEqual(['Shopkeeper']);
  });
});

describe('a ceremony scroll through the projects endpoints', () => {
  test('GET /api/projects/scroll renders a ceremony scroll live without writing it', async () => {
    root = makePalace();
    const res = await request(makeServer(root)).get('/api/projects/scroll').query({ home: 'Return Ceremony' });
    expect(res.status).toBe(200);
    expect(res.body.kind).toBe('ceremony');
    expect(res.body.exists).toBe(false);
    expect(res.body.zones.now).toMatch(/\*\*Version:\*\* v1\.0/);
    expect(res.body.zones.making).toContain('### 2026-09-25 — ten hours');
    expect(res.body.zones.making).not.toContain('return(2026-09-25)');   // a commit subject is not a run
    expect(existsSync(resolve(root, '_ops/Return Ceremony/Return Ceremony — scroll.md'))).toBe(false);
  });

  test('PUT /api/projects/orders puts a ceremony\'s order in its tuning ledger as owed', async () => {
    root = makePalace();
    const res = await request(makeServer(root)).put('/api/projects/orders').send({ home: 'Return Ceremony', orders: 'Ask before adding\na probe.' });
    expect(res.status).toBe(200);
    expect(res.body.kind).toBe('ceremony');
    expect(res.body.tuning).toBe(LEDGER_REL);
    const ledger = readFileSync(resolve(root, LEDGER_REL), 'utf8');
    expect(ledger.endsWith('- run · 2026-09-25 · v1.0 · ten hours · taught item 7\n- from Loudon · ' + res.body.ledger_orders[0].date + ' · Ask before adding a probe. · owed\n')).toBe(true);
    expect(res.body.ledger_orders).toEqual([{ date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/), text: 'Ask before adding a probe.', status: 'owed', owed: true }]);
    expect(res.body.zones.orders).toBe('');                      // the box takes the next order
    expect(res.body.zones.now).toContain('1 order from Loudon');
    expect(res.body.zones.now).toContain('Ask before adding a probe.');
    // the scroll file is not the destination; nothing wrote it
    expect(existsSync(resolve(root, '_ops/Return Ceremony/Return Ceremony — scroll.md'))).toBe(false);
    const [row] = buildCeremonyRows({ palaceRoot: root });
    expect(row.owed).toEqual(['7', `Loudon ${res.body.ledger_orders[0].date}`]);
    expect(row.orders_owed).toBe(1);
  });

  test('a ceremony order uses the date it is given, and an empty one adds nothing', () => {
    root = makePalace();
    const before = readFileSync(resolve(root, LEDGER_REL), 'utf8');
    expect(writeStandingOrders({ palaceRoot: root, home: 'Return Ceremony', orders: '   ' })).toEqual({ error: 'empty-order' });
    expect(readFileSync(resolve(root, LEDGER_REL), 'utf8')).toBe(before);
    const r = writeStandingOrders({ palaceRoot: root, home: 'Return Ceremony', orders: 'Keep the block to one command.', today: '2026-10-01' });
    expect(r.ledger_orders).toEqual([{ date: '2026-10-01', text: 'Keep the block to one command.', status: 'owed', owed: true }]);
  });

  test('a new ceremony scroll carries the placeholder that says where orders go', () => {
    root = makePalace();
    execFileSync('node', [resolve(__dirname, '../../../orchestrator/src/scroll.js'), '--ceremonies', '--root', root], { stdio: 'ignore' });
    const text = readFileSync(resolve(root, '_ops/Return Ceremony/Return Ceremony — scroll.md'), 'utf8');
    expect(text).toContain(`${MARK.ordersStart}\n${CEREMONY_ORDERS_PLACEHOLDER}\n${MARK.ordersEnd}`);
    expect(CEREMONY_ORDERS_PLACEHOLDER).toMatch(/tuning ledger as owed/);
  });

  test('an unknown home is a 404', async () => {
    root = makePalace();
    const res = await request(makeServer(root)).get('/api/projects/scroll').query({ home: 'Nope' });
    expect(res.status).toBe(404);
  });
});
