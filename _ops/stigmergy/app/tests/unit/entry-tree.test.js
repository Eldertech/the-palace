import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildEntryTree } from '../../src/lib/entry-tree.js';

let root;

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), 'stigmergy-tree-'));

  // A top-level (root) entry, no bundle.
  writeFileSync(join(root, 'Kuramoto Coupling.md'), '---\ntitle: Kuramoto Coupling\ntype: concept\n---\nbody\n');

  // An org folder (Shop/) holding an entry.
  mkdirSync(join(root, 'Shop'));
  writeFileSync(join(root, 'Shop', 'Kokoro.md'), '---\ntitle: Kokoro\ntype: specialist\n---\nbody\n');

  // An org folder (Projects/) holding a BUNDLED entry: Foo.md + Foo/ with a
  // bundle .md (plan) and a non-md asset (hero.png).
  mkdirSync(join(root, 'Projects'));
  writeFileSync(join(root, 'Projects', 'Frame Designer.md'), '---\ntitle: Frame Designer\ntype: project\n---\nbody\n');
  mkdirSync(join(root, 'Projects', 'Frame Designer'));
  writeFileSync(join(root, 'Projects', 'Frame Designer', 'Frame Designer — plan.md'), '---\ntitle: Frame Designer — plan\n---\nplan\n');
  writeFileSync(join(root, 'Projects', 'Frame Designer', 'hero.png'), 'PNGDATA');

  // A loose non-md asset sitting directly in an org folder, owned by no entry.
  writeFileSync(join(root, 'Projects', 'diagram.png'), 'PNGDATA');
});

afterAll(() => {
  rmSync(root, { recursive: true, force: true });
});

function childByPath(folder, path) {
  return folder.children.find((c) => c.path === path);
}
function folderByName(folder, name) {
  return folder.children.find((c) => c.kind === 'folder' && c.name === name);
}

describe('buildEntryTree', () => {
  it('places top-level entries directly under the root node', () => {
    const { root: tree } = buildEntryTree(root);
    const kura = childByPath(tree, 'Kuramoto Coupling.md');
    expect(kura).toBeTruthy();
    expect(kura.kind).toBe('entry');
  });

  it('groups entries under their organizational folders', () => {
    const { root: tree } = buildEntryTree(root);
    const shop = folderByName(tree, 'Shop');
    expect(shop).toBeTruthy();
    expect(shop.kind).toBe('folder');
    expect(childByPath(shop, 'Shop/Kokoro.md')).toBeTruthy();
  });

  it('nests a bundle file UNDER its owning entry, not as a standalone node', () => {
    const { root: tree } = buildEntryTree(root);
    const projects = folderByName(tree, 'Projects');
    const fd = childByPath(projects, 'Projects/Frame Designer.md');
    expect(fd).toBeTruthy();
    expect(fd.bundle).toBeTruthy();
    // The bundle .md is a child of the entry...
    const planFile = fd.bundle.files.find((f) => f.name === 'Frame Designer — plan.md');
    expect(planFile).toBeTruthy();
    expect(planFile.isEntry).toBe(true);
    // ...and the non-md asset is there too, flagged not-an-entry.
    const hero = fd.bundle.files.find((f) => f.name === 'hero.png');
    expect(hero).toBeTruthy();
    expect(hero.isEntry).toBe(false);
    expect(hero.kind).toBe('image');
    // ...and the bundle .md must NOT appear as a standalone entry anywhere.
    expect(childByPath(projects, 'Projects/Frame Designer/Frame Designer — plan.md')).toBeUndefined();
    const bundleFolder = folderByName(projects, 'Frame Designer');
    expect(bundleFolder).toBeUndefined(); // bundle dir is not an org folder
  });

  it('does not turn a bundle folder into an organizational folder', () => {
    const { root: tree, counts } = buildEntryTree(root);
    const projects = folderByName(tree, 'Projects');
    // The Frame Designer bundle dir must not appear as a sub-folder of Projects.
    expect(projects.children.some((c) => c.kind === 'folder')).toBe(false);
    expect(childByPath(projects, 'Projects/Frame Designer.md')).toBeTruthy();
    expect(counts.entries).toBe(3); // Kuramoto, Kokoro, Frame Designer
    expect(counts.bundles).toBe(1);
    expect(counts.bundleFiles).toBe(2);
  });

  it('reports recursive entry counts on folders', () => {
    const { root: tree } = buildEntryTree(root);
    expect(folderByName(tree, 'Shop').entryCount).toBe(1);
    expect(folderByName(tree, 'Projects').entryCount).toBe(1);
  });

  it('surfaces a loose non-md file as a loose-file node in its org folder', () => {
    const { root: tree, counts } = buildEntryTree(root);
    const projects = folderByName(tree, 'Projects');
    const loose = projects.children.find((c) => c.kind === 'loose-file');
    expect(loose).toBeTruthy();
    expect(loose.relPath).toBe('Projects/diagram.png');
    expect(loose.fileKind).toBe('image');
    // Exactly one loose file: the bundle's own hero.png stays a bundle file,
    // not a loose file (it lives inside the bundle subdir, not directly here).
    expect(counts.looseFiles).toBe(1);
  });
});
