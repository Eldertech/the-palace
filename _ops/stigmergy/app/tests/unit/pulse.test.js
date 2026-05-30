import { describe, it, expect } from 'vitest';
import { scoreEntry, pulseSort, monthsBetween } from '../../src/lib/pulse.js';

const NOW = new Date(Date.UTC(2026, 4, 30)); // 2026-05-30 (month is 0-indexed)

describe('monthsBetween', () => {
  it('zero for same YYYY-MM', () => {
    expect(monthsBetween('2026-05', NOW)).toBe(0);
  });
  it('positive for older', () => {
    expect(monthsBetween('2026-03', NOW)).toBe(2);
    expect(monthsBetween('2025-05', NOW)).toBe(12);
  });
  it('Infinity for nonsense', () => {
    expect(monthsBetween('not a date', NOW)).toBe(Infinity);
    expect(monthsBetween(null, NOW)).toBe(Infinity);
  });
  it('handles YYYY-MM-DD prefix', () => {
    expect(monthsBetween('2026-05-04', NOW)).toBe(0);
  });
});

describe('scoreEntry', () => {
  it('higher score for fruiting + recent + many activations + handoff', () => {
    const fruity = scoreEntry({
      stage: 'fruiting',
      last_activated: '2026-05',
      activation_count: 20,
      has_active_handoff: true,
    }, NOW);
    const dormant = scoreEntry({
      stage: 'dormant',
      last_activated: '2024-01',
      activation_count: 0,
      has_active_handoff: false,
    }, NOW);
    expect(fruity).toBeGreaterThan(dormant);
  });

  it('returns 0 on falsy input', () => {
    expect(scoreEntry(null)).toBe(0);
    expect(scoreEntry(undefined)).toBe(0);
  });

  it('handoff bumps score over a baseline match', () => {
    const base = { stage: 'mature', last_activated: '2026-04', activation_count: 5 };
    const sNoH = scoreEntry({ ...base, has_active_handoff: false }, NOW);
    const sH = scoreEntry({ ...base, has_active_handoff: true }, NOW);
    expect(sH).toBeGreaterThan(sNoH);
  });
});

describe('pulseSort', () => {
  it('sorts most-alive first and stamps a `pulse` field', () => {
    const out = pulseSort([
      { title: 'Dormant', stage: 'dormant', last_activated: '2024-01', activation_count: 0 },
      { title: 'Fruity', stage: 'fruiting', last_activated: '2026-05', activation_count: 20, has_active_handoff: true },
      { title: 'Sprouty', stage: 'sprout', last_activated: '2026-05', activation_count: 3 },
    ], NOW);
    expect(out[0].title).toBe('Fruity');
    expect(out[0].pulse).toBeGreaterThan(out[1].pulse);
    expect(out[2].title).toBe('Dormant');
  });

  it('tie-breaks alphabetically on title', () => {
    const e1 = { title: 'B', stage: 'mature', last_activated: '2026-05', activation_count: 0 };
    const e2 = { title: 'A', stage: 'mature', last_activated: '2026-05', activation_count: 0 };
    const out = pulseSort([e1, e2], NOW);
    expect(out[0].title).toBe('A');
  });

  it('returns [] for non-array', () => {
    expect(pulseSort(null)).toEqual([]);
  });
});
