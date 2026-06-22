// Unit: buildVectorTuningProposal + selectVectorTuningCandidates — the pure
// shaping + dedup/cap half of the vector_tuning posting path (generation, the
// LLM step, sits between select and build and is tested separately).

import { describe, test, expect } from 'vitest';
import { buildVectorTuningProposal, selectVectorTuningCandidates } from '../../src/lib/weave-propose.js';
import { validateMessage } from '@stigmergy/core/schema';
import { normalizeApplyOp } from '../../src/lib/weave-apply-op.js';

const gen = (path, proposedVector, extra = {}) => ({
  path, title: path.replace(/\.md$/, ''), currentVector: 'I remain the old vector.', proposedVector, rationale: 'rest → striving', ...extra,
});

describe('buildVectorTuningProposal', () => {
  test('builds a valid vector_tuning vector_proposal carrying a set-vector apply op', () => {
    const m = buildVectorTuningProposal(
      gen('Kuramoto Coupling.md', 'I will keep coupling oscillators until learners feel phase-lock in their hands.'),
      { ts: '2026-06-21T00:00:00.000Z', id: 'vt-x' },
    );
    expect(validateMessage(m).valid, JSON.stringify(validateMessage(m))).toBe(true);
    expect(m.payload.kind).toBe('vector_proposal');
    expect(m.payload.proposal_type).toBe('vector_tuning');
    expect(m.payload.source_entry).toBe('Kuramoto Coupling.md');
    expect(m.payload.target_entry).toBeUndefined(); // single-entry, no edge
    expect(m.payload.apply).toEqual({
      op: 'set-vector', entry: 'Kuramoto Coupling',
      text: 'I will keep coupling oscillators until learners feel phase-lock in their hands.',
    });
    // the apply op normalizes cleanly through the shared op module → "grant & apply" lights up
    expect(normalizeApplyOp(m.payload.apply)).toEqual({
      op: 'set-vector', entry: 'Kuramoto Coupling',
      text: 'I will keep coupling oscillators until learners feel phase-lock in their hands.',
    });
    expect(m.payload.proposed_change).toMatch(/sharpen .*forward_vector to:/);
    expect(m.payload.current_vector).toBe('I remain the old vector.');
  });

  test('falls back to a default rationale when none is given', () => {
    const m = buildVectorTuningProposal(gen('A.md', 'I will keep doing A.', { rationale: '' }));
    expect(m.payload.rationale).toMatch(/conatus, not stasis/i);
  });
});

describe('selectVectorTuningCandidates', () => {
  const cand = (path) => ({ path, title: path.replace(/\.md$/, ''), currentVector: 'I remain X.' });

  test('passes all candidates through when none are on the board; honest counts', () => {
    const sel = selectVectorTuningCandidates({ candidates: [cand('A.md'), cand('B.md')], existing: [] });
    expect(sel).toMatchObject({ found: 2, deduped: 0, eligible: 2, dropped: 0 });
    expect(sel.selected.map((c) => c.path)).toEqual(['A.md', 'B.md']);
  });

  test('caps at limit and reports the dropped overflow (no silent cap)', () => {
    const sel = selectVectorTuningCandidates({ candidates: [cand('A.md'), cand('B.md'), cand('C.md')], existing: [], limit: 1 });
    expect(sel.eligible).toBe(3);
    expect(sel.selected).toHaveLength(1);
    expect(sel.dropped).toBe(2);
  });

  test('suppresses an entry already carried by an OPEN vector_tuning proposal (idempotent)', () => {
    const open = buildVectorTuningProposal(gen('A.md', 'I will keep A-ing.'), { id: 'vt-open-1' });
    const sel = selectVectorTuningCandidates({ candidates: [cand('A.md'), cand('B.md')], existing: [open] });
    expect(sel.deduped).toBe(1);                       // A suppressed
    expect(sel.eligible).toBe(1);                      // only B
    expect(sel.selected[0].path).toBe('B.md');
  });

  test('suppresses a DENIED entry (a deny is durable — do not nag)', () => {
    const denied = buildVectorTuningProposal(gen('A.md', 'I will keep A-ing.'), { id: 'vt-denied-1' });
    const deny = { type: 'RESOURCE_DENY', re: 'vt-denied-1' };
    const sel = selectVectorTuningCandidates({ candidates: [cand('A.md')], existing: [denied, deny] });
    expect(sel.deduped).toBe(1);
    expect(sel.selected).toHaveLength(0);
  });

  test('a GRANTED entry is NOT suppressed (the next scan may legitimately re-flag it)', () => {
    const granted = buildVectorTuningProposal(gen('A.md', 'I will keep A-ing.'), { id: 'vt-granted-1' });
    const grant = { type: 'RESOURCE_GRANT', re: 'vt-granted-1' };
    const sel = selectVectorTuningCandidates({ candidates: [cand('A.md')], existing: [granted, grant] });
    expect(sel.deduped).toBe(0);
    expect(sel.selected).toHaveLength(1);
  });
});
