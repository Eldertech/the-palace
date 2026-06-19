// Hub candidates — concept entries that have accumulated enough INBOUND typed
// links to organize a region of the graph, and so want promotion to `type: hub`.
//
// In Palace ontology a hub "is not self-assigned — it emerges through the Weave
// Ceremony when an entry accumulates ≥5 typed links" (SCHEMA §1), and §4 pins the
// metric: "the Map computes the hub's inbound degree." So the audit measures
// INBOUND degree — how many OTHER entries point a typed link AT this one — and
// proposes promoting the over-threshold ones that are still typed `concept`
// (the only type §1's promotion/demotion path moves to/from hub).
//
// PURE (no fs/git): the runner walks the live palace into entry records and
// feeds them here; this module only counts + filters.

import { buildPalaceIndex } from './unsung-paths.js';

// Resolve a YAML link target (a bare title, post-normalizeLinks) to a palace
// path via the name→path index. Returns null for off-palace targets.
function resolveTarget(target, index) {
  if (typeof target !== 'string') return null;
  return index.get(target.trim().toLowerCase()) ?? null;
}

/**
 * Inbound typed-link degree per entry: the number of DISTINCT other entries
 * whose frontmatter `links` point at it (self-links and unresolved/off-palace
 * targets excluded). Returns Map<path, number>. Pure.
 */
export function inboundDegree(records) {
  const index = buildPalaceIndex(records);
  const sources = new Map(); // targetPath -> Set<sourcePath>
  for (const e of records ?? []) {
    if (!e || typeof e.path !== 'string' || !Array.isArray(e.links)) continue;
    for (const l of e.links) {
      const tp = resolveTarget(l && l.target, index);
      if (!tp || tp === e.path) continue;
      if (!sources.has(tp)) sources.set(tp, new Set());
      sources.get(tp).add(e.path);
    }
  }
  const degree = new Map();
  for (const [tp, set] of sources) degree.set(tp, set.size);
  return degree;
}

/**
 * Concept entries whose inbound degree has reached the hub threshold — the
 * promote_hub audit's candidates. Sorted most-connected first (the strongest
 * hubs lead the queue). Pure.
 *
 * @param {Array<{path:string,title:string,type:?string,links:Array}>} records
 * @param {object} [opts]
 * @param {number} [opts.threshold=5] — inbound-degree floor (SCHEMA §1: ≥5)
 * @returns {Array<{path:string, title:string, inbound_degree:number}>}
 */
export function findHubCandidates(records, { threshold = 5 } = {}) {
  if (!Array.isArray(records)) return [];
  const degree = inboundDegree(records);
  const out = [];
  for (const e of records) {
    if (!e || typeof e.path !== 'string') continue;
    // Only concepts promote to hub (§1). An entry already typed hub is excluded
    // by this filter; non-concept types (project, person, meta, …) are
    // deliberately classified and are not retyped by this audit.
    if (e.type !== 'concept') continue;
    const d = degree.get(e.path) ?? 0;
    if (d >= threshold) {
      out.push({ path: e.path, title: e.title || e.path.split('/').pop().replace(/\.md$/i, ''), inbound_degree: d });
    }
  }
  out.sort((a, b) => b.inbound_degree - a.inbound_degree || a.path.localeCompare(b.path));
  return out;
}
