// server/api/sessions.js — per-session blackboard endpoints.
//   GET  /api/sessions             — list of session blackboards
//   GET  /api/sessions/:id/stream  — SSE stream for a session blackboard
//   GET  /api/sessions/:id         — full read of one session
//   POST /api/sessions/:id         — append to that session's blackboard.jsonl
//
// The dynamic /api/sessions/:id matchers run LAST (router order) so the exact
// routes above win first.

import { existsSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { jsonResponse, readBody, handlePost, listSessions, readSession, SESSIONS_REL } from '../http.js';
import { setupSseStream } from '../sse.js';

export async function sessionsRoutes(ctx) {
  const { req, res, palaceRoot, urlPath, query, method } = ctx;

  if (urlPath === '/api/sessions' && method === 'GET') {
    jsonResponse(res, 200, listSessions(palaceRoot));
    return true;
  }

  const mStream = urlPath.match(/^\/api\/sessions\/([^/]+)\/stream$/);
  if (mStream && method === 'GET') {
    const id = mStream[1];
    if (typeof id !== 'string' || /[/\\]|\.\./.test(id)) {
      jsonResponse(res, 400, { error: 'invalid session id', id });
      return true;
    }
    const filePath = resolve(palaceRoot, SESSIONS_REL, id, 'blackboard.jsonl');
    // If file doesn't exist: 404 (chosen over "wait-and-watch" for simplicity).
    if (!existsSync(filePath)) {
      jsonResponse(res, 404, { error: 'session not found', id });
      return true;
    }
    setupSseStream(req, res, filePath);
    return true; // response owned by SSE handler
  }

  const m = urlPath.match(/^\/api\/sessions\/([^/]+)$/);
  if (m) {
    const id = m[1];

    // Path traversal guard (same as readSession).
    if (typeof id !== 'string' || /[/\\]|\.\./.test(id)) {
      jsonResponse(res, 400, { error: 'invalid session id', id });
      return true;
    }

    if (method === 'GET') {
      const data = readSession(palaceRoot, id);
      if (!data) {
        jsonResponse(res, 404, { error: 'session not found', id });
        return true;
      }
      jsonResponse(res, 200, data);
      return true;
    }

    if (method === 'POST') {
      const sessionDir = resolve(palaceRoot, SESSIONS_REL, id);

      // ?create=false → refuse to create a missing directory.
      if (query.get('create') === 'false') {
        if (!existsSync(sessionDir)) {
          jsonResponse(res, 404, { error: 'session not found', id });
          return true;
        }
      } else {
        mkdirSync(sessionDir, { recursive: true });
      }

      const bodyText = await readBody(req, res);
      if (bodyText === null) return true; // 413 already sent
      const filePath = join(sessionDir, 'blackboard.jsonl');
      await handlePost(bodyText, filePath, res);
      return true;
    }
  }

  return false;
}
