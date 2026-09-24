// Render tests for EntryRefChips — the [BUN] affordance. Interaction
// (click -> navigate) is an e2e concern; here we assert the markup contract:
//   - no OBS anchor any more (retired 2026-09-23: Obsidian is out of the loop)
//   - BUN renders only when the entry has a bundle
//   - nothing renders when the name did not resolve

import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import EntryRefChips from '../../src/components/EntryRefChips.jsx';

const render = (props) => renderToStaticMarkup(React.createElement(EntryRefChips, props));

describe('EntryRefChips', () => {
  it('renders no Obsidian chip (retired) — no anchor, no obsidian:// href', () => {
    const html = render({ resolved: { name: 'Kuramoto Coupling', path: 'Kuramoto Coupling.md', hasBundle: true } });
    expect(html).not.toContain('data-testid="entry-ref-obs"');
    expect(html).not.toContain('obsidian://');
    expect(html).not.toMatch(/<a[\s>]/);
  });

  it('omits BUN when the entry has no bundle', () => {
    const html = render({ resolved: { name: 'Kuramoto Coupling', path: 'Kuramoto Coupling.md', hasBundle: false } });
    expect(html).not.toContain('data-testid="entry-ref-bun"');
    expect(html).toContain('data-has-bundle="false"');
  });

  it('renders BUN when the entry has a bundle', () => {
    const html = render({ resolved: { name: 'Retrospective Delay', path: 'Projects/Retrospective Delay.md', hasBundle: true } });
    expect(html).toContain('data-testid="entry-ref-bun"');
    expect(html).toContain('data-has-bundle="true"');
  });

  it('renders nothing when the name did not resolve', () => {
    expect(render({ resolved: null })).toBe('');
    expect(render({ resolved: { path: '' } })).toBe('');
  });
});
