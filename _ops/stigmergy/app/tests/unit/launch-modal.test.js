// Render tests for the LaunchModal footer actions. The v2 "launch terminal"
// button (open a real Claude Code terminal seeded with the prompt) is the new
// primary; "copy prompt" stays as the fallback; MARK PICKED UP remains
// handoff-only. renderToStaticMarkup, node env — the POST/click is e2e's job.

import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import LaunchModal from '../../src/components/queue/LaunchModal.jsx';

const render = (context) =>
  renderToStaticMarkup(React.createElement(LaunchModal, { context, onClose: () => {} }));

describe('LaunchModal — launch terminal action', () => {
  it('offers launch-terminal + copy for a steward, and no mark-picked-up', () => {
    const html = render({
      kind: 'steward', entry: 'Kuramoto Coupling',
      sourcePath: '_ops/agents/permanent/kuramoto-coupling', iteration: 3,
    });
    expect(html).toContain('data-testid="launch-terminal"');
    expect(html).toContain('launch terminal');
    expect(html).toContain('data-testid="launch-copy"');
    expect(html).not.toContain('data-testid="launch-mark-picked-up"');
  });

  it('keeps mark-picked-up for a handoff, alongside launch-terminal', () => {
    const html = render({
      kind: 'handoff', id: 'h-1', entry: 'Foo', from: 'Foo',
      sourcePath: 'Foo/Foo — baton.md', summary: 'mid-move',
    });
    expect(html).toContain('data-testid="launch-terminal"');
    expect(html).toContain('data-testid="launch-mark-picked-up"');
  });
});
