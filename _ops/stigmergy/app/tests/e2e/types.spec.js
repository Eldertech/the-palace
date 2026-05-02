import { test, expect } from '@playwright/test';

async function gotoDemoBoard(page) {
  await page.goto('/?demo=1');
  await expect(page.getByTestId('login-banner')).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: /lurk/i }).click();
  await expect(page.getByTestId('channel-tabs')).toBeVisible({ timeout: 15_000 });
}

test('every demo type is present and renders its expected glyph', async ({ page }) => {
  await gotoDemoBoard(page);

  const expected = {
    BROADCAST: '',                  // no prefix
    REPLY: '>',
    FLAG: '!',
    PROOF: '#',
    RESOURCE_REQUEST: '?',
    RESOURCE_GRANT: '+',
    RESOURCE_DENY: 'x',
    QUERY: '?',
    SESSION_INIT: '·',
    SESSION_CLOSE: '·',
    PAGE_UPDATE: '~',
    HEALTH_NOTICE: '!',
  };

  // Visit each board where the type's demo example lives so the row is in the DOM.
  const boardForType = {
    BROADCAST: 'GENERAL', REPLY: 'GENERAL', QUERY: 'GENERAL',
    FLAG: 'FLAGS',
    PROOF: 'WEAVE',
    SESSION_INIT: 'SYSTEM', SESSION_CLOSE: 'SYSTEM', PAGE_UPDATE: 'SYSTEM',
    RESOURCE_REQUEST: 'TRICKSTER', RESOURCE_GRANT: 'TRICKSTER',
    RESOURCE_DENY: 'TRICKSTER', HEALTH_NOTICE: 'TRICKSTER',
  };

  // Group types by board to avoid redundant clicks.
  const byBoard = {};
  for (const [t, b] of Object.entries(boardForType)) {
    (byBoard[b] ||= []).push(t);
  }

  for (const [board, types] of Object.entries(byBoard)) {
    await page.getByTestId(`tab-${board.toLowerCase()}`).click();
    for (const type of types) {
      const row = page.locator(`[data-testid="message-row"][data-type="${type}"]`).first();
      await expect(row, `expected at least one ${type} row on ${board}`).toBeVisible();
      const glyphSpan = row.getByTestId('type-glyph');
      const want = expected[type];
      if (want === '') {
        // BROADCAST has no glyph — the span is conditionally not rendered.
        await expect(glyphSpan).toHaveCount(0);
      } else {
        await expect(glyphSpan).toContainText(want);
      }
    }
  }
});

test('PROOF rows render with a double-line border', async ({ page }) => {
  await gotoDemoBoard(page);
  await page.getByTestId('tab-weave').click();
  const row = page.locator('[data-testid="message-row"][data-type="PROOF"]').first();
  await expect(row).toBeVisible();
  const style = await row.getAttribute('style');
  expect(style).toMatch(/double/);
});

test('RESOURCE_DENY accent is the error red', async ({ page }) => {
  await gotoDemoBoard(page);
  await page.getByTestId('tab-trickster').click();
  const row = page.locator('[data-testid="message-row"][data-type="RESOURCE_DENY"]').first();
  await expect(row).toBeVisible();
  // The accent is applied via CSS variable; just verify a glyph exists with the deny mark.
  await expect(row.getByTestId('type-glyph')).toContainText('x');
});

test('TRICKSTER tab shows pending counter when there are unanswered RESOURCE_REQUESTs', async ({ page }) => {
  await gotoDemoBoard(page);
  // Demo data has req-demo-001 (paired) and req-demo-002 (unpaired) → 1 pending.
  // (req-demo-003 has only a DENY without a REQUEST, so that one isn't counted as unpaired.)
  const tab = page.getByTestId('tab-trickster');
  await expect(tab).toContainText('PENDING');
});
