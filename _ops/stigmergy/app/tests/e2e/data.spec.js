import { test, expect } from '@playwright/test';

// Phase 2 data layer tests — assume the dev server is running with
// PALACE_ROOT pointed at the real palace (or default). Any palace data
// containing at least one message will satisfy these.

test('after login, the app fetches /api/persistent and renders messages', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('login-banner')).toBeVisible({ timeout: 10_000 });

  // Click the [G] LURK button to enter the board view as a guest.
  await page.getByRole('button', { name: /lurk/i }).click();

  // Loading state appears, then the message list.
  await expect(page.getByTestId('message-row').first()).toBeVisible({ timeout: 15_000 });

  // At least one message rendered.
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
  await page.goto('/');
  await expect(page.getByTestId('login-banner')).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: /lurk/i }).click();
  await expect(page.getByTestId('message-row').first()).toBeVisible({ timeout: 15_000 });

  // The real persistent blackboard is full of audit-dump shape lines that
  // are missing the required fields, so at least some messages should be
  // flagged. (If running against a clean palace this assertion may fail —
  // skip in that case.)
  const flagged = await page.locator('[data-testid="message-row"][data-flagged="true"]').count();
  expect(flagged).toBeGreaterThan(0);
});
