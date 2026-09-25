import { describe, test, expect, afterEach } from 'vitest';
import http from 'node:http';
import { resolve, join } from 'node:path';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import request from 'supertest';
import { blackboardMiddleware } from '../../server/middleware.js';
import { createStewardLane } from '../../server/steward-lane.js';
import { buildCeremonyRows, buildServiceRows, ceremonyStates } from '../../server/projects.js';
import { MARK } from '../../../orchestrator/src/scroll-file.js';

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
// run since), and one stewarded page that is not a project (a service).
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
    writeFileSync(resolve(root, 'note.md'), 'x');
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
    expect(c).toMatchObject({ kind: 'ceremony', home: 'Return Ceremony', version: '1.0', runs_since: 1, owed: ['7'] });
    expect(c.last_run.subject).toBe('return(2026-09-25): ten hours');
  });

  test('ceremony state is cached until HEAD moves', () => {
    root = makePalace();
    const a = ceremonyStates({ palaceRoot: root })[0];
    expect(ceremonyStates({ palaceRoot: root })[0]).toBe(a);   // same object: served from cache
    writeFileSync(resolve(root, 'note.md'), 'y');
    execFileSync('git', ['commit', '-q', '-am', 'return(2026-09-26): again'], { cwd: root, stdio: 'ignore' });
    const b = ceremonyStates({ palaceRoot: root })[0];
    expect(b).not.toBe(a);
    expect(b.runs_since).toHaveLength(2);
  });

  test('without git the ceremony still lists, with nothing counted', () => {
    root = makePalace({ withGit: false });
    const [c] = buildCeremonyRows({ palaceRoot: root });
    expect(c).toMatchObject({ home: 'Return Ceremony', version: '1.0', runs_since: 0, owed: ['7'] });
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
    expect(res.body.zones.making).toContain('return(2026-09-25): ten hours');
    expect(existsSync(resolve(root, '_ops/Return Ceremony/Return Ceremony — scroll.md'))).toBe(false);
  });

  test('PUT /api/projects/orders writes a ceremony scroll and keeps its orders', async () => {
    root = makePalace();
    const res = await request(makeServer(root)).put('/api/projects/orders').send({ home: 'Return Ceremony', orders: 'Ask before adding a probe.' });
    expect(res.status).toBe(200);
    expect(res.body.zones.orders).toBe('Ask before adding a probe.');
    const text = readFileSync(resolve(root, '_ops/Return Ceremony/Return Ceremony — scroll.md'), 'utf8');
    expect(text).toContain("The ceremony's front door");
    expect(text).toContain(MARK.makingStart);
  });

  test('an unknown home is a 404', async () => {
    root = makePalace();
    const res = await request(makeServer(root)).get('/api/projects/scroll').query({ home: 'Nope' });
    expect(res.status).toBe(404);
  });
});
