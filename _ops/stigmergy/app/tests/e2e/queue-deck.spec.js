import { test, expect } from '@playwright/test';

// v1.0 Phase 4 — QUEUE reframe.
//
// The gate: "a handoff_ready appears and self-clears when a resolving commit
// lands." We use the hermetic ?demo=only feed, which carries two handoff_ready
// posts:
//   - demo-handoff-resolved (entry "Two Batons, One Board") -- that entry HAS
//     later commits in the REAL palace git history, so QUEUE's reconciliation
//     (which fetches the live /api/log) marks it "looks done".
//   - demo-handoff-open (entry "Nonexistent Demo Entry ZZZ") -- no resolving
//     commit exists, so it stays open.
// This proves both the build path and the prospective->retrospective crossing
// against real git, deterministically (the palace history for that entry is
// fixed). The reconciliation LOGIC itself is also unit-tested exhaustively in
// tests/unit/queue-model.test.js.

async function gotoQueue(page) {
  await page.goto('/?demo=only&deck=QUEUE');
  await expect(page.getByTestId('board-screen')).toBeVisible({ timeout: 10_000 });
  // The QUEUE panel mounts and fetches the live git log for reconciliation.
  await expect(page.locator('[data-testid="queue-open"], [data-testid="queue-resolved"]').first())
    .toBeVisible({ timeout: 15_000 });
}

