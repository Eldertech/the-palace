import { test, expect } from '@playwright/test';

// Demo modes (see App.jsx demoMode()):
//   '1'     → demo prepended onto live palace data
//   'only'  → demo ONLY (hermetic; deterministic pending set)
//   'empty' → no data (hermetic empty board)
// The inbox tests use the hermetic modes so they don't depend on whatever
// RESOURCE_REQUESTs the live palace board currently carries (the live board
// accumulates Steward requests over time; see V0.3-COMPLETE.md).
async function gotoBoard(page, demo = null) {
  await page.goto(demo ? `/?demo=${demo}` : '/');
  await expect(page.getByTestId('channel-tabs')).toBeVisible({ timeout: 15_000 });
  await page.getByTestId('tab-trickster').click();
}

test('Trickster inbox renders on the TRICKSTER tab', async ({ page }) => {
  await gotoBoard(page, '1');
  await expect(page.getByTestId('trickster-inbox')).toBeVisible();
});

test('with demo data, inbox shows at least one pending item', async ({ page }) => {
  await gotoBoard(page, 'only');
  // Demo data has req-demo-002 unpaired (RESOURCE_REQUEST without GRANT/DENY).
  const items = await page.getByTestId('inbox-pending-item').count();
  expect(items).toBeGreaterThan(0);
});

test('against a hermetic empty board, inbox shows the empty state', async ({ page }) => {
  // ?demo=empty loads no data at all, so the inbox is reliably empty regardless
  // of live palace state.
  await gotoBoard(page, 'empty');
  await expect(page.getByTestId('inbox-empty')).toBeVisible();
});

// v0.2: edit-caption is REMOVED. The file-edit path is no longer the canonical UI affordance.
test('inbox does NOT show the read-only edit-file caption (v0.2 interactive)', async ({ page }) => {
  await gotoBoard(page, '1');
  // inbox-edit-caption was removed in v0.2 Phase 4.
  await expect(page.getByTestId('inbox-edit-caption')).not.toBeVisible();
});

// v0.2: response options are interactive buttons, not a static list.
test('inbox response options are interactive buttons (v0.2)', async ({ page }) => {
  // 'only' so the first pending item is the canonical option-less demo request
  // (req-demo-002), which renders the modal-driven inbox-response-options block.
  await gotoBoard(page, 'only');
  const optsBlock = page.getByTestId('inbox-response-options').first();
  await expect(optsBlock).toBeVisible();
  // Each option is now a <button>.
  const buttons = await optsBlock.locator('button').count();
  expect(buttons).toBeGreaterThan(0);
});

test('the inbox item displays agent metadata: from, ts, resource, blocking, agent_health, ctx', async ({ page }) => {
  await gotoBoard(page, 'only');
  const item = page.getByTestId('inbox-pending-item').first();
  const text = await item.textContent();
  // Labels are padLabel-formatted (padded to 9 chars) so match with \s* between label and colon.
  expect(text).toMatch(/from\s*:\s*@/);
  expect(text).toMatch(/ts\s*:/);
  expect(text).toMatch(/resource\s*:/);
  expect(text).toMatch(/blocking\s*:/);
  expect(text).toMatch(/ctx \d+%/);
  expect(text).toMatch(/status\s*:/);
});

test('TRICKSTER tab shows pending counter on demo (and not on an empty board)', async ({ page }) => {
  await gotoBoard(page, 'only');
  await expect(page.getByTestId('tab-trickster')).toContainText('PENDING');

  await page.goto('/?demo=empty');
  await expect(page.getByTestId('channel-tabs')).toBeVisible();
  // Hermetic empty board → no pending → no PENDING badge.
  await expect(page.getByTestId('tab-trickster')).not.toContainText('PENDING');
});
