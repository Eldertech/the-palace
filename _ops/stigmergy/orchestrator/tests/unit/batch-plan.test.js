import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';

const SCRIPT = path.resolve('src/batch-plan.js');

function makePalace(opts = {}) {
  const root = mkdtempSync(path.join(tmpdir(), 'palace-batch-'));
  mkdirSync(path.join(root, 'Projects'), { recursive: true });
  mkdirSync(path.join(root, '_ops/agents/permanent'), { recursive: true });
  for (const s of opts.stewards || []) {
    const dir = path.join(root, '_ops/agents/permanent', s.dir);
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify({
      agent_id: s.home, home: s.home, mode: 'long_duration_background',
    }));
    if (s.state) writeFileSync(path.join(dir, 'state.json'), JSON.stringify(s.state));
    // Home page in Projects/
    const fm = `---\ntitle: "${s.home}"\ntype: project\nstage: ${s.stage || 'growing'}\nstatus: active\n---\n# ${s.home}\n`;
    writeFileSync(path.join(root, 'Projects', `${s.home}.md`), fm);
  }
  return root;
}

function runPlanner(root, extraArgs = []) {
  const out = execSync(`node "${SCRIPT}" --root "${root}" --no-unenchanted ${extraArgs.join(' ')}`, { encoding: 'utf8' });
  return JSON.parse(out);
}

describe('batch-plan --ignore-debounce', () => {
  let root;
  afterEach(() => { if (root) rmSync(root, { recursive: true, force: true }); root = null; });

  test('by default, a recently-cycled steward is skipped with the debounce reason', () => {
    const recentTs = new Date().toISOString();
    root = makePalace({ stewards: [{ dir: 'a', home: 'Project A', state: { last_active: recentTs, iteration: 1 } }] });
    const plan = runPlanner(root);
    expect(plan.due).toHaveLength(0);
    expect(plan.skipped).toHaveLength(1);
    expect(plan.skipped[0].reason).toMatch(/within_debounce/);
    expect(plan.ignore_debounce).toBe(false);
  });

  test('--ignore-debounce moves the recently-cycled steward to due[]', () => {
    const recentTs = new Date().toISOString();
    root = makePalace({ stewards: [{ dir: 'a', home: 'Project A', state: { last_active: recentTs, iteration: 1 } }] });
    const plan = runPlanner(root, ['--ignore-debounce']);
    expect(plan.due).toHaveLength(1);
    expect(plan.due[0].home).toBe('Project A');
    expect(plan.skipped).toHaveLength(0);
    expect(plan.ignore_debounce).toBe(true);
  });

  test('--ignore-debounce still respects dormant-stage skipping', () => {
    const recentTs = new Date().toISOString();
    root = makePalace({ stewards: [{ dir: 'a', home: 'Project A', state: { last_active: recentTs, iteration: 1 }, stage: 'dormant' }] });
    const plan = runPlanner(root, ['--ignore-debounce']);
    expect(plan.due).toHaveLength(0);
    expect(plan.skipped).toHaveLength(1);
    expect(plan.skipped[0].reason).toMatch(/stage_dormant/);
  });

  test('first-activation (no state.json yet) is due regardless of flag', () => {
    root = makePalace({ stewards: [{ dir: 'a', home: 'Project A' }] });  // no state
    const plan = runPlanner(root);
    expect(plan.due).toHaveLength(1);
  });
});
