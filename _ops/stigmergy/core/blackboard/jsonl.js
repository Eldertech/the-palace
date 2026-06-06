// append.js — atomic append to .jsonl files.
//
// Writes always end in a single newline. The validator MUST run before append
// — this module never inspects the message; it only handles the I/O.

import { existsSync, mkdirSync, appendFileSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

/**
 * Append a single message to a .jsonl file as one line. Atomic per call:
 * one fs.appendFileSync write that includes the trailing newline. For sub-
 * PIPE_BUF writes (well under 4KB on macOS/Linux), this is OS-atomic.
 *
 * Preserves final-newline invariant: if the file ends without a newline (e.g.
 * a previous writer crashed mid-line), this prepends one before the new line.
 *
 * @param {string} path
 * @param {object} message — already-validated JS object
 * @returns {{ wrote: string, path: string }} the exact line written (without trailing newline)
 */
export function appendMessage(path, message) {
  const abs = resolve(path);
  mkdirSync(dirname(abs), { recursive: true });
  const line = JSON.stringify(message);
  let prefix = '';
  if (existsSync(abs)) {
    const text = readFileSync(abs, 'utf8');
    if (text.length > 0 && !text.endsWith('\n')) {
      prefix = '\n';
    }
  }
  appendFileSync(abs, prefix + line + '\n', 'utf8');
  return { wrote: line, path: abs };
}

/**
 * Read all lines of a .jsonl file as parsed JSON objects. Skips blank lines.
 * Throws on any malformed line (with line number).
 *
 * @param {string} path
 * @returns {Array<object>}
 */
export function readJsonl(path) {
  const abs = resolve(path);
  if (!existsSync(abs)) return [];
  const text = readFileSync(abs, 'utf8');
  const lines = text.split('\n');
  const out = [];
  lines.forEach((line, idx) => {
    if (line.trim() === '') return;
    try {
      out.push(JSON.parse(line));
    } catch (e) {
      throw new Error(`malformed line ${idx + 1} in ${abs}: ${e.message}`);
    }
  });
  return out;
}
