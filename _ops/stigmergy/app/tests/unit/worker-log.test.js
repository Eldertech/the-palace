import { describe, it, expect } from 'vitest';
import { lastFireStatus, logTail } from '../../src/lib/worker-log.js';

describe('logTail', () => {
  it('returns last n lines', () => {
    expect(logTail('a\nb\nc\nd', 2)).toEqual(['c', 'd']);
  });
  it('handles empty', () => {
    expect(logTail('', 5)).toEqual([]);
    expect(logTail(null, 5)).toEqual([]);
  });
});

describe('lastFireStatus', () => {
  it('none when never fired', () => {
    expect(lastFireStatus('')).toEqual({ status: 'none' });
    expect(lastFireStatus('random noise\nno markers')).toEqual({ status: 'none' });
  });

  it('inflight for a fresh fire with no commit signal', () => {
    const log = '--- worker fire 2026-05-30T10:00:00Z ---\nworking...';
    expect(lastFireStatus(log)).toEqual({ status: 'inflight', fireTs: '2026-05-30T10:00:00Z' });
  });

  it('ok on a clean exit line', () => {
    const log = [
      '--- worker fire 2026-05-30T10:00:00Z ---',
      'did stuff',
      '--- worker exit pid 123 at 2026-05-30T10:01:00Z ---',
    ].join('\n');
    expect(lastFireStatus(log)).toEqual({
      status: 'ok', fireTs: '2026-05-30T10:00:00Z', exitTs: '2026-05-30T10:01:00Z',
    });
  });

  it('ok on a supervisor success marker even without an exit line', () => {
    const log = [
      '--- worker fire 2026-05-30T10:00:00Z ---',
      'done. -> reload http://localhost:5173',
    ].join('\n');
    const r = lastFireStatus(log);
    expect(r.status).toBe('ok');
    expect(r.exitTs).toBeNull();
  });

  it('failed on a known failure pattern', () => {
    const log = [
      '--- worker fire 2026-05-30T10:00:00Z ---',
      'API Error: 401 Failed to authenticate',
      '--- worker exit pid 9 at 2026-05-30T10:00:05Z ---',
    ].join('\n');
    const r = lastFireStatus(log);
    expect(r.status).toBe('failed');
    expect(r.errorLine).toContain('API Error');
  });

  it('failure is not silenced by a later success marker in the same block', () => {
    const log = [
      '--- worker fire 2026-05-30T10:00:00Z ---',
      'ERROR: spawn failed',
      '-> reload http://localhost:5173',
    ].join('\n');
    expect(lastFireStatus(log).status).toBe('failed');
  });

  it('walks back to the previous committed fire when the newest is in-flight... but newest still wins if it IS the newest', () => {
    // Two fires: older ok, newest in-flight -> report the newest as inflight.
    const log = [
      '--- worker fire 2026-05-30T09:00:00Z ---',
      '--- worker exit pid 1 at 2026-05-30T09:01:00Z ---',
      '--- worker fire 2026-05-30T10:00:00Z ---',
      'still going',
    ].join('\n');
    expect(lastFireStatus(log)).toEqual({ status: 'inflight', fireTs: '2026-05-30T10:00:00Z' });
  });

  it('reports the newest committed fire when there are several', () => {
    const log = [
      '--- worker fire 2026-05-30T09:00:00Z ---',
      'API Error: old failure',
      '--- worker exit pid 1 at 2026-05-30T09:01:00Z ---',
      '--- worker fire 2026-05-30T10:00:00Z ---',
      'done',
      '--- worker exit pid 2 at 2026-05-30T10:01:00Z ---',
    ].join('\n');
    const r = lastFireStatus(log);
    expect(r.status).toBe('ok');
    expect(r.fireTs).toBe('2026-05-30T10:00:00Z');
  });
});
