import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { listFullMaps, readLatestMap } from '../../src/lib/topology.js';

let root;
let mapsDir;

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), 'palace-topology-'));
  mapsDir = resolve(root, '_ops/maps');
  mkdirSync(mapsDir, { recursive: true });
  // Three full-map snapshots; the freshest by date should win.
  writeFileSync(resolve(mapsDir, 'palace-map-full-2026-03-27.json'), JSON.stringify({
    meta: { generated: '2026-03-27', node_count: 2, edge_count: 1 },
    nodes: [{ id: 'A' }, { id: 'B' }],
    edges: [{ source: 'A', target: 'B', type: 'connects-to' }],
  }));
  writeFileSync(resolve(mapsDir, 'palace-map-full-2026-05-14.json'), JSON.stringify({
    meta: { generated: '2026-05-14', node_count: 3, edge_count: 2 },
    nodes: [{ id: 'X' }, { id: 'Y' }, { id: 'Z' }],
    edges: [
      { source: 'X', target: 'Y', type: 'connects-to' },
      { source: 'Y', target: 'Z', type: 'mirrors' },
    ],
  }));
  writeFileSync(resolve(mapsDir, 'palace-map-full-2026-04-07.json'), JSON.stringify({
    meta: { generated: '2026-04-07', node_count: 1 },
    nodes: [{ id: 'M' }],
    edges: [],
  }));
  // Should be ignored — wrong filename shape.
  writeFileSync(resolve(mapsDir, 'palace-map-2026-03-27.html'), 'noise');
  writeFileSync(resolve(mapsDir, 'palace-map-full-2026-05-14.tsv'), 'noise');
});

afterAll(() => {
  try { rmSync(root, { recursive: true, force: true }); } catch (_) {}
});

describe('listFullMaps', () => {
  it('returns the dated full-map JSON files newest first', () => {
    const out = listFullMaps(root);
    expect(out.map((m) => m.date)).toEqual(['2026-05-14', '2026-04-07', '2026-03-27']);
  });
  it('returns [] when the maps directory is missing', () => {
    const empty = mkdtempSync(join(tmpdir(), 'palace-empty-'));
    try {
      expect(listFullMaps(empty)).toEqual([]);
    } finally {
      rmSync(empty, { recursive: true, force: true });
    }
  });
});

describe('readLatestMap', () => {
  it('returns the freshest map with nodes + edges + source path', () => {
    const out = readLatestMap(root);
    expect(out).not.toBeNull();
    expect(out.source).toBe('_ops/maps/palace-map-full-2026-05-14.json');
    expect(out.meta.generated).toBe('2026-05-14');
    expect(out.nodes.map((n) => n.id)).toEqual(['X', 'Y', 'Z']);
    expect(out.edges.length).toBe(2);
  });
  it('returns null when no maps exist', () => {
    const empty = mkdtempSync(join(tmpdir(), 'palace-empty-'));
    try {
      expect(readLatestMap(empty)).toBeNull();
    } finally {
      rmSync(empty, { recursive: true, force: true });
    }
  });
  it('returns null when the freshest map is unparseable', () => {
    const broken = mkdtempSync(join(tmpdir(), 'palace-broken-'));
    mkdirSync(resolve(broken, '_ops/maps'), { recursive: true });
    writeFileSync(resolve(broken, '_ops/maps/palace-map-full-2026-05-14.json'), '{ not valid json');
    try {
      expect(readLatestMap(broken)).toBeNull();
    } finally {
      rmSync(broken, { recursive: true, force: true });
    }
  });
  it('tolerates a map without nodes/edges arrays (returns empty arrays)', () => {
    const partial = mkdtempSync(join(tmpdir(), 'palace-partial-'));
    mkdirSync(resolve(partial, '_ops/maps'), { recursive: true });
    writeFileSync(resolve(partial, '_ops/maps/palace-map-full-2026-05-14.json'), JSON.stringify({
      meta: { generated: '2026-05-14' },
    }));
    try {
      const out = readLatestMap(partial);
      expect(out).not.toBeNull();
      expect(out.nodes).toEqual([]);
      expect(out.edges).toEqual([]);
    } finally {
      rmSync(partial, { recursive: true, force: true });
    }
  });
});
