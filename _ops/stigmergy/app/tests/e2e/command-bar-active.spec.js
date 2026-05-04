import { test, expect } from '@playwright/test';

// Board names indexed 1..6 matching the BOARDS array in format.js.
const BOARDS = ['GENERAL', 'FLAGS', 'WEAVE', 'SYSTEM', 'TRICKSTER', 'BRANCHES'];

// Numeric keys that correspond to boards (keys '1' through '6').
const NUMERIC_KEYS = ['1', '2', '3', '4', '5', '6'];

test.beforeEach(async ({ page }) => {
  await page.goto('/?demo=1');
  await expect(page.getByTestId('channel-tabs')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('command-bar')).toBeVisible({ timeout: 5_000 });
});

for (let i = 0; i < BOARDS.length; i++) {
  const board = BOARDS[i];
  const key = String(i + 1);
  const tabId = `tab-${board.toLowerCase()}`;

  test(`command-bar active state: clicking ${board} tab inverts key [${key}]`, async ({ page }) => {
    // Click the channel tab for this board.
    await page.getByTestId(tabId).click();
    // Wait for the tab to reflect active state.
    await expect(page.getByTestId(tabId)).toHaveAttribute('data-active', 'true');

    // The command-bar item for this board's key must be active.
    const activeItem = page.locator(`[data-testid="command-bar"] [data-key="${key}"][data-active="true"]`);
    await expect(activeItem).toBeVisible();

    // All other numeric-key items must NOT be active.
    for (const otherKey of NUMERIC_KEYS) {
      if (otherKey === key) continue;
      const otherItem = page.locator(`[data-testid="command-bar"] [data-key="${otherKey}"]`);
      await expect(otherItem).toHaveAttribute('data-active', 'false');
    }

    // Non-category keys R and V must always be data-active=false.
    for (const nonCatKey of ['R', 'V']) {
      const nonCatItem = page.locator(`[data-testid="command-bar"] [data-key="${nonCatKey}"]`);
      const count = await nonCatItem.count();
      if (count > 0) {
        await expect(nonCatItem).toHaveAttribute('data-active', 'false');
      }
    }
  });
}

test('pressing numeric hotkeys also updates command-bar active state', async ({ page }) => {
  // Press '2' to switch to FLAGS board.
  await page.keyboard.press('2');
  await expect(page.getByTestId('tab-flags')).toHaveAttribute('data-active', 'true');
  const flagsActive = page.locator('[data-testid="command-bar"] [data-key="2"][data-active="true"]');
  await expect(flagsActive).toBeVisible();

  // Press '4' to switch to SYSTEM board.
  await page.keyboard.press('4');
  await expect(page.getByTestId('tab-system')).toHaveAttribute('data-active', 'true');
  const systemActive = page.locator('[data-testid="command-bar"] [data-key="4"][data-active="true"]');
  await expect(systemActive).toBeVisible();

  // After switching to '4', key '2' must no longer be active.
  const flagsInactive = page.locator('[data-testid="command-bar"] [data-key="2"]');
  await expect(flagsInactive).toHaveAttribute('data-active', 'false');
});
