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

describe('POST /api/weave/emit-unsung', () => {
  let root;
  beforeEach(() => { root = makeTempPalace(); });
  afterEach(() => { rmSync(root, { recursive: true, force: true }); });

  test('defaults to a DRY RUN (dryRun:true, limit:8) and passes palaceRoot/boardPath', async () => {
    let seen = null;
    const runUnsungEmissionImpl = async (args) => { seen = args; return { ok: true, dryRun: true, found: 3, eligible: 2, planned: 2, proposals: [] }; };
    // A bare POST (empty body) must run the audit, not error.
    const res = await request(makeServer(root, { runUnsungEmissionImpl }))
      .post('/api/weave/emit-unsung').send();
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(seen.dryRun).toBe(true);   // safe by default — no write without intent
    expect(seen.limit).toBe(8);
    expect(seen.palaceRoot).toBe(root);
    expect(seen.boardPath).toBe(resolve(root, '_ops/swarm/persistent/blackboard.jsonl'));
  });

  test('dryRun:false + limit are passed straight through to the runner', async () => {
    let seen = null;
    const runUnsungEmissionImpl = async (args) => { seen = args; return { ok: true, dryRun: false, posted: 3 }; };
    const res = await request(makeServer(root, { runUnsungEmissionImpl }))
      .post('/api/weave/emit-unsung').send({ dryRun: false, limit: 3 });
    expect(res.status).toBe(200);
    expect(res.body.posted).toBe(3);
    expect(seen.dryRun).toBe(false);
    expect(seen.limit).toBe(3);
  });

  test('maps the runner status onto the HTTP status (500 no-root)', async () => {
    const runUnsungEmissionImpl = async () => ({ ok: false, status: 500, error: 'no palace root configured' });
    const res = await request(makeServer(root, { runUnsungEmissionImpl }))
      .post('/api/weave/emit-unsung').send({ dryRun: true });
    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/no palace root/);
  });

  test('400 on malformed JSON', async () => {
    const res = await request(makeServer(root))
      .post('/api/weave/emit-unsung').set('Content-Type', 'application/json').send('{ not json');
    expect(res.status).toBe(400);
  });
});

describe('POST /api/weave/emit-hub', () => {
  let root;
  beforeEach(() => { root = makeTempPalace(); });
  afterEach(() => { rmSync(root, { recursive: true, force: true }); });

  test('defaults to a DRY RUN (dryRun:true, limit:8, threshold:5) and passes palaceRoot/boardPath', async () => {
    let seen = null;
    const runHubEmissionImpl = async (args) => { seen = args; return { ok: true, dryRun: true, found: 2, eligible: 2, planned: 2, proposals: [] }; };
    const res = await request(makeServer(root, { runHubEmissionImpl }))
      .post('/api/weave/emit-hub').send();
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(seen.dryRun).toBe(true);
    expect(seen.limit).toBe(8);
    expect(seen.threshold).toBe(5);
    expect(seen.palaceRoot).toBe(root);
    expect(seen.boardPath).toBe(resolve(root, '_ops/swarm/persistent/blackboard.jsonl'));
  });

  test('dryRun:false + limit + threshold pass straight through', async () => {
    let seen = null;
    const runHubEmissionImpl = async (args) => { seen = args; return { ok: true, dryRun: false, posted: 2 }; };
    const res = await request(makeServer(root, { runHubEmissionImpl }))
      .post('/api/weave/emit-hub').send({ dryRun: false, limit: 2, threshold: 6 });
    expect(res.status).toBe(200);
    expect(res.body.posted).toBe(2);
    expect(seen.dryRun).toBe(false);
    expect(seen.limit).toBe(2);
    expect(seen.threshold).toBe(6);
  });

  test('maps the runner status onto the HTTP status (500 no-root)', async () => {
    const runHubEmissionImpl = async () => ({ ok: false, status: 500, error: 'no palace root configured' });
    const res = await request(makeServer(root, { runHubEmissionImpl }))
      .post('/api/weave/emit-hub').send({ dryRun: true });
    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/no palace root/);
  });

  test('400 on malformed JSON', async () => {
    const res = await request(makeServer(root))
      .post('/api/weave/emit-hub').set('Content-Type', 'application/json').send('{ not json');
    expect(res.status).toBe(400);
  });
});

