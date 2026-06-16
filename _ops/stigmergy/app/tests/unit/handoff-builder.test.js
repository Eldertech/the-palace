import { describe, test, expect } from 'vitest';
import { validateMessage } from '@stigmergy/core/schema';
import { buildHandoffPickup } from '../../src/lib/handoff-builder.js';
import { buildQueue } from '../../src/lib/queue-model.js';

describe('buildHandoffPickup', () => {
  test('produces a §2.2-valid BROADCAST marking the pickup', () => {
    const msg = buildHandoffPickup({ handoffId: 'h-123' });
    const result = validateMessage(msg);
    expect(result.valid, JSON.stringify(result)).toBe(true);
    expect(msg.type).toBe('BROADCAST');
    expect(msg.board).toBe('GENERAL');
    expect(msg.from).toBe('TRICKSTER');
    expect(msg.to).toBe('*');
    expect(msg.re).toBe('h-123');
    expect(msg.payload).toEqual({ kind: 'handoff_picked_up', handoff_id: 'h-123' });
  });

  test('carries an optional note', () => {
    const msg = buildHandoffPickup({ handoffId: 'h-9', note: 'caught it, on the Mac' });
    expect(msg.payload.note).toBe('caught it, on the Mac');
    expect(validateMessage(msg).valid).toBe(true);
  });

  test('rejects a missing or empty handoffId', () => {
    expect(() => buildHandoffPickup({})).toThrow(/handoffId/);
    expect(() => buildHandoffPickup({ handoffId: '' })).toThrow(/handoffId/);
  });

  // The contract that makes the QUEUE item self-clear: a pickup message whose
  // payload.handoff_id matches the handoff_ready message id drops it from the
  // built queue (queue-model.buildQueue's ackedHandoffs path).
  test('a built pickup message drops the handoff_ready item from the queue', () => {
    const handoff = {
      id: 'h-abc', type: 'BROADCAST', from: 'Foo', ts: '2026-06-16T10:00:00Z',
      board: 'GENERAL',
      payload: { kind: 'handoff_ready', entry: 'Foo', summary: 'mid-move on Stage C' },
    };
    expect(buildQueue([handoff])).toHaveLength(1);
    const pickup = buildHandoffPickup({ handoffId: 'h-abc' });
    expect(buildQueue([handoff, pickup])).toHaveLength(0);
  });
});
