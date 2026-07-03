// Render tests for the QueueItem handoff card additions: the worktree line
// (visible on the card) and the "copy prompt" button (one-click clipboard path
// to a Claude Code paste). renderToStaticMarkup, node env — the click/clipboard
// is e2e's job; here we prove the button and the worktree coordinate render.

import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import QueueItem from '../../src/components/queue/QueueItem.jsx';

const handoffItem = (over = {}) => ({
  id: 'cw-1',
  kind: 'handoff_ready',
  from: 'Closing Well',
  ts: '2026-07-03T22:38:18Z',
  board: 'GENERAL',
  ask: 'Build the Closing Well Agent; Phase 2 next.',
  move: 'Build the Closing Well Agent; Phase 2 next.',
  entry: 'Closing Well',
  handoff_path: 'Closing Well/Closing Well — baton.md',
  stale_if: 'a commit touches Closing Well after this was posted',
  pointer: { type: 'entry', target: 'Closing Well' },
  resolved: { done: false },
  worktree: {
    branch: 'feature/closing-well-agent',
    dir: '../palace-feature-closing-well-agent',
    profile: 'docs',
  },
  ...over,
});

const render = (item) =>
  renderToStaticMarkup(React.createElement(QueueItem, { item, onLaunch: () => {} }));

describe('QueueItem — handoff worktree + copy prompt', () => {
  it('shows the worktree coordinate on the card', () => {
    const html = render(handoffItem());
    expect(html).toContain('data-testid="queue-item-handoff-worktree"');
    expect(html).toContain('../palace-feature-closing-well-agent');
    expect(html).toContain('feature/closing-well-agent');
  });

  it('offers a copy-prompt button on an open handoff', () => {
    const html = render(handoffItem());
    expect(html).toContain('data-testid="queue-item-copy-prompt"');
    expect(html).toContain('copy prompt');
  });

  it('omits the worktree line when the baton has none (root-level baton)', () => {
    const html = render(handoffItem({ worktree: null }));
    expect(html).not.toContain('data-testid="queue-item-handoff-worktree"');
    // ...but still offers copy prompt — the prompt just uses the palace root.
    expect(html).toContain('data-testid="queue-item-copy-prompt"');
  });

  it('drops the copy-prompt button once the baton is resolved', () => {
    const html = render(handoffItem({ resolved: { done: true, reason: 'picked up' } }));
    expect(html).not.toContain('data-testid="queue-item-copy-prompt"');
  });
});
