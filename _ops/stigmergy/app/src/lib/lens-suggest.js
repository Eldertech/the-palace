// lens-suggest.js — rank candidate GLASS pages for a lensing subject by
// link-distance over the typed-link graph (the freshest palace-map-full-*.json,
// same source TopologyLens already reads).
//
// [[The Lens]]'s own design names the actual hard problem: N pages give N²
// ordered pairs and most are noise, so the build must "lean on the graph to
// suggest high-value lensings... never make the user hunt N²." Already-linked
// or two-hop-apart pages are reliable sparks; the 2026-07-02 prototype run
// confirmed this empirically (the one already-linked pair scored 5/5, the two
// unlinked pairs split 1.5/3.5 on whether real conceptual apparatus — not just
// proximity — transferred). Link-distance is a real first-pass filter, not a
// perfect one; it is a ranking, not a judgment of a pairing's actual spark.
//
// Pure function over {nodes, edges} (the shape readLatestMap already returns)
// — no I/O here, so it is trivially unit-testable without a fixture palace.

// BFS over the UNDIRECTED typed-link graph from `subjectTitle`. A `mirrors` or
// `connects-to` edge signals relational proximity regardless of which node
// happens to be `source` vs `target` in the stored record, so both directions
// count as one hop.
function bfsDistances(edges, subjectTitle) {
  const adjacency = new Map();
  const addEdge = (a, b) => {
    if (!adjacency.has(a)) adjacency.set(a, new Set());
    adjacency.get(a).add(b);
  };
  for (const e of edges) {
    if (!e || typeof e.source !== 'string' || typeof e.target !== 'string') continue;
    addEdge(e.source, e.target);
    addEdge(e.target, e.source);
  }

  const distances = new Map([[subjectTitle, 0]]);
  const queue = [subjectTitle];
  let head = 0;
  while (head < queue.length) {
    const current = queue[head++];
    const currentDist = distances.get(current);
    const neighbors = adjacency.get(current);
    if (!neighbors) continue;
    for (const next of neighbors) {
      if (distances.has(next)) continue;
      distances.set(next, currentDist + 1);
      queue.push(next);
    }
  }
  return distances;
}

/**
 * Rank candidate glass pages for lensing `subjectTitle`, nearest (most likely
 * to spark) first. Unreachable nodes (no path in the typed-link graph) sort
 * last, in map order — they are not excluded, since a distant unlinked pair
 * is exactly where the design's "rare cross-domain gold" lives; they are just
 * not promoted to the top of a necessarily-truncated list.
 *
 * @param {{nodes: Array<{id: string}>, edges: Array<{source: string, target: string}>}} map
 * @param {string} subjectTitle
 * @param {number} [limit=8]
 * @returns {Array<{title: string, distance: number}>}
 */
export function rankLensCandidates(map, subjectTitle, limit = 8) {
  const nodes = Array.isArray(map?.nodes) ? map.nodes : [];
  const edges = Array.isArray(map?.edges) ? map.edges : [];
  if (!subjectTitle || nodes.length === 0) return [];

  const distances = bfsDistances(edges, subjectTitle);
  const candidates = nodes
    .map((n) => n && n.id)
    .filter((title) => typeof title === 'string' && title && title !== subjectTitle)
    .map((title) => ({ title, distance: distances.has(title) ? distances.get(title) : Infinity }));

  candidates.sort((a, b) => (a.distance - b.distance) || a.title.localeCompare(b.title));
  return candidates.slice(0, limit);
}
