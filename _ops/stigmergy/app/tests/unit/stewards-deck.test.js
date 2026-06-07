// Unit tests for the StewardsDeck per-row "running" indicator — the row that
// marks the steward whose cycle the lane is actively computing. The lane reports
// the live steward by agent_id in worker.current (server/steward-lane.js); the
// row keys on the same agent_id, so the marked row must match worker.current.
import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { isStewardRunning, RunningTag, RowStatus } from '../../src/components/stewards/StewardsDeck.jsx';

describe('isStewardRunning — the marked row matches worker.current', () => {
  const worker = { running: true, current: 'waveguide-synthesizer' };

  it('is true only for the steward whose agent_id === worker.current', () => {
    expect(isStewardRunning({ agent_id: 'waveguide-synthesizer' }, worker)).toBe(true);
    expect(isStewardRunning({ agent_id: 'crystal-synth' }, worker)).toBe(false);
  });

  it('is false when no cycle is running, even if a stale current lingers', () => {
    expect(isStewardRunning(
      { agent_id: 'waveguide-synthesizer' },
      { running: false, current: 'waveguide-synthesizer' },
    )).toBe(false);
  });

  it('is false for an empty worker or a null current', () => {
    expect(isStewardRunning({ agent_id: 'x' }, {})).toBe(false);
    expect(isStewardRunning({ agent_id: 'x' }, { running: true, current: null })).toBe(false);
    expect(isStewardRunning({ agent_id: 'x' }, undefined)).toBe(false);
  });
});

describe('RunningTag', () => {
  it('renders the running marker with a slugged testid', () => {
    const html = renderToStaticMarkup(React.createElement(RunningTag, { name: 'Waveguide Synthesizer' }));
    expect(html).toContain('data-testid="steward-running-waveguide-synthesizer"');
    expect(html).toContain('data-running="true"');
    expect(html.toLowerCase()).toContain('running');
  });
});

describe('RowStatus — "running" replaces "ready" (one state, not two)', () => {
  it('shows running and NOT the grants badge while a cycle is live', () => {
    const html = renderToStaticMarkup(
      React.createElement(RowStatus, { isRunning: true, grants_waiting: 3, name: 'crystal-synth' }),
    );
    expect(html.toLowerCase()).toContain('running');
    expect(html).not.toContain('ready');
    expect(html).not.toContain('waiting');
  });

  it('shows the grants badge and NOT running when idle', () => {
    const html = renderToStaticMarkup(
      React.createElement(RowStatus, { isRunning: false, grants_waiting: 3, name: 'crystal-synth' }),
    );
    expect(html).toContain('3 ready');
    expect(html.toLowerCase()).not.toContain('running');
  });
});
