import { test, expect } from '@playwright/test';

async function gotoDemoBoard(page) {
  await page.goto('/?demo=1');
  await expect(page.getByTestId('channel-tabs')).toBeVisible({ timeout: 15_000 });
}

test('every visible message renders a health block', async ({ page }) => {
  await gotoDemoBoard(page);
  await page.getByTestId('tab-general').click();
  const rows = await page.locator('[data-testid="message-row"]').all();
  expect(rows.length).toBeGreaterThan(0);
  for (const row of rows) {
    await expect(row.getByTestId('health-block')).toBeVisible();
  }
});

test('health-block data-score attribute reflects the message health.score', async ({ page }) => {
  await gotoDemoBoard(page);
  await page.getByTestId('tab-trickster').click();
  // The HEALTH_NOTICE demo message has score: red.
  const redHealth = page.locator('[data-testid="message-row"][data-type="HEALTH_NOTICE"] [data-testid="health-block"]');
  await expect(redHealth.first()).toHaveAttribute('data-score', 'red');
});

test('health-block format includes context %, model, and score tokens', async ({ page }) => {
  await gotoDemoBoard(page);
  await page.getByTestId('tab-general').click();
  const block = page.locator('[data-testid="message-row"] [data-testid="health-block"]').first();
  const text = await block.textContent();
  // Looks like: [ctx 18% · claude-sonnet-4-6 · green]
  expect(text).toMatch(/\[ctx \d+% · .+ · (green|yellow|red|—)\]/);
});

test('messages without a health block render the [no health] placeholder', async ({ page }) => {
  // Real palace audit-dump messages have no health block. Navigate to FLAGS
  // where some real-palace messages with `board: FLAGS` live.
  await page.goto('/');
  await expect(page.getByTestId('channel-tabs')).toBeVisible({ timeout: 15_000 });
  await page.getByTestId('tab-flags').click();
  await expect(page.getByTestId('message-row').first()).toBeVisible({ timeout: 10_000 });
  // At least one health-block on FLAGS should be the placeholder.
  const noneHealth = page.locator('[data-testid="health-block"][data-score="none"]');
  expect(await noneHealth.count()).toBeGreaterThan(0);
});
