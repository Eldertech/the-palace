import { test, expect } from '@playwright/test';

// Stage F — Two Paths. Closes the e2e gap: the EXACT card that
// orchestrator/src/two-paths-card.js emits (a rich-content `choice`, pick mode,
// two options each carrying its branch artifact, landing on TRICKSTER) renders
// through the real ChoiceBlock — two finished paths side-by-side, comparative
// audition — and the pick (SEND-PICK) is the gate that Phase 4 merges on.
// The demo card `demo-two-paths` in demo-data.js is byte-for-byte the builder's
// output for the apo-steward-004 fork.

async function gotoTrickster(page) {
  await page.goto('/?demo=1');
  await expect(page.getByTestId('channel-tabs')).toBeVisible({ timeout: 15_000 });
  await page.getByTestId('tab-trickster').click();
  await expect(page.locator('[data-testid="message-row"][data-id="demo-two-paths"]'))
    .toBeVisible({ timeout: 15_000 });
}

test('the Two Paths choice card renders on TRICKSTER with exactly two paths, each carrying its artifact', async ({ page }) => {
  await gotoTrickster(page);
  const card = page.locator('[data-testid="message-row"][data-id="demo-two-paths"]');

  // It is a choice card in pick mode.
  await expect(card.getByTestId('choice-tag')).toBeVisible();
  const block = card.getByTestId('choice-block');
  await expect(block).toBeVisible();
  await expect(block).toHaveAttribute('data-choice-mode', 'pick');

  // Exactly TWO options — the comparison a human holds — both build-both paths.
  const options = block.getByTestId('choice-option');
  await expect(options).toHaveCount(2);
  await expect(block.getByTestId('choice-option').filter({ hasText: 'K-SWEEP' })).toBeVisible();
  await expect(block.getByTestId('choice-option').filter({ hasText: 'DUAL-SWEEP' })).toBeVisible();

  // Each finished path carries its inline audio deliverable (the audition).
  await expect(block.locator('[data-testid="choice-option"] [data-testid="artifact-audio"]'))
    .toHaveCount(2);
});

test('picking a path selects it and arms SEND-PICK; nothing is auto-chosen', async ({ page }) => {
  await gotoTrickster(page);
  const block = page
    .locator('[data-testid="message-row"][data-id="demo-two-paths"]')
    .getByTestId('choice-block');

  // Two Paths never auto-picks: no option is pre-selected and SEND is disabled
  // until Loudon chooses.
  const sendBtn = block.getByRole('button', { name: /send pick/i });
  await expect(sendBtn).toBeDisabled();
  for (const o of await block.getByTestId('choice-option').all()) {
    await expect(o).toHaveAttribute('data-selected', 'false');
  }

  // Pick K-SWEEP → it selects and SEND arms. (Do NOT click SEND — that would
  // write the live board; the choice_response round-trip is covered by the
  // orchestrator unit tests on buildChoiceResponse / resolveOutcome.)
  const kSweep = block.getByTestId('choice-option').filter({ hasText: 'K-SWEEP' });
  await kSweep.locator('button').first().click();
  await expect(kSweep).toHaveAttribute('data-selected', 'true');
  await expect(sendBtn).toBeEnabled();
});
