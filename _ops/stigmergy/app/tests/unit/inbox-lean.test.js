// Tests for the Phase-2 steward-lean detector (inbox.tagRecommendation) and
// its wiring through buildInbox(). The detector infers the steward's
// recommended option from prose until voice-rule-7 adds a real schema flag.

import { describe, it, expect } from 'vitest';
import { tagRecommendation, buildInbox } from '../../src/lib/inbox.js';

describe('tagRecommendation — label markers (pass 1)', () => {
  it('tags the option whose label carries (recommended) — the live convention', () => {
    const opts = [
      { id: 'A', label: 'A — do the thing' },
      { id: 'B', label: 'B — do the other thing (recommended)' },
    ];
    const out = tagRecommendation(opts, {});
    expect(out.leanSource).toBe('label');
    expect(out.recommendedOption).toEqual({ id: 'B', label: 'B — do the other thing (recommended)' });
    expect(out.options[1].recommended).toBe(true);
    expect(out.options[0].recommended).toBeUndefined();
  });

  it('honors the rarer markers too — (expected), (my lean), (my pick)', () => {
    for (const marker of ['(expected)', '(my lean)', '(my pick)']) {
      const opts = [{ id: 'X', label: 'X — go' }, { id: 'Y', label: `Y — wait ${marker}` }];
      const out = tagRecommendation(opts, {});
      expect(out.recommendedOption.id, marker).toBe('Y');
      expect(out.leanSource, marker).toBe('label');
    }
  });

  it('does not false-match a bare word like RECOMMENDED without parens', () => {
    const opts = [{ id: 'GREENLIGHT-MAKER-RECOMMENDED', label: 'GREENLIGHT-MAKER-RECOMMENDED — go' }];
    const out = tagRecommendation(opts, {});
    expect(out.recommendedOption).toBe(null);
  });
});

describe('tagRecommendation — ground/rationale cross-reference (pass 2)', () => {
  it('matches "steward leans X" to the option whose id is X', () => {
    const opts = [{ id: 'SHIP', label: 'SHIP — ship it' }, { id: 'TWEAK', label: 'TWEAK — adjust' }];
    const out = tagRecommendation(opts, { ground: 'still working · steward leans TWEAK' });
    expect(out.leanSource).toBe('ground');
    expect(out.recommendedOption.id).toBe('TWEAK');
  });

  it('matches "steward expects X" as well', () => {
    const opts = [{ id: 'CONFIRM-NEW-VECTOR', label: 'CONFIRM-NEW-VECTOR — yes' }, { id: 'REVERT', label: 'REVERT — no' }];
    const out = tagRecommendation(opts, { ground: 'pre-flight halt · steward expects CONFIRM-NEW-VECTOR' });
    expect(out.recommendedOption.id).toBe('CONFIRM-NEW-VECTOR');
  });

  it('falls back to a label that starts with the token when no id matches', () => {
    const opts = [{ id: 'a', label: 'AUDITION-PASS — listen first' }, { id: 'b', label: 'EXPAND — to 24' }];
    const out = tagRecommendation(opts, { ground: 'steward leans AUDITION-PASS' });
    expect(out.recommendedOption.label).toMatch(/^AUDITION-PASS/);
  });

  it('leaves a "no clear lean" card leanless on purpose', () => {
    const opts = [{ id: 'A', label: 'A — one' }, { id: 'B', label: 'B — two' }];
    const out = tagRecommendation(opts, { ground: 'paused on your ears · no clear lean' });
    expect(out.recommendedOption).toBe(null);
    expect(out.leanSource).toBe(null);
  });

  it('does not mistake "two stewards rendezvoused" for a lean', () => {
    const opts = [{ id: 'A', label: 'A — one' }];
    const out = tagRecommendation(opts, { ground: 'two stewards rendezvoused · no clear lean' });
    expect(out.recommendedOption).toBe(null);
  });
});

describe('tagRecommendation — precedence and edges', () => {
  it('label marker wins over ground prose', () => {
    const opts = [{ id: 'A', label: 'A — one (recommended)' }, { id: 'B', label: 'B — two' }];
    const out = tagRecommendation(opts, { ground: 'steward leans B' });
    expect(out.recommendedOption.id).toBe('A');
    expect(out.leanSource).toBe('label');
  });

  it('returns null lean for an empty or missing options list', () => {
    expect(tagRecommendation(null, {}).recommendedOption).toBe(null);
    expect(tagRecommendation([], {}).recommendedOption).toBe(null);
  });
});

describe('buildInbox — lean fields on pending items', () => {
  const REQ = (over = {}) => ({
    schema_version: '1.0',
    id: 'msg-1',
    request_id: 'steward-001',
    ts: '2026-06-03T09:00:00Z',
    session_id: 'sess-1',
    from: 'STEWARD',
    to: 'TRICKSTER',
    type: 'RESOURCE_REQUEST',
    board: 'TRICKSTER',
    health: { score: 'green', context_pct: 0.3 },
    payload: {
      resource: 'ear_check',
      ground: 'still working · steward leans TWEAK',
      options: [
        { id: 'SHIP', label: 'SHIP — ship it' },
        { id: 'TWEAK', label: 'TWEAK — adjust' },
      ],
      ...over,
    },
  });

  it('exposes recommended_option + lean_source from ground prose', () => {
    const { pending_requests } = buildInbox([REQ()]);
    expect(pending_requests).toHaveLength(1);
    expect(pending_requests[0].recommended_option.id).toBe('TWEAK');
    expect(pending_requests[0].lean_source).toBe('ground');
  });

  it('prefers a (recommended) label over ground', () => {
    const { pending_requests } = buildInbox([REQ({
      ground: 'steward leans TWEAK',
      options: [
        { id: 'SHIP', label: 'SHIP — ship it (recommended)' },
        { id: 'TWEAK', label: 'TWEAK — adjust' },
      ],
    })]);
    expect(pending_requests[0].recommended_option.id).toBe('SHIP');
    expect(pending_requests[0].lean_source).toBe('label');
  });

  it('a leanless request reports recommended_option: null', () => {
    const { pending_requests } = buildInbox([REQ({ ground: 'no clear lean' })]);
    expect(pending_requests[0].recommended_option).toBe(null);
  });
});
