#!/usr/bin/env node
/**
 * check-phase.js — orchestrate one phase's full verify gate.
 *
 * Usage:
 *   node scripts/check-phase.js <1..6|all>
 *
 * Behavior:
 *   - Looks up the test set + screenshot capture spec for the given phase.
 *   - Runs Vitest tests (unit + integration).
 *   - Runs Playwright e2e tests (which also produce screenshots in screenshots/phase-N/).
 *   - Appends one summary line per run to build-log.jsonl.
 *   - Exits 0 only when every test in the set passes.
 *
 * The visual-validator subagent is dispatched separately by the lead session
 * after this script exits 0. Visual fails are treated identically to test fails.
 */

import { spawnSync } from 'node:child_process';
import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = resolve(__dirname, '..');
const BUILD_LOG = resolve(APP_ROOT, 'build-log.jsonl');
const SCREENSHOTS_ROOT = resolve(APP_ROOT, 'screenshots');

// Phase manifest — declares which tests + screenshots each phase requires.
// Test files referenced here may not yet exist in earlier phases; they will be
// added as their phase is implemented. Vitest/Playwright will skip non-existent
// patterns gracefully (vitest exits 0 if no tests match; playwright exits 0 if
// no spec files are found).
const PHASES = {
  1: {
    label: 'Project Skeleton',
    vitest: [],
    playwright: ['boot.spec.js', 'tokens.spec.js', 'polish.spec.js', 'command-bar-active.spec.js'],
    screenshots: ['phase-1-v0.2/general.png', 'phase-1-v0.2/flags.png', 'phase-1-v0.2/system.png', 'phase-1-v0.2/trickster.png'],
  },
  2: {
    label: 'Write Path',
    vitest: ['validator.test.js', 'response-builder.test.js', 'post-middleware.test.js', 'parser.test.js', 'schema.test.js', 'middleware.test.js'],
    playwright: [],
    screenshots: [],
  },
  3: {
    label: 'Read Path (SSE)',
    vitest: ['live-feed.test.js', 'sse-middleware.test.js', 'parser.test.js', 'schema.test.js', 'middleware.test.js', 'validator.test.js', 'response-builder.test.js', 'post-middleware.test.js'],
    playwright: [],
    screenshots: [],
  },
  4: {
    label: 'Click-to-Respond UI',
    vitest: ['validator.test.js', 'response-builder.test.js', 'post-middleware.test.js', 'live-feed.test.js', 'sse-middleware.test.js', 'parser.test.js', 'schema.test.js', 'middleware.test.js', 'format.test.js', 'roster.test.js', 'inbox.test.js'],
    playwright: ['boot.spec.js', 'tokens.spec.js', 'data.spec.js', 'tabs.spec.js', 'types.spec.js', 'health.spec.js', 'roster.spec.js', 'inbox.spec.js', 'click-to-respond.spec.js'],
    screenshots: ['phase-4-v0.2/inbox-pending.png', 'phase-4-v0.2/inbox-modal-preview.png', 'phase-4-v0.2/inbox-after-respond.png'],
  },
  5: {
    label: 'Live Tail Integration',
    vitest: ['validator.test.js', 'response-builder.test.js', 'post-middleware.test.js', 'live-feed.test.js', 'sse-middleware.test.js', 'parser.test.js', 'schema.test.js', 'middleware.test.js', 'format.test.js', 'roster.test.js', 'inbox.test.js'],
    playwright: ['boot.spec.js', 'tokens.spec.js', 'data.spec.js', 'tabs.spec.js', 'types.spec.js', 'health.spec.js', 'roster.spec.js', 'inbox.spec.js', 'click-to-respond.spec.js', 'live-tail.spec.js', 'polish.spec.js', 'command-bar-active.spec.js'],
    screenshots: ['phase-5-v0.2/live-connected.png', 'phase-5-v0.2/live-message-arrived.png'],
  },
  6: {
    label: 'Polish + Final Sweep',
    vitest: ['parser.test.js', 'schema.test.js', 'format.test.js', 'roster.test.js', 'inbox.test.js', 'middleware.test.js', 'validator.test.js', 'response-builder.test.js', 'post-middleware.test.js', 'live-feed.test.js', 'sse-middleware.test.js'],
    playwright: ['boot.spec.js', 'tokens.spec.js', 'data.spec.js', 'tabs.spec.js', 'types.spec.js', 'health.spec.js', 'roster.spec.js', 'inbox.spec.js', 'click-to-respond.spec.js', 'live-tail.spec.js', 'polish.spec.js', 'command-bar-active.spec.js'],
    screenshots: ['phase-6-v0.2/general.png', 'phase-6-v0.2/flags.png', 'phase-6-v0.2/system.png', 'phase-6-v0.2/trickster.png', 'phase-6-v0.2/scanlines-off.png', 'phase-6-v0.2/live-connected.png'],
  },
  // ── v0.3 (Rich Content). Gate keys 7/8/9 = v0.3 Phases 1/2/3, reusing the
  // next integer keys so v0.2's phase numbers don't shift. ─────────────────
  7: {
    label: 'v0.3 Phase 1 — File Endpoint',
    vitest: ['artifact.test.js', 'file-middleware.test.js', 'open-and-links.test.js', 'validator.test.js', 'response-builder.test.js', 'post-middleware.test.js', 'live-feed.test.js', 'sse-middleware.test.js', 'parser.test.js', 'schema.test.js', 'middleware.test.js'],
    playwright: [],
    screenshots: [],
  },
  8: {
    label: 'v0.3 Phase 2 — Inline Render',
    vitest: ['artifact.test.js', 'file-middleware.test.js', 'open-and-links.test.js', 'format.test.js', 'parser.test.js', 'schema.test.js', 'middleware.test.js', 'validator.test.js'],
    playwright: ['boot.spec.js', 'tokens.spec.js', 'data.spec.js', 'tabs.spec.js', 'types.spec.js', 'rich-content.spec.js'],
    screenshots: ['phase-8-v0.3/general-artifacts.png', 'phase-8-v0.3/iframe-artifact.png'],
  },
  9: {
    label: 'v0.3 Phase 3 — Round-trip + Final Sweep',
    vitest: ['artifact.test.js', 'file-middleware.test.js', 'open-and-links.test.js', 'parser.test.js', 'schema.test.js', 'format.test.js', 'roster.test.js', 'inbox.test.js', 'middleware.test.js', 'validator.test.js', 'response-builder.test.js', 'post-middleware.test.js', 'live-feed.test.js', 'sse-middleware.test.js'],
    playwright: ['boot.spec.js', 'tokens.spec.js', 'data.spec.js', 'tabs.spec.js', 'types.spec.js', 'health.spec.js', 'roster.spec.js', 'inbox.spec.js', 'click-to-respond.spec.js', 'live-tail.spec.js', 'polish.spec.js', 'command-bar-active.spec.js', 'rich-content.spec.js', 'rich-content-roundtrip.spec.js'],
    screenshots: ['phase-9-v0.3/general-artifacts.png', 'phase-9-v0.3/iframe-artifact.png', 'phase-9-v0.3/flags.png', 'phase-9-v0.3/trickster.png'],
  },
};

