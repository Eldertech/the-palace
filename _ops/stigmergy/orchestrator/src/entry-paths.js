// entry-paths.js — resolve a palace entry's file and its bundle folder from a
// title alone. The orchestrator joins a steward to its entry by `home` (the
// exact entry title); everything entry-local — the bundle, its plan.md, its
// staging.md — is derivable from that one field. This module is that hinge.
//
// Obsidian resolves [[wikilinks]] flatly across the vault regardless of folder,
// so a title is enough to locate the entry; the bundle is its sibling folder of
// the same name (SCHEMA §8). Extracted as the canonical home for findEntryFile
// (build-cycle-prompt.js re-exports it for back-compat) so the plan materializer
// and the prompt builder resolve paths the same way.

import { readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

// System dirs that never hold knowledge entries (CLAUDE.md § Directory Structure).
export const EXCLUDE_DIRS = new Set(['.git', '.claude', '.obsidian', 'node_modules', '_tools', '.venvs']);

/**
 * Locate a palace entry file by title (Obsidian-style flat namespace): walk the
 * tree for `<title>.md`, skipping system directories. Returns the absolute path
 * or null. Iterative DFS — no recursion, no symlink following.
 *
 * @param {string} palaceRoot
 * @param {string} title — the entry title, no extension
 * @returns {string|null}
 */
export function findEntryFile(palaceRoot, title) {
  const target = `${title}.md`;
  const stack = [palaceRoot];
  while (stack.length) {
    const dir = stack.pop();
    let entries;
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { continue; }
    for (const e of entries) {
      if (e.isDirectory()) {
        if (!EXCLUDE_DIRS.has(e.name)) stack.push(join(dir, e.name));
      } else if (e.name === target) {
        return join(dir, e.name);
      }
    }
  }
  return null;
}

/**
 * Resolve the bundle folder for an entry: the sibling folder named identically
 * to the entry file (SCHEMA §8, `[Entry].md` ↔ `[Entry]/`). The folder need not
 * exist yet — bundles are lazy. Returns the entry file path and the bundle dir
 * path, or null when the entry file cannot be found.
 *
 * @param {string} palaceRoot
 * @param {string} home — the entry title
 * @returns {{ entryFile: string, bundleDir: string }|null}
 */
export function resolveBundleDir(palaceRoot, home) {
  const entryFile = findEntryFile(palaceRoot, home);
  if (!entryFile) return null;
  return { entryFile, bundleDir: join(dirname(entryFile), home) };
}
