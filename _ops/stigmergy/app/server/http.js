// server/http.js — shared HTTP + data-read helpers for the STIGMERGY app server.
//
// Lifted verbatim from middleware.js as part of the §4 decomposition: the
// endpoint handlers in server/api/ and the router all share these, so they live
// in one place rather than as closures inside the Vite-plugin factory.

import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { resolve, join, sep, extname } from 'node:path';
import { parseJSONL } from '../src/lib/parser.js';
import { validateMessage } from '@stigmergy/core/schema';
import { appendJsonLine } from '@stigmergy/core/blackboard';

export const SESSIONS_REL = '_ops/swarm/sessions';
export const PERSISTENT_REL = '_ops/swarm/persistent/blackboard.jsonl';

// The supervisor prompt the fired worker runs as (the Enrichment ceremony's
// headless `claude -p` brief). Read at fire time so edits take effect without
// a server restart. Falls back to a minimal instruction if the file is gone.
export function readSupervisorPrompt(palaceRoot) {
  const p = resolve(palaceRoot, 'Enrichment/supervisor-prompt.md');
  if (existsSync(p)) {
    try { return readFileSync(p, 'utf8'); } catch (_) { /* fall through */ }
  }
  return 'Run the Enrichment ceremony: read Enrichment/inbox.md, act on each card-block per the ceremony spec, then clear the inbox and top the queue to five.';
}

export function jsonResponse(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

// Resolve a palace-relative path to an absolute path, refusing anything that
// escapes the palace root (path traversal, absolute paths, null bytes).
// Returns the absolute path, or null if the input is unsafe/empty.
export function resolveInsidePalace(palaceRoot, rel) {
  if (typeof rel !== 'string' || rel === '' || rel.includes('\0')) return null;
  const root = resolve(palaceRoot);
  const abs = resolve(root, rel);
  if (abs !== root && !abs.startsWith(root + sep)) return null;
  return abs;
}

// Content-type table for GET /api/file. Mirrors Enrichment/server.py:_guess_type
// so the two review surfaces serve the same bytes with the same headers.
const CONTENT_TYPES = {
  '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg',
  '.m4a': 'audio/mp4', '.flac': 'audio/flac',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.svg': 'image/svg+xml', '.webp': 'image/webp',
  '.html': 'text/html; charset=utf-8', '.htm': 'text/html; charset=utf-8',
  '.css': 'text/css', '.js': 'application/javascript',
  '.md': 'text/markdown; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
  '.json': 'application/json',
};

export function contentTypeFor(absPath) {
  return CONTENT_TYPES[extname(absPath).toLowerCase()] ?? 'application/octet-stream';
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
export function readBody(req, res) {
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
export async function handlePost(bodyText, filePath, res) {
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
