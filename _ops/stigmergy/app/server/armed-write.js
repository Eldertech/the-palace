// armed-write.js — the enforced honest-write path for Companion edits (M1c).
//
// This is "Stage B": the actual file write + commit the dry-run preview
// (entry-save.js composePreview) only described. It is deliberately the ONE
// path a Companion edit can take. Its guarantees:
//
//   - allow-list gated: canon / machinery paths are refused (checkAllowList).
//   - YAML-safe: a body-only edit preserves the entry's frontmatter block
//     VERBATIM (no re-emit, so no field-reorder / quoting churn) and swaps only
//     the body. Frontmatter-changing ops would route through emitEntryFile;
//     M1c does body-only.
//   - committed through commitSelected: explicit pathspec, derived Palace-*
//     trailers, never `git add -A`, stale locks cleared first.
//   - quarantined: writes land in a DEDICATED edits worktree on its own branch
//     (decided 2026-06-08), so a Companion edit never touches main or the
//     feature branch until a human merges. Nothing is real until that commit
//     exists — only then does the lane post a PROOF.
//
// applyOp / splitRawFrontmatter are pure and unit-tested; armedWriteEntry and
// ensureEditsWorktree are integration-tested against a temp git repo.

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { checkAllowList } from '../src/lib/entry-edit.js';
import { execGit } from './git-wrapper.js';
import { commitSelected, clearStaleLocks } from './commit.js';

const DEFAULT_EDITS_DIR = '../palace-stigmergy-edits';
const DEFAULT_EDITS_BRANCH = 'stigmergy-edits';

// Split an entry into its verbatim frontmatter block (fences included) and its
// body. No frontmatter → fmBlock ''. Preserving the block verbatim is what
// keeps a body-only edit churn-free.
export function splitRawFrontmatter(text) {
  if (typeof text !== 'string') return { fmBlock: '', body: '' };
  const m = text.match(/^(---\r?\n[\s\S]*?\r?\n---\r?\n)([\s\S]*)$/);
  if (m) return { fmBlock: m[1], body: m[2] };
  return { fmBlock: '', body: text };
}

/**
 * Apply one edit op to a body string. Pure. Returns { ok, body } or
 * { ok:false, error }.
 *
 *   { op:'append',  text }            — add a paragraph at the end
 *   { op:'prepend', text }            — add a paragraph at the start
 *   { op:'rewrite', find, replace }   — replace ONE exact occurrence of `find`
 *   { op:'graffiti', text, find? }    — pin a visible scrawl (an HTML-comment
 *                                       mark). At the top of the body, or right
 *                                       after `find` (the pin point) when given.
 *
 * rewrite refuses when `find` is absent or ambiguous (appears != once) — the
 * Companion must be exact, not guess. "Missing connections are invitations,
 * not errors": a no-op is reported, never silently committed.
 */
export function applyOp(body, op) {
  const b = typeof body === 'string' ? body : '';
  if (!op || typeof op !== 'object') return { ok: false, error: 'no edit op' };
  const text = typeof op.text === 'string' ? op.text.trim() : '';

  if (op.op === 'append') {
    if (!text) return { ok: false, error: 'append: empty text' };
    return { ok: true, body: `${b.replace(/\s+$/, '')}\n\n${text}\n` };
  }
  if (op.op === 'prepend') {
    if (!text) return { ok: false, error: 'prepend: empty text' };
    return { ok: true, body: `${text}\n\n${b.replace(/^\s+/, '')}` };
  }
  if (op.op === 'rewrite') {
    const find = typeof op.find === 'string' ? op.find : '';
    const replace = typeof op.replace === 'string' ? op.replace : '';
    if (!find) return { ok: false, error: 'rewrite: missing "find"' };
    const first = b.indexOf(find);
    if (first === -1) return { ok: false, error: 'rewrite: "find" text not present in the entry' };
    if (b.indexOf(find, first + find.length) !== -1) {
      return { ok: false, error: 'rewrite: "find" is ambiguous (appears more than once) — be more specific' };
    }
    return { ok: true, body: b.slice(0, first) + replace + b.slice(first + find.length) };
  }
  if (op.op === 'graffiti') {
    // The mark is stored as a real HTML comment — invisible in Obsidian/exports,
    // surfaced as a scrawl by STIGMERGY (see EntryBody classifyGraffiti). Strip
    // any comment fence or leading "graffiti:" the worker may have wrapped; we
    // own the canonical form.
    const note = text
      .replace(/^<!--\s*/, '').replace(/\s*-->$/, '')
      .replace(/^graffiti\s*:\s*/i, '').trim();
    if (!note) return { ok: false, error: 'graffiti: empty text' };
    if (note.includes('-->')) return { ok: false, error: 'graffiti: text cannot contain "-->"' };
    const mark = `<!-- graffiti: ${note} -->`;
    const find = typeof op.find === 'string' ? op.find : '';
    if (find) {
      // Pin at the point: insert the mark on its own line after the line that
      // contains `find` (exact + unique, same discipline as rewrite).
      const first = b.indexOf(find);
      if (first === -1) return { ok: false, error: 'graffiti: "find" anchor not present in the entry' };
      if (b.indexOf(find, first + find.length) !== -1) {
        return { ok: false, error: 'graffiti: "find" anchor is ambiguous (appears more than once) — be more specific' };
      }
      const lineEnd = b.indexOf('\n', first + find.length);
      const at = lineEnd === -1 ? b.length : lineEnd;
      return { ok: true, body: b.slice(0, at) + `\n\n${mark}` + b.slice(at) };
    }
    // Default: pin at the top of the body.
    return { ok: true, body: `${mark}\n\n${b.replace(/^\s+/, '')}` };
  }
  return { ok: false, error: `unknown op "${op.op}"` };
}

