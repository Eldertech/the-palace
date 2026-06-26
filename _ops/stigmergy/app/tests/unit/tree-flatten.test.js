import { describe, it, expect } from 'vitest';
import { withRootGroup, flattenVisible, ancestorsToExpand, ROOT_GROUP_PATH } from '../../src/lib/tree.js';

// A small tree mirroring buildEntryTree's output shape.
function fixture() {
  return {
    kind: 'folder', name: '', path: '', entryCount: 3,
    children: [
      { kind: 'entry', name: 'Alpha.md', path: 'Alpha.md', summary: { title: 'Alpha', type: 'concept' }, bundle: null },
      {
        kind: 'folder', name: 'Shop', path: 'Shop', entryCount: 1,
        children: [
          { kind: 'entry', name: 'Kokoro.md', path: 'Shop/Kokoro.md', summary: { title: 'Kokoro', type: 'specialist' }, bundle: null },
        ],
      },
      {
        kind: 'folder', name: 'Projects', path: 'Projects', entryCount: 1,
        children: [
          {
            kind: 'entry', name: 'Frame Designer.md', path: 'Projects/Frame Designer.md',
            summary: { title: 'Frame Designer', type: 'project' },
            bundle: {
              kind: 'bundle', dir: 'Projects/Frame Designer',
              files: [
                { name: 'Frame Designer — plan.md', relPath: 'Projects/Frame Designer/Frame Designer — plan.md', kind: 'text', size: 10, isEntry: true },
                { name: 'hero.png', relPath: 'Projects/Frame Designer/hero.png', kind: 'image', size: 99, isEntry: false },
              ],
            },
          },
        ],
      },
    ],
  };
}

describe('withRootGroup', () => {
  it('wraps loose root entries in a synthetic (root) folder, placed first', () => {
    const grouped = withRootGroup(fixture());
    expect(grouped.children[0].kind).toBe('folder');
    expect(grouped.children[0].path).toBe(ROOT_GROUP_PATH);
    expect(grouped.children[0].synthetic).toBe(true);
    expect(grouped.children[0].children.map((c) => c.path)).toEqual(['Alpha.md']);
    // org folders follow, no loose entries left at top level.
    expect(grouped.children.slice(1).every((c) => c.kind === 'folder')).toBe(true);
  });
});

describe('flattenVisible', () => {
  const grouped = withRootGroup(fixture());

  it('shows only top-level folders when nothing is expanded', () => {
    // flattenVisible sorts folders alpha by name (the synthetic '(' group
    // sorts first), so the order is deterministic regardless of input order.
    const rows = flattenVisible(grouped, { expanded: new Set() });
    expect(rows.map((r) => r.node.path)).toEqual([ROOT_GROUP_PATH, 'Projects', 'Shop']);
    expect(rows.every((r) => r.kind === 'folder' && r.depth === 0)).toBe(true);
  });

  it('reveals a folder\'s entries when expanded', () => {
    const rows = flattenVisible(grouped, { expanded: new Set(['Shop']) });
    const kokoro = rows.find((r) => r.node.path === 'Shop/Kokoro.md');
    expect(kokoro).toBeTruthy();
    expect(kokoro.kind).toBe('entry');
    expect(kokoro.depth).toBe(1);
  });

  it('reveals bundle files only when the entry is expanded', () => {
    const collapsed = flattenVisible(grouped, { expanded: new Set(['Projects']) });
    expect(collapsed.find((r) => r.kind === 'bundle-file')).toBeUndefined();
    const fd = collapsed.find((r) => r.node.path === 'Projects/Frame Designer.md');
    expect(fd.hasChildren).toBe(true);

    const expanded = flattenVisible(grouped, { expanded: new Set(['Projects', 'Projects/Frame Designer.md']) });
    const files = expanded.filter((r) => r.kind === 'bundle-file');
    expect(files.map((r) => r.node.name)).toEqual(['Frame Designer — plan.md', 'hero.png']);
    expect(files[0].depth).toBe(2);
  });

  it('filters to matching entries with ancestors forced open, pruning empty folders', () => {
    const rows = flattenVisible(grouped, { expanded: new Set(), filter: 'kokoro' });
    const paths = rows.map((r) => r.node.path);
    expect(paths).toContain('Shop');
    expect(paths).toContain('Shop/Kokoro.md');
    // The (root) group and Projects have no match — pruned entirely.
    expect(paths).not.toContain(ROOT_GROUP_PATH);
    expect(paths).not.toContain('Projects');
  });

  it('does not auto-expand bundles under an active filter', () => {
    const rows = flattenVisible(grouped, { expanded: new Set(), filter: 'frame' });
    expect(rows.find((r) => r.node.path === 'Projects/Frame Designer.md')).toBeTruthy();
    expect(rows.find((r) => r.kind === 'bundle-file')).toBeUndefined();
  });
});

describe('flattenVisible sort', () => {
  // A single folder holding three entries of different type/title.
  const tree = {
    kind: 'folder', name: '', path: '',
    children: [{
      kind: 'folder', name: 'Bin', path: 'Bin', entryCount: 3,
      children: [
        { kind: 'entry', name: 'C.md', path: 'Bin/C.md', summary: { title: 'Cedar', type: 'project' }, bundle: null },
        { kind: 'entry', name: 'A.md', path: 'Bin/A.md', summary: { title: 'Ash', type: 'concept' }, bundle: null },
        { kind: 'entry', name: 'B.md', path: 'Bin/B.md', summary: { title: 'Birch', type: 'hub' }, bundle: null },
      ],
    }],
  };
  const titlesUnder = (rows) => rows.filter((r) => r.kind === 'entry').map((r) => r.node.summary.title);

  it('orders entries by title for sort=name', () => {
    const rows = flattenVisible(tree, { expanded: new Set(['Bin']), sort: 'name' });
    expect(titlesUnder(rows)).toEqual(['Ash', 'Birch', 'Cedar']);
  });

  it('orders entries by type for sort=type', () => {
    const rows = flattenVisible(tree, { expanded: new Set(['Bin']), sort: 'type' });
    // concept < hub < project alphabetically.
    expect(titlesUnder(rows)).toEqual(['Ash', 'Birch', 'Cedar']);
  });
});

describe('ancestorsToExpand', () => {
  it('returns the (root) group for a root-level entry', () => {
    expect(ancestorsToExpand('Foo.md')).toEqual([ROOT_GROUP_PATH]);
  });
  it('returns each ancestor folder, innermost last', () => {
    expect(ancestorsToExpand('Projects/Sub/Foo.md')).toEqual(['Projects', 'Projects/Sub']);
  });
  it('is empty for null/empty input', () => {
    expect(ancestorsToExpand(null)).toEqual([]);
    expect(ancestorsToExpand('')).toEqual([]);
  });
});
