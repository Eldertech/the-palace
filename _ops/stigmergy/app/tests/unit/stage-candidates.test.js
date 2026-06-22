// Unit: stageAdvancement + findStageCandidates — the mechanical §2-band
// pre-filter for the stage-transition audit.

import { describe, test, expect } from 'vitest';
import { stageAdvancement, findStageCandidates } from '../../src/lib/stage-candidates.js';

// listEntries-style summary: body_size in CHARS, link_count, stage, type.
const e = (path, stage, body_size, link_count, extra = {}) => ({
  path, title: path.replace(/\.md$/, ''), type: 'concept', stage, body_size, link_count, ...extra,
});

describe('stageAdvancement', () => {
  test('seed -> sprout needs BOTH >=900 chars AND >=1 link', () => {
    expect(stageAdvancement(e('A.md', 'seed', 1000, 1))).toMatchObject({ from: 'seed', to: 'sprout' });
    expect(stageAdvancement(e('A.md', 'seed', 1000, 0))).toBeNull(); // no link
    expect(stageAdvancement(e('A.md', 'seed', 500, 3))).toBeNull();  // too short
  });
  test('sprout -> growing needs >=2400 chars AND >=3 links', () => {
    expect(stageAdvancement(e('A.md', 'sprout', 3000, 3))).toMatchObject({ from: 'sprout', to: 'growing' });
    expect(stageAdvancement(e('A.md', 'sprout', 3000, 2))).toBeNull(); // not enough links
  });
  test('growing -> mature needs >=4800 chars AND >=3 links', () => {
    expect(stageAdvancement(e('A.md', 'growing', 5000, 3))).toMatchObject({ from: 'growing', to: 'mature' });
    expect(stageAdvancement(e('A.md', 'growing', 4000, 9))).toBeNull(); // not enough body
  });
  test('mature / fruiting / dormant / composting / foundational are never advanced (judgement calls)', () => {
    for (const s of ['mature', 'fruiting', 'dormant', 'composting', 'foundational']) {
      expect(stageAdvancement(e('A.md', s, 99999, 99))).toBeNull();
    }
  });
});

describe('findStageCandidates', () => {
  test('returns over-band entries only, ranked most-overgrown first', () => {
    const out = findStageCandidates([
      e('Small.md', 'seed', 300, 0),    // not eligible (short, no link)
      e('Big.md', 'growing', 6000, 4),  // growing -> mature
      e('Mid.md', 'seed', 1200, 2),     // seed -> sprout
    ]);
    expect(out.map((c) => c.path)).toEqual(['Big.md', 'Mid.md']); // by chars desc
    expect(out[0]).toMatchObject({ from: 'growing', to: 'mature' });
    expect(out[1]).toMatchObject({ from: 'seed', to: 'sprout' });
  });

  test('excludes specialist/maker (use status, not stage) and non-§1 types', () => {
    const out = findStageCandidates([
      e('Spec.md', 'seed', 2000, 3, { type: 'specialist' }),     // status, not stage
      e('Prompt.md', 'seed', 2000, 3, { type: 'agent-prompt' }), // not a §1 entry
      e('Bundle.md', 'seed', 2000, 3, { type: null }),           // bundle file
      e('Real.md', 'seed', 2000, 3),                             // genuine concept
    ]);
    expect(out.map((c) => c.path)).toEqual(['Real.md']);
  });

  test('never demotes — a short mature entry is not pulled back', () => {
    expect(findStageCandidates([e('M.md', 'mature', 100, 0)])).toEqual([]);
  });
});
