import { describe, test, expect } from 'vitest';
import { validateMessage } from '@stigmergy/core/schema';
import { buildHandoffClaim, buildHandoffClose } from '../../src/lib/handoff-builder.js';
import { buildQueue } from '../../src/lib/queue-model.js';

describe('buildHandoffClaim', () => {
  test('produces a §2.2-valid BROADCAST marking the claim (lifecycle: claim)', () => {
    const msg = buildHandoffClaim({ handoffId: 'h-123' });
    const result = validateMessage(msg);
    expect(result.valid, JSON.stringify(result)).toBe(true);
    expect(msg.type).toBe('BROADCAST');
    expect(msg.board).toBe('GENERAL');
    expect(msg.from).toBe('TRICKSTER');
    expect(msg.to).toBe('*');
    expect(msg.re).toBe('h-123');
    expect(msg.payload).toEqual({ kind: 'handoff_picked_up', lifecycle: 'claim', handoff_id: 'h-123' });
  });

  test('carries an optional note', () => {
    const msg = buildHandoffClaim({ handoffId: 'h-9', note: 'caught it, on the Mac' });
    expect(msg.payload.note).toBe('caught it, on the Mac');
    expect(validateMessage(msg).valid).toBe(true);
  });

  test('rejects a missing or empty handoffId', () => {
    expect(() => buildHandoffClaim({})).toThrow(/handoffId/);
    expect(() => buildHandoffClaim({ handoffId: '' })).toThrow(/handoffId/);
  });

  // A claim does NOT drop the card — it moves it to CLAIMED and keeps it visible.
  test('a built claim keeps the handoff_ready as a CLAIMED queue item', () => {
    const handoff = {
      id: 'h-abc', type: 'BROADCAST', from: 'Foo', ts: '2026-06-16T10:00:00Z',
      board: 'GENERAL',
      payload: { kind: 'handoff_ready', entry: 'Foo', summary: 'mid-move on Stage C' },
    };
    expect(buildQueue([handoff])).toHaveLength(1);
    const claim = buildHandoffClaim({ handoffId: 'h-abc' });
    const q = buildQueue([handoff, claim]);
    expect(q).toHaveLength(1);
    expect(q[0].state).toBe('claimed');
  });
});

describe('buildHandoffClose', () => {
  test('produces a §2.2-valid handoff_closed (defaults to complete)', () => {
    const msg = buildHandoffClose({ handoffId: 'h-123', commit: 'abc123' });
    const result = validateMessage(msg);
    expect(result.valid, JSON.stringify(result)).toBe(true);
    expect(msg.re).toBe('h-123');
    expect(msg.payload.kind).toBe('handoff_closed');
    expect(msg.payload.handoff_id).toBe('h-123');
    expect(msg.payload.completion).toBe('complete');
    expect(msg.payload.commit).toBe('abc123');
  });

  test('marks a partial close', () => {
    const msg = buildHandoffClose({ handoffId: 'h-5', completion: 'partial' });
    expect(msg.payload.completion).toBe('partial');
    expect(validateMessage(msg).valid).toBe(true);
  });

  test('rejects a missing or empty handoffId', () => {
    expect(() => buildHandoffClose({})).toThrow(/handoffId/);
    expect(() => buildHandoffClose({ handoffId: '' })).toThrow(/handoffId/);
  });

  // The contract that clears the QUEUE item: a handoff_closed whose handoff_id
  // matches the handoff_ready message id drops it from the built queue.
  test('a built close drops the handoff_ready item from the queue', () => {
    const handoff = {
      id: 'h-abc', type: 'BROADCAST', from: 'Foo', ts: '2026-06-16T10:00:00Z',
      board: 'GENERAL',
      payload: { kind: 'handoff_ready', entry: 'Foo', summary: 'mid-move on Stage C' },
    };
    expect(buildQueue([handoff])).toHaveLength(1);
    const close = buildHandoffClose({ handoffId: 'h-abc' });
    expect(buildQueue([handoff, close])).toHaveLength(0);
  });
});
