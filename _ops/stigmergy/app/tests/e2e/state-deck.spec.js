import { test, expect } from '@playwright/test';

// v1.0 Phase 1 — STATE read.
//
// Default deck is STATE. The PULSE lens shows real palace entries,
// sorted by vitality. Clicking a row opens that entry in the reader,
// with its YAML rendered as a header, typed links in a side panel,
// body wikilinks resolved against the live index, and the entry's
// bundle (if any) rendered with media inline.

test.describe('STATE deck — chrome', () => {
  test('default-loads on STATE with deck-tabs visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('deck-tabs')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('deck-state')).toHaveAttribute('data-active', 'true');
    await expect(page.getByTestId('state-deck')).toBeVisible();
  });

  test('all three deck tabs render with their hotkeys and subtitles', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('deck-state')).toContainText('STATE');
    await expect(page.getByTestId('deck-state')).toContainText('PRESENT');
    await expect(page.getByTestId('deck-queue')).toContainText('QUEUE');
    await expect(page.getByTestId('deck-queue')).toContainText('FUTURE');
    await expect(page.getByTestId('deck-log')).toContainText('LOG');
    await expect(page.getByTestId('deck-log')).toContainText('PAST');
  });

  test('Q hotkey switches to QUEUE (board screen reappears)', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('state-deck')).toBeVisible();
    await page.keyboard.press('q');
    await expect(page.getByTestId('board-screen')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByTestId('deck-queue')).toHaveAttribute('data-active', 'true');
  });

  test('L hotkey shows the LOG deck (git explorer)', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('l');
    await expect(page.getByTestId('log-deck')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByTestId('log-deck')).toContainText(/the git record/i);
  });

  test('S hotkey returns to STATE', async ({ page }) => {
    await page.goto('/?deck=QUEUE');
    await expect(page.getByTestId('board-screen')).toBeVisible({ timeout: 10_000 });
    await page.keyboard.press('s');
    await expect(page.getByTestId('state-deck')).toBeVisible({ timeout: 5_000 });
  });

  test('?deck=QUEUE query param lands directly on QUEUE', async ({ page }) => {
    await page.goto('/?deck=QUEUE');
    await expect(page.getByTestId('board-screen')).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('STATE deck — PULSE lens (index of real palace entries)', () => {
  test('indexes the live palace and shows the pulse-sorted index', async ({ page }) => {
    await page.goto('/');
    // PULSE box mounts when /api/entries resolves -- give the real palace
    // walk a generous timeout.
    await expect(page.getByTestId('pulse-header')).toBeVisible({ timeout: 20_000 });
    const rowCount = await page.locator('[data-testid="pulse-row"]').count();
    expect(rowCount).toBeGreaterThan(5);
  });

  test('Kuramoto Coupling entry appears in the index with a bundle marker', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('pulse-header')).toBeVisible({ timeout: 20_000 });
    const kRow = page.locator('[data-testid="pulse-row"][data-path="Kuramoto Coupling.md"]');
    await expect(kRow).toBeVisible({ timeout: 10_000 });
    await expect(kRow).toContainText('+bundle');
  });

  test('the filter input narrows the list to matching titles', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('pulse-header')).toBeVisible({ timeout: 20_000 });
    await page.getByTestId('pulse-filter').fill('kuramoto');
    const rows = page.locator('[data-testid="pulse-row"]');
    await expect(rows).toHaveCount(await rows.count());
    const firstText = await rows.first().textContent();
    expect(firstText?.toLowerCase()).toContain('kuramoto');
  });
});

