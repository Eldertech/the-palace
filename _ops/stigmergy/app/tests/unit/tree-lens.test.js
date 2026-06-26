import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import TreeLens from '../../src/components/state/TreeLens.jsx';

const TREE = {
  root: {
    kind: 'folder', name: '', path: '',
    children: [
      { kind: 'entry', name: 'Alpha.md', path: 'Alpha.md', summary: { title: 'Alpha', type: 'concept' }, bundle: null },
      {
        kind: 'folder', name: 'Projects', path: 'Projects', entryCount: 1,
        children: [
          {
            kind: 'entry', name: 'Frame Designer.md', path: 'Projects/Frame Designer.md',
            summary: { title: 'Frame Designer', type: 'project', stage: 'growing' },
            bundle: {
              kind: 'bundle', dir: 'Projects/Frame Designer',
              files: [
                { name: 'Frame Designer — plan.md', relPath: 'Projects/Frame Designer/Frame Designer — plan.md', kind: 'text', size: 10, isEntry: true },
                { name: 'hero.png', relPath: 'Projects/Frame Designer/hero.png', kind: 'image', size: 99, isEntry: false },
              ],
            },
          },
          { kind: 'loose-file', name: 'diagram.png', relPath: 'Projects/diagram.png', fileKind: 'image', size: 12 },
        ],
      },
    ],
  },
  counts: { entries: 2, folders: 1, bundles: 1, bundleFiles: 2 },
};

const render = (props) =>
  renderToStaticMarkup(React.createElement(TreeLens, { tree: TREE, onSelect: () => {}, ...props }));

describe('TreeLens', () => {
  it('renders top-level folders collapsed, with the synthetic (root) group', () => {
    const html = render();
    expect(html).toContain('data-testid="tree-folder-row"');
    expect(html).toContain('data-path="(root)"');
    expect(html).toContain('data-path="Projects"');
    // collapsed: the entries inside are not rendered yet.
    expect(html).not.toContain('data-path="Alpha.md"');
    expect(html).not.toContain('data-path="Projects/Frame Designer.md"');
  });

  it('shows the counts in the title bar', () => {
    const html = render();
    expect(html).toContain('2 entries');
    expect(html).toContain('1 folders');
    expect(html).toContain('1 bundles');
  });

  it('renders entry rows and nested bundle files when expanded', () => {
    const html = render({ defaultExpanded: ['Projects', 'Projects/Frame Designer.md'] });
    expect(html).toContain('data-testid="tree-entry-row"');
    expect(html).toContain('data-path="Projects/Frame Designer.md"');
    // bundle files nested under the entry...
    expect(html).toContain('data-testid="tree-bundle-file-row"');
    expect(html).toContain('data-path="Projects/Frame Designer/Frame Designer — plan.md"');
    // ...the .md is flagged as an entry (deep-links to the reader), the png is not.
    expect(html).toContain('data-is-entry="1"');
    expect(html).toContain('data-is-entry="0"');
  });

  it('reveals a deep-link target by opening its ancestor folders', () => {
    // ?tree=Projects/Frame Designer.md should open Projects without any manual
    // expand, so the target row is present on first render.
    const html = render({ target: 'Projects/Frame Designer.md' });
    expect(html).toContain('data-path="Projects/Frame Designer.md"');
  });

  it('offers the sort toggle', () => {
    const html = render();
    expect(html).toContain('data-testid="tree-sort-name"');
    expect(html).toContain('data-testid="tree-sort-type"');
    expect(html).toContain('data-testid="tree-sort-pulse"');
  });

  it('renders loose files within an expanded folder', () => {
    const html = render({ defaultExpanded: ['Projects'] });
    expect(html).toContain('data-testid="tree-loose-file-row"');
    expect(html).toContain('data-path="Projects/diagram.png"');
  });
});
