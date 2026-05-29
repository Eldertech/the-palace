// click-to-respond.spec.js — Phase 4 e2e tests for the interactive Trickster inbox.
//
// Hermetic strategy (v0.3): these tests run in ?demo=only mode, so the visible
// data is the demo set ALONE (no live palace board). That makes the pending set
// deterministic — exactly one option-less demo request (req-demo-002), which
// renders the modal-driven `inbox-response-options` block. The confirm tests
// POST a RESOURCE_GRANT to the real persistent board (the UI always posts to
// /api/persistent); to leave no trace, we snapshot the persistent blackboard
// once and restore it after every test.
//
// Why this changed: under ?demo=1 the live palace board's Steward
// RESOURCE_REQUESTs (which carry payload.options[] and render the InlineResponse
// form, not inbox-response-options) sort above the demo request, and confirm
// tests left orphan GRANTs on the live board — both made these tests flaky as
// the live board evolved. See V0.3-COMPLETE.md "live-board drift".

import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// app/ is at <palace>/_ops/stigmergy/app, so the palace root is three levels up.
const APP_ROOT = resolve(__dirname, '../..');
const PALACE_ROOT = resolve(APP_ROOT, '../../..');
const PERSISTENT_BB = resolve(PALACE_ROOT, '_ops/swarm/persistent/blackboard.jsonl');

let boardSnapshot = '';
test.beforeAll(() => {
  boardSnapshot = readFileSync(PERSISTENT_BB, 'utf8');
});
// Restore after every test so a confirmed RESOURCE_GRANT never lingers on the
// live board (and so tests don't interfere with each other). afterAll repeats
// the restore as belt-and-suspenders: under check:all the dev server is reused
// across phases, so a phase that ends clean keeps the next phase's snapshot clean.
test.afterEach(() => {
  writeFileSync(PERSISTENT_BB, boardSnapshot, 'utf8');
});
test.afterAll(() => {
  writeFileSync(PERSISTENT_BB, boardSnapshot, 'utf8');
});

async function gotoTrickster(page) {
  await page.goto('/?demo=only');
  await expect(page.getByTestId('channel-tabs')).toBeVisible({ timeout: 15_000 });
  await page.getByTestId('tab-trickster').click();
  await expect(page.getByTestId('trickster-inbox')).toBeVisible({ timeout: 5_000 });
}

// ── 1. TRICKSTER tab loads with pending requests visible ─────────────────────

test('TRICKSTER tab loads with pending requests visible', async ({ page }) => {
  await gotoTrickster(page);
  const count = await page.getByTestId('inbox-pending-item').count();
  expect(count).toBeGreaterThanOrEqual(1);
});

// ── 2. Click Grant-limited -> modal opens with preview JSON ──────────────────

test('Click a Grant -- limited button opens modal with RESOURCE_GRANT preview JSON', async ({ page }) => {
  await gotoTrickster(page);

  // Get the first pending item and its first response button (Grant -- limited).
  const firstItem = page.getByTestId('inbox-pending-item').first();
  await expect(firstItem).toBeVisible();

  // Read the request_id from the item text so we can assert it appears in preview.
  const itemText = await firstItem.textContent();
  const reqIdMatch = itemText.match(/req:\s*(req-\S+)/);
  const requestId = reqIdMatch?.[1]?.replace(/\s.*$/, '').trim() ?? null;

  // Click the first button (Grant -- limited = option 1).
  const firstBtn = firstItem.getByTestId('inbox-response-options').locator('button').first();
  await firstBtn.click();

  // Modal should appear.
  const modal = page.getByTestId('response-modal');
  await expect(modal).toBeVisible({ timeout: 3_000 });

  // Preview should contain RESOURCE_GRANT.
  const preview = page.getByTestId('response-modal-preview');
  await expect(preview).toContainText('RESOURCE_GRANT');

  // Preview should contain the request_id as the `re:` correlation field.
  if (requestId) {
    await expect(preview).toContainText(requestId);
  }
});

// ── 3. Cancel closes the modal, pending item still present ───────────────────

