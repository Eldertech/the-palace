// Stage F Phase 0 verify gate: candidate selection identifies the eligible set
// (sensory OR rec=n, build-both shaped) and the two options per eligible fork,
// and excludes verdict forks and non-triggers.

import { describe, it, expect } from 'vitest';
import { classifyOption, triggerCategory, selectTwoPaths } from '../../src/two-paths.js';

const opt = (id, label = id) => ({ id, label });

// A parsed-request-ish shape with just the fields the selector reads.
function req({ options = [], steward_recommendation = null } = {}) {
  return { request_id: 'r', from: 'X', options, steward_recommendation };
}
const sensoryVerdict = { verb: 'escalate', hardGate: true, gateKind: 'audition' };
const escalateVerdict = { verb: 'escalate' };
const grantVerdict = { verb: 'auto-grant' };

describe('classifyOption', () => {
  it('meta: YOU-* family and defer/hold/redirect', () => {
    expect(classifyOption(opt('YOU-DEFINE'))).toBe('meta');
    expect(classifyOption(opt('YOU-DECIDE'))).toBe('meta');
    expect(classifyOption(opt('DEFER'))).toBe('meta');
    expect(classifyOption(opt('HOLD-LET-ME-READ-FIRST'))).toBe('meta');
    expect(classifyOption(opt('REDIRECT'))).toBe('meta');
  });
  it('approve / reject verdict tokens (anywhere in the id)', () => {
    expect(classifyOption(opt('APPROVE-RENDER-TWELVE'))).toBe('approve');
    expect(classifyOption(opt('ARCHITECTURE-VERIFIED'))).toBe('approve');
    expect(classifyOption(opt('REJECT-RECIPE'))).toBe('reject');
    expect(classifyOption(opt('COULDNT-RUN-IT'))).toBe('reject');
    expect(classifyOption(opt('WRONG-AUDITION-UNIT'))).toBe('reject');
  });
  it('concrete: a genuine buildable path', () => {
    expect(classifyOption(opt('K-SWEEP'))).toBe('concrete');
    expect(classifyOption(opt('DUAL-SWEEP'))).toBe('concrete');
    expect(classifyOption(opt('PLAY-AND-EXTEND'))).toBe('concrete');
  });
});

describe('triggerCategory', () => {
  it('sensory when the audition hard gate fired', () => {
    expect(triggerCategory(req({ options: [opt('A'), opt('B')] }), sensoryVerdict)).toBe('sensory');
  });
  it('rec_n when escalated with options and no recommendation', () => {
    expect(triggerCategory(req({ options: [opt('A'), opt('B')] }), escalateVerdict)).toBe('rec_n');
  });
  it('null when the steward gave a recommendation (not torn)', () => {
    expect(triggerCategory(req({ options: [opt('A'), opt('B')], steward_recommendation: 'A — go' }), escalateVerdict)).toBe(null);
  });
  it('null when not escalated', () => {
    expect(triggerCategory(req({ options: [opt('A'), opt('B')] }), grantVerdict)).toBe(null);
  });
});

describe('selectTwoPaths — eligible cases', () => {
  it('sensory build-both fork (apo-004 K-SWEEP/DUAL-SWEEP/AB-CLIPS/COMPILE-FIRST)', () => {
    const r = req({ options: ['K-SWEEP', 'DUAL-SWEEP', 'AB-CLIPS', 'COMPILE-FIRST'].map((id) => opt(id)) });
    const tp = selectTwoPaths({ request: r, verdict: sensoryVerdict });
    expect(tp.eligible).toBe(true);
    expect(tp.category).toBe('sensory');
    expect(tp.shape).toBe('build-both');
    expect(tp.options.map((o) => o.id)).toEqual(['K-SWEEP', 'DUAL-SWEEP']);
    expect(tp.borderline).toBe(false);
  });

  it('rec=n directional fork (slime-mold PLAY-AND-EXTEND/STATIC-PROOF/AUDIO-SKETCH/YOU-DEFINE)', () => {
    const r = req({ options: ['PLAY-AND-EXTEND', 'STATIC-PROOF', 'AUDIO-SKETCH', 'YOU-DEFINE'].map((id) => opt(id)) });
    const tp = selectTwoPaths({ request: r, verdict: escalateVerdict });
    expect(tp.eligible).toBe(true);
    expect(tp.category).toBe('rec_n');
    expect(tp.options.map((o) => o.id)).toEqual(['PLAY-AND-EXTEND', 'STATIC-PROOF']);
  });

  it('greenlight-variant fork falls back to non-meta pool and is flagged borderline', () => {
    // retrospective-007: all concrete options are approve-flavoured (GREENLIGHT-*)
    // but each names a distinct build; no reject present → not a verdict fork.
    const r = req({ options: [
      'GREENLIGHT-MAKER-RECOMMENDED', 'GREENLIGHT-CHEAP-AND-LOCAL',
      'GREENLIGHT-ASSETS-1-4-ONLY', 'HOLD-LET-ME-READ-FIRST', 'REDIRECT',
    ].map((id) => opt(id)) });
    const tp = selectTwoPaths({ request: r, verdict: escalateVerdict });
    expect(tp.eligible).toBe(true);
    expect(tp.options.map((o) => o.id)).toEqual(['GREENLIGHT-MAKER-RECOMMENDED', 'GREENLIGHT-CHEAP-AND-LOCAL']);
    expect(tp.borderline).toBe(true);
  });
});

describe('selectTwoPaths — ineligible cases', () => {
  it('verdict fork (approve + reject present) is excluded', () => {
    const r = req({ options: ['APPROVE-RENDER-TWELVE', 'ADJUST-ENVELOPE', 'ADJUST-STACK', 'REJECT-RECIPE'].map((id) => opt(id)) });
    const tp = selectTwoPaths({ request: r, verdict: sensoryVerdict });
    expect(tp.eligible).toBe(false);
    expect(tp.category).toBe('sensory');
    expect(tp.reason).toMatch(/verdict fork/i);
  });

  it('non-trigger (recommended, non-sensory) is excluded', () => {
    const r = req({ options: [opt('A'), opt('B')], steward_recommendation: 'A — go' });
    const tp = selectTwoPaths({ request: r, verdict: escalateVerdict });
    expect(tp.eligible).toBe(false);
    expect(tp.category).toBe(null);
  });

  it('too few concrete options after excluding meta', () => {
    const r = req({ options: ['BUILD-IT', 'YOU-DEFINE', 'DEFER'].map((id) => opt(id)) });
    const tp = selectTwoPaths({ request: r, verdict: escalateVerdict });
    expect(tp.eligible).toBe(false);
    expect(tp.reason).toMatch(/too few/i);
  });
});
