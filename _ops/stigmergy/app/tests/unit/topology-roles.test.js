import { describe, it, expect } from 'vitest';
import {
  assignRoles, degreeThreshold, roleCounts,
} from '../../src/lib/topology-roles.js';

function mkNodes(degrees) {
  return degrees.map((d, i) => ({ id: `n${i}`, degree: d }));
}

describe('degreeThreshold', () => {
  it('returns the 95th-percentile degree when above the floor', () => {
    // 100 nodes with degrees 1..100 -- 95th percentile = 96
    const degrees = Array.from({ length: 100 }, (_, i) => i + 1);
    expect(degreeThreshold(degrees, 0.95)).toBe(96);
  });
  it('clamps to the hub floor of 8 when percentile is below it', () => {
    // 10 nodes, mostly low-degree; 95th-pct would be tiny but floor=8
    const degrees = [0, 0, 1, 1, 2, 2, 3, 3, 4, 5];
    expect(degreeThreshold(degrees)).toBe(8);
  });
  it('returns Infinity for empty / non-array input (no hubs)', () => {
    expect(degreeThreshold([])).toBe(Infinity);
    expect(degreeThreshold(null)).toBe(Infinity);
  });
});

describe('assignRoles', () => {
  it('marks degree-0 nodes as orphans', () => {
    const out = assignRoles(mkNodes([0, 1, 0, 5]));
    expect(out.map((n) => n.role)).toEqual(['orphan', 'default', 'orphan', 'default']);
  });
  it('marks high-degree nodes (>= 95th percentile, floor 8) as hubs', () => {
    // 20 nodes with one outlier degree 20; the rest are degree 1-5.
    const degrees = [1,2,3,4,5,1,2,3,4,5,1,2,3,4,5,1,2,3,4,20];
    const out = assignRoles(mkNodes(degrees));
    const hubs = out.filter((n) => n.role === 'hub');
    expect(hubs.length).toBe(1);
    expect(hubs[0].degree).toBe(20);
  });
  it('does NOT mark mid-degree nodes as hubs (floor of 8 applies)', () => {
    // 10 nodes all degree 5 -- nothing crosses the floor, no hubs.
    const out = assignRoles(mkNodes([5,5,5,5,5,5,5,5,5,5]));
    expect(out.every((n) => n.role === 'default')).toBe(true);
  });
  it('returns [] for non-array input', () => {
    expect(assignRoles(null)).toEqual([]);
  });
  it('preserves original node fields', () => {
    const [first] = assignRoles([{ id: 'X', path: 'X.md', degree: 0, type: 'concept' }]);
    expect(first).toMatchObject({ id: 'X', path: 'X.md', type: 'concept', role: 'orphan' });
  });
});

describe('roleCounts', () => {
  it('buckets nodes by role', () => {
    const nodes = [
      { role: 'hub' }, { role: 'hub' },
      { role: 'orphan' }, { role: 'orphan' }, { role: 'orphan' },
      { role: 'default' }, { role: 'default' },
    ];
    expect(roleCounts(nodes)).toEqual({ hub: 2, orphan: 3, default: 2 });
  });
  it('treats missing role as default', () => {
    expect(roleCounts([{}, {}])).toEqual({ hub: 0, orphan: 0, default: 2 });
  });
  it('returns zero counts for empty input', () => {
    expect(roleCounts([])).toEqual({ hub: 0, orphan: 0, default: 0 });
    expect(roleCounts(null)).toEqual({ hub: 0, orphan: 0, default: 0 });
  });
});
