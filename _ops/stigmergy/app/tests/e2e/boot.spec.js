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

  // The login screen container is mounted
  await expect(page.getByTestId('login-screen')).toBeVisible();

  // The login flow boots in the "dialing" stage and progresses to the banner.
  // We don't depend on exact timing — we just wait for the banner to appear.
  await expect(page.getByTestId('login-banner')).toBeVisible({ timeout: 10_000 });

  // Status bar is present in the chrome
  await expect(page.getByTestId('status-bar')).toBeVisible();
  await expect(page.getByTestId('status-bar')).toContainText('STIGMERGY');

  expect(consoleErrors, `console errors: ${consoleErrors.join('\n')}`).toEqual([]);
  expect(pageErrors, `page errors: ${pageErrors.join('\n')}`).toEqual([]);
});
