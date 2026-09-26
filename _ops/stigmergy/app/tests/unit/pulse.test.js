import { describe, it, expect } from 'vitest';
import { scoreEntry, pulseSort, daysSince } from '../../src/lib/pulse.js';

const NOW = new Date(Date.UTC(2026, 4, 30)); // 2026-05-30 (month is 0-indexed)
const used = (recent) => ({ page: 0, bundle: 0, linked: 0, use: recent, recent: { page: 0, bundle: 0, linked: 0, use: recent } });

describe('daysSince', () => {
  it('zero for today', () => {
    expect(daysSince('2026-05-30', NOW)).toBe(0);
  });
  it('positive for older days', () => {
    expect(daysSince('2026-05-20', NOW)).toBe(10);
    expect(daysSince('2025-05-30', NOW)).toBe(365);
  });
  it('reads a bare YYYY-MM as its first day', () => {
    expect(daysSince('2026-05', NOW)).toBe(29);
  });
  it('Infinity for nonsense', () => {
    expect(daysSince('not a date', NOW)).toBe(Infinity);
    expect(daysSince(null, NOW)).toBe(Infinity);
  });
});

describe('scoreEntry', () => {
  it('higher score for fruiting + recently used + much use + handoff', () => {
    const fruity = scoreEntry({
      stage: 'fruiting', last_used: '2026-05-28', use: used(20), has_active_handoff: true,
    }, NOW);
    const dormant = scoreEntry({
      stage: 'dormant', last_used: '2024-01-10', use: used(0), has_active_handoff: false,
    }, NOW);
    expect(fruity).toBeGreaterThan(dormant);
  });

  it('more recent use scores higher, all else equal', () => {
    const base = { stage: 'mature', last_used: '2026-05-01' };
    expect(scoreEntry({ ...base, use: used(12) }, NOW)).toBeGreaterThan(scoreEntry({ ...base, use: used(1) }, NOW));
  });

  it('an entry with no use record still scores on stage', () => {
    expect(scoreEntry({ stage: 'fruiting', use: null, last_used: null }, NOW)).toBeGreaterThan(0);
  });

  it('returns 0 on falsy input', () => {
    expect(scoreEntry(null)).toBe(0);
    expect(scoreEntry(undefined)).toBe(0);
  });

  it('handoff bumps score over a baseline match', () => {
    const base = { stage: 'mature', last_used: '2026-04-15', use: used(5) };
    const sNoH = scoreEntry({ ...base, has_active_handoff: false }, NOW);
    const sH = scoreEntry({ ...base, has_active_handoff: true }, NOW);
    expect(sH).toBeGreaterThan(sNoH);
  });
});

describe('pulseSort', () => {
  it('sorts most-alive first and stamps a `pulse` field', () => {
    const out = pulseSort([
      { title: 'Dormant', stage: 'dormant', last_used: '2024-01-10', use: used(0) },
      { title: 'Fruity', stage: 'fruiting', last_used: '2026-05-28', use: used(20), has_active_handoff: true },
      { title: 'Sprouty', stage: 'sprout', last_used: '2026-05-20', use: used(3) },
    ], NOW);
    expect(out[0].title).toBe('Fruity');
    expect(out[0].pulse).toBeGreaterThan(out[1].pulse);
    expect(out[2].title).toBe('Dormant');
  });

  it('tie-breaks alphabetically on title', () => {
    const e1 = { title: 'B', stage: 'mature', last_used: '2026-05-10', use: used(0) };
    const e2 = { title: 'A', stage: 'mature', last_used: '2026-05-10', use: used(0) };
    const out = pulseSort([e1, e2], NOW);
    expect(out[0].title).toBe('A');
  });

  it('returns [] for non-array', () => {
    expect(pulseSort(null)).toEqual([]);
  });
});
