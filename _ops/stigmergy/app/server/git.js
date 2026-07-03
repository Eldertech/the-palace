// Git adapter (server-side). Spawns `git` against the palace root with
// argument arrays (never a shell string), so a path or ref can never be
// interpreted as a shell command. Hands raw stdout to the pure parsers in
// src/lib/git-log-parse.js + commit-parse.js.
//
// The LOG deck is the retrospective surface; git is the work's record, so
// this adapter is read-only -- it never commits, resets, or mutates the
// working tree. (Writing structured commits is Phase 3's palace-commit.)

import { resolve, sep } from 'node:path';
import {
  LOG_FORMAT, GRAPH_FORMAT, parseLogMeta, parseNumstat, parsePorcelain, RECORD_SEP, FIELD_SEP,
  parseWorktreePorcelain, parseAheadBehind, parseGraphLog,
} from '../src/lib/git-log-parse.js';
import { classifyCommit } from '../src/lib/commit-parse.js';
import { diffEntryText } from '../src/lib/frontmatter-diff.js';
import { execGit } from './git-wrapper.js';

// Local alias preserves the existing call sites (`git(root, args)`).
const git = execGit;

// Validate a palace-relative path for use as a git pathspec. Must stay inside
// the palace root, no traversal, no leading slash. Returns the cleaned
// relative path or null.
export function safePathspec(palaceRoot, rel) {
  if (typeof rel !== 'string' || rel === '' || rel.includes('\0')) return null;
  const root = resolve(palaceRoot);
  const abs = resolve(root, rel);
  if (abs !== root && !abs.startsWith(root + sep)) return null;
  return abs.slice(root.length + 1).replaceAll(sep, '/');
}

// Validate a commit-ish (sha or ref). Conservative allow-list: hex shas,
// and a few safe symbolic refs. Rejects anything with shell-ish or
// option-like characters so it can't be read as a flag.
export function safeRef(ref) {
  if (typeof ref !== 'string' || ref === '') return null;
  if (/^[0-9a-fA-F]{4,40}$/.test(ref)) return ref;
  if (/^(HEAD|HEAD~\d+|HEAD\^\d*)$/.test(ref)) return ref;
  return null;
}

// Fetch the commit stream. `limit` caps the number of commits; `pathspec`
// (optional, palace-relative) filters to a single entry's history. Returns
// an array of fully classified commit cards, newest first.
export async function readLog(palaceRoot, { limit = 100, pathspec = null } = {}) {
  const safeLimit = Math.max(1, Math.min(2000, parseInt(limit, 10) || 100));
  const baseArgs = ['log', `-n`, String(safeLimit), '--no-color'];

  let pathArgs = [];
  if (pathspec) {
    const ps = safePathspec(palaceRoot, pathspec);
    if (!ps) return { commits: [], error: 'invalid pathspec' };
    pathArgs = ['--', ps];
  }

  // Pass 1: metadata (hash/author/date/subject/body).
  const metaArgs = [...baseArgs, `--format=${LOG_FORMAT}`, ...pathArgs];
  // Pass 2: numstat keyed by hash.
  const statArgs = [...baseArgs, `--format=${RECORD_SEP}%H`, '--numstat', ...pathArgs];

  const [metaRes, statRes] = await Promise.all([
    git(palaceRoot, metaArgs),
    git(palaceRoot, statArgs),
  ]);

  const meta = parseLogMeta(metaRes.stdout);
  const stats = parseNumstat(statRes.stdout);

  const commits = meta.map((c) => {
    const stat = stats.get(c.hash) ?? { files: [], added: 0, deleted: 0 };
    const paths = stat.files.map((f) => f.path);
    const classified = classifyCommit({ subject: c.subject, body: c.body, paths });
    return {
      hash: c.hash,
      shortHash: c.shortHash,
      author: c.authorName,
      authorEmail: c.authorEmail,
      date: c.authorDate,
      subject: c.subject,
      body: c.body,
      files: stat.files,
      added: stat.added,
      deleted: stat.deleted,
      fileCount: stat.files.length,
      ...classified,
    };
  });

  return { commits, count: commits.length };
}

