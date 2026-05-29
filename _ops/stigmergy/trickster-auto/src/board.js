// board.js — locating + reading the persistent blackboard.
//
// Reuses the orchestrator's readJsonl (single I/O path; see the Decisions
// table — "do not invent a third write path"; the same applies to reads).

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readJsonl } from '../../orchestrator/src/append.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// trickster-auto/src → up to _ops/ → swarm/persistent/blackboard.jsonl
export const PERSISTENT_BOARD = resolve(
  __dirname,
  '../../../swarm/persistent/blackboard.jsonl',
);

/**
 * Read a board file into parsed message objects (board order preserved).
 * @param {string} [path] — defaults to the live persistent board.
 */
export function loadBoard(path = PERSISTENT_BOARD) {
  return readJsonl(path);
}
