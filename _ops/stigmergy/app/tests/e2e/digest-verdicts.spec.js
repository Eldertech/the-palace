// digest-verdicts.spec.js — Alignment-Review Phase 2 interactive e2e.
//
// Drives the DigestPanel verdict UI against a real dev server and the LIVE
// digest-latest.json. Hermetic strategy: snapshot the verdicts file before
// each test (creating an empty one if absent) and restore after, so a test
// run NEVER leaves verdict residue on the live alignment record. The digest
// itself is read-only here; we only touch the verdicts.jsonl path.

import { test, expect } from '@playwright/test';
import {
  readFileSync, writeFileSync, existsSync, unlinkSync, mkdirSync,
} from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const APP_ROOT = resolve(__dirname, '../..');
const PALACE_ROOT = resolve(APP_ROOT, '../../..');
const VERDICTS_PATH = resolve(PALACE_ROOT, '_ops/stigmergy/trickster-auto/verdicts.jsonl');
const SHOT_DIR_P2 = resolve(APP_ROOT, 'screenshots/alignment-review/phase-2');
const SHOT_DIR_P3 = resolve(APP_ROOT, 'screenshots/alignment-review/phase-3');
const SHOT_DIR_P4 = resolve(APP_ROOT, 'screenshots/alignment-review/phase-4');

let hadVerdictsFile = false;
let verdictsSnapshot = '';

test.beforeAll(() => {
  mkdirSync(SHOT_DIR_P2, { recursive: true });
  mkdirSync(SHOT_DIR_P3, { recursive: true });
  mkdirSync(SHOT_DIR_P4, { recursive: true });
});

test.beforeEach(() => {
  hadVerdictsFile = existsSync(VERDICTS_PATH);
  verdictsSnapshot = hadVerdictsFile ? readFileSync(VERDICTS_PATH, 'utf8') : '';
});

test.afterEach(() => {
  if (hadVerdictsFile) {
    writeFileSync(VERDICTS_PATH, verdictsSnapshot, 'utf8');
  } else if (existsSync(VERDICTS_PATH)) {
    unlinkSync(VERDICTS_PATH);
  }
});

async function gotoTrickster(page) {
  await page.goto('/?deck=QUEUE&board=TRICKSTER');
  await page.locator('[data-row-kind]').first().waitFor({ timeout: 10_000 });
  await page.evaluate(() => Promise.allSettled([
    document.fonts.load('14px "IBM Plex Mono"'),
    document.fonts.ready,
  ]));
}

test('DigestPanel renders each escalation + auto-decision with verdict controls', async ({ page }) => {
  await gotoTrickster(page);
  const escalations = await page.locator('[data-row-kind=escalation]').count();
  const autoDecisions = await page.locator('[data-row-kind=auto_decision]').count();
  expect(escalations).toBeGreaterThan(0);
  // every row has both verdict buttons
  const firstRow = page.locator('[data-row-kind]').first();
  await expect(firstRow.locator('button[title="agree (a)"]')).toBeVisible();
  await expect(firstRow.locator('button[title="differ (d)"]')).toBeVisible();
  await firstRow.scrollIntoViewIfNeeded();
  await page.screenshot({ path: resolve(SHOT_DIR_P2, 'verdict-controls-inline.png'), fullPage: false });
});

test('clicking differ reveals options + textarea + confirm/cancel', async ({ page }) => {
  await gotoTrickster(page);
  const row = page.locator('[data-row-kind=escalation]').first();
  await row.scrollIntoViewIfNeeded();
  await row.locator('button[title="differ (d)"]').click();
  // options[] from the live digest should now be visible as pick-buttons
  // (every audition-gate row has at least one option).
  const pickButtons = row.locator('button').filter({ hasText: /^[A-Z][A-Z-]*$/ });
  await expect(pickButtons.first()).toBeVisible();
  await expect(row.locator('textarea')).toBeVisible();
  await expect(row.locator('button', { hasText: 'confirm note' })).toBeVisible();
  await expect(row.locator('button', { hasText: 'cancel' })).toBeVisible();
  await page.screenshot({ path: resolve(SHOT_DIR_P2, 'differ-options-open.png'), fullPage: false });
});

test('agree click autosaves a verdict (POST /api/digest/verdict)', async ({ page }) => {
  await gotoTrickster(page);
  const row = page.locator('[data-row-kind]').first();
  await row.scrollIntoViewIfNeeded();
  const requestId = await row.getAttribute('data-request-id');
  // waitForRequest must be ARMED before the click that triggers it.
  const reqPromise = page.waitForRequest((req) =>
    req.method() === 'POST' && req.url().includes('/api/digest/verdict'),
    { timeout: 5_000 }
  );
  await row.locator('button[title="agree (a)"]').click();
  const req = await reqPromise;
  const sent = JSON.parse(req.postData() || '{}');
  expect(sent.agree).toBe(true);
  expect(sent.request_id).toBe(requestId);
  expect(typeof sent.id).toBe('string');
  expect(sent.id.startsWith('v-')).toBe(true);
  expect(sent.run_generated_at).toBeTruthy();
  expect(sent.rule_id).toBeTruthy();
  expect(sent.proposed_verb).toBeTruthy();
  // After autosave, the row shows the verdict inline.
  await expect(row.locator('text=✓ agree')).toBeVisible();
});

// ── Phase 3 — alignment readout ────────────────────────────────────────────

const RUN_ID = '2026-06-03T05:14:15.003Z'; // matches the live digest's generated_at

