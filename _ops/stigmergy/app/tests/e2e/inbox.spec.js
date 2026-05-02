import { test, expect } from '@playwright/test';

async function gotoBoard(page, demo = false) {
  await page.goto(demo ? '/?demo=1' : '/');
  await expect(page.getByTestId('login-banner')).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: /lurk/i }).click();
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

test('inbox shows the EDIT-the-file caption (read-only v0.1)', async ({ page }) => {
  await gotoBoard(page, true);
  await expect(page.getByTestId('inbox-edit-caption'))
    .toContainText('EDIT _ops/swarm/persistent/blackboard.jsonl TO RESPOND');
});

test('inbox response options are listed as text, not interactive controls', async ({ page }) => {
  await gotoBoard(page, true);
  const optsBlock = page.getByTestId('inbox-response-options').first();
  await expect(optsBlock).toBeVisible();
  // The options are inside a <ul>; ensure no <button> lives in there.
  const buttons = await optsBlock.locator('button').count();
  expect(buttons).toBe(0);
});

test('the inbox item displays agent metadata: from, ts, resource, blocking, agent_health, ctx', async ({ page }) => {
  await gotoBoard(page, true);
  const item = page.getByTestId('inbox-pending-item').first();
  const text = await item.textContent();
  expect(text).toMatch(/from: @/);
  expect(text).toMatch(/ts:/);
  expect(text).toMatch(/resource:/);
  expect(text).toMatch(/blocking:/);
  expect(text).toMatch(/ctx \d+%/);
  expect(text).toMatch(/status:/);
});

test('TRICKSTER tab shows pending counter on demo (and not without it)', async ({ page }) => {
  await gotoBoard(page, true);
  await expect(page.getByTestId('tab-trickster')).toContainText('PENDING');

  await page.goto('/');
  await page.getByRole('button', { name: /lurk/i }).click();
  await expect(page.getByTestId('channel-tabs')).toBeVisible();
  // Without ?demo=1, no pending → no PENDING badge.
  await expect(page.getByTestId('tab-trickster')).not.toContainText('PENDING');
});
