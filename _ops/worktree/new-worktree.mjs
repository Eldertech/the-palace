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
//   node _ops/worktree/new-worktree.mjs --name feature/blueline --remove [--delete-branch]
//   --remove   unlink the borrowed symlinks (safe — never deletes through to the owner),
//              then `git worktree remove`. --delete-branch also drops the branch.

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
  // Unlink borrowed symlinks FIRST. unlink on a symlink removes the link, never the
  // target — done explicitly so `git worktree remove` sees a clean tree and there is
  // zero chance of deleting through into the owner's real _tools/ (16 GB).
  for (const l of MANIFEST.links) {
    const lp = path.join(dir, l.path);
    try { if (fs.lstatSync(lp).isSymbolicLink()) { fs.unlinkSync(lp); console.log(`  ✓ unlinked ${l.path}`); } } catch { /* absent */ }
  }
  try { execFileSync("git", ["worktree", "remove", dir], { stdio: "inherit" }); console.log(`  ✓ worktree removed`); }
  catch { console.error(`  ! git worktree remove refused (other untracked files?). Inspect, then:  git worktree remove --force "${dir}"`); process.exit(1); }
  if (flag("--delete-branch")) { try { execFileSync("git", ["branch", "-D", name]); console.log(`  ✓ branch ${name} deleted`); } catch (e) { console.warn(`  ! branch -D ${name}: ${e.stderr || e.message}`); } }
  const memLink = path.join(os.homedir(), ".claude", "projects", dir.replace(/[\/]/g, "-"), "memory");
  console.log(`  note: if you symlinked memory, remove it:  rm "${memLink}"\n`);
  process.exit(0);
}

// ---- plan the symlinks ----
const wanted = MANIFEST.profiles[profile];
const links = MANIFEST.links.filter(l => wanted.includes(l.path));

console.log(`\n  Palace worktree plan`);
console.log(`  ─────────────────────────────────────────────`);
console.log(`  owner (canonical):  ${owner}`);
console.log(`  new worktree:       ${dir}`);
console.log(`  branch:             ${name}   (base: ${base} if new)`);
console.log(`  profile:            ${profile}  →  ${links.length} symlink(s)`);
for (const l of links) console.log(`      ↳ ${l.path}${l.secret ? "  [secret]" : ""}  (${l.size})`);
if (!links.length) console.log(`      (none — pure tracked-files worktree)`);
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
console.log(`  undo:  node _ops/worktree/new-worktree.mjs --name ${name} --remove [--delete-branch]\n`);
