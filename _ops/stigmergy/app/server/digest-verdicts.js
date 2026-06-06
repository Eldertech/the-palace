// server/digest-verdicts.js — persistence for verdict records.
//
// One JSON object per line, append-only, never mutated. Tolerates malformed
// lines on read (mirrors the persistent-blackboard reader). Lives at
// _ops/stigmergy/trickster-auto/verdicts.jsonl alongside the digest itself.

import { resolve, dirname } from 'node:path';
import { existsSync, readFileSync, mkdirSync } from 'node:fs';
import { appendJsonLine } from '@stigmergy/core/blackboard';

export const VERDICTS_REL = '_ops/stigmergy/trickster-auto/verdicts.jsonl';

export function verdictsPath(palaceRoot) {
  return resolve(palaceRoot, VERDICTS_REL);
}

/**
 * Append one verdict record. Creates the parent directory if missing.
 * Returns the serialized line on success; throws on filesystem error.
 */
export async function appendVerdict(palaceRoot, record) {
  const path = verdictsPath(palaceRoot);
  mkdirSync(dirname(path), { recursive: true });
  return appendJsonLine(path, record);
}

/**
 * Read all verdicts. Returns [] if the file is missing. Malformed lines are
 * skipped with a console.warn — never throws on bad lines, mirroring the
 * persistent-blackboard reader's tolerance.
 */
export function readVerdicts(palaceRoot) {
  const path = verdictsPath(palaceRoot);
  if (!existsSync(path)) return [];
  const text = readFileSync(path, 'utf8');
  const out = [];
  let skipped = 0;
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (trimmed === '') continue;
    try {
      out.push(JSON.parse(trimmed));
    } catch (_) {
      skipped += 1;
    }
  }
  if (skipped > 0) {
    console.warn(`[stigmergy] verdicts: skipped ${skipped} malformed line(s)`);
  }
  return out;
}
