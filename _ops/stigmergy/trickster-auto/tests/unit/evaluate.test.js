// Phase 1 verify gate: the evaluator covers every required branch —
// auto-grant / auto-deny / escalate / unmatched→escalate /
// audition-always-escalates / budget-exhausted→escalate — plus a run over the
// real board snapshot.

import { describe, it, expect } from 'vitest';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readJsonl } from '../../../orchestrator/src/append.js';
import { parseRequest } from '../../src/parse.js';
import { buildInbox } from '../../src/inbox.js';
import { loadRuleset, validateRuleset } from '../../src/ruleset.js';
import { evaluate, evaluateAll, pickGrantOption } from '../../src/evaluate.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIX = (f) => resolve(__dirname, '../fixtures', f);

const ruleset = loadRuleset(); // the real rules.json

const mk = (payload, extra = {}) => parseRequest({ request_id: 'r1', from: 'Some Page', ts: '2026-05-20T09:00:00Z', payload, ...extra });

describe('ruleset loads + validates', () => {
  it('rules.json is structurally valid and default_verb is escalate', () => {
    expect(ruleset.default_verb).toBe('escalate');
    expect(ruleset.rules.length).toBeGreaterThan(0);
  });
  it('rejects a non-escalate default_verb', () => {
    expect(() => validateRuleset({ default_verb: 'auto-grant', rules: [] })).toThrow();
  });
  it('rejects an unknown match predicate', () => {
    expect(() => validateRuleset({ default_verb: 'escalate', rules: [{ id: 'x', verb: 'escalate', match: { bogus: 1 } }] })).toThrow();
  });
  it('rejects an unconstrained auto-grant rule', () => {
    expect(() => validateRuleset({ default_verb: 'escalate', rules: [{ id: 'x', verb: 'auto-grant', match: {} }] })).toThrow();
  });
});

describe('evaluate — auto-grant', () => {
  it('auto-grants a non-blocking directional fork with a steward recommendation', () => {
    const r = mk({
      resource: 'directional_decision', blocking: false, steward_recommendation: 'prototype-faust',
      options: [{ id: 'prototype-faust', label: 'prototype-faust — build the sketch' }, { id: 'write-quiz', label: 'write-quiz — quiz first' }],
    });
    const v = evaluate(r, ruleset);
    expect(v.verb).toBe('auto-grant');
    expect(v.ruleId).toBe('grant-nonblocking-recommended-fork');
    expect(v.grantOption.id).toBe('prototype-faust');
  });
});

describe('pickGrantOption — prose recommendation resolves to clean option id', () => {
  it('matches the leading token of a prose recommendation to an option id', () => {
    const r = mk({
      resource: 'directional_decision', blocking: false,
      steward_recommendation: 'CENTROID-FREQ — it matches the grant text and coordinates cleanly.',
      options: [{ id: 'CENTROID-FREQ', label: 'CENTROID-FREQ — sweeps the centroid' }, { id: 'CENTROID-WIDTH', label: 'CENTROID-WIDTH — sweeps the width' }],
    });
    const v = evaluate(r, ruleset);
    expect(v.verb).toBe('auto-grant');
    expect(v.grantOption.id).toBe('CENTROID-FREQ');
    expect(v.grantOption.source).toBe('steward_recommendation');
  });
});

describe('evaluate — escalate', () => {
  it('escalates a BLOCKING directional fork (steward suspended → human)', () => {
    const r = mk({ resource: 'directional_decision', blocking: true, steward_recommendation: 'rms', options: [{ id: 'rms', label: 'rms — smooth' }] });
    expect(evaluate(r, ruleset).verb).toBe('escalate');
  });
  it('escalates a non-blocking directional fork with NO recommendation', () => {
    const r = mk({ resource: 'directional_decision', blocking: false, options: [{ id: 'a', label: 'a — x' }] });
    expect(evaluate(r, ruleset).verb).toBe('escalate');
  });
});

