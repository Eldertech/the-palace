// cycle-commit.js — a steward's cycle commits what it shipped (decided 2026-09-25).
//
// A made thing that is not in git is lost the day the tree is cleaned, and a
// shipped thing is not a proposal waiting on review — it is the steward's work.
// So when a cycle ends, process-cycle.js commits the files that cycle's own
// messages declared, together with its scroll, its machinery and the board.
//
// The model never runs git; this deterministic step does, through the house
// committer (`palace-commit.mjs --only`), so the commit holds exactly the named
// paths even while other writers have work staged. What may ride along is
// narrow on purpose:
//   - inside the steward's own bundle folder (a steward's workshop),
//   - an existing file, 10 MB or smaller (larger files stay uncommitted and are
//     named in the commit body),
//   - never an entry: a `.md` whose frontmatter carries `type:` is the house,
//     and the house changes only through an elder. Some bundles hold their own
//     entry (`Projects/BLUELINE/BLUELINE.md`), so the folder rule alone is not
//     enough.

import { execFileSync } from 'node:child_process';
import { existsSync, statSync, readFileSync } from 'node:fs';
import { resolve, relative, isAbsolute, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { payloadPathArtifacts } from './scroll-file.js';
import { declaredPathsOf } from './artifact-backstop.js';

export const MAX_COMMIT_BYTES = 10 * 1024 * 1024;

const HERE = dirname(fileURLToPath(import.meta.url));
export const COMMITTER_DEFAULT = resolve(HERE, '../../app/scripts/palace-commit.mjs');

/** Every file path a set of messages declares as made (artifacts, legacy fields, path-like payload fields). */
export function shippedPaths(messages) {
  const out = new Set();
  for (const m of messages || []) {
    const p = m && m.payload;
    if (!p || typeof p !== 'object') continue;
    for (const x of declaredPathsOf(p)) out.add(x);
    if (Array.isArray(p.artifacts)) for (const a of p.artifacts) if (typeof a === 'string') out.add(a);
    for (const a of payloadPathArtifacts(p)) out.add(a.path);
  }
  return [...out].map((x) => String(x).trim()).filter(Boolean);
}

/** True when the file is a palace entry — a `.md` whose frontmatter declares a `type`. */
export function isEntryFile(absPath) {
  if (!absPath.toLowerCase().endsWith('.md')) return false;
  let head = '';
  try { head = readFileSync(absPath, 'utf8').slice(0, 4096); } catch { return false; }
  const m = head.match(/^---\n([\s\S]*?)\n---/);
  return !!(m && /^type:\s*\S/m.test(m[1]));
}

/**
 * Sort declared paths into what this cycle may commit and why the rest may not.
 * Paths come back palace-relative.
 */
export function selectCommitPaths({ palaceRoot, bundleDir, paths, maxBytes = MAX_COMMIT_BYTES }) {
  const root = resolve(palaceRoot);
  const bundle = bundleDir ? resolve(root, bundleDir) : null;
  const result = { paths: [], oversize: [], outside: [], missing: [], entries: [] };
  const seen = new Set();
  for (const raw of paths || []) {
    const abs = isAbsolute(raw) ? resolve(raw) : resolve(root, raw);
    const rel = relative(root, abs);
    if (seen.has(rel)) continue;
    seen.add(rel);
    const inBundle = bundle && !relative(bundle, abs).startsWith('..') && !isAbsolute(relative(bundle, abs));
    if (rel.startsWith('..') || isAbsolute(rel) || !inBundle) { result.outside.push(rel); continue; }
    if (!existsSync(abs) || !statSync(abs).isFile()) { result.missing.push(rel); continue; }
    if (isEntryFile(abs)) { result.entries.push(rel); continue; }
    const bytes = statSync(abs).size;
    if (bytes > maxBytes) { result.oversize.push({ path: rel, bytes }); continue; }
    result.paths.push(rel);
  }
  return result;
}

/** The first shipped message's headline, for the commit subject. */
export function headlineOf(messages) {
  for (const m of messages || []) {
    const p = (m && m.payload) || {};
    const h = p.headline || p.subject || p.summary || p.question || p.content;
    if (typeof h === 'string' && h.trim()) {
      const one = h.replace(/\s+/g, ' ').trim();
      return one.length > 72 ? `${one.slice(0, 71)}…` : one;
    }
  }
  return 'machinery and scroll';
}

const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

/**
 * Commit the named paths through the house committer. Retries briefly when
 * another writer holds the git lock. Never throws: a failed commit leaves the
 * files on disk, uncommitted, exactly as before this step existed.
 *
 * @returns {{ ok: boolean, hash: string|null, nothing?: boolean, error?: string }}
 */
export function commitPaths({ palaceRoot, paths, kind = 'steward', scope, summary, body = '', verify = 'unverified', author = 'claude', committer = COMMITTER_DEFAULT, retries = 3, exec = execFileSync }) {
  if (!paths || paths.length === 0) return { ok: true, hash: null, nothing: true };
  const args = [committer, '--only', '--kind', kind, '--summary', summary, '--verify', verify, '--author', author];
  if (scope) args.push('--scope', scope);
  if (body) args.push('--body', body);
  for (const p of paths) args.push('--path', p);
  let lastErr = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const out = exec('node', args, { cwd: palaceRoot, encoding: 'utf8', env: { ...process.env, PALACE_ROOT: palaceRoot }, stdio: ['ignore', 'pipe', 'pipe'] });
      const m = String(out).match(/palace-commit: committed ([0-9a-f]{7,40})/);
      if (m) return { ok: true, hash: m[1] };
      if (/nothing to commit/.test(String(out))) return { ok: true, hash: null, nothing: true };
      return { ok: false, hash: null, error: `unexpected committer output: ${String(out).slice(-300)}` };
    } catch (e) {
      lastErr = String((e && (e.stderr || e.message)) || e);
      if (!/index\.lock|could not lock|Unable to create/i.test(lastErr)) break;
      sleep(400 * (attempt + 1));
    }
  }
  return { ok: false, hash: null, error: lastErr ? lastErr.slice(-500) : 'unknown' };
}

