// Unit tests for the pure `apply` op validator a Weave proposal may carry.

import { describe, it, expect } from 'vitest';
import { normalizeApplyOp, describeApplyOp, APPLY_OPS } from '../../src/lib/weave-apply-op.js';

describe('normalizeApplyOp — set-vector', () => {
  it('normalizes a well-formed set-vector op', () => {
    const op = normalizeApplyOp({ op: 'set-vector', entry: 'Kuramoto Coupling', text: 'I will keep coupling.' });
    expect(op).toEqual({ op: 'set-vector', entry: 'Kuramoto Coupling', text: 'I will keep coupling.' });
  });

  it('tolerates a trailing .md on the entry and trims', () => {
    const op = normalizeApplyOp({ op: 'set-vector', entry: '  Kuramoto Coupling.md ', text: '  I will keep coupling.  ' });
    expect(op).toEqual({ op: 'set-vector', entry: 'Kuramoto Coupling', text: 'I will keep coupling.' });
  });

  it('returns null for an absent / malformed apply', () => {
    expect(normalizeApplyOp(null)).toBe(null);
    expect(normalizeApplyOp(undefined)).toBe(null);
    expect(normalizeApplyOp('set-vector')).toBe(null);
    expect(normalizeApplyOp([])).toBe(null);
    expect(normalizeApplyOp({})).toBe(null);
  });

  it('returns null for an unknown op', () => {
    expect(normalizeApplyOp({ op: 'delete-entry', entry: 'X', text: 'y' })).toBe(null);
    expect(normalizeApplyOp({ op: 'add-link', entry: 'X', target: 'Y' })).toBe(null); // not in increment 1
  });

  it('returns null when set-vector is missing entry or text, or text is multiline/empty', () => {
    expect(normalizeApplyOp({ op: 'set-vector', text: 'y' })).toBe(null);
    expect(normalizeApplyOp({ op: 'set-vector', entry: 'X' })).toBe(null);
    expect(normalizeApplyOp({ op: 'set-vector', entry: 'X', text: '   ' })).toBe(null);
    expect(normalizeApplyOp({ op: 'set-vector', entry: 'X', text: 'one\ntwo' })).toBe(null);
    expect(normalizeApplyOp({ op: 'set-vector', entry: '  .md ', text: 'y' })).toBe(null); // entry empties to nothing
  });
});

describe('describeApplyOp', () => {
  it('describes a set-vector op in one human line', () => {
    expect(describeApplyOp({ op: 'set-vector', entry: 'Kuramoto Coupling', text: 'x' }))
      .toBe("tune Kuramoto Coupling's forward_vector");
  });
  it('is defensive on junk', () => {
    expect(describeApplyOp(null)).toBe('');
    expect(describeApplyOp({ op: 'mystery', entry: 'X' })).toBe('apply mystery to X');
  });
});

describe('APPLY_OPS', () => {
  it('exposes set-vector as a supported op', () => {
    expect(APPLY_OPS).toContain('set-vector');
  });
});
