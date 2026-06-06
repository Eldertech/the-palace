// trickster-keyboard.spec.js — e2e for the native [T] deck's keyboard layer.
//
// The deck's keydown handler is delivered via a real window listener, so true
// keystroke interaction (1-N picks an option, Enter files the pick, and the
// textarea guard) can only be proven in a browser — the unit suite runs in node
// with react-dom/server and never dispatches events. resolveKey() carries the
// pure key→action coverage (tests/unit/trickster-keys.test.js); this spec
// proves the wiring end-to-end.
//
// Hermetic strategy (mirrors click-to-respond.spec.js): we snapshot the real
// persistent blackboard, inject ONE option-bearing RESOURCE_REQUEST with a
// far-future ts so it sorts to the top of the deck (index 0 = focused by
// default), drive the keyboard, and restore the board after every test. The
// Enter path POSTs a real RESOURCE_GRANT to the persistent board; the restore
// wipes both the injected request and the grant, leaving no trace.

import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// app/ is at <palace>/_ops/stigmergy/app, so the palace root is three levels up.
const APP_ROOT = resolve(__dirname, '../..');
const PALACE_ROOT = resolve(APP_ROOT, '../../..');
const PERSISTENT_BB = resolve(PALACE_ROOT, '_ops/swarm/persistent/blackboard.jsonl');

const REQ_ID = 'e2e-kbd-req-001';

// A leanless, option-bearing request. Leanless on purpose: space/lean must not
// interfere — this exercises the 1-N / Enter override path specifically. The
// 2099 ts guarantees it sorts newest-first to index 0 (the default focus).
const INJECTED = {
  schema_version: '1.0',
  id: 'msg-e2e-kbd-001',
  ts: '2099-01-01T00:00:00Z',
  session_id: 'e2e-keyboard-session',
  from: 'E2E-KEYBOARD-STEWARD',
  to: 'TRICKSTER',
  type: 'RESOURCE_REQUEST',
  board: 'TRICKSTER',
  request_id: REQ_ID,
  health: { context_pct: 0.3, score: 'green', model: 'e2e' },
  payload: {
    resource: 'human_decision',
    headline: 'E2E keyboard test — pick an option by number.',
    ground: 'injected by trickster-keyboard.spec.js · no lean — you decide',
    rationale: 'proves the 1-N / Enter keyboard path end-to-end',
    blocking: false,
    options: [
      { id: 'ALPHA', label: 'ALPHA — first option' },
      { id: 'BETA', label: 'BETA — second option' },
    ],
  },
};

let boardSnapshot = '';
test.beforeAll(() => {
  boardSnapshot = readFileSync(PERSISTENT_BB, 'utf8');
});
test.afterEach(() => {
  writeFileSync(PERSISTENT_BB, boardSnapshot, 'utf8');
});
test.afterAll(() => {
  writeFileSync(PERSISTENT_BB, boardSnapshot, 'utf8');
});

// Append the injected request onto the pristine snapshot, then open the native
// deck. Returns a locator for the injected card.
async function gotoDeckWithInjected(page) {
  const sep = boardSnapshot.endsWith('\n') || boardSnapshot === '' ? '' : '\n';
  writeFileSync(PERSISTENT_BB, boardSnapshot + sep + JSON.stringify(INJECTED) + '\n', 'utf8');
  await page.goto('/?deck=TRICKSTER');
  await expect(page.getByTestId('trickster-deck')).toBeVisible({ timeout: 15_000 });
  const card = page.locator(`[data-testid="trickster-card"][data-request-id="${REQ_ID}"]`);
  await expect(card).toBeVisible({ timeout: 10_000 });
  // The far-future ts puts it at index 0, which the deck focuses by default.
  await expect(card).toHaveAttribute('data-focused', 'true');
  return card;
}

// Grants on the board correlating to the injected request.
function grantsForInjected() {
  return readFileSync(PERSISTENT_BB, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((l) => { try { return JSON.parse(l); } catch { return null; } })
    .filter((m) => m && m.type === 'RESOURCE_GRANT' && m.re === REQ_ID);
}

test.describe('TRICKSTER deck — keyboard 1-N / Enter', () => {
  test('a number key picks the Nth option and Enter files that pick', async ({ page }) => {
    const card = await gotoDeckWithInjected(page);

    const opts = card.getByTestId('card-options');
    const alphaBtn = opts.getByRole('button', { name: /ALPHA/ });
    const betaBtn = opts.getByRole('button', { name: /BETA/ });
    const borderOf = (loc) => loc.evaluate((el) => getComputedStyle(el).borderColor);

    // Before: both options sit in the same (default) register.
    expect(await borderOf(alphaBtn)).toBe(await borderOf(betaBtn));

    // Press "2" → picks the 2nd option (BETA) on the focused card, which shifts
    // it into the primary (selected) register — a visibly different border.
    await page.keyboard.press('2');
    await expect
      .poll(async () => (await borderOf(betaBtn)) !== (await borderOf(alphaBtn)))
      .toBe(true);

    // Press Enter → files the current pick. The card drops out once the grant
    // posts and the parent re-derives the inbox.
    await page.keyboard.press('Enter');
    await expect(card).not.toBeVisible({ timeout: 10_000 });

    // The posted grant carries the option the number key chose.
    const grants = grantsForInjected();
    expect(grants.length).toBe(1);
    expect(grants[0].payload.option_id).toBe('BETA');
    expect(grants[0].payload.granted).toBe(true);
  });

  test('keystrokes in the freeform note are not hijacked (textarea guard)', async ({ page }) => {
    const card = await gotoDeckWithInjected(page);

    // Type a number and Enter INSIDE the note field — the deck must ignore both.
    const note = card.getByTestId('card-notes');
    await note.click();
    await note.type('2');
    await page.keyboard.press('Enter');

    // No option got picked and nothing was filed: the card is still pending,
    // and the note literally holds what was typed.
    await expect(card).toBeVisible();
    await expect(note).toHaveValue('2\n');
    expect(grantsForInjected().length).toBe(0);
  });
});
