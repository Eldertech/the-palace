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
      await page.goto('/?deck=QUEUE');
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
    // Hermetic: ?demo=only so the first pending item is the canonical option-less
    // demo request (req-demo-002) with the modal-driven inbox-response-options
    // block — not whatever Steward request the live board currently sorts on top.

    test('phase-4-v0.2/inbox-pending.png', async ({ page }) => {
      await page.goto('/?demo=only');
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
      await page.goto('/?demo=only');
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
      // Confirm posts a RESOURCE_GRANT to the real persistent board; snapshot it
      // and restore afterward so the capture leaves no trace.
      const { readFileSync, writeFileSync } = await import('node:fs');
      const { resolve: res2, dirname: dn } = await import('node:path');
      const { fileURLToPath: ftu } = await import('node:url');
      const palaceRoot = res2(dn(ftu(import.meta.url)), '../../../../..'); // tests/e2e → app → stigmergy → _ops → palace
      const bb = res2(palaceRoot, '_ops/swarm/persistent/blackboard.jsonl');
      const snapshot = readFileSync(bb, 'utf8');

      try {
        await page.goto('/?demo=only');
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
      } finally {
        writeFileSync(bb, snapshot, 'utf8');
      }
    });
  }

  if (PHASE === '6') {
    // Phase 6 v0.2: comprehensive final-sweep captures.
    // All shots go to screenshots/phase-6-v0.2/.

    test('phase-6-v0.2/general.png', async ({ page }) => {
      await page.goto('/?demo=1');
      await page.getByTestId('channel-tabs').waitFor({ timeout: 15_000 });
      await preloadFonts(page);
      await page.waitForTimeout(200);
      const dir = resolve('screenshots/phase-6-v0.2');
      mkdirSync(dir, { recursive: true });
      await page.screenshot({ path: resolve(dir, 'general.png'), fullPage: false });
    });

    test('phase-6-v0.2/flags.png', async ({ page }) => {
      await page.goto('/?demo=1');
      await page.getByTestId('channel-tabs').waitFor({ timeout: 15_000 });
      await preloadFonts(page);
      await page.getByTestId('tab-flags').click();
      await page.waitForTimeout(200);
      const dir = resolve('screenshots/phase-6-v0.2');
      mkdirSync(dir, { recursive: true });
      await page.screenshot({ path: resolve(dir, 'flags.png'), fullPage: false });
    });

    test('phase-6-v0.2/system.png', async ({ page }) => {
      await page.goto('/?demo=1');
      await page.getByTestId('channel-tabs').waitFor({ timeout: 15_000 });
      await preloadFonts(page);
      await page.getByTestId('tab-system').click();
      await page.waitForTimeout(200);
      const dir = resolve('screenshots/phase-6-v0.2');
      mkdirSync(dir, { recursive: true });
      await page.screenshot({ path: resolve(dir, 'system.png'), fullPage: false });
    });

    test('phase-6-v0.2/trickster.png', async ({ page }) => {
      await page.goto('/?demo=1');
      await page.getByTestId('channel-tabs').waitFor({ timeout: 15_000 });
      await preloadFonts(page);
      await page.getByTestId('tab-trickster').click();
      await page.getByTestId('trickster-inbox').waitFor({ timeout: 5_000 });
      await page.waitForTimeout(200);
      const dir = resolve('screenshots/phase-6-v0.2');
      mkdirSync(dir, { recursive: true });
      await page.screenshot({ path: resolve(dir, 'trickster.png'), fullPage: false });
    });

    test('phase-6-v0.2/scanlines-off.png', async ({ page }) => {
      await page.goto('/?demo=1');
      await page.getByTestId('channel-tabs').waitFor({ timeout: 15_000 });
      await preloadFonts(page);
      await page.keyboard.press('v');  // toggle scanlines off
      await page.waitForTimeout(200);
      const dir = resolve('screenshots/phase-6-v0.2');
      mkdirSync(dir, { recursive: true });
      await page.screenshot({ path: resolve(dir, 'scanlines-off.png'), fullPage: false });
    });

    test('phase-6-v0.2/live-connected.png', async ({ page }) => {
      // TRICKSTER board with the LIVE indicator visible in the status bar.
      await page.goto('/?demo=1');
      await page.getByTestId('channel-tabs').waitFor({ timeout: 15_000 });
      await preloadFonts(page);
      await page.getByTestId('tab-trickster').click();
      await page.getByTestId('trickster-inbox').waitFor({ timeout: 5_000 });
      // Wait for SSE to connect so the indicator shows LIVE.
      await page.waitForFunction(
        () => {
          const el = document.querySelector('[data-testid="live-indicator"]');
          return el && el.getAttribute('data-state') === 'connected';
        },
        { timeout: 10_000 }
      );
      await page.waitForTimeout(200);
      const dir = resolve('screenshots/phase-6-v0.2');
      mkdirSync(dir, { recursive: true });
      await page.screenshot({ path: resolve(dir, 'live-connected.png'), fullPage: false });
    });
  }

  if (PHASE === '8' || PHASE === '9') {
    // v0.3: inline rich-content captures. The demo enrichment cards
    // (demo-art-1 / demo-art-2) live on GENERAL.
    const v3dir = `screenshots/phase-${PHASE}-v0.3`;

    test(`phase-${PHASE}-v0.3/general-artifacts.png`, async ({ page }) => {
      await page.goto('/?demo=1');
      await page.getByTestId('channel-tabs').waitFor({ timeout: 15_000 });
      await preloadFonts(page);
      await page.getByTestId('tab-general').click();
      const card = page.locator('[data-testid="message-row"][data-id="demo-art-1"]');
      await card.getByTestId('artifact-img').waitFor({ timeout: 10_000 });
      await card.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      const dir = resolve(v3dir);
      mkdirSync(dir, { recursive: true });
      // Element shot of the single-image card — focused and small (a fullPage
      // shot of the whole GENERAL board would be a ~10MB binary).
      await card.screenshot({ path: resolve(dir, 'general-artifacts.png') });
    });

    test(`phase-${PHASE}-v0.3/iframe-artifact.png`, async ({ page }) => {
      await page.goto('/?demo=1');
      await page.getByTestId('channel-tabs').waitFor({ timeout: 15_000 });
      await preloadFonts(page);
      await page.getByTestId('tab-general').click();
      const iframe = page.locator('[data-testid="message-row"][data-id="demo-art-2"] [data-testid="artifact-iframe"]');
      await iframe.scrollIntoViewIfNeeded();
      await iframe.waitFor({ timeout: 10_000 });
      await page.waitForTimeout(600);
      const dir = resolve(v3dir);
      mkdirSync(dir, { recursive: true });
      await page.locator('[data-testid="message-row"][data-id="demo-art-2"]')
        .screenshot({ path: resolve(dir, 'iframe-artifact.png') });
    });
  }

  if (PHASE === '9') {
    // v0.3 final-sweep: FLAGS + TRICKSTER board captures for regression review.
    test('phase-9-v0.3/flags.png', async ({ page }) => {
      await page.goto('/?demo=1');
      await page.getByTestId('channel-tabs').waitFor({ timeout: 15_000 });
      await preloadFonts(page);
      await page.getByTestId('tab-flags').click();
      await page.waitForTimeout(300);
      const dir = resolve('screenshots/phase-9-v0.3');
      mkdirSync(dir, { recursive: true });
      await page.screenshot({ path: resolve(dir, 'flags.png'), fullPage: false });
    });

    test('phase-9-v0.3/trickster.png', async ({ page }) => {
      await page.goto('/?demo=1');
      await page.getByTestId('channel-tabs').waitFor({ timeout: 15_000 });
      await preloadFonts(page);
      await page.getByTestId('tab-trickster').click();
      await page.getByTestId('trickster-inbox').waitFor({ timeout: 5_000 });
      await page.waitForTimeout(300);
      const dir = resolve('screenshots/phase-9-v0.3');
      mkdirSync(dir, { recursive: true });
      await page.screenshot({ path: resolve(dir, 'trickster.png'), fullPage: false });
    });
  }

  if (PHASE === '10') {
    // v0.4: comparison / table / math captures — element shots of each demo card.
    const v4dir = 'screenshots/phase-10-v0.4';
    const cards = [['equation', 'demo-eqn'], ['table', 'demo-table'], ['choice', 'demo-choice']];
    for (const [name, id] of cards) {
      test(`phase-10-v0.4/${name}.png`, async ({ page }) => {
        await page.goto('/?demo=1');
        await page.getByTestId('channel-tabs').waitFor({ timeout: 15_000 });
        await preloadFonts(page);
        await page.getByTestId('tab-general').click();
        const card = page.locator(`[data-testid="message-row"][data-id="${id}"]`);
        await card.waitFor({ timeout: 10_000 });
        await card.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);
        const dir = resolve(v4dir);
        mkdirSync(dir, { recursive: true });
        await card.screenshot({ path: resolve(dir, `${name}.png`) });
      });
    }
  }

  if (PHASE === '5') {
    // Phase 5 v0.2: Live Tail Integration captures.

    test('phase-5-v0.2/live-connected.png', async ({ page }) => {
      // TRICKSTER tab with the LIVE indicator visible in the status bar.
      await page.goto('/?demo=1');
      await page.getByTestId('channel-tabs').waitFor({ timeout: 15_000 });
      await preloadFonts(page);
      await page.getByTestId('tab-trickster').click();
      await page.getByTestId('trickster-inbox').waitFor({ timeout: 5_000 });
      // Wait for SSE to connect so the indicator shows LIVE.
      await page.waitForFunction(
        () => {
          const el = document.querySelector('[data-testid="live-indicator"]');
          return el && el.getAttribute('data-state') === 'connected';
        },
        { timeout: 10_000 }
      );
      await page.waitForTimeout(200);
      const dir = resolve('screenshots/phase-5-v0.2');
      mkdirSync(dir, { recursive: true });
      await page.screenshot({ path: resolve(dir, 'live-connected.png'), fullPage: false });
    });

    test('phase-5-v0.2/live-message-arrived.png', async ({ page }) => {
      // FLAGS tab right after appending a new message via SSE;
      // new message visible at top, count badge incremented.
      // File-restore pattern: save original content, restore after capture.
      const { readFileSync, writeFileSync, appendFileSync } = await import('node:fs');
      const { resolve: res2 } = await import('node:path');
      const { fileURLToPath: ftu } = await import('node:url');
      const { dirname: dn } = await import('node:path');
      const __f = ftu(import.meta.url);
      const appRoot = res2(dn(__f), '../..');
      // tests/e2e → tests → app → stigmergy → _ops → The Palace (3 levels up from app)
      const palaceRoot = res2(appRoot, '../../..');
      const bbPath = res2(palaceRoot, '_ops/swarm/persistent/blackboard.jsonl');
      const originalContent = readFileSync(bbPath, 'utf8');

      try {
        await page.goto('/?demo=1');
        await page.getByTestId('channel-tabs').waitFor({ timeout: 15_000 });
        await preloadFonts(page);

        // Wait for SSE connection.
        await page.waitForFunction(
          () => {
            const el = document.querySelector('[data-testid="live-indicator"]');
            return el && el.getAttribute('data-state') === 'connected';
          },
          { timeout: 10_000 }
        );

        await page.getByTestId('tab-flags').click();
        await page.waitForTimeout(200);

        // Append a new FLAG message.
        const id = `capture-flag-${Date.now()}`;
        const msg = {
          schema_version: '1.0',
          id,
          ts: new Date().toISOString(),
          session_id: 'live-tail-capture',
          from: 'CAPTURE-AGENT',
          to: '*',
          type: 'FLAG',
          board: 'FLAGS',
          health: {
            context_pct: 0.1,
            stop_reason: 'end_turn',
            iteration: 1,
            tokens_this_call: 100,
            model: 'test-runner',
            score: 'green',
          },
          payload: {
            claim: 'Live tail capture: SSE message arrival test',
            target_entries: ['Hilaritas Generator'],
            confidence: 'high',
          },
        };
        appendFileSync(bbPath, JSON.stringify(msg) + '\n', 'utf8');

        // Wait up to 3 seconds for the new message row to appear.
        await page.waitForSelector(`[data-testid="message-row"][data-id="${id}"]`, { timeout: 5_000 });
        await page.waitForTimeout(200);

        const dir = res2('screenshots/phase-5-v0.2');
        const { mkdirSync } = await import('node:fs');
        mkdirSync(dir, { recursive: true });
        await page.screenshot({ path: res2(dir, 'live-message-arrived.png'), fullPage: false });
      } finally {
        writeFileSync(bbPath, originalContent, 'utf8');
      }
    });

    // live-reconnecting.png: SKIPPED for v0.2.
    // Capturing a genuine RECONNECTING state requires killing the dev server
    // mid-test, which terminates all other Playwright workers. The DOM attribute
    // data-state="reconnecting" is verified structurally in live-tail.spec.js.
    // A manual smoke-test can confirm the amber RECONNECTING indicator by stopping
    // the dev server while the UI is open. If a DOM-forced version is needed in
    // a future iteration, inject via page.evaluate to set the attribute, then capture.
  }

  if (PHASE === '11') {
    // v1.0 Phase 1 — STATE read captures. Drive against the live palace so
    // the validator sees real entries (the gate explicitly says "5 real
    // entries incl. one with a bundle + media enrichment").

    test('phase-11-v1.0/state-deck-pulse.png', async ({ page }) => {
      await page.goto('/');
      await page.getByTestId('pulse-header').waitFor({ timeout: 20_000 });
      await preloadFonts(page);
      await page.waitForTimeout(300);
      const dir = resolve('screenshots/phase-11-v1.0');
      mkdirSync(dir, { recursive: true });
      await page.screenshot({ path: resolve(dir, 'state-deck-pulse.png'), fullPage: false });
    });

    test('phase-11-v1.0/state-deck-entry-reader.png', async ({ page }) => {
      await page.goto('/');
      await page.getByTestId('pulse-header').waitFor({ timeout: 20_000 });
      await preloadFonts(page);
      await page.locator('[data-testid="pulse-row"][data-path="Kuramoto Coupling.md"]').click();
      await page.getByTestId('entry-reader').waitFor({ timeout: 10_000 });
      await page.waitForTimeout(400);
      const dir = resolve('screenshots/phase-11-v1.0');
      mkdirSync(dir, { recursive: true });
      await page.screenshot({ path: resolve(dir, 'state-deck-entry-reader.png'), fullPage: false });
    });

    test('phase-11-v1.0/state-deck-bundle-media.png', async ({ page }) => {
      await page.goto('/');
      await page.getByTestId('pulse-header').waitFor({ timeout: 20_000 });
      await preloadFonts(page);
      await page.locator('[data-testid="pulse-row"][data-path="Kuramoto Coupling.md"]').click();
      await page.getByTestId('entry-reader').waitFor({ timeout: 10_000 });
      // Scroll the bundle panel into view and capture just that region.
      const mediaList = page.getByTestId('bundle-media-list');
      await mediaList.waitFor({ timeout: 10_000 });
      await mediaList.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      const dir = resolve('screenshots/phase-11-v1.0');
      mkdirSync(dir, { recursive: true });
      await page.screenshot({ path: resolve(dir, 'state-deck-bundle-media.png'), fullPage: false });
    });

    test('phase-11-v1.0/state-deck-typed-links.png', async ({ page }) => {
      await page.goto('/');
      await page.getByTestId('pulse-header').waitFor({ timeout: 20_000 });
      await preloadFonts(page);
      await page.locator('[data-testid="pulse-row"][data-path="Kuramoto Coupling.md"]').click();
      await page.getByTestId('entry-reader').waitFor({ timeout: 10_000 });
      const rail = page.getByTestId('entry-rail');
      await rail.waitFor({ timeout: 5_000 });
      await rail.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      const dir = resolve('screenshots/phase-11-v1.0');
      mkdirSync(dir, { recursive: true });
      await page.screenshot({ path: resolve(dir, 'state-deck-typed-links.png'), fullPage: false });
    });

    test('phase-11-v1.0/log-deck-stub.png', async ({ page }) => {
      // LOG was a stub in Phase 1; Phase 2 replaced it with the real git
      // explorer. Capture the real deck so check:all stays green.
      await page.goto('/');
      await page.getByTestId('deck-tabs').waitFor({ timeout: 10_000 });
      await preloadFonts(page);
      await page.keyboard.press('l');
      await page.getByTestId('log-deck').waitFor({ timeout: 5_000 });
      await page.waitForTimeout(300);
      const dir = resolve('screenshots/phase-11-v1.0');
      mkdirSync(dir, { recursive: true });
      await page.screenshot({ path: resolve(dir, 'log-deck-stub.png'), fullPage: false });
    });
  }

  if (PHASE === '12') {
    // v1.0 Phase 2 — LOG read captures, against the live palace history.

    test('phase-12-v1.0/log-stream.png', async ({ page }) => {
      await page.goto('/');
      await page.getByTestId('deck-tabs').waitFor({ timeout: 10_000 });
      await preloadFonts(page);
      await page.keyboard.press('l');
      await page.getByTestId('commit-stream').waitFor({ timeout: 15_000 });
      await page.waitForTimeout(400);
      const dir = resolve('screenshots/phase-12-v1.0');
      mkdirSync(dir, { recursive: true });
      await page.screenshot({ path: resolve(dir, 'log-stream.png'), fullPage: false });
    });

    test('phase-12-v1.0/log-commit-diff.png', async ({ page }) => {
      await page.goto('/');
      await page.getByTestId('deck-tabs').waitFor({ timeout: 10_000 });
      await preloadFonts(page);
      await page.keyboard.press('l');
      await page.getByTestId('log-filters').waitFor({ timeout: 15_000 });
      await page.getByTestId('filter-text').fill('Two Batons');
      await page.waitForTimeout(400);
      await page.locator('[data-testid="commit-card"] [data-testid="commit-summary"]').first().click();
      await page.getByTestId('commit-diff').waitFor({ timeout: 10_000 });
      await page.waitForTimeout(400);
      const dir = resolve('screenshots/phase-12-v1.0');
      mkdirSync(dir, { recursive: true });
      await page.screenshot({ path: resolve(dir, 'log-commit-diff.png'), fullPage: false });
    });

    test('phase-12-v1.0/log-filtered.png', async ({ page }) => {
      await page.goto('/');
      await page.getByTestId('deck-tabs').waitFor({ timeout: 10_000 });
      await preloadFonts(page);
      await page.keyboard.press('l');
      await page.getByTestId('log-filters').waitFor({ timeout: 15_000 });
      // Click the first kind chip to show a filtered stream.
      await page.locator('[data-testid^="filter-kind-"]').first().click();
      await page.waitForTimeout(400);
      const dir = resolve('screenshots/phase-12-v1.0');
      mkdirSync(dir, { recursive: true });
      await page.screenshot({ path: resolve(dir, 'log-filtered.png'), fullPage: false });
    });
  }
});