describe('POST /api/weave/emit-vector-tuning', () => {
  let root;
  beforeEach(() => { root = makeTempPalace(); });
  afterEach(() => { rmSync(root, { recursive: true, force: true }); });

  test('defaults to a DRY RUN (dryRun:true, limit:3) and passes palaceRoot/boardPath', async () => {
    let seen = null;
    const runVectorTuningEmissionImpl = async (args) => { seen = args; return { ok: true, dryRun: true, found: 2, eligible: 2, planned: 2, candidates: [] }; };
    const res = await request(makeServer(root, { runVectorTuningEmissionImpl }))
      .post('/api/weave/emit-vector-tuning').send();
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(seen.dryRun).toBe(true);   // safe by default — the dry run is a cheap scan
    expect(seen.limit).toBe(3);       // generation is expensive; low default cap
    expect(seen.palaceRoot).toBe(root);
    expect(seen.boardPath).toBe(resolve(root, '_ops/swarm/persistent/blackboard.jsonl'));
  });

  test('dryRun:false + limit + model pass straight through (generate + post)', async () => {
    let seen = null;
    const runVectorTuningEmissionImpl = async (args) => { seen = args; return { ok: true, dryRun: false, posted: 2 }; };
    const res = await request(makeServer(root, { runVectorTuningEmissionImpl }))
      .post('/api/weave/emit-vector-tuning').send({ dryRun: false, limit: 2, model: 'claude-opus-4-8' });
    expect(res.status).toBe(200);
    expect(res.body.posted).toBe(2);
    expect(seen.dryRun).toBe(false);
    expect(seen.limit).toBe(2);
    expect(seen.model).toBe('claude-opus-4-8');
  });

  test('maps the runner status onto the HTTP status (500 no-root)', async () => {
    const runVectorTuningEmissionImpl = async () => ({ ok: false, status: 500, error: 'no palace root configured' });
    const res = await request(makeServer(root, { runVectorTuningEmissionImpl }))
      .post('/api/weave/emit-vector-tuning').send({ dryRun: true });
    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/no palace root/);
  });

  test('400 on malformed JSON', async () => {
    const res = await request(makeServer(root))
      .post('/api/weave/emit-vector-tuning').set('Content-Type', 'application/json').send('{ not json');
    expect(res.status).toBe(400);
  });
});

describe('POST /api/weave/emit-stage', () => {
  let root;
  beforeEach(() => { root = makeTempPalace(); });
  afterEach(() => { rmSync(root, { recursive: true, force: true }); });

  test('defaults to a DRY RUN (dryRun:true, limit:8) and passes palaceRoot/boardPath', async () => {
    let seen = null;
    const runStageEmissionImpl = async (args) => { seen = args; return { ok: true, dryRun: true, found: 1, eligible: 1, planned: 1, proposals: [] }; };
    const res = await request(makeServer(root, { runStageEmissionImpl }))
      .post('/api/weave/emit-stage').send();
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(seen.dryRun).toBe(true);
    expect(seen.limit).toBe(8);
    expect(seen.palaceRoot).toBe(root);
    expect(seen.boardPath).toBe(resolve(root, '_ops/swarm/persistent/blackboard.jsonl'));
  });

  test('dryRun:false + limit pass straight through', async () => {
    let seen = null;
    const runStageEmissionImpl = async (args) => { seen = args; return { ok: true, dryRun: false, posted: 1 }; };
    const res = await request(makeServer(root, { runStageEmissionImpl }))
      .post('/api/weave/emit-stage').send({ dryRun: false, limit: 2 });
    expect(res.status).toBe(200);
    expect(res.body.posted).toBe(1);
    expect(seen.dryRun).toBe(false);
    expect(seen.limit).toBe(2);
  });

  test('maps the runner status onto the HTTP status (500 no-root)', async () => {
    const runStageEmissionImpl = async () => ({ ok: false, status: 500, error: 'no palace root configured' });
    const res = await request(makeServer(root, { runStageEmissionImpl }))
      .post('/api/weave/emit-stage').send({ dryRun: true });
    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/no palace root/);
  });

  test('400 on malformed JSON', async () => {
    const res = await request(makeServer(root))
      .post('/api/weave/emit-stage').set('Content-Type', 'application/json').send('{ not json');
    expect(res.status).toBe(400);
  });
});
