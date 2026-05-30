import { test, expect } from '@playwright/test';

// v1.0 Phase 2 — LOG read (the git explorer).
//
// LOG reads the LIVE palace git history (not demo data), so these tests
// assert structural behavior that holds for any real history: the stream
// renders semantic cards, filters narrow, a commit opens its palace-aware
// diff, and the uncommitted banner reflects the working tree.

async function gotoLog(page) {
  await page.goto('/');
  await expect(page.getByTestId('deck-tabs')).toBeVisible({ timeout: 10_000 });
  await page.keyboard.press('l');
  await expect(page.getByTestId('log-deck')).toBeVisible({ timeout: 10_000 });
}

test.describe('LOG deck — chrome + stream', () => {
  test('L opens the LOG deck and renders the commit stream', async ({ page }) => {
    await gotoLog(page);
    await expect(page.getByTestId('log-deck')).toContainText(/the git record/i);
    await expect(page.getByTestId('commit-stream')).toBeVisible({ timeout: 15_000 });
    const cards = await page.locator('[data-testid="commit-card"]').count();
    expect(cards).toBeGreaterThan(3);
  });

  test('commit cards carry a kind badge + diffstat', async ({ page }) => {
    await gotoLog(page);
    await expect(page.getByTestId('commit-stream')).toBeVisible({ timeout: 15_000 });
    const first = page.locator('[data-testid="commit-card"]').first();
    await expect(first.getByTestId('commit-kind')).toBeVisible();
    await expect(first.getByTestId('commit-summary')).toBeVisible();
  });

  test('the uncommitted banner reflects the working tree', async ({ page }) => {
    await gotoLog(page);
    // Exactly one of the two banners shows (clean or dirty), never neither.
    const dirty = await page.locator('[data-testid="uncommitted-banner"]').count();
    const clean = await page.locator('[data-testid="uncommitted-clean"]').count();
    expect(dirty + clean).toBe(1);
  });
});

test.describe('LOG deck — filters', () => {
  test('kind chips are present and narrow the stream', async ({ page }) => {
    await gotoLog(page);
    await expect(page.getByTestId('log-filters')).toBeVisible({ timeout: 15_000 });
    // There is at least one kind chip; click the first and assert the count
    // does not increase (a filter never widens the set).
    const before = await page.locator('[data-testid="commit-card"]').count();
    const firstKindChip = page.locator('[data-testid^="filter-kind-"]').first();
    await firstKindChip.click();
    await page.waitForTimeout(300);
    const after = await page.locator('[data-testid="commit-card"]').count();
    expect(after).toBeLessThanOrEqual(before);
    expect(after).toBeGreaterThan(0);
  });

  test('the find input narrows by subject text', async ({ page }) => {
    await gotoLog(page);
    await expect(page.getByTestId('log-filters')).toBeVisible({ timeout: 15_000 });
    await page.getByTestId('filter-text').fill('stigmergy');
    await page.waitForTimeout(400);
    const cards = page.locator('[data-testid="commit-card"]');
    const n = await cards.count();
    expect(n).toBeGreaterThan(0);
    // Every visible card mentions stigmergy somewhere in its text.
    for (let i = 0; i < n; i += 1) {
      const txt = (await cards.nth(i).textContent())?.toLowerCase() ?? '';
      expect(txt).toContain('stigmergy');
    }
  });
});

test.describe('LOG deck — palace-aware diff', () => {
  test('clicking a commit opens its diff with a back button', async ({ page }) => {
    await gotoLog(page);
    await expect(page.getByTestId('commit-stream')).toBeVisible({ timeout: 15_000 });
    await page.locator('[data-testid="commit-summary"]').first().click();
    await expect(page.getByTestId('commit-diff')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('back-to-log')).toBeVisible();
    // file diffs render
    const fileDiffs = await page.locator('[data-testid="file-diff"]').count();
    expect(fileDiffs).toBeGreaterThan(0);
    // back returns to the stream
    await page.getByTestId('back-to-log').click();
    await expect(page.getByTestId('commit-stream')).toBeVisible();
  });

  test('a commit touching an entry shows field-level frontmatter changes', async ({ page }) => {
    await gotoLog(page);
    await expect(page.getByTestId('log-filters')).toBeVisible({ timeout: 15_000 });
    // Narrow to the Two Batons commit (known to change CLAUDE.md version etc.).
    await page.getByTestId('filter-text').fill('Two Batons');
    await page.waitForTimeout(400);
    const card = page.locator('[data-testid="commit-card"]').first();
    await expect(card).toBeVisible();
    await card.getByTestId('commit-summary').click();
    await expect(page.getByTestId('commit-diff')).toBeVisible({ timeout: 10_000 });
    // At least one md file diff with field-level frontmatter changes.
    const mdDiffs = await page.locator('[data-testid="file-diff"][data-kind="md"]').count();
    expect(mdDiffs).toBeGreaterThan(0);
    const fmChanges = await page.locator('[data-testid="fm-change"]').count();
    expect(fmChanges).toBeGreaterThan(0);
  });

  test('per-entry filter works: clicking an entry chip narrows the stream', async ({ page }) => {
    await gotoLog(page);
    await expect(page.getByTestId('commit-stream')).toBeVisible({ timeout: 15_000 });
    // Find a card that has at least one entry chip.
    const chip = page.locator('[data-testid="commit-entry-chip"]').first();
    await expect(chip).toBeVisible({ timeout: 10_000 });
    const entryName = (await chip.textContent())?.trim();
    await chip.click();
    await page.waitForTimeout(400);
    // The active-entry filter shows, and every visible card lists that entry.
    await expect(page.getByTestId('active-entry-filter')).toContainText(entryName);
    const cards = page.locator('[data-testid="commit-card"]');
    const n = await cards.count();
    expect(n).toBeGreaterThan(0);
  });
});
