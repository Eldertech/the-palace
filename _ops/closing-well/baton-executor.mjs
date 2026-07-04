#!/usr/bin/env node
// baton-executor.mjs — the Closing Well Agent's "hand on" executor (Phase 5).
//
// Places an assented baton row into the palace through the real Baton Ceremony:
//   1. scaffolds the bundle file  <Entry>/<Entry> — baton.md  with correct §8
//      frontmatter and the FIXED On-pickup checklist appended (canonical here, so it
//      never drifts from a hand-retype),
//   2. adds the "## Active Baton" pointer to the parent entry,
//   3. builds + validates the handoff_ready announce and (with --post) appends it to the
//      OWNER persistent board via the canonical _ops/commons/board-post.mjs,
//   4. prints the exact palace-commit --kind baton command to land the file + pointer.
//
// It REUSES board-post.mjs (validate + owner-single-sourced append) and palace-commit.mjs
// (the committer) — it does not reimplement either. The drafted baton BODY (Move, Why,
// Tried & rejected, Current state, Next move, Calibrations, Load these files first) is the
// Agent's craft; this script only places it.
//
// Usage:
//   node _ops/closing-well/baton-executor.mjs \
//     --entry "<Entry>" --move "<one sentence>" --body-file <drafted-baton.md> \
//     --wt-branch <branch> --wt-dir <dir> --wt-profile <profile> \
//     --session-id <slug> --owner "<owner-root>" [--from "<Entry>"] \
//     [--write] [--post] [--id <id>] [--ts <iso>] [--model <api-id>]
//
//   (no flags)  full PREVIEW — writes nothing, posts nothing, validates the announce.
//   --write     write the baton file + the parent "## Active Baton" pointer.
//   --post      also append the validated handoff_ready to the owner board (implies --write).
//
// Exit codes: 0 ok · 1 usage / precondition · 2 validation failed · 3 infra failure.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const HERE = dirname(fileURLToPath(import.meta.url));            // _ops/closing-well
// --tree overrides where the baton file + parent pointer are written (testing only;
// real runs write into this worktree). --board overrides the announce target (testing
// only; real runs always post to the owner's persistent board).
const REPO = resolve(process.argv.includes('--tree')
  ? process.argv[process.argv.indexOf('--tree') + 1]
  : resolve(HERE, '../..'));                                     // this worktree's root

function arg(name, def = null) {
  const i = process.argv.indexOf(name);
  return i >= 0 && i + 1 < process.argv.length ? process.argv[i + 1] : def;
}
const has = (n) => process.argv.includes(n);
function die(code, msg) { process.stderr.write(`baton-executor: ${msg}\n`); process.exit(code); }

// ---- args -----------------------------------------------------------------
const entry = arg('--entry');
const move = arg('--move');
const bodyFile = arg('--body-file');
const wtBranch = arg('--wt-branch');
const wtDir = arg('--wt-dir');
const wtProfile = arg('--wt-profile', 'docs');
const sessionId = arg('--session-id');
const owner = arg('--owner');
const from = arg('--from', entry);
const model = arg('--model', 'claude-opus-4-8');
const doWrite = has('--write') || has('--post');
const doPost = has('--post');

if (!entry || !move || !bodyFile || !owner || !sessionId) {
  die(1, 'missing required arg (need --entry --move --body-file --session-id --owner). See header.');
}
if (!existsSync(bodyFile)) die(1, `--body-file not found: ${bodyFile}`);
if (doPost && (!wtBranch || !wtDir)) {
  die(1, 'a cross-worktree announce (--post) needs --wt-branch and --wt-dir (the coordinate the catcher navigates to).');
}

// ISO timestamp without millis, matching the board's existing convention.
const ts = arg('--ts') || new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
const slug = entry.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const id = arg('--id') || `${slug}-handoff-${ts.slice(0, 10)}`;

// ---- the fixed On-pickup checklist (canonical; single-sourced here) -------
const ON_PICKUP = `## On pickup (fixed — the catcher's checklist; do not rewrite per session)
1. State the move back in one sentence. If you can't, the baton wasn't caught — stop and ask Loudon.
2. Check it is still live before you commit to it. The baton is a snapshot from when it was written; the project may have moved past it. Re-read the parent entry and \`git log\` it since the baton's \`born\` date, and confirm the "Current state" the baton quotes still matches the file. If the move is already done, superseded, or no longer wanted, STOP — surface it to Loudon and do not execute. A stale baton followed silently produces drift. (Receive every baton with this skepticism; the auto-staleness heuristic is off by design — the freshness call is yours.)
3. If this baton or its board line is still uncommitted (authored on a surface that couldn't commit — e.g. Cowork), commit them first. That commit is the git archive Step 7 relies on.
4. Mark it caught: remove the "Active Baton" section from the parent entry; for a board-announced baton with no parent entry, post the paired \`handoff_picked_up\` REPLY (\`re:\` the \`handoff_ready\` id) instead.
5. Delete the baton file (git is its archive). On a surface that can't delete (Cowork), remove the marker and note "deletion pending."
6. If the baton names a receiving-surface capability delta or a worktree coordinate, confirm it holds before relying on it (the [[Surfaces and Capabilities]] catalog can be stale) — for a worktree, check \`git worktree list\` and recreate it if it is gone. A build that was supposed to run here but can't is a finding to report, not a failure to hide.
7. Act on the move, holding the calibrations above. Steward batons are the exception — updated in place, never deleted.`;

