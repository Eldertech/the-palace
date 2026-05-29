// Phase 2 verify gate: the digest renders deterministically from a fixture
// board and the ranking is stable and tested.

import { describe, it, expect } from 'vitest';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readJsonl } from '../../../orchestrator/src/append.js';
import { buildInbox } from '../../src/inbox.js';
import { loadRuleset } from '../../src/ruleset.js';
import { evaluateAll } from '../../src/evaluate.js';
import { buildDigest, renderDigestMarkdown } from '../../src/digest.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIX = (f) => resolve(__dirname, '../fixtures', f);
const ruleset = loadRuleset();

function digestFor(fixture, meta = {}) {
  const board = readJsonl(FIX(fixture));
  const { pending } = buildInbox(board);
  const results = evaluateAll(pending, ruleset);
  return { results, digest: buildDigest(results, { generatedAt: '2026-05-29T00:00:00Z', board: fixture, ...meta }) };
}

describe('mini-board — deterministic ranking by disharmony tier', () => {
  const { digest } = digestFor('mini-board.jsonl');

  it('mb-E (answered) is excluded; the rest are classified', () => {
    const ids = new Set(digest.ranked_escalations.map((e) => e.request_id));
    expect(ids.has('req-E')).toBe(false);
  });

  it('ranks blocking audition first, then blocking stall, then non-blocking audition, then routine fork', () => {
    // mini-board has: req-A blocking audition (T1), req-B blocking stall (T2),
    // req-C non-blocking audition (T3), req-D routine grantable (auto-grant, not escalated),
    // req-F web_search non-blocking → escalate routine (T4).
    const order = digest.ranked_escalations.map((e) => e.request_id);
    const tiers = digest.ranked_escalations.map((e) => e.tier);
    // tiers must be non-decreasing
    for (let i = 1; i < tiers.length; i += 1) expect(tiers[i]).toBeGreaterThanOrEqual(tiers[i - 1]);
    expect(order[0]).toBe('req-A'); // the blocking audition is #1
    expect(digest.ranked_escalations[0].tier).toBe(1);
    expect(digest.ranked_escalations[0].disharmony_signature).toMatch(/stranded|sensory/i);
  });

  it('req-D (non-blocking recommended fork) is auto-granted, not escalated', () => {
    const escIds = new Set(digest.ranked_escalations.map((e) => e.request_id));
    expect(escIds.has('req-D')).toBe(false);
    const grant = digest.auto_decisions.find((d) => d.request_id === 'req-D');
    expect(grant).toBeTruthy();
    expect(grant.verb).toBe('auto-grant');
    expect(grant.option_id).toBe('prototype-faust');
  });

  it('counts add up', () => {
    const c = digest.counts;
    expect(c.escalate + c.auto_grant + c.auto_deny).toBe(c.pending);
  });

  it('ranks are 1..N contiguous', () => {
    digest.ranked_escalations.forEach((e, i) => expect(e.rank).toBe(i + 1));
  });
});

describe('determinism — same board → byte-identical digest', () => {
  it('two builds produce identical JSON and identical markdown', () => {
    const a = digestFor('mini-board.jsonl').digest;
    const b = digestFor('mini-board.jsonl').digest;
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(renderDigestMarkdown(a)).toBe(renderDigestMarkdown(b));
  });
});

describe('real board snapshot — renders without throwing; auditions rank above routine forks', () => {
  const { digest } = digestFor('board-snapshot.jsonl');

  it('produces markdown', () => {
    const md = renderDigestMarkdown(digest);
    expect(md).toContain('Automated Trickster — Escalation Digest');
    expect(md).toContain('Loudon Live · Autodidact Polymaths');
  });

  it('every audition-tier escalation ranks before every routine-fork escalation', () => {
    const ranks = digest.ranked_escalations;
    const lastAuditionRank = Math.max(0, ...ranks.filter((e) => e.tier <= 3).map((e) => e.rank));
    const firstRoutineRank = Math.min(Infinity, ...ranks.filter((e) => e.tier === 4).map((e) => e.rank));
    if (lastAuditionRank > 0 && firstRoutineRank < Infinity) {
      expect(lastAuditionRank).toBeLessThan(firstRoutineRank);
    }
  });

  it('mode defaults to shadow and is reflected in markdown', () => {
    expect(digest.mode).toBe('shadow');
    expect(renderDigestMarkdown(digest)).toMatch(/proposals only/);
  });
});
