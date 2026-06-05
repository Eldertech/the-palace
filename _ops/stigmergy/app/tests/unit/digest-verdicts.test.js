import { describe, it, expect } from 'vitest';
import {
  PROMO_MIN, PROPOSED_VERBS, validateVerdict, dedupeLatest, matchStats, matchStatsForRun, formatCopyForClaude,
} from '../../src/lib/digest-verdicts.js';

function v(over = {}) {
  return {
    id: 'v-test-' + (over.id || '0'),
    ts: over.ts || '2026-06-05T13:20:00.000Z',
    run_generated_at: over.run_generated_at || '2026-06-05T04:43:11.359Z',
    request_id: over.request_id || 'req-1',
    rule_id: over.rule_id || 'grant-nonblocking-recommended-fork',
    from: over.from || 'Some Steward',
    proposed_verb: over.proposed_verb || 'auto-grant',
    agree: over.agree === undefined ? true : over.agree,
    would_do: over.would_do === undefined ? null : over.would_do,
    note: over.note === undefined ? '' : over.note,
  };
}

describe('PROMO_MIN', () => {
  it('exports the seed threshold of 8', () => {
    expect(PROMO_MIN).toBe(8);
  });
});

describe('validateVerdict', () => {
  it('accepts a complete agree record', () => {
    expect(validateVerdict(v()).valid).toBe(true);
  });

  it('accepts a differ record with would_do', () => {
    expect(validateVerdict(v({ agree: false, would_do: 'TWEAK-PARAMS' })).valid).toBe(true);
  });

  it('accepts a differ record with note only', () => {
    expect(validateVerdict(v({ agree: false, note: 'I would have escalated' })).valid).toBe(true);
  });

  it('rejects a differ record with neither would_do nor note', () => {
    const r = validateVerdict(v({ agree: false, would_do: null, note: '' }));
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => /would_do or note/.test(e.message))).toBe(true);
  });

  it('rejects id without v- prefix', () => {
    const r = validateVerdict({ ...v(), id: 'bad-id' });
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.path === 'id')).toBe(true);
  });

  it('rejects a non-enum proposed_verb', () => {
    const r = validateVerdict({ ...v(), proposed_verb: 'shrug' });
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.path === 'proposed_verb')).toBe(true);
  });

  it('rejects non-boolean agree', () => {
    const r = validateVerdict({ ...v(), agree: 'yes' });
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.path === 'agree')).toBe(true);
  });

  it('rejects missing required string fields', () => {
    const r = validateVerdict({ ...v(), rule_id: '' });
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.path === 'rule_id')).toBe(true);
  });

  it('rejects null record', () => {
    expect(validateVerdict(null).valid).toBe(false);
  });

  it('PROPOSED_VERBS lists the engine verbs', () => {
    expect(PROPOSED_VERBS).toEqual(['auto-grant', 'auto-deny', 'escalate']);
  });
});

describe('dedupeLatest', () => {
  it('collapses re-marks within the same run, keeping latest by ts', () => {
    const a = v({ id: '1', request_id: 'r1', ts: '2026-06-05T10:00:00Z', agree: false, would_do: 'X' });
    const b = v({ id: '2', request_id: 'r1', ts: '2026-06-05T11:00:00Z', agree: true });
    const deduped = dedupeLatest([a, b]);
    expect(deduped.length).toBe(1);
    expect(deduped[0].id).toBe('v-test-2');
    expect(deduped[0].agree).toBe(true);
  });

  it('keeps records for the same request_id from DIFFERENT runs', () => {
    const a = v({ id: '1', request_id: 'r1', run_generated_at: '2026-06-01T00:00:00Z' });
    const b = v({ id: '2', request_id: 'r1', run_generated_at: '2026-06-03T00:00:00Z' });
    expect(dedupeLatest([a, b]).length).toBe(2);
  });

  it('returns [] for non-array input', () => {
    expect(dedupeLatest(null)).toEqual([]);
    expect(dedupeLatest('nope')).toEqual([]);
  });
});

describe('matchStats — overall', () => {
  it('counts marked and agree, computes rate', () => {
    const verdicts = [
      v({ id: '1', request_id: 'a', agree: true }),
      v({ id: '2', request_id: 'b', agree: true }),
      v({ id: '3', request_id: 'c', agree: false, would_do: 'X' }),
    ];
    const s = matchStats(verdicts);
    expect(s.overall.marked).toBe(3);
    expect(s.overall.agree).toBe(2);
    expect(s.overall.rate).toBeCloseTo(2 / 3, 5);
  });

  it('empty input yields zeroed overall + empty byRule', () => {
    const s = matchStats([]);
    expect(s.overall).toEqual({ marked: 0, agree: 0, rate: 0 });
    expect(s.byRule).toEqual({});
  });
});

