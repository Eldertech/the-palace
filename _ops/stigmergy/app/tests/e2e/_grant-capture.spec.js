import { test, expect } from '@playwright/test';

// Capture utility (not a behavioural gate) -- screenshots the QUEUE inline-grant
// change for review: the open card with action buttons, then the same card
// showing the GRANTED verdict after a one-click grant (no modal). Mirrors the
// existing _*-capture.spec.js convention. Output lands in /tmp.

const OUT = '/tmp';

test('capture: queue inline grant before/after', async ({ page }) => {
  await page.setViewportSize({ width: 1100, height: 900 });
  await page.goto('/?demo=only&deck=QUEUE');
  await expect(page.getByTestId('board-screen')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('[data-testid="queue-open"], [data-testid="queue-resolved"]').first())
    .toBeVisible({ timeout: 15_000 });
  await page.getByTestId('queue-lane-WEAVE').click();

  const proposal = page.locator('[data-testid="queue-item"][data-kind="vector_proposal"]').first();
  await expect(proposal).toBeVisible();
  await proposal.screenshot({ path: `${OUT}/stigmergy-grant-before.png` });

  await proposal.getByTestId('queue-item-grant').click();
  const verdict = proposal.getByTestId('queue-item-decision');
  await expect(verdict).toBeVisible();
  await expect(verdict).toHaveAttribute('data-verb', 'GRANTED');
  // Let the optimistic "sending..." settle to the final GRANTED label.
  await expect(verdict).toContainText(/GRANTED/);
  await expect(page.getByTestId('response-modal')).toHaveCount(0);
  await proposal.screenshot({ path: `${OUT}/stigmergy-grant-after.png` });

  // Also capture that deny still opens the typed-input modal.
  const flag = page.locator('[data-testid="queue-item"][data-kind="weave_flag"]').first();
  await flag.getByTestId('queue-item-deny').click();
  await expect(page.getByTestId('response-modal')).toBeVisible();
  await page.getByTestId('response-modal').screenshot({ path: `${OUT}/stigmergy-deny-modal.png` });
});
