import { test, expect } from '@playwright/test';

// The STEWARDS deck's heartbeat-scheduler "schedule strip" — the watch-and-steer
// surface for the launchd jobs in _ops/heartbeat/. This spec is READ-ONLY: it
// asserts the strip renders the scheduler's honest state and toggles the digest
// (client-only). It NEVER clicks pause/resume (that would write the real palace's
// .paused flag) and NEVER advances a steward (that would fire a real cycle).

async function gotoStewards(page) {
  await page.goto('/?deck=STEWARDS');
  await expect(page.getByTestId('stewards-screen')).toBeVisible({ timeout: 10_000 });
}

test.describe('STEWARDS — heartbeat scheduler strip', () => {
  test('the schedule strip renders the scheduler state (read-only)', async ({ page }) => {
    await gotoStewards(page);
    const strip = page.getByTestId('schedule-strip');
    await expect(strip).toBeVisible({ timeout: 10_000 });
    // The steward-batch job line is always present (its in-repo plist exists).
    await expect(page.getByTestId('scheduler-job-steward-batch')).toBeVisible();
    // The honest disclaimer is shown — STIGMERGY infers, it does not call launchctl.
    await expect(strip).toContainText(/never calls launchctl/i);
    // The pause/resume control exists (we do NOT click it).
    await expect(page.getByTestId('scheduler-pause-toggle')).toBeVisible();
  });

  test('the digest toggle expands the inline digest when one exists', async ({ page }) => {
    await gotoStewards(page);
    await expect(page.getByTestId('schedule-strip')).toBeVisible({ timeout: 10_000 });
    const toggle = page.getByTestId('digest-toggle');
    // The digest may or may not exist in the live palace; only assert the
    // expand behavior when the toggle is present.
    if (await toggle.count()) {
      await toggle.click();
      await expect(page.getByTestId('digest-markdown')).toBeVisible();
    }
  });
});
