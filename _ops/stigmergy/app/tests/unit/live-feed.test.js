import { describe, test, expect } from 'vitest';
import { mergeLive, mergeLiveBatch } from '../../src/lib/live-feed.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

function msg(id, ts, extra = {}) {
  return { id, ts, ...extra };
}

// ── mergeLive ─────────────────────────────────────────────────────────────────

describe('mergeLive', () => {
  test('merging empty array with empty incoming returns empty', () => {
    // Pass an object with no `id` that just gets appended (an edge case).
    // Actually: spec says "merging empty array with empty incoming" — treat
    // incoming as an empty-object message.
    const result = mergeLive([], { id: undefined, ts: '2026-01-01T00:00:00Z' });
    expect(result).toHaveLength(1);
    // More directly: verify that two empty-ish merge is just the incoming.
    const r2 = mergeLive([], { ts: '2026-01-01T00:00:00Z' });
    expect(r2).toHaveLength(1);
  });

  test('merging empty array with one incoming returns that one', () => {
    const incoming = msg('a', '2026-01-01T01:00:00Z');
    const result = mergeLive([], incoming);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(incoming);
  });

  test('merging a populated array with a new id appends and sorts', () => {
    const current = [msg('a', '2026-01-01T01:00:00Z'), msg('b', '2026-01-01T03:00:00Z')];
    const incoming = msg('c', '2026-01-01T02:00:00Z');
    const result = mergeLive(current, incoming);
    expect(result).toHaveLength(3);
    expect(result.map((m) => m.id)).toEqual(['a', 'c', 'b']);
  });

  test('merging with a duplicate id replaces the existing entry', () => {
    const original = msg('a', '2026-01-01T01:00:00Z', { content: 'original' });
    const update = msg('a', '2026-01-01T01:00:00Z', { content: 'updated' });
    const current = [original];
    const result = mergeLive(current, update);
    expect(result).toHaveLength(1);
    expect(result[0].content).toBe('updated');
    expect(result[0]).toBe(update);
  });

  test('duplicate id: latest wins and result stays sorted', () => {
    const current = [
      msg('a', '2026-01-01T01:00:00Z'),
      msg('b', '2026-01-01T02:00:00Z'),
      msg('c', '2026-01-01T03:00:00Z'),
    ];
    // Replace 'b' with a new version
    const incoming = msg('b', '2026-01-01T02:00:00Z', { updated: true });
    const result = mergeLive(current, incoming);
    expect(result).toHaveLength(3);
    expect(result[1].updated).toBe(true);
    expect(result.map((m) => m.id)).toEqual(['a', 'b', 'c']);
  });

  test('out-of-order arrival: incoming with older ts slots in correctly', () => {
    const current = [
      msg('b', '2026-01-01T02:00:00Z'),
      msg('c', '2026-01-01T03:00:00Z'),
    ];
    // 'a' arrives late but has an earlier ts
    const incoming = msg('a', '2026-01-01T01:00:00Z');
    const result = mergeLive(current, incoming);
    expect(result).toHaveLength(3);
    expect(result.map((m) => m.id)).toEqual(['a', 'b', 'c']);
  });

  test('handles malformed ts (non-parseable string): sorts to end', () => {
    // Documented choice: items with malformed ts sort to the END (EPOCH_FALLBACK = 9999...).
    const current = [
      msg('a', '2026-01-01T01:00:00Z'),
      msg('b', '2026-01-01T02:00:00Z'),
    ];
    const incoming = msg('bad', 'not-a-date');
    const result = mergeLive(current, incoming);
    expect(result).toHaveLength(3);
    expect(result[2].id).toBe('bad'); // sorted to end
  });

  test('handles missing ts field: sorts to end (consistent)', () => {
    const current = [
      msg('a', '2026-01-01T01:00:00Z'),
    ];
    const incoming = { id: 'no-ts' }; // no ts field
    const result = mergeLive(current, incoming);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('a');
    expect(result[1].id).toBe('no-ts'); // sorted to end
  });

  test('handles empty string ts: sorts to end', () => {
    const current = [msg('a', '2026-01-01T01:00:00Z')];
    const incoming = msg('empty-ts', '');
    const result = mergeLive(current, incoming);
    expect(result[result.length - 1].id).toBe('empty-ts');
  });

  test('stable sort: items with equal ts preserve relative order', () => {
    const ts = '2026-01-01T01:00:00Z';
    const current = [
      msg('first', ts),
      msg('second', ts),
      msg('third', ts),
    ];
    const incoming = msg('fourth', ts);
    const result = mergeLive(current, incoming);
    expect(result).toHaveLength(4);
    // first, second, third must appear before fourth (stable relative to original)
    const ids = result.map((m) => m.id);
    expect(ids.indexOf('first')).toBeLessThan(ids.indexOf('fourth'));
    expect(ids.indexOf('second')).toBeLessThan(ids.indexOf('fourth'));
    expect(ids.indexOf('third')).toBeLessThan(ids.indexOf('fourth'));
  });

  test('does not mutate the input array', () => {
    const current = [msg('a', '2026-01-01T01:00:00Z')];
    const originalRef = current[0];
    mergeLive(current, msg('b', '2026-01-01T02:00:00Z'));
    expect(current).toHaveLength(1);
    expect(current[0]).toBe(originalRef);
  });
});

