import { test, expect } from '@playwright/test';

// v1.0 Phase 7 — Commit from the LOG deck.
//
// Read-only by construction: these verify the uncommitted indicator and the
// composer's RECORD gating. They NEVER click RECORD (that would make a real
// commit against the live palace). The stage→commit path is proven
// deterministically at the integration layer (commit-create-middleware.test.js)
// against a throwaway git repo.

test('the LOG deck shows the uncommitted indicator (banner or clean line)', async ({ page }) => {
  await page.goto('/?deck=log');
  await expect(page.getByTestId('log-deck')).toBeVisible({ timeout: 10_000 });
  const banner = page.getByTestId('uncommitted-banner');
  const clean = page.getByTestId('uncommitted-clean');
  await expect(banner.or(clean)).toBeVisible({ timeout: 10_000 });
});

test('the composer gates RECORD until a file + summary are set (no real commit)', async ({ page }) => {
  await page.goto('/?deck=log');
  await expect(page.getByTestId('log-deck')).toBeVisible({ timeout: 10_000 });
  // Wait for the /api/uncommitted fetch to resolve (banner xor clean line)
  // BEFORE deciding to skip -- else we race the async load and skip wrongly.
  const banner = page.getByTestId('uncommitted-banner');
  const clean = page.getByTestId('uncommitted-clean');
  await expect(banner.or(clean)).toBeVisible({ timeout: 10_000 });
  const composer = page.getByTestId('commit-composer');
  test.skip((await composer.count()) === 0, 'working tree is clean -- no composer to exercise');
  await expect(composer).toBeVisible();

  const record = page.getByTestId('commit-record').locator('button');
  await expect(record).toBeDisabled();

  // Select the first file + type a summary -> RECORD enables. We stop here;
  // clicking RECORD is what the integration test exercises safely.
  await page.locator('[data-testid="commit-file"]').first().click();
  await page.getByTestId('commit-summary').fill('e2e gating check (not recorded)');
  await expect(record).toBeEnabled();
});
