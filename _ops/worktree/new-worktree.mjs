#!/usr/bin/env node
// Palace worktree creator. Creates a git worktree off the canonical main worktree
// and symlinks back the gitignored heavy/secret state a fresh worktree lacks
// (per ./symlinks.json). Solves the two failure modes proven on 2026-06-16:
//   1. shared-working-tree branch thrashing (own worktree = own HEAD), and
//   2. a fresh worktree missing _tools/ (16 GB ComfyUI venv+weights), .venvs, secrets.
//
// Usage:
//   node _ops/worktree/new-worktree.mjs --name feature/blueline [--profile blueline]
//        [--base main] [--dir ../palace-blueline] [--memory] [--dry-run]
//
//   --name     branch for the worktree (required). New branch unless it already exists.
//   --profile  which symlink set: docs | shop | blueline | stigmergy | full   (default: full)
//   --base     branch to fork from when creating a new branch                 (default: main)
//   --dir      worktree location                          (default: ../palace-<slug-of-name>)
//   --memory   also symlink ~/.claude project memory so palace memories carry over
//   --dry-run  print the plan, change nothing
//
// Teardown:
//   node _ops/worktree/new-worktree.mjs --name feature/blueline --remove [--delete-branch] [--force-delete]
//   --remove        unlink the borrowed symlinks (safe — never deletes through to the owner),
//                   then `git worktree remove`.
//   --delete-branch also drop the branch — SAFE delete (`git branch -d`): refuses if the branch has
//                   commits not merged to the trunk, so teardown can't silently strand work (a
//                   Closing Well guard — see Closing Well.md).
//   --force-delete  discard the branch even if unmerged (`git branch -D`). Deliberate loss only.

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MANIFEST = JSON.parse(fs.readFileSync(path.join(HERE, "symlinks.json"), "utf8"));

// ---- args ----
const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
const flag = (k) => argv.includes(k);
const name = opt("--name");
const profile = opt("--profile", "full");
const base = opt("--base", "main");
const doMemory = flag("--memory");
const dryRun = flag("--dry-run");

if (!name) { console.error("error: --name <branch> is required"); process.exit(2); }
if (!MANIFEST.profiles[profile]) {
  console.error(`error: unknown profile '${profile}'. Known: ${Object.keys(MANIFEST.profiles).join(", ")}`);
  process.exit(2);
}

const git = (...a) => execFileSync("git", a, { encoding: "utf8" }).trim();

// ---- locate the canonical (main) worktree — it owns the gitignored state ----
// `git worktree list` lists the main worktree first.
const owner = git("worktree", "list", "--porcelain").split("\n")
  .find(l => l.startsWith("worktree "))?.slice("worktree ".length);
if (!owner) { console.error("error: could not resolve the main worktree"); process.exit(1); }
if (!fs.existsSync(path.join(owner, "_tools"))) {
  console.warn(`warning: ${owner}/_tools not found — is this really the install owner? Continuing.`);
}

const slug = name.replace(/[\/]/g, "-");
const dir = path.resolve(owner, opt("--dir", path.join("..", `palace-${slug}`)));

