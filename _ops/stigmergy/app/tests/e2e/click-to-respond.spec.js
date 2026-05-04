// click-to-respond.spec.js — Phase 4 e2e tests for the interactive Trickster inbox.
//
// POST cleanup strategy: option (a). Before each test that posts, the demo
// session file (demo-2026-05-02/blackboard.jsonl) is truncated to an empty
// file. This prevents accumulated writes from tests that ran earlier in the
// suite from affecting inbox state (a second GRANT for the same request_id
// would make the item disappear before we open the modal).
//
// The session directory is created by the middleware on first POST; subsequent
// tests clear only the file, not the directory.

import { test, expect } from '@playwright/test';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Palace root — two levels above the app directory (app/ is under _ops/stigmergy/).
const APP_ROOT = resolve(__dirname, '../..');
const PALACE_ROOT = resolve(APP_ROOT, '../../../..');
const DEMO_SESSION_DIR = resolve(PALACE_ROOT, '_ops/swarm/sessions/demo-2026-05-02');
const DEMO_SESSION_FILE = resolve(DEMO_SESSION_DIR, 'blackboard.jsonl');

function clearDemoSession() {
  mkdirSync(DEMO_SESSION_DIR, { recursive: true });
  writeFileSync(DEMO_SESSION_FILE, '', 'utf8');
}

async function gotoTrickster(page) {
  await page.goto('/?demo=1');
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
  clearDemoSession();
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
  clearDemoSession();
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
  clearDemoSession();
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
// a real 400 from the server requires injecting a malformed message. In v0.2
// there is no test-escape-hatch for this (mocking fetch in Playwright requires
// page.route, which would mock at the network level rather than testing the
// actual UI error path). This test is deferred to Phase 6 / v0.3 when a
// test-mode hook can be added.

// ── 6. Custom response uses typed text as constraints ────────────────────────

test('Custom response uses the typed text as constraints in the preview', async ({ page }) => {
  clearDemoSession();
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
  clearDemoSession();
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
  clearDemoSession();
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
