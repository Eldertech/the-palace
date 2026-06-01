// Topology roles — derive 'hub' / 'orphan' / 'default' from each node's
// degree. Pure function on a node array (each node has `degree`); the
// renderer consumes the role to pick a size + color.
//
// Hubs are the top-N most-connected nodes (default: 95th percentile, with
// a floor of 8 connections — a degree of 2 in a small palace is not a hub).
// Orphans are nodes with zero connections. Everything else is 'default'.

const DEFAULT_PERCENTILE = 0.95;
const HUB_FLOOR = 8;

export function degreeThreshold(degrees, percentile = DEFAULT_PERCENTILE) {
  if (!Array.isArray(degrees) || degrees.length === 0) return Infinity;
  const sorted = [...degrees].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor(sorted.length * percentile));
  return Math.max(HUB_FLOOR, sorted[idx]);
}

export function assignRoles(nodes, { percentile = DEFAULT_PERCENTILE } = {}) {
  if (!Array.isArray(nodes)) return [];
  const degrees = nodes.map((n) => n.degree ?? 0);
  const threshold = degreeThreshold(degrees, percentile);
  return nodes.map((n) => {
    const d = n.degree ?? 0;
    let role = 'default';
    if (d === 0) role = 'orphan';
    else if (d >= threshold) role = 'hub';
    return { ...n, role };
  });
}

// Bucket counts for the legend, so the UI can show "5 hubs / 12 orphans"
// without recomputing.
export function roleCounts(nodes) {
  const out = { hub: 0, orphan: 0, default: 0 };
  for (const n of nodes ?? []) {
    out[n.role ?? 'default'] += 1;
  }
  return out;
}