/**
 * The whole step for one cycle: pick what may ride, then commit it with the
 * cycle's machinery, scroll and the board.
 */
export function commitCycle({ palaceRoot, home, cycleN, bundleDir, messages, extraPaths = [], maxBytes = MAX_COMMIT_BYTES, committer, exec }) {
  const pick = selectCommitPaths({ palaceRoot, bundleDir, paths: shippedPaths(messages), maxBytes });
  const root = resolve(palaceRoot);
  const extras = extraPaths
    .map((p) => relative(root, isAbsolute(p) ? p : join(root, p)))
    .filter((rel) => !rel.startsWith('..') && existsSync(join(root, rel)));
  const all = [...new Set([...pick.paths, ...extras])];
  const lines = [];
  if (pick.paths.length) lines.push(`Shipped this cycle:\n${pick.paths.map((p) => `- ${p}`).join('\n')}`);
  if (pick.oversize.length) lines.push(`Left uncommitted, over ${Math.round(maxBytes / 1048576)} MB:\n${pick.oversize.map((o) => `- ${o.path} (${(o.bytes / 1048576).toFixed(1)} MB)`).join('\n')}`);
  if (pick.entries.length) lines.push(`Not committed — entries change only through an elder:\n${pick.entries.map((p) => `- ${p}`).join('\n')}`);
  if (pick.outside.length) lines.push(`Not committed — outside the steward's bundle:\n${pick.outside.map((p) => `- ${p}`).join('\n')}`);
  lines.push('Committed by process-cycle.js after the cycle; the steward did not run git.');
  const res = commitPaths({
    palaceRoot, paths: all, kind: 'steward', scope: home,
    summary: `cycle ${cycleN} — ${headlineOf(messages)}`,
    body: lines.join('\n\n'), committer, exec,
  });
  return { ...res, paths: all, shipped: pick.paths, oversize: pick.oversize, entries: pick.entries, outside: pick.outside, missing: pick.missing };
}
