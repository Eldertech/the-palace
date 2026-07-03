import { test, expect } from '@playwright/test';

// The Weave's hybrid label-enrichment type, surfaced in the terminal: the QUEUE
// header carries a "run label-enrichment audit" trigger. Like vector-tuning (the
// other generative one), the dry run is a CHEAP SCAN ONLY — it finds typed links
// missing a register label + honest counts ("would generate"), no model call,
// nothing written. This spec asserts the trigger + the dry-run result. It NEVER
// clicks "generate & post", so it never spawns a real `claude -p` and never writes.

async function gotoQueue(page) {
  await page.goto('/?deck=QUEUE');
  await expect(page.getByTestId('board-screen')).toBeVisible({ timeout: 10_000 });
}

test.describe('QUEUE — label-enrichment audit trigger', () => {
  test('the audit pulldown offers this kind', async ({ page }) => {
    await gotoQueue(page);
    await expect(page.getByTestId('audit-select')).toBeVisible();
    await expect(page.getByTestId('run-audit')).toBeVisible();
    await page.getByTestId('audit-select').selectOption('label');
    await expect(page.getByTestId('audit-select')).toHaveValue('label');
  });

  test('running it does a dry-run scan and surfaces honest counts (no generation, no write)', async ({ page }) => {
    await gotoQueue(page);
    await page.getByTestId('audit-select').selectOption('label');
    await page.getByTestId('run-audit').click();
    const result = page.getByTestId('label-audit-result');
    await expect(result).toBeVisible({ timeout: 25_000 });
    await expect(result).toContainText(/entries scanned/i);
    await expect(result).toContainText(/label candidate/i);
    await expect(result).toContainText(/would generate/i);
    await expect(result).not.toContainText(/posted \d/i);
  });
});
