import { describe, test, expect } from 'vitest';
import { buildRoster } from '../../src/lib/roster.js';

const m = (overrides) => ({
  schema_version: '1.0',
  id: 'msg-x', ts: '2026-04-01T14:00:00Z',
  session_id: 's', from: 'AGENT', to: '*', type: 'BROADCAST', board: 'GENERAL',
  health: { context_pct: 0.18, score: 'green', model: 'claude-sonnet-4-6' },
  payload: { content: '' },
  ...overrides,
});

describe('buildRoster', () => {
  test('returns empty array for empty input', () => {
    expect(buildRoster([])).toEqual([]);
    expect(buildRoster(null)).toEqual([]);
    expect(buildRoster(undefined)).toEqual([]);
  });

  test('groups messages by `from` field', () => {
    const r = buildRoster([
      m({ from: 'A', ts: '2026-04-01T14:00:00Z' }),
      m({ from: 'B', ts: '2026-04-01T14:05:00Z' }),
      m({ from: 'A', ts: '2026-04-01T14:10:00Z' }),
    ]);
    expect(r.map((x) => x.agent_id).sort()).toEqual(['A', 'B']);
    const a = r.find((x) => x.agent_id === 'A');
    expect(a.message_count).toBe(2);
  });

  test('skips messages with missing or empty from', () => {
    const r = buildRoster([
      m({ from: undefined }),
      m({ from: '' }),
      m({ from: null }),
      m({ from: 'X' }),
    ]);
    expect(r.length).toBe(1);
    expect(r[0].agent_id).toBe('X');
  });

  test('reports the latest message ts, score, context, and model', () => {
    const r = buildRoster([
      m({ from: 'A', ts: '2026-04-01T14:00:00Z',
          health: { context_pct: 0.10, score: 'green', model: 'claude-sonnet-4-6' } }),
      m({ from: 'A', ts: '2026-04-01T14:30:00Z',
          health: { context_pct: 0.74, score: 'yellow', model: 'claude-sonnet-4-6' } }),
    ]);
    expect(r[0].last_ts).toBe('2026-04-01T14:30:00Z');
    expect(r[0].latest_score).toBe('yellow');
    expect(r[0].latest_context_pct).toBe(0.74);
    expect(r[0].latest_model).toBe('claude-sonnet-4-6');
  });

  test('sorts by last_ts descending (most recent first)', () => {
    const r = buildRoster([
      m({ from: 'OLD', ts: '2026-04-01T10:00:00Z' }),
      m({ from: 'NEW', ts: '2026-04-01T14:00:00Z' }),
      m({ from: 'MID', ts: '2026-04-01T12:00:00Z' }),
    ]);
    expect(r.map((x) => x.agent_id)).toEqual(['NEW', 'MID', 'OLD']);
  });

  test('reports a context_trend when last 3 messages climb monotonically by ≥ 5%', () => {
    const r = buildRoster([
      m({ from: 'CLIMBER', ts: '2026-04-01T10:00:00Z',
          health: { context_pct: 0.18, score: 'green', model: 'a' } }),
      m({ from: 'CLIMBER', ts: '2026-04-01T11:00:00Z',
          health: { context_pct: 0.34, score: 'green', model: 'a' } }),
      m({ from: 'CLIMBER', ts: '2026-04-01T12:00:00Z',
          health: { context_pct: 0.61, score: 'green', model: 'a' } }),
    ]);
    expect(r[0].context_trend).toEqual([0.18, 0.34, 0.61]);
  });

  test('does NOT report a trend when fewer than 3 messages', () => {
    const r = buildRoster([
      m({ from: 'A', ts: '2026-04-01T10:00:00Z',
          health: { context_pct: 0.18, score: 'green', model: 'a' } }),
      m({ from: 'A', ts: '2026-04-01T11:00:00Z',
          health: { context_pct: 0.34, score: 'green', model: 'a' } }),
    ]);
    expect(r[0].context_trend).toBeUndefined();
  });

  test('does NOT report a trend when context is not climbing', () => {
    const r = buildRoster([
      m({ from: 'STEADY', ts: '2026-04-01T10:00:00Z',
          health: { context_pct: 0.30, score: 'green', model: 'a' } }),
      m({ from: 'STEADY', ts: '2026-04-01T11:00:00Z',
          health: { context_pct: 0.32, score: 'green', model: 'a' } }),
      m({ from: 'STEADY', ts: '2026-04-01T12:00:00Z',
          health: { context_pct: 0.31, score: 'green', model: 'a' } }),
    ]);
    expect(r[0].context_trend).toBeUndefined();
  });

  test('does NOT report a trend when the climb is < 5%', () => {
    const r = buildRoster([
      m({ from: 'BARELY', ts: '2026-04-01T10:00:00Z',
          health: { context_pct: 0.30, score: 'green', model: 'a' } }),
      m({ from: 'BARELY', ts: '2026-04-01T11:00:00Z',
          health: { context_pct: 0.31, score: 'green', model: 'a' } }),
      m({ from: 'BARELY', ts: '2026-04-01T12:00:00Z',
          health: { context_pct: 0.32, score: 'green', model: 'a' } }),
    ]);
    expect(r[0].context_trend).toBeUndefined();
  });

  test('uses only the last 3 messages for trend computation', () => {
    const r = buildRoster([
      m({ from: 'A', ts: '2026-04-01T08:00:00Z',
          health: { context_pct: 0.10, score: 'green', model: 'a' } }),
      m({ from: 'A', ts: '2026-04-01T09:00:00Z',
          health: { context_pct: 0.50, score: 'green', model: 'a' } }),
      m({ from: 'A', ts: '2026-04-01T10:00:00Z',
          health: { context_pct: 0.20, score: 'green', model: 'a' } }),
      m({ from: 'A', ts: '2026-04-01T11:00:00Z',
          health: { context_pct: 0.40, score: 'green', model: 'a' } }),
      m({ from: 'A', ts: '2026-04-01T12:00:00Z',
          health: { context_pct: 0.60, score: 'green', model: 'a' } }),
    ]);
    // Last three are 0.20, 0.40, 0.60 — climbs 40% — qualifies as a trend.
    expect(r[0].context_trend).toEqual([0.20, 0.40, 0.60]);
  });
});