describe('matchStats — byRule', () => {
  it('splits by rule_id and computes per-rule rate', () => {
    const verdicts = [
      v({ id: '1', request_id: 'a', rule_id: 'rule-A', agree: true }),
      v({ id: '2', request_id: 'b', rule_id: 'rule-A', agree: false, would_do: 'X' }),
      v({ id: '3', request_id: 'c', rule_id: 'rule-B', agree: true }),
    ];
    const s = matchStats(verdicts);
    expect(s.byRule['rule-A']).toMatchObject({ marked: 2, agree: 1 });
    expect(s.byRule['rule-A'].rate).toBeCloseTo(0.5, 5);
    expect(s.byRule['rule-B']).toMatchObject({ marked: 1, agree: 1, rate: 1 });
  });
});

describe('matchStats — promotionReady threshold', () => {
  function nAgrees(ruleId, n) {
    return Array.from({ length: n }, (_, i) =>
      v({ id: 'x' + i, request_id: 'r' + i, rule_id: ruleId, agree: true })
    );
  }

  it('rule with PROMO_MIN-1 agrees is NOT ready', () => {
    const s = matchStats(nAgrees('grant-nonblocking-recommended-fork', PROMO_MIN - 1));
    expect(s.byRule['grant-nonblocking-recommended-fork'].promotionReady).toBe(false);
  });

  it('rule with exactly PROMO_MIN agrees IS ready', () => {
    const s = matchStats(nAgrees('grant-nonblocking-recommended-fork', PROMO_MIN));
    expect(s.byRule['grant-nonblocking-recommended-fork'].promotionReady).toBe(true);
  });

  it('rule with PROMO_MIN marks but one differ is NOT ready', () => {
    const verdicts = [
      ...nAgrees('grant-nonblocking-recommended-fork', PROMO_MIN - 1),
      v({ id: 'x99', request_id: 'r99', rule_id: 'grant-nonblocking-recommended-fork',
          agree: false, would_do: 'TWEAK' }),
    ];
    const s = matchStats(verdicts);
    expect(s.byRule['grant-nonblocking-recommended-fork'].marked).toBe(PROMO_MIN);
    expect(s.byRule['grant-nonblocking-recommended-fork'].promotionReady).toBe(false);
  });

  it('HARD-GATE:audition is NEVER ready even with PROMO_MIN agrees', () => {
    const s = matchStats(nAgrees('HARD-GATE:audition', PROMO_MIN));
    expect(s.byRule['HARD-GATE:audition'].marked).toBe(PROMO_MIN);
    expect(s.byRule['HARD-GATE:audition'].agree).toBe(PROMO_MIN);
    expect(s.byRule['HARD-GATE:audition'].promotionReady).toBe(false);
  });
});

describe('matchStatsForRun', () => {
  it('returns zeroed stats when runId is falsy', () => {
    const s = matchStatsForRun([v()], null);
    expect(s.overall).toEqual({ marked: 0, agree: 0, rate: 0 });
  });

  it('filters to verdicts with matching run_generated_at', () => {
    const RUN_A = '2026-06-01T00:00:00Z';
    const RUN_B = '2026-06-03T00:00:00Z';
    const verdicts = [
      v({ id: '1', request_id: 'a', run_generated_at: RUN_A, agree: true }),
      v({ id: '2', request_id: 'b', run_generated_at: RUN_A, agree: false, would_do: 'X' }),
      v({ id: '3', request_id: 'c', run_generated_at: RUN_B, agree: true }),
    ];
    const sA = matchStatsForRun(verdicts, RUN_A);
    expect(sA.overall.marked).toBe(2);
    expect(sA.overall.agree).toBe(1);
    const sB = matchStatsForRun(verdicts, RUN_B);
    expect(sB.overall.marked).toBe(1);
    expect(sB.overall.agree).toBe(1);
  });

  it('respects audition-never-ready within a single run', () => {
    const RUN = '2026-06-03T00:00:00Z';
    const auditions = Array.from({ length: PROMO_MIN }, (_, i) =>
      v({ id: 'a' + i, request_id: 'r' + i, run_generated_at: RUN,
          rule_id: 'HARD-GATE:audition', agree: true })
    );
    const s = matchStatsForRun(auditions, RUN);
    expect(s.byRule['HARD-GATE:audition'].marked).toBe(PROMO_MIN);
    expect(s.byRule['HARD-GATE:audition'].promotionReady).toBe(false);
  });
});

