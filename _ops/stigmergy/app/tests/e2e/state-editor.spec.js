// v1.0 Phase 5 Stage A — STATE write (dry-run preview).
//
// The editor MUST NOT write or commit during these tests. All assertions
// are over the in-browser preview surface and the /api/entry/save response.
// We open the live palace's Kuramoto Coupling, change the stage in the
// form, click Save, and confirm the structured commit preview shows the
// correct subject + Palace-* trailers + diff -- the audition the editor
// IS the gate for.

import { test, expect } from '@playwright/test';

async function openKuramotoEditor(page) {
  await page.goto('/?deck=STATE');
  await page.getByTestId('state-deck').waitFor({ timeout: 10_000 });
  const rows = page.locator('[data-testid="pulse-row"]');
  const kuramoto = rows.filter({ hasText: 'Kuramoto Coupling' }).first();
  await kuramoto.click();
  await page.getByTestId('entry-reader').waitFor({ timeout: 10_000 });
  // Open the editor via a fiber-props click (the `[E] edit` chip is a span).
  await page.evaluate(() => {
    const el = document.querySelector('[data-testid="open-editor"]');
    const fk = el && Object.keys(el).find((k) => k.startsWith('__reactProps$'));
    if (fk && el[fk].onClick) el[fk].onClick();
  });
  await page.getByTestId('entry-editor').waitFor({ timeout: 10_000 });
}

async function clickStageChip(page, stage) {
  await page.evaluate((s) => {
    const btn = document.querySelector(`[data-testid="editor-frontmatter-stage-${s}"]`);
    const fk = btn && Object.keys(btn).find((k) => k.startsWith('__reactProps$'));
    if (fk && btn[fk].onClick) btn[fk].onClick();
  }, stage);
}

async function clickSave(page) {
  await page.evaluate(() => {
    const btn = document.querySelector('[data-testid="editor-save"]');
    if (!btn || btn.disabled) return;
    const fk = Object.keys(btn).find((k) => k.startsWith('__reactProps$'));
    if (fk && btn[fk].onClick) btn[fk].onClick();
  });
}

test.describe('STATE write — Phase 5 Stage A', () => {
  test('editor opens, shows clean state, and exposes form widgets bound to SCHEMA', async ({ page }) => {
    await openKuramotoEditor(page);

    await expect(page.getByTestId('editor-clean')).toBeVisible();
    await expect(page.getByTestId('editor-frontmatter-title')).toHaveValue('Kuramoto Coupling');
    // The type picker offers the §1 enum.
    const typeOpts = await page.locator('[data-testid="editor-frontmatter-type"] option').allTextContents();
    expect(typeOpts).toEqual(expect.arrayContaining([
      'concept', 'hub', 'project', 'breakthrough', 'source', 'meta',
      'practice', 'person', 'question', 'spore', 'specialist', 'maker',
    ]));
    // The stage stepper carries all seven SCHEMA §2 stages.
    for (const s of ['seed', 'sprout', 'growing', 'mature', 'fruiting', 'dormant', 'composting']) {
      await expect(page.getByTestId(`editor-frontmatter-stage-${s}`)).toBeVisible();
    }
  });

  test('changing stage marks dirty and the save button enables once summary is filled', async ({ page }) => {
    await openKuramotoEditor(page);

    await clickStageChip(page, 'fruiting');
    await expect(page.getByTestId('editor-dirty')).toBeVisible();

    // Save is disabled until summary is filled.
    await expect(page.getByTestId('editor-save')).toBeDisabled();
    await page.getByTestId('editor-summary').fill('mark fruiting after Stage A e2e');
    await expect(page.getByTestId('editor-save')).toBeEnabled();
  });

  test('clicking save produces the structured commit preview (subject + trailers + diff)', async ({ page }) => {
    await openKuramotoEditor(page);

    await clickStageChip(page, 'fruiting');
    await page.getByTestId('editor-summary').fill('mark fruiting after Stage A e2e');
    await clickSave(page);

    await page.getByTestId('commit-preview').waitFor({ timeout: 10_000 });

    const subject = await page.getByTestId('commit-preview-subject').textContent();
    expect(subject).toContain('edit(Kuramoto Coupling):');
    expect(subject).toContain('mark fruiting');

    const trailers = await page.getByTestId('commit-preview-trailers').textContent();
    expect(trailers).toContain('Palace-Kind: edit');
    expect(trailers).toContain('Palace-Entry: Kuramoto Coupling');
    expect(trailers).toContain('Palace-Stage: Kuramoto Coupling: mature->fruiting');
    expect(trailers).toContain('Palace-Verify: verified');
    expect(trailers).toContain('Palace-Author: loudon');

    const diff = await page.getByTestId('commit-preview-diff').textContent();
    expect(diff).toContain('Kuramoto Coupling.md');
    expect(diff).toMatch(/-stage: mature/);
    expect(diff).toMatch(/\+stage: fruiting/);
  });

  test('the file on disk is NOT modified by Stage A (dry-run guarantee)', async ({ page, request }) => {
    // Read the file content via /api/entry before and after a "save" click.
    const before = await request.get('/api/entry?path=Kuramoto%20Coupling.md');
    const beforeBody = (await before.json()).body;

    await openKuramotoEditor(page);
    await clickStageChip(page, 'composting');
    await page.getByTestId('editor-summary').fill('try to compost (should NOT write)');
    await clickSave(page);
    await page.getByTestId('commit-preview').waitFor({ timeout: 10_000 });

    const after = await request.get('/api/entry?path=Kuramoto%20Coupling.md');
    const afterBody = (await after.json()).body;
    expect(afterBody).toBe(beforeBody);
  });
});
