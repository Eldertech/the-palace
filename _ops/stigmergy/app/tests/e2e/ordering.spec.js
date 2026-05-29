import { test, expect } from '@playwright/test';

// Every board renders newest-message-first, compared CHRONOLOGICALLY (parsed
// epoch), so the operator sees the latest message the instant they open a board
// — even when the live board mixes timezone offsets ("...Z" vs "...-04:00"),
// where a lexical string sort would put the wrong message on top.

const BOARDS = ['general', 'flags', 'weave', 'system', 'branches'];

async function tsOrder(page) {
  const rows = page.locator('[data-testid="message-row"]');
  const n = await rows.count();
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push(await rows.nth(i).getAttribute('data-ts'));
  }
  return out;
}

for (const board of BOARDS) {
  test(`${board} board renders newest-first (chronological)`, async ({ page }) => {
    // ?demo=1 prepends demo data onto the live board, so most boards have rows
    // with a real mix of timestamps to order.
    await page.goto('/?demo=1');
    await expect(page.getByTestId('channel-tabs')).toBeVisible({ timeout: 15_000 });
    await page.getByTestId(`tab-${board}`).click();

    const order = await tsOrder(page);
    if (order.length < 2) test.skip(true, `not enough rows on ${board} to assert order`);

    const epochs = order.map((ts) => {
      const t = Date.parse(ts || '');
      return Number.isNaN(t) ? -Infinity : t;
    });
    for (let i = 1; i < epochs.length; i++) {
      expect(
        epochs[i - 1] >= epochs[i],
        `row ${i - 1} (${order[i - 1]}) should be >= row ${i} (${order[i]}) on ${board}`
      ).toBe(true);
    }
  });
}

test('the very first GENERAL row is the chronologically newest message', async ({ page }) => {
  // Hermetic: demo-only so the newest GENERAL message is deterministic
  // (demo-choice at 2026-05-02T10:13:00Z is the latest demo GENERAL entry).
  await page.goto('/?demo=only');
  await expect(page.getByTestId('channel-tabs')).toBeVisible({ timeout: 15_000 });
  await page.getByTestId('tab-general').click();
  const first = page.locator('[data-testid="message-row"]').first();
  await expect(first).toBeVisible({ timeout: 10_000 });
  await expect(first).toHaveAttribute('data-id', 'demo-choice');
});