function logRun(entry) {
  const line = JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n';
  appendFileSync(BUILD_LOG, line, 'utf8');
}

function ensureScreenshotDir(phase) {
  const dir = resolve(SCREENSHOTS_ROOT, `phase-${phase}`);
  mkdirSync(dir, { recursive: true });
  // Also ensure v0.2 / v0.3 subdirs for phases that use them.
  const v2dir = resolve(SCREENSHOTS_ROOT, `phase-${phase}-v0.2`);
  mkdirSync(v2dir, { recursive: true });
  const v3dir = resolve(SCREENSHOTS_ROOT, `phase-${phase}-v0.3`);
  mkdirSync(v3dir, { recursive: true });
}

function runVitest(testFiles) {
  if (!testFiles || testFiles.length === 0) {
    return { exitCode: 0, skipped: true };
  }
  // Build vitest arg list — pass the explicit file basenames.
  const args = ['vitest', 'run', '--reporter=default'];
  for (const f of testFiles) {
    args.push(`tests/unit/${f}`, `tests/integration/${f}`);
  }
  const res = spawnSync('npx', args, { cwd: APP_ROOT, stdio: 'inherit' });
  return { exitCode: res.status ?? 1 };
}

function runPlaywright(specFiles, env = {}) {
  if (!specFiles || specFiles.length === 0) {
    return { exitCode: 0, skipped: true };
  }
  const args = ['playwright', 'test', ...specFiles.map((f) => `tests/e2e/${f}`)];
  const res = spawnSync('npx', args, {
    cwd: APP_ROOT,
    stdio: 'inherit',
    env: { ...process.env, ...env },
  });
  return { exitCode: res.status ?? 1 };
}

function runCaptures(phaseId) {
  const args = ['playwright', 'test', 'tests/e2e/_capture.spec.js'];
  const res = spawnSync('npx', args, {
    cwd: APP_ROOT,
    stdio: 'inherit',
    env: { ...process.env, STIGMERGY_PHASE: String(phaseId) },
  });
  return { exitCode: res.status ?? 1 };
}

function checkPhase(phaseId) {
  const phase = PHASES[phaseId];
  if (!phase) {
    console.error(`Unknown phase: ${phaseId}`);
    process.exit(2);
  }
  console.log(`\n=== Phase ${phaseId} — ${phase.label} ===\n`);
  ensureScreenshotDir(phaseId);
  logRun({ phase: phaseId, label: phase.label, action: 'gate-start' });

  const vitestResult = runVitest(phase.vitest);
  if (vitestResult.exitCode !== 0) {
    logRun({ phase: phaseId, action: 'gate-end', outcome: 'fail', stage: 'vitest' });
    return vitestResult.exitCode;
  }

  const pwResult = runPlaywright(phase.playwright);
  if (pwResult.exitCode !== 0) {
    logRun({ phase: phaseId, action: 'gate-end', outcome: 'fail', stage: 'playwright' });
    return pwResult.exitCode;
  }

  // Plumbing phases declare no screenshots — there is nothing for the capture
  // spec to shoot, and running it would error ("No tests found") for a phase
  // with no matching capture branch.
  if (phase.screenshots && phase.screenshots.length > 0) {
    const capResult = runCaptures(phaseId);
    if (capResult.exitCode !== 0) {
      logRun({ phase: phaseId, action: 'gate-end', outcome: 'fail', stage: 'captures' });
      return capResult.exitCode;
    }
  }

  logRun({ phase: phaseId, action: 'gate-end', outcome: 'pass', stage: 'tests+captures' });
  console.log(`\n[phase-${phaseId}] tests + captures green. dispatch the visual-validator next.`);
  return 0;
}

function main() {
  const arg = process.argv[2];
  if (!arg) {
    console.error('Usage: node scripts/check-phase.js <1..6|all>');
    process.exit(2);
  }
  if (arg === 'all') {
    for (const p of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
      const code = checkPhase(p);
      if (code !== 0) process.exit(code);
    }
    process.exit(0);
  }
  const phaseId = parseInt(arg, 10);
  process.exit(checkPhase(phaseId));
}

main();
