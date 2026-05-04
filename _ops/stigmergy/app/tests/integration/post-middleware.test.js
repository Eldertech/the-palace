import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import http from 'node:http';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdtempSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import request from 'supertest';
import { blackboardMiddleware } from '../../server/middleware.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Harness (mirrors middleware.test.js pattern) ────────────────────────────

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

// ── A valid §2.2-conformant message for testing ─────────────────────────────

function makeValidMessage(overrides = {}) {
  return {
    schema_version: '1.0',
    id: 'test-msg-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
    ts: new Date().toISOString(),
    session_id: 'test-session-post',
    from: 'TRICKSTER',
    to: '*',
    type: 'BROADCAST',
    board: 'GENERAL',
    health: {
      context_pct: 0.1,
      stop_reason: 'end_turn',
      iteration: 1,
      tokens_this_call: 100,
      model: 'claude-sonnet-4-6',
      score: 'green',
    },
    payload: { content: 'test message' },
    ...overrides,
  };
}

// ── Temp palace root with the required directory structure ──────────────────

function makeTempPalace() {
  const root = mkdtempSync(resolve(tmpdir(), 'stigmergy-test-'));
  // Create the persistent blackboard directory.
  const { mkdirSync, writeFileSync } = require('node:fs');
  mkdirSync(resolve(root, '_ops/swarm/persistent'), { recursive: true });
  mkdirSync(resolve(root, '_ops/swarm/sessions'), { recursive: true });
  // Create an empty persistent blackboard so GET still works.
  writeFileSync(resolve(root, '_ops/swarm/persistent/blackboard.jsonl'), '', 'utf8');
  return root;
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('POST /api/persistent', () => {
  let tempRoot;
  let server;

  beforeAll(() => {
    tempRoot = makeTempPalace();
    server = makeServer(tempRoot);
  });

  afterAll(() => {
    rmSync(tempRoot, { recursive: true, force: true });
  });

  test('valid message → 200, line appended, returned line matches input', async () => {
    const msg = makeValidMessage();
    const res = await request(server)
      .post('/api/persistent')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(msg));

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(typeof res.body.line).toBe('string');

    // The returned line should parse to the original message.
    const parsed = JSON.parse(res.body.line);
    expect(parsed.id).toBe(msg.id);

    // The file should contain that line.
    const bbPath = resolve(tempRoot, '_ops/swarm/persistent/blackboard.jsonl');
    const fileText = readFileSync(bbPath, 'utf8');
    expect(fileText).toContain(msg.id);
  });

  test('missing required field → 400, errors array names that field', async () => {
    const msg = makeValidMessage();
    delete msg.from;
    const res = await request(server)
      .post('/api/persistent')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(msg));

    expect(res.status).toBe(400);
    expect(Array.isArray(res.body.errors)).toBe(true);
    expect(res.body.errors.some((e) => e.path === 'from')).toBe(true);
  });

  test('invalid type enum → 400', async () => {
    const msg = makeValidMessage({ type: 'INVALID_TYPE' });
    const res = await request(server)
      .post('/api/persistent')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(msg));

    expect(res.status).toBe(400);
    expect(res.body.errors.some((e) => e.path === 'type')).toBe(true);
  });

  test('messageVersion: "audit-result" → 400', async () => {
    const msg = { ...makeValidMessage(), messageVersion: 'audit-result' };
    const res = await request(server)
      .post('/api/persistent')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(msg));

    expect(res.status).toBe(400);
    expect(res.body.errors.some((e) => e.path === 'messageVersion')).toBe(true);
  });

  test('malformed JSON body → 400', async () => {
    const res = await request(server)
      .post('/api/persistent')
      .set('Content-Type', 'application/json')
      .send('{not valid json}');

    expect(res.status).toBe(400);
    expect(Array.isArray(res.body.errors)).toBe(true);
    expect(res.body.errors[0].message).toMatch(/malformed JSON/i);
  });

  test('body > 64 KB → 413', async () => {
    const msg = makeValidMessage({
      payload: { content: 'x'.repeat(65 * 1024) },
    });
    const res = await request(server)
      .post('/api/persistent')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(msg));

    expect(res.status).toBe(413);
    expect(res.body.error).toMatch(/too large/i);
  });
});

