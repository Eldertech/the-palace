import { test, expect } from '@playwright/test';

// v0.4 renderable content types: equation (dual-channel math), table
// (structured grid), and choice (A/B / ranked pick over artifacts). Demo cards
// demo-eqn / demo-table / demo-choice live on GENERAL.

async function gotoGeneral(page) {
  await page.goto('/?demo=1');
  await expect(page.getByTestId('channel-tabs')).toBeVisible({ timeout: 15_000 });
  await page.getByTestId('tab-general').click();
  await expect(page.getByTestId('message-row').first()).toBeVisible({ timeout: 15_000 });
}

test('equation card renders symbolic + worded forms and a where-legend', async ({ page }) => {
  await gotoGeneral(page);
  const card = page.locator('[data-testid="message-row"][data-id="demo-eqn"]');
  const block = card.getByTestId('equation-block');
  await expect(block).toBeVisible();
  await expect(block.getByTestId('equation')).toHaveCount(2);

  const first = block.getByTestId('equation').first();
  await expect(first.getByTestId('equation-symbolic')).toContainText('dθᵢ/dt');
  await expect(first.getByTestId('equation-worded')).toContainText('natural_freq');
  await expect(first.getByTestId('equation-where')).toContainText('coupling strength');
});

test('table card renders a grid with a header and one row per data row', async ({ page }) => {
  await gotoGeneral(page);
  const card = page.locator('[data-testid="message-row"][data-id="demo-table"]');
  const block = card.getByTestId('table-block');
  await expect(block).toBeVisible();
  await expect(block.locator('th')).toHaveCount(4);
  await expect(block).toContainText('R (order param)');
  await expect(block.getByTestId('table-row')).toHaveCount(4);
});

test('choice card renders options with inline audio + a choice tag', async ({ page }) => {
  await gotoGeneral(page);
  const card = page.locator('[data-testid="message-row"][data-id="demo-choice"]');
  await expect(card.getByTestId('choice-tag')).toBeVisible();
  const block = card.getByTestId('choice-block');
  await expect(block).toBeVisible();
  await expect(block).toHaveAttribute('data-choice-mode', 'pick');
  await expect(block.getByTestId('choice-option')).toHaveCount(3);
  // Each option carries a playable audio artifact.
  await expect(block.locator('[data-testid="choice-option"] [data-testid="artifact-audio"]')).toHaveCount(3);
});

test('picking a choice option selects it and enables SEND', async ({ page }) => {
  await gotoGeneral(page);
  const block = page
    .locator('[data-testid="message-row"][data-id="demo-choice"]')
    .getByTestId('choice-block');
  const sendBtn = block.getByRole('button', { name: /send pick/i });
  await expect(sendBtn).toBeDisabled();

  const opt = block.getByTestId('choice-option').nth(1); // "synchronization arriving"
  await opt.locator('button').first().click();
  await expect(opt).toHaveAttribute('data-selected', 'true');
  await expect(sendBtn).toBeEnabled();
  // Do NOT click SEND — posting would write the live board; covered by unit
  // tests on buildChoiceResponse instead.
});
