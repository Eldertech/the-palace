// Integration test for FILE ALL's grant-building (buildLeanGrants). Asserts
// the right §2.2 grants get built per recommended option, that leanless cards
// are skipped, and that each grant is wire-valid. The sequential POST + 350ms
// pacing is the deck's runtime concern (e2e); this proves the payload contract.

import { describe, it, expect } from 'vitest';
import { buildLeanGrants } from '../../src/lib/trickster-grants.js';
import { validateMessage } from '@stigmergy/core/schema';

// Pending items in the shape buildInbox() produces (only the fields the
// grant builder reads, plus recommended_option from tagRecommendation).
const item = (request_id, recommended_option) => ({
  request_id,
  from: `${request_id}-from`,
  _message_id: `msg-${request_id}`,
  _session_id: `sess-${request_id}`,
  recommended_option,
});

const PENDING = [
  item('apo-001', { id: 'CONFIRM-NEW-VECTOR', label: 'CONFIRM-NEW-VECTOR — yes' }),
  item('gsl-026', null), // "no clear lean" — must be skipped
  item('inharmonic-005', { id: 'ARCHITECTURE-VERIFIED', label: 'ARCHITECTURE-VERIFIED — looks right' }),
  item('shepard-008', null), // leanless — skipped
];

describe('buildLeanGrants — FILE ALL contract', () => {
  it('builds one grant per leaned card and skips the leanless ones', () => {
    const grants = buildLeanGrants(PENDING);
    expect(grants).toHaveLength(2);
    expect(grants.map((g) => g.item.request_id)).toEqual(['apo-001', 'inharmonic-005']);
  });

  it('each grant is a §2.2-valid RESOURCE_GRANT for the recommended option', () => {
    const grants = buildLeanGrants(PENDING);
    for (const { item: it, message } of grants) {
      const result = validateMessage(message);
      expect(result.valid, JSON.stringify(result)).toBe(true);
      expect(message.type).toBe('RESOURCE_GRANT');
      expect(message.re).toBe(it.request_id);
      expect(message.to).toBe(it.from);
      expect(message.payload.option_id).toBe(it.recommended_option.id);
      expect(message.payload.option_label).toBe(it.recommended_option.label);
      expect(message.payload.granted).toBe(true);
    }
  });

  it('returns nothing when no card has a lean', () => {
    const grants = buildLeanGrants([item('a', null), item('b', null)]);
    expect(grants).toEqual([]);
  });

  it('tolerates an empty or missing list', () => {
    expect(buildLeanGrants([])).toEqual([]);
    expect(buildLeanGrants(undefined)).toEqual([]);
  });

  it('produces distinct message ids across the batch', () => {
    const grants = buildLeanGrants(PENDING);
    const ids = new Set(grants.map((g) => g.message.id));
    expect(ids.size).toBe(grants.length);
  });
});
