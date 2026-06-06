// server/append.js — atomic append helper for .jsonl files.
//
// Single-message writes under PIPE_BUF (4096 bytes on most systems) are
// atomic at the OS level on POSIX. For larger messages (>= 4KB), we use a
// per-file promise queue to serialize concurrent writes so no lines are
// interleaved or truncated.

import { promises as fs } from 'node:fs';

// Map<filePath, Promise<void>> — tracks the most recent write promise per file.
// Writes chain onto the prior promise so they execute in order.
const _queue = new Map();

/**
 * Serialize a message object as a single JSON line (no newline).
 * Pure helper — useful for tests and for computing the returned line.
 *
 * @param {object} message
 * @returns {string}
 */
export function serializeLine(message) {
  return JSON.stringify(message);
}

/**
 * Append a message to a .jsonl file atomically.
 *
 * Serializes `message` as a single JSON line followed by '\n'.
 * Writes are serialized per file path using a promise queue, so concurrent
 * calls to the same file never interleave.
 *
 * @param {string} filePath — absolute path to the .jsonl file
 * @param {object} message — the message object to append
 * @returns {Promise<string>} — the serialized line (without the trailing \n)
 */
export async function appendJsonLine(filePath, message) {
  const line = serializeLine(message);

  // Chain this write onto the previous promise for this path.
  const prev = _queue.get(filePath) || Promise.resolve();
  const next = prev.then(() =>
    fs.appendFile(filePath, line + '\n', { flag: 'a', encoding: 'utf8' })
  );

  // Store the chained promise (without the catch so errors propagate to callers).
  // We store a version that swallows errors so the queue doesn't get stuck on failure.
  _queue.set(
    filePath,
    next.catch(() => {
      // If this write failed, the queue entry is still replaced so future
      // writes can proceed.
    })
  );

  // Await the actual write (including error propagation to the caller).
  await next;
  return line;
}
