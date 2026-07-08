// health.test.js — Path 2 (claude-code-subagent) stub health block.
//
// Per the Palace Orchestrator entry (Definitions of record → dual-path
// health), Path 2 dispatch stamps a minimal stub: { score: "green", model,
// _orchestrator_metadata }. The
// validator recognizes the dispatch_mode marker and relaxes the other
// per-call usage requirements.

import { describe, it, expect } from 'vitest';
import { buildHealthBlock, scoreFor } from '../../src/health.js';

describe('scoreFor (kept for Path 1, unused by Path 2 stub)', () => {
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

describe('buildHealthBlock — Path 2 stub', () => {
  it('builds a minimal stub: score + model + _orchestrator_metadata only', () => {
    const h = buildHealthBlock({ model: 'claude-opus-4-7' });
    expect(h.score).toBe('green');
    expect(h.model).toBe('claude-opus-4-7');
    expect(h._orchestrator_metadata.dispatch_mode).toBe('claude-code-subagent');
    expect(typeof h._orchestrator_metadata.note).toBe('string');
    // No per-call usage fields are emitted in Path 2 — those were
    // approximate heuristics and §3.3 Path 2 says don't stamp them.
    expect(h.context_pct).toBeUndefined();
    expect(h.tokens_this_call).toBeUndefined();
    expect(h.iteration).toBeUndefined();
    expect(h.stop_reason).toBeUndefined();
  });

  it('ignores legacy usage fields (total_tokens, stop_reason, iteration)', () => {
    // Callers may still pass these for backwards-compat; the stub ignores
    // them rather than stamping them on the output, because §3.3 Path 2
    // forbids stamping approximate numbers as if authoritative.
    const h = buildHealthBlock({
      model: 'claude-sonnet-4-6',
      total_tokens: 5000,
      stop_reason: 'end_turn',
      iteration: 5,
      duplicate_flags: 7,
    });
    expect(h.score).toBe('green');
    expect(h.model).toBe('claude-sonnet-4-6');
    expect(h.context_pct).toBeUndefined();
    expect(h.iteration).toBeUndefined();
    expect(h.tokens_this_call).toBeUndefined();
  });

  it('accepts an optional note for cycle-specific provenance', () => {
    const h = buildHealthBlock({
      model: 'claude-opus-4-7',
      note: 'GSL cycle 13 — first cycle after Path 2 stub landed; light dispatch.',
    });
    expect(h._orchestrator_metadata.note).toMatch(/GSL cycle 13/);
  });

  it('falls back to a generic canon-reference note when none given', () => {
    const h = buildHealthBlock({ model: 'claude-opus-4-7' });
    expect(h._orchestrator_metadata.note).toMatch(/Palace Orchestrator/);
  });

  it('throws on missing usage object', () => {
    expect(() => buildHealthBlock(null)).toThrow(/usage object/);
    expect(() => buildHealthBlock(undefined)).toThrow(/usage object/);
  });

  it('throws on missing model', () => {
    expect(() => buildHealthBlock({})).toThrow(/model/);
    expect(() => buildHealthBlock({ model: '' })).toThrow(/model/);
    expect(() => buildHealthBlock({ model: '   ' })).toThrow(/model/);
  });
});
