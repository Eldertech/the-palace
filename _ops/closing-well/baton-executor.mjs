#!/usr/bin/env node
// baton-executor.mjs — the Closing Well Agent's "hand on" executor (Phase 5).
//
// Places an assented baton row into the palace through the real Baton Ceremony:
//   1. scaffolds the bundle file  <Entry>/<Entry> — baton.md  with correct §8
//      frontmatter and the FIXED On-pickup checklist appended — read at write time
//      from its single home, `_ops/Baton Ceremony/Baton Ceremony — on-pickup.md`,
//      so it can never drift from the ceremony that specifies it,
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

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, join, dirname, relative } from 'node:path';
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

// Resolve an entry title to its REAL file, the way Obsidian and the palace resolve a
// wikilink: search the whole tree, never assume the root (Substrate Skill § Directory Structure).
// Excludes .git/.claude/.obsidian. Loud failure on miss or ambiguity — the old silent
// tree-root guess is exactly what misfiled a nested-entry baton on 2026-07-04 (the file
// went to a bogus top-level folder, the parent pointer was skipped, and the announce
// carried a wrong handoff_path — with no error). See Closing Well — gotchas #12.
const IGNORE_DIRS = new Set(['.git', '.claude', '.obsidian', 'node_modules']);
function resolveEntryFile(root, name) {
  const filename = `${name}.md`;
  const hits = [];
  const walk = (dir) => {
    let ents;
    try { ents = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of ents) {
      if (e.isDirectory()) { if (!IGNORE_DIRS.has(e.name)) walk(join(dir, e.name)); }
      else if (e.isFile() && e.name === filename) hits.push(join(dir, e.name));
    }
  };
  walk(root);
  if (hits.length === 0) {
    die(1, `entry "${name}" not found: searched ${root} recursively for "${filename}" ` +
      `(excluding .git/.claude/.obsidian). This executor places a baton for a REAL entry — ` +
      `pass an --entry whose <name>.md exists. Refusing the old silent tree-root fallback ` +
      `(gotchas #12). A genuinely entry-less baton (e.g. a cross-surface paste-prompt) is not ` +
      `supported here yet — that would need an explicit flag, not a silent guess.`);
  }
  if (hits.length > 1) {
    die(1, `entry "${name}" is ambiguous — ${hits.length} files named "${filename}": ` +
      `${hits.map((h) => relative(root, h)).join(', ')}. Palace filenames must be globally ` +
      `unique (SCHEMA §8); disambiguate before handing off.`);
  }
  return hits[0];
}

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
const model = arg('--model', 'claude-opus-5-5');
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

// ---- the fixed On-pickup checklist (read from its ONE home, never retyped) ----
// The text lives in the Baton Ceremony's own bundle. This script does NOT carry a
// copy: it carried one until 2026-08-26 and it went stale, because the ceremony's
// three-state lifecycle (claim/close, 2026-07-07) landed in the spec and never
// reached this file — so every baton written here shipped a checklist telling the
// catcher to delete the baton at pickup and never post a handoff_closed. A hand-
// posted pickup with no `lifecycle: claim` folds as a LEGACY terminal pickup
// (handoff-model.mjs), so the card silently retired with no commit cited. One copy,
// read at write time, is the fix. Edit the fragment; never inline it back here.
const ON_PICKUP_PATH = join(HERE, '..', 'Baton Ceremony', 'Baton Ceremony — on-pickup.md');
function loadOnPickup() {
  let raw;
  try {
    raw = readFileSync(ON_PICKUP_PATH, 'utf8');
  } catch {
    return die(1, `the canonical On-pickup checklist is missing at ${ON_PICKUP_PATH}. `
      + 'A baton without it is unfinished — the catcher reads the baton, not the ceremony. Refusing to write one.');
  }
  // Drop the §8 bundle frontmatter and the editor note; keep the checklist verbatim
  // from its own heading down.
  const at = raw.indexOf('## On pickup');
  if (at < 0) {
    return die(1, `${ON_PICKUP_PATH} has no "## On pickup" heading — that is not the checklist. `
      + 'Refusing to write a baton with a malformed footer.');
  }
  return raw.slice(at).trim();
}
const ON_PICKUP = loadOnPickup();


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

// Resolve the entry's real location, then derive the bundle + baton path from it — the
// bundle is [Entry]/ sitting beside [Entry].md, wherever that turns out to be.
const entryPath = resolveEntryFile(REPO, entry);
const bundleDir = join(dirname(entryPath), entry);
const batonPath = join(bundleDir, `${entry} — baton.md`);
const relEntry = relative(REPO, entryPath);
const relBaton = relative(REPO, batonPath);
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
    handoff_path: relBaton,
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
// plain git commit. `baton(` is the Baton Ceremony's spelling of the `handoff` kind — the
// commit-msg hook reads it as handoff (commit-parse.js KIND_ALIASES) — so the trailer carries
// the canonical kind. The committer (palace-commit.mjs) is reserved for DEPOSITS, which land
// on the owner where its deps exist; a `docs`-profile worktree can't run it (no js-yaml).
// See executor.md.
const commitCmd =
  `git add "${relBaton}" "${relEntry}" && ` +
  `git commit -m "baton(${entry}): ${move.slice(0, 60)}" -m "Palace-Kind: handoff"`;

if (!doWrite) {
  process.stdout.write(
    `PREVIEW — nothing written, nothing posted.\n\n` +
    `baton file  : ${batonPath}\n` +
    `parent ptr  : ${entryPath}  (+ "## Active Baton")\n` +
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
{
  const cur = readFileSync(entryPath, 'utf8');
  if (!cur.includes('## Active Baton')) { writeFileSync(entryPath, cur.replace(/\s*$/, '\n') + pointer); wrotePointer = true; }
}

let posted = null;
if (doPost) { const r = runBoardPost('post'); posted = r.ok ? r.path : null; if (!r.ok) die(2, `board post rejected: ${JSON.stringify(r.errors)}`); }

process.stdout.write(
  `wrote baton : ${batonPath}\n` +
  `parent ptr  : ${wrotePointer ? entryPath + '  ("## Active Baton" added)' : 'already had "## Active Baton" — left as is'}\n` +
  `announce    : ${posted ? `POSTED to ${posted} (id ${id})` : `validated, not posted (no --post)`}\n\n` +
  `now land it (baton file + pointer):\n  ${commitCmd}\n` +
  (doPost ? '' : `\n(announce not posted — add --post, or announce by hand, for a cross-worktree baton.)\n`),
);
