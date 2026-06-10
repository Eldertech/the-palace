#!/usr/bin/env node
// palace-commit — the single structured producer of palace commits.
//
// Claude (and STIGMERGY's STATE save path, Phase 5) call this instead of raw
// `git commit`. It stages the paths you name, reads the staged diff, derives
// the Palace-* trailers from it, and commits a spec-conformant message --
// you supply only the kind, summary, and the Palace-Verify honesty call.
//
// Usage:
//   node scripts/palace-commit.mjs \
//     --kind edit --scope "Foo" --summary "tweak the vector" \
//     --verify verified [--body "..."] [--campaign slug] [--resolves id] \
//     [--author claude] [--path "Foo.md" --path "Bar.md"] [--dry-run]
//
// If no --path is given, whatever is already staged is used. Stale Cowork git
// locks are cleared first (the known sharp edge). With --dry-run it prints the
// message it WOULD commit and exits without committing.
//
// Design notes:
//   - Trailer derivation is pure (src/lib/commit-spec.js); this file is the
//     git/fs glue around it, kept thin and testable via buildMessageFromStaged.
//   - Entries/stages/vectors are derived from the staged frontmatter diff, so
//     the author never types them.
//   - NEVER `git add -A`: an N-writer repo must not sweep another session's
//     work (the hard Phase 2 lesson). Only explicit --path args are staged.

import { execFileSync } from 'node:child_process';
import { existsSync, rmSync, writeFileSync, mkdtempSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { deriveTrailers, formatCommitMessage } from '../src/lib/commit-spec.js';
import { diffEntryText } from '../src/lib/frontmatter-diff.js';

function git(palaceRoot, args, { allowFail = false } = {}) {
  try {
    return execFileSync('git', args, { cwd: palaceRoot, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  } catch (e) {
    if (allowFail) return '';
    throw e;
  }
}

// Clear stale Cowork git locks (harmless if none). The known sharp edge.
export function clearStaleLocks(palaceRoot) {
  for (const f of ['.git/HEAD.lock', '.git/index.lock']) {
    const p = resolve(palaceRoot, f);
    if (existsSync(p)) {
      try { rmSync(p); } catch (_) { /* ignore */ }
    }
  }
}

// Read the staged diff and compute per-md frontmatter changes. Returns
// { paths, mdChanges } in the shape deriveTrailers expects.
export function readStagedDiff(palaceRoot) {
  // `-c core.quotepath=false`: RAW utf-8 paths, so a non-ASCII filename (every
  // em-dash bundle file, e.g. `Foo — baton.md`) parses + matches instead of
  // coming back octal-escaped + double-quoted. Without it the file stages but is
  // silently dropped from the commit. (Mirrors commitSelected in server/commit.js.)
  const nameStatus = git(palaceRoot, ['-c', 'core.quotepath=false', 'diff', '--cached', '--name-status'], { allowFail: true });
  const paths = [];
  const mdChanges = [];
  for (const line of nameStatus.split(/\r?\n/)) {
    if (line.trim() === '') continue;
    const m = line.match(/^([A-Z])\d*\t(.+?)(?:\t(.+))?$/);
    if (!m) continue;
    const status = m[1];
    const path = m[3] || m[2]; // for renames, the new path is the 3rd field
    paths.push(path);
    if (!path.toLowerCase().endsWith('.md')) continue;

    // before = HEAD:path (empty if added), after = staged blob (:path).
    const before = status === 'A' ? '' : git(palaceRoot, ['show', `HEAD:${path}`], { allowFail: true });
    const after = status === 'D' ? '' : git(palaceRoot, ['show', `:${path}`], { allowFail: true });
    const d = diffEntryText(before, after);
    mdChanges.push({
      path,
      frontmatterChanges: d.frontmatterChanges,
      bodyChanged: d.bodyChanged,
      wasAdded: status === 'A' || (before === '' && after !== ''),
    });
  }
  return { paths, mdChanges };
}

// Build the full commit message from the staged diff + the author's inputs.
// Pure-ish: only reads git (no commit). Exposed for tests.
export function buildMessageFromStaged(palaceRoot, opts) {
  const { paths, mdChanges } = readStagedDiff(palaceRoot);
  const trailers = deriveTrailers({
    paths,
    mdChanges,
    kind: opts.kind,
    verify: opts.verify,
    author: opts.author ?? 'claude',
    campaign: opts.campaign ?? null,
    resolves: opts.resolves ?? [],
    explicitEntries: opts.explicitEntries ?? null,
  });
  return formatCommitMessage({
    kind: opts.kind,
    scope: opts.scope ?? null,
    summary: opts.summary,
    body: opts.body ?? '',
    trailers,
  });
}

function parseArgs(argv) {
  const opts = { resolves: [], paths: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    const next = () => argv[++i];
    switch (a) {
      case '--kind': opts.kind = next(); break;
      case '--scope': opts.scope = next(); break;
      case '--summary': opts.summary = next(); break;
      case '--body': opts.body = next(); break;
      case '--verify': opts.verify = next(); break;
      case '--author': opts.author = next(); break;
      case '--campaign': opts.campaign = next(); break;
      case '--resolves': opts.resolves.push(next()); break;
      case '--path': opts.paths.push(next()); break;
      case '--dry-run': opts.dryRun = true; break;
      default: break;
    }
  }
  return opts;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const palaceRoot = process.env.PALACE_ROOT
    ? resolve(process.env.PALACE_ROOT)
    : resolve(git(process.cwd(), ['rev-parse', '--show-toplevel']).trim());

  if (!opts.kind || !opts.summary || !opts.verify) {
    process.stderr.write('palace-commit: --kind, --summary, and --verify are required.\n');
    process.exit(2);
  }

  clearStaleLocks(palaceRoot);

  // Stage explicitly-named paths (NEVER -A).
  for (const p of opts.paths) {
    git(palaceRoot, ['add', '--', p]);
  }

  // quotepath=false for consistency with readStagedDiff (this one only checks
  // emptiness, but keep both path-reads in the same raw-utf-8 frame).
  const staged = git(palaceRoot, ['-c', 'core.quotepath=false', 'diff', '--cached', '--name-only'], { allowFail: true }).trim();
  if (staged === '') {
    process.stderr.write('palace-commit: nothing staged. Name paths with --path, or stage first.\n');
    process.exit(2);
  }

  const message = buildMessageFromStaged(palaceRoot, opts);

  if (opts.dryRun) {
    process.stdout.write(message);
    process.exit(0);
  }

  const tmp = mkdtempSync(join(tmpdir(), 'palace-commit-'));
  const msgFile = join(tmp, 'COMMIT_MSG');
  writeFileSync(msgFile, message, 'utf8');
  try {
    execFileSync('git', ['commit', '-F', msgFile], { cwd: palaceRoot, stdio: 'inherit' });
  } finally {
    try { rmSync(tmp, { recursive: true, force: true }); } catch (_) { /* ignore */ }
  }
  process.exit(0);
}

const invokedDirectly = process.argv[1] && process.argv[1].endsWith('palace-commit.mjs');
if (invokedDirectly) main();
