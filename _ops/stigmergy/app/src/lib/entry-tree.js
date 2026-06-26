// Folder-structure tree for the STATE deck's TREE lens.
//
// PULSE is deliberately flat (a vitality ranking, not a file browser). TREE is
// the complementary structure lens: it shows the palace's folder layout and —
// crucially — nests each entry's bundle UNDER the entry rather than beside it.
//
// The load-bearing distinction (SCHEMA §8): there are two kinds of folder.
//   - organizational folders (Shop/, Projects/) hold many entries.
//   - bundle folders (Foo/ next to Foo.md) are ONE entry's private substrate.
// A naive file tree shows Foo.md and Foo/ as siblings, which is wrong. So we
// partition: a .md inside some entry's bundle dir is a bundle FILE (attached to
// its owning entry), never a standalone node in the org tree.
//
// We source the partition from listEntries (which already flags is_bundle_file)
// and the bundle file listing from listBundleFiles — reusing the authoritative
// server-side bundle logic instead of re-deriving membership from path strings.

import { join, resolve } from 'node:path';
import { listEntries } from './entries.js';
import { listBundleFiles } from './bundle.js';

// Build an entry's bundle node (or null when the bundle holds no listable
// files). `isEntry` marks the .md owned files so the UI can deep-link them to
// the reader; everything else opens natively.
function buildBundleNode(palaceRoot, entry) {
  const rel = entry.path.replace(/\.md$/, '');
  const absBundleDir = join(palaceRoot, rel);
  const files = listBundleFiles(palaceRoot, absBundleDir).map((f) => ({
    name: f.name,
    relPath: f.relPath,
    kind: f.kind,
    size: f.size,
    isEntry: f.ext === '.md',
  }));
  if (files.length === 0) return null;
  return { kind: 'bundle', dir: rel, files };
}

// Recursively count entry descendants under a folder, so a folder's badge can
// show how much lives within it (not just its direct children).
function countEntries(folder) {
  let n = 0;
  for (const child of folder.children) {
    if (child.kind === 'entry') n += 1;
    else if (child.kind === 'folder') n += countEntries(child);
  }
  return n;
}

// Sort a folder's children in place: folders before entries; folders alpha by
// name; entries alpha by title. The client may re-sort entries (see tree.js),
// but this gives a stable, navigable default.
function sortChildren(folder) {
  folder.children.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === 'folder' ? -1 : 1;
    if (a.kind === 'folder') return a.name.localeCompare(b.name);
    const at = a.summary?.title ?? a.name;
    const bt = b.summary?.title ?? b.name;
    return at.localeCompare(bt);
  });
  for (const child of folder.children) {
    if (child.kind === 'folder') sortChildren(child);
  }
}

// buildEntryTree(palaceRoot) -> { root, counts }
//   root   : the synthetic palace-root FolderNode (path '')
//   counts : { folders, entries, bundles, bundleFiles }
//
// Node shapes:
//   FolderNode = { kind:'folder', name, path, children: Node[], entryCount }
//   EntryNode  = { kind:'entry',  name, path, summary, bundle: BundleNode|null }
//   BundleNode = { kind:'bundle', dir, files: [{name, relPath, kind, size, isEntry}] }
export function buildEntryTree(palaceRoot) {
  const root = resolve(palaceRoot);
  const entries = listEntries(root);
  // Bundle files are represented as their owning entry's children, not as
  // standalone org-tree nodes — drop them from placement here.
  const firstClass = entries.filter((e) => !e.is_bundle_file);

  const rootNode = { kind: 'folder', name: '', path: '', children: [], entryCount: 0 };
  const folderIndex = new Map([['', rootNode]]);

  // Find-or-create the folder node for a palace-relative folder path,
  // materializing every ancestor along the way.
  function ensureFolder(folderPath) {
    if (folderIndex.has(folderPath)) return folderIndex.get(folderPath);
    const segs = folderPath.split('/');
    let cur = rootNode;
    let acc = '';
    for (const seg of segs) {
      acc = acc === '' ? seg : `${acc}/${seg}`;
      let next = folderIndex.get(acc);
      if (!next) {
        next = { kind: 'folder', name: seg, path: acc, children: [], entryCount: 0 };
        folderIndex.set(acc, next);
        cur.children.push(next);
      }
      cur = next;
    }
    return cur;
  }

  let bundles = 0;
  let bundleFiles = 0;
  for (const entry of firstClass) {
    const segs = entry.path.split('/');
    const name = segs[segs.length - 1];
    const folderPath = segs.slice(0, -1).join('/');
    const folder = ensureFolder(folderPath);
    const bundle = entry.has_bundle ? buildBundleNode(root, entry) : null;
    if (bundle) {
      bundles += 1;
      bundleFiles += bundle.files.length;
    }
    folder.children.push({
      kind: 'entry',
      name,
      path: entry.path,
      summary: entry,
      bundle,
    });
  }

  // Recursive entry counts for folder badges, then a stable child order.
  for (const node of folderIndex.values()) {
    node.entryCount = countEntries(node);
  }
  sortChildren(rootNode);

  return {
    root: rootNode,
    counts: {
      folders: folderIndex.size - 1, // minus the synthetic root
      entries: firstClass.length,
      bundles,
      bundleFiles,
    },
  };
}