// Fetch one commit's palace-aware diff. For each changed .md file we read its
// before/after content via `git show <sha>^:<path>` and `git show <sha>:<path>`
// and compute field-level frontmatter changes + a body-changed flag. Non-md
// files report their numstat only; newly-added media inside a bundle are
// flagged so the UI can render them inline.
export async function readCommit(palaceRoot, sha) {
  const ref = safeRef(sha);
  if (!ref) return null;

  // Metadata for this single commit.
  const metaRes = await git(palaceRoot, ['show', '-s', `--format=${LOG_FORMAT}`, '--no-color', ref], { allowFail: true });
  if (metaRes.failed) return null;
  const [meta] = parseLogMeta(metaRes.stdout);
  if (!meta) return null;

  // numstat for the commit.
  const statRes = await git(palaceRoot, ['show', `--format=${RECORD_SEP}%H`, '--numstat', '--no-color', ref], { allowFail: true });
  const stats = parseNumstat(statRes.stdout);
  const stat = stats.get(meta.hash) ?? { files: [], added: 0, deleted: 0 };

  // Per-file palace-aware diffs.
  const fileDiffs = [];
  for (const f of stat.files) {
    const isMd = f.path.toLowerCase().endsWith('.md');
    const mediaExts = /\.(png|jpe?g|gif|svg|webp|wav|mp3|ogg|m4a|flac|mp4|webm|mov)$/i;
    const isMedia = mediaExts.test(f.path);

    if (isMd) {
      const ps = safePathspec(palaceRoot, f.path);
      let beforeText = '';
      let afterText = '';
      if (ps) {
        const [b, a] = await Promise.all([
          git(palaceRoot, ['show', `${ref}^:${ps}`], { allowFail: true }),
          git(palaceRoot, ['show', `${ref}:${ps}`], { allowFail: true }),
        ]);
        beforeText = b.failed ? '' : b.stdout;
        afterText = a.failed ? '' : a.stdout;
      }
      const d = diffEntryText(beforeText, afterText);
      fileDiffs.push({
        path: f.path, kind: 'md', added: f.added, deleted: f.deleted, binary: f.binary,
        frontmatterChanges: d.frontmatterChanges,
        bodyChanged: d.bodyChanged,
        wasAdded: beforeText === '' && afterText !== '',
        wasRemoved: beforeText !== '' && afterText === '',
      });
    } else if (isMedia) {
      fileDiffs.push({
        path: f.path, kind: 'media', added: f.added, deleted: f.deleted, binary: f.binary,
        wasAdded: f.deleted === 0 && f.binary, // best-effort; the UI renders it inline regardless
      });
    } else {
      fileDiffs.push({
        path: f.path, kind: 'file', added: f.added, deleted: f.deleted, binary: f.binary,
      });
    }
  }

  const classified = classifyCommit({
    subject: meta.subject, body: meta.body, paths: stat.files.map((f) => f.path),
  });

  return {
    hash: meta.hash,
    shortHash: meta.shortHash,
    author: meta.authorName,
    authorEmail: meta.authorEmail,
    date: meta.authorDate,
    subject: meta.subject,
    body: meta.body,
    added: stat.added,
    deleted: stat.deleted,
    fileCount: stat.files.length,
    fileDiffs,
    ...classified,
  };
}

// The working-tree delta -- uncommitted work, the invisible-dive hazard made
// visible. Returns the porcelain breakdown plus a count.
export async function readUncommitted(palaceRoot) {
  // NB: `git status --porcelain` takes no `--no-color` flag (porcelain output
  // is never colored); passing it makes git error out, so we omit it.
  const res = await git(palaceRoot, ['status', '--porcelain=v1'], { allowFail: true });
  if (res.failed) return { staged: [], unstaged: [], untracked: [], total: 0, error: res.stderr || 'git status failed' };
  const parsed = parsePorcelain(res.stdout);
  const total = parsed.staged.length + parsed.unstaged.length + parsed.untracked.length;
  return { ...parsed, total };
}

