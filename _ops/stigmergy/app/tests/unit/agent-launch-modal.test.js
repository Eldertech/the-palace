// Render tests for AgentLaunchModal's construction chrome. renderToStaticMarkup
// runs the component once with no effects (the preview fetch never fires in SSR),
// so we assert the static panel: header, the Core knobs (model/effort/mandate),
// and the actions. The live construction (tiers + prompt) is covered by the
// route tests (launch-middleware) and the in-browser check.

import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import AgentLaunchModal from '../../src/components/queue/AgentLaunchModal.jsx';

const render = (props) =>
  renderToStaticMarkup(React.createElement(AgentLaunchModal, { home: 'Kuramoto Coupling', onClose: () => {}, ...props }));

describe('AgentLaunchModal — construction chrome', () => {
  it('renders the construct-agent panel with the home, the Core knobs, and the actions', () => {
    const html = render();
    expect(html).toContain('data-testid="agent-launch-modal"');
    expect(html).toContain('construct agent');
    expect(html).toContain('Kuramoto Coupling');
    expect(html).toContain('data-testid="agent-model"');
    expect(html).toContain('data-testid="agent-effort"');
    expect(html).toContain('data-testid="agent-mandate"');
    expect(html).toContain('data-testid="agent-launch-terminal"');
    expect(html).toContain('data-testid="agent-copy"');
    expect(html).toContain('data-testid="agent-close"');
    // before the preview resolves, the build shows a constructing state
    expect(html).toContain('constructing…');
  });

  it('offers Opus 4.8 + Sonnet for the model and the effort levels', () => {
    const html = render();
    expect(html).toContain('claude-opus-4-8');
    expect(html).toContain('Opus 4.8');
    expect(html).toContain('claude-sonnet-4-6');
    // effort options
    for (const e of ['high', 'medium', 'xhigh', 'max', 'low']) expect(html).toContain(`>${e}<`);
  });

  it('prefills the mandate from mandateSeed', () => {
    const html = render({ mandateSeed: 'resolve the stage-2 decision' });
    expect(html).toContain('resolve the stage-2 decision');
  });
});
