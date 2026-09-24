import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import http from 'node:http';
import { resolve, join } from 'node:path';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import request from 'supertest';
import { blackboardMiddleware } from '../../server/middleware.js';
import { createStewardLane } from '../../server/steward-lane.js';
import { buildProjectRows, enchantProject } from '../../server/projects.js';

// POST /api/projects/enchant — the "no steward" row's button. Same act as
// `node enchant.js "<Title>"`: manifest + state + history + registry line.

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

function makePalace() {
  const root = mkdtempSync(resolve(tmpdir(), 'stigmergy-enchant-test-'));
  mkdirSync(resolve(root, '_ops/swarm/persistent'), { recursive: true });
  mkdirSync(resolve(root, '_ops/agents/permanent'), { recursive: true });
  mkdirSync(resolve(root, 'Projects/Murmuration'), { recursive: true });
  writeFileSync(resolve(root, '_ops/swarm/persistent/blackboard.jsonl'), '');
  writeFileSync(resolve(root, 'Projects/Murmuration/Murmuration.md'),
    '---\ntitle: "Murmuration"\ntype: project\nstatus: active\nstage: growing\nforward_vector: "I want to become a flock."\nlinks:\n  - target: "[[Kuramoto Coupling]]"\n    type: mirrors\n---\n# m\n');
  return root;
}

describe('POST /api/projects/enchant', () => {
  let root, server;
  beforeEach(() => { root = makePalace(); server = makeServer(root); });
  afterEach(() => { try { server.close(); } catch {} rmSync(root, { recursive: true, force: true }); });

  test('an untended project gains a steward dir + registry line, and its row becomes stewarded', async () => {
    const before = buildProjectRows({ palaceRoot: root }).find((r) => r.home === 'Murmuration');
    expect(before.stewarded).toBe(false);

    const res = await request(server).post('/api/projects/enchant').send({ home: 'Murmuration' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.result).toBe('enchanted');
    expect(res.body.slug).toBe('murmuration');

    const dir = resolve(root, '_ops/agents/permanent/murmuration');
    for (const f of ['manifest.json', 'state.json', 'history.jsonl']) expect(existsSync(join(dir, f))).toBe(true);
    const manifest = JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8'));
    expect(manifest.home).toBe('Murmuration');
    const registry = JSON.parse(readFileSync(resolve(root, '_ops/agents/permanent/REGISTRY.json'), 'utf8'));
    expect(registry.agents.some((a) => a.home === 'Murmuration')).toBe(true);

    const after = buildProjectRows({ palaceRoot: root }).find((r) => r.home === 'Murmuration');
    expect(after.stewarded).toBe(true);
  });

  test('is idempotent: a second enchant reports already_enchanted with 200', async () => {
    await request(server).post('/api/projects/enchant').send({ home: 'Murmuration' });
    const res = await request(server).post('/api/projects/enchant').send({ home: 'Murmuration' });
    expect(res.status).toBe(200);
    expect(res.body.result).toBe('already_enchanted');
  });

  test('404 for a title with no entry, 400 for a missing home', async () => {
    const nf = await request(server).post('/api/projects/enchant').send({ home: 'No Such Project' });
    expect(nf.status).toBe(404);
    const bad = await request(server).post('/api/projects/enchant').send({});
    expect(bad.status).toBe(400);
  });

  test('enchantProject maps helper statuses to http codes', () => {
    expect(enchantProject({ palaceRoot: root, home: 'Nope' }).http).toBe(404);
    expect(enchantProject({ palaceRoot: root, home: 'Murmuration' }).http).toBe(200);
  });
});
