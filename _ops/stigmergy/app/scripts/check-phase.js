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
    playwright: ['boot.spec.js', 'tokens.spec.js', 'data.spec.js', 'tabs.spec.js', 'types.spec.js', 'health.spec.js', 'roster.spec.js', 'inbox.spec.js', 'click-to-respond.spec.js', 'live-tail.spec.js', 'polish.spec.js', 'command-bar-active.spec.js', 'rich-content.spec.js', 'rich-content-roundtrip.spec.js', 'ordering.spec.js'],
    screenshots: ['phase-9-v0.3/general-artifacts.png', 'phase-9-v0.3/iframe-artifact.png', 'phase-9-v0.3/flags.png', 'phase-9-v0.3/trickster.png'],
  },
  // ── v0.4 (Comparison / Table / Math). Gate key 10. ────────────────────────
  10: {
    label: 'v0.4 — Comparison / Table / Math',
    vitest: ['richcontent.test.js', 'format.test.js', 'parser.test.js', 'schema.test.js', 'validator.test.js'],
    playwright: ['boot.spec.js', 'tokens.spec.js', 'rich-content2.spec.js', 'ordering.spec.js'],
    screenshots: ['phase-10-v0.4/equation.png', 'phase-10-v0.4/table.png', 'phase-10-v0.4/choice.png'],
  },
  // ── v1.0 (Palace Front-End: STATE / QUEUE / LOG). Phase keys 11..19. ────────
  // v1.0 phases extend the existing integer-keyed sequence so v0.x numbers
  // don't shift. Subagent dispatch and STOP-REPORT discipline mirror v0.x.
  11: {
    label: 'v1.0 Phase 1 — STATE read',
    vitest: [
      'yaml-frontmatter.test.js', 'entries.test.js', 'bundle.test.js',
      'pulse.test.js', 'wikilink.test.js',
      'parser.test.js', 'schema.test.js', 'middleware.test.js', 'validator.test.js',
    ],
    integration: ['entries-middleware.test.js'],
    playwright: [
      'boot.spec.js', 'tokens.spec.js', 'tabs.spec.js', 'data.spec.js',
      'state-deck.spec.js',
    ],
    screenshots: [
      'phase-11-v1.0/state-deck-pulse.png',
      'phase-11-v1.0/state-deck-entry-reader.png',
      'phase-11-v1.0/state-deck-bundle-media.png',
      'phase-11-v1.0/state-deck-typed-links.png',
      'phase-11-v1.0/log-deck-stub.png',
    ],
  },
  12: {
    label: 'v1.0 Phase 2 — LOG read',
    vitest: [
      'commit-parse.test.js', 'git-log-parse.test.js', 'frontmatter-diff.test.js',
      'log-filter.test.js', 'yaml-frontmatter.test.js',
      'parser.test.js', 'schema.test.js', 'middleware.test.js', 'validator.test.js',
    ],
    integration: ['git-middleware.test.js'],
    playwright: [
      'boot.spec.js', 'tokens.spec.js', 'state-deck.spec.js', 'log-deck.spec.js',
    ],
    screenshots: [
      'phase-12-v1.0/log-stream.png',
      'phase-12-v1.0/log-commit-diff.png',
      'phase-12-v1.0/log-filtered.png',
    ],
  },
  13: {
    label: 'v1.0 Phase 2.5 — The Actuator',
    vitest: [
      'worker-log.test.js', 'commit-parse.test.js', 'git-log-parse.test.js',
      'frontmatter-diff.test.js', 'log-filter.test.js', 'yaml-frontmatter.test.js',
      'parser.test.js', 'schema.test.js', 'middleware.test.js', 'validator.test.js',
    ],
    integration: ['actuator.test.js', 'worker-middleware.test.js', 'git-middleware.test.js'],
    playwright: [
      'boot.spec.js', 'tokens.spec.js', 'actuator.spec.js',
    ],
    screenshots: [
      'phase-13-v1.0/actuator-idle.png',
      'phase-13-v1.0/actuator-fired.png',
    ],
  },
  14: {
    label: 'v1.0 Phase 3 — Commit spec (plumbing; no screenshots)',
    vitest: [
      'commit-spec.test.js', 'commit-parse.test.js', 'frontmatter-diff.test.js',
      'git-log-parse.test.js', 'worker-log.test.js', 'log-filter.test.js',
      'yaml-frontmatter.test.js', 'parser.test.js', 'schema.test.js',
      'middleware.test.js', 'validator.test.js',
    ],
    integration: ['commit-msg-hook.test.js', 'palace-commit.test.js', 'git-middleware.test.js'],
    playwright: [],
    screenshots: [],
  },
  15: {
    label: 'v1.0 Phase 4 — QUEUE reframe',
    vitest: [
      'queue-model.test.js', 'commit-parse.test.js', 'git-log-parse.test.js',
      'frontmatter-diff.test.js', 'log-filter.test.js', 'commit-spec.test.js',
      'worker-log.test.js', 'yaml-frontmatter.test.js', 'parser.test.js',
      'schema.test.js', 'middleware.test.js', 'validator.test.js', 'inbox.test.js',
    ],
    integration: ['git-middleware.test.js'],
    playwright: [
      'boot.spec.js', 'tokens.spec.js', 'queue-deck.spec.js',
    ],
    screenshots: [
      'phase-15-v1.0/queue-inbox.png',
      'phase-15-v1.0/queue-resolved.png',
    ],
  },
  16: {
    label: 'v1.0 Phase 4.5 — Enrichment consolidation',
    vitest: [
      'card-model.test.js', 'queue-model.test.js', 'commit-parse.test.js',
      'git-log-parse.test.js', 'frontmatter-diff.test.js', 'log-filter.test.js',
      'worker-log.test.js', 'yaml-frontmatter.test.js', 'parser.test.js',
      'schema.test.js', 'middleware.test.js', 'validator.test.js',
    ],
    integration: ['cards-middleware.test.js', 'actuator.test.js', 'git-middleware.test.js'],
    playwright: [
      'boot.spec.js', 'tokens.spec.js', 'card-queue.spec.js',
    ],
    screenshots: [
      'phase-16-v1.0/card-queue.png',
      'phase-16-v1.0/card-detail.png',
    ],
  },
  17: {
    label: 'v1.0 Phase 5 Stage A — STATE write (dry-run)',
    vitest: [
      'yaml-emit.test.js', 'entry-edit.test.js',
      'commit-spec.test.js', 'commit-parse.test.js', 'frontmatter-diff.test.js',
      'yaml-frontmatter.test.js', 'parser.test.js', 'schema.test.js',
      'middleware.test.js', 'validator.test.js',
    ],
    integration: ['entry-save-middleware.test.js', 'entries-middleware.test.js'],
    playwright: [
      'boot.spec.js', 'tokens.spec.js', 'state-editor.spec.js',
    ],
    screenshots: [
      'phase-17-v1.0/state-edit-form.png',
      'phase-17-v1.0/state-edit-preview.png',
    ],
  },
  18: {
    label: 'v1.0 Phase 5.5 — Topology Lens',
    vitest: [
      'topology.test.js', 'topology-roles.test.js', 'topology-bridges.test.js',
      'unsung-paths.test.js', 'entry-sort.test.js', 'pulse.test.js',
    ],
    playwright: [
      'boot.spec.js', 'tokens.spec.js', 'topology-lens.spec.js',
    ],
    screenshots: [
      'phase-18-v1.0/topology-overview.png',
      'phase-18-v1.0/topology-clicked-node.png',
    ],
  },
  19: {
    label: 'v1.0 Phase 6 — Steward Advance (board → permanent-steward cycle)',
    vitest: [
      'steward-lane.test.js', 'worker-log.test.js',
      'parser.test.js', 'schema.test.js', 'middleware.test.js', 'validator.test.js',
    ],
    integration: ['stewards-middleware.test.js', 'actuator.test.js', 'worker-middleware.test.js'],
    playwright: ['boot.spec.js', 'tokens.spec.js', 'stewards.spec.js'],
    // No automated captures: the advance flow fires a worker (stub-gated), so the
    // surface is verified live via the preview/e2e rather than the capture spec.
    screenshots: [],
  },
  20: {
    label: 'v1.0 Phase 7 — Commit from LOG (structured palace-commit)',
    vitest: [
      'commit-spec.test.js', 'commit-parse.test.js', 'worker-log.test.js',
      'parser.test.js', 'schema.test.js', 'middleware.test.js', 'validator.test.js',
    ],
    integration: ['commit-create-middleware.test.js', 'git-middleware.test.js'],
    playwright: ['boot.spec.js', 'tokens.spec.js', 'commit.spec.js'],
    // The composer's RECORD makes a real commit, so the gate exercises the
    // stage->commit path at the integration layer (throwaway repo) and the e2e
    // only verifies the surface + gating. No capture spec.
    screenshots: [],
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
  const v4dir = resolve(SCREENSHOTS_ROOT, `phase-${phase}-v0.4`);
  mkdirSync(v4dir, { recursive: true });
  const v1dir = resolve(SCREENSHOTS_ROOT, `phase-${phase}-v1.0`);
  mkdirSync(v1dir, { recursive: true });
}

function runVitest(testFiles, integrationFiles) {
  const all = [...(testFiles ?? [])];
  // Allow phases to declare integration-only files (e.g. entries-middleware
  // exists only under tests/integration/ and has no unit twin).
  const integOnly = [...(integrationFiles ?? [])];
  if (all.length === 0 && integOnly.length === 0) {
    return { exitCode: 0, skipped: true };
  }
  const args = ['vitest', 'run', '--reporter=default'];
  for (const f of all) {
    args.push(`tests/unit/${f}`, `tests/integration/${f}`);
  }
  for (const f of integOnly) {
    args.push(`tests/integration/${f}`);
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

  const vitestResult = runVitest(phase.vitest, phase.integration);
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
    for (const p of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]) {
      const code = checkPhase(p);
      if (code !== 0) process.exit(code);
    }
    process.exit(0);
  }
  const phaseId = parseInt(arg, 10);
  process.exit(checkPhase(phaseId));
}

main();
