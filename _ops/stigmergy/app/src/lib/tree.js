// Client-side shaping for the TREE lens. Pure, DOM-agnostic, unit-tested.
//
// Two transforms:
//   withRootGroup — wraps the palace's loose root-level entries in a synthetic
//     "(root)" folder so the top level reads as a short list of collapsible
//     groups, not 100+ bare entry rows. This is what makes top-level entries
//     legible (Loudon's first ask): they live in a labeled (root) group.
//   flattenVisible — turns the tree + an expanded-set into the ordered, depth-
//     stamped row list the lens renders. Folders/bundles collapse and expand;
//     a filter narrows to matching entries with their ancestor folders forced
//     open.

import { scoreEntry } from './pulse.js';

export const ROOT_GROUP_PATH = '(root)';

// The folder paths that must be open for `path`'s row to be visible — its
// ancestor folders, innermost last. A root-level entry (no slash) sits in the
// synthetic (root) group. Used by the ?tree=<path> deep-link to reveal a target.
export function ancestorsToExpand(path) {
  if (typeof path !== 'string' || path === '') return [];
  const dirs = path.split('/').slice(0, -1);
  if (dirs.length === 0) return [ROOT_GROUP_PATH];
  const out = [];
  let acc = '';
  for (const d of dirs) {
    acc = acc === '' ? d : `${acc}/${d}`;
    out.push(acc);
  }
  return out;
}

function entryLabel(node) {
  return node.summary?.title ?? node.name ?? node.path ?? '';
}

// Compare two entry nodes by the chosen key. Folders are handled by the caller;
// this only orders entries. name/type ascending, pulse descending; each falls
// back to title so the order is stable.
function compareEntries(a, b, key) {
  if (key === 'type') {
    const at = a.summary?.type ?? '~~';
    const bt = b.summary?.type ?? '~~';
    if (at !== bt) return at.localeCompare(bt);
    return entryLabel(a).localeCompare(entryLabel(b));
  }
  if (key === 'pulse') {
    const diff = scoreEntry(b.summary ?? {}) - scoreEntry(a.summary ?? {});
    if (diff !== 0) return diff;
    return entryLabel(a).localeCompare(entryLabel(b));
  }
  return entryLabel(a).localeCompare(entryLabel(b));
}

// Child ordering: folders, then entries, then loose files.
const KIND_ORDER = { folder: 0, entry: 1, 'loose-file': 2 };

// Order a folder's children: folders first (alpha), entries by `key`, loose
// files last (alpha by name). Returns a new array; the input is untouched.
function sortChildren(children, key) {
  const copy = [...(children ?? [])];
  copy.sort((a, b) => {
    if (a.kind !== b.kind) return (KIND_ORDER[a.kind] ?? 9) - (KIND_ORDER[b.kind] ?? 9);
    if (a.kind === 'entry') return compareEntries(a, b, key);
    return a.name.localeCompare(b.name);
  });
  return copy;
}

// Return a root node whose loose entry children are gathered under a synthetic
// "(root)" folder placed first, ahead of the organizational folders. If there
// are no loose root entries, the tree is returned unchanged.
export function withRootGroup(root) {
  const children = root?.children ?? [];
  const folders = children.filter((c) => c.kind === 'folder');
  const nonFolders = children.filter((c) => c.kind !== 'folder'); // entries + loose files
  const entryCount = nonFolders.filter((c) => c.kind === 'entry').length;
  if (nonFolders.length === 0) return root;
  const rootFolder = {
    kind: 'folder',
    name: ROOT_GROUP_PATH,
    path: ROOT_GROUP_PATH,
    children: nonFolders,
    entryCount,
    synthetic: true,
  };
  return { ...root, children: [rootFolder, ...folders] };
}

function entryMatches(node, q) {
  if (!q) return true;
  const s = node.summary ?? {};
  return (s.title ?? '').toLowerCase().includes(q)
    || (node.path ?? '').toLowerCase().includes(q)
    || (s.type ?? '').toLowerCase().includes(q);
}

// flattenVisible(root, { expanded, filter, sort }) -> Row[]
//   Row = { key, kind: 'folder'|'entry'|'bundle-file', depth, node,
//           isExpanded?, hasChildren?, isTopLevel? }
// `expanded` is a Set of folder/entry paths the user has opened. A non-empty
// `filter` forces folders open and drops non-matching entries (and folders with
// no matching descendant); bundles are NOT force-opened under filter. `sort` is
// an entry-ordering key ('name' | 'type' | 'pulse'); folders stay alpha-first.
export function flattenVisible(root, { expanded = new Set(), filter = '', sort = 'name' } = {}) {
  const q = (filter || '').trim().toLowerCase();
  const rows = [];

  // Returns true when it emitted at least one row (used to prune empty folders
  // under an active filter).
  function walk(children, depth) {
    let emitted = false;
    for (const node of sortChildren(children, sort)) {
      if (node.kind === 'folder') {
        const headerIndex = rows.length;
        const isExpanded = q ? true : expanded.has(node.path);
        rows.push({
          key: `f:${node.path}`,
          kind: 'folder',
          depth,
          node,
          isExpanded,
          hasChildren: (node.children ?? []).length > 0,
          isTopLevel: depth === 0,
        });
        const childEmitted = isExpanded ? walk(node.children, depth + 1) : false;
        if (q && !childEmitted) {
          rows.splice(headerIndex); // no matching descendant — drop the folder
        } else {
          emitted = true;
        }
      } else if (node.kind === 'entry') {
        if (!entryMatches(node, q)) continue;
        const hasBundle = !!node.bundle && (node.bundle.files ?? []).length > 0;
        const isExpanded = expanded.has(node.path);
        rows.push({
          key: `e:${node.path}`,
          kind: 'entry',
          depth,
          node,
          isExpanded,
          hasChildren: hasBundle,
          isTopLevel: depth === 0,
        });
        emitted = true;
        if (hasBundle && isExpanded) {
          for (const f of node.bundle.files) {
            rows.push({
              key: `b:${f.relPath}`,
              kind: 'bundle-file',
              depth: depth + 1,
              node: f,
              isTopLevel: false,
            });
          }
        }
      } else if (node.kind === 'loose-file') {
        // Loose files are secondary — hide them while a filter is narrowing to
        // matching entries, surface them otherwise.
        if (q) continue;
        rows.push({
          key: `l:${node.relPath}`,
          kind: 'loose-file',
          depth,
          node,
          isTopLevel: depth === 0,
        });
        emitted = true;
      }
    }
    return emitted;
  }

  walk(root?.children ?? [], 0);
  return rows;
}
