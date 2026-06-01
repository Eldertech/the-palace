import { describe, it, expect } from 'vitest';
import { sortEntries, DEFAULT_DIR, SORT_KEYS } from '../../src/lib/entry-sort.js';

const SAMPLE = [
  { title: 'Beta',   type: 'concept', stage: 'mature',   last_activated: '2026-04', pulse: 0.40 },
  { title: 'Alpha',  type: 'hub',     stage: 'fruiting', last_activated: '2026-05', pulse: 0.92 },
  { title: 'Gamma',  type: 'project', stage: 'sprout',   last_activated: '2026-03', pulse: 0.55 },
  { title: 'Delta',  type: 'concept', stage: 'dormant',  last_activated: '2024-01', pulse: 0.10 },
  { title: 'Echo',   type: null,      stage: null,       last_activated: null,      pulse: 0.05 },
];

describe('sortEntries — pulse', () => {
  it('desc puts highest pulse first', () => {
    const out = sortEntries(SAMPLE, { key: 'pulse', dir: 'desc' });
    expect(out.map((e) => e.title)).toEqual(['Alpha', 'Gamma', 'Beta', 'Delta', 'Echo']);
  });
  it('asc reverses', () => {
    const out = sortEntries(SAMPLE, { key: 'pulse', dir: 'asc' });
    expect(out.map((e) => e.title)).toEqual(['Echo', 'Delta', 'Beta', 'Gamma', 'Alpha']);
  });
});

describe('sortEntries — title', () => {
  it('asc is alphabetical', () => {
    const out = sortEntries(SAMPLE, { key: 'title', dir: 'asc' });
    expect(out.map((e) => e.title)).toEqual(['Alpha', 'Beta', 'Delta', 'Echo', 'Gamma']);
  });
  it('desc is reverse-alphabetical', () => {
    const out = sortEntries(SAMPLE, { key: 'title', dir: 'desc' });
    expect(out.map((e) => e.title)).toEqual(['Gamma', 'Echo', 'Delta', 'Beta', 'Alpha']);
  });
});

describe('sortEntries — type', () => {
  it('asc groups by type alphabetically, missing sinks', () => {
    const out = sortEntries(SAMPLE, { key: 'type', dir: 'asc' });
    // concept, concept, hub, project, (null sinks)
    expect(out[0].type).toBe('concept');
    expect(out[1].type).toBe('concept');
    expect(out[2].type).toBe('hub');
    expect(out[3].type).toBe('project');
    expect(out[4].title).toBe('Echo'); // null type sinks
  });
  it('desc inverts non-missing order; missing still sinks', () => {
    const out = sortEntries(SAMPLE, { key: 'type', dir: 'desc' });
    expect(out[0].type).toBe('project');
    expect(out[1].type).toBe('hub');
    expect(out[2].type).toBe('concept');
    expect(out[3].type).toBe('concept');
    expect(out[4].title).toBe('Echo');
  });
  it('within-type tie-break is alphabetical by title', () => {
    const out = sortEntries(SAMPLE, { key: 'type', dir: 'asc' });
    expect(out[0].title).toBe('Beta');
    expect(out[1].title).toBe('Delta');
  });
});

describe('sortEntries — stage', () => {
  it('desc surfaces most-alive stages first (fruiting → dormant)', () => {
    const out = sortEntries(SAMPLE, { key: 'stage', dir: 'desc' });
    expect(out[0].stage).toBe('fruiting');
    expect(out[1].stage).toBe('sprout');
    expect(out[2].stage).toBe('mature');
    expect(out[3].stage).toBe('dormant');
    expect(out[4].title).toBe('Echo'); // null stage sinks
  });
  it('asc inverts (dormant first, missing sinks)', () => {
    const out = sortEntries(SAMPLE, { key: 'stage', dir: 'asc' });
    expect(out[0].stage).toBe('dormant');
    expect(out[3].stage).toBe('fruiting');
    expect(out[4].title).toBe('Echo');
  });
});

describe('sortEntries — activity', () => {
  it('desc is newest-first; missing sinks', () => {
    const out = sortEntries(SAMPLE, { key: 'activity', dir: 'desc' });
    expect(out[0].title).toBe('Alpha');  // 2026-05
    expect(out[1].title).toBe('Beta');   // 2026-04
    expect(out[2].title).toBe('Gamma');  // 2026-03
    expect(out[3].title).toBe('Delta');  // 2024-01
    expect(out[4].title).toBe('Echo');   // null sinks
  });
  it('asc is oldest-first; missing still sinks', () => {
    const out = sortEntries(SAMPLE, { key: 'activity', dir: 'asc' });
    expect(out[0].title).toBe('Delta');
    expect(out[1].title).toBe('Gamma');
    expect(out[2].title).toBe('Beta');
    expect(out[3].title).toBe('Alpha');
    expect(out[4].title).toBe('Echo');
  });
  it('falls back to `born` when last_activated is missing', () => {
    const out = sortEntries([
      { title: 'A', last_activated: '2026-05', pulse: 0 },
      { title: 'B', born: '2026-06', pulse: 0 },
    ], { key: 'activity', dir: 'desc' });
    expect(out[0].title).toBe('B');
  });
});

describe('sortEntries — edge cases', () => {
  it('non-array returns []', () => {
    expect(sortEntries(null)).toEqual([]);
    expect(sortEntries(undefined)).toEqual([]);
  });
  it('unknown key falls back to pulse', () => {
    const out = sortEntries(SAMPLE, { key: 'not-a-key', dir: 'desc' });
    expect(out[0].title).toBe('Alpha');
  });
  it('default args sort by pulse desc', () => {
    const out = sortEntries(SAMPLE);
    expect(out[0].title).toBe('Alpha');
  });
  it('SORT_KEYS lists every supported column', () => {
    expect(SORT_KEYS).toEqual(['pulse', 'type', 'title', 'stage', 'activity']);
  });
  it('DEFAULT_DIR has an entry per key', () => {
    for (const k of SORT_KEYS) {
      expect(DEFAULT_DIR[k]).toMatch(/^(asc|desc)$/);
    }
  });
});
