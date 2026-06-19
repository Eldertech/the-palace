// Unit: buildHubProposal + planHubEmission — the promote_hub posting half.

import { describe, test, expect } from 'vitest';
import { buildHubProposal, planHubEmission } from '../../src/lib/weave-propose.js';
import { validateMessage } from '@stigmergy/core/schema';
import { normalizeApplyOp } from '../../src/lib/weave-apply-op.js';

const cand = (path, degree) => ({ path, title: path.replace(/\.md$/, ''), inbound_degree: degree });

describe('buildHubProposal', () => {
  test('builds a valid promote_hub vector_proposal carrying a set-type apply op', () => {
    const m = buildHubProposal(cand('Kuramoto Coupling.md', 7), { ts: '2026-06-19T00:00:00.000Z', id: 'hub-x' });
    expect(validateMessage(m).valid, JSON.stringify(validateMessage(m))).toBe(true);
    expect(m.payload.kind).toBe('vector_proposal');
    expect(m.payload.proposal_type).toBe('promote_hub');
    expect(m.payload.source_entry).toBe('Kuramoto Coupling.md');
    expect(m.payload.target_entry).toBeUndefined(); // single-entry, no edge
    expect(m.payload.apply).toEqual({ op: 'set-type', entry: 'Kuramoto Coupling', type: 'hub' });
    expect(m.payload.proposed_change).toMatch(/7 entries point to it/);
    // the apply op normalizes cleanly through the shared op module
    expect(normalizeApplyOp(m.payload.apply)).toEqual({ op: 'set-type', entry: 'Kuramoto Coupling', type: 'hub' });
  });
});

describe('planHubEmission', () => {
  const ts = '2026-06-19T03:00:00.000Z';
  test('builds one proposal per candidate; honest counts', () => {
    const plan = planHubEmission({ candidates: [cand('A.md', 6), cand('B.md', 9)], existing: [], ts });
    expect(plan).toMatchObject({ found: 2, deduped: 0, eligible: 2, posted: 2, dropped: 0 });
    expect(plan.proposals).toHaveLength(2);
  });

  test('caps at limit and reports the dropped overflow (no silent cap)', () => {
    const cands = ['A', 'B', 'C'].map((n, i) => cand(`${n}.md`, 9 - i));
    const plan = planHubEmission({ candidates: cands, existing: [], limit: 1, ts });
    expect(plan.eligible).toBe(3);
    expect(plan.posted).toBe(1);
    expect(plan.dropped).toBe(2);
  });

  test('suppresses an entry already carried by an OPEN promote_hub proposal (idempotent)', () => {
    const open = buildHubProposal(cand('A.md', 6), { ts, id: 'hub-open-1' });
    const plan = planHubEmission({ candidates: [cand('A.md', 6), cand('B.md', 7)], existing: [open], ts });
    expect(plan.deduped).toBe(1);     // A suppressed
    expect(plan.eligible).toBe(1);    // only B
    expect(plan.proposals[0].payload.source_entry).toBe('B.md');
  });

  test('suppresses a DENIED pair (a deny is durable — do not nag)', () => {
    const denied = buildHubProposal(cand('A.md', 6), { ts, id: 'hub-denied-1' });
    const deny = { type: 'RESOURCE_DENY', re: 'hub-denied-1' };
    const plan = planHubEmission({ candidates: [cand('A.md', 6)], existing: [denied, deny], ts });
    expect(plan.deduped).toBe(1);
    expect(plan.posted).toBe(0);
  });
});