test('Cancel button closes the modal without posting', async ({ page }) => {
  await gotoTrickster(page);

  const firstItem = page.getByTestId('inbox-pending-item').first();
  const firstBtn = firstItem.getByTestId('inbox-response-options').locator('button').first();
  await firstBtn.click();

  const modal = page.getByTestId('response-modal');
  await expect(modal).toBeVisible({ timeout: 3_000 });

  // Click CANCEL.
  await modal.getByRole('button', { name: /cancel/i }).click();

  // Modal should close.
  await expect(modal).not.toBeVisible({ timeout: 3_000 });

  // The pending item is still in the list.
  const count = await page.getByTestId('inbox-pending-item').count();
  expect(count).toBeGreaterThanOrEqual(1);
});

// ── 4. Confirm sends; request disappears from pending list ───────────────────

test('Confirm sends and the request disappears from the pending list', async ({ page }) => {
  await gotoTrickster(page);

  // Record how many pending items there are before.
  const countBefore = await page.getByTestId('inbox-pending-item').count();
  expect(countBefore).toBeGreaterThanOrEqual(1);

  // Open modal for the first pending item, first option.
  const firstItem = page.getByTestId('inbox-pending-item').first();
  const firstBtn = firstItem.getByTestId('inbox-response-options').locator('button').first();
  await firstBtn.click();

  const modal = page.getByTestId('response-modal');
  await expect(modal).toBeVisible({ timeout: 3_000 });

  // Click CONFIRM.
  await modal.getByRole('button', { name: /^confirm/i }).click();

  // Modal should close after successful POST.
  await expect(modal).not.toBeVisible({ timeout: 8_000 });

  // The pending list should have shrunk by 1.
  const countAfter = await page.getByTestId('inbox-pending-item').count();
  expect(countAfter).toBe(countBefore - 1);
});

// ── 5. Validation errors — skipped; see note below ──────────────────────────
// The buildResponse output is §2.2-conformant by construction, so triggering
// a real 400 from the server requires injecting a malformed message. Deferred.

// ── 6. Custom response uses typed text as constraints ────────────────────────

test('Custom response uses the typed text as constraints in the preview', async ({ page }) => {
  await gotoTrickster(page);

  const firstItem = page.getByTestId('inbox-pending-item').first();
  // "Custom response" is option index 3 (4th button, 0-indexed).
  const customBtn = firstItem.getByTestId('inbox-response-options').locator('button').nth(3);
  await customBtn.click();

  const modal = page.getByTestId('response-modal');
  await expect(modal).toBeVisible({ timeout: 3_000 });

  // Type into the custom field.
  const customText = 'max 2 external calls only';
  await modal.locator('input').fill(customText);

  // Preview should update to include the custom text.
  const preview = page.getByTestId('response-modal-preview');
  await expect(preview).toContainText(customText);

  // Confirm posts successfully.
  await modal.getByRole('button', { name: /^confirm/i }).click();
  await expect(modal).not.toBeVisible({ timeout: 8_000 });
});

// ── 7. ESC key cancels ────────────────────────────────────────────────────────

test('ESC key cancels the modal', async ({ page }) => {
  await gotoTrickster(page);

  const firstItem = page.getByTestId('inbox-pending-item').first();
  const firstBtn = firstItem.getByTestId('inbox-response-options').locator('button').first();
  await firstBtn.click();

  const modal = page.getByTestId('response-modal');
  await expect(modal).toBeVisible({ timeout: 3_000 });

  await page.keyboard.press('Escape');
  await expect(modal).not.toBeVisible({ timeout: 3_000 });
});

// ── 8. ENTER key confirms ─────────────────────────────────────────────────────

test('ENTER key confirms and posts', async ({ page }) => {
  await gotoTrickster(page);

  // Record pending count before.
  const countBefore = await page.getByTestId('inbox-pending-item').count();

  const firstItem = page.getByTestId('inbox-pending-item').first();
  const firstBtn = firstItem.getByTestId('inbox-response-options').locator('button').first();
  await firstBtn.click();

  const modal = page.getByTestId('response-modal');
  await expect(modal).toBeVisible({ timeout: 3_000 });

  // Press Enter to confirm.
  await page.keyboard.press('Enter');

  // Modal should close.
  await expect(modal).not.toBeVisible({ timeout: 8_000 });

  // Pending list shrinks.
  const countAfter = await page.getByTestId('inbox-pending-item').count();
  expect(countAfter).toBe(countBefore - 1);
});
