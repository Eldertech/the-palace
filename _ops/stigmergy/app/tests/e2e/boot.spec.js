import { test, expect } from '@playwright/test';

test('the dev server boots and the page loads with no console errors', async ({ page }) => {
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    // Browser/Vite resource-load failures (the design-system CSS @import
    // bundles @font-face rules with stale CDN URLs as the secondary fallback;
    // those URLs 404 in the console but the actual fonts load from /fonts/).
    // These are network noise, not application errors — filter them.
    if (/Failed to load resource/i.test(text)) return;
    consoleErrors.push(text);
  });
  page.on('pageerror', (err) => pageErrors.push(err.message));

  await page.goto('/');
  await expect(page).toHaveTitle(/STIGMERGY/i);

  // v1.0: three-deck navigation mounts directly — no login gate. Default
  // deck is STATE (present -- what is). QUEUE / LOG reachable via Q / L.
  await expect(page.getByTestId('deck-tabs')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByTestId('state-deck')).toBeVisible({ timeout: 10_000 });

  // Switching to QUEUE surfaces the existing board screen + channel tabs
  // (the v0.x surface is preserved as QUEUE's content until Phase 4 reframes).
  await page.keyboard.press('q');
  await expect(page.getByTestId('board-screen')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByTestId('channel-tabs')).toBeVisible({ timeout: 10_000 });

  // Status bar is present in the chrome
  await expect(page.getByTestId('status-bar')).toBeVisible();
  await expect(page.getByTestId('status-bar')).toContainText('STIGMERGY');

  expect(consoleErrors, `console errors: ${consoleErrors.join('\n')}`).toEqual([]);
  expect(pageErrors, `page errors: ${pageErrors.join('\n')}`).toEqual([]);
});
