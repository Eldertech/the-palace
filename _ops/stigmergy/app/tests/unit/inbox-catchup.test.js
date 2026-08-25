// inbox-catchup.test.js — voice-rule-6 wire-field propagation through the inbox.
//
// Verifies the three precedence levels for headline/ground:
//   1. Native payload.headline / payload.ground take priority (the rule's
//      intended steady state).
//   2. CATCHUP_OVERRIDES map fills in for legacy requests written before
//      voice rule 6 existed.
//   3. Neither present → fields are null; renderer surfaces the dim
//      "no catchup written" pill and falls back to rationale full-width.
//
// See voice rule 6 in _ops/orchestrator/prompts/shared.md
// and the override map in src/lib/catchup-overrides.js.

import { describe, it, expect, vi, beforeEach } from 'vitest';

const FAKE_OVERRIDES = {
  'legacy-req-001': {
    headline: 'legacy headline from override',
    ground: 'legacy · ground · from override',
  },
};

beforeEach(() => {
  vi.resetModules();
  vi.doMock('../../src/lib/catchup-overrides.js', () => ({
    CATCHUP_OVERRIDES: FAKE_OVERRIDES,
  }));
});

function trickRequest({ id, headline, ground, rationale = 'fallback rationale' }) {
  return {
    type: 'RESOURCE_REQUEST',
    board: 'TRICKSTER',
    request_id: id,
    from: 'Test Project',
    ts: '2026-06-05T19:00:00Z',
    payload: {
      resource: 'directional_decision',
      rationale,
      blocking: false,
      ...(headline !== undefined ? { headline } : {}),
      ...(ground !== undefined ? { ground } : {}),
    },
  };
}

describe('inbox catchup field propagation', () => {
  it('native payload.headline + payload.ground take precedence over overrides', async () => {
    const { buildInbox } = await import('../../src/lib/inbox.js');
    const msgs = [trickRequest({
      id: 'legacy-req-001',  // also has override; the native fields should win
      headline: 'native headline beats override',
      ground: 'native · ground · beats override',
    })];
    const { pending_requests } = buildInbox(msgs);
    expect(pending_requests[0].headline).toBe('native headline beats override');
    expect(pending_requests[0].ground).toBe('native · ground · beats override');
  });

  it('override map fills in when native payload fields are absent', async () => {
    const { buildInbox } = await import('../../src/lib/inbox.js');
    const msgs = [trickRequest({ id: 'legacy-req-001' })];
    const { pending_requests } = buildInbox(msgs);
    expect(pending_requests[0].headline).toBe('legacy headline from override');
    expect(pending_requests[0].ground).toBe('legacy · ground · from override');
  });

  it('returns null when neither native fields nor an override exist', async () => {
    const { buildInbox } = await import('../../src/lib/inbox.js');
    const msgs = [trickRequest({ id: 'no-catchup-anywhere' })];
    const { pending_requests } = buildInbox(msgs);
    expect(pending_requests[0].headline).toBeNull();
    expect(pending_requests[0].ground).toBeNull();
  });

  it('rationale is always passed through unchanged (fold renders it as a fallback)', async () => {
    const { buildInbox } = await import('../../src/lib/inbox.js');
    const msgs = [trickRequest({ id: 'r1', rationale: 'the longform body text' })];
    expect(buildInbox(msgs).pending_requests[0].rationale).toBe('the longform body text');
  });

  it('whitespace-only native fields fall through to override', async () => {
    const { buildInbox } = await import('../../src/lib/inbox.js');
    const msgs = [trickRequest({
      id: 'legacy-req-001',
      headline: '   ',  // empty-after-trim → falls through
      ground: undefined,
    })];
    const { pending_requests } = buildInbox(msgs);
    expect(pending_requests[0].headline).toBe('legacy headline from override');
    expect(pending_requests[0].ground).toBe('legacy · ground · from override');
  });
});

describe('the live overrides cover the eight currently-pending requests', () => {
  it('every queued Trickster card in the standalone page has a catchup override', async () => {
    // Real (un-mocked) module
    vi.doUnmock('../../src/lib/catchup-overrides.js');
    vi.resetModules();
    const { CATCHUP_OVERRIDES } = await import('../../src/lib/catchup-overrides.js');
    const CURRENTLY_QUEUED = [
      'retrospective-delay-steward-009',
      'semantic-delay-steward-007',
      'slime-mold-delay-steward-007',
      'gsl-steward-028',
      'shepard-steward-013',
      'gwl-steward-018',
      'shepard-steward-012',
      'preset-steward-007',
    ];
    for (const id of CURRENTLY_QUEUED) {
      expect(CATCHUP_OVERRIDES[id], `missing override for ${id}`).toBeDefined();
      expect(CATCHUP_OVERRIDES[id].headline.length).toBeGreaterThan(20);
      expect(CATCHUP_OVERRIDES[id].ground.length).toBeGreaterThan(15);
    }
  });
});
