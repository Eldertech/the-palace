import { describe, it, expect } from 'vitest';
import {
  groupOf, groupAnchors, buildGroupColors, groupSummary, groupCounts,
  pillarCornerPoints, pillarBarycenter, groupCentroids, isBarycentric,
  GROUPINGS, DEFAULT_DIMENSION, DEFAULT_STRENGTH, DEFAULT_SPACING,
} from '../../src/lib/topology-groups.js';

describe('groupOf — folder (default dimension)', () => {
  it('groups by known top-level folder', () => {
    expect(groupOf({ path: 'Shop/Kokoro.md', type: 'specialist' })).toBe('shop');
    expect(groupOf({ path: 'Projects/BLUELINE.md', type: 'project' })).toBe('projects');
    expect(groupOf({ path: 'People/Spinoza.md', type: 'person' })).toBe('people');
    expect(groupOf({ path: 'Palace development/STIGMERGY.md', type: 'meta' })).toBe('palace-dev');
  });
  it('routes root-level entries by type into the same neighborhoods', () => {
    expect(groupOf({ path: '1 from 2.md', type: 'project' })).toBe('projects');
    expect(groupOf({ path: 'Manim.md', type: 'specialist' })).toBe('shop');
    expect(groupOf({ path: 'SCHEMA.md', type: 'meta' })).toBe('palace-dev');
    expect(groupOf({ path: 'Someone.md', type: 'person' })).toBe('people');
  });
  it('collapses the conceptual tail into the connective "ideas" core', () => {
    for (const type of ['concept', 'breakthrough', 'practice', 'source', 'question', 'spore']) {
      expect(groupOf({ path: 'X.md', type })).toBe('ideas');
    }
  });
  it('keeps hubs as their own group and defaults unknowns to "ideas"', () => {
    expect(groupOf({ path: 'Cooperation.md', type: 'hub' })).toBe('hub');
    expect(groupOf({ path: 'X.md' })).toBe('ideas');
    expect(groupOf(null)).toBe('ideas');
  });
});

describe('groupOf — other dimensions', () => {
  it('groups by type', () => {
    expect(groupOf({ type: 'concept' }, 'type')).toBe('concept');
    expect(groupOf({ type: 'specialist' }, 'type')).toBe('specialist');
    expect(groupOf({}, 'type')).toBe('(untyped)');
  });
  it('groups by stage', () => {
    expect(groupOf({ stage: 'seed' }, 'stage')).toBe('seed');
    expect(groupOf({ stage: 'fruiting' }, 'stage')).toBe('fruiting');
    expect(groupOf({}, 'stage')).toBe('(no stage)');
  });
  it('groups by role', () => {
    expect(groupOf({ role: 'hub' }, 'role')).toBe('hub');
    expect(groupOf({ role: 'orphan' }, 'role')).toBe('orphan');
    expect(groupOf({}, 'role')).toBe('default');
  });
  it('groups by primary (first-listed) pillar, accepting Set or array', () => {
    expect(groupOf({ pillars: new Set(['tools']) }, 'pillar')).toBe('tools');
    expect(groupOf({ pillars: ['creation'] }, 'pillar')).toBe('creation');
    // multi-pillar node → its primary (first) pillar, not a "multi" bucket
    expect(groupOf({ pillars: new Set(['tools', 'philosophy']) }, 'pillar')).toBe('tools');
    expect(groupOf({ pillars: new Set() }, 'pillar')).toBe('(none)');
    expect(groupOf({}, 'pillar')).toBe('(none)');
  });
  it('unknown dimension falls back to the default (folder)', () => {
    expect(groupOf({ path: 'Shop/X.md', type: 'specialist' }, 'bogus')).toBe('shop');
  });
});

describe('groupAnchors', () => {
  it('anchors the connective core (ideas / hub) at the center for folder', () => {
    const anchors = groupAnchors(['ideas', 'hub', 'shop'], 1000, 800, 'folder');
    expect(anchors.get('ideas')).toEqual({ x: 500, y: 400 });
    expect(anchors.get('hub')).toEqual({ x: 500, y: 400 });
  });
  it('spreads folder neighborhoods off-center on a ring', () => {
    const anchors = groupAnchors(['shop', 'projects', 'people'], 1000, 800, 'folder');
    for (const g of ['shop', 'projects', 'people']) {
      const a = anchors.get(g);
      expect(Math.hypot(a.x - 500, a.y - 400)).toBeGreaterThan(100);
    }
  });
  it('is deterministic for a given group set regardless of input order', () => {
    const a1 = groupAnchors(['people', 'shop', 'projects'], 1000, 800, 'folder');
    const a2 = groupAnchors(['shop', 'projects', 'people'], 1000, 800, 'folder');
    expect(a1.get('shop')).toEqual(a2.get('shop'));
  });
  it('puts every stage on the ring (no center) — a lifecycle clock', () => {
    const anchors = groupAnchors(['seed', 'mature', 'composting'], 1000, 800, 'stage');
    for (const g of ['seed', 'mature', 'composting']) {
      const a = anchors.get(g);
      expect(Math.hypot(a.x - 500, a.y - 400)).toBeGreaterThan(100);
    }
    // seed anchors at the top (−90°): x≈center, y clearly above center.
    expect(Math.abs(anchors.get('seed').x - 500)).toBeLessThan(1);
    expect(anchors.get('seed').y).toBeLessThan(400);
  });
  it('fans the four pillars around the ring (no forced center)', () => {
    const anchors = groupAnchors(['creation', 'tools', 'philosophy', 'practice'], 1000, 800, 'pillar');
    for (const g of ['creation', 'tools', 'philosophy', 'practice']) {
      const a = anchors.get(g);
      expect(Math.hypot(a.x - 500, a.y - 400)).toBeGreaterThan(100);
    }
  });
});

