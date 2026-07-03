import { describe, it, expect } from 'vitest';
import {
  classifyWorktree, accentFor, formatDivergence, buildLanes, stateStyle,
} from '../../src/lib/git-state-view.js';

const wt = (over = {}) => ({
  name: 'palace', isHost: false, branch: 'feature/x', detached: false,
  prunable: false, dirty: 0, aheadBehind: { behind: 0, ahead: 0 }, shortHead: 'abc1234',
  ...over,
});

describe('classifyWorktree', () => {
  it('applies worst-wins precedence', () => {
    expect(classifyWorktree(wt())).toBe('clean');
    expect(classifyWorktree(wt({ aheadBehind: { behind: 2, ahead: 0 } }))).toBe('behind');
    expect(classifyWorktree(wt({ dirty: 3 }))).toBe('dirty');
    // dirty outranks behind
    expect(classifyWorktree(wt({ dirty: 3, aheadBehind: { behind: 2, ahead: 0 } }))).toBe('dirty');
    expect(classifyWorktree(wt({ detached: true, dirty: 3 }))).toBe('detached');
    expect(classifyWorktree(wt({ prunable: true, detached: true }))).toBe('prunable');
  });
  it('treats null dirty (missing dir) as not-dirty', () => {
    expect(classifyWorktree(wt({ dirty: null }))).toBe('clean');
  });
});

describe('accentFor', () => {
  it('host wins the accent even when dirty', () => {
    expect(accentFor(wt({ isHost: true, dirty: 5 }))).toBe(stateStyle('host').accent);
  });
  it('non-host uses its state accent', () => {
    expect(accentFor(wt({ dirty: 5 }))).toBe(stateStyle('dirty').accent);
  });
});

describe('formatDivergence', () => {
  it('renders arrows only for non-zero sides', () => {
    expect(formatDivergence({ ahead: 3, behind: 0 })).toBe('↑3');
    expect(formatDivergence({ ahead: 1, behind: 2 })).toBe('↑1 ↓2');
  });
  it('is quiet on even by default, "even" when asked', () => {
    expect(formatDivergence({ ahead: 0, behind: 0 })).toBeNull();
    expect(formatDivergence({ ahead: 0, behind: 0 }, { zero: true })).toBe('even');
    expect(formatDivergence(null)).toBeNull();
  });
});

describe('buildLanes', () => {
  const state = {
    base: 'main',
    worktrees: [
      wt({ name: 'main', branch: 'main', isHost: false, aheadBehind: { behind: 0, ahead: 0 } }),
      wt({ name: 'blueline', branch: 'feature/blueline-m3', dirty: 12, aheadBehind: { behind: 0, ahead: 3 } }),
      wt({ name: 'figrig', branch: 'feature/figure-rig-gen', aheadBehind: { behind: 2, ahead: 1 } }),
    ],
  };
  it('puts base trunk first, forks by most-ahead', () => {
    const lanes = buildLanes(state);
    expect(lanes[0].isBase).toBe(true);
    expect(lanes[0].forkCol).toBe(0);
    expect(lanes[1].branch).toBe('feature/blueline-m3'); // ahead 3 > ahead 1
    expect(lanes[2].branch).toBe('feature/figure-rig-gen');
    expect(lanes[1].forkCol).toBe(1);
  });
  it('node count reflects real ahead, capped', () => {
    const lanes = buildLanes(state, { maxNodes: 8 });
    expect(lanes[1].nodes).toBe(3);
    expect(lanes[0].nodes).toBe(8); // trunk fills width
    const capped = buildLanes({ base: 'main', worktrees: [wt({ branch: 'f', aheadBehind: { behind: 0, ahead: 99 } })] }, { maxNodes: 5 });
    expect(capped[0].nodes).toBe(4); // maxNodes-1
  });
  it('is empty-safe', () => {
    expect(buildLanes(null)).toEqual([]);
    expect(buildLanes({})).toEqual([]);
  });
});
