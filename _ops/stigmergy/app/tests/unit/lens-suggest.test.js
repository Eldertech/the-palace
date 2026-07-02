import { describe, test, expect } from 'vitest';
import { rankLensCandidates } from '../../src/lib/lens-suggest.js';

// rankLensCandidates ranks candidate GLASS pages for a lensing subject by
// BFS distance over the undirected typed-link graph — [[The Lens]]'s own
// "lean on the graph to suggest" design, made concrete.

function map(edges, extraNodes = []) {
  const nodeIds = new Set(extraNodes);
  for (const [a, b] of edges) { nodeIds.add(a); nodeIds.add(b); }
  return {
    nodes: Array.from(nodeIds, (id) => ({ id })),
    edges: edges.map(([source, target]) => ({ source, target, type: 'connects-to' })),
  };
}

describe('rankLensCandidates', () => {
  test('a directly-linked neighbor ranks before a two-hop one', () => {
    const m = map([
      ['Subject', 'Neighbor'],
      ['Neighbor', 'TwoHop'],
    ]);
    const ranked = rankLensCandidates(m, 'Subject', 10);
    expect(ranked.map((r) => r.title)).toEqual(['Neighbor', 'TwoHop']);
    expect(ranked[0].distance).toBe(1);
    expect(ranked[1].distance).toBe(2);
  });

  test('an edge counts regardless of which side is source vs target', () => {
    const m = map([['Neighbor', 'Subject']]); // Subject is the TARGET here
    const ranked = rankLensCandidates(m, 'Subject', 10);
    expect(ranked).toEqual([{ title: 'Neighbor', distance: 1 }]);
  });

  test('unreachable nodes sort last, not excluded', () => {
    const m = map([['Subject', 'Neighbor']], ['Islanded']);
    const ranked = rankLensCandidates(m, 'Subject', 10);
    expect(ranked.map((r) => r.title)).toEqual(['Neighbor', 'Islanded']);
    expect(ranked[1].distance).toBe(Infinity);
  });

  test('the subject itself never appears in its own candidate list', () => {
    const m = map([['Subject', 'Neighbor']]);
    const ranked = rankLensCandidates(m, 'Subject', 10);
    expect(ranked.some((r) => r.title === 'Subject')).toBe(false);
  });

  test('respects the limit, keeping the nearest candidates', () => {
    const m = map([
      ['Subject', 'A'], ['Subject', 'B'], ['Subject', 'C'],
    ]);
    const ranked = rankLensCandidates(m, 'Subject', 2);
    expect(ranked).toHaveLength(2);
  });

  test('ties break alphabetically for a stable, predictable order', () => {
    const m = map([['Subject', 'Zeta'], ['Subject', 'Alpha']]);
    const ranked = rankLensCandidates(m, 'Subject', 10);
    expect(ranked.map((r) => r.title)).toEqual(['Alpha', 'Zeta']);
  });

  test('an unknown subject (not in the map) returns everyone as unreachable, alphabetical', () => {
    const m = map([['A', 'B']]);
    const ranked = rankLensCandidates(m, 'Ghost', 10);
    expect(ranked.map((r) => r.title)).toEqual(['A', 'B']);
    expect(ranked.every((r) => r.distance === Infinity)).toBe(true);
  });

  test('an empty map returns no candidates', () => {
    expect(rankLensCandidates({ nodes: [], edges: [] }, 'Subject')).toEqual([]);
  });

  test('a missing subjectTitle returns no candidates', () => {
    const m = map([['A', 'B']]);
    expect(rankLensCandidates(m, '')).toEqual([]);
  });
});
