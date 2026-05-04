// Stigmergy data adapter middleware.
//
// Exposes endpoints over a Vite dev-server middleware:
//   GET  /api/persistent           — _ops/swarm/persistent/blackboard.jsonl
//   GET  /api/sessions             — list of session blackboards
//   GET  /api/sessions/:id         — _ops/swarm/sessions/:id/blackboard.jsonl
//   POST /api/persistent           — append one §2.2-conformant message
//   POST /api/sessions/:id         — append to that session's blackboard.jsonl
//   GET  /api/persistent/stream    — SSE stream for persistent blackboard
//   GET  /api/sessions/:id/stream  — SSE stream for a session blackboard
//
// The palace root is derived from PALACE_ROOT env var if set; otherwise
// from a default path resolved from the app/ directory at import time.
// Tests pass an explicit `palaceRoot` to avoid env-var coupling.

import { readFileSync, existsSync, statSync, readdirSync, mkdirSync, watch } from 'node:fs';
import { resolve, join } from 'node:path';
import { parseJSONL } from '../src/lib/parser.js';
import { validateMessage } from './validator.js';
import { appendJsonLine } from './append.js';

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

const MAX_BODY_BYTES = 64 * 1024; // 64 KB

/**
 * Read the full request body, rejecting at MAX_BODY_BYTES.
 * Returns a Promise<string> or calls jsonResponse(res, 413, ...) and resolves null.
 */
function readBody(req, res) {
  return new Promise((resolve) => {
    const chunks = [];
    let total = 0;
    let aborted = false;

    req.on('data', (chunk) => {
      if (aborted) return;
      total += chunk.length;
      if (total > MAX_BODY_BYTES) {
        aborted = true;
        jsonResponse(res, 413, { error: 'payload too large' });
        resolve(null);
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      if (aborted) return;
      resolve(Buffer.concat(chunks).toString('utf8'));
    });

    req.on('error', () => {
      if (!aborted) {
        jsonResponse(res, 400, { errors: [{ path: '', message: 'request error while reading body' }] });
        resolve(null);
      }
    });
  });
}

/**
 * Handle a POST write request.
 * bodyText — the raw string body
 * filePath — absolute path to the .jsonl target
 * res — the response object
 */
async function handlePost(bodyText, filePath, res) {
  // Parse JSON.
  let msg;
  try {
    msg = JSON.parse(bodyText);
  } catch (e) {
    return jsonResponse(res, 400, {
      errors: [{ path: '', message: `malformed JSON: ${e.message}` }],
    });
  }

  // Validate.
  const result = validateMessage(msg);
  if (!result.valid) {
    return jsonResponse(res, 400, { errors: result.errors });
  }

  // Append.
  const line = await appendJsonLine(filePath, msg);
  return jsonResponse(res, 200, { ok: true, line });
}

// ── SSE helper ───────────────────────────────────────────────────────────────

const SSE_HEARTBEAT_MS = parseInt(process.env.STIGMERGY_SSE_HEARTBEAT_MS ?? '25000', 10);

/**
 * Read all parseable JSONL messages from `filePath`.
 * Returns [] if the file doesn't exist.
 */
function readJsonlMessages(filePath) {
  if (!existsSync(filePath)) return [];
  const text = readFileSync(filePath, 'utf8');
  const { messages } = parseJSONL(text);
  return messages;
}

/**
 * Write SSE headers on `res`.
 */
function writeSseHeaders(res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
}

/**
 * Emit one SSE frame for a single message object.
 */
function emitMessage(res, msg) {
  const id = msg.id ?? '';
  res.write(`id: ${id}\nevent: message\ndata: ${JSON.stringify(msg)}\n\n`);
}

/**
 * Core SSE setup for a single blackboard file.
 *
 * - Reads the current file, populates seenIds (does NOT emit initial messages
 *   unless Last-Event-ID is supplied, in which case replays messages with
 *   id > lastEventId using lexicographic order).
 * - Watches the file for changes, emitting only new messages (by id).
 * - Emits a heartbeat comment every SSE_HEARTBEAT_MS ms.
 * - Cleans up watcher + interval on req close.
 *
 * @param {import('node:http').IncomingMessage} req
 * @param {import('node:http').ServerResponse}  res
 * @param {string} filePath — absolute path to the .jsonl file
 */
function setupSseStream(req, res, filePath) {
  writeSseHeaders(res);

  const lastEventId = req.headers['last-event-id'] ?? null;
  const seenIds = new Set();

  // Seed seenIds from current file contents; optionally replay on reconnect.
  const initialMessages = readJsonlMessages(filePath);
  for (const msg of initialMessages) {
    if (msg.id !== undefined) {
      if (lastEventId !== null && msg.id > lastEventId) {
        // Replay: this message arrived after the client's last known id.
        emitMessage(res, msg);
      }
      seenIds.add(msg.id);
    }
  }

  // Heartbeat to keep proxies / NAT from closing the connection.
  const heartbeatInterval = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, SSE_HEARTBEAT_MS);

  // Confirm connection after setup (even if no replay).
  res.write(': connected\n\n');

  // Watch the file for new messages.
  let watcher = null;
  if (existsSync(filePath)) {
    try {
      watcher = watch(filePath, { persistent: false }, () => {
        const messages = readJsonlMessages(filePath);
        for (const msg of messages) {
          if (msg.id !== undefined && !seenIds.has(msg.id)) {
            seenIds.add(msg.id);
            emitMessage(res, msg);
          }
        }
      });
    } catch (err) {
      // If watch fails (e.g. file was removed mid-flight), log and continue.
      console.warn('[stigmergy] SSE watcher error:', err.message);
    }
  }

  // Cleanup on disconnect.
  req.on('close', () => {
    clearInterval(heartbeatInterval);
    if (watcher) {
      try { watcher.close(); } catch (_) {}
      watcher = null;
    }
    res.end();
  });
}

