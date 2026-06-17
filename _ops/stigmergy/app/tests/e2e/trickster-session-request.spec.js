import { test, expect } from '@playwright/test';

// Steward request-interactive (v2.0 Phase 1) — the read/surface half.
//
// A steward that posts a RESOURCE_REQUEST with payload.kind:'interactive_session'
// is asking to be *launched* into a live watch+steer session, not to file a
// grant. The TRICKSTER card foregrounds a primary "launch interactive session"
// CTA + a "wants a live session" badge and suppresses the small corner action;
// an ordinary decision card is unchanged.
//
// Hermetic ?demo=only (the demo board carries a session-request card from
// Crystal Synthesizer — a registered steward, so the CTA routes to the
// construct-agent panel — + an ordinary decision card from Kuramoto Coupling).
// Render + open only; we never click LAUNCH TERMINAL (that POSTs /api/launch and
// would open a real Terminal / fire a steward).

const SESSION = '[data-testid="trickster-card"][data-request-id="crystal-synthesizer-steward-019"]';
const ORDINARY = '[data-testid="trickster-card"][data-request-id="kuramoto-steward-014"]';

async function gotoTrickster(page) {
  await page.goto('/?demo=only&deck=TRICKSTER');
  await expect(page.getByTestId('trickster-deck')).toBeVisible({ timeout: 15_000 });
  await expect(page.locator(SESSION)).toBeVisible({ timeout: 15_000 });
}

test.describe('Trickster — session request (interactive_session)', () => {
  test('a session-request card foregrounds the launch CTA + badge, not the corner action', async ({ page }) => {
    await gotoTrickster(page);
    const card = page.locator(SESSION);

    // Foregrounded: badge + primary CTA.
    await expect(card.getByTestId('card-session-badge')).toBeVisible();
    await expect(card.getByTestId('card-session-cta')).toBeVisible();
    await expect(card.getByTestId('card-session-launch')).toContainText(/launch interactive session/i);

    // The small corner "open interactive" action is suppressed on this card.
    await expect(card.getByTestId('card-launch')).toHaveCount(0);

    // The options remain as the decline/defer surface.
    await expect(card.getByTestId('card-options')).toBeVisible();

    await page.screenshot({ path: '/tmp/stigmergy-session-request-card.png', fullPage: false });
  });

  test('an ordinary decision card keeps the corner action and shows no session chrome', async ({ page }) => {
    await gotoTrickster(page);
    const card = page.locator(ORDINARY);
    await expect(card.getByTestId('card-launch')).toBeVisible();
    await expect(card.getByTestId('card-session-cta')).toHaveCount(0);
    await expect(card.getByTestId('card-session-badge')).toHaveCount(0);
  });

  test('clicking the CTA opens a launch surface (no terminal fired)', async ({ page }) => {
    await gotoTrickster(page);
    await page.locator(SESSION).getByTestId('card-session-launch').click();
    // Either the construct-agent panel (registered steward) or the simple
    // launch modal (fallback) — both are watch+steer surfaces.
    const modal = page.locator('[data-testid="agent-launch-modal"], [data-testid="launch-modal"]');
    await expect(modal.first()).toBeVisible({ timeout: 10_000 });
    await page.screenshot({ path: '/tmp/stigmergy-session-request-modal.png', fullPage: false });
    // Esc closes without launching anything.
    await page.keyboard.press('Escape');
    await expect(modal).toHaveCount(0);
  });
});
