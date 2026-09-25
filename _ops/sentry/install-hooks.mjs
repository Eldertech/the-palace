#!/usr/bin/env node
// install-hooks — install the Sentry's pre-push gate into the repo's hooks directory.
//
// DELIBERATE, NOT AUTOMATIC. A pre-push hook is repo-global: every worktree and every
// session shares it (core.hooksPath points at the common .git/hooks). So installing is
// a step a person chooses, the same way the palace installs its commit-msg hook
// (_ops/stigmergy/app/scripts/install-hooks.mjs).
//
// The installed hook is a tiny POSIX shim that runs node on the tracked logic
// (_ops/sentry/pre-push.mjs) in the worktree doing the push, falling back to the main
// checkout's copy for a branch that predates the Sentry. The logic stays under version
// control; the shim never goes stale. A foreign pre-push hook is backed up first.
//
//   node _ops/sentry/install-hooks.mjs              install (or refresh)
//   node _ops/sentry/install-hooks.mjs --check      report status
//   node _ops/sentry/install-hooks.mjs --uninstall  remove it (restores any backup)

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, copyFileSync, chmodSync, rmSync } from 'node:fs';
import { join, isAbsolute } from 'node:path';

const MARK = 'Palace pre-push hook — the Sentry';
const SHIM = `#!/bin/sh
# ${MARK} (installed by _ops/sentry/install-hooks.mjs).
# Blocks a push that carries a credential; \`git push --no-verify\` skips it once.
# Logic lives in the tracked _ops/sentry/pre-push.mjs so this shim never goes stale.
ROOT="$(git rev-parse --show-toplevel)"
LOGIC="$ROOT/_ops/sentry/pre-push.mjs"
if [ ! -f "$LOGIC" ]; then
  MAIN="$(cd "$(git rev-parse --git-common-dir)/.." && pwd)"
  LOGIC="$MAIN/_ops/sentry/pre-push.mjs"
fi
if [ -f "$LOGIC" ] && command -v node >/dev/null 2>&1; then
  exec node "$LOGIC" "$@"
fi
# Fail closed: a gate that cannot run says no, and names the way through.
echo "sentry: PUSH REFUSED — the gate could not run (no node, or no _ops/sentry/pre-push.mjs here or in the owner checkout)." >&2
echo "sentry: push once unchecked with: git push --no-verify" >&2
exit 1
`;

const git = a => execFileSync('git', a, { encoding: 'utf8' }).trim();

// `--git-path hooks` honors core.hooksPath and resolves to the shared hooks dir from any worktree
// (in a worktree `.git` is a file, so joining root + '.git/hooks' would point nowhere).
function hooksDir() {
  const dir = git(['rev-parse', '--path-format=absolute', '--git-path', 'hooks']);
  return isAbsolute(dir) ? dir : join(git(['rev-parse', '--show-toplevel']), dir);
}

const dir = hooksDir();
const hook = join(dir, 'pre-push');
const backup = join(dir, 'pre-push.pre-sentry');
const mode = process.argv.includes('--uninstall') ? 'uninstall' : process.argv.includes('--check') ? 'check' : 'install';
const ours = () => existsSync(hook) && readFileSync(hook, 'utf8').includes(MARK);

if (mode === 'check') {
  console.log(`pre-push hook: ${!existsSync(hook) ? 'NOT installed' : ours() ? 'INSTALLED (sentry)' : 'present (foreign)'} — ${hook}`);
  try { console.log(`gitleaks: ${execFileSync('gitleaks', ['version'], { encoding: 'utf8' }).trim()}`); }
  catch { console.log('gitleaks: not installed — the gate runs on the Sentry rules alone'); }
} else if (mode === 'uninstall') {
  if (existsSync(backup)) { copyFileSync(backup, hook); rmSync(backup); console.log('restored the earlier pre-push hook from backup.'); }
  else if (ours()) { rmSync(hook); console.log('removed the Sentry pre-push hook.'); }
  else console.log('no Sentry pre-push hook to remove.');
} else {
  if (existsSync(hook) && !ours()) { copyFileSync(hook, backup); console.log('backed up the existing pre-push hook to pre-push.pre-sentry.'); }
  writeFileSync(hook, SHIM, 'utf8');
  chmodSync(hook, 0o755);
  console.log(`installed the Sentry pre-push gate at ${hook}`);
  console.log('it blocks high findings only; `git push --no-verify` overrides once.');
}
