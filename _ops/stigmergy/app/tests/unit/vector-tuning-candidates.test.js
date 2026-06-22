// Unit: findVectorTuningCandidates + vectorTuningReasons — the cheap mechanical
// pre-filter that decides which entries are worth a generation.

import { describe, test, expect } from 'vitest';
import { vectorTuningReasons, findVectorTuningCandidates } from '../../src/lib/vector-tuning-candidates.js';

const entry = (path, forward_vector, extra = {}) => ({
  path, title: path.replace(/\.md$/, ''), type: 'concept', stage: 'growing', forward_vector, ...extra,
});

// A healthy striving vector: first-person, >12 words, no rest-verb.
const HEALTHY = 'I will keep coupling oscillators across domains until learners feel phase-lock in their own hands and teach it onward.';

describe('vectorTuningReasons', () => {
  test('flags a missing vector', () => {
    expect(vectorTuningReasons({ forward_vector: null })).toEqual(['missing']);
    expect(vectorTuningReasons({ forward_vector: '   ' })).toEqual(['missing']);
  });
  test('flags a stasis-verb vector', () => {
    expect(vectorTuningReasons({ forward_vector: 'I remain the canonical definition of Kuramoto coupling for the whole palace to reference.' }))
      .toContain('stasis');
  });
  test('flags a thin (too-short) vector', () => {
    expect(vectorTuningReasons({ forward_vector: 'I am Kuramoto.' })).toEqual(['thin']);
  });
  test('a thin stasis vector carries both reasons', () => {
    expect(vectorTuningReasons({ forward_vector: 'I remain here.' }).sort()).toEqual(['stasis', 'thin']);
  });
  test('a healthy striving vector is not flagged', () => {
    expect(vectorTuningReasons({ forward_vector: HEALTHY })).toEqual([]);
  });
  test('does not flag legitimate striving phrasings ("keep ...-ing")', () => {
    // "keep" / "continue ...-ing" is the substitution the rule asks for, not stasis.
    expect(vectorTuningReasons({ forward_vector: 'I will keep teaching coupling and continue refining the patch with every new learner I meet.' }))
      .toEqual([]);
  });
});

describe('findVectorTuningCandidates', () => {
  test('returns only the entries that want tuning, healthy ones excluded', () => {
    const out = findVectorTuningCandidates([
      entry('Healthy.md', HEALTHY),
      entry('Stasis.md', 'I remain the placeholder definition that this entry keeps for the palace to point at.'),
      entry('Thin.md', 'I am thin.'),
      entry('Missing.md', null),
    ]);
    const paths = out.map((c) => c.path);
    expect(paths).not.toContain('Healthy.md');
    expect(paths).toEqual(expect.arrayContaining(['Stasis.md', 'Thin.md', 'Missing.md']));
  });

  test('ranks missing > stasis > thin', () => {
    const out = findVectorTuningCandidates([
      entry('Thin.md', 'I am thin.'),
      entry('Missing.md', null),
      entry('Stasis.md', 'I remain the canonical definition of this concept for everyone in the palace to reference.'),
    ]);
    expect(out.map((c) => c.path)).toEqual(['Missing.md', 'Stasis.md', 'Thin.md']);
  });

  test('skips meta entries and foundational-stage entries (the skeleton)', () => {
    const out = findVectorTuningCandidates([
      entry('Schema.md', null, { type: 'meta' }),
      entry('Claude.md', null, { type: 'meta', stage: 'foundational' }),
      entry('Readme.md', 'I am short.', { stage: 'foundational' }),
      entry('Real.md', null),
    ]);
    expect(out.map((c) => c.path)).toEqual(['Real.md']);
  });

  test('excludes non-entry frontmatter -- a type outside the §1 ontology, or none', () => {
    const out = findVectorTuningCandidates([
      entry('Prompt.md', null, { type: 'agent-prompt' }), // _ops machinery prompt, not an entry
      entry('Baton.md', null, { type: null }),            // a bundle file (no §1 type)
      entry('Real.md', null),                             // a genuine concept entry
    ]);
    expect(out.map((c) => c.path)).toEqual(['Real.md']);
  });

  test('carries the current vector + reasons through', () => {
    const [c] = findVectorTuningCandidates([entry('Stasis.md', 'I remain the record of X for all to see and reference forever in the palace.')]);
    expect(c.currentVector).toMatch(/^I remain the record/);
    expect(c.reasons).toContain('stasis');
  });
});
