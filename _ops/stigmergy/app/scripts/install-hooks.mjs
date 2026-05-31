#!/usr/bin/env node
// install-hooks — install the palace commit-msg hook into .git/hooks/.
//
// DELIBERATE, NOT AUTOMATIC. A commit-msg hook is repo-global: it affects
// every commit by every session and by Loudon's Obsidian/CLI. So installation
// is an explicit step a human runs, never something the build does silently
// (especially while multiple sessions are committing concurrently).
//
// The installed hook is a tiny POSIX shim that execs node on the tracked logic
// (scripts/commit-msg-hook.mjs), so the behavior stays version-controlled and
// the hook itself never goes stale. Any pre-existing commit-msg hook is backed
// up to commit-msg.pre-palace before we overwrite.
//
// Usage (from anywhere inside the repo):
//   node _ops/stigmergy/app/scripts/install-hooks.mjs            # install
//   node _ops/stigmergy/app/scripts/install-hooks.mjs --uninstall # restore backup
//   node _ops/stigmergy/app/scripts/install-hooks.mjs --check     # report status

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, copyFileSync, chmodSync, rmSync } from 'node:fs';
import { join } from 'node:path';

function repoRoot() {
  return execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
}

// The shim: resolve the repo root at hook time, then exec node on the tracked
// logic. Self-locating so it works regardless of where git invokes it.
const SHIM = `#!/bin/sh
# Palace commit-msg hook (installed by install-hooks.mjs). Tolerant backstop:
# annotates non-spec commits, never blocks. Logic lives in the tracked
# scripts/commit-msg-hook.mjs so this shim never goes stale.
ROOT="$(git rev-parse --show-toplevel)"
LOGIC="$ROOT/_ops/stigmergy/app/scripts/commit-msg-hook.mjs"
if [ -f "$LOGIC" ]; then
  node "$LOGIC" "$1" || exit 0   # never wedge a commit on a hook error
fi
exit 0
`;

function main() {
  const root = repoRoot();
  const hooksDir = join(root, '.git', 'hooks');
  const hookPath = join(hooksDir, 'commit-msg');
  const backupPath = join(hooksDir, 'commit-msg.pre-palace');
  const mode = process.argv.includes('--uninstall') ? 'uninstall'
    : process.argv.includes('--check') ? 'check' : 'install';

  if (mode === 'check') {
    if (!existsSync(hookPath)) { console.log('commit-msg hook: NOT installed'); return; }
    const body = readFileSync(hookPath, 'utf8');
    const isOurs = body.includes('Palace commit-msg hook');
    console.log(`commit-msg hook: ${isOurs ? 'INSTALLED (palace)' : 'present (foreign)'}`);
    if (existsSync(backupPath)) console.log('backup present: commit-msg.pre-palace');
    return;
  }

  if (mode === 'uninstall') {
    if (existsSync(backupPath)) {
      copyFileSync(backupPath, hookPath);
      rmSync(backupPath);
      console.log('restored the pre-palace commit-msg hook from backup.');
    } else if (existsSync(hookPath) && readFileSync(hookPath, 'utf8').includes('Palace commit-msg hook')) {
      rmSync(hookPath);
      console.log('removed the palace commit-msg hook (no prior hook to restore).');
    } else {
      console.log('no palace commit-msg hook to uninstall.');
    }
    return;
  }

  // install
  if (existsSync(hookPath)) {
    const body = readFileSync(hookPath, 'utf8');
    if (body.includes('Palace commit-msg hook')) {
      console.log('palace commit-msg hook already installed -- refreshing the shim.');
    } else {
      copyFileSync(hookPath, backupPath);
      console.log('backed up the existing commit-msg hook to commit-msg.pre-palace.');
    }
  }
  writeFileSync(hookPath, SHIM, 'utf8');
  chmodSync(hookPath, 0o755);
  console.log(`installed the palace commit-msg hook at ${hookPath}`);
  console.log('it tolerates-and-annotates non-spec commits; it never blocks.');
}

main();
