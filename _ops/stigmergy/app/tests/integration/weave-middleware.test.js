// Integration test for POST /api/weave/apply — the route wiring (body parse,
// status codes, palace-root + boardPath pass-through). The executor is injected
// via opts so NO real git write happens here (that path is covered end-to-end in
// weave-apply.test.js).

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import http from 'node:http';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import request from 'supertest';
import { blackboardMiddleware } from '../../server/middleware.js';

function makeServer(palaceRoot, opts = {}) {
  const plugin = blackboardMiddleware(palaceRoot, opts);
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

function makeTempPalace() {
  const root = mkdtempSync(resolve(tmpdir(), 'stigmergy-weave-mw-'));
  mkdirSync(resolve(root, '_ops/swarm/persistent'), { recursive: true });
  writeFileSync(resolve(root, '_ops/swarm/persistent/blackboard.jsonl'), '', 'utf8');
  return root;
}

describe('POST /api/weave/apply', () => {
  let root;
  beforeEach(() => { root = makeTempPalace(); });
  afterEach(() => { rmSync(root, { recursive: true, force: true }); });

  test('200 + applied, passing apply/proposalId/palaceRoot/boardPath to the executor', async () => {
    let seen = null;
    const applyWeaveProposalImpl = async (args) => { seen = args; return { ok: true, commit: 'abc1234', entry: 'Foo', op: 'set-vector', proofPosted: true }; };
    const apply = { op: 'set-vector', entry: 'Foo', text: 'I will keep going.' };
    const res = await request(makeServer(root, { applyWeaveProposalImpl }))
      .post('/api/weave/apply').send({ apply, proposalId: 'p-9' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.commit).toBe('abc1234');
    expect(seen.apply).toEqual(apply);
    expect(seen.proposalId).toBe('p-9');
    expect(seen.palaceRoot).toBe(root);
    expect(seen.boardPath).toBe(resolve(root, '_ops/swarm/persistent/blackboard.jsonl'));
  });

  test('maps the executor status onto the HTTP status (404 entry-not-found)', async () => {
    const applyWeaveProposalImpl = async () => ({ ok: false, status: 404, error: 'entry not found: Ghost' });
    const res = await request(makeServer(root, { applyWeaveProposalImpl }))
      .post('/api/weave/apply').send({ apply: { op: 'set-vector', entry: 'Ghost', text: 'x.' } });
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/);
  });

  test('422 when the proposal carries no applicable change', async () => {
    const applyWeaveProposalImpl = async () => ({ ok: false, status: 422, error: 'this proposal carries no applicable change' });
    const res = await request(makeServer(root, { applyWeaveProposalImpl }))
      .post('/api/weave/apply').send({ apply: { proposed_change: 'prose only' } });
    expect(res.status).toBe(422);
  });

  test('400 on malformed JSON', async () => {
    const res = await request(makeServer(root))
      .post('/api/weave/apply').set('Content-Type', 'application/json').send('{ not json');
    expect(res.status).toBe(400);
  });
});
