// live-tail.spec.js — Phase 5 SSE live tail integration tests.
//
// These tests require the dev server to be running (baseURL configured in
// playwright.config.js). They append test messages to the persistent
// blackboard and verify they appear in the UI without a page reload.
//
// File-safety contract: every test that mutates blackboard.jsonl saves the
// original content before any write and restores it in afterEach. The 14
// canonical messages from songline-2026-05-04-001 must remain intact.

import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const APP_ROOT = resolve(__dirname, '../..');
const PALACE_ROOT = resolve(APP_ROOT, '../../..');
const BLACKBOARD = resolve(PALACE_ROOT, '_ops/swarm/persistent/blackboard.jsonl');

// Save/restore the blackboard around tests that write to it.
let savedBlackboard = null;

function saveBlackboard() {
  savedBlackboard = readFileSync(BLACKBOARD, 'utf8');
}

function restoreBlackboard() {
  if (savedBlackboard !== null) {
    writeFileSync(BLACKBOARD, savedBlackboard, 'utf8');
    savedBlackboard = null;
  }
}

function makeTestMessage({ id, board = 'GENERAL', type = 'BROADCAST', payload = null }) {
  return {
    schema_version: '1.0',
    id,
    ts: new Date().toISOString(),
    session_id: 'live-tail-test-session',
    from: 'LIVE-TEST',
    to: '*',
    type,
    board,
    health: {
      context_pct: 0.1,
      stop_reason: 'end_turn',
      iteration: 1,
      tokens_this_call: 100,
      model: 'test-runner',
      score: 'green',
    },
    payload: payload ?? { content: `live-tail test message ${id}` },
  };
}

test.describe('Live Tail Integration', () => {
  test.afterEach(() => {
    restoreBlackboard();
  });

  test('status indicator transitions to LIVE on connect', async ({ page }) => {
    await page.goto('/?demo=1');
    await expect(page.getByTestId('channel-tabs')).toBeVisible({ timeout: 15_000 });

    // The SSE connection should establish within a few seconds.
    await expect(page.getByTestId('live-indicator')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('live-indicator')).toHaveAttribute('data-state', 'connected', { timeout: 10_000 });
    const text = await page.getByTestId('live-indicator').textContent();
    expect(text).toContain('LIVE');
  });

  test('live indicator is present in the status bar', async ({ page }) => {
    await page.goto('/?demo=1');
    await expect(page.getByTestId('status-bar')).toBeVisible({ timeout: 15_000 });

    const indicator = page.getByTestId('live-indicator');
    await expect(indicator).toBeVisible({ timeout: 10_000 });
    // State should be one of the known valid states.
    const state = await indicator.getAttribute('data-state');
    expect(['connecting', 'connected', 'reconnecting', 'offline']).toContain(state);
  });

  test('live indicator reflects offline state', async ({ page }) => {
    // NOTE: Simulating a true offline state requires killing the dev server,
    // which is out of scope for v0.2 automated tests (it would terminate all
    // other tests). Instead, we verify that the indicator renders the correct
    // DOM structure — data-testid and data-state are present — and that when
    // the server IS running (the normal case), it transitions to 'connected'.
    // A manual smoke-test can verify the OFFLINE/RECONNECTING states by
    // stopping the dev server while the UI is open.
    //
    // Skipping the destructive "kill the server" case.
    await page.goto('/?demo=1');
    await expect(page.getByTestId('live-indicator')).toBeVisible({ timeout: 10_000 });
    const state = await page.getByTestId('live-indicator').getAttribute('data-state');
    // If the server is up (which it is during CI), we expect 'connected'.
    expect(state).toBe('connected');
  });

  test('page receives new messages via SSE without reload', async ({ page }) => {
    saveBlackboard();

    await page.goto('/?demo=1');
    await expect(page.getByTestId('channel-tabs')).toBeVisible({ timeout: 15_000 });

    // Wait for SSE to connect before appending.
    await expect(page.getByTestId('live-indicator')).toHaveAttribute('data-state', 'connected', { timeout: 10_000 });

    const id = `live-test-${Date.now()}`;
    const msg = makeTestMessage({ id, board: 'GENERAL', type: 'BROADCAST' });
    const line = JSON.stringify(msg) + '\n';

    // Navigate to GENERAL board so the new message will be visible.
    await page.getByTestId('tab-general').click();

    // Append without reloading the page.
    appendFileSync(BLACKBOARD, line, 'utf8');

    // The new message should appear within 2 seconds via SSE.
    await expect(
      page.locator(`[data-testid="message-row"][data-id="${id}"]`)
    ).toBeVisible({ timeout: 5_000 });
  });

  test('FLAGS tab badge increments when a new FLAG arrives', async ({ page }) => {
    saveBlackboard();

    await page.goto('/?demo=1');
    await expect(page.getByTestId('channel-tabs')).toBeVisible({ timeout: 15_000 });

    // Wait for SSE connection.
    await expect(page.getByTestId('live-indicator')).toHaveAttribute('data-state', 'connected', { timeout: 10_000 });

    // Record the current FLAGS tab badge text.
    const flagsTab = page.getByTestId('tab-flags');
    const beforeText = await flagsTab.textContent();

    // Stay on GENERAL so badge change is not "invisible" (it's always visible in the tab).
    // The test verifies the badge updates even when FLAGS is not the active board.
    await page.getByTestId('tab-general').click();

    const id = `live-flag-${Date.now()}`;
    const msg = makeTestMessage({
      id,
      board: 'FLAGS',
      type: 'FLAG',
      payload: {
        claim: 'Live test: phase-locked coupling detected',
        target_entries: ['Kuramoto Coupling'],
        confidence: 'high',
      },
    });
    appendFileSync(BLACKBOARD, JSON.stringify(msg) + '\n', 'utf8');

    // Badge should increment — wait for the tab text to change.
    await expect(async () => {
      const afterText = await flagsTab.textContent();
      expect(afterText).not.toBe(beforeText);
    }).toPass({ timeout: 5_000 });
  });

  test('TRICKSTER pending counter increments when a new RESOURCE_REQUEST arrives', async ({ page }) => {
    saveBlackboard();

    await page.goto('/?demo=1');
    await expect(page.getByTestId('channel-tabs')).toBeVisible({ timeout: 15_000 });

    // Wait for SSE connection.
    await expect(page.getByTestId('live-indicator')).toHaveAttribute('data-state', 'connected', { timeout: 10_000 });

    const tricksterTab = page.getByTestId('tab-trickster');
    const beforeText = await tricksterTab.textContent();

    // Stay on GENERAL tab while the RESOURCE_REQUEST lands on TRICKSTER.
    await page.getByTestId('tab-general').click();

    const id = `live-req-${Date.now()}`;
    const requestId = `req-${Date.now()}`;
    const msg = makeTestMessage({
      id,
      board: 'TRICKSTER',
      type: 'RESOURCE_REQUEST',
      payload: {
        request_id: requestId,
        resource: 'context_window',
        reason: 'live-tail integration test',
        blocking: true,
        options: [
          { label: 'Grant - limited', action: 'RESOURCE_GRANT', params: { scope: 'limited' } },
          { label: 'Deny', action: 'RESOURCE_DENY', params: {} },
        ],
      },
    });
    appendFileSync(BLACKBOARD, JSON.stringify(msg) + '\n', 'utf8');

    // TRICKSTER tab PENDING badge should appear or increment.
    await expect(async () => {
      const afterText = await tricksterTab.textContent();
      expect(afterText).not.toBe(beforeText);
    }).toPass({ timeout: 5_000 });
  });
});
