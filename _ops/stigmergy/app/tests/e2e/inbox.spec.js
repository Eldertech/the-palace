import { test, expect } from '@playwright/test';

async function gotoBoard(page, demo = false) {
  await page.goto(demo ? '/?demo=1' : '/');
  await expect(page.getByTestId('channel-tabs')).toBeVisible({ timeout: 15_000 });
  await page.getByTestId('tab-trickster').click();
}

test('Trickster inbox renders on the TRICKSTER tab', async ({ page }) => {
  await gotoBoard(page, true);
  await expect(page.getByTestId('trickster-inbox')).toBeVisible();
});

test('with demo data, inbox shows at least one pending item', async ({ page }) => {
  await gotoBoard(page, true);
  // Demo data has req-demo-002 unpaired (RESOURCE_REQUEST without GRANT/DENY).
  const items = await page.getByTestId('inbox-pending-item').count();
  expect(items).toBeGreaterThan(0);
});

test('without demo data and against an empty TRICKSTER board, inbox shows the empty state', async ({ page }) => {
  // The real palace persistent has no TRICKSTER-board RESOURCE_REQUESTs.
  await gotoBoard(page, false);
  await expect(page.getByTestId('inbox-empty')).toBeVisible();
});

// v0.2: edit-caption is REMOVED. The file-edit path is no longer the canonical UI affordance.
test('inbox does NOT show the read-only edit-file caption (v0.2 interactive)', async ({ page }) => {
  await gotoBoard(page, true);
  // inbox-edit-caption was removed in v0.2 Phase 4.
  await expect(page.getByTestId('inbox-edit-caption')).not.toBeVisible();
});

// v0.2: response options are interactive buttons, not a static list.
test('inbox response options are interactive buttons (v0.2)', async ({ page }) => {
  await gotoBoard(page, true);
  const optsBlock = page.getByTestId('inbox-response-options').first();
  await expect(optsBlock).toBeVisible();
  // Each option is now a <button>.
  const buttons = await optsBlock.locator('button').count();
  expect(buttons).toBeGreaterThan(0);
});

test('the inbox item displays agent metadata: from, ts, resource, blocking, agent_health, ctx', async ({ page }) => {
  await gotoBoard(page, true);
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

test('TRICKSTER tab shows pending counter on demo (and not without it)', async ({ page }) => {
  await gotoBoard(page, true);
  await expect(page.getByTestId('tab-trickster')).toContainText('PENDING');

  await page.goto('/');
  await expect(page.getByTestId('channel-tabs')).toBeVisible();
  // Without ?demo=1, no pending -- no PENDING badge.
  await expect(page.getByTestId('tab-trickster')).not.toContainText('PENDING');
});
