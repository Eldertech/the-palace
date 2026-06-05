// Topology — read the freshest palace-map-full-*.json from _ops/maps/.
//
// Map Build emits dated snapshots (palace-map-full-YYYY-MM-DD.json). The
// freshest one is the source for STATE's Topology Lens. This lib does no
// layout — it just selects + parses. Layout happens client-side in the
// TopologyLens component.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

const MAPS_REL = '_ops/maps';
const FULL_RE = /^palace-map-full-(\d{4}-\d{2}-\d{2})\.json$/;

// List dated full-map JSON files in _ops/maps/, newest first by filename.
// Filenames already sort lexicographically by date, so a string sort works.
export function listFullMaps(palaceRoot) {
  const dir = resolve(palaceRoot, MAPS_REL);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .map((name) => {
      const m = name.match(FULL_RE);
      return m ? { name, date: m[1] } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.date.localeCompare(a.date));
}

// Return the freshest map's parsed payload + the relative source path,
// or null if no maps are available / the file is unreadable.
export function readLatestMap(palaceRoot) {
  const candidates = listFullMaps(palaceRoot);
  if (candidates.length === 0) return null;
  const chosen = candidates[0];
  const abs = resolve(palaceRoot, MAPS_REL, chosen.name);
  try {
    const raw = readFileSync(abs, 'utf8');
    const data = JSON.parse(raw);
    return {
      source: join(MAPS_REL, chosen.name),
      meta: data.meta ?? {},
      nodes: Array.isArray(data.nodes) ? data.nodes : [],
      edges: Array.isArray(data.edges) ? data.edges : [],
    };
  } catch (err) {
    return null;
  }
}
