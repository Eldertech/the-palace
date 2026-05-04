/**
 * Integration tests for SSE endpoints in blackboardMiddleware.
 *
 * Approach:
 *   - Uses the same http.createServer harness as post-middleware.test.js
 *   - Per-test temp palaceRoot via mkdtempSync
 *   - Reads SSE stream via Node's native http.request, consuming 'data' events
 *   - Promise.race against a timeout to avoid hanging
 *
 * Heartbeat interval: set STIGMERGY_SSE_HEARTBEAT_MS=100 before tests.
 * Each test creates its own server on an ephemeral port (server.listen(0)).
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import http from 'node:http';
import { resolve } from 'node:path';
import { mkdtempSync, rmSync, writeFileSync, appendFileSync, mkdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { blackboardMiddleware } from '../../server/middleware.js';

// Force short heartbeat for all tests in this file.
process.env.STIGMERGY_SSE_HEARTBEAT_MS = '100';

// ── Harness ───────────────────────────────────────────────────────────────────

function makeServer(palaceRoot) {
  const plugin = blackboardMiddleware(palaceRoot);
  const handlers = [];
  const fakeServer = { middlewares: { use: (fn) => handlers.push(fn) } };
  plugin.configureServer(fakeServer);
  const server = http.createServer((req, res) => {
    let i = 0;
    const next = () => {
      if (i >= handlers.length) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/plain');
        res.end('not found');
        return;
      }
      handlers[i++](req, res, next);
    };
    next();
  });
  return server;
}

function listenAsync(server) {
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      resolve(server.address().port);
    });
  });
}

function closeServerAsync(server) {
  return new Promise((resolve) => {
    server.close(() => resolve());
  });
}

// ── SSE client helpers ────────────────────────────────────────────────────────

/**
 * Open an SSE stream on `url`, collect frames until `until(frames)` is true
 * or `timeoutMs` elapses. Returns { frames, timedOut }.
 *
 * `until` is called after each frame is parsed. Pass null to just timeout.
 *
 * Each frame is an object: { id, event, data, comment }.
 */
function collectSseFrames({ port, path, headers = {}, until = null, timeoutMs = 3000 }) {
  return new Promise((resolve) => {
    const frames = [];
    let timedOut = false;
    let req = null;
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      if (req) { try { req.destroy(); } catch (_) {} }
      resolve({ frames, timedOut });
    };

    const timer = setTimeout(() => {
      timedOut = true;
      finish();
    }, timeoutMs);

    req = http.request({ host: '127.0.0.1', port, path, headers }, (res) => {
      let buf = '';
      res.on('data', (chunk) => {
        buf += chunk.toString('utf8');
        // Parse complete SSE frames (terminated by \n\n)
        let boundary;
        while ((boundary = buf.indexOf('\n\n')) !== -1) {
          const block = buf.slice(0, boundary);
          buf = buf.slice(boundary + 2);
          const frame = parseSseBlock(block);
          if (frame) {
            frames.push(frame);
            if (until && until(frames)) {
              clearTimeout(timer);
              finish();
              return;
            }
          }
        }
      });
      res.on('end', finish);
      res.on('error', finish);
    });

    req.on('error', finish);
    req.end();
  });
}

/**
 * Parse one SSE block (newline-separated field: value lines).
 * Returns null for comment-only or empty blocks (comments still reported separately).
 */
function parseSseBlock(block) {
  const lines = block.split('\n');
  const frame = { id: null, event: null, data: null, comment: null };
  let hasData = false;
  let hasComment = false;

  for (const line of lines) {
    if (line.startsWith(':')) {
      frame.comment = line.slice(1).trim();
      hasComment = true;
    } else if (line.startsWith('id:')) {
      frame.id = line.slice(3).trim();
    } else if (line.startsWith('event:')) {
      frame.event = line.slice(6).trim();
    } else if (line.startsWith('data:')) {
      frame.data = line.slice(5).trim();
      hasData = true;
    }
  }

  if (!hasData && !hasComment) return null;
  return frame;
}

/**
 * Make a single HEAD/GET request and return { status, headers }.
 */
function probeHeaders({ port, path, headers = {} }) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { host: '127.0.0.1', port, path, method: 'GET', headers },
      (res) => {
        res.resume(); // discard body
        resolve({ status: res.statusCode, headers: res.headers });
        req.destroy();
      }
    );
    req.on('error', reject);
    req.end();
  });
}

// ── Temp palace root ──────────────────────────────────────────────────────────

function makeTempPalace() {
  const root = mkdtempSync(resolve(tmpdir(), 'stigmergy-sse-test-'));
  mkdirSync(resolve(root, '_ops/swarm/persistent'), { recursive: true });
  mkdirSync(resolve(root, '_ops/swarm/sessions'), { recursive: true });
  writeFileSync(resolve(root, '_ops/swarm/persistent/blackboard.jsonl'), '', 'utf8');
  return root;
}

