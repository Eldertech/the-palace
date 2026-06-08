// Integration test for POST /api/entry-agent/turn (M1b: discuss-only).
//
// THE proof: firing a turn spawns the (stub) Companion worker, and on its exit
// the lane reap posts the worker's reply to the board as a companion_reply
// BROADCAST from "<Entry> (Companion)". The window reads that back over SSE.
// Uses the stub worker fixture so the test path never spawns a real `claude -p`.

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import http from 'node:http';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import request from 'supertest';
import { blackboardMiddleware } from '../../server/middleware.js';
import { createCompanionLane } from '../../server/companion-lane.js';

const STUB = fileURLToPath(new URL('../fixtures/stub-companion-worker.mjs', import.meta.url));
const REPLY = 'the flesh is the medium of perception.';

function makeTempPalace() {
  const root = mkdtempSync(resolve(tmpdir(), 'stig-companion-'));
  mkdirSync(join(root, '_ops/swarm/persistent'), { recursive: true });
  writeFileSync(join(root, '_ops/swarm/persistent/blackboard.jsonl'), '', 'utf8');
  writeFileSync(
    join(root, 'Open Entry.md'),
    '---\ntitle: "Open Entry"\ntype: concept\nstage: growing\nforward_vector: "I want to be discussed."\n'
    + 'links:\n  - target: "[[Neighbor]]"\n    type: deepens\n---\n# Body\n\n## Core\nthe seat of perception.\n',
  );
  writeFileSync(
    join(root, 'Neighbor.md'),
    '---\ntitle: Neighbor\ntype: concept\nstage: mature\nforward_vector: "I want to be near."\n---\n# N\n',
  );
  return root;
}

function makeServer(root, { sleep = 300 } = {}) {
  const companionLane = createCompanionLane({
    palaceRoot: root,
    buildArgv: () => ['node', STUB, '--permission-mode', 'bypassPermissions', '--reply', REPLY, '--sleep', String(sleep)],
    dryReap: false,
  });
  const plugin = blackboardMiddleware(root, { companionLane });
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
  return { server, companionLane };
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

describe('POST /api/entry-agent/turn', () => {
  let root, server, companionLane;
  beforeEach(() => { root = makeTempPalace(); ({ server, companionLane } = makeServer(root)); });
  afterEach(async () => {
    try { await waitFor(() => !existsSync(companionLane.paths.pidFile), { timeout: 4000 }); } catch (_) { /* ignore */ }
    rmSync(root, { recursive: true, force: true });
  });

  const boardPath = (r) => resolve(r, '_ops/swarm/persistent/blackboard.jsonl');

  test('fires a turn and the reap posts a companion_reply to the board (THE proof)', async () => {
    const res = await request(server).post('/api/entry-agent/turn').send({ path: 'Open Entry.md', message: 'what is the body schema?' });
    expect(res.status).toBe(200);
    expect(res.body.fired).toBe(true);
    expect(typeof res.body.turnId).toBe('string');
    const turnId = res.body.turnId;

    // Wait for the worker to exit and the reap to post.
    await waitFor(() => !existsSync(companionLane.paths.pidFile), { timeout: 6000 });
    await waitFor(() => readFileSync(boardPath(root), 'utf8').includes('companion_reply'), { timeout: 4000 });

    const lines = readFileSync(boardPath(root), 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l));
    const reply = lines.find((m) => m.payload && m.payload.kind === 'companion_reply');
    expect(reply).toBeTruthy();
    expect(reply.from).toBe('Open Entry (Companion)');
    expect(reply.type).toBe('BROADCAST');
    expect(reply.board).toBe('GENERAL');
    expect(reply.payload.entry_path).toBe('Open Entry.md');
    expect(reply.payload.turn_id).toBe(turnId);
    expect(reply.payload.reply).toBe(REPLY);
  }, 20000);

  test('400 when the message is missing', async () => {
    const res = await request(server).post('/api/entry-agent/turn').send({ path: 'Open Entry.md' });
    expect(res.status).toBe(400);
    expect(res.body.fired).toBe(false);
  });

  test('409 while a turn is already running (single global worker per lane)', async () => {
    const first = await request(server).post('/api/entry-agent/turn').send({ path: 'Open Entry.md', message: 'one' });
    expect(first.body.fired).toBe(true);
    await waitFor(() => companionLane.status().running === true, { timeout: 3000 });
    const second = await request(server).post('/api/entry-agent/turn').send({ path: 'Open Entry.md', message: 'two' });
    expect(second.status).toBe(409);
    expect(second.body.busy).toBe(true);
  }, 20000);
});
