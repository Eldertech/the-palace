import { test, expect } from '@playwright/test';

// v1.0 Phase 5.5 — Topology Lens.
//
// STATE has two lenses: PULSE (the ranked list) and TOPOLOGY (the
// force-directed typed-link graph). The graph is fed by the freshest
// palace-map-full-*.json in _ops/maps/. Gate-18 minimum bar: nodes +
// edges + click-to-open-in-STATE. Hubs / orphans / cross-pillar bridges /
// unsung paths are reserved for follow-up commits.

test.describe('STATE deck — Topology Lens (Phase 5.5)', () => {
  test('lens toggle is visible and PULSE is the default', async ({ page }) => {
    await page.goto('/?deck=STATE');
    await expect(page.getByTestId('state-lens-toggle')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('state-lens-pulse')).toHaveAttribute('data-active', '1');
    await expect(page.getByTestId('state-lens-topology')).toHaveAttribute('data-active', '0');
  });

  test('clicking [T] TOPOLOGY mounts the canvas and announces nodes+edges', async ({ page }) => {
    await page.goto('/?deck=STATE');
    await expect(page.getByTestId('state-lens-toggle')).toBeVisible({ timeout: 10_000 });
    await page.getByTestId('state-lens-topology').click();
    await expect(page.getByTestId('state-lens-topology')).toHaveAttribute('data-active', '1');
    await expect(page.getByTestId('topology-canvas')).toBeVisible({ timeout: 15_000 });
    // The Box title carries the node/edge counts from the freshest map.
    const heading = page.getByText(/TOPOLOGY\s+--\s+typed-link graph\s+\(\d+ nodes, \d+ edges/);
    await expect(heading).toBeVisible();
  });

  test('the legend reports hub / connected / orphan counts', async ({ page }) => {
    await page.goto('/?deck=STATE');
    await page.getByTestId('state-lens-topology').click();
    const legend = page.getByTestId('topology-legend');
    await expect(legend).toBeVisible({ timeout: 15_000 });
    await expect(legend).toContainText(/\d+\s+hubs/);
    await expect(legend).toContainText(/\d+\s+connected/);
    await expect(legend).toContainText(/\d+\s+orphans/);
  });

  test('hovering a node surfaces a tooltip with its id and degree', async ({ page }) => {
    await page.goto('/?deck=STATE');
    await page.getByTestId('state-lens-topology').click();
    await page.getByTestId('topology-canvas').waitFor({ timeout: 15_000 });
    // Let the sim settle so nodes are inside the canvas frame.
    await page.waitForTimeout(2500);
    const found = await page.evaluate(async () => {
      const canvas = document.querySelector('[data-testid="topology-canvas"]');
      const r = canvas.getBoundingClientRect();
      for (let dx = -200; dx <= 200; dx += 5) {
        for (let dy = -150; dy <= 150; dy += 5) {
          const cx = r.left + r.width/2 + dx;
          const cy = r.top + r.height/2 + dy;
          canvas.dispatchEvent(new MouseEvent('mousemove', { clientX: cx, clientY: cy, bubbles: true }));
          await new Promise((res) => setTimeout(res, 0));
          if (document.querySelector('[data-testid="topology-hover"]')) return true;
        }
      }
      return false;
    });
    expect(found).toBe(true);
    await expect(page.getByTestId('topology-hover')).toContainText(/degree \d+/);
  });

  test('clicking a node opens that entry in STATE (entry reader mounts)', async ({ page }) => {
    await page.goto('/?deck=STATE');
    await page.getByTestId('state-lens-topology').click();
    await page.getByTestId('topology-canvas').waitFor({ timeout: 15_000 });
    await page.waitForTimeout(2500);
    const clicked = await page.evaluate(async () => {
      const canvas = document.querySelector('[data-testid="topology-canvas"]');
      const r = canvas.getBoundingClientRect();
      for (let dx = -200; dx <= 200; dx += 5) {
        for (let dy = -150; dy <= 150; dy += 5) {
          const cx = r.left + r.width/2 + dx;
          const cy = r.top + r.height/2 + dy;
          canvas.dispatchEvent(new MouseEvent('mousemove', { clientX: cx, clientY: cy, bubbles: true }));
          await new Promise((res) => setTimeout(res, 0));
          if (document.querySelector('[data-testid="topology-hover"]')) {
            canvas.dispatchEvent(new MouseEvent('click', { clientX: cx, clientY: cy, bubbles: true }));
            return true;
          }
        }
      }
      return false;
    });
    expect(clicked).toBe(true);
    await expect(page.getByTestId('entry-reader')).toBeVisible({ timeout: 10_000 });
    // URL nav was driven by the click: ?entry= is now set.
    expect(page.url()).toMatch(/[?&]entry=/);
  });
});

test.describe('STATE deck — Topology API', () => {
  test('GET /api/topology returns the freshest palace-map-full-*.json', async ({ request }) => {
    const res = await request.get('/api/topology');
    expect(res.ok()).toBe(true);
    const data = await res.json();
    expect(data.source).toMatch(/^_ops\/maps\/palace-map-full-\d{4}-\d{2}-\d{2}\.json$/);
    expect(Array.isArray(data.nodes)).toBe(true);
    expect(Array.isArray(data.edges)).toBe(true);
    expect(data.nodes.length).toBeGreaterThan(50);
    expect(data.edges.length).toBeGreaterThan(50);
  });
});
