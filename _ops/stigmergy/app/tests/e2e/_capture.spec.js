// Captures phase-boundary screenshots for the visual-validator subagent.
// Reads STIGMERGY_PHASE from env to know which phase's captures to take.
// File starts with `_` so it sorts first; check-phase.js explicitly runs it.

import { test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const PHASE = process.env.STIGMERGY_PHASE || '0';

function shotPath(name) {
  const dir = resolve(`screenshots/phase-${PHASE}`);
  mkdirSync(dir, { recursive: true });
  return resolve(dir, name);
}

async function preloadFonts(page) {
  await page.evaluate(() => Promise.allSettled([
    document.fonts.load('16px "VT323"'),
    document.fonts.load('14px "IBM Plex Mono"'),
    document.fonts.load('600 14px "IBM Plex Mono"'),
  ]));
  await page.evaluate(() => document.fonts.ready);
}

test.describe(`phase ${PHASE} captures`, () => {
  test.skip(PHASE === '0', 'STIGMERGY_PHASE not set; capture spec disabled');

  if (PHASE === '1') {
    test('login.png', async ({ page }) => {
      await page.goto('/');
      await page.getByTestId('login-banner').waitFor({ timeout: 10_000 });
      await preloadFonts(page);
      await page.waitForTimeout(200);
      await page.screenshot({ path: shotPath('login.png'), fullPage: true });
    });
  }

  if (PHASE === '2') {
    test('persistent-loaded.png', async ({ page }) => {
      await page.goto('/');
      await page.getByTestId('login-banner').waitFor({ timeout: 10_000 });
      await preloadFonts(page);
      await page.getByRole('button', { name: /lurk/i }).click();
      await page.getByTestId('message-row').first().waitFor({ timeout: 15_000 });
      await page.waitForTimeout(300);
      await page.screenshot({ path: shotPath('persistent-loaded.png'), fullPage: false });
    });
  }

  if (PHASE === '3') {
    const channels = ['general', 'flags', 'weave', 'system', 'trickster', 'branches'];
    for (const ch of channels) {
      test(`${ch}.png`, async ({ page }) => {
        await page.goto('/?demo=1');
        await page.getByTestId('login-banner').waitFor({ timeout: 10_000 });
        await preloadFonts(page);
        await page.getByRole('button', { name: /lurk/i }).click();
        await page.getByTestId('channel-tabs').waitFor({ timeout: 15_000 });
        await page.getByTestId(`tab-${ch}`).click();
        await page.waitForTimeout(200);
        await page.screenshot({ path: shotPath(`${ch}.png`), fullPage: false });
      });
    }
  }

  if (PHASE === '4') {
    test('with-roster.png', async ({ page }) => {
      await page.goto('/?demo=1');
      await page.getByTestId('login-banner').waitFor({ timeout: 10_000 });
      await preloadFonts(page);
      await page.getByRole('button', { name: /lurk/i }).click();
      await page.getByTestId('agent-roster').waitFor({ timeout: 15_000 });
      // TRICKSTER channel showcases the most variety: yellow + red health,
      // multiple agents, paired and unpaired requests.
      await page.getByTestId('tab-trickster').click();
      await page.waitForTimeout(200);
      await page.screenshot({ path: shotPath('with-roster.png'), fullPage: false });
    });
  }
});
