import { test, expect } from '@playwright/test';

// The Weave's first GENERATIVE proposal type, surfaced in the terminal: the
// QUEUE header carries a "run vector-tuning audit" trigger beside the unsung-path
// and hub-promotion ones. Clicking it runs a DRY RUN against the real palace —
// and crucially, for the generative type the dry run is a CHEAP SCAN ONLY (no
// model call, nothing written): it surfaces the candidate entries whose
// forward_vector wants sharpening + honest counts ("would generate"). This spec
// asserts the trigger + the dry-run result. It NEVER clicks "generate & post",
// so the test never spawns a real `claude -p` and never writes a proposal.

async function gotoQueue(page) {
  await page.goto('/?deck=QUEUE');
  await expect(page.getByTestId('board-screen')).toBeVisible({ timeout: 10_000 });
}

test.describe('QUEUE — vector-tuning audit trigger', () => {
  test('the audit pulldown offers this kind', async ({ page }) => {
    await gotoQueue(page);
    await expect(page.getByTestId('audit-select')).toBeVisible();
    await expect(page.getByTestId('run-audit')).toBeVisible();
    await page.getByTestId('audit-select').selectOption('vector-tuning');
    await expect(page.getByTestId('audit-select')).toHaveValue('vector-tuning');
  });

  test('running it does a dry-run scan and surfaces honest counts (no generation, no write)', async ({ page }) => {
    await gotoQueue(page);
    await page.getByTestId('audit-select').selectOption('vector-tuning');
    await page.getByTestId('run-audit').click();
    const result = page.getByTestId('vector-tuning-audit-result');
    await expect(result).toBeVisible({ timeout: 25_000 }); // a full palace scan
    await expect(result).toContainText(/entries scanned/i);
    await expect(result).toContainText(/vector candidate/i);
    await expect(result).toContainText(/would generate/i);
    // The dry run NEVER generates or posts — the "posted N" outcome must not show.
    await expect(result).not.toContainText(/posted \d/i);
  });
});
