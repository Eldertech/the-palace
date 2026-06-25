// Topology avatars — join the typed-link graph's nodes to the per-entry
// bundle icon art (the hand-drawn `<Title> — icon.png` avatars), so the
// canvas can paint a node as its avatar instead of a bare phosphor dot.
//
// The map JSON carries no icon — only `path`. The STATE deck already holds
// the entries catalog, where each entry summary carries `icon` (a palace-
// relative path served by GET /api/file) when its bundle has avatar art.
// We join on `path`. Nodes without art keep the dot; this is a graceful
// fallback, never an error — most of the 300+ nodes have no icon yet.
//
// Pure + SSR-safe. The component owns image loading + canvas drawing; this
// module only does the data join and the size policy (so both are testable
// without a DOM).

// Build a path -> icon lookup from the entries catalog. Entries with no
// bundle art (icon null/empty) are skipped, so `.get(path)` is truthy only
// when there is real art to paint.
export function buildIconByPath(entries) {
  const m = new Map();
  for (const e of entries ?? []) {
    if (e && typeof e.path === 'string' && typeof e.icon === 'string' && e.icon.trim() !== '') {
      m.set(e.path, e.icon);
    }
  }
  return m;
}

// Stamp each node with its icon (or null) from the lookup. Mutates in place
// and returns the array — matches the prepareGraph pipeline, where nodes are
// already fresh clones d3-force is free to mutate.
export function attachIcons(nodes, iconByPath) {
  const lookup = iconByPath instanceof Map ? iconByPath : new Map();
  for (const n of nodes ?? []) {
    n.icon = (n && typeof n.path === 'string' && lookup.get(n.path)) || null;
  }
  return nodes;
}

// Avatar draw radius by role. Larger than the dot radii (ROLE_STYLE in the
// component) so the art is legible — a 3px dot can't carry a hand-drawn
// avatar. Hubs get the most room; orphans the least. This radius also feeds
// the force-collide accessor so icon nodes reserve their footprint and stop
// stacking into an unreadable pile.
export const AVATAR_RADIUS = { hub: 13, default: 9, orphan: 8 };

export function avatarRadiusFor(role) {
  return AVATAR_RADIUS[role] ?? AVATAR_RADIUS.default;
}

// Count of nodes that resolved to avatar art — for the legend tally.
export function avatarCount(nodes) {
  let n = 0;
  for (const node of nodes ?? []) if (node && node.icon) n += 1;
  return n;
}
