// armed-write.js — the enforced honest-write path for Companion edits.
//
// "Show before editing" (2026-06-09): the companion PROPOSES an edit, Loudon
// approves the inline diff, and only then is it committed — directly to the live
// palace (the quarantine branch was retired; git is the backstop). Two halves:
//
//   - previewEdit: validate an op against the LIVE entry and compute its result
//     WITHOUT writing — the diff the window shows for approval. Read-only.
//   - armedWriteEntry: on approval, write + commit to the repo. Guarantees:
//       · allow-list gated (checkAllowList) — UNLESS trickster:true, which keeps
//         path-safety (checkPathSafety) but bypasses the canon/care refusal so a
//         trusted operator can write anywhere ([[Trickster Commit]]);
//       · YAML-safe — a body edit preserves the frontmatter block VERBATIM and
//         swaps only the body; set-vector touches only the forward_vector line;
//       · committed through commitSelected — explicit pathspec, derived Palace-*
//         trailers, never `git add -A`, stale locks cleared first.
//
// applyOp / setForwardVector / splitRawFrontmatter / previewEdit are pure (or
// read-only) and unit-tested; armedWriteEntry + revertCommit are integration-
// tested against a temp git repo.

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { checkAllowList, checkPathSafety } from '../src/lib/entry-edit.js';
import { execGit } from './git-wrapper.js';
import { commitSelected, clearStaleLocks } from './commit.js';
import { formatScalar } from '../src/lib/yaml-emit.js';

// Split an entry into its verbatim frontmatter block (fences included) and its
// body. No frontmatter → fmBlock ''. Preserving the block verbatim is what
// keeps a body-only edit churn-free.
export function splitRawFrontmatter(text) {
  if (typeof text !== 'string') return { fmBlock: '', body: '' };
  const m = text.match(/^(---\r?\n[\s\S]*?\r?\n---\r?\n)([\s\S]*)$/);
  if (m) return { fmBlock: m[1], body: m[2] };
  return { fmBlock: '', body: text };
}

// Best-effort unquote of a raw YAML scalar, for the "from" side of a vector
// flag. Display-only; the canonical value is re-emitted via formatScalar.
function unquoteYaml(raw) {
  const s = (raw == null ? '' : String(raw)).trim();
  if (s.length >= 2 && s[0] === '"' && s.endsWith('"')) {
    return s.slice(1, -1).replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\\\/g, '\\');
  }
  if (s.length >= 2 && s[0] === "'" && s.endsWith("'")) return s.slice(1, -1).replace(/''/g, "'");
  return s;
}

/**
 * Set THIS entry's `forward_vector` inside a VERBATIM frontmatter block,
 * touching only that one line. Unlike a full re-emit (emitEntryFile), this does
 * NOT reorder fields or restyle arrays, so an entry not already in canonical
 * order keeps a churn-free, signal-only diff. forward_vector is ALWAYS a single
 * quoted line in the palace (ALWAYS_QUOTE), so a line replacement is exact.
 * Refuses a block-scalar (|, >) vector rather than corrupting a multi-line value.
 * Pure. Returns { ok, fmBlock, oldValue } or { ok:false, error }.
 */
