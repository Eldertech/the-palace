import { test, expect } from '@playwright/test';

// The Weave's second detection-based proposal type, surfaced in the terminal:
// the QUEUE header carries a "run hub-promotion audit" trigger beside the
// unsung-path one. Clicking it runs a DRY RUN against the real palace
// (read-only — nothing written) and surfaces honest counts (entries scanned /
// hub candidates / would post). This spec asserts the trigger + the dry-run
// result. It NEVER clicks "post", so no canon retype is proposed by the test.

async function gotoQueue(page) {
  await page.goto('/?deck=QUEUE');
  await expect(page.getByTestId('board-screen')).toBeVisible({ timeout: 10_000 });
}

test.describe('QUEUE — hub-promotion audit trigger', () => {
  test('the trigger is present in the QUEUE header', async ({ page }) => {
    await gotoQueue(page);
    const trigger = page.getByTestId('run-hub-audit');
    await expect(trigger).toBeVisible();
    await expect(trigger).toContainText(/run hub-promotion audit/i);
  });

  test('clicking it runs a dry run and surfaces honest counts (no write)', async ({ page }) => {
    await gotoQueue(page);
    await page.getByTestId('run-hub-audit').click();
    const result = page.getByTestId('hub-audit-result');
    await expect(result).toBeVisible({ timeout: 25_000 }); // a full palace scan
    await expect(result).toContainText(/entries scanned/i);
    await expect(result).toContainText(/hub candidate/i);
    await expect(result).toContainText(/would post/i);
    // The dry run NEVER posts — the "posted N proposal(s)" outcome must not show.
    await expect(result).not.toContainText(/posted \d/i);
  });
});
