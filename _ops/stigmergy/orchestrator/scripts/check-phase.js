#!/usr/bin/env node
// check-phase.js — orchestrate one phase's verify gate.
//
// Each phase runs a subset of the unit/integration suites:
//   phase 1: manifest, posting, append, health, registry, git (no prompts; no full-cycle)
//   phase 2: + prompts (templates exist + render correctly)
//   phase 3: + full-cycle integration test
//   phase 4: helper-side tests; smoke tests are run by the build session, not here
//   phase 5: helper-side tests; smoke tests are run by the build session, not here
//   phase 6: every test in the project (cumulative gate)
//   all:     same as phase 6

import { spawnSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, appendFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const PHASE_TESTS = {
  '1': [
    'tests/unit/manifest.test.js',
    'tests/unit/posting.test.js',
    'tests/unit/append.test.js',
    'tests/unit/health.test.js',
    'tests/unit/registry.test.js',
    'tests/unit/git.test.js',
  ],
  '2': [
    'tests/unit/manifest.test.js',
    'tests/unit/posting.test.js',
    'tests/unit/append.test.js',
    'tests/unit/health.test.js',
    'tests/unit/registry.test.js',
    'tests/unit/git.test.js',
    'tests/unit/prompts.test.js',
  ],
  '3': [
    'tests/unit',
    'tests/integration/full-cycle.test.js',
  ],
  '4': [
    'tests/unit',
    'tests/integration',
  ],
  '5': [
    'tests/unit',
    'tests/integration',
  ],
  '6': [
    'tests/unit',
    'tests/integration',
  ],
  'all': [
    'tests/unit',
    'tests/integration',
  ],
};

function appendBuildLog(record) {
  const line = JSON.stringify({ ts: new Date().toISOString(), ...record });
  appendFileSync(resolve(ROOT, 'build-log.jsonl'), line + '\n');
}

function main() {
  const arg = process.argv[2];
  if (!arg || !PHASE_TESTS[arg]) {
    console.error('usage: check-phase <1|2|3|4|5|6|all>');
    process.exit(2);
  }
  const targets = PHASE_TESTS[arg].filter((p) => {
    const abs = resolve(ROOT, p);
    if (existsSync(abs)) return true;
    // For phases that reference test files not yet written, skip silently.
    // (Phase 1 should not have any missing — if so, that's a real failure.)
    return false;
  });

  if (targets.length === 0) {
    appendBuildLog({ phase: arg, check: 'phase-gate', outcome: 'no-targets' });
    console.error(`check-phase ${arg}: no test targets found`);
    process.exit(1);
  }

  appendBuildLog({ phase: arg, check: 'phase-gate', action: 'starting', targets });

  const result = spawnSync('npx', ['vitest', 'run', ...targets], {
    cwd: ROOT,
    stdio: 'inherit',
  });

  const code = result.status ?? 1;
  appendBuildLog({
    phase: arg,
    check: 'phase-gate',
    outcome: code === 0 ? 'pass' : 'fail',
    exit_code: code,
  });
  process.exit(code);
}

main();
