import { describe, test, expect, beforeAll } from 'vitest';
import http from 'node:http';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import request from 'supertest';
import {
  blackboardMiddleware,
  readPersistent,
  listSessions,
  readSession,
} from '../../server/middleware.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE_ROOT = resolve(__dirname, '../fixtures');

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

describe('pure read helpers (offline)', () => {
  test('readPersistent returns parsed messages from the fixture', () => {
    const data = readPersistent(FIXTURE_ROOT);
    expect(data).not.toBeNull();
    expect(Array.isArray(data.messages)).toBe(true);
    // Fixture has 7 valid lines (one is malformed and skipped).
    expect(data.messages.length).toBe(7);
    expect(data.file_size_bytes).toBeGreaterThan(0);
    expect(data.last_modified).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  test('readPersistent returns null when the file is missing', () => {
    const data = readPersistent('/nonexistent/path');
    expect(data).toBeNull();
  });

  test('listSessions enumerates session subdirectories', () => {
    const { sessions } = listSessions(FIXTURE_ROOT);
    expect(sessions.length).toBe(2);
    const ids = sessions.map((s) => s.id).sort();
    expect(ids).toEqual(['test-session-001', 'test-session-002']);
    for (const s of sessions) {
      expect(s.message_count).toBeGreaterThan(0);
      expect(s.last_modified).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    }
  });

  test('listSessions returns an empty list when the directory is missing', () => {
    const { sessions } = listSessions('/nonexistent/path');
    expect(sessions).toEqual([]);
  });

  test('readSession returns the messages for a known id', () => {
    const data = readSession(FIXTURE_ROOT, 'test-session-001');
    expect(data).not.toBeNull();
    expect(data.id).toBe('test-session-001');
    expect(data.messages.length).toBe(4);
  });

  test('readSession returns null for an unknown id', () => {
    expect(readSession(FIXTURE_ROOT, 'no-such-session')).toBeNull();
  });

  test('readSession rejects path traversal attempts', () => {
    expect(readSession(FIXTURE_ROOT, '../persistent')).toBeNull();
    expect(readSession(FIXTURE_ROOT, 'a/b')).toBeNull();
    expect(readSession(FIXTURE_ROOT, '..')).toBeNull();
  });
});

describe('HTTP middleware', () => {
  let server;
  beforeAll(() => { server = makeServer(FIXTURE_ROOT); });

  test('GET /api/persistent → 200 with messages', async () => {
    const res = await request(server).get('/api/persistent');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(Array.isArray(res.body.messages)).toBe(true);
    expect(res.body.messages.length).toBe(7);
    expect(typeof res.body.file_size_bytes).toBe('number');
    expect(res.body.last_modified).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  test('GET /api/persistent → 404 when palace root is missing', async () => {
    const otherServer = makeServer('/nonexistent/path');
    const res = await request(otherServer).get('/api/persistent');
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });

  test('GET /api/sessions → 200 with the two fixture sessions', async () => {
    const res = await request(server).get('/api/sessions');
    expect(res.status).toBe(200);
    expect(res.body.sessions.map((s) => s.id).sort())
      .toEqual(['test-session-001', 'test-session-002']);
  });

  test('GET /api/sessions → 200 with empty list when directory missing', async () => {
    const otherServer = makeServer('/nonexistent/path');
    const res = await request(otherServer).get('/api/sessions');
    expect(res.status).toBe(200);
    expect(res.body.sessions).toEqual([]);
  });

  test('GET /api/sessions/test-session-001 → 200', async () => {
    const res = await request(server).get('/api/sessions/test-session-001');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('test-session-001');
    expect(res.body.messages.length).toBe(4);
  });

  test('GET /api/sessions/missing → 404', async () => {
    const res = await request(server).get('/api/sessions/missing');
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });

  test('GET /api/sessions/..%2Fpersistent (encoded traversal) is rejected', async () => {
    // Express-style: %2F decodes to /, so the route matcher won't see ../persistent
    // as a single path segment. The endpoint should 404, not reveal anything.
    const res = await request(server).get('/api/sessions/..%2Fpersistent');
    expect([404, 400]).toContain(res.status);
  });

  test('an unknown URL falls through to next() (and the test 404)', async () => {
    const res = await request(server).get('/some/other/url');
    expect(res.status).toBe(404);
  });
});