function seedMessage(filePath, msg) {
  appendFileSync(filePath, JSON.stringify(msg) + '\n', 'utf8');
}

function makeMsg(id, ts, extra = {}) {
  return {
    schema_version: '1.0',
    id,
    ts,
    session_id: 'test-session',
    from: 'TEST',
    to: '*',
    type: 'BROADCAST',
    board: 'GENERAL',
    health: { context_pct: 0.1, stop_reason: 'end_turn', iteration: 1, tokens_this_call: 10, model: 'claude-sonnet-4-6', score: 'green' },
    payload: { content: 'test' },
    ...extra,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('GET /api/persistent/stream', () => {
  let tempRoot;
  let server;
  let port;

  beforeEach(async () => {
    tempRoot = makeTempPalace();
    server = makeServer(tempRoot);
    port = await listenAsync(server);
  });

  afterEach(async () => {
    await closeServerAsync(server);
    rmSync(tempRoot, { recursive: true, force: true });
  });

  test('response headers: content-type is text/event-stream, cache-control has no-cache', async () => {
    const { status, headers } = await probeHeaders({ port, path: '/api/persistent/stream' });
    expect(status).toBe(200);
    expect(headers['content-type']).toMatch(/text\/event-stream/);
    expect(headers['cache-control']).toMatch(/no-cache/);
  });

  test('initial connect sends a connected comment frame', async () => {
    const { frames } = await collectSseFrames({
      port,
      path: '/api/persistent/stream',
      until: (f) => f.some((fr) => fr.comment === 'connected'),
      timeoutMs: 2000,
    });
    expect(frames.some((f) => f.comment === 'connected')).toBe(true);
  });

  test('after connect, appending a new line causes an SSE frame to arrive', async () => {
    const bbPath = resolve(tempRoot, '_ops/swarm/persistent/blackboard.jsonl');
    const newMsg = makeMsg('msg-live-001', '2026-05-04T10:00:00Z');

    // Collect until we see our message frame (or timeout 3s).
    let done = false;
    const collectPromise = collectSseFrames({
      port,
      path: '/api/persistent/stream',
      until: (f) => f.some((fr) => fr.data && fr.data.includes('msg-live-001')),
      timeoutMs: 3000,
    });

    // Small delay to let the SSE connection establish before writing.
    await new Promise((r) => setTimeout(r, 80));
    seedMessage(bbPath, newMsg);

    const { frames, timedOut } = await collectPromise;
    expect(timedOut).toBe(false);
    const dataFrame = frames.find((f) => f.data && f.data.includes('msg-live-001'));
    expect(dataFrame).toBeDefined();
    expect(dataFrame.event).toBe('message');
    expect(dataFrame.id).toBe('msg-live-001');
    const parsed = JSON.parse(dataFrame.data);
    expect(parsed.id).toBe('msg-live-001');
  });

  test('appending multiple lines: all arrive in order', async () => {
    const bbPath = resolve(tempRoot, '_ops/swarm/persistent/blackboard.jsonl');
    const msgs = [
      makeMsg('multi-001', '2026-05-04T10:01:00Z'),
      makeMsg('multi-002', '2026-05-04T10:02:00Z'),
      makeMsg('multi-003', '2026-05-04T10:03:00Z'),
    ];

    const collectPromise = collectSseFrames({
      port,
      path: '/api/persistent/stream',
      until: (f) => f.filter((fr) => fr.data && fr.id?.startsWith('multi-')).length >= 3,
      timeoutMs: 4000,
    });

    await new Promise((r) => setTimeout(r, 80));
    for (const m of msgs) {
      seedMessage(bbPath, m);
      await new Promise((r) => setTimeout(r, 30));
    }

    const { frames, timedOut } = await collectPromise;
    expect(timedOut).toBe(false);
    const dataFrames = frames.filter((f) => f.data && f.id?.startsWith('multi-'));
    expect(dataFrames.length).toBe(3);
    expect(dataFrames.map((f) => f.id)).toEqual(['multi-001', 'multi-002', 'multi-003']);
  });

  test('reconnect with Last-Event-ID: only messages after that id are replayed', async () => {
    const bbPath = resolve(tempRoot, '_ops/swarm/persistent/blackboard.jsonl');
    // Pre-seed 5 messages.
    const msgs = [
      makeMsg('rec-001', '2026-05-04T10:01:00Z'),
      makeMsg('rec-002', '2026-05-04T10:02:00Z'),
      makeMsg('rec-003', '2026-05-04T10:03:00Z'),
      makeMsg('rec-004', '2026-05-04T10:04:00Z'),
      makeMsg('rec-005', '2026-05-04T10:05:00Z'),
    ];
    for (const m of msgs) seedMessage(bbPath, m);

    // Reconnect with Last-Event-ID: rec-003 — should only get rec-004, rec-005.
    const { frames, timedOut } = await collectSseFrames({
      port,
      path: '/api/persistent/stream',
      headers: { 'Last-Event-ID': 'rec-003' },
      until: (f) => {
        const dataFrames = f.filter((fr) => fr.data && fr.id?.startsWith('rec-'));
        return dataFrames.length >= 2;
      },
      timeoutMs: 2500,
    });

    expect(timedOut).toBe(false);
    const dataFrames = frames.filter((f) => f.data && f.id?.startsWith('rec-'));
    expect(dataFrames.map((f) => f.id)).toEqual(['rec-004', 'rec-005']);
  });

  test('old client (no Last-Event-ID): no replay of existing messages, only future', async () => {
    const bbPath = resolve(tempRoot, '_ops/swarm/persistent/blackboard.jsonl');
    // Pre-seed 3 messages.
    seedMessage(bbPath, makeMsg('old-001', '2026-05-04T09:00:00Z'));
    seedMessage(bbPath, makeMsg('old-002', '2026-05-04T09:01:00Z'));
    seedMessage(bbPath, makeMsg('old-003', '2026-05-04T09:02:00Z'));

    const newMsg = makeMsg('new-001', '2026-05-04T10:00:00Z');

    const collectPromise = collectSseFrames({
      port,
      path: '/api/persistent/stream',
      until: (f) => f.some((fr) => fr.data && fr.id === 'new-001'),
      timeoutMs: 3000,
    });

    await new Promise((r) => setTimeout(r, 80));
    seedMessage(bbPath, newMsg);

    const { frames, timedOut } = await collectPromise;
    expect(timedOut).toBe(false);

    // None of the old-* messages should appear.
    const oldFrames = frames.filter((f) => f.data && f.id?.startsWith('old-'));
    expect(oldFrames).toHaveLength(0);

    // The new message should appear.
    const newFrames = frames.filter((f) => f.data && f.id === 'new-001');
    expect(newFrames).toHaveLength(1);
  });

  test('heartbeat comment frame arrives within ~500ms (SSE_HEARTBEAT_MS=100)', async () => {
    const { frames, timedOut } = await collectSseFrames({
      port,
      path: '/api/persistent/stream',
      until: (f) => f.some((fr) => fr.comment === 'heartbeat'),
      timeoutMs: 1500,
    });
    expect(timedOut).toBe(false);
    expect(frames.some((f) => f.comment === 'heartbeat')).toBe(true);
  });
});

describe('GET /api/sessions/:id/stream', () => {
  let tempRoot;
  let server;
  let port;

  beforeEach(async () => {
    tempRoot = makeTempPalace();
    server = makeServer(tempRoot);
    port = await listenAsync(server);
  });

  afterEach(async () => {
    await closeServerAsync(server);
    rmSync(tempRoot, { recursive: true, force: true });
  });

  test('missing session → 404 (chosen behavior: 404 on missing, not wait-and-watch)', async () => {
    const { status } = await probeHeaders({ port, path: '/api/sessions/no-such-session/stream' });
    expect(status).toBe(404);
  });

  test('existing session: appending a message causes SSE frame to arrive', async () => {
    const sessionId = 'live-session-001';
    const sessionDir = resolve(tempRoot, '_ops/swarm/sessions', sessionId);
    mkdirSync(sessionDir, { recursive: true });
    const bbPath = resolve(sessionDir, 'blackboard.jsonl');
    writeFileSync(bbPath, '', 'utf8');

    const newMsg = makeMsg('sess-msg-001', '2026-05-04T10:00:00Z', { session_id: sessionId });

    const collectPromise = collectSseFrames({
      port,
      path: `/api/sessions/${sessionId}/stream`,
      until: (f) => f.some((fr) => fr.data && fr.id === 'sess-msg-001'),
      timeoutMs: 3000,
    });

    await new Promise((r) => setTimeout(r, 80));
    seedMessage(bbPath, newMsg);

    const { frames, timedOut } = await collectPromise;
    expect(timedOut).toBe(false);
    const dataFrame = frames.find((f) => f.data && f.id === 'sess-msg-001');
    expect(dataFrame).toBeDefined();
    expect(JSON.parse(dataFrame.data).id).toBe('sess-msg-001');
  });

  test('path traversal in session id → 400', async () => {
    const { status } = await probeHeaders({ port, path: '/api/sessions/..%2Fescape/stream' });
    expect([400, 404]).toContain(status);
  });
});