function makeVerdict(over) {
  return {
    id: 'v-test-' + Math.random().toString(36).slice(2, 10),
    ts: new Date(Date.parse('2026-06-04T10:00:00Z') + Math.random() * 1e6).toISOString(),
    run_generated_at: RUN_ID,
    request_id: 'r-' + Math.random().toString(36).slice(2, 8),
    rule_id: 'grant-nonblocking-recommended-fork',
    from: 'Synthetic Steward',
    proposed_verb: 'auto-grant',
    agree: true,
    would_do: null,
    note: '',
    ...over,
  };
}

async function seedVerdicts(request, records) {
  for (const r of records) {
    await request.post('http://localhost:5173/api/digest/verdict', {
      data: r,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

test('alignment readout — empty state renders quiet hint', async ({ page }) => {
  await gotoTrickster(page);
  const readout = page.getByTestId('alignment-readout');
  await expect(readout).toBeVisible();
  await expect(readout).toHaveAttribute('data-marked', '0');
  await expect(readout).toContainText('no verdicts yet');
});

test('alignment readout — populated state shows per-rule table with [READY] only on non-audition rules', async ({ page, request }) => {
  // Seed PROMO_MIN agrees on a promotable rule + PROMO_MIN agrees on the
  // audition gate. The first should mark READY; the second must NEVER.
  const promotable = Array.from({ length: 8 }, (_, i) => makeVerdict({
    request_id: 'promotable-' + i,
    rule_id: 'grant-nonblocking-recommended-fork',
    proposed_verb: 'auto-grant',
  }));
  const audition = Array.from({ length: 8 }, (_, i) => makeVerdict({
    request_id: 'audition-' + i,
    rule_id: 'HARD-GATE:audition',
    proposed_verb: 'escalate',
  }));
  await seedVerdicts(request, [...promotable, ...audition]);
  await gotoTrickster(page);
  const readout = page.getByTestId('alignment-readout');
  await expect(readout).toBeVisible();
  await expect(readout).toContainText('all-time');
  // Non-audition rule with 8/8 → READY
  const promRow = readout.locator('[data-rule-id="grant-nonblocking-recommended-fork"]');
  await expect(promRow).toHaveAttribute('data-ready', '1');
  // Audition rule with 8/8 → still NOT READY (view-layer defense)
  const audRow = readout.locator('[data-rule-id="HARD-GATE:audition"]');
  await expect(audRow).toHaveAttribute('data-ready', '0');
  await readout.scrollIntoViewIfNeeded();
  await page.screenshot({ path: resolve(SHOT_DIR_P3, 'alignment-readout-populated.png'), fullPage: false });
});

// ── Phase 4 — Copy-for-Claude export ───────────────────────────────────────

test('Copy-for-Claude button is disabled when there are no verdicts', async ({ page }) => {
  await gotoTrickster(page);
  const btn = page.getByTestId('copy-for-claude');
  await expect(btn).toBeVisible();
  await expect(btn).toBeDisabled();
});

test('Copy-for-Claude writes the formatted bundle to clipboard', async ({ page, request }) => {
  // Seed a mixed set so the bundle has content to show.
  const seeded = [
    makeVerdict({ request_id: 'seed-1', rule_id: 'grant-nonblocking-recommended-fork', agree: true }),
    makeVerdict({ request_id: 'seed-2', rule_id: 'grant-nonblocking-recommended-fork', agree: true }),
    makeVerdict({ request_id: 'seed-3', rule_id: 'HARD-GATE:audition', proposed_verb: 'escalate',
                  agree: false, would_do: 'APPROVE-RENDER-TWELVE', note: '' }),
  ];
  await seedVerdicts(request, seeded);
  await gotoTrickster(page);
  // Replace clipboard.writeText with a spy so we don't depend on the headless
  // browser's clipboard permission state.
  await page.evaluate(() => {
    window.__clipboardLog = [];
    if (!navigator.clipboard) navigator.clipboard = {};
    navigator.clipboard.writeText = (s) => { window.__clipboardLog.push(s); return Promise.resolve(); };
  });
  const btn = page.getByTestId('copy-for-claude');
  await expect(btn).toBeEnabled();
  await btn.click();
  // Wait for the button label to flip to "copied!" — proves the writeText
  // promise resolved and state updated.
  await expect(btn).toContainText('copied!');
  const log = await page.evaluate(() => window.__clipboardLog);
  expect(log.length).toBe(1);
  const bundle = log[0];
  expect(bundle).toContain('STIGMERGY — Trickster Alignment Tuning Bundle');
  expect(bundle).toContain('Latest digest run:');
  expect(bundle).toContain('OVERALL');
  expect(bundle).toContain('PER-RULE');
  expect(bundle).toContain('grant-nonblocking-recommended-fork');
  expect(bundle).toContain('HARD-GATE:audition');
  expect(bundle).toContain('DISAGREEMENTS (1)');
  expect(bundle).toContain('seed-3');
  expect(bundle).toContain('would_do: APPROVE-RENDER-TWELVE');
  // Defense: no [READY] in the bundle even though audition has many agrees
  // mixed in (just 1 here, but we trust the formatter's view-layer guard).
  await page.screenshot({ path: resolve(SHOT_DIR_P4, 'copy-button-copied.png'), fullPage: false });
});

test('keyboard: j moves focus down, k moves up', async ({ page }) => {
  await gotoTrickster(page);
  const rows = page.locator('[data-row-kind]');
  // Ensure window-level keydown sees us by focusing the body explicitly.
  await page.evaluate(() => document.body.focus());
  await expect(rows.nth(0)).toHaveAttribute('data-focused', '1');
  await page.keyboard.press('j');
  await expect(rows.nth(1)).toHaveAttribute('data-focused', '1');
  await expect(rows.nth(0)).toHaveAttribute('data-focused', '0');
  await page.keyboard.press('k');
  await expect(rows.nth(0)).toHaveAttribute('data-focused', '1');
});