export function setForwardVector(fmBlock, newVector) {
  if (typeof fmBlock !== 'string' || fmBlock === '') return { ok: false, error: 'no frontmatter to edit' };
  const v = typeof newVector === 'string' ? newVector.trim() : '';
  if (!v) return { ok: false, error: 'empty forward vector' };
  if (v.includes('\n')) return { ok: false, error: 'forward vector must be a single line' };
  const formatted = formatScalar(v, 'forward_vector'); // quoted + escaped, one line

  const present = fmBlock.match(/^forward_vector:[ \t]*(.*)$/m);
  if (present) {
    const oldRaw = present[1];
    if (/^[|>]/.test(oldRaw.trim())) {
      return { ok: false, error: 'forward_vector is a multi-line block scalar — not editable yet' };
    }
    const next = fmBlock.replace(/^forward_vector:[ \t]*.*$/m, `forward_vector: ${formatted}`);
    return { ok: true, fmBlock: next, oldValue: unquoteYaml(oldRaw) };
  }
  // Absent: insert just before the closing fence (no re-order of existing fields).
  const m = fmBlock.match(/^([\s\S]*\n)(---\r?\n?)$/);
  if (!m) return { ok: false, error: 'malformed frontmatter block' };
  return { ok: true, fmBlock: `${m[1]}forward_vector: ${formatted}\n${m[2]}`, oldValue: null };
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
 * Validate one edit op against the LIVE entry and compute its result WITHOUT
 * writing — the "propose" half of show-before-editing. The reap calls this to
 * decide whether to offer a proposal (and what diff to show); armedWriteEntry
 * calls it again before committing. Read-only over the filesystem. Returns
 * { ok, op, before, after, vectorChange } or { ok:false, status, error }.
 *
 *   set-vector  — touches only the forward_vector line; vectorChange = {from,to}
 *   append/prepend/rewrite/graffiti — edit the body; frontmatter preserved
 *
 * `opts.trickster` (default false) bypasses the CARE refusal (canon / ceremony /
 * machinery) but NEVER the SECURITY refusal (repo escape, NUL, non-.md, VCS /
 * build trees). Same pipeline, one gate swapped — the trusted hand reaches
 * everywhere git can insure. See [[Trickster Commit]].
 */
export function previewEdit(repoRoot, relPath, op, { trickster = false } = {}) {
  if (!repoRoot) return { ok: false, error: 'no repo configured' };
  const allow = trickster ? checkPathSafety(relPath) : checkAllowList(relPath);
  if (!allow.allowed) return { ok: false, status: 403, error: allow.reason };

  const abs = resolve(repoRoot, relPath);
  if (abs !== resolve(repoRoot) && !abs.startsWith(resolve(repoRoot) + '/')) {
    return { ok: false, status: 400, error: 'path escapes the repo' };
  }
  if (!existsSync(abs)) return { ok: false, status: 404, error: 'entry not found' };

  const before = readFileSync(abs, 'utf8');
  const { fmBlock, body } = splitRawFrontmatter(before);

  if (op && op.op === 'set-vector') {
    if (!fmBlock) return { ok: false, status: 422, error: 'entry has no frontmatter to edit' };
    const sv = setForwardVector(fmBlock, op.text);
    if (!sv.ok) return { ok: false, status: 422, error: sv.error };
    if (sv.fmBlock === fmBlock) return { ok: false, status: 422, error: 'nothing changed' };
    return { ok: true, op, before, after: sv.fmBlock + body, vectorChange: { from: sv.oldValue, to: (op.text || '').trim() } };
  }
  const applied = applyOp(body, op);
  if (!applied.ok) return { ok: false, status: 422, error: applied.error };
  if (applied.body === body) return { ok: false, status: 422, error: 'nothing changed' };
  return { ok: true, op, before, after: fmBlock + applied.body, vectorChange: null };
}

/**
 * Apply one approved op to an entry and commit it through the enforced path —
 * directly to the LIVE repo (no quarantine). Re-previews first (so a stale
 * proposal that no longer applies fails honestly), then writes + commits the
 * single file. Never throws; returns a structured result.
 *
 * @param {object} args
 * @param {string} args.repoRoot   — the repo to write + commit into (the palace)
 * @param {string} args.relPath    — palace-relative entry path
 * @param {object} args.op         — { op, text? | find?, replace? }
 * @param {string} [args.summary]  — commit subject summary
 * @param {string} [args.verify]   — 'verified' | 'unverified' | 'couldnt'
 * @param {string} [args.author]   — Palace-Author (default 'claude'; the
 *   Trickster lane passes 'trickster')
 * @param {string} [args.bodyMessage]
 * @param {string} [args.scope]
 * @param {boolean} [args.trickster] — bypass the CARE gate (canon/machinery),
 *   keep path-safety. Branding is the caller's job (author 'trickster').
 * @param {string} [args.kind] — the commit kind (default 'edit'). The Weave
 *   executor passes 'weave' so an applied proposal reads as a weave action in
 *   the LOG; any KNOWN_KIND commitSelected accepts is valid.
 * @returns {Promise<{ok, shortHash?, subject?, op?, message?, vectorChange?, status?, error?}>}
 */
export async function armedWriteEntry({
  repoRoot, relPath, op, summary, verify = 'unverified',
  author = 'claude', bodyMessage = '', scope, trickster = false, kind = 'edit',
}) {
  const pv = previewEdit(repoRoot, relPath, op, { trickster });
  if (!pv.ok) return pv;

  const abs = resolve(repoRoot, relPath);
  try {
    mkdirSync(dirname(abs), { recursive: true });
    clearStaleLocks(repoRoot);
    writeFileSync(abs, pv.after, 'utf8');
  } catch (e) {
    return { ok: false, error: `write failed: ${e.message}` };
  }

  const commit = await commitSelected(repoRoot, {
    paths: [relPath],
    kind,
    scope: scope || basenameNoMd(relPath),
    summary: summary || `companion ${op.op}`,
    verify,
    body: bodyMessage,
    author,
  });
  if (!commit.ok) return { ok: false, error: `commit failed: ${commit.error}`, message: commit.message };
  return { ok: true, op: op.op, shortHash: commit.shortHash, subject: commit.subject, message: commit.message, vectorChange: pv.vectorChange };
}

function basenameNoMd(p) {
  if (typeof p !== 'string') return '';
  const slash = p.lastIndexOf('/');
  return (slash === -1 ? p : p.slice(slash + 1)).replace(/\.md$/, '');
}

/**
 * Revert ONE prior Companion edit commit, creating a new honest inverse commit —
 * never a silent rollback. Uses git's 3-way revert so any later edits to the
 * same entry are preserved rather than clobbered. On conflict it aborts and
 * reports, rather than leaving the tree mid-revert. Never throws.
 *
 * @param {object} args
 * @param {string} args.repoRoot — the repo to revert in (the palace)
 * @param {string} args.hash     — the commit to revert (7–40 hex)
 * @returns {Promise<{ok, revertHash?, subject?, error?}>}
 */
export async function revertCommit({ repoRoot, hash }) {
  if (!repoRoot) return { ok: false, error: 'no repo configured' };
  const h = String(hash == null ? '' : hash).trim();
  if (!/^[0-9a-f]{7,40}$/i.test(h)) return { ok: false, error: 'invalid commit hash' };

  clearStaleLocks(repoRoot);
  const exists = await execGit(repoRoot, ['cat-file', '-e', `${h}^{commit}`], { allowFail: true });
  if (exists.failed) return { ok: false, error: 'commit not found' };

  const r = await execGit(repoRoot, ['revert', '--no-edit', h], { allowFail: true });
  if (r.failed) {
    // Don't strand the tree mid-revert (dirty tree, or a later edit conflicts).
    await execGit(repoRoot, ['revert', '--abort'], { allowFail: true });
    return { ok: false, error: `could not revert cleanly (a later edit may conflict, or the tree is dirty): ${(r.stderr || '').trim()}` };
  }
  const revertHash = (await execGit(repoRoot, ['rev-parse', '--short', 'HEAD'], { allowFail: true })).stdout.trim();
  const subject = (await execGit(repoRoot, ['log', '-1', '--format=%s'], { allowFail: true })).stdout.trim();
  return { ok: true, revertHash, subject };
}
