// Stage F Phase 2 verify gate: the reconciliation object is deterministic from a
// fixture of two branch results, and reports complete / incomplete / fell-back
// correctly. It never classifies which artifact is better — that's Loudon's call.

import { describe, test, expect } from 'vitest';
import { collectBranchResults, reconcileTwoPaths } from '../../src/two-paths-reconcile.js';

const REQ = 'apo-steward-004';
const expectedOptions = [
  { id: 'K-SWEEP', label: 'K-SWEEP — 30s render, K linear 0→1' },
  { id: 'DUAL-SWEEP', label: 'DUAL-SWEEP — K linear + pitch glide' },
];

function built(option_id, artifact_path, summary, from = 'Action Potential Oscillator') {
  return { type: 'PROOF', board: 'BRANCHES', from, payload: { kind: 'branch_result', request_id: REQ, option_id, status: 'built', artifact_path, summary } };
}
function oversized(option_id, reason, from = 'Action Potential Oscillator') {
  return { type: 'BROADCAST', board: 'GENERAL', from, payload: { kind: 'branch_result', request_id: REQ, option_id, status: 'oversized', reason } };
}
const noise = [
  { type: 'BROADCAST', board: 'GENERAL', payload: { kind: 'status', text: 'unrelated' } },
  { type: 'PROOF', board: 'BRANCHES', payload: { kind: 'branch_result', request_id: 'other-fork-009', option_id: 'X', status: 'built', artifact_path: 'x.wav' } },
];

describe('collectBranchResults', () => {
  test('selects only this fork\'s branch_results, sorted by option_id', () => {
    const msgs = [...noise, built('K-SWEEP', 'a.wav', 's1'), built('DUAL-SWEEP', 'b.wav', 's2')];
    const got = collectBranchResults(msgs, REQ);
    expect(got.map((r) => r.option_id)).toEqual(['DUAL-SWEEP', 'K-SWEEP']);
    expect(got.every((r) => r.status === 'built')).toBe(true);
  });

  test('a later post for the same option supersedes the earlier (self-correction)', () => {
    const msgs = [built('K-SWEEP', 'old.wav', 'first'), built('K-SWEEP', 'new.wav', 'corrected')];
    const got = collectBranchResults(msgs, REQ);
    expect(got).toHaveLength(1);
    expect(got[0].artifact_path).toBe('new.wav');
    expect(got[0].summary).toBe('corrected');
  });
});

describe('reconcileTwoPaths — complete', () => {
  const msgs = [...noise, built('K-SWEEP', 'renders/k.wav', 'K sweep reads as a clear sync transition'), built('DUAL-SWEEP', 'renders/dual.wav', 'two axes at once, busier')];
  const rec = reconcileTwoPaths({ requestId: REQ, messages: msgs, expectedOptions });

  test('status complete, ready for choice, orthogonality, two built paths carry labels', () => {
    expect(rec.status).toBe('complete');
    expect(rec.ready_for_choice).toBe(true);
    expect(rec.relation).toBe('orthogonality');
    expect(rec.built).toHaveLength(2);
    expect(rec.built.find((b) => b.option_id === 'K-SWEEP').label).toMatch(/K linear/);
    expect(rec.built.find((b) => b.option_id === 'K-SWEEP').artifact_path).toBe('renders/k.wav');
    expect(rec.missing).toEqual([]);
  });

  test('deterministic — two reconciliations of the same fixture are byte-identical', () => {
    const a = reconcileTwoPaths({ requestId: REQ, messages: msgs, expectedOptions });
    const b = reconcileTwoPaths({ requestId: REQ, messages: msgs, expectedOptions });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  test('never asserts a winner', () => {
    const blob = JSON.stringify(rec).toLowerCase();
    expect(blob).not.toMatch(/winner|better|recommend|prefer/);
  });
});

describe('reconcileTwoPaths — incomplete', () => {
  test('one branch in, the other still outstanding → incomplete, not ready, names the missing branch', () => {
    const rec = reconcileTwoPaths({ requestId: REQ, messages: [built('K-SWEEP', 'k.wav', 's')], expectedOptions });
    expect(rec.status).toBe('incomplete');
    expect(rec.ready_for_choice).toBe(false);
    expect(rec.missing).toEqual(['DUAL-SWEEP']);
    expect(rec.notes.join(' ')).toMatch(/waiting on branch DUAL-SWEEP/);
  });
});

describe('reconcileTwoPaths — fell back', () => {
  test('an oversized branch forces fall-back to plain escalation', () => {
    const msgs = [built('K-SWEEP', 'k.wav', 's'), oversized('DUAL-SWEEP', 'needs a multi-day DSP build')];
    const rec = reconcileTwoPaths({ requestId: REQ, messages: msgs, expectedOptions });
    expect(rec.status).toBe('fell_back');
    expect(rec.ready_for_choice).toBe(false);
    expect(rec.fell_back).toHaveLength(1);
    expect(rec.fell_back[0].reason).toMatch(/multi-day/);
    expect(rec.notes.join(' ')).toMatch(/falls back to plain Stage E escalation/);
  });
});
