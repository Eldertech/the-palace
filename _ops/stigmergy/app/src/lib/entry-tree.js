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

import { readdirSync, statSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { listEntries } from './entries.js';
import { listBundleFiles, classifyFile } from './bundle.js';

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

// Child ordering within a folder: folders, then entries, then loose files.
const KIND_ORDER = { folder: 0, entry: 1, 'loose-file': 2 };

// Sort a folder's children in place: folders before entries before loose files;
// folders alpha by name; entries alpha by title; loose files alpha by name. The
// client may re-sort entries (see tree.js), but this gives a stable default.
function sortChildren(folder) {
  folder.children.sort((a, b) => {
    if (a.kind !== b.kind) return KIND_ORDER[a.kind] - KIND_ORDER[b.kind];
    if (a.kind === 'entry') {
      return (a.summary?.title ?? a.name).localeCompare(b.summary?.title ?? b.name);
    }
    return a.name.localeCompare(b.name);
  });
  for (const child of folder.children) {
    if (child.kind === 'folder') sortChildren(child);
  }
}

// Surface loose non-.md files that sit DIRECTLY in a folder that already holds
// entries — a stray diagram or html next to its siblings. Scoped to the known
// org-folder dirs only (never a blind full-disk walk), so it can't wander into
// _tools/ or other heavy, entry-less trees. Returns the count; mutates nodes.
function collectLooseFiles(palaceRoot, folderIndex) {
  let count = 0;
  for (const [folderPath, node] of folderIndex) {
    const absDir = folderPath === '' ? palaceRoot : join(palaceRoot, folderPath);
    let dirents;
    try { dirents = readdirSync(absDir, { withFileTypes: true }); } catch (_) { continue; }
    for (const d of dirents) {
      if (!d.isFile()) continue;            // dirs are folders or bundles
      if (d.name.startsWith('.')) continue; // hidden / junk
      if (d.name.endsWith('.md')) continue; // entries + bundle files already placed
      const relPath = folderPath === '' ? d.name : `${folderPath}/${d.name}`;
      let size = 0;
      try { size = statSync(join(absDir, d.name)).size; } catch (_) { /* unreadable — size 0 */ }
      node.children.push({
        kind: 'loose-file',
        name: d.name,
        relPath,
        fileKind: classifyFile(d.name),
        size,
      });
      count += 1;
    }
  }
  return count;
}

// buildEntryTree(palaceRoot) -> { root, counts }
//   root   : the synthetic palace-root FolderNode (path '')
//   counts : { folders, entries, bundles, bundleFiles, looseFiles }
//
// Node shapes:
//   FolderNode = { kind:'folder', name, path, children: Node[], entryCount }
//   EntryNode  = { kind:'entry',  name, path, summary, bundle: BundleNode|null }
//   BundleNode = { kind:'bundle', dir, files: [{name, relPath, kind, size, isEntry}] }
//   LooseFile  = { kind:'loose-file', name, relPath, fileKind, size }
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

  // Loose non-.md files sitting directly in any entry-bearing folder.
  const looseFiles = collectLooseFiles(root, folderIndex);

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
      looseFiles,
    },
  };
}
