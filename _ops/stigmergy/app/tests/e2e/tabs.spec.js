import { test, expect } from '@playwright/test';

const BOARDS = ['GENERAL', 'FLAGS', 'WEAVE', 'SYSTEM', 'TRICKSTER', 'BRANCHES'];

async function gotoBoard(page) {
  await page.goto('/?demo=1');
  await expect(page.getByTestId('channel-tabs')).toBeVisible({ timeout: 15_000 });
}

test('all six channel tabs are rendered', async ({ page }) => {
  await gotoBoard(page);
  for (const b of BOARDS) {
    await expect(page.getByTestId(`tab-${b.toLowerCase()}`)).toBeVisible();
  }
});

test('clicking each tab marks it active and updates the displayed board name', async ({ page }) => {
  await gotoBoard(page);
  for (const b of BOARDS) {
    await page.getByTestId(`tab-${b.toLowerCase()}`).click();
    await expect(page.getByTestId(`tab-${b.toLowerCase()}`)).toHaveAttribute('data-active', 'true');
    // The h1 banner heading reflects the active board.
    await expect(page.getByRole('heading', { name: `${b.toLowerCase()} board` })).toBeVisible();
  }
});

test('messages on each tab match its board (no leakage)', async ({ page }) => {
  await gotoBoard(page);
  for (const b of BOARDS) {
    await page.getByTestId(`tab-${b.toLowerCase()}`).click();
    const rows = await page.locator('[data-testid="message-row"]').all();
    for (const row of rows) {
      const board = await row.getAttribute('data-board');
      expect(board, `row on tab ${b} has board=${board}`).toBe(b);
    }
  }
});

test('hotkey 1..6 switches channels', async ({ page }) => {
  await gotoBoard(page);
  // start on GENERAL (key 1), switch to FLAGS via key 2
  await page.keyboard.press('2');
  await expect(page.getByTestId('tab-flags')).toHaveAttribute('data-active', 'true');
  await page.keyboard.press('5');
  await expect(page.getByTestId('tab-trickster')).toHaveAttribute('data-active', 'true');
});

test('an empty board shows the documented empty-state copy', async ({ page }) => {
  // Without ?demo=1, most boards are empty against the real palace.
  await page.goto('/');
  await expect(page.getByTestId('channel-tabs')).toBeVisible({ timeout: 15_000 });
  // GENERAL is unlikely to have real data; click it.
  await page.getByTestId('tab-general').click();
  // Empty state appears when no messages match this tab.
  const rows = await page.locator('[data-testid="message-row"]').count();
  if (rows === 0) {
    await expect(page.getByTestId('empty-board')).toBeVisible();
  }
});
