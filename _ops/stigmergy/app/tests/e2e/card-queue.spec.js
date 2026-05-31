import { test, expect } from '@playwright/test';

// v1.0 Phase 4.5 — Enrichment consolidation (card queue in QUEUE).
//
// RENDER-ONLY e2e: it verifies the absorbed Enrichment card queue renders in
// QUEUE against the LIVE palace (the real Enrichment/card-* folders). It does
// NOT click deposit/revise/discard -- those write to the real
// Enrichment/inbox.md and fire the supervisor. The full write+fire path is
// proven hermetically by tests/integration/cards-middleware.test.js against a
// temp palace, so it never touches real palace files or spawns real claude.

async function gotoQueue(page) {
  await page.goto('/?demo=only&deck=QUEUE');
  await expect(page.getByTestId('board-screen')).toBeVisible({ timeout: 10_000 });
}

test.describe('Enrichment card queue in QUEUE', () => {
  test('the card-queue section renders with a header', async ({ page }) => {
    await gotoQueue(page);
    await expect(page.getByTestId('card-queue')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('card-queue')).toContainText(/enrichment cards/i);
  });

  test('renders the real Enrichment cards (or an honest empty state)', async ({ page, request }) => {
    await gotoQueue(page);
    await expect(page.getByTestId('card-queue')).toBeVisible({ timeout: 10_000 });
    // Ground the assertion in what the server actually has.
    const api = await request.get('/api/cards').then((r) => r.json()).catch(() => ({ count: 0 }));
    if ((api.count ?? 0) > 0) {
      const cards = page.locator('[data-testid="card-item"]');
      await expect(cards.first()).toBeVisible({ timeout: 10_000 });
      expect(await cards.count()).toBeGreaterThan(0);
    } else {
      await expect(page.getByTestId('card-queue-empty')).toBeVisible();
    }
  });

  test('a card exposes deposit/revise/discard response controls', async ({ page, request }) => {
    await gotoQueue(page);
    const api = await request.get('/api/cards').then((r) => r.json()).catch(() => ({ count: 0 }));
    test.skip((api.count ?? 0) === 0, 'no real enrichment cards present to exercise controls');
    const firstCard = page.locator('[data-testid="card-item"]').first();
    await expect(firstCard).toBeVisible({ timeout: 10_000 });
    await expect(firstCard.getByTestId('card-action-deposit')).toContainText(/deposit/i);
    await expect(firstCard.getByTestId('card-action-revise')).toContainText(/revise/i);
    await expect(firstCard.getByTestId('card-action-discard')).toContainText(/discard/i);
    // Do NOT click -- that would write the real inbox + fire the supervisor.
  });

  test('a card shows its validator verdict strip when present', async ({ page, request }) => {
    await gotoQueue(page);
    const api = await request.get('/api/cards').then((r) => r.json()).catch(() => ({ cards: [] }));
    const withVerdict = (api.cards || []).find((c) => c.validator_verdict);
    test.skip(!withVerdict, 'no card carries a validator verdict');
    const card = page.locator(`[data-testid="card-item"][data-card-id="${withVerdict.id}"]`);
    await expect(card.getByTestId('card-verdict')).toBeVisible({ timeout: 10_000 });
  });
});
