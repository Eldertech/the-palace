import { describe, it, expect } from 'vitest';
import {
  buildPillarsByPath, isCrossPillar, annotateBridges, bridgeCounts,
} from '../../src/lib/topology-bridges.js';

describe('buildPillarsByPath', () => {
  it('normalizes known pillars to lowercase Sets keyed by path', () => {
    const m = buildPillarsByPath([
      { path: 'A.md', pillars: ['Creation', 'tools'] },
      { path: 'B.md', pillars: ['Philosophy'] },
    ]);
    expect(m.get('A.md')).toBeInstanceOf(Set);
    expect([...m.get('A.md')].sort()).toEqual(['creation', 'tools']);
    expect([...m.get('B.md')]).toEqual(['philosophy']);
  });
  it('drops unknown / mistyped pillars', () => {
    const m = buildPillarsByPath([{ path: 'X.md', pillars: ['creation', 'finance', 42] }]);
    expect([...m.get('X.md')]).toEqual(['creation']);
  });
  it('missing/empty pillars become an empty Set', () => {
    const m = buildPillarsByPath([
      { path: 'A.md' },
      { path: 'B.md', pillars: null },
      { path: 'C.md', pillars: [] },
    ]);
    expect(m.get('A.md').size).toBe(0);
    expect(m.get('B.md').size).toBe(0);
    expect(m.get('C.md').size).toBe(0);
  });
  it('returns empty Map for non-array input', () => {
    expect(buildPillarsByPath(null).size).toBe(0);
  });
});

describe('isCrossPillar', () => {
  it('true when both have pillars and sets are disjoint', () => {
    expect(isCrossPillar(new Set(['creation']), new Set(['tools']))).toBe(true);
  });
  it('false when sets overlap', () => {
    expect(isCrossPillar(new Set(['creation', 'tools']), new Set(['tools']))).toBe(false);
  });
  it('false when either side is empty (question does not apply)', () => {
    expect(isCrossPillar(new Set(), new Set(['tools']))).toBe(false);
    expect(isCrossPillar(new Set(['creation']), new Set())).toBe(false);
  });
  it('false for non-Set input', () => {
    expect(isCrossPillar(null, new Set(['a']))).toBe(false);
    expect(isCrossPillar(['creation'], new Set(['tools']))).toBe(false);
  });
});

describe('annotateBridges', () => {
  const graph = {
    nodes: [
      { id: 'A', path: 'A.md' },
      { id: 'B', path: 'B.md' },
      { id: 'C', path: 'C.md' },
      { id: 'O', path: 'O.md' },
    ],
    links: [
      { source: 'A', target: 'B' }, // creation -> tools => bridge
      { source: 'B', target: 'C' }, // tools -> tools => not bridge
      { source: 'A', target: 'O' }, // creation -> () => not bridge
      { source: 'C', target: 'A' }, // tools -> creation => bridge
    ],
  };
  const pillars = buildPillarsByPath([
    { path: 'A.md', pillars: ['creation'] },
    { path: 'B.md', pillars: ['tools'] },
    { path: 'C.md', pillars: ['tools'] },
    { path: 'O.md', pillars: [] },
  ]);

  it('marks disjoint-pillar links as bridges, others as not', () => {
    const out = annotateBridges(graph, pillars);
    expect(out.links.map((l) => l.crossPillar)).toEqual([true, false, false, true]);
  });
  it('attaches a pillars Set to each node', () => {
    const out = annotateBridges(graph, pillars);
    expect([...out.nodes[0].pillars]).toEqual(['creation']);
    expect(out.nodes[3].pillars.size).toBe(0);
  });
  it('survives links whose endpoints are unknown to the catalog', () => {
    const out = annotateBridges({
      nodes: [{ id: 'A', path: 'A.md' }],
      links: [{ source: 'A', target: 'ghost' }],
    }, pillars);
    expect(out.links[0].crossPillar).toBe(false);
  });
  it('returns empty for malformed input', () => {
    expect(annotateBridges(null, pillars)).toEqual({ nodes: [], links: [] });
    expect(annotateBridges({ nodes: [] }, pillars)).toEqual({ nodes: [], links: [] });
  });
});

describe('bridgeCounts', () => {
  it('counts total and cross-pillar links', () => {
    const out = bridgeCounts([
      { crossPillar: true }, { crossPillar: false }, { crossPillar: true },
    ]);
    expect(out).toEqual({ total: 3, cross: 2 });
  });
  it('handles null / undefined', () => {
    expect(bridgeCounts(null)).toEqual({ total: 0, cross: 0 });
    expect(bridgeCounts([])).toEqual({ total: 0, cross: 0 });
  });
});