describe('formatCopyForClaude', () => {
  const RUN = '2026-06-03T05:14:15.003Z';
  // Fixed verdict set — same input must yield byte-identical output.
  const fixture = [
    v({ id: '1', ts: '2026-06-05T10:00:00Z', run_generated_at: RUN,
        request_id: 'req-aaa', rule_id: 'grant-nonblocking-recommended-fork',
        from: 'Wavetable Steward', proposed_verb: 'auto-grant', agree: true }),
    v({ id: '2', ts: '2026-06-05T10:01:00Z', run_generated_at: RUN,
        request_id: 'req-bbb', rule_id: 'grant-nonblocking-recommended-fork',
        from: 'Wavetable Steward', proposed_verb: 'auto-grant', agree: true }),
    v({ id: '3', ts: '2026-06-05T10:02:00Z', run_generated_at: RUN,
        request_id: 'req-ccc', rule_id: 'HARD-GATE:audition',
        from: 'Shepard Steward', proposed_verb: 'escalate',
        agree: false, would_do: 'APPROVE-RENDER-TWELVE', note: '' }),
    v({ id: '4', ts: '2026-06-05T10:03:00Z', run_generated_at: RUN,
        request_id: 'req-ddd', rule_id: 'default-no-match',
        from: 'Torus Steward', proposed_verb: 'escalate',
        agree: false, would_do: null, note: 'too noisy a fork to escalate' }),
  ];

  it('produces deterministic output for the same input', () => {
    const a = formatCopyForClaude(fixture, { runId: RUN });
    const b = formatCopyForClaude(fixture, { runId: RUN });
    expect(a).toBe(b);
  });

  it('includes header + runId + overall + per-rule + disagreements sections', () => {
    const out = formatCopyForClaude(fixture, { runId: RUN });
    expect(out).toContain('STIGMERGY — Trickster Alignment Tuning Bundle');
    expect(out).toContain('Latest digest run: ' + RUN);
    expect(out).toContain('OVERALL');
    expect(out).toContain('marked: 4');
    expect(out).toContain('agree: 2');
    expect(out).toContain('PER-RULE');
    expect(out).toContain('grant-nonblocking-recommended-fork');
    expect(out).toContain('HARD-GATE:audition');
    expect(out).toContain('default-no-match');
    expect(out).toContain('DISAGREEMENTS (2)');
  });

  it('sorts rules alphabetically and disagreements by request_id', () => {
    const out = formatCopyForClaude(fixture, { runId: RUN });
    // Rule order in PER-RULE: default-no-match, grant-..., HARD-GATE:audition
    const idxDefault = out.indexOf('default-no-match');
    const idxGrant = out.indexOf('grant-nonblocking-recommended-fork');
    const idxAudition = out.indexOf('HARD-GATE:audition');
    // case-sensitive alpha: 'H' (0x48) < 'd' (0x64) < 'g' (0x67)
    expect(idxAudition).toBeGreaterThan(0);
    expect(idxAudition).toBeLessThan(idxDefault);
    expect(idxDefault).toBeLessThan(idxGrant);
    // Disagreement order: req-ccc before req-ddd
    const idxCcc = out.indexOf('req-ccc');
    const idxDdd = out.indexOf('req-ddd');
    expect(idxCcc).toBeLessThan(idxDdd);
  });

  it('never marks HARD-GATE:audition as READY in the export', () => {
    // Seed PROMO_MIN agrees on audition to try to trick the formatter.
    const auditions = Array.from({ length: PROMO_MIN }, (_, i) => v({
      id: 'a' + i, request_id: 'r' + i, run_generated_at: RUN,
      rule_id: 'HARD-GATE:audition', proposed_verb: 'escalate', agree: true,
    }));
    const out = formatCopyForClaude(auditions, { runId: RUN });
    expect(out.includes('[READY]')).toBe(false);
  });

  it('marks a non-audition rule as [READY] at PROMO_MIN agrees', () => {
    const grants = Array.from({ length: PROMO_MIN }, (_, i) => v({
      id: 'g' + i, request_id: 'r' + i, run_generated_at: RUN,
      rule_id: 'grant-nonblocking-recommended-fork', proposed_verb: 'auto-grant', agree: true,
    }));
    const out = formatCopyForClaude(grants, { runId: RUN });
    expect(out).toContain('[READY]');
  });

  it('formats would_do=null as "(none)" and empty note as "(empty)"', () => {
    const out = formatCopyForClaude(fixture, { runId: RUN });
    expect(out).toContain('would_do: (none)');     // req-ddd
    expect(out).toContain('note: (empty)');         // req-ccc
  });

  it('omits THIS RUN section when no verdicts match runId', () => {
    const out = formatCopyForClaude(fixture, { runId: 'other-run' });
    expect(out.includes('THIS RUN')).toBe(false);
  });
});

describe('matchStats — latest-wins on re-mark', () => {
  it('a re-mark within the same run does not double-count', () => {
    const earlier = v({ id: '1', request_id: 'r1', ts: '2026-06-05T10:00:00Z', agree: false, would_do: 'X' });
    const later = v({ id: '2', request_id: 'r1', ts: '2026-06-05T11:00:00Z', agree: true });
    const s = matchStats([earlier, later]);
    expect(s.overall.marked).toBe(1);
    expect(s.overall.agree).toBe(1);
  });
});
