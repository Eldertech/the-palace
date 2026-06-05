// Cross-pillar bridges — annotate edges with whether they span pillars.
//
// Pillars come from the entries catalog (each entry's YAML `pillars` array
// — creation / tools / philosophy / practice). The topology map keys edges
// by node id, and each node carries a `path`. We join entries by path
// (the only stable key across the two sources) so the lens can color a
// link differently when its endpoints sit in disjoint pillar sets.
//
// Pure functions, no React, no DOM — the lens consumes the annotations.

const KNOWN_PILLARS = new Set(['creation', 'tools', 'philosophy', 'practice']);

// Normalize an entry's `pillars` field into a Set of lowercase known names.
// Mis-cased or unknown pillars are dropped; missing/empty becomes an empty set.
function normalizePillars(raw) {
  const set = new Set();
  if (!Array.isArray(raw)) return set;
  for (const p of raw) {
    if (typeof p !== 'string') continue;
    const lower = p.trim().toLowerCase();
    if (KNOWN_PILLARS.has(lower)) set.add(lower);
  }
  return set;
}

// Map from entry path -> Set<pillar>. The lens passes this once per
// entries fetch; lookups are O(1).
export function buildPillarsByPath(entries) {
  const out = new Map();
  if (!Array.isArray(entries)) return out;
  for (const e of entries) {
    if (!e || typeof e.path !== 'string') continue;
    out.set(e.path, normalizePillars(e.pillars));
  }
  return out;
}

// Given two pillar Sets, is the pair a cross-pillar bridge? An edge counts
// as a bridge when both sides have at least one pillar AND the two sets
// are disjoint. A side with zero pillars (unaffiliated machinery, ceremony
// scaffolds, ops files) is not a bridge — the question doesn't apply.
export function isCrossPillar(a, b) {
  if (!(a instanceof Set) || !(b instanceof Set)) return false;
  if (a.size === 0 || b.size === 0) return false;
  for (const p of a) {
    if (b.has(p)) return false;
  }
  return true;
}

// Annotate each node with its pillar Set, then each link with a
// `crossPillar` boolean. Operates on the cloned graph shape used inside
// TopologyLens (nodes have `path`; links have raw string source/target ids).
export function annotateBridges(graph, pillarsByPath) {
  if (!graph || !Array.isArray(graph.nodes) || !Array.isArray(graph.links)) {
    return { nodes: [], links: [] };
  }
  const nodesById = new Map();
  const nodes = graph.nodes.map((n) => {
    const pillars = pillarsByPath?.get?.(n.path) ?? new Set();
    const out = { ...n, pillars };
    nodesById.set(n.id, out);
    return out;
  });
  const links = graph.links.map((l) => {
    const s = nodesById.get(typeof l.source === 'string' ? l.source : l.source?.id);
    const t = nodesById.get(typeof l.target === 'string' ? l.target : l.target?.id);
    const crossPillar = !!(s && t && isCrossPillar(s.pillars, t.pillars));
    return { ...l, crossPillar };
  });
  return { nodes, links };
}

// Count bridges for the legend — { total, cross }.
export function bridgeCounts(links) {
  let cross = 0;
  for (const l of links ?? []) if (l.crossPillar) cross += 1;
  return { total: links?.length ?? 0, cross };
}