// The worktree topology -- every linked checkout of this repo, each with its
// branch, HEAD, ahead/behind counts (vs the base branch AND vs its upstream),
// dirty-file count, and lock/prune state. Read-only and self-scoped: it never
// prunes, removes, or mutates a worktree -- the cross-agent-kill lesson. The
// app runs inside one worktree (the host); `git worktree list` from any linked
// checkout sees them all because they share one .git.
//
// `base` is the branch feature lanes are measured against (default `main`).
export async function readGitState(palaceRoot, { base = 'main' } = {}) {
  const wtRes = await git(palaceRoot, ['worktree', 'list', '--porcelain'], { allowFail: true });
  if (wtRes.failed) {
    return { worktrees: [], base, host: null, error: wtRes.stderr || 'git worktree list failed' };
  }
  const records = parseWorktreePorcelain(wtRes.stdout);
  const hostAbs = resolve(palaceRoot);

  const worktrees = await Promise.all(records.map(async (wt) => {
    const wtAbs = resolve(wt.path);
    const isHost = wtAbs === hostAbs;
    const ref = wt.branch ? `refs/heads/${wt.branch}` : wt.head;

    // Ahead/behind vs the base branch. Skip when this worktree IS the base
    // (0/0 is uninteresting) or has no resolvable ref.
    let aheadBehind = null;
    if (ref && wt.branch !== base) {
      const r = await git(palaceRoot, ['rev-list', '--left-right', '--count', `${base}...${ref}`], { allowFail: true });
      if (!r.failed) aheadBehind = parseAheadBehind(r.stdout);
    } else if (wt.branch === base) {
      aheadBehind = { behind: 0, ahead: 0 };
    }

    // Ahead/behind vs the branch's own upstream, computed inside the worktree
    // so `@{u}` resolves. Null when no upstream is configured or the dir is
    // gone (prunable) -- both are non-errors here.
    let upstream = null;
    if (!wt.prunable && !wt.detached) {
      const u = await git(wtAbs, ['rev-list', '--left-right', '--count', '@{u}...HEAD'], { allowFail: true });
      if (!u.failed) upstream = parseAheadBehind(u.stdout);
    }

    // Dirty count -- run status inside the worktree. A prunable/missing dir
    // reports null (rendered as "gone"), never an error.
    let dirty = null;
    if (!wt.prunable) {
      const s = await git(wtAbs, ['status', '--porcelain=v1'], { allowFail: true });
      if (!s.failed) {
        const p = parsePorcelain(s.stdout);
        dirty = p.staged.length + p.unstaged.length + p.untracked.length;
      }
    }

    // Last commit on this HEAD (subject + ISO + relative age).
    let last = null;
    if (wt.head) {
      const l = await git(palaceRoot, ['log', '-1', `--format=%s${FIELD_SEP}%aI${FIELD_SEP}%cr`, wt.head], { allowFail: true });
      if (!l.failed) {
        const [subject, iso, rel] = l.stdout.trim().split(FIELD_SEP);
        last = { subject: subject ?? '', date: iso ?? '', relative: rel ?? '' };
      }
    }

    // A short, render-ready name: the worktree dir's basename.
    const name = wtAbs.slice(wtAbs.lastIndexOf(sep) + 1) || wtAbs;

    return {
      path: wt.path, name, isHost,
      head: wt.head, shortHead: wt.shortHead,
      branch: wt.branch, detached: wt.detached, bare: wt.bare,
      locked: wt.locked, lockedReason: wt.lockedReason,
      prunable: wt.prunable, prunableReason: wt.prunableReason,
      aheadBehind, upstream, dirty, last,
    };
  }));

  const host = worktrees.find((w) => w.isHost) ?? null;
  return { worktrees, base, host };
}

