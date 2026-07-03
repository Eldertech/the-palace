// Render smoke tests for the LOG deck's GIT STATE section. Uses
// renderToStaticMarkup + React.createElement (node env, no DOM, no JSX in a
// .js file) — the same convention as commit-card.test.js. Exercises the real
// React render path against a fixed /api/git-state payload so a crash or a
// wrong accent surfaces without booting the dev server.

import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Rail, WorktreeRow } from '../../src/components/log/GitStatePanel.jsx';

const h = React.createElement;

const HOST = {
  path: '/x/palace-feature', name: 'palace-feature', isHost: true,
  head: 'eb7cd970', shortHead: 'eb7cd97', branch: 'feature/log-git-state',
  detached: false, prunable: false, dirty: 6,
  aheadBehind: { behind: 3, ahead: 0 }, upstream: null,
  last: { subject: 'wired /api/git-state', relative: '2 minutes ago' },
};
const MAIN = {
  path: '/x/The Palace', name: 'The Palace', isHost: false,
  head: '1f9293e2', shortHead: '1f9293e', branch: 'main',
  detached: false, prunable: false, dirty: 1,
  aheadBehind: { behind: 0, ahead: 0 }, upstream: { behind: 0, ahead: 44 },
  last: { subject: 'merge coherence reset', relative: '4 minutes ago' },
};
const PRUNABLE = {
  path: '/x/gone', name: 'palace-gone', isHost: false,
  head: '3c4d5e6', shortHead: '3c4d5e6', branch: 'feature/blueline-text-anchor',
  detached: false, prunable: true, prunableReason: 'gitdir gone', dirty: null,
  aheadBehind: { behind: 0, ahead: 2 }, upstream: null, last: null,
};

describe('Rail', () => {
  it('shows host branch, short HEAD and the uncommitted count', () => {
    const html = renderToStaticMarkup(h(Rail, { host: HOST, count: 6 }));
    expect(html).toContain('feature/log-git-state');
    expect(html).toContain('eb7cd97');
    expect(html).toContain('6 uncommitted');
    expect(html).toContain('YOU ARE HERE');
  });
  it('renders nothing without a host', () => {
    expect(renderToStaticMarkup(h(Rail, { host: null, count: 0 }))).toBe('');
  });
});

describe('WorktreeRow', () => {
  it('badges the host and paints the host accent', () => {
    const html = renderToStaticMarkup(h(WorktreeRow, { wt: HOST }));
    expect(html).toContain('HOST');
    expect(html).toContain('data-state="host"');
    expect(html).toContain('var(--phosphor-bright)'); // host accent
    expect(html).toContain('✎6'); // dirty count
  });
  it('marks a prunable worktree and never shows a dirty count for it', () => {
    const html = renderToStaticMarkup(h(WorktreeRow, { wt: PRUNABLE }));
    expect(html).toContain('PRUNABLE');
    expect(html).toContain('data-state="prunable"');
    expect(html).not.toContain('✎');
  });
  it('shows ahead/behind arrows for a diverged clean worktree', () => {
    const html = renderToStaticMarkup(h(WorktreeRow, { wt: { ...MAIN, dirty: 0, aheadBehind: { behind: 2, ahead: 1 } } }));
    expect(html).toContain('↑1');
    expect(html).toContain('↓2');
  });
});

// The topology graph is now a true commit DAG rendered by CommitDag /
// buildCommitDag — its layout is covered in commit-dag.test.js.
