// git.js — page-change detection per the Palace Orchestrator entry (Definitions of record).
//
// Wraps `git log` to detect commits to a palace entry since a given timestamp.
// The orchestrator skill calls this before each cycle to construct
// PAGE_UPDATE_NOTICEs and to detect forward-vector drift.

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Run a git command, returning stdout. Throws with stderr on failure.
 */
function git(args, cwd) {
  try {
    return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    const stderr = e.stderr ? e.stderr.toString() : e.message;
    throw new Error(`git ${args.join(' ')} failed: ${stderr.trim()}`);
  }
}

/**
 * Resolve the palace entry path for a wikilink target. Searches recursively
 * from the palace root for a `.md` file matching the entry name (filename
 * without extension). Excludes .git/, .claude/, .obsidian/, node_modules/,
 * _ops/swarm/sessions/.
 *
 * Note: this is a "best effort" resolver — if multiple matches exist it
 * returns the first found. Production palace assumes filename uniqueness.
 *
 * @param {string} palaceRoot
 * @param {string} entryName
 * @returns {string | null} absolute path, or null if not found
 */
export function resolveEntryPath(palaceRoot, entryName) {
  // Use git ls-files to enumerate tracked .md files quickly.
  let files;
  try {
    files = git(['ls-files', '--', '*.md'], palaceRoot).split('\n').filter(Boolean);
  } catch {
    return null;
  }
  const target = `${entryName}.md`;
  // Excluded prefixes:
  const excluded = ['.git/', '.claude/', '.obsidian/', 'node_modules/'];
  for (const f of files) {
    if (excluded.some((p) => f.startsWith(p))) continue;
    if (f === target) return resolve(palaceRoot, f);
    if (f.endsWith('/' + target)) return resolve(palaceRoot, f);
  }
  return null;
}

/**
 * Detect git changes to a file since a given ISO timestamp.
 *
 * Returns commits as `{ hash, ts, author, subject }` objects in chronological
 * order (oldest first). Empty array if no changes (or file untracked).
 *
 * @param {string} palaceRoot
 * @param {string} fileRelativePath — relative to palaceRoot
 * @param {string} sinceIso
 */
export function getChangesSince(palaceRoot, fileRelativePath, sinceIso) {
  if (!existsSync(resolve(palaceRoot, fileRelativePath))) {
    return [];
  }
  const out = git(
    [
      'log',
      `--since=${sinceIso}`,
      '--reverse',
      '--pretty=format:%H%x09%aI%x09%an%x09%s',
      '--follow',
      '--',
      fileRelativePath,
    ],
    palaceRoot
  );
  if (!out.trim()) return [];
  return out.trim().split('\n').map((line) => {
    const [hash, ts, author, ...subjectParts] = line.split('\t');
    return { hash, ts, author, subject: subjectParts.join('\t') };
  });
}

/**
 * Check whether a palace entry has been modified since `sinceIso`. The entry
 * is resolved to its file via resolveEntryPath.
 *
 * @returns {{ resolved: string | null, changed: boolean, commits: Array }}
 */
export function checkPageChange(palaceRoot, entryName, sinceIso) {
  const abs = resolveEntryPath(palaceRoot, entryName);
  if (!abs) {
    return { resolved: null, changed: false, commits: [] };
  }
  // Convert abs back to a path relative to palaceRoot for git.
  const rel = abs.slice(palaceRoot.endsWith('/') ? palaceRoot.length : palaceRoot.length + 1);
  const commits = getChangesSince(palaceRoot, rel, sinceIso);
  return { resolved: abs, changed: commits.length > 0, commits };
}

/**
 * Read the current frontmatter `forward_vector` field of an entry by reading
 * the file directly (not git). Returns null if the file or field is absent.
 *
 * Used by the skill workflow for forward-vector drift detection. The live
 * frontmatter value is the single source of truth; whether it has *changed*
 * since the steward last ran is detected via `checkPageChange` (git commits to
 * the entry since `state.last_active`), NOT against a duplicated copy in
 * state.json — that copy was removed in the Bundle-Local Stewardship SSOT
 * cutover (2026-06-09).
 */
export function readForwardVector(palaceRoot, entryName) {
  const abs = resolveEntryPath(palaceRoot, entryName);
  if (!abs) return null;
  const text = readFileSync(abs, 'utf8');
  const fmMatch = text.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) return null;
  const fm = fmMatch[1];
  // Look for either "forward_vector: ..." (single-line) or "forward_vector: >\n  ..." (block scalar)
  const single = fm.match(/^forward_vector:\s*"?([^"\n]+)"?\s*$/m);
  if (single) return single[1].trim();
  const block = fm.match(/^forward_vector:\s*>\s*\n([\s\S]+?)(?=\n[a-z_]+:|\n$)/m);
  if (block) {
    return block[1].split('\n').map((l) => l.trim()).filter(Boolean).join(' ');
  }
  return null;
}
