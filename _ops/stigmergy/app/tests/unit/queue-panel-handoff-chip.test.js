// The handoffs lane chip must ALWAYS render — including at zero open handoffs —
// so an empty lane reads as "handoffs (0)" rather than vanishing (which is
// ambiguous with "the feature broke"). Static markup, node env.
import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import QueuePanel from '../../src/components/queue/QueuePanel.jsx';

const render = (messages) =>
  renderToStaticMarkup(React.createElement(QueuePanel, { messages, onJumpEntry: () => {} }));

describe('QueuePanel — handoffs lane chip persists at zero', () => {
  it('renders "handoffs (0)", dim + inert, when there are no open handoffs', () => {
    const html = render([]); // no handoff_ready messages -> handoffCount 0
    expect(html).toContain('data-testid="queue-lane-handoffs"');
    expect(html).toContain('handoffs (0)');
    expect(html).toContain('data-empty="true"');
  });

  it('shows the count and marks the chip non-empty when a baton is open', () => {
    const handoff = {
      id: 'h1', type: 'BROADCAST', from: 'BLUELINE', ts: '2026-07-03T10:00:00Z', board: 'GENERAL',
      payload: { kind: 'handoff_ready', entry: 'BLUELINE', handoff_path: 'x — baton.md', summary: 'mid-move' },
    };
    const html = render([handoff]);
    expect(html).toContain('handoffs (1)');
    expect(html).toContain('data-empty="false"');
  });
});
