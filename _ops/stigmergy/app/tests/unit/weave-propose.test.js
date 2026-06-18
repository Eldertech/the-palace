// Unit tests for the unsung-path proposal builder + emission planner.

import { describe, it, expect } from 'vitest';
import { buildUnsungProposal, planUnsungEmission } from '../../src/lib/weave-propose.js';
import { validateMessage } from '@stigmergy/core/schema';
import { normalizeApplyOp } from '../../src/lib/weave-apply-op.js';

const EDGE = { source: 'Kuramoto Coupling.md', target_name: 'Spinoza Conatus', target_path: 'Spinoza Conatus.md' };

describe('buildUnsungProposal', () => {
  it('builds a §2.2-valid promote_unsung vector_proposal carrying an add-link apply op', () => {
    const m = buildUnsungProposal(EDGE, { ts: '2026-06-18T12:00:00-04:00', id: 'unsung-1' });
    expect(validateMessage(m).valid, JSON.stringify(validateMessage(m))).toBe(true);
    expect(m.type).toBe('BROADCAST');
    expect(m.board).toBe('WEAVE');
    expect(m.payload.kind).toBe('vector_proposal');
    expect(m.payload.proposal_type).toBe('promote_unsung');
    expect(m.payload.source_entry).toBe('Kuramoto Coupling.md');
    expect(m.payload.target_entry).toBe('Spinoza Conatus.md');
    expect(m.payload.proposed_change).toMatch(/\[\[Spinoza Conatus\]\].*\[\[Kuramoto Coupling\]\]/);
  });

  it("the apply op is a valid add-link (connects-to) on bare titles", () => {
    const m = buildUnsungProposal(EDGE);
    const op = normalizeApplyOp(m.payload.apply);
    expect(op).toEqual({ op: 'add-link', entry: 'Kuramoto Coupling', target: 'Spinoza Conatus', type: 'connects-to' });
  });

  it('derives titles from paths (strips folders + .md)', () => {
    const m = buildUnsungProposal({ source: 'Projects/Crystal Synth.md', target_path: 'Inharmonic Wavetable Synthesis.md' });
    expect(m.payload.apply.entry).toBe('Crystal Synth');
    expect(m.payload.apply.target).toBe('Inharmonic Wavetable Synthesis');
  });
});

describe('planUnsungEmission', () => {
  const edges = [
    { source: 'A.md', target_name: 'B', target_path: 'B.md' },
    { source: 'A.md', target_name: 'C', target_path: 'C.md' },
    { source: 'D.md', target_name: 'B', target_path: 'B.md' },
  ];

  it('builds a proposal per edge, with honest counts', () => {
    const p = planUnsungEmission({ edges, limit: 10, ts: '2026-06-18T12:00:00-04:00', runId: 'RUN' });
    expect(p.found).toBe(3);
    expect(p.eligible).toBe(3);
    expect(p.posted).toBe(3);
    expect(p.dropped).toBe(0);
    expect(p.proposals).toHaveLength(3);
    expect(p.proposals.every((m) => validateMessage(m).valid)).toBe(true);
    // unique ids per run
    expect(new Set(p.proposals.map((m) => m.id)).size).toBe(3);
  });

  it('caps to --limit and reports the dropped overflow (no silent caps)', () => {
    const p = planUnsungEmission({ edges, limit: 2, runId: 'RUN' });
    expect(p.posted).toBe(2);
    expect(p.dropped).toBe(1);
    expect(p.eligible).toBe(3);
  });

  it('drops a within-run duplicate pair', () => {
    const dup = [...edges, { source: 'A.md', target_name: 'B', target_path: 'B.md' }];
    const p = planUnsungEmission({ edges: dup, limit: 10, runId: 'RUN' });
    expect(p.posted).toBe(3); // the 4th (A→B again) is collapsed
  });

  it('skips a pair already carried by an OPEN board proposal (idempotent re-run)', () => {
    const existing = [
      { id: 'old-1', type: 'BROADCAST', payload: { kind: 'vector_proposal', source_entry: 'A.md', target_entry: 'B.md' } },
    ];
    const p = planUnsungEmission({ edges, existing, limit: 10, runId: 'RUN' });
    expect(p.deduped).toBe(1);    // A→B already proposed + open
    expect(p.posted).toBe(2);     // A→C and D→B remain
  });

  it('does NOT suppress a GRANTED pair (the grant added the link; scan self-corrects)', () => {
    const existing = [
      { id: 'old-1', type: 'BROADCAST', payload: { kind: 'vector_proposal', source_entry: 'A.md', target_entry: 'B.md' } },
      { id: 'g-1', type: 'RESOURCE_GRANT', re: 'old-1', payload: { granted: true } },
    ];
    const p = planUnsungEmission({ edges, existing, limit: 10, runId: 'RUN' });
    expect(p.deduped).toBe(0);
    expect(p.posted).toBe(3);
  });

  it('suppresses a DENIED pair durably (Loudon said no — do not nag)', () => {
    const existing = [
      { id: 'old-1', type: 'BROADCAST', payload: { kind: 'vector_proposal', source_entry: 'A.md', target_entry: 'B.md' } },
      { id: 'd-1', type: 'RESOURCE_DENY', re: 'old-1', payload: { granted: false } },
    ];
    const p = planUnsungEmission({ edges, existing, limit: 10, runId: 'RUN' });
    expect(p.deduped).toBe(1);    // A→B was denied → stays suppressed
    expect(p.posted).toBe(2);
  });
});