/**
 * Ensure the dedicated edits worktree exists; return its absolute path. Creates
 * it (and its branch) off the repo's current HEAD on first use, so its entry
 * content matches what the Companion was grounded in. Idempotent.
 */
export async function ensureEditsWorktree(repoRoot, { editsPath, branch = DEFAULT_EDITS_BRANCH } = {}) {
  const root = resolve(repoRoot);
  const target = editsPath ? resolve(editsPath) : resolve(root, DEFAULT_EDITS_DIR);
  if (existsSync(target)) return target; // already set up (idempotent)

  clearStaleLocks(root);
  const list = await execGit(root, ['branch', '--list', branch], { allowFail: true });
  const branchExists = (list.stdout || '').split(/\r?\n/).some((l) => l.replace(/^[*+\s]+/, '').trim() === branch);
  const args = branchExists
    ? ['worktree', 'add', target, branch]
    : ['worktree', 'add', target, '-b', branch];
  const r = await execGit(root, args, { allowFail: true });
  if (r.failed) throw new Error(`could not create edits worktree: ${(r.stderr || '').trim()}`);
  return target;
}

/**
 * Apply one op to an entry in the edits worktree and commit it through the
 * enforced path. Never throws; returns a structured result.
 *
 * @param {object} args
 * @param {string} args.editsRoot — the edits worktree (the write + commit target)
 * @param {string} args.relPath   — palace-relative entry path
 * @param {object} args.op        — { op, text? | find?, replace? }
 * @param {string} [args.summary] — commit subject summary
 * @param {string} [args.verify]  — 'verified' | 'unverified' | 'couldnt'
 * @param {string} [args.author]  — Palace-Author (default 'claude')
 * @param {string} [args.bodyMessage]
 * @param {string} [args.scope]
 * @returns {Promise<{ok, shortHash?, subject?, op?, message?, status?, error?}>}
 */
export async function armedWriteEntry({
  editsRoot, relPath, op, summary, verify = 'unverified',
  author = 'claude', bodyMessage = '', scope,
}) {
  if (!editsRoot) return { ok: false, error: 'no edits worktree configured' };
  const allow = checkAllowList(relPath);
  if (!allow.allowed) return { ok: false, status: 403, error: allow.reason };

  const abs = resolve(editsRoot, relPath);
  if (abs !== resolve(editsRoot) && !abs.startsWith(resolve(editsRoot) + '/')) {
    return { ok: false, status: 400, error: 'path escapes the edits worktree' };
  }
  if (!existsSync(abs)) return { ok: false, status: 404, error: 'entry not found in the edits worktree' };

  const before = readFileSync(abs, 'utf8');
  const { fmBlock, body } = splitRawFrontmatter(before);
  const applied = applyOp(body, op);
  if (!applied.ok) return { ok: false, status: 422, error: applied.error };
  if (applied.body === body) return { ok: false, status: 422, error: 'nothing changed' };

  const after = fmBlock + applied.body;
  try {
    mkdirSync(dirname(abs), { recursive: true });
    clearStaleLocks(editsRoot);
    writeFileSync(abs, after, 'utf8');
  } catch (e) {
    return { ok: false, error: `write failed: ${e.message}` };
  }

  const commit = await commitSelected(editsRoot, {
    paths: [relPath],
    kind: 'edit',
    scope: scope || basenameNoMd(relPath),
    summary: summary || `companion ${op.op}`,
    verify,
    body: bodyMessage,
    author,
  });
  if (!commit.ok) return { ok: false, error: `commit failed: ${commit.error}`, message: commit.message };
  return { ok: true, op: op.op, shortHash: commit.shortHash, subject: commit.subject, message: commit.message };
}

function basenameNoMd(p) {
  if (typeof p !== 'string') return '';
  const slash = p.lastIndexOf('/');
  return (slash === -1 ? p : p.slice(slash + 1)).replace(/\.md$/, '');
}
