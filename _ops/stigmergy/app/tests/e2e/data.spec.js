import { test, expect } from '@playwright/test';

// Phase 2 data layer tests — assume the dev server is running with
// PALACE_ROOT pointed at the real palace (or default). Any palace data
// containing at least one message will satisfy these.

test('after login, the app fetches /api/persistent and renders messages', async ({ page }) => {
  // Use ?demo=1 so the default GENERAL board has visible messages even
  // against the real palace (where most data is on FLAGS / no-board).
  await page.goto('/?demo=1');
  await expect(page.getByTestId('login-banner')).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: /lurk/i }).click();
  await expect(page.getByTestId('message-row').first()).toBeVisible({ timeout: 15_000 });
  const rows = await page.getByTestId('message-row').count();
  expect(rows).toBeGreaterThan(0);
});

test('the API endpoint returns shaped data', async ({ request }) => {
  const res = await request.get('/api/persistent');
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(Array.isArray(body.messages)).toBe(true);
  expect(typeof body.file_size_bytes).toBe('number');
  expect(typeof body.last_modified).toBe('string');
});

test('flagged messages render with a red border (data-flagged="true")', async ({ page }) => {
  // Real palace FLAG-shaped messages (the TRICKSTER-ARTIFACT entries) live
  // on the FLAGS board but lack `schema_version` / `session_id` and use
  // a date-only ts — they should render flagged.
  await page.goto('/');
  await expect(page.getByTestId('login-banner')).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: /lurk/i }).click();
  await expect(page.getByTestId('channel-tabs')).toBeVisible({ timeout: 15_000 });
  await page.getByTestId('tab-flags').click();
  await expect(page.getByTestId('message-row').first()).toBeVisible({ timeout: 10_000 });
  const flagged = await page.locator('[data-testid="message-row"][data-flagged="true"]').count();
  expect(flagged).toBeGreaterThan(0);
});
