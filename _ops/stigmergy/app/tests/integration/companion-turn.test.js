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
import { buildQueue } from '../../src/lib/queue-model.js';

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

function makeServer(root, { sleep = 300, editText = null, editOp = null, replyText = REPLY, action = null } = {}) {
  const argv = ['node', STUB, '--permission-mode', 'bypassPermissions', '--reply', replyText, '--sleep', String(sleep)];
  if (editText) argv.push('--edit-text', editText);
  if (editOp) argv.push('--edit-op', editOp);
  if (action) argv.push('--action', action);
  const companionLane = createCompanionLane({
    palaceRoot: root, // edits commit directly here (the quarantine was retired)
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

  test('an app_feedback turn posts a companion_reply as STIGMERGY (no entry needed)', async () => {
    // Stage 0: the global companion grounds in STIGMERGY itself on any deck. A
    // turn carries a context descriptor instead of a path; the reply posts under
    // the STIGMERGY identity with no entry_path, and the window correlates it by
    // turn id alone.
    const res = await request(server).post('/api/entry-agent/turn').send({
      context: { kind: 'app_feedback', deck: 'LOG' },
      message: 'the log filters are confusing',
    });
    expect(res.status).toBe(200);
    expect(res.body.fired).toBe(true);
    const turnId = res.body.turnId;

    await waitFor(() => !existsSync(companionLane.paths.pidFile), { timeout: 6000 });
    await waitFor(() => readFileSync(boardPath(root), 'utf8').includes('companion_reply'), { timeout: 4000 });

    const reply = readBoard(root).find((m) => m.payload && m.payload.kind === 'companion_reply' && m.payload.turn_id === turnId);
    expect(reply).toBeTruthy();
    expect(reply.from).toBe('STIGMERGY (Companion)');
    expect(reply.type).toBe('BROADCAST');
    expect(reply.payload.entry_path).toBeNull();
    expect(reply.payload.reply).toBe(REPLY);
  }, 20000);

  test('a trickster_request turn answers as the project behind the decision (read-only)', async () => {
    // Stage 2: on TRICKSTER the companion grounds in the project entry named by
    // the request (its `from`/project title resolves to that entry) and replies
    // AS it — read-only, no edit/flag. Here the project is the temp "Open Entry".
    const res = await request(server).post('/api/entry-agent/turn').send({
      context: {
        kind: 'trickster_request', request_id: 'req-1', project: 'Open Entry',
        ask: 'pick the next move', options: [{ id: 'a', label: 'ship it' }],
      },
      message: 'what are you asking me to decide?',
    });
    expect(res.status).toBe(200);
    expect(res.body.fired).toBe(true);
    const turnId = res.body.turnId;

    await waitFor(() => !existsSync(companionLane.paths.pidFile), { timeout: 6000 });
    await waitFor(() => readFileSync(boardPath(root), 'utf8').includes('companion_reply'), { timeout: 4000 });

    const lines = readBoard(root);
    const reply = lines.find((m) => m.payload && m.payload.kind === 'companion_reply' && m.payload.turn_id === turnId);
    expect(reply).toBeTruthy();
    expect(reply.from).toBe('Open Entry (Companion)'); // speaks as the project
    expect(reply.payload.entry_path).toBe('Open Entry.md'); // grounded in the resolved entry
    // read-only: no edit/flag landed for this turn
    expect(lines.some((m) => m.payload && m.payload.kind === 'companion_edit' && m.payload.turn_id === turnId)).toBe(false);
    expect(lines.some((m) => m.payload && m.payload.kind === 'stigmergy_todo' && m.payload.turn_id === turnId)).toBe(false);
  }, 20000);

  test('an app_feedback flag turn captures a to-do as a stigmergy_todo FLAG on the QUEUE', async () => {
    // Stage 1: the worker proposes {reply, action:{type:'flag', todo}}; the reap
    // posts the confirming reply AND a FLAG/stigmergy_todo on the FLAGS board,
    // which buildQueue renders. Both carry the turn_id so the window correlates.
    ({ server, companionLane } = makeServer(root, { action: 'flag' }));
    const res = await request(server).post('/api/entry-agent/turn').send({
      context: { kind: 'app_feedback', deck: 'LOG' },
      message: 'the log filters are confusing, capture that',
    });
    expect(res.status).toBe(200);
    const turnId = res.body.turnId;

    await waitFor(() => !existsSync(companionLane.paths.pidFile), { timeout: 6000 });
    await waitFor(() => readFileSync(boardPath(root), 'utf8').includes('stigmergy_todo'), { timeout: 4000 });

    const lines = readBoard(root);
    const todo = lines.find((m) => m.payload && m.payload.kind === 'stigmergy_todo' && m.payload.turn_id === turnId);
    expect(todo).toBeTruthy();
    expect(todo.type).toBe('FLAG');
    expect(todo.board).toBe('FLAGS');
    expect(todo.from).toBe('STIGMERGY (Companion)');
    expect(todo.payload.title).toBe('make the log filters clearer'); // stub default
    expect(todo.payload.area).toBe('log');
    // the confirming reply is also posted on the same turn
    const reply = lines.find((m) => m.payload && m.payload.kind === 'companion_reply' && m.payload.turn_id === turnId);
    expect(reply).toBeTruthy();

    // and the QUEUE model renders it as a stigmergy_todo item
    const items = buildQueue(lines);
    const todoItem = items.find((i) => i.kind === 'stigmergy_todo');
    expect(todoItem).toBeTruthy();
    expect(todoItem.ask).toBe('make the log filters clearer');
  }, 20000);

  test('an edit turn PROPOSES the op (companion_edit_proposed) and commits nothing', async () => {
    // show before editing: the worker proposes an append; the reap posts a
    // proposal the window renders for approval — nothing is written yet.
    ({ server, companionLane } = makeServer(root, { editText: 'A new closing line about li.' }));
    const res = await request(server).post('/api/entry-agent/turn').send({ path: 'Open Entry.md', message: 'add a line about li at the end' });
    expect(res.status).toBe(200);
    const turnId = res.body.turnId;

    await waitFor(() => !existsSync(companionLane.paths.pidFile), { timeout: 6000 });
    await waitFor(() => readFileSync(boardPath(root), 'utf8').includes('companion_edit_proposed'), { timeout: 4000 });

    const lines = readBoard(root);
    const proposal = lines.find((m) => m.payload && m.payload.kind === 'companion_edit_proposed' && m.payload.turn_id === turnId);
    expect(proposal).toBeTruthy();
    expect(proposal.type).toBe('BROADCAST');
    expect(proposal.from).toBe('Open Entry (Companion)');
    expect(proposal.payload.status).toBe('proposed');
    expect(proposal.payload.op).toEqual({ op: 'append', text: 'A new closing line about li.' }); // [approve] sends this back
    // nothing committed: entry on disk unchanged, no committed PROOF
    expect(readFileSync(join(root, 'Open Entry.md'), 'utf8')).not.toMatch(/A new closing line about li\./);
    expect(lines.some((m) => m.payload && m.payload.kind === 'companion_edit')).toBe(false);
  }, 20000);

  test('POST /apply commits the approved op to the LIVE entry and posts a committed PROOF', async () => {
    ({ server, companionLane } = makeServer(root));
    const turnId = 'companion-open-entry-approve-1';
    const a = await request(server).post('/api/entry-agent/apply').send({
      path: 'Open Entry.md', op: { op: 'append', text: 'A committed line about li.' }, turnId,
    });
    expect(a.status).toBe(200);
    expect(a.body.ok).toBe(true);
    expect(typeof a.body.commit).toBe('string');

    await waitFor(() => readFileSync(boardPath(root), 'utf8').includes('companion_edit'), { timeout: 4000 });
    const proof = readBoard(root).find((m) => m.payload && m.payload.kind === 'companion_edit' && m.payload.turn_id === turnId);
    expect(proof).toBeTruthy();
    expect(proof.type).toBe('PROOF');
    expect(proof.payload.status).toBe('committed');
    expect('branch' in proof.payload).toBe(false); // live commit — no quarantine branch
    // the LIVE entry changed on disk + at HEAD (frontmatter intact)
    expect(readFileSync(join(root, 'Open Entry.md'), 'utf8')).toMatch(/A committed line about li\./);
    const committed = git(root, ['show', 'HEAD:Open Entry.md']);
    expect(committed).toMatch(/A committed line about li\./);
    expect(committed).toMatch(/title: "Open Entry"/);
    expect(git(root, ['log', '-1', '--format=%s'])).toMatch(/^edit\(Open Entry\):/);
  }, 20000);

  test('POST /apply 400 on a stale op that no longer applies (find absent)', async () => {
    const a = await request(server).post('/api/entry-agent/apply').send({
      path: 'Open Entry.md', op: { op: 'rewrite', find: 'nowhere to be found', replace: 'x' },
    });
    expect(a.status).toBe(400);
    expect(a.body.ok).toBe(false);
  });

  test('a quiet edit (empty reply + edit) posts only a proposal, no reply', async () => {
    // adaptive narration: a clean proposal with an empty reply stays quiet — the
    // proposal card speaks, so no reply bubble is posted for that turn.
    ({ server, companionLane } = makeServer(root, { editText: 'A quiet closing line.', replyText: '' }));
    const res = await request(server).post('/api/entry-agent/turn').send({ path: 'Open Entry.md', message: 'tighten the ending' });
    expect(res.status).toBe(200);
    const turnId = res.body.turnId;

    await waitFor(() => !existsSync(companionLane.paths.pidFile), { timeout: 6000 });
    await waitFor(() => readFileSync(boardPath(root), 'utf8').includes('companion_edit_proposed'), { timeout: 4000 });

    const lines = readBoard(root);
    const proposal = lines.find((m) => m.payload && m.payload.kind === 'companion_edit_proposed' && m.payload.turn_id === turnId);
    const reply = lines.find((m) => m.payload && m.payload.kind === 'companion_reply' && m.payload.turn_id === turnId);
    expect(proposal).toBeTruthy();     // the proposal landed
    expect(reply).toBeFalsy();         // but the turn stayed quiet
  }, 20000);

  test('a set-vector turn PROPOSES the forward-vector change with its diff (never silent), commits nothing', async () => {
    ({ server, companionLane } = makeServer(root, {
      editText: 'I will keep being discussed and become more.', editOp: 'set-vector',
    }));
    const res = await request(server).post('/api/entry-agent/turn').send({ path: 'Open Entry.md', message: 'sharpen my forward vector' });
    const turnId = res.body.turnId;
    await waitFor(() => !existsSync(companionLane.paths.pidFile), { timeout: 6000 });
    await waitFor(() => readFileSync(boardPath(root), 'utf8').includes('companion_edit_proposed'), { timeout: 4000 });

    const proposal = readBoard(root).find((m) => m.payload && m.payload.kind === 'companion_edit_proposed' && m.payload.op.op === 'set-vector' && m.payload.turn_id === turnId);
    expect(proposal).toBeTruthy();
    expect(proposal.payload.vector_change.from).toBe('I want to be discussed.'); // the seed vector
    expect(proposal.payload.vector_change.to).toMatch(/become more/);
    // NOT committed yet — HEAD vector unchanged until approval
    expect(git(root, ['show', 'HEAD:Open Entry.md'])).toMatch(/forward_vector: "I want to be discussed\."/);
  }, 20000);

  test('a no-op edit (set-vector to the value it already has) reads as "already in place", not a failure', async () => {
    // The "approved" no-op bug: a redundant edit must not read as a failure. The
    // seed vector is "I want to be discussed."; set-vector to that exact value is
    // a no-op against the entry, so the companion should say it's already in
    // place — never "I couldn't apply that edit honestly".
    ({ server, companionLane } = makeServer(root, {
      editText: 'I want to be discussed.', editOp: 'set-vector', replyText: '',
    }));
    const res = await request(server).post('/api/entry-agent/turn').send({ path: 'Open Entry.md', message: 'set my vector to what it already says' });
    const turnId = res.body.turnId;
    await waitFor(() => !existsSync(companionLane.paths.pidFile), { timeout: 6000 });
    await waitFor(() => readBoard(root).some((m) => m.payload && m.payload.turn_id === turnId && m.payload.kind === 'companion_reply'), { timeout: 4000 });

    const reply = readBoard(root).find((m) => m.payload && m.payload.kind === 'companion_reply' && m.payload.turn_id === turnId);
    expect(reply).toBeTruthy();
    expect(reply.payload.reply).toMatch(/already in place/i);
    expect(reply.payload.reply).not.toMatch(/couldn't apply/i);
    // a no-op commits nothing: no edit PROOF for this turn
    expect(readBoard(root).some((m) => m.payload && m.payload.kind === 'companion_edit' && m.payload.turn_id === turnId)).toBe(false);
  }, 20000);

  test('POST /undo reverts a committed (approved) edit and posts a revert PROOF on the same turn', async () => {
    // apply commits live; undo reverts that commit as a new inverse commit.
    const turnId = 'companion-open-entry-undo-1';
    const a = await request(server).post('/api/entry-agent/apply').send({
      path: 'Open Entry.md', op: { op: 'append', text: 'A line to undo.' }, turnId,
    });
    expect(a.body.ok).toBe(true);
    const editCommit = a.body.commit;
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

  test('POST /trickster writes a CANON file in one gesture, branded trickster, undo-able', async () => {
    // Stand a canon file the careful path is forbidden.
    writeFileSync(join(root, 'SCHEMA.md'), '---\ntitle: SCHEMA\ntype: meta\n---\n# SCHEMA\n\nThe type system.\n');
    git(root, ['add', 'SCHEMA.md']);
    git(root, ['commit', '-q', '-m', 'ops: seed SCHEMA']);

    // careful /apply refuses canon (403 → 400 envelope); the trickster lands it
    const refused = await request(server).post('/api/entry-agent/apply').send({
      path: 'SCHEMA.md', op: { op: 'append', text: 'careful must not reach' },
    });
    expect(refused.body.ok).toBe(false);

    const turnId = 'companion-trick-schema-1';
    const t = await request(server).post('/api/entry-agent/trickster').send({
      path: 'SCHEMA.md', op: { op: 'append', text: 'A trickster scratch line.' }, turnId,
    });
    expect(t.status).toBe(200);
    expect(t.body.ok).toBe(true);
    expect(typeof t.body.commit).toBe('string');

    // committed to canon, branded in git
    expect(git(root, ['show', 'HEAD:SCHEMA.md'])).toMatch(/A trickster scratch line\./);
    expect(git(root, ['log', '-1', '--format=%B'])).toMatch(/Palace-Author: trickster/);

    // a committed PROOF on the board, branded + turn-scoped so the window renders it
    await waitFor(() => readBoard(root).some((m) => m.payload && m.payload.kind === 'companion_edit' && m.payload.turn_id === turnId), { timeout: 4000 });
    const proof = readBoard(root).find((m) => m.payload && m.payload.kind === 'companion_edit' && m.payload.turn_id === turnId);
    expect(proof.type).toBe('PROOF');
    expect(proof.payload.author).toBe('trickster');

    // untrick last: the same /undo reverts it cleanly
    const u = await request(server).post('/api/entry-agent/undo').send({ path: 'SCHEMA.md', commit: t.body.commit, turnId });
    expect(u.body.ok).toBe(true);
    expect(git(root, ['show', 'HEAD:SCHEMA.md'])).not.toMatch(/A trickster scratch line\./);
  }, 20000);

  test('POST /trickster STILL refuses a path-safety violation (400, security is not care)', async () => {
    const escape = await request(server).post('/api/entry-agent/trickster').send({
      path: '../escape.md', op: { op: 'append', text: 'x' },
    });
    expect(escape.status).toBe(400);
    expect(escape.body.ok).toBe(false);
  });

  test('a regen_visual action dispatches the distilled art direction to the regen lane', async () => {
    // The hero/avatar door: the worker emits {reply, action:{type:'regen_visual',…}};
    // the reap posts the reply (echoing what's rendering) AND hands the action to
    // the injected regen lane on the SAME turnId. Here a spy stands in for the
    // render lane so the test never spawns a real render.
    const calls = [];
    const fakeRegen = { regen: (args) => { calls.push(args); return { ok: true, fired: true, turnId: args.turnId }; } };
    const lane = createCompanionLane({
      palaceRoot: root,
      buildArgv: () => ['node', STUB, '--permission-mode', 'bypassPermissions',
        '--reply', 'Rendering a woodcut hero — bold strokes.', '--action', 'regen',
        '--regen-target', 'hero', '--regen-hero', 'a bold woodcut banner', '--sleep', '300'],
      dryReap: false,
      regenLane: fakeRegen,
    });
    const t = lane.turn({ path: 'Open Entry.md', message: 'regenerate the hero as a woodcut' });
    expect(t.fired).toBe(true);
    const turnId = t.turnId;

    await waitFor(() => !existsSync(lane.paths.pidFile), { timeout: 6000 });
    await waitFor(() => calls.length > 0, { timeout: 4000 });

    expect(calls).toHaveLength(1);
    expect(calls[0].path).toBe('Open Entry.md');
    expect(calls[0].target).toBe('hero');
    expect(calls[0].heroPrompt).toBe('a bold woodcut banner');
    expect(calls[0].turnId).toBe(turnId);          // same turn → window correlates started/done

    // the worker's reply still posts — it echoes what is being rendered
    await waitFor(() => readFileSync(boardPath(root), 'utf8').includes('Rendering a woodcut hero'), { timeout: 4000 });
    const reply = readBoard(root).find((m) => m.payload?.kind === 'companion_reply' && m.payload.turn_id === turnId);
    expect(reply).toBeTruthy();
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
