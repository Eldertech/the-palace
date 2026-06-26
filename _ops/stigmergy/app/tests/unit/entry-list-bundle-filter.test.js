import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import EntryList from '../../src/components/state/EntryList.jsx';

// renderToStaticMarkup paints the component's INITIAL state, so the bundle
// toggle starts off — exactly the default we want to verify: PULSE hides
// SCHEMA §8 owned files unless the human opts in.
const render = (entries) =>
  renderToStaticMarkup(
    React.createElement(EntryList, { entries, loadState: 'ok', error: null, onSelect: () => {} }),
  );

const ENTRIES = [
  { path: 'Kuramoto Coupling.md', title: 'Kuramoto Coupling', type: 'concept', stage: 'mature', is_bundle_file: false },
  { path: 'Projects/Frame Designer.md', title: 'Frame Designer', type: 'project', stage: 'growing', has_bundle: true, is_bundle_file: false },
  { path: 'Projects/Frame Designer/Frame Designer — plan.md', title: 'Frame Designer — plan', type: null, stage: null, is_bundle_file: true },
];

describe('EntryList bundle-file filtering', () => {
  it('hides is_bundle_file rows by default', () => {
    const html = render(ENTRIES);
    // First-class entries render...
    expect(html).toContain('data-path="Kuramoto Coupling.md"');
    expect(html).toContain('data-path="Projects/Frame Designer.md"');
    // ...the bundle file does not.
    expect(html).not.toContain('data-path="Projects/Frame Designer/Frame Designer — plan.md"');
  });

  it('offers a toggle to reveal bundle files', () => {
    const html = render(ENTRIES);
    expect(html).toContain('data-testid="pulse-bundle-toggle"');
    expect(html).toContain('show bundle files');
  });

  it('counts only the visible (non-bundle) universe in the header', () => {
    const html = render(ENTRIES);
    // 2 first-class entries visible out of a 2-entry base (bundle file excluded).
    expect(html).toContain('(2/2 entries)');
  });
});
