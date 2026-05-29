import { describe, it, expect } from 'vitest';
import {
  summarizeDigest, tierGroups, autoDecisions, isShadow, DIGEST_API_PATH,
} from '../../src/lib/digest-view.js';

const sample = {
  schema: 'trickster-auto-digest/0.1',
  mode: 'shadow',
  generated_at: '2026-05-29T00:00:00Z',
  counts: { pending: 5, escalate: 3, auto_grant: 2, auto_deny: 0 },
  ranked_escalations: [
    { rank: 1, tier: 1, tier_label: 'Blocking audition', disharmony_signature: 'sig1', request_id: 'a' },
    { rank: 2, tier: 1, tier_label: 'Blocking audition', disharmony_signature: 'sig1', request_id: 'b' },
    { rank: 3, tier: 4, tier_label: 'Routine directional fork', disharmony_signature: 'sig4', request_id: 'c' },
  ],
  auto_decisions: [
    { request_id: 'd', verb: 'auto-grant', option_id: 'X' },
    { request_id: 'e', verb: 'auto-grant', option_id: 'Y' },
  ],
};

describe('digest-view helpers', () => {
  it('summarizeDigest pulls counts and mode', () => {
    const s = summarizeDigest(sample);
    expect(s.pending).toBe(5);
    expect(s.escalate).toBe(3);
    expect(s.autoGrant).toBe(2);
    expect(s.mode).toBe('shadow');
  });

  it('summarizeDigest is null-safe', () => {
    expect(summarizeDigest(null)).toBe(null);
    expect(summarizeDigest('nope')).toBe(null);
  });

  it('tierGroups groups consecutive tiers preserving rank order', () => {
    const g = tierGroups(sample);
    expect(g.length).toBe(2);
    expect(g[0].tier).toBe(1);
    expect(g[0].items.map((i) => i.request_id)).toEqual(['a', 'b']);
    expect(g[1].tier).toBe(4);
    expect(g[1].items[0].request_id).toBe('c');
  });

  it('tierGroups is empty-safe', () => {
    expect(tierGroups({})).toEqual([]);
    expect(tierGroups(null)).toEqual([]);
  });

  it('autoDecisions returns the list', () => {
    expect(autoDecisions(sample).length).toBe(2);
    expect(autoDecisions(null)).toEqual([]);
  });

  it('isShadow true unless mode==="live"', () => {
    expect(isShadow(sample)).toBe(true);
    expect(isShadow({ mode: 'live' })).toBe(false);
    expect(isShadow(null)).toBe(true);
  });

  it('DIGEST_API_PATH points at the trickster-auto digest via the palace-file route', () => {
    expect(DIGEST_API_PATH).toContain('/api/file?path=');
    expect(decodeURIComponent(DIGEST_API_PATH)).toContain('_ops/stigmergy/trickster-auto/digest-latest.json');
  });
});
