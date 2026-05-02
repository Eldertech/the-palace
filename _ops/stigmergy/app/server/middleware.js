// Stigmergy data adapter middleware.
//
// Exposes three read-only endpoints over a Vite dev-server middleware:
//   GET /api/persistent           — _ops/swarm/persistent/blackboard.jsonl
//   GET /api/sessions             — list of session blackboards
//   GET /api/sessions/:id         — _ops/swarm/sessions/:id/blackboard.jsonl
//
// The palace root is derived from PALACE_ROOT env var if set; otherwise
// from a default path resolved from the app/ directory at import time.
// Tests pass an explicit `palaceRoot` to avoid env-var coupling.

import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { parseJSONL } from '../src/lib/parser.js';

const SESSIONS_REL = '_ops/swarm/sessions';
const PERSISTENT_REL = '_ops/swarm/persistent/blackboard.jsonl';

function jsonResponse(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

export function readPersistent(palaceRoot) {
  const path = resolve(palaceRoot, PERSISTENT_REL);
  if (!existsSync(path)) {
    return null;
  }
  const stat = statSync(path);
  const text = readFileSync(path, 'utf8');
  const { messages, skipped } = parseJSONL(text);
  if (skipped.length > 0) {
    console.warn(`[stigmergy] persistent: skipped ${skipped.length} malformed line(s)`);
  }
  return {
    messages,
    file_size_bytes: stat.size,
    last_modified: stat.mtime.toISOString(),
  };
}

export function listSessions(palaceRoot) {
  const root = resolve(palaceRoot, SESSIONS_REL);
  if (!existsSync(root)) {
    return { sessions: [] };
  }
  const entries = readdirSync(root, { withFileTypes: true });
  const sessions = [];
  for (const ent of entries) {
    if (!ent.isDirectory()) continue;
    const bb = join(root, ent.name, 'blackboard.jsonl');
    if (!existsSync(bb)) continue;
    const stat = statSync(bb);
    const text = readFileSync(bb, 'utf8');
    const { messages } = parseJSONL(text);
    sessions.push({
      id: ent.name,
      path: bb,
      message_count: messages.length,
      last_modified: stat.mtime.toISOString(),
    });
  }
  // Sort: most recently modified first.
  sessions.sort((a, b) => b.last_modified.localeCompare(a.last_modified));
  return { sessions };
}

export function readSession(palaceRoot, id) {
  // Reject path traversal — id must be a single segment, no slashes or dots.
  if (typeof id !== 'string' || /[\/\\]|\.\./.test(id)) return null;
  const path = resolve(palaceRoot, SESSIONS_REL, id, 'blackboard.jsonl');
  if (!existsSync(path)) return null;
  const stat = statSync(path);
  const text = readFileSync(path, 'utf8');
  const { messages, skipped } = parseJSONL(text);
  if (skipped.length > 0) {
    console.warn(`[stigmergy] session ${id}: skipped ${skipped.length} malformed line(s)`);
  }
  return {
    id,
    messages,
    file_size_bytes: stat.size,
    last_modified: stat.mtime.toISOString(),
  };
}

// Vite plugin factory.
export function blackboardMiddleware(palaceRoot) {
  return {
    name: 'stigmergy-blackboard-middleware',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Strip query string for routing.
        const url = (req.url || '').split('?')[0];

        if (url === '/api/persistent') {
          const data = readPersistent(palaceRoot);
          if (!data) {
            return jsonResponse(res, 404, { error: 'persistent blackboard not found', expected_at: resolve(palaceRoot, PERSISTENT_REL) });
          }
          return jsonResponse(res, 200, data);
        }

        if (url === '/api/sessions') {
          return jsonResponse(res, 200, listSessions(palaceRoot));
        }

        const m = url.match(/^\/api\/sessions\/([^/]+)$/);
        if (m) {
          const data = readSession(palaceRoot, m[1]);
          if (!data) {
            return jsonResponse(res, 404, { error: 'session not found', id: m[1] });
          }
          return jsonResponse(res, 200, data);
        }

        next();
      });
    },
  };
}
