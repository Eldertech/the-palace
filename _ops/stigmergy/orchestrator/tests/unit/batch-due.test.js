// Unit tests for the shared per-steward due predicate (batch-due.js). The CLI
// (batch-plan.js) and the STEWARDS deck both consume this; the reason strings
// here are the ones batch-plan.test.js asserts on through the CLI.

import { describe, test, expect } from 'vitest';
import { dueForCycle, SKIP_STAGES, DEFAULT_DEBOUNCE_HOURS } from '../../src/batch-due.js';

const NOW = new Date('2026-06-22T08:00:00Z').getTime();

describe('dueForCycle', () => {
  test('a non-dormant active steward not recently cycled is due', () => {
    const v = dueForCycle({ stage: 'growing', status: 'active', lastActive: '2026-06-20T00:00:00Z', now: NOW });
    expect(v.due).toBe(true);
    expect(v.reason).toBe('due');
  });

  test('first activation (no last_active) is due', () => {
    expect(dueForCycle({ stage: 'sprout', status: 'active', lastActive: null, now: NOW }).due).toBe(true);
  });

  test('dormant / composting are never due — the stage floor', () => {
    for (const stage of SKIP_STAGES) {
      const v = dueForCycle({ stage, status: 'active', lastActive: null, now: NOW });
      expect(v.due).toBe(false);
      expect(v.reason).toBe(`stage_${stage}_do_not_touch`);
    }
  });

  test('a non-active project status is skipped', () => {
    const v = dueForCycle({ stage: 'growing', status: 'archived', lastActive: null, now: NOW });
    expect(v.due).toBe(false);
    expect(v.reason).toBe('status_archived');
  });

  test('"unknown" and absent status both pass the status gate', () => {
    expect(dueForCycle({ stage: 'growing', status: 'unknown', lastActive: null, now: NOW }).due).toBe(true);
    expect(dueForCycle({ stage: 'growing', lastActive: null, now: NOW }).due).toBe(true);
  });

  test('a recent cycle is debounced with the historical reason string', () => {
    const recent = new Date(NOW - 6 * 3.6e6).toISOString(); // 6h ago, < 12h default
    const v = dueForCycle({ stage: 'growing', status: 'active', lastActive: recent, now: NOW });
    expect(v.due).toBe(false);
    expect(v.reason).toMatch(/within_debounce/);
    expect(v.reason).toBe('cycled_6.0h_ago_within_debounce');
  });

  test('ignoreDebounce overrides the recency check but not the stage floor', () => {
    const recent = new Date(NOW - 1 * 3.6e6).toISOString();
    expect(dueForCycle({ stage: 'growing', status: 'active', lastActive: recent, now: NOW, ignoreDebounce: true }).due).toBe(true);
    expect(dueForCycle({ stage: 'dormant', status: 'active', lastActive: recent, now: NOW, ignoreDebounce: true }).due).toBe(false);
  });

  test('the default debounce window is 12 hours', () => {
    expect(DEFAULT_DEBOUNCE_HOURS).toBe(12);
    const justOver = new Date(NOW - 13 * 3.6e6).toISOString();
    expect(dueForCycle({ stage: 'growing', status: 'active', lastActive: justOver, now: NOW }).due).toBe(true);
  });
});