describe('evaluate — unmatched → escalate (default)', () => {
  it('escalates a novel/unknown resource type', () => {
    const r = mk({ resource: 'some_brand_new_resource', blocking: false });
    const v = evaluate(r, ruleset);
    expect(v.verb).toBe('escalate');
    expect(v.ruleId).toBe('default-no-match');
  });
  it('escalates a within-budget web_search (dormant deny does not match; falls to default)', () => {
    const r = mk({ resource: 'web_search', blocking: false });
    const v = evaluate(r, ruleset, { perResource: { web_search: { used: 0, max: 5 } } });
    expect(v.verb).toBe('escalate');
  });
});

describe('evaluate — auto-deny (dormant web_search over budget)', () => {
  it('auto-denies web_search when over the daily search budget', () => {
    const r = mk({ resource: 'web_search', blocking: false });
    const v = evaluate(r, ruleset, { perResource: { web_search: { used: 5, max: 5 } } });
    expect(v.verb).toBe('auto-deny');
    expect(v.ruleId).toBe('dormant-deny-websearch-over-budget');
    expect(v.denyReason).toBeTruthy();
  });
});

describe('evaluate — dormant palace-read grant', () => {
  it('auto-grants a read_palace request', () => {
    const r = mk({ resource: 'read_palace', blocking: false });
    expect(evaluate(r, ruleset).verb).toBe('auto-grant');
  });
});

describe('evaluate — audition ALWAYS escalates (hard gate beats any rule)', () => {
  it('escalates an audition even though it is non-blocking (would otherwise be grantable shape)', () => {
    const r = mk({ resource: 'audition', blocking: false, steward_recommendation: 'APPROVE', options: [{ id: 'APPROVE', label: 'APPROVE — go' }] });
    const v = evaluate(r, ruleset);
    expect(v.verb).toBe('escalate');
    expect(v.hardGate).toBe(true);
    expect(v.gateKind).toBe('audition');
  });
  it('escalates an irreversible action shaped like a grantable fork', () => {
    const r = mk({ resource: 'publish_release', blocking: false, steward_recommendation: 'ship', options: [{ id: 'ship', label: 'ship — release it' }] });
    const v = evaluate(r, ruleset);
    expect(v.verb).toBe('escalate');
    expect(v.hardGate).toBe(true);
  });
});

describe('evaluate — budget-exhausted → escalate', () => {
  it('downgrades an otherwise-grantable fork to escalate when budget is spent', () => {
    const r = mk({ resource: 'directional_decision', blocking: false, steward_recommendation: 'a', options: [{ id: 'a', label: 'a — x' }] });
    const granted = evaluate(r, ruleset, { autoGrantsRemaining: 3 });
    expect(granted.verb).toBe('auto-grant');
    const exhausted = evaluate(r, ruleset, { autoGrantsRemaining: 0 });
    expect(exhausted.verb).toBe('escalate');
    expect(exhausted.ruleId).toBe('budget-exhausted');
    expect(exhausted.supersededRuleId).toBe('grant-nonblocking-recommended-fork');
  });
});

describe('evaluate — over the real board snapshot', () => {
  it('classifies every pending request; all auditions escalate; produces a proposed digest set', () => {
    const board = readJsonl(FIX('board-snapshot.jsonl'));
    const { pending } = buildInbox(board);
    const results = evaluateAll(pending, ruleset);
    expect(results.length).toBe(pending.length);

    // Every audition-flavored pending request MUST escalate.
    for (const { request, verdict } of results) {
      if (/audition/i.test(request.resource || '')) {
        expect(verdict.verb).toBe('escalate');
        expect(verdict.hardGate).toBe(true);
      }
      expect(['auto-grant', 'auto-deny', 'escalate']).toContain(verdict.verb);
    }

    // Determinism: a second evaluation yields identical verbs.
    const again = evaluateAll(pending, ruleset);
    expect(again.map((x) => x.verdict.verb)).toEqual(results.map((x) => x.verdict.verb));
  });
});