// ---- teardown mode ----
if (flag("--remove")) {
  if (!fs.existsSync(dir)) { console.error(`error: ${dir} does not exist`); process.exit(1); }
  if (path.resolve(dir) === path.resolve(owner)) { console.error("refusing to remove the owner worktree"); process.exit(1); }
  console.log(`\n  Removing worktree: ${dir}`);
  // Unlink every symlink that points back INTO the owner — the explicit borrows
  // AND the auto-mirrored dependency dirs — so `git worktree remove` sees a clean
  // tree. General by construction: it sweeps for what was ACTUALLY linked rather
  // than trusting the manifest to still match, so it can never strand a link the
  // way the old MANIFEST.links-only loop did. lstat-only (never follows a link),
  // skips .git, recurses only into real dirs, and unlinks ONLY owner-pointing
  // links — a real file or an unrelated symlink is never touched. unlink on a
  // symlink removes the link, never the target: zero chance of deleting into the
  // owner's real _tools/ (16 GB).
  const ownerReal = fs.realpathSync(owner);
  const intoOwner = (p) => {
    const hit = (x) => x && (x === ownerReal || x.startsWith(ownerReal + path.sep));
    let real = null, tgt = null;
    try { real = fs.realpathSync(p); } catch { /* dangling */ }
    try { tgt = path.resolve(path.dirname(p), fs.readlinkSync(p)); } catch { /* not a link */ }
    return hit(real) || hit(tgt);
  };
  let unlinked = 0;
  const sweep = (d) => {
    let entries; try { entries = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const p = path.join(d, e.name);
      let st; try { st = fs.lstatSync(p); } catch { continue; }
      if (st.isSymbolicLink()) {
        if (intoOwner(p)) { try { fs.unlinkSync(p); unlinked++; console.log(`  ✓ unlinked ${path.relative(dir, p)}`); } catch { /* ignore */ } }
      } else if (st.isDirectory() && e.name !== ".git") {
        sweep(p);
      }
    }
  };
  sweep(dir);
  console.log(`  ✓ ${unlinked} owner-pointing symlink(s) unlinked`);
  try { execFileSync("git", ["worktree", "remove", dir], { stdio: "inherit" }); console.log(`  ✓ worktree removed`); }
  catch { console.error(`  ! git worktree remove refused (other untracked files?). Inspect, then:  git worktree remove --force "${dir}"`); process.exit(1); }
  if (flag("--delete-branch") || flag("--force-delete")) {
    // Closing Well guard: SAFE delete (-d) by default — git refuses if the branch has commits not
    // merged to the trunk, so teardown can't silently strand work. --force-delete (-D) is the
    // deliberate-discard escape. See Closing Well.md.
    const force = flag("--force-delete");
    try { execFileSync("git", ["branch", force ? "-D" : "-d", name]); console.log(`  ✓ branch ${name} deleted${force ? " (forced)" : ""}`); }
    catch (e) {
      console.warn(`  ! branch ${force ? "-D" : "-d"} ${name} refused: ${(e.stderr || e.message).toString().trim()}`);
      if (!force) console.warn(`    closing-well guard: unmerged commits would be lost. Merge/cherry-pick them to the trunk first, or re-run with --force-delete to discard deliberately.`);
    }
  }
  const memLink = path.join(os.homedir(), ".claude", "projects", dir.replace(/[\/]/g, "-"), "memory");
  console.log(`  note: if you symlinked memory, remove it:  rm "${memLink}"\n`);
  process.exit(0);
}

// ---- plan the symlinks ----
const wanted = MANIFEST.profiles[profile];
const links = MANIFEST.links.filter(l => wanted.includes(l.path));

// Auto-mirror: dependency dirs discovered by CLASS (basename), not enumerated.
// `git ls-files --others --ignored --exclude-standard --directory` lists every
// fully-ignored dir collapsed to one entry; keep the ones whose basename is a
// declared dep class (e.g. node_modules) and not already an explicit link. This
// is what makes a new npm-workspace package "just work" with no manifest edit.
// See MANIFEST.auto_mirror. Read-only (runs against the owner), so it is safe in
// --dry-run too.
function discoverAutoMirror() {
  const am = MANIFEST.auto_mirror || {};
  const basenames = Array.isArray(am.by_basename) ? am.by_basename : [];
  const profiles = Array.isArray(am.profiles) ? am.profiles : [];
  if (!basenames.length || !profiles.includes(profile)) return [];
  const explicit = new Set(links.map(l => l.path));
  try {
    return git("-C", owner, "ls-files", "--others", "--ignored", "--exclude-standard", "--directory")
      .split("\n").map(s => s.trim().replace(/\/+$/, "")).filter(Boolean)
      .filter(rel => basenames.includes(path.basename(rel)) && !explicit.has(rel));
  } catch (e) {
    console.warn(`  ! auto-mirror discovery failed: ${e.stderr || e.message}`);
    return [];
  }
}
const autoMirror = discoverAutoMirror();

console.log(`\n  Palace worktree plan`);
console.log(`  ─────────────────────────────────────────────`);
console.log(`  owner (canonical):  ${owner}`);
console.log(`  new worktree:       ${dir}`);
console.log(`  branch:             ${name}   (base: ${base} if new)`);
console.log(`  profile:            ${profile}  →  ${links.length} symlink(s)`);
for (const l of links) console.log(`      ↳ ${l.path}${l.secret ? "  [secret]" : ""}  (${l.size})`);
if (!links.length) console.log(`      (none — pure tracked-files worktree)`);
if (autoMirror.length) {
  const classes = (MANIFEST.auto_mirror?.by_basename || []).join(", ");
  console.log(`  auto-mirror:        ${autoMirror.length} dependency dir(s) by class [${classes}]`);
  for (const rel of autoMirror) console.log(`      ↳ ${rel}`);
}
console.log("");