describe('buildGroupColors', () => {
  it('assigns a stable color per group in canonical order', () => {
    const c1 = buildGroupColors(['people', 'shop', 'projects'], 'folder');
    const c2 = buildGroupColors(['shop', 'projects', 'people'], 'folder');
    expect(c1.get('shop')).toBe(c2.get('shop'));
  });
  it('gives placeholder groups a muted gray', () => {
    const c = buildGroupColors(['seed', '(no stage)'], 'stage');
    expect(c.get('(no stage)')).toBe('#6f7f72');
    expect(c.get('seed')).not.toBe('#6f7f72');
  });
});

describe('groupSummary', () => {
  it('returns {group, count, color} in canonical order', () => {
    const nodes = [
      { path: 'Shop/A.md', type: 'specialist' },
      { path: 'Shop/B.md', type: 'specialist' },
      { path: 'Projects/C.md', type: 'project' },
    ];
    const s = groupSummary(nodes, 'folder');
    const shop = s.find((x) => x.group === 'shop');
    expect(shop.count).toBe(2);
    expect(shop.color).toBeTruthy();
    // canonical order puts projects before... shop? order is ideas,hub,shop,projects
    expect(s.map((x) => x.group)).toEqual(['shop', 'projects']);
  });
});

describe('groupCounts', () => {
  it('buckets nodes by group along a dimension', () => {
    const nodes = [{ type: 'concept' }, { type: 'concept' }, { type: 'hub' }];
    expect(groupCounts(nodes, 'type')).toEqual({ concept: 2, hub: 1 });
  });
  it('returns {} for empty input', () => {
    expect(groupCounts([])).toEqual({});
    expect(groupCounts(null)).toEqual({});
  });
});

describe('registry exports', () => {
  it('exposes the grouping dimensions and sane defaults', () => {
    expect(GROUPINGS.map((g) => g.id)).toEqual(['folder', 'type', 'stage', 'pillar', 'role']);
    expect(DEFAULT_DIMENSION).toBe('folder');
    expect(DEFAULT_STRENGTH).toBeGreaterThan(0);
    expect(DEFAULT_SPACING).toBeGreaterThan(0);
  });
});

describe('barycentric pillar placement', () => {
  it('marks only the pillar dimension as barycentric', () => {
    expect(isBarycentric('pillar')).toBe(true);
    expect(isBarycentric('folder')).toBe(false);
    expect(isBarycentric('stage')).toBe(false);
  });
  it('pins the four pillars to the four window corners', () => {
    const c = pillarCornerPoints(1000, 800);
    expect(c.get('creation').x).toBeLessThan(500);   // left
    expect(c.get('creation').y).toBeLessThan(400);    // top
    expect(c.get('tools').x).toBeGreaterThan(500);    // right
    expect(c.get('tools').y).toBeLessThan(400);        // top
    expect(c.get('philosophy').x).toBeLessThan(500);   // left
    expect(c.get('philosophy').y).toBeGreaterThan(400); // bottom
    expect(c.get('practice').x).toBeGreaterThan(500);  // right
    expect(c.get('practice').y).toBeGreaterThan(400);   // bottom
  });
  it('places a single-pillar node in that pillar corner', () => {
    const c = pillarCornerPoints(1000, 800);
    expect(pillarBarycenter(new Set(['creation']), 1000, 800)).toEqual(c.get('creation'));
  });
  it('places an all-four-pillar node dead center', () => {
    const b = pillarBarycenter(new Set(['creation', 'tools', 'philosophy', 'practice']), 1000, 800);
    expect(b.x).toBeCloseTo(500, 5);
    expect(b.y).toBeCloseTo(400, 5);
  });
  it('places a two-pillar node on the midpoint between their corners', () => {
    // creation (top-left) + tools (top-right) → top edge center
    const b = pillarBarycenter(['creation', 'tools'], 1000, 800);
    expect(b.x).toBeCloseTo(500, 5);
    expect(b.y).toBeLessThan(400);
  });
  it('places a pillar-less node at window center (neutral)', () => {
    expect(pillarBarycenter(new Set(), 1000, 800)).toEqual({ x: 500, y: 400 });
    expect(pillarBarycenter(null, 1000, 800)).toEqual({ x: 500, y: 400 });
  });
});

describe('groupCentroids', () => {
  it('averages positioned nodes per group, carrying mass (count)', () => {
    const nodes = [
      { group: 'a', x: 0, y: 0 }, { group: 'a', x: 10, y: 20 },
      { group: 'b', x: 100, y: 100 },
    ];
    const cen = groupCentroids(nodes);
    expect(cen.get('a')).toEqual({ x: 5, y: 10, count: 2 });
    expect(cen.get('b')).toEqual({ x: 100, y: 100, count: 1 });
  });
  it('skips nodes without positions', () => {
    const cen = groupCentroids([{ group: 'a', x: 4, y: 4 }, { group: 'a' }]);
    expect(cen.get('a')).toEqual({ x: 4, y: 4, count: 1 });
  });
});
