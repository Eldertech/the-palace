import { test, expect } from '@playwright/test';

// The Weave's posting half, surfaced in the terminal: the QUEUE header carries a
// "run unsung-path audit" trigger (ending the CLI-only bounce). Clicking it runs
// a DRY RUN against the real palace — read-only, nothing written — and surfaces
// honest counts (entries scanned / unsung / would post) plus an explicit
// "post N proposals" confirm. This spec asserts the trigger + the dry-run result.
// It NEVER clicks "post", so no canon proposal is seeded by the test run.

async function gotoQueue(page) {
  await page.goto('/?deck=QUEUE');
  await expect(page.getByTestId('board-screen')).toBeVisible({ timeout: 10_000 });
}

test.describe('QUEUE — unsung-path audit trigger', () => {
  test('the audit pulldown offers this kind', async ({ page }) => {
    await gotoQueue(page);
    await expect(page.getByTestId('audit-select')).toBeVisible();
    await expect(page.getByTestId('run-audit')).toBeVisible();
    await page.getByTestId('audit-select').selectOption('unsung');
    await expect(page.getByTestId('audit-select')).toHaveValue('unsung');
  });

  test('running it does a dry run and surfaces honest counts (no write)', async ({ page }) => {
    await gotoQueue(page);
    await page.getByTestId('audit-select').selectOption('unsung');
    await page.getByTestId('run-audit').click();
    // A full palace scan runs server-side — give it room.
    const result = page.getByTestId('unsung-audit-result');
    await expect(result).toBeVisible({ timeout: 25_000 });
    await expect(result).toContainText(/entries scanned/i);
    await expect(result).toContainText(/unsung/i);
    await expect(result).toContainText(/would post/i);
    // The dry run NEVER posts — the "posted N proposal(s)" outcome must not show.
    await expect(result).not.toContainText(/posted \d/i);
  });
});
