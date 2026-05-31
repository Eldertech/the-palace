import { test, expect } from '@playwright/test';

// v1.0 Phase 2.5 — The Actuator (UI surface).
//
// These run against the live dev server. By default they DO NOT fire a real
// worker (that would spawn a real `claude -p`); they verify the panel renders,
// polls status, and refuses an empty prompt. The full fire->log->reap cycle is
// proven deterministically at the integration layer (actuator.test.js +
// worker-middleware.test.js) with the harmless stub.
//
// The one fire-through e2e is guarded: it runs only when STIGMERGY_STUB_WORKER
// is set (the dev server then fires the harmless stub, not claude).

async function gotoQueue(page) {
  await page.goto('/?deck=QUEUE');
  await expect(page.getByTestId('board-screen')).toBeVisible({ timeout: 10_000 });
}

test.describe('Actuator panel — surface', () => {
  test('renders an idle status, a prompt, and a fire control', async ({ page }) => {
    await gotoQueue(page);
    await expect(page.getByTestId('worker-status')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('actuator-prompt')).toBeVisible();
    await expect(page.getByTestId('actuator-fire')).toContainText('FIRE');
  });

  test('an empty prompt does not fire (no feedback, no spawn)', async ({ page }) => {
    await gotoQueue(page);
    await expect(page.getByTestId('actuator-fire')).toBeVisible({ timeout: 10_000 });
    // Click fire with an empty prompt -- nothing should happen.
    await page.getByTestId('actuator-fire').click();
    await page.waitForTimeout(300);
    // Worker stays idle; no "fired" feedback appears.
    const status = page.getByTestId('worker-status');
    await expect(status).toHaveAttribute('data-running', 'false');
  });
});

test.describe('Actuator panel — fire-through (stub-gated)', () => {
  test('firing a worker streams its log and reaps cleanly', async ({ page }) => {
    test.skip(!process.env.STIGMERGY_STUB_WORKER, 'set STIGMERGY_STUB_WORKER=1 to run the fire-through e2e (fires the harmless stub)');
    await gotoQueue(page);
    await expect(page.getByTestId('actuator-prompt')).toBeVisible({ timeout: 10_000 });
    await page.getByTestId('actuator-prompt').fill('stub fire from e2e');
    await page.getByTestId('actuator-fire').click();
    // Feedback shows it fired.
    await expect(page.getByTestId('actuator-feedback')).toContainText(/fired/i, { timeout: 5_000 });
    // The worker reads alive while the stub sleeps.
    await expect(page.getByTestId('worker-status')).toHaveAttribute('data-running', 'true', { timeout: 5_000 });
    // The log tail streams the fire header.
    await expect(page.getByTestId('actuator-log')).toContainText('worker fire', { timeout: 5_000 });
    // After the stub exits, the worker reaps back to idle.
    await expect(page.getByTestId('worker-status')).toHaveAttribute('data-running', 'false', { timeout: 10_000 });
  });
});
