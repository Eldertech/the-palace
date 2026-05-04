import { test, expect } from '@playwright/test';

// Helpers -------------------------------------------------------------------

function rgbToHex(rgb) {
  const m = rgb.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (!m) return null;
  const [r, g, b] = [m[1], m[2], m[3]].map((n) => parseInt(n, 10));
  return '#' + [r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('');
}

// Tests ---------------------------------------------------------------------

test('phosphor green on terminal black is the base palette', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('board-screen')).toBeVisible({ timeout: 10_000 });

  // body background should be terminal-black (#050a06)
  const bodyBg = await page.evaluate(() =>
    getComputedStyle(document.body).backgroundColor
  );
  expect(rgbToHex(bodyBg)).toBe('#050a06');

  // body color should be phosphor green (#33ff66)
  const bodyFg = await page.evaluate(() =>
    getComputedStyle(document.body).color
  );
  expect(rgbToHex(bodyFg)).toBe('#33ff66');
});

test('VT323 and IBM Plex Mono fonts are loaded', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('board-screen')).toBeVisible({ timeout: 10_000 });

  // @font-face fonts only fetch on first use. Force-load them, then verify
  // they're available via FontFaceSet.check.
  const fonts = await page.evaluate(async () => {
    const tries = await Promise.allSettled([
      document.fonts.load('16px "VT323"'),
      document.fonts.load('14px "IBM Plex Mono"'),
      document.fonts.load('600 14px "IBM Plex Mono"'),
    ]);
    await document.fonts.ready;
    return {
      vt323: document.fonts.check('16px "VT323"'),
      ibmplex: document.fonts.check('14px "IBM Plex Mono"'),
      ibmplexBold: document.fonts.check('600 14px "IBM Plex Mono"'),
      tries: tries.map((t) => t.status),
    };
  });
  expect(fonts.vt323, `VT323 load tries: ${fonts.tries[0]}`).toBe(true);
  expect(fonts.ibmplex, `IBM Plex Mono load tries: ${fonts.tries[1]}`).toBe(true);
  expect(fonts.ibmplexBold, `IBM Plex Mono SemiBold load tries: ${fonts.tries[2]}`).toBe(true);
});

test('font-family stack on body resolves to a monospace family', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('board-screen')).toBeVisible({ timeout: 10_000 });

  const family = await page.evaluate(() =>
    getComputedStyle(document.body).fontFamily
  );
  // The CSS variable resolves to a stack starting with IBM Plex Mono and ending in monospace.
  expect(family.toLowerCase()).toContain('plex');
  expect(family.toLowerCase()).toContain('monospace');
});

test('no rendered element on the board screen has rounded corners', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('board-screen')).toBeVisible({ timeout: 10_000 });

  // Sample every visible element on screen and assert all border-radii are 0px.
  const violations = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('body *'));
    const offenders = [];
    for (const el of els) {
      const cs = getComputedStyle(el);
      const radii = [
        cs.borderTopLeftRadius,
        cs.borderTopRightRadius,
        cs.borderBottomLeftRadius,
        cs.borderBottomRightRadius,
      ];
      for (const r of radii) {
        // Allow "0px" exactly; anything else is a violation.
        if (r !== '0px') {
          offenders.push({ tag: el.tagName, radii });
          break;
        }
      }
    }
    return offenders;
  });
  expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
});
