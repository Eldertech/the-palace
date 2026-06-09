// entry-frontmatter.js — read an entry's live YAML frontmatter.
//
// Single-source-of-truth enforcement (Bundle-Local Stewardship plan, Phase 1a):
// the steward's `stage` and `forward_vector` are owned by the entry's own
// frontmatter. The orchestrator must read them LIVE from the entry, never from
// the duplicated `stewardship` block in manifest.json / state.json — a copy can
// drift, and the whole point of the migration is to delete the copy, not move it.

import { readFileSync } from 'node:fs';
import { parse as parseYaml } from 'yaml';
import { findEntryFile } from './entry-paths.js';

// Leading `---\n … \n---` block at the very top of a markdown file.
const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/;

/**
 * Parse the YAML frontmatter object from markdown text. Returns {} when there is
 * no leading frontmatter block or it fails to parse (never throws — a malformed
 * entry must not crash a steward cycle).
 *
 * @param {string} text — full markdown file contents
 * @returns {object}
 */
export function parseFrontmatter(text) {
  const m = FRONTMATTER_RE.exec(String(text ?? ''));
  if (!m) return {};
  try {
    const data = parseYaml(m[1]);
    return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
  } catch {
    return {};
  }
}

/**
 * Read an entry's live stage + forward_vector from its frontmatter, located by
 * title. Returns null when the entry file cannot be found (so callers can fall
 * back to the stored copy and never feed a null into a prompt template).
 *
 * @param {string} palaceRoot
 * @param {string} home — the entry title
 * @returns {{ file: string, stage: (string|undefined), forward_vector: (string|undefined), data: object }|null}
 */
export function readEntryMeta(palaceRoot, home) {
  const file = findEntryFile(palaceRoot, home);
  if (!file) return null;
  let text;
  try { text = readFileSync(file, 'utf8'); } catch { return null; }
  const data = parseFrontmatter(text);
  return {
    file,
    stage: typeof data.stage === 'string' ? data.stage : undefined,
    forward_vector: typeof data.forward_vector === 'string' ? data.forward_vector : undefined,
    data,
  };
}
