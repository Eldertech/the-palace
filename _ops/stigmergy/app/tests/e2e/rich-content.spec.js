import { test, expect } from '@playwright/test';

// v0.3 — inline rich-content rendering. Exercises the demo enrichment cards
// (demo-art-1 single image, demo-art-2 multi image+audio+html) on GENERAL.

async function gotoGeneral(page) {
  await page.goto('/?demo=1');
  await expect(page.getByTestId('channel-tabs')).toBeVisible({ timeout: 15_000 });
  await page.getByTestId('tab-general').click();
  await expect(page.getByTestId('message-row').first()).toBeVisible({ timeout: 15_000 });
}

test('an enrichment card renders an inline image artifact', async ({ page }) => {
  await gotoGeneral(page);
  const card = page.locator('[data-testid="message-row"][data-id="demo-art-1"]');
  await expect(card).toBeVisible();
  await expect(card.getByTestId('artifact-slot')).toBeVisible();
  const img = card.locator('[data-testid="artifact"][data-artifact-type="image"] [data-testid="artifact-img"]');
  await expect(img).toBeVisible();
  await expect(img).toHaveAttribute('src', /\/api\/file\?path=/);
});

test('enrichment cards carry the enrichment tag', async ({ page }) => {
  await gotoGeneral(page);
  const card = page.locator('[data-testid="message-row"][data-id="demo-art-1"]');
  await expect(card.getByTestId('enrichment-tag')).toBeVisible();
});

test('a multi-artifact card renders image + audio + iframe with captions', async ({ page }) => {
  await gotoGeneral(page);
  const card = page.locator('[data-testid="message-row"][data-id="demo-art-2"]');
  await expect(card).toBeVisible();
  const artifacts = card.locator('[data-testid="artifact"]');
  await expect(artifacts).toHaveCount(3);

  await expect(card.locator('[data-artifact-type="image"] [data-testid="artifact-img"]')).toBeVisible();
  await expect(card.locator('[data-artifact-type="audio"] [data-testid="artifact-audio"]')).toBeVisible();
  await expect(card.locator('[data-artifact-type="iframe"] [data-testid="artifact-iframe"]')).toBeVisible();

  // Each artifact carries its caption.
  await expect(card.getByTestId('artifact-caption')).toHaveCount(3);
});

test('the iframe sandbox is allow-scripts ONLY (no allow-same-origin)', async ({ page }) => {
  await gotoGeneral(page);
  const iframe = page
    .locator('[data-testid="message-row"][data-id="demo-art-2"] [data-testid="artifact-iframe"]');
  await expect(iframe).toBeVisible();
  const sandbox = await iframe.getAttribute('sandbox');
  expect(sandbox).toBe('allow-scripts');
  expect(sandbox).not.toContain('allow-same-origin');
});
