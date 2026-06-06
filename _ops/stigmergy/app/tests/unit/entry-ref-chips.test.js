// Render tests for EntryRefChips — the [OBS]/[BUN] affordances. Interaction
// (click -> navigate) is an e2e concern; here we assert the markup contract:
//   - OBS is an <a href="obsidian://..."> (so STATE's span.last() click skips it)
//   - BUN renders only when the entry has a bundle
//   - nothing renders when the name did not resolve

import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import EntryRefChips from '../../src/components/EntryRefChips.jsx';

const render = (props) => renderToStaticMarkup(React.createElement(EntryRefChips, props));

describe('EntryRefChips', () => {
  it('renders OBS as an anchor to the obsidian:// scheme', () => {
    const html = render({ resolved: { name: 'Kuramoto Coupling', path: 'Kuramoto Coupling.md', hasBundle: false } });
    expect(html).toContain('data-testid="entry-ref-obs"');
    expect(html).toContain('href="obsidian://open?vault=The%20Palace&amp;file=Kuramoto%20Coupling"');
    // OBS is an <a>, never a clickable <span>, so STATE's `span.last()` e2e
    // selector lands on the name (or BUN), not on the external link.
    expect(html).toMatch(/<a[^>]*data-testid="entry-ref-obs"/);
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
    expect(html).toContain('file=Projects%2FRetrospective%20Delay');
  });

  it('renders nothing when the name did not resolve', () => {
    expect(render({ resolved: null })).toBe('');
    expect(render({ resolved: { path: '' } })).toBe('');
  });
});
