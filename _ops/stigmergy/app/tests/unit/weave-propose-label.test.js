// Unit: buildLabelProposal + selectLabelCandidates — the pure shaping + dedup/cap
// half of label_enrichment (generation, the LLM step, is tested separately).

import { describe, test, expect } from 'vitest';
import { buildLabelProposal, selectLabelCandidates } from '../../src/lib/weave-propose.js';
import { validateMessage } from '@stigmergy/core/schema';
import { normalizeApplyOp } from '../../src/lib/weave-apply-op.js';

const gen = (source, target, type, label = 'rhymes-with') => ({
  source, sourceTitle: source.replace(/\.md$/, ''), target, targetTitle: target.replace(/\.md$/, ''), type, label, rationale: 'r',
});
const cand = (source, target, type) => ({ source, target, type });

describe('buildLabelProposal', () => {
  test('builds a valid label_enrichment vector_proposal carrying a set-label apply op', () => {
    const m = buildLabelProposal(gen('Wu Wei.md', 'Kuramoto Coupling.md', 'mirrors'), { ts: '2026-06-22T00:00:00.000Z', id: 'label-x' });
    expect(validateMessage(m).valid, JSON.stringify(validateMessage(m))).toBe(true);
    expect(m.payload.kind).toBe('vector_proposal');
    expect(m.payload.proposal_type).toBe('label_enrichment');
    expect(m.payload.source_entry).toBe('Wu Wei.md');
    expect(m.payload.target_entry).toBe('Kuramoto Coupling.md');
    expect(m.payload.apply).toEqual({ op: 'set-label', entry: 'Wu Wei', target: 'Kuramoto Coupling', type: 'mirrors', label: 'rhymes-with' });
    expect(normalizeApplyOp(m.payload.apply)).toEqual({ op: 'set-label', entry: 'Wu Wei', target: 'Kuramoto Coupling', type: 'mirrors', label: 'rhymes-with' });
    expect(m.payload.proposed_change).toMatch(/as "rhymes-with"/);
  });
});

describe('selectLabelCandidates', () => {
  test('passes candidates through; honest counts; keyed on the (source,target,type) triple', () => {
    const sel = selectLabelCandidates({ candidates: [cand('A.md', 'B.md', 'mirrors'), cand('A.md', 'C.md', 'deepens')], existing: [] });
    expect(sel).toMatchObject({ found: 2, deduped: 0, eligible: 2, dropped: 0 });
  });

  test('a source with two label-less links yields two candidates (triple, not source)', () => {
    const sel = selectLabelCandidates({ candidates: [cand('A.md', 'B.md', 'mirrors'), cand('A.md', 'B.md', 'deepens')], existing: [] });
    expect(sel.eligible).toBe(2); // same source+target, different type -> distinct
  });

  test('caps + reports the dropped overflow', () => {
    const sel = selectLabelCandidates({ candidates: [cand('A.md', 'B.md', 'mirrors'), cand('A.md', 'C.md', 'deepens')], existing: [], limit: 1 });
    expect(sel.eligible).toBe(2);
    expect(sel.selected).toHaveLength(1);
    expect(sel.dropped).toBe(1);
  });

  test('suppresses a link carried by an OPEN label_enrichment proposal (idempotent)', () => {
    const open = buildLabelProposal(gen('A.md', 'B.md', 'mirrors'), { id: 'label-open-1' });
    const sel = selectLabelCandidates({ candidates: [cand('A.md', 'B.md', 'mirrors'), cand('A.md', 'C.md', 'deepens')], existing: [open] });
    expect(sel.deduped).toBe(1);
    expect(sel.eligible).toBe(1);
    expect(sel.selected[0].target).toBe('C.md');
  });

  test('suppresses a DENIED link (a deny is durable)', () => {
    const denied = buildLabelProposal(gen('A.md', 'B.md', 'mirrors'), { id: 'label-d-1' });
    const deny = { type: 'RESOURCE_DENY', re: 'label-d-1' };
    const sel = selectLabelCandidates({ candidates: [cand('A.md', 'B.md', 'mirrors')], existing: [denied, deny] });
    expect(sel.deduped).toBe(1);
    expect(sel.selected).toHaveLength(0);
  });
});
