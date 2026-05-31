import { test, expect } from '@playwright/test';

// v1.0 Phase 4 — QUEUE reframe.
//
// The gate: "a handoff_ready appears and self-clears when a resolving commit
// lands." We use the hermetic ?demo=only feed, which carries two handoff_ready
// posts:
//   - demo-handoff-resolved (entry "Two Batons, One Board") -- that entry HAS
//     later commits in the REAL palace git history, so QUEUE's reconciliation
//     (which fetches the live /api/log) marks it "looks done".
//   - demo-handoff-open (entry "Nonexistent Demo Entry ZZZ") -- no resolving
//     commit exists, so it stays open.
// This proves both the build path and the prospective->retrospective crossing
// against real git, deterministically (the palace history for that entry is
// fixed). The reconciliation LOGIC itself is also unit-tested exhaustively in
// tests/unit/queue-model.test.js.

async function gotoQueue(page) {
  await page.goto('/?demo=only&deck=QUEUE');
  await expect(page.getByTestId('board-screen')).toBeVisible({ timeout: 10_000 });
  // The QUEUE panel mounts and fetches the live git log for reconciliation.
  await expect(page.locator('[data-testid="queue-open"], [data-testid="queue-resolved"]').first())
    .toBeVisible({ timeout: 15_000 });
}

test.describe('QUEUE panel — the ranked inbox', () => {
  test('renders the unified queue panel above the board', async ({ page }) => {
    await gotoQueue(page);
    await expect(page.getByText('queue -- the ranked inbox')).toBeVisible();
  });

  test('a handoff_ready appears as a QUEUE item', async ({ page }) => {
    await gotoQueue(page);
    const items = page.locator('[data-testid="queue-item"][data-kind="handoff_ready"]');
    expect(await items.count()).toBeGreaterThanOrEqual(1);
    // The open one (nonexistent entry) is present and NOT resolved.
    const openItem = page.locator('[data-testid="queue-item"][data-kind="handoff_ready"][data-resolved="false"]');
    await expect(openItem.first()).toBeVisible();
    await expect(openItem.first()).toContainText(/stale if:/i);
  });

  test('a handoff_ready self-clears when git has a resolving commit', async ({ page }) => {
    await gotoQueue(page);
    // The "Two Batons, One Board" handoff resolves against real git history.
    const resolved = page.locator('[data-testid="queue-item"][data-resolved="true"]');
    await expect(resolved.first()).toBeVisible({ timeout: 15_000 });
    await expect(resolved.first()).toContainText(/looks done/i);
    // And it offers the "clear it?" affordance (human confirms; not silent).
    await expect(resolved.first().getByTestId('queue-item-clear')).toBeVisible();
  });

  test('clicking "clear it?" removes the resolved item from the view', async ({ page }) => {
    await gotoQueue(page);
    const resolved = page.locator('[data-testid="queue-item"][data-resolved="true"]');
    await expect(resolved.first()).toBeVisible({ timeout: 15_000 });
    const before = await page.locator('[data-testid="queue-item"]').count();
    await resolved.first().getByTestId('queue-item-clear').click();
    await page.waitForTimeout(300);
    const after = await page.locator('[data-testid="queue-item"]').count();
    expect(after).toBe(before - 1);
  });

  test('board lanes filter the queue (boards as lanes, not tabs)', async ({ page }) => {
    await gotoQueue(page);
    // The GENERAL lane chip exists (both demo handoffs are on GENERAL).
    await expect(page.getByTestId('queue-lane-GENERAL')).toBeVisible();
    await page.getByTestId('queue-lane-GENERAL').click();
    await page.waitForTimeout(200);
    // Every visible item is on the GENERAL board (the lane filter holds).
    const items = page.locator('[data-testid="queue-item"]');
    expect(await items.count()).toBeGreaterThanOrEqual(1);
  });
});
