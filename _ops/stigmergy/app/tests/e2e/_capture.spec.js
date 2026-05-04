// Captures phase-boundary screenshots for the visual-validator subagent.
// Reads STIGMERGY_PHASE from env to know which phase's captures to take.
// File starts with `_` so it sorts first; check-phase.js explicitly runs it.

import { test, expect } from '@playwright/test';
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
    // v0.2: capture the four board views (no login screen).
    const phase1Boards = ['general', 'flags', 'system', 'trickster'];
    for (const ch of phase1Boards) {
      test(`phase-1-v0.2/${ch}.png`, async ({ page }) => {
        await page.goto('/?demo=1');
        await page.getByTestId('channel-tabs').waitFor({ timeout: 15_000 });
        await preloadFonts(page);
        await page.getByTestId(`tab-${ch}`).click();
        await page.waitForTimeout(200);
        const dir = resolve(`screenshots/phase-1-v0.2`);
        mkdirSync(dir, { recursive: true });
        await page.screenshot({ path: resolve(dir, `${ch}.png`), fullPage: false });
      });
    }
  }

  if (PHASE === '2') {
    test('persistent-loaded.png', async ({ page }) => {
      await page.goto('/');
      await page.getByTestId('channel-tabs').waitFor({ timeout: 15_000 });
      await preloadFonts(page);
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
        await page.getByTestId('channel-tabs').waitFor({ timeout: 15_000 });
        await preloadFonts(page);
        await page.getByTestId(`tab-${ch}`).click();
        await page.waitForTimeout(200);
        await page.screenshot({ path: shotPath(`${ch}.png`), fullPage: false });
      });
    }
  }

  if (PHASE === '4') {
    // Phase 4 v0.2: click-to-respond UI captures.
    // Uses the phase-4-v0.2/ subdirectory (created by check-phase.js).

    test('phase-4-v0.2/inbox-pending.png', async ({ page }) => {
      await page.goto('/?demo=1');
      await page.getByTestId('channel-tabs').waitFor({ timeout: 15_000 });
      await preloadFonts(page);
      await page.getByTestId('tab-trickster').click();
      await page.getByTestId('trickster-inbox').waitFor({ timeout: 5_000 });
      await page.waitForTimeout(200);
      const dir = resolve(`screenshots/phase-4-v0.2`);
      mkdirSync(dir, { recursive: true });
      await page.screenshot({ path: resolve(dir, 'inbox-pending.png'), fullPage: false });
    });

    test('phase-4-v0.2/inbox-modal-preview.png', async ({ page }) => {
      await page.goto('/?demo=1');
      await page.getByTestId('channel-tabs').waitFor({ timeout: 15_000 });
      await preloadFonts(page);
      await page.getByTestId('tab-trickster').click();
      await page.getByTestId('trickster-inbox').waitFor({ timeout: 5_000 });
      // Open the modal for the first pending item, first option (Grant -- limited).
      const firstItem = page.getByTestId('inbox-pending-item').first();
      const firstBtn = firstItem.getByTestId('inbox-response-options').locator('button').first();
      await firstBtn.click();
      await page.getByTestId('response-modal').waitFor({ timeout: 3_000 });
      await page.waitForTimeout(200);
      const dir = resolve(`screenshots/phase-4-v0.2`);
      mkdirSync(dir, { recursive: true });
      await page.screenshot({ path: resolve(dir, 'inbox-modal-preview.png'), fullPage: false });
    });

    test('phase-4-v0.2/inbox-after-respond.png', async ({ page }) => {
      // Clear the demo session so we start fresh.
      const { writeFileSync, mkdirSync: mkd } = await import('node:fs');
      const { resolve: res2 } = await import('node:path');
      const { fileURLToPath: ftu } = await import('node:url');
      const { dirname: dn } = await import('node:path');
      const __f = ftu(import.meta.url);
      const appRoot = res2(dn(__f), '../..');
      const palaceRoot = res2(appRoot, '../../../..');
      const sessionDir = res2(palaceRoot, '_ops/swarm/sessions/demo-2026-05-02');
      mkd(sessionDir, { recursive: true });
      writeFileSync(res2(sessionDir, 'blackboard.jsonl'), '', 'utf8');

      await page.goto('/?demo=1');
      await page.getByTestId('channel-tabs').waitFor({ timeout: 15_000 });
      await preloadFonts(page);
      await page.getByTestId('tab-trickster').click();
      await page.getByTestId('trickster-inbox').waitFor({ timeout: 5_000 });

      // Open and confirm the modal for the first pending item.
      const firstItem = page.getByTestId('inbox-pending-item').first();
      const firstBtn = firstItem.getByTestId('inbox-response-options').locator('button').first();
      await firstBtn.click();
      await page.getByTestId('response-modal').waitFor({ timeout: 3_000 });
      await page.getByTestId('response-modal').getByRole('button', { name: /^confirm/i }).click();
      await expect(page.getByTestId('response-modal')).not.toBeVisible({ timeout: 8_000 });
      await page.waitForTimeout(300);

      const dir = resolve(`screenshots/phase-4-v0.2`);
      mkdirSync(dir, { recursive: true });
      await page.screenshot({ path: resolve(dir, 'inbox-after-respond.png'), fullPage: false });
    });
  }

  if (PHASE === '6') {
    test('boot.png', async ({ page }) => {
      await page.goto('/');
      await page.getByTestId('board-screen').waitFor({ timeout: 10_000 });
      await preloadFonts(page);
      await page.waitForTimeout(400);
      await page.screenshot({ path: shotPath('boot.png'), fullPage: false });
    });

    test('general.png', async ({ page }) => {
      await page.goto('/?demo=1');
      await page.getByTestId('channel-tabs').waitFor({ timeout: 15_000 });
      await preloadFonts(page);
      await page.waitForTimeout(200);
      await page.screenshot({ path: shotPath('general.png'), fullPage: false });
    });

    test('flags.png', async ({ page }) => {
      await page.goto('/?demo=1');
      await page.getByTestId('channel-tabs').waitFor({ timeout: 15_000 });
      await preloadFonts(page);
      await page.getByTestId('tab-flags').click();
      await page.waitForTimeout(200);
      await page.screenshot({ path: shotPath('flags.png'), fullPage: false });
    });

    test('trickster-inbox.png', async ({ page }) => {
      await page.goto('/?demo=1');
      await page.getByTestId('channel-tabs').waitFor({ timeout: 15_000 });
      await preloadFonts(page);
      await page.getByTestId('tab-trickster').click();
      await page.getByTestId('trickster-inbox').waitFor({ timeout: 5_000 });
      await page.waitForTimeout(200);
      await page.screenshot({ path: shotPath('trickster-inbox.png'), fullPage: false });
    });

    test('scanlines-off.png', async ({ page }) => {
      await page.goto('/?demo=1');
      await page.getByTestId('channel-tabs').waitFor({ timeout: 15_000 });
      await preloadFonts(page);
      await page.keyboard.press('v');  // toggle scanlines off
      await page.waitForTimeout(200);
      await page.screenshot({ path: shotPath('scanlines-off.png'), fullPage: false });
    });
  }

  if (PHASE === '5') {
    test('populated.png', async ({ page }) => {
      await page.goto('/?demo=1');
      await page.getByTestId('channel-tabs').waitFor({ timeout: 15_000 });
      await preloadFonts(page);
      await page.getByTestId('tab-trickster').click();
      await page.getByTestId('trickster-inbox').waitFor({ timeout: 5_000 });
      await page.waitForTimeout(200);
      await page.screenshot({ path: shotPath('populated.png'), fullPage: false });
    });

    test('empty.png', async ({ page }) => {
      // No ?demo=1 — real palace has no TRICKSTER RESOURCE_REQUESTs.
      await page.goto('/');
      await page.getByTestId('channel-tabs').waitFor({ timeout: 15_000 });
      await preloadFonts(page);
      await page.getByTestId('tab-trickster').click();
      await page.getByTestId('inbox-empty').waitFor({ timeout: 5_000 });
      await page.waitForTimeout(200);
      await page.screenshot({ path: shotPath('empty.png'), fullPage: false });
    });
  }
});
