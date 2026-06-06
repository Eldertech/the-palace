import { describe, it, expect } from 'vitest';
import { scoreBoard, renderRetroText, DEFAULT_PROMOTION } from '../../src/retro.js';
import { loadRuleset } from '../../src/ruleset.js';

const ruleset = loadRuleset(); // the live rules.json — the active rule is grant-nonblocking-recommended-fork

// Helpers to build minimal board messages.
const fork = (id, recId, optionIds) => ({
  type: 'RESOURCE_REQUEST', request_id: id, from: `Steward ${id}`,
  payload: {
    resource: 'directional_decision', blocking: false,
    steward_recommendation: `${recId} — because reasons`,
    options: optionIds.map((o) => ({ id: o, label: `${o} — label` })),
  },
});
const humanGrant = (re, optionId, notes) => ({ type: 'RESOURCE_GRANT', from: 'TRICKSTER', re, payload: { granted: true, option_id: optionId ?? undefined, notes: notes ?? '' } });
const humanDeny = (re) => ({ type: 'RESOURCE_DENY', from: 'TRICKSTER', re, payload: { granted: false } });
const autoGrant = (re, optionId) => ({ type: 'RESOURCE_GRANT', from: 'TRICKSTER (auto)', re, payload: { granted: true, option_id: optionId, decided_by: 'auto' } });

describe('scoreBoard', () => {
  it('scores exact-option, free-text, divergence, and dangerous against the active rule', () => {
    const board = [
      fork('r1', 'A', ['A', 'B']), humanGrant('r1', 'A'),          // exact-option match
      fork('r2', 'A', ['A', 'B']), humanGrant('r2', null, 'do it your way'), // free-text grant
      fork('r3', 'A', ['A', 'B']), humanGrant('r3', 'B'),          // option divergence
      fork('r4', 'A', ['A', 'B']), humanDeny('r4'),                // DANGEROUS: engine grant, you denied
      fork('r5', 'A', ['A', 'B']),                                  // engine would grant, but undecided (not scored)
    ];
    const report = scoreBoard(board, ruleset);
    const rule = report.rules.find((r) => r.ruleId === 'grant-nonblocking-recommended-fork');
    expect(rule.verb).toBe('auto-grant');
    expect(rule.fired).toBe(5);
    expect(rule.decided).toBe(4);
    expect(rule.exactOption).toBe(1);
    expect(rule.notesMode).toBe(1);
    expect(rule.optionDivergence).toBe(1);
    expect(rule.dangerous).toBe(1);          // r4
    expect(rule.scored).toBe(4);             // 3 grants + 1 deny
    expect(rule.agreementPct).toBe(50);      // (exact 1 + notes 1) / 4
  });

  it('ignores the engine\'s own auto posts as ground truth', () => {
    const board = [fork('r1', 'A', ['A', 'B']), autoGrant('r1', 'A')];
    const report = scoreBoard(board, ruleset);
    const rule = report.rules.find((r) => r.ruleId === 'grant-nonblocking-recommended-fork');
    expect(rule.fired).toBe(1);
    expect(rule.decided).toBe(0); // the auto grant is not human ground truth
  });

  it('marks a rule eligible only when criterion is met (clean board)', () => {
    const board = [];
    for (let i = 0; i < 20; i += 1) { board.push(fork(`g${i}`, 'A', ['A', 'B']), humanGrant(`g${i}`, 'A')); }
    const report = scoreBoard(board, ruleset);
    const rule = report.rules.find((r) => r.ruleId === 'grant-nonblocking-recommended-fork');
    expect(rule.decided).toBe(20);
    expect(rule.dangerous).toBe(0);
    expect(rule.agreementPct).toBe(100);
    expect(rule.eligible).toBe(true);
  });

  it('a single dangerous false-grant blocks eligibility regardless of volume', () => {
    const board = [];
    for (let i = 0; i < 30; i += 1) { board.push(fork(`g${i}`, 'A', ['A', 'B']), humanGrant(`g${i}`, 'A')); }
    board.push(fork('bad', 'A', ['A', 'B']), humanDeny('bad'));
    const report = scoreBoard(board, ruleset, { promotion: DEFAULT_PROMOTION });
    const rule = report.rules.find((r) => r.ruleId === 'grant-nonblocking-recommended-fork');
    expect(rule.dangerous).toBe(1);
    expect(rule.eligible).toBe(false);
  });

  it('blocking forks escalate (not scored as an auto-acting rule) and render cleanly', () => {
    const blocking = { type: 'RESOURCE_REQUEST', request_id: 'b1', from: 'S', payload: { resource: 'directional_decision', blocking: true, options: [{ id: 'A', label: 'A' }] } };
    const report = scoreBoard([blocking, humanGrant('b1', 'A')], ruleset);
    expect(report.rules.some((r) => r.verb === 'escalate')).toBe(true);
    expect(typeof renderRetroText(report)).toBe('string');
  });
});
