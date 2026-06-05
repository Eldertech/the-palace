// One-off Playwright capture for the v1.0 weave_flag build.
// Produces _ops/stigmergy/app/screenshots/weave-flag-v1.0/queue-deck-with-flag.png
// per the build plan. Leading underscore sorts it ahead of the other specs,
// matching the convention from _capture.spec.js.

import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

test('weave-flag-v1.0 queue-deck capture', async ({ page }) => {
  const dir = resolve('screenshots/weave-flag-v1.0');
  mkdirSync(dir, { recursive: true });

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/?demo=only&deck=QUEUE');
  await expect(page.getByTestId('board-screen')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('[data-testid="queue-open"], [data-testid="queue-resolved"]').first())
    .toBeVisible({ timeout: 15_000 });

  // Filter to the WEAVE lane so the flag card is the focus alongside the
  // existing vector_proposal card.
  await page.getByTestId('queue-lane-WEAVE').click();

  const flag = page.locator('[data-testid="queue-item"][data-kind="weave_flag"]').first();
  await expect(flag).toBeVisible();
  await flag.scrollIntoViewIfNeeded();
  await page.waitForTimeout(150);

  await page.screenshot({
    path: resolve(dir, 'queue-deck-with-flag.png'),
    fullPage: false,
  });
});