// Vite plugin factory.
export function blackboardMiddleware(palaceRoot) {
  return {
    name: 'stigmergy-blackboard-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        // Strip query string for routing; keep it for ?create=false check.
        const rawUrl = req.url || '';
        const [urlPath, queryString] = rawUrl.split('?');
        const query = new URLSearchParams(queryString || '');
        const method = (req.method || 'GET').toUpperCase();

        // ── GET /api/persistent/stream (SSE) ───────────────────────────────
        if (urlPath === '/api/persistent/stream' && method === 'GET') {
          const filePath = resolve(palaceRoot, PERSISTENT_REL);
          setupSseStream(req, res, filePath);
          return; // response owned by SSE handler
        }

        // ── GET /api/persistent ─────────────────────────────────────────────
        if (urlPath === '/api/persistent' && method === 'GET') {
          const data = readPersistent(palaceRoot);
          if (!data) {
            return jsonResponse(res, 404, {
              error: 'persistent blackboard not found',
              expected_at: resolve(palaceRoot, PERSISTENT_REL),
            });
          }
          return jsonResponse(res, 200, data);
        }

        // ── POST /api/persistent ────────────────────────────────────────────
        if (urlPath === '/api/persistent' && method === 'POST') {
          const bodyText = await readBody(req, res);
          if (bodyText === null) return; // 413 already sent
          const filePath = resolve(palaceRoot, PERSISTENT_REL);
          return handlePost(bodyText, filePath, res);
        }

        // ── GET /api/sessions ───────────────────────────────────────────────
        if (urlPath === '/api/sessions' && method === 'GET') {
          return jsonResponse(res, 200, listSessions(palaceRoot));
        }

        // ── GET /api/sessions/:id/stream (SSE) ─────────────────────────────
        const mStream = urlPath.match(/^\/api\/sessions\/([^/]+)\/stream$/);
        if (mStream && method === 'GET') {
          const id = mStream[1];
          // Path traversal guard.
          if (typeof id !== 'string' || /[/\\]|\.\./.test(id)) {
            return jsonResponse(res, 400, { error: 'invalid session id', id });
          }
          const filePath = resolve(palaceRoot, SESSIONS_REL, id, 'blackboard.jsonl');
          // If file doesn't exist: 404. (Chosen over "wait-and-watch" for simplicity;
          // see Phase 3 build report for rationale.)
          if (!existsSync(filePath)) {
            return jsonResponse(res, 404, { error: 'session not found', id });
          }
          setupSseStream(req, res, filePath);
          return; // response owned by SSE handler
        }

        // ── /api/sessions/:id ───────────────────────────────────────────────
        const m = urlPath.match(/^\/api\/sessions\/([^/]+)$/);
        if (m) {
          const id = m[1];

          // Path traversal guard (same as readSession).
          if (typeof id !== 'string' || /[/\\]|\.\./.test(id)) {
            return jsonResponse(res, 400, { error: 'invalid session id', id });
          }

          if (method === 'GET') {
            const data = readSession(palaceRoot, id);
            if (!data) {
              return jsonResponse(res, 404, { error: 'session not found', id });
            }
            return jsonResponse(res, 200, data);
          }

          if (method === 'POST') {
            const sessionDir = resolve(palaceRoot, SESSIONS_REL, id);

            // ?create=false → refuse to create a missing directory.
            if (query.get('create') === 'false') {
              if (!existsSync(sessionDir)) {
                return jsonResponse(res, 404, { error: 'session not found', id });
              }
            } else {
              // Create the session directory if it doesn't exist.
              mkdirSync(sessionDir, { recursive: true });
            }

            const bodyText = await readBody(req, res);
            if (bodyText === null) return; // 413 already sent
            const filePath = join(sessionDir, 'blackboard.jsonl');
            return handlePost(bodyText, filePath, res);
          }
        }

        next();
      });
    },
  };
}
