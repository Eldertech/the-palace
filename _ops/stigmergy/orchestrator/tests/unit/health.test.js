// health.test.js — approximate health block construction from Agent-tool usage.

import { describe, it, expect } from 'vitest';
import { buildHealthBlock, scoreFor, MODEL_CONTEXT_LIMITS } from '../../src/health.js';

describe('scoreFor', () => {
  it('green when context is low and no anomalies', () => {
    expect(scoreFor({ context_pct: 0.3 })).toBe('green');
  });
  it('yellow at exactly 0.70', () => {
    expect(scoreFor({ context_pct: 0.7 })).toBe('yellow');
  });
  it('yellow on one violation', () => {
    expect(scoreFor({ context_pct: 0.1, posting_discipline_violations: 1 })).toBe('yellow');
  });
  it('red above 0.85', () => {
    expect(scoreFor({ context_pct: 0.86 })).toBe('red');
  });
  it('red on two duplicate flags', () => {
    expect(scoreFor({ context_pct: 0.1, duplicate_flags: 2 })).toBe('red');
  });
});

describe('buildHealthBlock', () => {
  it('builds a green health block for typical sonnet usage', () => {
    const h = buildHealthBlock({ total_tokens: 5000, model: 'claude-sonnet-4-6' });
    expect(h.score).toBe('green');
    expect(h.context_pct).toBeCloseTo(5000 / 200000, 5);
    expect(h.stop_reason).toBe('end_turn');
    expect(h.iteration).toBe(1);
    expect(h.tokens_this_call).toBe(5000);
    expect(h.model).toBe('claude-sonnet-4-6');
  });

  it('always sets _orchestrator_metadata.dispatch_mode to claude-code-subagent (Decisions table)', () => {
    const h = buildHealthBlock({ total_tokens: 100, model: 'claude-sonnet-4-6' });
    expect(h._orchestrator_metadata).toBeDefined();
    expect(h._orchestrator_metadata.dispatch_mode).toBe('claude-code-subagent');
    expect(h._orchestrator_metadata.context_pct_provenance).toBe('approximated_from_total_tokens');
  });

  it('applies model-specific context limits', () => {
    const opus1m = buildHealthBlock({ total_tokens: 200000, model: 'claude-opus-4-7[1m]' });
    expect(opus1m.context_pct).toBeCloseTo(200000 / 1000000, 5);
    expect(opus1m.score).toBe('green');
  });

  it('forwards stop_reason and iteration when provided', () => {
    const h = buildHealthBlock({
      total_tokens: 5000,
      model: 'claude-sonnet-4-6',
      stop_reason: 'tool_use',
      iteration: 3,
    });
    expect(h.stop_reason).toBe('tool_use');
    expect(h.iteration).toBe(3);
  });

  it('clamps context_pct to [0, 1] for very high token counts', () => {
    const h = buildHealthBlock({ total_tokens: 999999999, model: 'claude-sonnet-4-6' });
    expect(h.context_pct).toBe(1);
    expect(h.score).toBe('red');
  });

  it('uses default 200k limit for unknown models', () => {
    const h = buildHealthBlock({ total_tokens: 100000, model: 'some-future-model' });
    expect(h.context_pct).toBeCloseTo(0.5, 5);
  });

  it('rejects negative or non-finite total_tokens', () => {
    expect(() => buildHealthBlock({ total_tokens: -1, model: 'claude-sonnet-4-6' })).toThrow();
    expect(() => buildHealthBlock({ total_tokens: NaN, model: 'claude-sonnet-4-6' })).toThrow();
  });

  it('rejects empty model', () => {
    expect(() => buildHealthBlock({ total_tokens: 100, model: '' })).toThrow();
  });

  it('produces a §2.2-conformant health block when paired with the validator', async () => {
    // Round-trip: build a health block, drop it into a §2.2 message, validate.
    const { validateMessage } = await import('../../src/posting.js');
    const h = buildHealthBlock({ total_tokens: 5000, model: 'claude-sonnet-4-6' });
    const msg = {
      schema_version: '1.0',
      id: 'h-test',
      ts: '2026-05-04T08:00:00Z',
      session_id: 'test',
      from: 'TEST',
      to: '*',
      type: 'BROADCAST',
      board: 'GENERAL',
      health: h,
      payload: { content: 'x' },
    };
    const r = validateMessage(msg);
    if (!r.valid) {
      throw new Error('§2.2 rejected the health block: ' + JSON.stringify(r.errors));
    }
    expect(r.valid).toBe(true);
  });
});

describe('MODEL_CONTEXT_LIMITS', () => {
  it('has entries for the models the orchestrator dispatches', () => {
    expect(MODEL_CONTEXT_LIMITS['claude-sonnet-4-6']).toBe(200000);
    expect(MODEL_CONTEXT_LIMITS['claude-opus-4-7']).toBe(200000);
    expect(MODEL_CONTEXT_LIMITS['claude-haiku-4-5-20251001']).toBe(200000);
  });
});
