import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import EntryList from '../../src/components/state/EntryList.jsx';
import { pulseUniverse } from '../../src/lib/pulse.js';

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
  { path: 'Projects/Frame Designer/Frame Designer — plan.md', title: 'Frame Designer — plan', type: null, stage: null, born: '2026-09-01', link_count: 1, is_bundle_file: true },
  // A bundle file with no §8 frontmatter: workshop, stays out even with bundles on.
  { path: 'Projects/Frame Designer/proofs/README.md', title: 'README', type: null, stage: null, link_count: 0, is_bundle_file: true },
  // Machinery with no frontmatter: not canon, never a PULSE row.
  { path: '_ops/loudon-live/design-system/README.md', title: 'README', type: null, stage: null, is_bundle_file: false },
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

  it('hides files with no SCHEMA §1 type (READMEs, machinery)', () => {
    const html = render(ENTRIES);
    expect(html).not.toContain('data-path="_ops/loudon-live/design-system/README.md"');
  });

  it('offers a typed-glyph toggle to reveal bundle files, off by default', () => {
    const html = render(ENTRIES);
    expect(html).toContain('data-testid="pulse-bundle-toggle"');
    expect(html).toContain('aria-checked="false"');
    expect(html).toContain('[ ]</span><span>bundle files');
    expect(html).not.toContain('type="checkbox"');
  });

  it('counts only the canon universe in the header', () => {
    const html = render(ENTRIES);
    // 2 canon entries visible out of a 2-entry base (bundle file + README excluded).
    expect(html).toContain('(2/2 entries)');
  });
});

describe('pulseUniverse', () => {
  const ALL = [
    ...ENTRIES,
    // A bundle file whose owner is not canon: never shown, even with bundles on.
    { path: 'Projects/BLUELINE/Text Layer.md', title: 'Text Layer', type: null, has_bundle: true, is_bundle_file: false },
    { path: 'Projects/BLUELINE/Text Layer/notes.md', title: 'notes', type: null, born: '2026-09-01', is_bundle_file: true },
  ];
  const paths = (list) => list.map((e) => e.path);

  it('keeps canon entries only by default', () => {
    expect(paths(pulseUniverse(ALL))).toEqual(['Kuramoto Coupling.md', 'Projects/Frame Designer.md']);
  });

  it('adds the self-describing bundle files of canon entries when asked', () => {
    expect(paths(pulseUniverse(ALL, { withBundles: true }))).toEqual([
      'Kuramoto Coupling.md',
      'Projects/Frame Designer.md',
      'Projects/Frame Designer/Frame Designer — plan.md',
    ]);
  });
});
