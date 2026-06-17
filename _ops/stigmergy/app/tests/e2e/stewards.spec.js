import { test, expect } from '@playwright/test';

// v1.0 Phase 6 — Steward Advance (the STEWARDS deck).
//
// These run against the live dev server reading the REAL palace registry. By
// default they DO NOT fire a cycle (that would spawn a real `claude -p` against
// a real steward). The surface tests are read-only; the two-step confirm test
// only takes the FIRST click (which opens the confirm and fires nothing).
//
// The full advance->alive->reap cycle is proven deterministically at the
// integration layer (stewards-middleware.test.js) with the harmless stub. The
// one advance-through e2e here is guarded: it runs only when
// STIGMERGY_STUB_WORKER is set, in which case the dev server fires the stub with
// dryReap on (no palace mutation).

async function gotoStewards(page) {
  await page.goto('/?deck=stewards');
  await expect(page.getByTestId('stewards-screen')).toBeVisible({ timeout: 10_000 });
}

test.describe('Stewards deck — surface', () => {
  test('renders the roster, the advance-all control, and lane status', async ({ page }) => {
    await gotoStewards(page);
    await expect(page.getByTestId('advance-all')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('worker-status')).toBeVisible();
    await expect(page.locator('[data-testid^="steward-row-"]').first()).toBeVisible();
  });

  test('a first advance click opens a two-step confirm and fires nothing', async ({ page }) => {
    await gotoStewards(page);
    const enabled = page.locator('[data-testid^="steward-advance-"] button:not([disabled])').first();
    test.skip((await enabled.count()) === 0, 'no steward currently has grants waiting on the live board');
    await enabled.click();
    await expect(page.locator('[data-testid^="steward-confirm-"]').first()).toBeVisible({ timeout: 5_000 });
    // first click only confirms -- the lane stays idle.
    await expect(page.getByTestId('worker-status')).toHaveAttribute('data-running', 'false');
  });
});

// Launch interactive — CONSTRUCT a steward as a page-agent in a watchable
// session. Render + preview only and NON-DESTRUCTIVE: opening the panel POSTs
// /api/launch/agent?preview (read-only — buildCyclePrompt reads the steward's
// files, no POST to the board, no cycle fire). We never click LAUNCH TERMINAL
// (that opens a real Terminal). Mirrors launch-interactive.spec.js.
test.describe('Stewards deck — construct & launch agent', () => {
  test('every steward row exposes a launch action', async ({ page }) => {
    await gotoStewards(page);
    await expect(page.locator('[data-testid^="steward-launch-"]').first())
      .toBeVisible({ timeout: 10_000 });
  });

  test('launch opens the construct-agent panel (tiers + Core knobs); Esc closes', async ({ page }) => {
    await gotoStewards(page);
    const launch = page.locator('[data-testid^="steward-launch-"] button:not([disabled])').first();
    test.skip((await launch.count()) === 0, 'no launchable steward row (all mid-cycle?)');
    await launch.click();
    const modal = page.getByTestId('agent-launch-modal');
    await expect(modal).toBeVisible({ timeout: 5_000 });
    // the construction is shown by palace tier (Tier 3 = the injected identity)
    await expect(page.getByTestId('agent-tiers')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('agent-tier-3')).toContainText(/inject/i);
    // the Core knobs + actions; LAUNCH TERMINAL is present but NOT clicked
    await expect(page.getByTestId('agent-model')).toBeVisible();
    await expect(page.getByTestId('agent-effort')).toBeVisible();
    await expect(page.getByTestId('agent-launch-terminal')).toBeVisible();
    await expect(page.getByTestId('agent-copy')).toBeVisible();
    // Esc closes (only a read-only preview happened)
    await page.keyboard.press('Escape');
    await expect(modal).toHaveCount(0);
  });
});

test.describe('Stewards deck — advance-through (stub-gated)', () => {
  test('advancing a steward shows the lane alive then reaps to idle', async ({ page }) => {
    test.skip(!process.env.STIGMERGY_STUB_WORKER, 'set STIGMERGY_STUB_WORKER=1 to run the advance-through e2e (fires the harmless stub, dryReap — no palace mutation)');
    await gotoStewards(page);
    const enabled = page.locator('[data-testid^="steward-advance-"] button:not([disabled])').first();
    test.skip((await enabled.count()) === 0, 'no steward currently has grants waiting');
    await enabled.click();
    await page.locator('[data-testid^="steward-confirm-"] button').first().click();
    await expect(page.getByTestId('worker-status')).toHaveAttribute('data-running', 'true', { timeout: 5_000 });
    await expect(page.getByTestId('worker-status')).toHaveAttribute('data-running', 'false', { timeout: 15_000 });
  });
});
