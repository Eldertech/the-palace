// Integration test for the entry-agent route family (M1a): the grounding
// endpoint is wired into the router and returns the open entry's neighborhood.

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import http from 'node:http';
import { resolve, join } from 'node:path';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import request from 'supertest';
import { blackboardMiddleware } from '../../server/middleware.js';

function makeServer(palaceRoot) {
  const plugin = blackboardMiddleware(palaceRoot);
  const handlers = [];
  plugin.configureServer({ middlewares: { use: (fn) => handlers.push(fn) } });
  return http.createServer((req, res) => {
    let i = 0;
    const next = () => {
      if (i >= handlers.length) { res.statusCode = 404; res.end('nf'); return; }
      handlers[i++](req, res, next);
    };
    next();
  });
}

describe('GET /api/entry-agent/ground', () => {
  let root, server;
  beforeEach(() => {
    root = mkdtempSync(resolve(tmpdir(), 'stig-entry-agent-'));
    writeFileSync(
      join(root, 'Open Entry.md'),
      '---\ntitle: "Open Entry"\ntype: concept\nstage: growing\nforward_vector: "I want to be grounded."\n'
      + 'links:\n  - target: "[[Neighbor]]"\n    type: deepens\n  - target: "[[Ghost]]"\n    type: connects-to\n---\n# Body\n',
    );
    writeFileSync(
      join(root, 'Neighbor.md'),
      '---\ntitle: Neighbor\ntype: concept\nstage: mature\nforward_vector: "I want to be a good neighbor."\n---\n# N\n',
    );
    server = makeServer(root);
  });
  afterEach(() => { rmSync(root, { recursive: true, force: true }); });

  test('returns grounding for an entry (resolved neighbor + ghost + floor)', async () => {
    const res = await request(server).get('/api/entry-agent/ground').query({ path: 'Open Entry.md' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    const g = res.body.grounding;
    expect(g.entry.title).toBe('Open Entry');
    expect(g.counts).toEqual({ links: 2, neighbors_resolved: 1, neighbors_ghost: 1 });
    const n = g.neighbors.find((x) => x.name === 'Neighbor');
    expect(n.resolved).toBe(true);
    expect(n.forward_vector).toMatch(/good neighbor/);
    expect(g.floor.forward_vector).toMatch(/symbiotic/);
  });

  test('400 when ?path is missing', async () => {
    const res = await request(server).get('/api/entry-agent/ground');
    expect(res.status).toBe(400);
  });

  test('404 for an unknown entry', async () => {
    const res = await request(server).get('/api/entry-agent/ground').query({ path: 'Nope.md' });
    expect(res.status).toBe(404);
  });
});