// ---- 1 & 2: scaffold the baton file + the parent pointer ------------------
const born = ts.slice(0, 10);
const body = readFileSync(bodyFile, 'utf8').trim();
const batonMd = `---
title: "${entry} — baton"
born: ${born}
links:
  - target: "[[${entry}]]"
    type: connects-to
    label: "baton-for"
forward_vector: "I carry the in-progress move on [[${entry}]] across a boundary, waiting to be caught by the next Claude and deleted once the move is picked up."
---

${body}

${ON_PICKUP}
`;

const bundleDir = join(REPO, entry);
const batonPath = join(bundleDir, `${entry} — baton.md`);
const entryPath = join(REPO, `${entry}.md`);
const pointer = `\n## Active Baton\n\n[[${entry} — baton]] — drafted ${born}\n`;

// ---- 3: build the handoff_ready announce ----------------------------------
const announce = {
  schema_version: '1.0', id, ts, session_id: sessionId,
  from, to: '*', type: 'BROADCAST', board: 'GENERAL',
  health: {
    score: 'green', model,
    _orchestrator_metadata: {
      dispatch_mode: 'claude-code-mac-session',
      note: 'Closing Well executor (Phase 5); Path 2 stub health (SCHEMA §9).',
    },
  },
  payload: {
    kind: 'handoff_ready', entry,
    handoff_path: `${entry}/${entry} — baton.md`,
    receiving_surface: wtDir ? `Claude Code, worktree ${wtBranch} (${wtDir})` : 'Claude Code (Mac)',
    move,
    ...(wtBranch ? { worktree: { branch: wtBranch, dir: wtDir, profile: wtProfile } } : {}),
  },
};

const coreDir = join(owner, '_ops/stigmergy/core');
const boardPath = arg('--board', join(owner, '_ops/swarm/persistent/blackboard.jsonl'));
const boardPost = join(owner, '_ops/commons/board-post.mjs');

function runBoardPost(mode) {
  const args = [boardPost, '--core-dir', coreDir];
  if (mode === 'post') args.push('--board-path', boardPath, '--post');
  else args.push('--validate-only');
  try {
    const out = execFileSync('node', args, { input: JSON.stringify(announce), encoding: 'utf8' });
    return JSON.parse(out.trim().split('\n').pop());
  } catch (e) {
    die(3, `board-post ${mode} failed to run: ${e.message}`);
  }
}

// Always validate first — a malformed announce should stop the executor before it writes.
const vres = runBoardPost('validate');
if (!vres.ok) die(2, `handoff_ready announce is invalid:\n${JSON.stringify(vres.errors, null, 2)}`);

// ---- act ------------------------------------------------------------------
// A feature-branch baton is non-canon and lives in this worktree; commit it here with a
// plain git commit — the palace commit-msg hook annotates it (Palace-Kind: baton). The
// committer (palace-commit.mjs) is reserved for DEPOSITS, which land on the owner where its
// deps exist; a `docs`-profile worktree can't run it (no js-yaml). See executor.md.
const commitCmd =
  `git add "${entry}/${entry} — baton.md"${existsSync(entryPath) ? ` "${entry}.md"` : ''} && ` +
  `git commit -m "baton(${entry}): ${move.slice(0, 60)}" -m "Palace-Kind: baton"`;

if (!doWrite) {
  process.stdout.write(
    `PREVIEW — nothing written, nothing posted.\n\n` +
    `baton file  : ${batonPath}\n` +
    `parent ptr  : ${existsSync(entryPath) ? entryPath + '  (+ "## Active Baton")' : '(no parent entry in this tree — board announce is the pointer)'}\n` +
    `announce    : VALID (id ${id}, board GENERAL, owner ${boardPath})\n` +
    `board post  : ${doPost ? 'would POST' : 'skipped (no --post)'}\n\n` +
    `then commit :\n  ${commitCmd}\n\n` +
    `re-run with --write (file + pointer) and/or --post (announce) to execute.\n`,
  );
  process.exit(0);
}

mkdirSync(bundleDir, { recursive: true });   // bundles are lazy (§8) — create on first use
writeFileSync(batonPath, batonMd);
let wrotePointer = false;
if (existsSync(entryPath)) {
  const cur = readFileSync(entryPath, 'utf8');
  if (!cur.includes('## Active Baton')) { writeFileSync(entryPath, cur.replace(/\s*$/, '\n') + pointer); wrotePointer = true; }
}

let posted = null;
if (doPost) { const r = runBoardPost('post'); posted = r.ok ? r.path : null; if (!r.ok) die(2, `board post rejected: ${JSON.stringify(r.errors)}`); }

process.stdout.write(
  `wrote baton : ${batonPath}\n` +
  `parent ptr  : ${wrotePointer ? entryPath + '  ("## Active Baton" added)' : (existsSync(entryPath) ? 'already had "## Active Baton" — left as is' : 'no parent entry in this tree')}\n` +
  `announce    : ${posted ? `POSTED to ${posted} (id ${id})` : `validated, not posted (no --post)`}\n\n` +
  `now land it (baton file + pointer):\n  ${commitCmd}\n` +
  (doPost ? '' : `\n(announce not posted — add --post, or announce by hand, for a cross-worktree baton.)\n`),
);
