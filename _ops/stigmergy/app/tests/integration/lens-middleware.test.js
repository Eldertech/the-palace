import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import http from 'node:http';
import { resolve } from 'node:path';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import request from 'supertest';
import { blackboardMiddleware } from '../../server/middleware.js';

// GET /api/lens/suggest — ranks candidate glass pages for a lensing subject
// by link-distance over the freshest palace-map-full-*.json, per [[The
// Lens]]'s "lean on the graph to suggest" design.

function makeServer(palaceRoot) {
  const plugin = blackboardMiddleware(palaceRoot);
  const handlers = [];
  const fakeServer = { middlewares: { use: (fn) => handlers.push(fn) } };
  plugin.configureServer(fakeServer);
  return http.createServer((req, res) => {
    let i = 0;
    const next = () => {
      if (i >= handlers.length) { res.statusCode = 404; res.end('not found'); return; }
      handlers[i++](req, res, next);
    };
    next();
  });
}

function makeTempPalace({ withMap = true } = {}) {
  const root = mkdtempSync(resolve(tmpdir(), 'stigmergy-lens-test-'));
  mkdirSync(resolve(root, '_ops/swarm/persistent'), { recursive: true });
  writeFileSync(resolve(root, '_ops/swarm/persistent/blackboard.jsonl'), '', 'utf8');
  if (withMap) {
    mkdirSync(resolve(root, '_ops/maps'), { recursive: true });
    const map = {
      meta: { generated: '2026-06-16' },
      nodes: [
        { id: 'Subject', type: 'concept' },
        { id: 'Neighbor', type: 'concept' },
        { id: 'TwoHop', type: 'concept' },
        { id: 'Islanded', type: 'concept' },
      ],
      edges: [
        { source: 'Subject', target: 'Neighbor', type: 'connects-to' },
        { source: 'Neighbor', target: 'TwoHop', type: 'connects-to' },
      ],
    };
    writeFileSync(resolve(root, '_ops/maps/palace-map-full-2026-06-16.json'), JSON.stringify(map));
  }
  return root;
}

describe('GET /api/lens/suggest', () => {
  let root, server;
  afterAll(() => { if (root) rmSync(root, { recursive: true, force: true }); });

  test('ranks candidates by link-distance from the subject', async () => {
    root = makeTempPalace();
    server = makeServer(root);
    const res = await request(server).get('/api/lens/suggest?subject=Subject');
    expect(res.status).toBe(200);
    expect(res.body.subject).toBe('Subject');
    expect(res.body.candidates.map((c) => c.title)).toEqual(['Neighbor', 'TwoHop', 'Islanded']);
    expect(res.body.candidates[0].distance).toBe(1);
  });

  test('respects a ?limit=', async () => {
    root = makeTempPalace();
    server = makeServer(root);
    const res = await request(server).get('/api/lens/suggest?subject=Subject&limit=1');
    expect(res.status).toBe(200);
    expect(res.body.candidates).toHaveLength(1);
  });

  test('400s with no ?subject', async () => {
    root = makeTempPalace();
    server = makeServer(root);
    const res = await request(server).get('/api/lens/suggest');
    expect(res.status).toBe(400);
  });

  test('404s cleanly when no Map Build snapshot exists yet', async () => {
    root = makeTempPalace({ withMap: false });
    server = makeServer(root);
    const res = await request(server).get('/api/lens/suggest?subject=Subject');
    expect(res.status).toBe(404);
  });
});
