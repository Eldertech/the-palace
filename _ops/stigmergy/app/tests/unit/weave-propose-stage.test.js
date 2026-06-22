// Unit: buildStagePromotionProposal + planStageEmission — the promote_stage
// posting half. Mirrors weave-propose-hub.test.js (single-entry, set-* op).

import { describe, test, expect } from 'vitest';
import { buildStagePromotionProposal, planStageEmission } from '../../src/lib/weave-propose.js';
import { validateMessage } from '@stigmergy/core/schema';
import { normalizeApplyOp } from '../../src/lib/weave-apply-op.js';

const cand = (path, from, to, chars = 1000, links = 2) => ({ path, title: path.replace(/\.md$/, ''), from, to, chars, links });

describe('buildStagePromotionProposal', () => {
  test('builds a valid promote_stage vector_proposal carrying a set-stage apply op', () => {
    const m = buildStagePromotionProposal(cand('Kuramoto Coupling.md', 'seed', 'sprout'), { ts: '2026-06-22T00:00:00.000Z', id: 'stage-x' });
    expect(validateMessage(m).valid, JSON.stringify(validateMessage(m))).toBe(true);
    expect(m.payload.kind).toBe('vector_proposal');
    expect(m.payload.proposal_type).toBe('promote_stage');
    expect(m.payload.source_entry).toBe('Kuramoto Coupling.md');
    expect(m.payload.target_entry).toBeUndefined(); // single-entry, no edge
    expect(m.payload.apply).toEqual({ op: 'set-stage', entry: 'Kuramoto Coupling', stage: 'sprout' });
    expect(normalizeApplyOp(m.payload.apply)).toEqual({ op: 'set-stage', entry: 'Kuramoto Coupling', stage: 'sprout' });
    expect(m.payload.proposed_change).toMatch(/from seed to sprout/);
  });
});

describe('planStageEmission', () => {
  const ts = '2026-06-22T03:00:00.000Z';
  test('builds one proposal per candidate; honest counts', () => {
    const plan = planStageEmission({ candidates: [cand('A.md', 'seed', 'sprout'), cand('B.md', 'growing', 'mature')], existing: [], ts });
    expect(plan).toMatchObject({ found: 2, deduped: 0, eligible: 2, posted: 2, dropped: 0 });
    expect(plan.proposals).toHaveLength(2);
  });

  test('caps at limit and reports the dropped overflow (no silent cap)', () => {
    const cands = ['A', 'B', 'C'].map((n) => cand(`${n}.md`, 'seed', 'sprout'));
    const plan = planStageEmission({ candidates: cands, existing: [], limit: 1, ts });
    expect(plan.eligible).toBe(3);
    expect(plan.posted).toBe(1);
    expect(plan.dropped).toBe(2);
  });

  test('suppresses an entry already carried by an OPEN promote_stage proposal (idempotent)', () => {
    const open = buildStagePromotionProposal(cand('A.md', 'seed', 'sprout'), { ts, id: 'stage-open-1' });
    const plan = planStageEmission({ candidates: [cand('A.md', 'seed', 'sprout'), cand('B.md', 'seed', 'sprout')], existing: [open], ts });
    expect(plan.deduped).toBe(1);
    expect(plan.eligible).toBe(1);
    expect(plan.proposals[0].payload.source_entry).toBe('B.md');
  });

  test('suppresses a DENIED entry (a deny is durable)', () => {
    const denied = buildStagePromotionProposal(cand('A.md', 'seed', 'sprout'), { ts, id: 'stage-d-1' });
    const deny = { type: 'RESOURCE_DENY', re: 'stage-d-1' };
    const plan = planStageEmission({ candidates: [cand('A.md', 'seed', 'sprout')], existing: [denied, deny], ts });
    expect(plan.deduped).toBe(1);
    expect(plan.posted).toBe(0);
  });
});