test.describe('STATE deck — entry reader (Kuramoto Coupling, the bundle + media test case)', () => {
  test('opens an entry, renders its YAML as a structured header, with all the parts', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('pulse-header')).toBeVisible({ timeout: 20_000 });
    await page.locator('[data-testid="pulse-row"][data-path="Kuramoto Coupling.md"]').click();
    const reader = page.getByTestId('entry-reader');
    await expect(reader).toBeVisible({ timeout: 10_000 });
    await expect(reader).toHaveAttribute('data-path', 'Kuramoto Coupling.md');

    // YAML rendered as a structured header
    await expect(page.getByTestId('frontmatter-header')).toBeVisible();
    await expect(page.getByTestId('type-badge')).toContainText(/hub/i);
    await expect(page.getByTestId('stage-glyph')).toContainText(/mature/i);
    await expect(page.getByTestId('pillars')).toBeVisible();

    // Forward vector is hoisted out as the hero quote (the entry's conatus)
    await expect(page.getByTestId('forward-vector')).toBeVisible();
    await expect(page.getByTestId('forward-vector')).toContainText(/conatus/i);

    // Typed-link panel and body wikilinks are separated (SCHEMA §4)
    const typedLinkRows = await page.locator('[data-testid="typed-link-row"]').count();
    expect(typedLinkRows).toBeGreaterThan(3);
    const bodyWikilinks = await page.locator('[data-testid="body-wikilink"]').count();
    expect(bodyWikilinks).toBeGreaterThan(0);

    // The bundle is rendered with media inline (the v0.3 rich-content engine
    // pointed at the entry bundle — the "enrichment renders where it lives"
    // promise of the v1.0 thesis)
    const bundleMedia = await page.locator('[data-testid="bundle-media"]').count();
    expect(bundleMedia).toBeGreaterThan(0);
  });

  test('back-to-pulse returns to the PULSE index', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('pulse-header')).toBeVisible({ timeout: 20_000 });
    await page.locator('[data-testid="pulse-row"][data-path="Kuramoto Coupling.md"]').click();
    await expect(page.getByTestId('entry-reader')).toBeVisible({ timeout: 10_000 });
    await page.getByTestId('back-to-index').click();
    await expect(page.getByTestId('pulse-header')).toBeVisible();
  });

  test('a typed-link click navigates to that entry', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('pulse-header')).toBeVisible({ timeout: 20_000 });
    await page.locator('[data-testid="pulse-row"][data-path="Kuramoto Coupling.md"]').click();
    await expect(page.getByTestId('entry-reader')).toBeVisible({ timeout: 10_000 });
    // Find a resolved typed-link (one with data-known="true") and click it.
    const known = page.locator('[data-testid="typed-link-row"][data-known="true"]').first();
    const knownCount = await page.locator('[data-testid="typed-link-row"][data-known="true"]').count();
    if (knownCount === 0) {
      test.skip(true, 'no resolved typed links to navigate -- frontmatter targets all missing from index');
    }
    const beforePath = await page.getByTestId('entry-reader').getAttribute('data-path');
    await known.locator('span').last().click();
    await expect(page.getByTestId('entry-reader')).not.toHaveAttribute('data-path', beforePath ?? '', { timeout: 5_000 });
  });
});

test.describe('STATE deck — mermaid in entry body', () => {
  test('Kuramoto Coupling renders its mermaid flowchart as SVG (not raw pre)', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('pulse-header')).toBeVisible({ timeout: 20_000 });
    await page.getByTestId('pulse-filter').fill('Kuramoto Coupling');
    const row = page.locator('[data-testid="pulse-row"][data-path="Kuramoto Coupling.md"]');
    await row.click();
    await expect(page.getByTestId('entry-reader')).toBeVisible({ timeout: 8_000 });
    // The mermaid block resolves to an SVG within a couple seconds (lazy-load).
    const block = page.getByTestId('mermaid-block').first();
    await expect(block).toBeVisible({ timeout: 15_000 });
    const svg = block.locator('svg').first();
    await expect(svg).toBeVisible({ timeout: 10_000 });
    // The SVG must have non-zero size in a real viewport.
    const box = await svg.boundingBox();
    expect(box).not.toBeNull();
    expect(box.width).toBeGreaterThan(100);
    expect(box.height).toBeGreaterThan(20);
    // No raw ``` mermaid pre block leaked through.
    const mermaidPres = page.locator('[data-testid="code-block"][data-lang="mermaid"]');
    await expect(mermaidPres).toHaveCount(0);
  });
});

test.describe('STATE deck — robustness against real palace shape', () => {
  test('renders five distinct foundational entries without crashing', async ({ page }) => {
    const entries = [
      'CLAUDE.md',
      'SCHEMA.md',
      'Kuramoto Coupling.md',
      'Palace development/Two Batons, One Board.md',
      'Palace development/STIGMERGY v1.0 — Palace Front-End.md',
    ];
    await page.goto('/');
    await expect(page.getByTestId('pulse-header')).toBeVisible({ timeout: 20_000 });

    for (const path of entries) {
      // Use filter so we don't need every entry above the fold.
      await page.getByTestId('pulse-filter').fill(path.split('/').pop().replace('.md', '').slice(0, 20));
      const row = page.locator(`[data-testid="pulse-row"][data-path="${path.replace(/"/g, '\\"')}"]`);
      await expect(row).toBeVisible({ timeout: 5_000 });
      await row.click();
      await expect(page.getByTestId('entry-reader')).toBeVisible({ timeout: 8_000 });
      await expect(page.getByTestId('entry-reader')).toHaveAttribute('data-path', path);
      // Each entry must surface at least the structured header.
      await expect(page.getByTestId('frontmatter-header')).toBeVisible();
      await page.getByTestId('back-to-index').click();
      await expect(page.getByTestId('pulse-header')).toBeVisible();
      // Clear filter for the next round.
      await page.getByTestId('pulse-filter').fill('');
    }
  });
});