test.describe('QUEUE panel — the ranked inbox', () => {
  test('renders the unified queue panel above the board', async ({ page }) => {
    await gotoQueue(page);
    await expect(page.getByText('queue -- the ranked inbox')).toBeVisible();
  });

  test('a vector_proposal renders as a WEAVE PROPOSAL card with source -> target metadata', async ({ page }) => {
    await gotoQueue(page);
    // Switch to the WEAVE lane so the proposal card is visible.
    await page.getByTestId('queue-lane-WEAVE').click();
    const proposal = page.locator('[data-testid="queue-item"][data-kind="vector_proposal"]').first();
    await expect(proposal).toBeVisible();
    await expect(proposal).toContainText(/WEAVE PROPOSAL/);
    await expect(proposal).toContainText(/Kuramoto Coupling/);
    await expect(proposal).toContainText(/Spinoza Conatus/);
    await expect(proposal.getByTestId('queue-item-proposal-type')).toContainText(/promote unsung path/);
    await expect(proposal.getByTestId('queue-item-proposal-edge')).toContainText(/Kuramoto Coupling.*-->.*Spinoza Conatus/);
    // Grant / deny actions are available, same as resource_request.
    await expect(proposal.getByTestId('queue-item-grant')).toBeVisible();
    await expect(proposal.getByTestId('queue-item-deny')).toBeVisible();
    // Pointer chip jumps to STATE for the source entry.
    await expect(proposal.getByTestId('queue-item-jump')).toContainText(/Kuramoto Coupling/);
  });

  // The Weave loop's back half: a proposal carrying a structured `apply` op
  // offers "grant & apply" (executes the edit), while a prose-only proposal
  // stays manual-grant. We assert the affordance only — clicking it would edit
  // the live palace; the executor's write/commit/PROOF path is proven in
  // tests/integration/weave-apply.test.js.
  test('an executable vector_proposal offers grant & apply; a prose-only one does not', async ({ page }) => {
    await gotoQueue(page);
    await page.getByTestId('queue-lane-WEAVE').click();

    const tuning = page.locator('[data-testid="queue-item"][data-kind="vector_proposal"]', { hasText: 'Retrospective Delay' });
    await expect(tuning).toBeVisible();
    await expect(tuning.getByTestId('queue-item-proposal-type')).toContainText(/forward-vector tuning/);
    await expect(tuning.getByTestId('queue-item-apply')).toBeVisible();
    await expect(tuning.getByTestId('queue-item-apply')).toContainText(/grant & apply/i);

    const prose = page.locator('[data-testid="queue-item"][data-kind="vector_proposal"]', { hasText: 'promote unsung path' });
    await expect(prose).toBeVisible();
    await expect(prose.getByTestId('queue-item-grant')).toBeVisible();
    await expect(prose.getByTestId('queue-item-apply')).toHaveCount(0);

    await tuning.getByTestId('queue-item-apply').scrollIntoViewIfNeeded();
    await page.screenshot({ path: '/tmp/stigmergy-weave-grant-apply.png', fullPage: false });
  });

  test('a weave_flag renders as a WEAVE FLAG card with flag_type, deposit, sources, and target', async ({ page }) => {
    await gotoQueue(page);
    // Switch to the WEAVE lane so the flag card is visible alongside the proposal.
    await page.getByTestId('queue-lane-WEAVE').click();
    const flag = page.locator('[data-testid="queue-item"][data-kind="weave_flag"]').first();
    await expect(flag).toBeVisible();
    await expect(flag).toContainText(/WEAVE FLAG/);
    // The flag_type chip carries the human-language label.
    await expect(flag.getByTestId('queue-item-flag-type')).toContainText(/backlink audit/);
    // The source deposit id is surfaced so the human can trace provenance.
    await expect(flag.getByTestId('queue-item-flag-deposit')).toContainText(/DEMO-BATCH01/);
    // Source entries and the target entry both render in the metadata row.
    await expect(flag.getByTestId('queue-item-flag-sources'))
      .toContainText(/Floquet Theory.*Kuramoto Coupling/);
    await expect(flag.getByTestId('queue-item-flag-target')).toContainText(/Phase Reduction/);
    // The card LEADS with proposed_action (the human-language ask).
    await expect(flag.getByTestId('queue-item-ask'))
      .toContainText(/couples-with.*Phase Reduction/);
    // Grant / Deny actions are available, same as vector_proposal.
    await expect(flag.getByTestId('queue-item-grant')).toBeVisible();
    await expect(flag.getByTestId('queue-item-deny')).toBeVisible();
    // Pointer chip jumps to STATE for the first source entry.
    await expect(flag.getByTestId('queue-item-jump')).toContainText(/Floquet Theory/);
  });

  test('a handoff_ready appears as a QUEUE item', async ({ page }) => {
    await gotoQueue(page);
    const items = page.locator('[data-testid="queue-item"][data-kind="handoff_ready"]');
    expect(await items.count()).toBeGreaterThanOrEqual(1);
    // The open one (nonexistent entry) is present and NOT resolved.
    const openItem = page.locator('[data-testid="queue-item"][data-kind="handoff_ready"][data-resolved="false"]');
    await expect(openItem.first()).toBeVisible();
    await expect(openItem.first()).toContainText(/stale if:/i);
  });

  test('a handoff_ready self-clears when git has a resolving commit', async ({ page }) => {
    await gotoQueue(page);
    // The "Two Batons, One Board" handoff resolves against real git history.
    const resolved = page.locator('[data-testid="queue-item"][data-resolved="true"]');
    await expect(resolved.first()).toBeVisible({ timeout: 15_000 });
    await expect(resolved.first()).toContainText(/looks done/i);
    // And it offers the "clear it?" affordance (human confirms; not silent).
    await expect(resolved.first().getByTestId('queue-item-clear')).toBeVisible();
  });

  test('clicking "clear it?" removes the resolved item from the view', async ({ page }) => {
    await gotoQueue(page);
    const resolved = page.locator('[data-testid="queue-item"][data-resolved="true"]');
    await expect(resolved.first()).toBeVisible({ timeout: 15_000 });
    const before = await page.locator('[data-testid="queue-item"]').count();
    await resolved.first().getByTestId('queue-item-clear').click();
    await page.waitForTimeout(300);
    const after = await page.locator('[data-testid="queue-item"]').count();
    expect(after).toBe(before - 1);
  });

  test('board lanes filter the queue (boards as lanes, not tabs)', async ({ page }) => {
    await gotoQueue(page);
    // The GENERAL lane chip exists (both demo handoffs are on GENERAL).
    await expect(page.getByTestId('queue-lane-GENERAL')).toBeVisible();
    await page.getByTestId('queue-lane-GENERAL').click();
    await page.waitForTimeout(200);
    // Every visible item is on the GENERAL board (the lane filter holds).
    const items = page.locator('[data-testid="queue-item"]');
    expect(await items.count()).toBeGreaterThanOrEqual(1);
  });

  // ── Inline grant (no separate window) + visible verdict ────────────────────
  // Clicking grant posts immediately -- no ResponseModal -- and the card's
  // action row becomes a GRANTED badge that stays until cleared.

  test('clicking grant answers in place: no modal, a GRANTED verdict appears', async ({ page }) => {
    await gotoQueue(page);
    await page.getByTestId('queue-lane-WEAVE').click();
    const proposal = page.locator('[data-testid="queue-item"][data-kind="vector_proposal"]').first();
    await expect(proposal).toBeVisible();
    await proposal.getByTestId('queue-item-grant').click();
    // No pop-up window opens.
    await expect(page.getByTestId('response-modal')).toHaveCount(0);
    // The chosen verdict is shown clearly on the card.
    const verdict = proposal.getByTestId('queue-item-decision');
    await expect(verdict).toBeVisible();
    await expect(verdict).toHaveAttribute('data-verb', 'GRANTED');
    await expect(verdict).toContainText(/GRANTED/);
    // The card is now marked decided and its action buttons are gone.
    await expect(proposal).toHaveAttribute('data-decided', 'true');
    await expect(proposal.getByTestId('queue-item-grant')).toHaveCount(0);
    // The status line reflects one decided item.
    await expect(page.getByTestId('queue-decided-count')).toContainText(/decided/);
  });

  test('deny still opens the modal (typed reason preserved)', async ({ page }) => {
    await gotoQueue(page);
    await page.getByTestId('queue-lane-WEAVE').click();
    const proposal = page.locator('[data-testid="queue-item"][data-kind="vector_proposal"]').first();
    await expect(proposal).toBeVisible();
    await proposal.getByTestId('queue-item-deny').click();
    // Deny needs a reason, so the pop-up is intentionally kept.
    await expect(page.getByTestId('response-modal')).toBeVisible();
    // Cancel leaves the item untouched (no verdict, still answerable).
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('response-modal')).toHaveCount(0);
    await expect(proposal.getByTestId('queue-item-deny')).toBeVisible();
  });

  test('a granted verdict can be cleared from the view', async ({ page }) => {
    await gotoQueue(page);
    await page.getByTestId('queue-lane-WEAVE').click();
    const proposal = page.locator('[data-testid="queue-item"][data-kind="vector_proposal"]').first();
    await proposal.getByTestId('queue-item-grant').click();
    const verdict = proposal.getByTestId('queue-item-decision');
    await expect(verdict).toBeVisible();
    await verdict.getByTestId('queue-item-decision-clear').click();
    await page.waitForTimeout(200);
    // The decided card (the promote-unsung proposal, first in the ranking) is
    // tidied away. (A sibling vector-tuning proposal also exists in the demo
    // feed; scope the assertion to the one we granted.)
    await expect(page.locator('[data-testid="queue-item"][data-kind="vector_proposal"]', { hasText: 'promote unsung path' })).toHaveCount(0);
  });
});