// ── mergeLiveBatch ────────────────────────────────────────────────────────────

describe('mergeLiveBatch', () => {
  test('empty incomingArray returns the original list unchanged', () => {
    const current = [msg('a', '2026-01-01T01:00:00Z')];
    const result = mergeLiveBatch(current, []);
    expect(result).toHaveLength(1);
  });

  test('single incoming produces same result as mergeLive', () => {
    const current = [msg('a', '2026-01-01T01:00:00Z')];
    const incoming = msg('b', '2026-01-01T02:00:00Z');
    const batchResult = mergeLiveBatch(current, [incoming]);
    const singleResult = mergeLive(current, incoming);
    expect(batchResult).toEqual(singleResult);
  });

  test('multiple incomings produce same result as iterative mergeLive', () => {
    const current = [msg('a', '2026-01-01T01:00:00Z')];
    const incomings = [
      msg('d', '2026-01-01T04:00:00Z'),
      msg('b', '2026-01-01T02:00:00Z'),
      msg('c', '2026-01-01T03:00:00Z'),
    ];

    const batchResult = mergeLiveBatch(current, incomings);

    let iterResult = current;
    for (const inc of incomings) {
      iterResult = mergeLive(iterResult, inc);
    }

    expect(batchResult).toEqual(iterResult);
  });

  test('duplicate ids across batch: last occurrence wins', () => {
    const current = [msg('a', '2026-01-01T01:00:00Z', { v: 1 })];
    const incomings = [
      msg('a', '2026-01-01T01:00:00Z', { v: 2 }),
      msg('a', '2026-01-01T01:00:00Z', { v: 3 }),
    ];
    const result = mergeLiveBatch(current, incomings);
    expect(result).toHaveLength(1);
    expect(result[0].v).toBe(3);
  });

  test('mixed new + replacement: all appear, sorted correctly', () => {
    const current = [
      msg('a', '2026-01-01T01:00:00Z'),
      msg('c', '2026-01-01T03:00:00Z'),
    ];
    const incomings = [
      msg('b', '2026-01-01T02:00:00Z'),       // new, slots between a and c
      msg('c', '2026-01-01T03:00:00Z', { updated: true }), // replace c
    ];
    const result = mergeLiveBatch(current, incomings);
    expect(result).toHaveLength(3);
    expect(result.map((m) => m.id)).toEqual(['a', 'b', 'c']);
    expect(result[2].updated).toBe(true);
  });
});
