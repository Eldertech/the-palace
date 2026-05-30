// Stage F Phase 1 verify gate: given an eligible fork, the planner builds two
// branch directives + two isolated worktree targets deterministically, resolves
// the agent dir from the registry, and never runs a model or writes anything.

import { describe, test, expect, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  slug, branchName, worktreeHint, resolveAgentDir, nextCycleN,
  branchDirective, planTwoPaths, forkFromEscalation, renderPlanText,
} from '../../src/two-paths-dispatch.js';

const fork = {
  request_id: 'apo-steward-004',
  from: 'Action Potential Oscillator',
  headline: 'Is the Kuramoto coupling audible?',
  category: 'sensory',
  options: [
    { id: 'K-SWEEP', label: 'K-SWEEP — sweep the coupling constant' },
    { id: 'DUAL-SWEEP', label: 'DUAL-SWEEP — sweep two parameters together' },
  ],
};

describe('naming helpers', () => {
  test('slug is filesystem-safe', () => {
    expect(slug('K-SWEEP')).toBe('k-sweep');
    expect(slug('apo-steward-004')).toBe('apo-steward-004');
    expect(slug('YOU/DEFINE!')).toBe('you-define');
  });
  test('branchName and worktreeHint are deterministic and isolated (sibling of palace)', () => {
    expect(branchName('apo-steward-004', 'K-SWEEP')).toBe('two-paths/apo-steward-004/k-sweep');
    const wt = worktreeHint('/a/b/The Palace', 'apo-steward-004', 'K-SWEEP');
    expect(wt).toBe('/a/b/.palace-worktrees/apo-steward-004/k-sweep');
    expect(wt.startsWith('/a/b/The Palace')).toBe(false); // outside the working tree
  });
});

describe('resolveAgentDir + nextCycleN', () => {
  let root;
  afterEach(() => { if (root) rmSync(root, { recursive: true, force: true }); root = null; });

  function makePalace() {
    root = mkdtempSync(path.join(tmpdir(), 'palace-tp-'));
    const dirRel = '_ops/agents/permanent/apo';
    const agentDir = path.join(root, dirRel);
    mkdirSync(agentDir, { recursive: true });
    mkdirSync(path.join(root, '_ops/agents/permanent'), { recursive: true });
    writeFileSync(path.join(root, '_ops/agents/permanent/REGISTRY.json'), JSON.stringify({
      schema_version: '1.0',
      agents: [{ agent_id: 'Action Potential Oscillator', home: 'Action Potential Oscillator', dir: dirRel }],
    }));
    writeFileSync(path.join(agentDir, 'state.json'), JSON.stringify({ iteration: 2 }));
    return { agentDir };
  }

  test('resolves home → abs dir from the registry', () => {
    const { agentDir } = makePalace();
    expect(resolveAgentDir(root, 'Action Potential Oscillator')).toBe(agentDir);
    expect(resolveAgentDir(root, 'Nonexistent Page')).toBeNull();
  });

  test('next cycle = state.iteration + 1, defaults to 1 when absent', () => {
    const { agentDir } = makePalace();
    expect(nextCycleN(agentDir)).toBe(3);
    expect(nextCycleN(path.join(root, 'nope'))).toBe(1);
  });
});

describe('branchDirective', () => {
  test('names the option, the cost box, the BRANCHES report, and forbids picking', () => {
    const d = branchDirective({ fork, option: fork.options[0], otherOption: fork.options[1], letter: 'A' });
    expect(d).toContain('K-SWEEP');
    expect(d).toContain('DUAL-SWEEP');         // names the other branch as off-limits
    expect(d).toContain('cannot see it');
    expect(d).toMatch(/COST BOX/);
    expect(d).toContain('"oversized"');       // structured fall-back payload
    expect(d).toContain('BRANCHES');
    expect(d).toContain('branch_result');
    expect(d).toMatch(/Do NOT choose a winner/i);
  });
});

describe('planTwoPaths', () => {
  test('builds two branches A/B with isolated worktrees and directives; dry-run; no prompts without state', () => {
    const plan = planTwoPaths({ palaceRoot: '/x/The Palace', fork, today: '2026-05-29', cycleN: 3 });
    expect(plan.dry_run).toBe(true);
    expect(plan.branches).toHaveLength(2);
    expect(plan.branches.map((b) => b.letter)).toEqual(['A', 'B']);
    expect(plan.branches.map((b) => b.option_id)).toEqual(['K-SWEEP', 'DUAL-SWEEP']);
    // worktrees are distinct and isolated
    const wts = plan.branches.map((b) => b.worktree);
    expect(new Set(wts).size).toBe(2);
    // branch A's directive forbids branch B's option and vice versa
    expect(plan.branches[0].directive).toContain('EXACTLY one option');
    expect(plan.branches[0].cycle_n).toBe(3);
    // no agent dir on this synthetic root → warned, no prompt assembled
    expect(plan.agent_dir).toBeNull();
    expect(plan.warnings.join(' ')).toMatch(/no registered agent dir/);
    expect(plan.branches[0].cycle_prompt).toBeUndefined();
  });

  test('throws when a fork does not carry exactly two options', () => {
    expect(() => planTwoPaths({ fork: { ...fork, options: [fork.options[0]] } })).toThrow(/exactly two/);
  });
});

describe('forkFromEscalation', () => {
  test('adapts an eligible digest escalation; returns null for ineligible', () => {
    const esc = {
      request_id: 'r', from: 'P', headline: 'h',
      two_paths: { eligible: true, category: 'rec_n', options: [{ id: 'A', label: 'a' }, { id: 'B', label: 'b' }] },
    };
    const f = forkFromEscalation(esc);
    expect(f.category).toBe('rec_n');
    expect(f.options.map((o) => o.id)).toEqual(['A', 'B']);
    expect(forkFromEscalation({ two_paths: { eligible: false } })).toBeNull();
    expect(forkFromEscalation({})).toBeNull();
  });
});

describe('renderPlanText', () => {
  test('reports both branches and the no-side-effects guarantee', () => {
    const plan = planTwoPaths({ palaceRoot: '/x/The Palace', fork, today: '2026-05-29', cycleN: 3 });
    const txt = renderPlanText(plan);
    expect(txt).toContain('DRY RUN');
    expect(txt).toContain('Branch A — K-SWEEP');
    expect(txt).toContain('Branch B — DUAL-SWEEP');
    expect(txt).toMatch(/No models were run/);
  });
});