if (dryRun) { console.log("  --dry-run: nothing changed.\n"); printMemory(); process.exit(0); }

// ---- create the worktree ----
if (fs.existsSync(dir)) { console.error(`error: ${dir} already exists`); process.exit(1); }
const branchExists = (() => { try { git("rev-parse", "--verify", "--quiet", `refs/heads/${name}`); return true; } catch { return false; } })();
try {
  if (branchExists) { console.log(`  branch ${name} exists → checking it out`); git("worktree", "add", dir, name); }
  else { git("worktree", "add", dir, "-b", name, base); }
} catch (e) { console.error(`error: git worktree add failed:\n${e.stderr || e.message}`); process.exit(1); }
console.log(`  ✓ worktree created`);

// ---- create the symlinks (absolute targets into the owner) ----
let made = 0, skipped = 0, broken = 0;
for (const l of links) {
  const target = path.join(owner, l.path);
  const linkPath = path.join(dir, l.path);
  if (!fs.existsSync(target)) { console.warn(`  ! skip ${l.path} — target missing in owner (${target})`); broken++; continue; }
  if (fs.existsSync(linkPath) || fs.existsSync(linkPath, { throwIfNoEntry: false })) {
    // a real file/dir already there (e.g. npm-installed) — don't clobber
    console.warn(`  ! skip ${l.path} — already present in worktree (not overwriting)`); skipped++; continue;
  }
  fs.mkdirSync(path.dirname(linkPath), { recursive: true });
  fs.symlinkSync(target, linkPath, l.kind === "dir" ? "dir" : "file");
  const ok = fs.existsSync(linkPath) && fs.lstatSync(linkPath).isSymbolicLink();
  console.log(`  ${ok ? "✓" : "✗"} ${l.path}  →  ${target}`);
  ok ? made++ : broken++;
}

console.log(`\n  symlinks: ${made} made, ${skipped} skipped, ${broken} broken`);

// ---- auto-mirror symlinks (the discovered dependency dirs) ----
// Same as the explicit links, but the path list came from discovery (by class)
// rather than the manifest. New workspace node_modules are covered with no edit.
let autoMade = 0, autoSkipped = 0;
for (const rel of autoMirror) {
  const target = path.join(owner, rel);
  const linkPath = path.join(dir, rel);
  if (!fs.existsSync(target)) { console.warn(`  ! skip [auto] ${rel} — target missing in owner`); continue; }
  if (fs.existsSync(linkPath)) { autoSkipped++; continue; } // a real install or explicit link already there
  fs.mkdirSync(path.dirname(linkPath), { recursive: true });
  fs.symlinkSync(target, linkPath, "dir");
  const ok = fs.lstatSync(linkPath).isSymbolicLink();
  console.log(`  ${ok ? "✓" : "✗"} [auto] ${rel}  →  ${target}`);
  if (ok) autoMade++;
}
if (autoMirror.length) console.log(`  auto-mirror: ${autoMade} made, ${autoSkipped} skipped`);

// ---- memory (outside the repo) ----
function printMemory() {
  const newSlug = dir.replace(/[\/]/g, "-");
  const projDir = path.join(os.homedir(), ".claude", "projects", newSlug);
  const canonical = MANIFEST.memory.canonical.replace(/^~/, os.homedir());
  const memLink = path.join(projDir, "memory");
  if (doMemory && !dryRun) {
    try {
      fs.mkdirSync(projDir, { recursive: true });
      if (fs.existsSync(memLink)) console.log(`  memory: ${memLink} already exists — left as-is`);
      else { fs.symlinkSync(canonical, memLink, "dir"); console.log(`  ✓ memory symlinked → canonical palace memory`); }
    } catch (e) { console.warn(`  ! memory symlink failed: ${e.message}`); }
  } else {
    console.log(`\n  memory continuity (auto-memory is path-keyed — a new path = empty memory):`);
    console.log(`    mkdir -p "${projDir}" && ln -s "${canonical}" "${memLink}"`);
    console.log(`    (or re-run with --memory to do this automatically)`);
  }
}
printMemory();

console.log(`\n  next:  cd "${dir}"   then start a session there.`);
console.log(`  note:  runtime state (_ops/stigmergy/.actuator*, Enrichment/.server.*) stays per-worktree — never symlinked.`);
console.log(`  undo:  node _ops/worktree/new-worktree.mjs --name ${name} --remove [--delete-branch]   (safe -d; add --force-delete to discard unmerged)\n`);
