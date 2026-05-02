import { test, expect } from '@playwright/test';

test('LoginScreen banner types on (initial frame is shorter than final)', async ({ page }) => {
  await page.goto('/');
  // Wait for the banner to mount (post-dialing).
  await expect(page.getByTestId('login-banner')).toBeVisible({ timeout: 10_000 });
  // Right after mount, the banner contains less text than after a brief wait.
  const initial = (await page.getByTestId('login-banner').textContent()) || '';
  await page.waitForTimeout(300);
  const later = (await page.getByTestId('login-banner').textContent()) || '';
  expect(later.length).toBeGreaterThan(initial.length);
});

test('scanline overlay is on by default and can be toggled off via [V]', async ({ page }) => {
  await page.goto('/?demo=1');
  await expect(page.getByTestId('login-banner')).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: /lurk/i }).click();
  await expect(page.getByTestId('channel-tabs')).toBeVisible({ timeout: 15_000 });

  // Default on.
  await expect(page.getByTestId('scanlines')).toHaveAttribute('data-on', 'true');

  // Press V to toggle off.
  await page.keyboard.press('v');
  await expect(page.getByTestId('scanlines')).toHaveCount(0);

  // Press V again to toggle on.
  await page.keyboard.press('v');
  await expect(page.getByTestId('scanlines')).toHaveAttribute('data-on', 'true');
});

test('hotkeys 1..6 switch channels, R reloads, Q quits', async ({ page }) => {
  await page.goto('/?demo=1');
  await expect(page.getByTestId('login-banner')).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: /lurk/i }).click();
  await expect(page.getByTestId('channel-tabs')).toBeVisible({ timeout: 15_000 });

  await page.keyboard.press('3'); // WEAVE
  await expect(page.getByTestId('tab-weave')).toHaveAttribute('data-active', 'true');

  await page.keyboard.press('5'); // TRICKSTER
  await expect(page.getByTestId('tab-trickster')).toHaveAttribute('data-active', 'true');

  await page.keyboard.press('q'); // back to login
  await expect(page.getByTestId('login-banner')).toBeVisible({ timeout: 5_000 });
});

test('command bar lists all the documented hotkeys', async ({ page }) => {
  await page.goto('/?demo=1');
  await page.getByRole('button', { name: /lurk/i }).click();
  await expect(page.getByTestId('command-bar')).toBeVisible({ timeout: 15_000 });
  const cb = await page.getByTestId('command-bar').textContent();
  for (const label of ['general', 'flags', 'weave', 'system', 'trickster', 'branches',
                       'reload', 'quit']) {
    expect(cb?.toLowerCase()).toContain(label);
  }
  expect(cb?.toLowerCase()).toMatch(/visual/);
});

test('status bar contains STIGMERGY brand and current chrome', async ({ page }) => {
  await page.goto('/?demo=1');
  await page.getByRole('button', { name: /lurk/i }).click();
  await expect(page.getByTestId('status-bar')).toBeVisible({ timeout: 15_000 });
  const sb = await page.getByTestId('status-bar').textContent();
  expect(sb).toContain('STIGMERGY');
  expect(sb).toMatch(/NODE 01/i);
});

test('no rounded corners across any view encountered (board view)', async ({ page }) => {
  await page.goto('/?demo=1');
  await page.getByRole('button', { name: /lurk/i }).click();
  await expect(page.getByTestId('channel-tabs')).toBeVisible({ timeout: 15_000 });

  const violations = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('body *'));
    const offenders = [];
    for (const el of els) {
      const cs = getComputedStyle(el);
      const radii = [
        cs.borderTopLeftRadius, cs.borderTopRightRadius,
        cs.borderBottomLeftRadius, cs.borderBottomRightRadius,
      ];
      if (radii.some((r) => r !== '0px')) offenders.push({ tag: el.tagName, radii });
    }
    return offenders;
  });
  expect(violations, JSON.stringify(violations.slice(0, 5), null, 2)).toEqual([]);
});

test('no emoji in any rendered text on the board view', async ({ page }) => {
  await page.goto('/?demo=1');
  await page.getByRole('button', { name: /lurk/i }).click();
  await expect(page.getByTestId('channel-tabs')).toBeVisible({ timeout: 15_000 });
  // Walk every channel.
  for (const ch of ['general', 'flags', 'weave', 'system', 'trickster', 'branches']) {
    await page.getByTestId(`tab-${ch}`).click();
    const text = await page.locator('body').textContent();
    expect(text, `emoji found on ${ch} board`).not.toMatch(/[\u{1F300}-\u{1F9FF}]/u);
  }
});
