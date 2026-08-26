// Regression tests for the read/write wire drift found on the live persistent
// board (2026-08-25). Every case here is drawn from a real message that the
// deck mis-rendered or could not clear — the validator passed all of them,
// because it checks the ENVELOPE and never the payload shape.
import { describe, test, expect } from 'vitest';
import { buildInbox, tagRecommendation, renderRationale, deriveKind } from '../../src/lib/inbox.js';
import { buildCardGrant } from '../../src/lib/trickster-grants.js';

const base = (extras = {}) => ({
  schema_version: '1.0', id: 'req-1', ts: '2026-07-05T23:15:24.378Z',
  session_id: 's', from: 'Sam Maloof', to: 'TRICKSTER',
  type: 'RESOURCE_REQUEST', board: 'TRICKSTER',
  health: { context_pct: 0.5, score: 'green', model: 'a' },
  payload: { blocking: true, rationale: 'r' },
  ...extras,
});

describe('correlation: a request with no top-level request_id', () => {
  const req = base(); // note: NO request_id — the Shopkeeper / Sam Maloof shape

  test('appears on the deck while unanswered', () => {
    expect(buildInbox([req]).pending_requests).toHaveLength(1);
  });

  test('a grant filed from its own card CLEARS it (was an unclearable zombie)', () => {
    const [item] = buildInbox([req]).pending_requests;
    const grant = buildCardGrant(item, { optionId: 'hold', optionLabel: 'Hold' });
    expect(grant.re).toBe('req-1'); // the write path falls back to the message id
    expect(buildInbox([req, grant]).pending_requests).toHaveLength(0);
  });

  test('exposes a usable key, so two such cards never share a selection slot', () => {
    const other = base({ id: 'req-2', from: 'Shopkeeper' });
    const ids = buildInbox([req, other]).pending_requests.map((p) => p.request_id);
    expect(ids).toEqual(expect.arrayContaining(['req-1', 'req-2']));
    expect(new Set(ids).size).toBe(2);
  });
});

describe('options[] written as option_id', () => {
  test('renders the real choices instead of the generic Grant/Deny template', () => {
    const req = base({
      request_id: 'r1',
      payload: {
        blocking: true,
        question: 'Commit the deposit candidate, or hold?',
        options: [
          { option_id: 'commit', label: 'Commit — place the deposit prose now' },
          { option_id: 'hold', label: 'Hold — leave it on the board' },
        ],
      },
    });
    const [item] = buildInbox([req]).pending_requests;
    expect(item.options.map((o) => o.id)).toEqual(['commit', 'hold']);
    expect(item.headline).toBe('Commit the deposit candidate, or hold?');
  });
});

describe('lean phrasings that stewards actually write', () => {
  const opts = [{ id: 'HARDEN', label: 'HARDEN' }, { id: 'JUMP', label: 'JUMP' }];
  const leanOf = (ground) => tagRecommendation(opts, { ground }).recommendedOption?.id ?? null;

  test.each([
    ['still working · lean: HARDEN', 'HARDEN'],
    ['I lean HARDEN (only you can do it)', 'HARDEN'],
    ['My lean is HARDEN first — add an example column', 'HARDEN'],
    ['steward leans HARDEN', 'HARDEN'],
    ['steward expects HARDEN', 'HARDEN'],
  ])('%s → %s', (ground, expected) => {
    expect(leanOf(ground)).toBe(expected);
  });

  test.each([
    'paused on your ears · no clear lean',
    'no lean — this one is yours',
  ])('stays leanless: %s', (ground) => {
    expect(leanOf(ground)).toBeNull();
  });
});

describe('a multi-question sweep (decisions_needed[])', () => {
  test('its questions are readable rather than silently dropped', () => {
    const req = base({
      from: 'Shopkeeper',
      payload: {
        summary: '2026-06-23 sweep complete.',
        decisions_needed: [
          { id: 'd1', question: 'Approve the stub as-is?', file: 'Shop/Image-to-3D Smith.md' },
          { id: 'd2', question: 'Hi3DGen or Hunyuan3D-2 as primary?', note: 'Hi3DGen is watertight' },
        ],
      },
    });
    const [item] = buildInbox([req]).pending_requests;
    expect(item.headline).toBe('2026-06-23 sweep complete.');
    expect(item.rationale).toContain('Hi3DGen or Hunyuan3D-2 as primary?');
    expect(item.rationale).toContain('2 decisions needed');
  });

  test('asks to be opened interactively — several tangled forks are a conversation, not a card', () => {
    const req = base({
      from: 'Shopkeeper',
      payload: {
        summary: 'sweep complete',
        decisions_needed: [
          { id: 'd1', question: 'Approve the stub as-is?' },
          { id: 'd2', question: 'Hi3DGen or Hunyuan3D-2 as primary?' },
        ],
      },
    });
    const [item] = buildInbox([req]).pending_requests;
    expect(item.kind).toBe('interactive_session');
  });

  test('a SINGLE question stays an ordinary card — freetext answers that fine', () => {
    expect(deriveKind({ decisions_needed: [{ question: 'Approve the stub?' }] })).toBeNull();
  });

  test('an explicit payload.kind always wins over the derivation', () => {
    expect(deriveKind({ kind: 'something_else', decisions_needed: [{ question: 'a' }, { question: 'b' }] }))
      .toBe('something_else');
  });

  test('forks that DO have clickable options stay a card', () => {
    expect(deriveKind({
      decisions_needed: [{ question: 'a' }, { question: 'b' }],
      options: [{ id: 'YES', label: 'YES' }],
    })).toBeNull();
  });

  test('renderRationale leaves an ordinary rationale untouched', () => {
    expect(renderRationale({ rationale: 'just the why' })).toBe('just the why');
    expect(renderRationale({})).toBeUndefined();
  });
});
