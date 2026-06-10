// server/commit.js -- the WRITE counterpart to git.js (which is read-only).
//
// Records a structured palace commit from the LOG deck: stage ONLY the
// explicitly-selected paths, derive the Palace-* trailers from their staged
// diff, and commit a spec-conformant message. The author supplies kind /
// scope / summary / Palace-Verify; the entry/stage/vector trailers are derived.
//
// Two safety lessons carried from scripts/palace-commit.mjs:
//   - NEVER `git add -A`. An N-writer repo (Claude + Cowork + the BBS) must not
//     sweep another session's work; only the named paths are staged, and the
//     commit is scoped to those pathspecs so a foreign pre-staged file is never
//     swept into this commit.
//   - Clear stale Cowork git locks first (the known sharp edge).
//
// Pure trailer derivation lives in src/lib/commit-spec.js; this module is the
// thin async git/fs glue around it (replicated rather than imported from the
// CLI script so the app server bundles cleanly under vite/esbuild).

import { writeFileSync, rmSync, mkdtempSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { safePathspec } from './git.js';
import { execGit } from './git-wrapper.js';
import { deriveTrailers, formatCommitMessage, VERIFY_VALUES } from '../src/lib/commit-spec.js';
import { KNOWN_KINDS } from '../src/lib/commit-parse.js';
import { diffEntryText } from '../src/lib/frontmatter-diff.js';

// Local alias preserves the existing call sites (`gitAsync(root, args)`).
const gitAsync = execGit;

// Clear stale Cowork git locks (harmless if none). The known sharp edge.
export function clearStaleLocks(palaceRoot) {
  for (const f of ['.git/HEAD.lock', '.git/index.lock']) {
    const p = resolve(palaceRoot, f);
    if (existsSync(p)) { try { rmSync(p); } catch (_) { /* ignore */ } }
  }
}

/**
 * Stage the selected paths, derive trailers from THEIR staged diff, and commit
 * exactly those paths. Never throws; returns { ok, shortHash?, subject?, message?, error? }.
 *
 * @param {string} palaceRoot
 * @param {object} opts
 * @param {string[]} opts.paths    palace-relative paths to commit (required, ≥1)
 * @param {string}   opts.kind     a KNOWN_KINDS value
 * @param {string}   opts.summary  the subject summary (required)
 * @param {string}   opts.verify   a VERIFY_VALUES value
 * @param {string}  [opts.scope]
 * @param {string}  [opts.body]
 * @param {string}  [opts.author]  Palace-Author (default 'loudon' — the BBS user)
 * @param {string}  [opts.campaign]
 * @param {string[]}[opts.resolves]
 */
export async function commitSelected(palaceRoot, opts = {}) {
  const {
    paths, kind, scope = null, summary, body = '', verify,
    author = 'loudon', campaign = null, resolves = [],
  } = opts;

  // ── validation ──
  if (!Array.isArray(paths) || paths.length === 0) return { ok: false, error: 'no files selected' };
  if (!KNOWN_KINDS.includes(kind)) return { ok: false, error: `kind must be one of: ${KNOWN_KINDS.join(', ')}` };
  if (typeof summary !== 'string' || summary.trim() === '') return { ok: false, error: 'summary is required' };
  if (!VERIFY_VALUES.includes(verify)) return { ok: false, error: `verify must be one of: ${VERIFY_VALUES.join(', ')}` };

  const safe = [];
  for (const p of paths) {
    const s = safePathspec(palaceRoot, p);
    if (!s) return { ok: false, error: `unsafe or out-of-palace path: ${p}` };
    safe.push(s);
  }
  const selected = new Set(safe);

  clearStaleLocks(palaceRoot);

  // ── stage ONLY the selected paths (never -A) ──
  for (const p of safe) {
    const r = await gitAsync(palaceRoot, ['add', '--', p], { allowFail: true });
    if (r.failed) return { ok: false, error: `git add failed for "${p}": ${(r.stderr || '').trim()}` };
  }

  // ── derive trailers from the selected staged diff only ──
  // `-c core.quotepath=false` forces RAW utf-8 paths in the output. Under git's
  // default (quotepath=true) a non-ASCII path — every em-dash bundle file, e.g.
  // `Foo — baton.md` — comes back octal-escaped + double-quoted, never matches
  // `selected`, and the file silently fails to commit ("nothing staged") even
  // though it WAS staged. Self-defending regardless of repo config.
  const ns = await gitAsync(palaceRoot, ['-c', 'core.quotepath=false', 'diff', '--cached', '--name-status'], { allowFail: true });
  const dpaths = [];
  const mdChanges = [];
  for (const line of ns.stdout.split(/\r?\n/)) {
    if (line.trim() === '') continue;
    const m = line.match(/^([A-Z])\d*\t(.+?)(?:\t(.+))?$/);
    if (!m) continue;
    const status = m[1];
    const path = m[3] || m[2]; // rename: new path is the 3rd field
    if (!selected.has(path)) continue; // scope strictly to the selection
    dpaths.push(path);
    if (!path.toLowerCase().endsWith('.md')) continue;
    const before = status === 'A' ? '' : (await gitAsync(palaceRoot, ['show', `HEAD:${path}`], { allowFail: true })).stdout;
    const after = status === 'D' ? '' : (await gitAsync(palaceRoot, ['show', `:${path}`], { allowFail: true })).stdout;
    const d = diffEntryText(before, after);
    mdChanges.push({ path, frontmatterChanges: d.frontmatterChanges, bodyChanged: d.bodyChanged, wasAdded: status === 'A' || (before === '' && after !== '') });
  }

  if (dpaths.length === 0) return { ok: false, error: 'nothing staged for the selected paths' };

  const trailers = deriveTrailers({ paths: dpaths, mdChanges, kind, verify, author, campaign, resolves });
  const message = formatCommitMessage({ kind, scope, summary, body, trailers });

  // ── commit exactly the selected pathspecs ──
  const tmp = mkdtempSync(join(tmpdir(), 'stig-commit-'));
  const msgFile = join(tmp, 'COMMIT_MSG');
  writeFileSync(msgFile, message, 'utf8');
  try {
    const res = await gitAsync(palaceRoot, ['commit', '-F', msgFile, '--', ...safe], { allowFail: true });
    if (res.failed) return { ok: false, error: (res.stderr || 'git commit failed').trim(), message };
    const shortHash = (await gitAsync(palaceRoot, ['rev-parse', '--short', 'HEAD'], { allowFail: true })).stdout.trim();
    const subject = (await gitAsync(palaceRoot, ['log', '-1', '--format=%s'], { allowFail: true })).stdout.trim();
    return { ok: true, shortHash, subject, committed: dpaths, message };
  } finally {
    try { rmSync(tmp, { recursive: true, force: true }); } catch (_) { /* ignore */ }
  }
}
