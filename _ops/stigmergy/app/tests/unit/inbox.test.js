import { describe, test, expect } from 'vitest';
import { buildInbox } from '../../src/lib/inbox.js';

const REQ = (request_id, ts = '2026-04-01T15:00:00Z', extras = {}) => ({
  schema_version: '1.0', id: `msg-${request_id}`, ts,
  session_id: 's', from: 'CONATUS-4', to: 'TRICKSTER',
  type: 'RESOURCE_REQUEST', board: 'TRICKSTER',
  request_id,
  health: { context_pct: 0.61, score: 'green', model: 'a' },
  payload: { resource: 'web_search', rationale: 'r', blocking: true },
  ...extras,
});

const GRANT = (re, ts = '2026-04-01T15:01:00Z', extras = {}) => ({
  schema_version: '1.0', id: `grant-${re}`, ts,
  session_id: 's', from: 'TRICKSTER', to: 'CONATUS-4',
  type: 'RESOURCE_GRANT', board: 'TRICKSTER',
  re,
  health: { context_pct: 0.0, score: 'green', model: 'human' },
  payload: { granted: true },
  ...extras,
});

const DENY = (re, ts = '2026-04-01T15:01:00Z', extras = {}) => ({
  schema_version: '1.0', id: `deny-${re}`, ts,
  session_id: 's', from: 'TRICKSTER', to: 'CONATUS-4',
  type: 'RESOURCE_DENY', board: 'TRICKSTER',
  re,
  health: { context_pct: 0.0, score: 'green', model: 'human' },
  payload: { granted: false, reason: 'no' },
  ...extras,
});

describe('buildInbox', () => {
  test('empty input returns empty list', () => {
    expect(buildInbox([]).pending_requests).toEqual([]);
    expect(buildInbox(null).pending_requests).toEqual([]);
  });

  test('a paired RESOURCE_REQUEST is NOT in the inbox', () => {
    const r = buildInbox([REQ('r-1'), GRANT('r-1')]);
    expect(r.pending_requests).toEqual([]);
  });

  test('an unpaired RESOURCE_REQUEST IS in the inbox', () => {
    const r = buildInbox([REQ('r-1')]);
    expect(r.pending_requests).toHaveLength(1);
    expect(r.pending_requests[0].request_id).toBe('r-1');
  });

  test('a RESOURCE_DENY counts as a response (paired)', () => {
    const r = buildInbox([REQ('r-1'), DENY('r-1')]);
    expect(r.pending_requests).toEqual([]);
  });

  test('multiple responses to the same request: still treated as paired', () => {
    // Edge case from Infrastructure Spec §2.6 — should not double-count.
    const r = buildInbox([REQ('r-1'), GRANT('r-1'), GRANT('r-1')]);
    expect(r.pending_requests).toEqual([]);
  });

  test('only TRICKSTER-board messages are considered', () => {
    const r = buildInbox([
      { ...REQ('r-1'), board: 'GENERAL' },         // wrong board → ignored
      REQ('r-2'),                                   // TRICKSTER → counted
    ]);
    expect(r.pending_requests).toHaveLength(1);
    expect(r.pending_requests[0].request_id).toBe('r-2');
  });

  test('non-RESOURCE_REQUEST types do not appear', () => {
    const r = buildInbox([
      { ...REQ('r-1'), type: 'BROADCAST' },
      REQ('r-2'),
    ]);
    expect(r.pending_requests.map((p) => p.request_id)).toEqual(['r-2']);
  });

  test('shape per Infrastructure Spec §2.6: required fields present', () => {
    const r = buildInbox([REQ('r-1', '2026-04-01T15:00:00Z')]);
    const item = r.pending_requests[0];
    expect(item.request_id).toBe('r-1');
    expect(item.from).toBe('CONATUS-4');
    expect(item.ts).toBe('2026-04-01T15:00:00Z');
    expect(item.resource).toBe('web_search');
    expect(item.rationale).toBe('r');
    expect(item.blocking).toBe(true);
    expect(item.agent_health).toBe('green');
    expect(item.agent_context_pct).toBe(0.61);
    expect(item.agent_status).toBe('suspended_on_this_thread');
    expect(Array.isArray(item.response_options)).toBe(true);
    expect(item.response_options.length).toBeGreaterThanOrEqual(4);
  });

  test('agent_status "continuing" when blocking is false', () => {
    const r = buildInbox([REQ('r-1', '2026-04-01T15:00:00Z',
      { payload: { resource: 'web_search', rationale: 'r', blocking: false } })]);
    expect(r.pending_requests[0].agent_status).toBe('continuing');
    expect(r.pending_requests[0].blocking).toBe(false);
  });

  test('inbox is sorted by ts ascending (oldest first)', () => {
    const r = buildInbox([
      REQ('r-late', '2026-04-01T16:00:00Z'),
      REQ('r-early', '2026-04-01T14:00:00Z'),
      REQ('r-mid', '2026-04-01T15:00:00Z'),
    ]);
    expect(r.pending_requests.map((p) => p.request_id))
      .toEqual(['r-early', 'r-mid', 'r-late']);
  });

  test('does not throw on messages with missing fields', () => {
    expect(() => buildInbox([{}, null, { board: 'TRICKSTER' }])).not.toThrow();
  });
});