// The real commit DAG behind the worktrees -- every commit reachable from the
// worktree tips down to a drawn root. By default the root is the octopus
// merge-base of all tips (`convergence`, where the worktree lanes rejoin the
// trunk); `depth` walks the root that many commits FURTHER down the trunk's
// first-parent chain, revealing deeper history (and any merges down there) on
// demand. Bounded by `maxCommits + depth` so width and length stay sane.
// Read-only. Returns { commits, root, convergence, moreBelow, depth, trunk,
// tips, truncated }.
export async function readCommitGraph(palaceRoot, { maxCommits = 150, depth = 0 } = {}) {
  const base = 'main';
  const wtRes = await git(palaceRoot, ['worktree', 'list', '--porcelain'], { allowFail: true });
  if (wtRes.failed) return { commits: [], root: null, trunk: base, tips: [], error: wtRes.stderr || 'git worktree list failed' };

  // Tips = every worktree's branch ref (or bare HEAD when detached), plus the
  // base branch. Deduped; only refs git can resolve.
  const records = parseWorktreePorcelain(wtRes.stdout);
  const tipSet = new Set([base]);
  for (const wt of records) {
    if (wt.prunable) continue;
    tipSet.add(wt.branch ? `refs/heads/${wt.branch}` : wt.head);
  }
  const tips = [...tipSet].filter(Boolean);

  // Keep only tips git can resolve (a branch may have been deleted), deduped by
  // resolved sha so `main` and `refs/heads/main` don't both appear.
  const resolved = [];
  const seenSha = new Set();
  for (const t of tips) {
    const r = await git(palaceRoot, ['rev-parse', '--verify', '--quiet', `${t}^{commit}`], { allowFail: true });
    const sha = r.failed ? '' : r.stdout.trim();
    if (!sha || seenSha.has(sha)) continue;
    seenSha.add(sha);
    resolved.push({ ref: t, sha });
  }
  if (resolved.length === 0) return { commits: [], root: null, convergence: null, moreBelow: false, depth: 0, trunk: base, tips: [], truncated: false };

  // The convergence: the octopus merge-base of all tips -- where the worktree
  // lanes rejoin the trunk.
  const refArgs = resolved.map((t) => t.ref);
  const mbRes = await git(palaceRoot, ['merge-base', '--octopus', ...refArgs], { allowFail: true });
  const convergence = mbRes.failed ? null : mbRes.stdout.trim().split('\n')[0].trim();

  // The drawn root: the convergence, or `d` commits deeper along the trunk's
  // first-parent chain. If the requested depth runs past the true root, clamp
  // to it.
  const d = Math.max(0, Math.min(2000, parseInt(depth, 10) || 0));
  let root = convergence;
  if (convergence && d > 0) {
    const deeper = await git(palaceRoot, ['rev-parse', '--verify', '--quiet', `${convergence}~${d}^{commit}`], { allowFail: true });
    if (!deeper.failed && deeper.stdout.trim()) {
      root = deeper.stdout.trim();
    } else {
      const chain = await git(palaceRoot, ['rev-list', '--first-parent', convergence], { allowFail: true });
      const lines = chain.failed ? [] : chain.stdout.trim().split('\n').filter(Boolean);
      root = lines.length ? lines[lines.length - 1] : convergence;
    }
  }

  const cap = maxCommits + d;
  const rangeArgs = ['log', '--topo-order', '--parents', `--format=${GRAPH_FORMAT}`,
    `-n`, String(cap + 1), ...refArgs];
  if (root) rangeArgs.push(`^${root}`);
  const logRes = await git(palaceRoot, rangeArgs, { allowFail: true });
  if (logRes.failed) return { commits: [], root, convergence, moreBelow: false, depth: d, trunk: base, tips: refArgs, error: logRes.stderr || 'git log failed' };

  let commits = parseGraphLog(logRes.stdout);
  const truncated = commits.length > cap;
  if (truncated) commits = commits.slice(0, cap);

  // Append the drawn root as the trunk anchor (its parents left undrawn). Its
  // real parent count tells us whether there's more history below the window.
  let moreBelow = false;
  if (root && !commits.some((c) => c.sha === root)) {
    const rootRes = await git(palaceRoot, ['log', '-1', `--format=${GRAPH_FORMAT}`, root], { allowFail: true });
    if (!rootRes.failed) {
      const [rootNode] = parseGraphLog(rootRes.stdout);
      if (rootNode) {
        moreBelow = rootNode.parents.length > 0;
        commits.push({ ...rootNode, parents: [], isRoot: true });
      }
    }
  }

  return { commits, root, convergence, moreBelow, depth: d, trunk: base, tips: refArgs, truncated };
}
