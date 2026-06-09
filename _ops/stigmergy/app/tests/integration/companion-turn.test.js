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
import { execFileSync } from 'node:child_process';
import request from 'supertest';
import { blackboardMiddleware } from '../../server/middleware.js';
import { createCompanionLane } from '../../server/companion-lane.js';

const STUB = fileURLToPath(new URL('../fixtures/stub-companion-worker.mjs', import.meta.url));
const REPLY = 'the flesh is the medium of perception.';

function git(cwd, args) { return execFileSync('git', args, { cwd, encoding: 'utf8' }); }

function makeTempPalace() {
  const root = mkdtempSync(resolve(tmpdir(), 'stig-companion-'));
  git(root, ['init', '-q', '-b', 'main']);
  git(root, ['config', 'user.email', 'test@example.com']);
  git(root, ['config', 'user.name', 'Test User']);
  git(root, ['config', 'commit.gpgsign', 'false']);
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
  git(root, ['add', 'Open Entry.md', 'Neighbor.md']);
  git(root, ['commit', '-q', '-m', 'deposit: seed entries']);
  return root;
}

function makeServer(root, { sleep = 300, editText = null, editOp = null, replyText = REPLY } = {}) {
  const argv = ['node', STUB, '--permission-mode', 'bypassPermissions', '--reply', replyText, '--sleep', String(sleep)];
  if (editText) argv.push('--edit-text', editText);
  if (editOp) argv.push('--edit-op', editOp);
  const companionLane = createCompanionLane({
    palaceRoot: root,
    editsRoot: root, // the temp repo IS the (quarantine stand-in) edit target here
    buildArgv: () => argv,
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
  const readBoard = (r) => readFileSync(boardPath(r), 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l));

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

  test('an edit turn applies the op through the enforced path and posts a PROOF', async () => {
    // a lane whose stub also proposes an append edit
    ({ server, companionLane } = makeServer(root, { editText: 'A new closing line about li.' }));
    const res = await request(server).post('/api/entry-agent/turn').send({ path: 'Open Entry.md', message: 'add a line about li at the end' });
    expect(res.status).toBe(200);
    const turnId = res.body.turnId;

    await waitFor(() => !existsSync(companionLane.paths.pidFile), { timeout: 6000 });
    await waitFor(() => readFileSync(boardPath(root), 'utf8').includes('companion_edit'), { timeout: 4000 });

    const lines = readFileSync(boardPath(root), 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l));
    const proof = lines.find((m) => m.payload && m.payload.kind === 'companion_edit');
    expect(proof).toBeTruthy();
    expect(proof.type).toBe('PROOF');
    expect(proof.from).toBe('Open Entry (Companion)');
    expect(proof.payload.op).toBe('append');
    expect(proof.payload.turn_id).toBe(turnId);
    expect(typeof proof.payload.commit).toBe('string');

    // the commit is real: HEAD blob carries the appended line, frontmatter intact
    const committed = git(root, ['show', 'HEAD:Open Entry.md']);
    expect(committed).toMatch(/A new closing line about li\./);
    expect(committed).toMatch(/title: "Open Entry"/);
    const subject = git(root, ['log', '-1', '--format=%s']);
    expect(subject).toMatch(/^edit\(Open Entry\):/);
  }, 20000);

  test('a quiet edit (empty reply + edit) posts only a PROOF, no companion_reply', async () => {
    // adaptive narration: a clean edit with an empty reply stays quiet — the
    // edit marker speaks, so no reply bubble is posted for that turn.
    ({ server, companionLane } = makeServer(root, { editText: 'A quiet closing line.', replyText: '' }));
    const res = await request(server).post('/api/entry-agent/turn').send({ path: 'Open Entry.md', message: 'tighten the ending' });
    expect(res.status).toBe(200);
    const turnId = res.body.turnId;

    await waitFor(() => !existsSync(companionLane.paths.pidFile), { timeout: 6000 });
    await waitFor(() => readFileSync(boardPath(root), 'utf8').includes('companion_edit'), { timeout: 4000 });

    const lines = readFileSync(boardPath(root), 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l));
    const proof = lines.find((m) => m.payload && m.payload.kind === 'companion_edit' && m.payload.turn_id === turnId);
    const reply = lines.find((m) => m.payload && m.payload.kind === 'companion_reply' && m.payload.turn_id === turnId);
    expect(proof).toBeTruthy();        // the edit landed
    expect(reply).toBeFalsy();         // but the turn stayed quiet
  }, 20000);

  test('a set-vector turn flags the forward-vector change on the board (never silent)', async () => {
    ({ server, companionLane } = makeServer(root, {
      editText: 'I will keep being discussed and become more.', editOp: 'set-vector',
    }));
    const res = await request(server).post('/api/entry-agent/turn').send({ path: 'Open Entry.md', message: 'sharpen my forward vector' });
    const turnId = res.body.turnId;
    await waitFor(() => !existsSync(companionLane.paths.pidFile), { timeout: 6000 });
    await waitFor(() => readFileSync(boardPath(root), 'utf8').includes('companion_edit'), { timeout: 4000 });

    const proof = readBoard(root).find((m) => m.payload && m.payload.kind === 'companion_edit' && m.payload.op === 'set-vector' && m.payload.turn_id === turnId);
    expect(proof).toBeTruthy();
    expect(proof.payload.vector_change).toBeTruthy();
    expect(proof.payload.vector_change.from).toBe('I want to be discussed.'); // the seed vector
    expect(proof.payload.vector_change.to).toMatch(/become more/);
    // committed: the frontmatter vector changed at HEAD, body intact
    const head = git(root, ['show', 'HEAD:Open Entry.md']);
    expect(head).toMatch(/forward_vector: "I will keep being discussed and become more\."/);
    expect(head).toMatch(/the seat of perception\./); // body preserved
  }, 20000);

  test('POST /undo reverts a committed edit and posts a revert PROOF on the same turn', async () => {
    ({ server, companionLane } = makeServer(root, { editText: 'A line to undo.' }));
    const t = await request(server).post('/api/entry-agent/turn').send({ path: 'Open Entry.md', message: 'add a line' });
    const turnId = t.body.turnId;
    await waitFor(() => !existsSync(companionLane.paths.pidFile), { timeout: 6000 });
    await waitFor(() => readFileSync(boardPath(root), 'utf8').includes('companion_edit'), { timeout: 4000 });

    const editProof = readBoard(root).find((m) => m.payload && m.payload.kind === 'companion_edit' && m.payload.op === 'append');
    const editCommit = editProof.payload.commit;
    expect(git(root, ['show', 'HEAD:Open Entry.md'])).toMatch(/A line to undo\./);

    const u = await request(server).post('/api/entry-agent/undo').send({ path: 'Open Entry.md', commit: editCommit, turnId });
    expect(u.status).toBe(200);
    expect(u.body.ok).toBe(true);
    expect(typeof u.body.revertHash).toBe('string');

    await waitFor(() => readBoard(root).some((m) => m.payload && m.payload.op === 'revert'), { timeout: 4000 });
    const revert = readBoard(root).find((m) => m.payload && m.payload.op === 'revert');
    expect(revert.type).toBe('PROOF');
    expect(revert.payload.reverts).toBe(editCommit);
    expect(revert.payload.status).toBe('reverted');
    expect(revert.payload.turn_id).toBe(turnId); // same turn → window accepts it
    // the edit is undone at HEAD, as a new commit (the original still in history)
    expect(git(root, ['show', 'HEAD:Open Entry.md'])).not.toMatch(/A line to undo\./);
  }, 20000);

  test('POST /undo 400 on a missing or malformed commit', async () => {
    const noCommit = await request(server).post('/api/entry-agent/undo').send({ path: 'Open Entry.md' });
    expect(noCommit.status).toBe(400);
    const bad = await request(server).post('/api/entry-agent/undo').send({ path: 'Open Entry.md', commit: 'not-a-hash!' });
    expect(bad.status).toBe(400);
    expect(bad.body.ok).toBe(false);
  });

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
