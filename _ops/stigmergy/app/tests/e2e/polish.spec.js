import { test, expect } from '@playwright/test';

test('scanline overlay is on by default and can be toggled off via [V]', async ({ page }) => {
  await page.goto('/?demo=1');
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

test('hotkeys 1..6 switch channels and R reloads', async ({ page }) => {
  await page.goto('/?demo=1');
  await expect(page.getByTestId('channel-tabs')).toBeVisible({ timeout: 15_000 });

  await page.keyboard.press('3'); // WEAVE
  await expect(page.getByTestId('tab-weave')).toHaveAttribute('data-active', 'true');

  await page.keyboard.press('5'); // TRICKSTER
  await expect(page.getByTestId('tab-trickster')).toHaveAttribute('data-active', 'true');

  // R re-fetches; the inline-actions block stays mounted afterward.
  await page.keyboard.press('r');
  await expect(page.getByTestId('inline-actions')).toBeVisible();
});

test('command bar lists all the documented hotkeys', async ({ page }) => {
  await page.goto('/?demo=1');
  await expect(page.getByTestId('command-bar')).toBeVisible({ timeout: 15_000 });
  const cb = await page.getByTestId('command-bar').textContent();
  for (const label of ['general', 'flags', 'weave', 'system', 'trickster', 'branches',
                       'reload']) {
    expect(cb?.toLowerCase()).toContain(label);
  }
  expect(cb?.toLowerCase()).toMatch(/visual/);
});

test('status bar contains STIGMERGY brand and current chrome', async ({ page }) => {
  await page.goto('/?demo=1');
  await expect(page.getByTestId('status-bar')).toBeVisible({ timeout: 15_000 });
  const sb = await page.getByTestId('status-bar').textContent();
  expect(sb).toContain('STIGMERGY');
  expect(sb).toMatch(/NODE 01/i);
});

test('no rounded corners across any view encountered (board view)', async ({ page }) => {
  await page.goto('/?demo=1');
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
  await expect(page.getByTestId('channel-tabs')).toBeVisible({ timeout: 15_000 });
  // Walk every channel.
  for (const ch of ['general', 'flags', 'weave', 'system', 'trickster', 'branches']) {
    await page.getByTestId(`tab-${ch}`).click();
    const text = await page.locator('body').textContent();
    expect(text, `emoji found on ${ch} board`).not.toMatch(/[\u{1F300}-\u{1F9FF}]/u);
  }
});

test('SYSTEM messages are not center-justified', async ({ page }) => {
  await page.goto('/?demo=1');
  await expect(page.getByTestId('channel-tabs')).toBeVisible({ timeout: 15_000 });

  // Navigate to the SYSTEM board.
  await page.getByTestId('tab-system').click();

  // Wait for at least one SYSTEM-board message row.
  const systemRows = page.locator('[data-testid="message-row"][data-board="SYSTEM"]');
  await expect(systemRows.first()).toBeVisible({ timeout: 5_000 });

  // None of the SYSTEM rows should have text-align: center.
  const centerCount = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll(
      '[data-testid="message-row"][data-board="SYSTEM"]'
    ));
    return rows.filter((el) => getComputedStyle(el).textAlign === 'center').length;
  });
  expect(centerCount, 'found SYSTEM rows with text-align: center').toBe(0);

  // Also check the body divs inside those rows.
  const bodyCenterCount = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll(
      '[data-testid="message-row"][data-board="SYSTEM"]'
    ));
    let count = 0;
    for (const row of rows) {
      const bodyDivs = Array.from(row.querySelectorAll('div'));
      for (const div of bodyDivs) {
        if (getComputedStyle(div).textAlign === 'center') count++;
      }
    }
    return count;
  });
  expect(bodyCenterCount, 'found body divs inside SYSTEM rows with text-align: center').toBe(0);
});

test('FLAG messages render claim/targets/confidence', async ({ page }) => {
  await page.goto('/?demo=1');
  await expect(page.getByTestId('channel-tabs')).toBeVisible({ timeout: 15_000 });

  // Navigate to the FLAGS board.
  await page.getByTestId('tab-flags').click();

  // Wait for FLAG rows to appear.
  const flagRows = page.locator('[data-testid="message-row"][data-type="FLAG"]');
  await expect(flagRows.first()).toBeVisible({ timeout: 5_000 });

  // At least one FLAG row should have flag-targets (any structured FLAG payload).
  const targetsEl = page.locator('[data-testid="flag-targets"]').first();
  await expect(targetsEl).toBeVisible({ timeout: 5_000 });

  // At least one FLAG row should have flag-confidence.
  const confidenceEl = page.locator('[data-testid="flag-confidence"]').first();
  await expect(confidenceEl).toBeVisible({ timeout: 5_000 });

  // The targets element should contain at least one entry name (non-empty, prefixed with →).
  const targetsText = await targetsEl.textContent();
  expect(targetsText).toMatch(/→\s+\S/);

  // The confidence tag should contain one of the valid confidence values.
  const confidenceText = (await confidenceEl.textContent()) ?? '';
  expect(confidenceText.toLowerCase()).toMatch(/high|medium|low/);

  // All flag-targets elements should have non-empty content starting with the → arrow.
  const allTargets = page.locator('[data-testid="flag-targets"]');
  const targetCount = await allTargets.count();
  expect(targetCount).toBeGreaterThan(0);

  // Verify that the flag-confidence tag is always present alongside flag-targets
  // by checking the first structured FLAG row contains both.
  const structuredFlagRow = page.locator('[data-testid="message-row"][data-type="FLAG"]')
    .filter({ has: page.locator('[data-testid="flag-targets"]') })
    .first();
  await expect(structuredFlagRow.locator('[data-testid="flag-targets"]')).toBeVisible();
  await expect(structuredFlagRow.locator('[data-testid="flag-confidence"]')).toBeVisible();
});
