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

export const ROOT_GROUP_PATH = '(root)';

// Return a root node whose loose entry children are gathered under a synthetic
// "(root)" folder placed first, ahead of the organizational folders. If there
// are no loose root entries, the tree is returned unchanged.
export function withRootGroup(root) {
  const children = root?.children ?? [];
  const entries = children.filter((c) => c.kind === 'entry');
  const folders = children.filter((c) => c.kind === 'folder');
  if (entries.length === 0) return root;
  const rootFolder = {
    kind: 'folder',
    name: ROOT_GROUP_PATH,
    path: ROOT_GROUP_PATH,
    children: entries,
    entryCount: entries.length,
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

// flattenVisible(root, { expanded, filter }) -> Row[]
//   Row = { key, kind: 'folder'|'entry'|'bundle-file', depth, node,
//           isExpanded?, hasChildren?, isTopLevel? }
// `expanded` is a Set of folder/entry paths the user has opened. A non-empty
// `filter` forces folders open and drops non-matching entries (and folders with
// no matching descendant); bundles are NOT force-opened under filter.
export function flattenVisible(root, { expanded = new Set(), filter = '' } = {}) {
  const q = (filter || '').trim().toLowerCase();
  const rows = [];

  // Returns true when it emitted at least one row (used to prune empty folders
  // under an active filter).
  function walk(children, depth) {
    let emitted = false;
    for (const node of children ?? []) {
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
      }
    }
    return emitted;
  }

  walk(root?.children ?? [], 0);
  return rows;
}
