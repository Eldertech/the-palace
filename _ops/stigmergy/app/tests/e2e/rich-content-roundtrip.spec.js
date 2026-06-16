import { test, expect } from '@playwright/test';

// v0.3 round-trip — the end-state proof. POST ONE enrichment-shaped §2.2
// message to the REAL persistent blackboard (exercising the untouched strict
// validator with the payload.kind discriminator), reload, and confirm the
// artifact renders inline. The blackboard file is saved and restored so the
// test leaves no trace — mirrors the live-message-arrived capture pattern.

test('an enrichment-shaped message round-trips: POST → persist → render inline', async ({ page, request }) => {
  const { readFileSync, writeFileSync } = await import('node:fs');
  const { resolve } = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const { dirname } = await import('node:path');
  const __f = fileURLToPath(import.meta.url);
  const appRoot = resolve(dirname(__f), '../..');               // tests/e2e → app
  const palaceRoot = resolve(appRoot, '../../..');              // app → palace root
  const bbPath = resolve(palaceRoot, '_ops/swarm/persistent/blackboard.jsonl');
  const original = readFileSync(bbPath, 'utf8');

  const id = `roundtrip-art-${Date.now()}`;
  const msg = {
    schema_version: '1.0',
    id,
    ts: new Date().toISOString(),
    session_id: 'v0.3-roundtrip',
    from: 'Kuramoto Coupling',          // page-as-agent identity
    to: '*',
    type: 'BROADCAST',
    board: 'GENERAL',
    health: {
      context_pct: 0.2,
      stop_reason: 'end_turn',
      iteration: 1,
      tokens_this_call: 200,
      model: 'claude-opus-4-7',
      score: 'green',
    },
    payload: {
      kind: 'enrichment_card',
      content: 'round-trip proof: an enrichment card written through the strict validator.',
      artifact_path: 'Kuramoto Coupling/fireflies-pond.png',
    },
  };

  try {
    // The discriminator-in-payload must pass the UNTOUCHED §2.2 validator.
    const res = await request.post('/api/persistent', {
      data: msg,
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status(), await res.text()).toBe(200);

    // Read it back and render it inline.
    // v2.0: the board view is a collapsible firehose under the QUEUE deck; open
    // it (folded by default for focus) to reach the channel tabs + message rows.
    await page.goto('/?deck=QUEUE');
    await page.getByTestId('board-firehose').locator('summary').click();
    await page.getByTestId('channel-tabs').waitFor({ timeout: 15_000 });
    await page.getByTestId('tab-general').click();

    const card = page.locator(`[data-testid="message-row"][data-id="${id}"]`);
    await card.waitFor({ timeout: 10_000 });
    await expect(card.getByTestId('enrichment-tag')).toBeVisible();
    const img = card.locator('[data-artifact-type="image"] [data-testid="artifact-img"]');
    await expect(img).toBeVisible();
    await expect(img).toHaveAttribute('src', /\/api\/file\?path=/);
  } finally {
    writeFileSync(bbPath, original, 'utf8');
  }
});
