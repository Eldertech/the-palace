#!/usr/bin/env node
// check-phase.js — per-phase verify gate for the Automated Trickster build.
//
// Each phase runs a cumulative subset of the suite. A phase passes only when
// its gate test files all pass. Mirrors the orchestrator's check-phase pattern.

import { spawnSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { appendFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const PHASE_TESTS = {
  '0': ['tests/unit/parse.test.js'],
  '1': ['tests/unit/parse.test.js', 'tests/unit/audition-gate.test.js', 'tests/unit/evaluate.test.js'],
  '2': ['tests/unit/parse.test.js', 'tests/unit/audition-gate.test.js', 'tests/unit/evaluate.test.js', 'tests/unit/digest.test.js'],
  '3': ['tests/unit', 'tests/integration/roundtrip.test.js'],
  '4': ['tests/unit', 'tests/integration'],
  '5': ['tests/unit', 'tests/integration'],
  'all': ['tests/unit', 'tests/integration'],
};

const phase = process.argv[2] || 'all';
const targets = PHASE_TESTS[phase];
if (!targets) {
  console.error(`unknown phase "${phase}". valid: ${Object.keys(PHASE_TESTS).join(', ')}`);
  process.exit(2);
}

console.log(`[check-phase] phase ${phase} → ${targets.join(' ')}`);
const result = spawnSync('npx', ['vitest', 'run', ...targets], {
  cwd: ROOT,
  stdio: 'inherit',
  encoding: 'utf8',
});

const ok = result.status === 0;
try {
  appendFileSync(
    resolve(ROOT, 'build-log.jsonl'),
    JSON.stringify({ event: 'check-phase', phase, ok, ts_note: 'stamped by runner' }) + '\n',
    'utf8',
  );
} catch { /* build log is best-effort */ }

process.exit(ok ? 0 : 1);
