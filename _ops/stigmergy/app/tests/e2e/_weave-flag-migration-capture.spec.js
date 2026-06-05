// One-off Playwright capture for the v1.0 weave_flag Phase 3 migration.
// Reads the REAL persistent blackboard (no demo flag) and captures the
// QUEUE deck filtered to the WEAVE lane so the 11 migrated flags are
// visible. Output:
//   screenshots/weave-flag-v1.0/queue-deck-migrated-flags.png

import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

test('weave-flag-v1.0 migration capture', async ({ page }) => {
  const dir = resolve('screenshots/weave-flag-v1.0');
  mkdirSync(dir, { recursive: true });

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/?deck=QUEUE');
  await expect(page.getByTestId('board-screen')).toBeVisible({ timeout: 10_000 });

  // Filter to the WEAVE lane so the 11 weave_flag cards dominate the view.
  await page.getByTestId('queue-lane-WEAVE').click();

  // Confirm at least 11 weave_flag cards rendered.
  const flags = page.locator('[data-testid="queue-item"][data-kind="weave_flag"]');
  await expect.poll(async () => flags.count(), { timeout: 10_000 })
    .toBeGreaterThanOrEqual(11);

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(150);

  await page.screenshot({
    path: resolve(dir, 'queue-deck-migrated-flags.png'),
    fullPage: false,
  });
});
