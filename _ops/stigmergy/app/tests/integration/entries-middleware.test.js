import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import http from 'node:http';
import { resolve } from 'node:path';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import request from 'supertest';
import { blackboardMiddleware } from '../../server/middleware.js';

function makeServer(palaceRoot) {
  const plugin = blackboardMiddleware(palaceRoot);
  const handlers = [];
  const fakeServer = { middlewares: { use: (fn) => handlers.push(fn) } };
  plugin.configureServer(fakeServer);
  return http.createServer((req, res) => {
    let i = 0;
    const next = () => {
      if (i >= handlers.length) {
        res.statusCode = 404;
        res.end('not found');
        return;
      }
      handlers[i++](req, res, next);
    };
    next();
  });
}

function makeTempPalace() {
  const root = mkdtempSync(resolve(tmpdir(), 'stigmergy-entries-test-'));
  mkdirSync(resolve(root, '_ops/swarm/persistent'), { recursive: true });
  writeFileSync(resolve(root, '_ops/swarm/persistent/blackboard.jsonl'), '', 'utf8');
  // A meta entry.
  writeFileSync(resolve(root, 'CLAUDE.md'),
    '---\ntitle: CLAUDE\nversion: "1.8"\n---\n# Entry\n');
  // A concept with bundle + media.
  writeFileSync(resolve(root, 'Kuramoto.md'),
    '---\ntitle: Kuramoto\ntype: concept\npillars: [tools, philosophy]\nstage: mature\nlast_activated: "2026-05"\nactivation_count: 12\nlinks:\n  - target: "[[CLAUDE]]"\n    type: mirrors\nforward_vector: "want to teach synchronization."\n---\n# Body\n\n## Active Handoff\nsee handoff.\n');
  mkdirSync(resolve(root, 'Kuramoto'));
  writeFileSync(resolve(root, 'Kuramoto/Kuramoto — handoff.md'), '# h\n');
  writeFileSync(resolve(root, 'Kuramoto/_intro.png'), 'PNGDATA');
  // A nested-folder entry.
  mkdirSync(resolve(root, 'Palace development'));
  writeFileSync(resolve(root, 'Palace development/Two Batons.md'),
    '---\ntitle: "Two Batons"\ntype: breakthrough\n---\n# Body\n');
  // Excluded machinery.
  mkdirSync(resolve(root, '_ops/stigmergy/app'), { recursive: true });
  writeFileSync(resolve(root, '_ops/stigmergy/app/README.md'), '# nope\n');
  return root;
}

describe('GET /api/entries', () => {
  let root, server;

  beforeAll(() => {
    root = makeTempPalace();
    server = makeServer(root);
  });

  afterAll(() => {
    rmSync(root, { recursive: true, force: true });
  });

  test('returns indexed knowledge entries with counts and ts', async () => {
    const res = await request(server).get('/api/entries');
    expect(res.status).toBe(200);
    expect(res.body.count).toBeGreaterThanOrEqual(3);
    expect(typeof res.body.ts).toBe('string');
    const paths = res.body.entries.map((e) => e.path);
    expect(paths).toContain('CLAUDE.md');
    expect(paths).toContain('Kuramoto.md');
    expect(paths).toContain('Palace development/Two Batons.md');
  });

  test('excludes machinery (_ops/stigmergy/app)', async () => {
    const res = await request(server).get('/api/entries');
    const paths = res.body.entries.map((e) => e.path);
    expect(paths).not.toContain('_ops/stigmergy/app/README.md');
  });

  test('surfaces bundle + handoff signals', async () => {
    const res = await request(server).get('/api/entries');
    const kuramoto = res.body.entries.find((e) => e.path === 'Kuramoto.md');
    expect(kuramoto.has_bundle).toBe(true);
    expect(kuramoto.has_active_handoff).toBe(true);
    expect(kuramoto.pillars).toEqual(['tools', 'philosophy']);
    expect(kuramoto.link_count).toBe(1);
  });
});

describe('GET /api/entry?path=', () => {
  let root, server;

  beforeAll(() => {
    root = makeTempPalace();
    server = makeServer(root);
  });

  afterAll(() => {
    rmSync(root, { recursive: true, force: true });
  });

  test('returns the full entry shape with parsed frontmatter, body, links, bundle', async () => {
    const res = await request(server)
      .get('/api/entry')
      .query({ path: 'Kuramoto.md' });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Kuramoto');
    expect(res.body.frontmatter.type).toBe('concept');
    expect(res.body.body).toContain('## Active Handoff');
    expect(res.body.links).toHaveLength(1);
    expect(res.body.links[0].target).toBe('CLAUDE');
    expect(res.body.bundle).not.toBeNull();
    expect(res.body.bundle.files.some((f) => f.kind === 'image')).toBe(true);
  });

  test('404 on a missing entry', async () => {
    const res = await request(server)
      .get('/api/entry')
      .query({ path: 'Nope.md' });
    expect(res.status).toBe(404);
  });

  test('400 on missing ?path', async () => {
    const res = await request(server).get('/api/entry');
    expect(res.status).toBe(400);
  });

  test('404 on path traversal', async () => {
    const res = await request(server)
      .get('/api/entry')
      .query({ path: '../../etc/passwd.md' });
    expect(res.status).toBe(404);
  });

  test('404 on excluded prefix', async () => {
    const res = await request(server)
      .get('/api/entry')
      .query({ path: '_ops/stigmergy/app/README.md' });
    expect(res.status).toBe(404);
  });

  test('reads a nested-folder entry', async () => {
    const res = await request(server)
      .get('/api/entry')
      .query({ path: 'Palace development/Two Batons.md' });
    expect(res.status).toBe(200);
    expect(res.body.frontmatter.type).toBe('breakthrough');
  });
});