describe('POST /api/sessions/:id', () => {
  let tempRoot;
  let server;

  beforeAll(() => {
    tempRoot = makeTempPalace();
    server = makeServer(tempRoot);
  });

  afterAll(() => {
    rmSync(tempRoot, { recursive: true, force: true });
  });

  test('valid message into existing session dir → 200, written', async () => {
    // Pre-create the session directory.
    const { mkdirSync, writeFileSync } = require('node:fs');
    const sessionId = 'existing-session';
    const sessionDir = resolve(tempRoot, '_ops/swarm/sessions', sessionId);
    mkdirSync(sessionDir, { recursive: true });
    writeFileSync(resolve(sessionDir, 'blackboard.jsonl'), '', 'utf8');

    const msg = makeValidMessage({ session_id: sessionId });
    const res = await request(server)
      .post(`/api/sessions/${sessionId}`)
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(msg));

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    const bbPath = resolve(sessionDir, 'blackboard.jsonl');
    expect(readFileSync(bbPath, 'utf8')).toContain(msg.id);
  });

  test('valid message into NON-existing session dir → 200, dir created, written', async () => {
    const sessionId = 'new-session-' + Date.now();
    const sessionDir = resolve(tempRoot, '_ops/swarm/sessions', sessionId);
    expect(existsSync(sessionDir)).toBe(false);

    const msg = makeValidMessage({ session_id: sessionId });
    const res = await request(server)
      .post(`/api/sessions/${sessionId}`)
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(msg));

    expect(res.status).toBe(200);
    expect(existsSync(sessionDir)).toBe(true);
    const bbPath = resolve(sessionDir, 'blackboard.jsonl');
    expect(readFileSync(bbPath, 'utf8')).toContain(msg.id);
  });

  test('?create=false into non-existing dir → 404', async () => {
    const sessionId = 'nonexistent-create-false';
    const res = await request(server)
      .post(`/api/sessions/${sessionId}?create=false`)
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(makeValidMessage({ session_id: sessionId })));

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });

  test('path traversal in session id → 400 or 404', async () => {
    const res = await request(server)
      .post('/api/sessions/../escape')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(makeValidMessage()));

    expect([400, 404]).toContain(res.status);
  });
});

describe('concurrent writes to the same file', () => {
  let tempRoot;
  let server;

  beforeAll(() => {
    tempRoot = makeTempPalace();
    server = makeServer(tempRoot);
  });

  afterAll(() => {
    rmSync(tempRoot, { recursive: true, force: true });
  });

  test('5 concurrent POSTs — all 5 lines appear, no truncation', async () => {
    const ids = [];
    const promises = [];
    for (let i = 0; i < 5; i++) {
      const msg = makeValidMessage({ id: `concurrent-msg-${i}` });
      ids.push(msg.id);
      promises.push(
        request(server)
          .post('/api/persistent')
          .set('Content-Type', 'application/json')
          .send(JSON.stringify(msg))
      );
    }

    const results = await Promise.all(promises);
    for (const res of results) {
      expect(res.status).toBe(200);
    }

    // Read the file and check all 5 lines are there, each parseable.
    const bbPath = resolve(tempRoot, '_ops/swarm/persistent/blackboard.jsonl');
    const text = readFileSync(bbPath, 'utf8');
    const lines = text.split('\n').filter((l) => l.trim().length > 0);

    // Find our 5 concurrent messages (there may be prior test writes too).
    const concurrentLines = lines.filter((l) => {
      try {
        const m = JSON.parse(l);
        return ids.includes(m.id);
      } catch {
        return false;
      }
    });

    expect(concurrentLines.length).toBe(5);

    // Every line in the file must be valid JSON (no truncation / interleaving).
    for (const line of lines) {
      expect(() => JSON.parse(line), `line not valid JSON: ${line}`).not.toThrow();
    }
  });
});
