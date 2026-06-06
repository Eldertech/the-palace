// server/sse.js — the Server-Sent Events stream for a single blackboard file.
//
// Lifted verbatim from middleware.js as the first, lowest-risk slice of the
// middleware decomposition (audit §4 / §4b). Backs both
//   GET /api/persistent/stream   and   GET /api/sessions/:id/stream.
//
// The reconnect replay is POSITIONAL, not by id comparison — palace message ids
// are per-steward sequences, not globally monotonic (see bug-sse-reconnect-replay.md).

import { existsSync, readFileSync, watch } from 'node:fs';
import { parseJSONL } from '../src/lib/parser.js';

// Read lazily at call time so test files can set the env var before creating
// a server without racing against module-level evaluation.
function getSseHeartbeatMs() {
  return parseInt(process.env.STIGMERGY_SSE_HEARTBEAT_MS ?? '25000', 10);
}

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
 *   unless Last-Event-ID is supplied, in which case replays every message that
 *   appears AFTER the last-seen id by file/append order — never by id sort,
 *   because palace ids are per-steward namespaced, not globally monotonic.
 *   If the last-seen id is not found in the file, replays everything; the
 *   client (mergeLive) dedupes by id, so over-replay is harmless and
 *   under-replay would silently drop genuinely-newer cross-steward messages).
 * - Watches the file for changes, emitting only new messages (by id).
 * - Emits a heartbeat comment every SSE_HEARTBEAT_MS ms.
 * - Cleans up watcher + interval on req close.
 *
 * @param {import('node:http').IncomingMessage} req
 * @param {import('node:http').ServerResponse}  res
 * @param {string} filePath — absolute path to the .jsonl file
 */
export function setupSseStream(req, res, filePath) {
  writeSseHeaders(res);

  const lastEventId = req.headers['last-event-id'] ?? null;
  const seenIds = new Set();

  // Seed seenIds from current file contents; optionally replay on reconnect.
  //
  // Replay is POSITIONAL, not by id comparison: palace message ids are
  // per-steward sequences (e.g. crystal-synth-steward-014,
  // waveguide-synthesizer-steward-005) and do NOT sort globally by time.
  // We locate the client's last-seen id by index and replay everything that
  // follows it in file (append/time) order. If the id is absent — file
  // rotated, truncated, or never persisted — we replay all messages; the
  // client dedupes by id, so over-replay is safe while under-replay is the bug.
  const initialMessages = readJsonlMessages(filePath);
  let replayFromIndex = null; // null = no replay; -1 = replay all; >=0 = after index
  if (lastEventId !== null) {
    const seenIndex = initialMessages.findIndex((m) => m.id !== undefined && m.id === lastEventId);
    replayFromIndex = seenIndex; // -1 when not found → replay all below
  }
  initialMessages.forEach((msg, index) => {
    if (msg.id === undefined) return;
    if (replayFromIndex !== null && index > replayFromIndex) {
      // Either after the last-seen message, or (replayFromIndex === -1) all of them.
      emitMessage(res, msg);
    }
    seenIds.add(msg.id);
  });

  // Heartbeat to keep proxies / NAT from closing the connection.
  const heartbeatInterval = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, getSseHeartbeatMs());

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
