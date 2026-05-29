// Phase 4 verify gate: the budget flips grants→escalate at the threshold and
// resets cleanly across a day boundary.

import { describe, it, expect } from 'vitest';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdtempSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { loadBudget, applyDecisions, persistBudget, DEFAULT_DAILY_CAP } from '../../src/budget.js';
import { loadRuleset } from '../../src/ruleset.js';
import { evaluateBatch } from '../../src/evaluate.js';
import { parseRequest } from '../../src/parse.js';

const ruleset = loadRuleset();
const tmpState = () => join(mkdtempSync(join(tmpdir(), 'ta-budget-')), 'budget.json');

const grantable = (i) => parseRequest({
  request_id: `g${i}`, from: 'P', ts: `2026-05-20T09:0${i}:00Z`,
  payload: { resource: 'directional_decision', blocking: false, steward_recommendation: 'a', options: [{ id: 'a', label: 'a — x' }] },
});

describe('loadBudget — fresh + day reset', () => {
  it('fresh state when no file exists', () => {
    const { state } = loadBudget({ today: '2026-05-29', statePath: tmpState() });
    expect(state.autoGrantsUsed).toBe(0);
    expect(state.autoGrantsMax).toBe(DEFAULT_DAILY_CAP);
    expect(state.autoGrantsRemaining).toBe(DEFAULT_DAILY_CAP);
  });

  it('honors an explicit cap', () => {
    const { state } = loadBudget({ today: '2026-05-29', cap: 2, statePath: tmpState() });
    expect(state.autoGrantsMax).toBe(2);
    expect(state.autoGrantsRemaining).toBe(2);
  });

  it('carries used count within the same day', () => {
    const path = tmpState();
    writeFileSync(path, JSON.stringify({ date: '2026-05-29', autoGrantsUsed: 5, autoGrantsMax: 8, perResource: {} }));
    const { state } = loadBudget({ today: '2026-05-29', statePath: path });
    expect(state.autoGrantsUsed).toBe(5);
    expect(state.autoGrantsRemaining).toBe(3);
  });

  it('RESETS used count on a new day', () => {
    const path = tmpState();
    writeFileSync(path, JSON.stringify({ date: '2026-05-28', autoGrantsUsed: 8, autoGrantsMax: 8, perResource: {} }));
    const { state } = loadBudget({ today: '2026-05-29', statePath: path });
    expect(state.autoGrantsUsed).toBe(0);
    expect(state.autoGrantsRemaining).toBe(8);
  });
});

describe('budget threshold flip — grants beyond the cap escalate', () => {
  it('with cap=2 and 4 grantable requests, exactly 2 grant and 2 escalate (budget-exhausted)', () => {
    const { state } = loadBudget({ today: '2026-05-29', cap: 2, statePath: tmpState() });
    const reqs = [grantable(1), grantable(2), grantable(3), grantable(4)];
    const results = evaluateBatch(reqs, ruleset, state);
    const verbs = results.map((r) => r.verdict.verb);
    expect(verbs.filter((v) => v === 'auto-grant').length).toBe(2);
    expect(verbs.filter((v) => v === 'escalate').length).toBe(2);
    // the escalated ones cite budget-exhausted
    const exhausted = results.filter((r) => r.verdict.verb === 'escalate');
    for (const e of exhausted) expect(e.verdict.ruleId).toBe('budget-exhausted');
  });

  it('with cap=0, every grantable escalates', () => {
    const { state } = loadBudget({ today: '2026-05-29', cap: 0, statePath: tmpState() });
    const results = evaluateBatch([grantable(1), grantable(2)], ruleset, state);
    expect(results.every((r) => r.verdict.verb === 'escalate')).toBe(true);
  });
});

describe('applyDecisions — persists consumed grants', () => {
  it('decrements and writes the consumed count', () => {
    const path = tmpState();
    const budget = loadBudget({ today: '2026-05-29', cap: 8, statePath: path });
    const results = evaluateBatch([grantable(1), grantable(2), grantable(3)], ruleset, budget.state);
    applyDecisions(budget, results);
    expect(existsSync(path)).toBe(true);
    const saved = JSON.parse(readFileSync(path, 'utf8'));
    expect(saved.autoGrantsUsed).toBe(3);
    expect(saved.autoGrantsRemaining).toBe(5);
    expect(saved.date).toBe('2026-05-29');
  });

  it('a same-day reload sees the spent budget and caps accordingly', () => {
    const path = tmpState();
    let budget = loadBudget({ today: '2026-05-29', cap: 3, statePath: path });
    applyDecisions(budget, evaluateBatch([grantable(1), grantable(2)], ruleset, budget.state));
    // reload: 2 used, 1 remaining. Now 3 grantable → only 1 grants.
    budget = loadBudget({ today: '2026-05-29', statePath: path });
    expect(budget.state.autoGrantsRemaining).toBe(1);
    const results = evaluateBatch([grantable(3), grantable(4), grantable(5)], ruleset, budget.state);
    expect(results.filter((r) => r.verdict.verb === 'auto-grant').length).toBe(1);
  });
});
