// server/api/entries.js — palace-entry read endpoints (the STATE deck's data).
//   GET /api/entries       — recursive index of palace .md entries
//   GET /api/unsung-paths  — body-wikilink edges not formalized in YAML
//   GET /api/topology      — the freshest palace-map-full-*.json
//   GET /api/entry?path=   — one entry's full read shape

import { jsonResponse } from '../http.js';
import { listEntries, readEntry, walkEntryRecords } from '../../src/lib/entries.js';
import { readLatestMap } from '../../src/lib/topology.js';
import { findUnsungEdges, buildPalaceIndex } from '../../src/lib/unsung-paths.js';

export async function entriesRoutes(ctx) {
  const { res, palaceRoot, urlPath, query, method } = ctx;

  if (urlPath === '/api/entries' && method === 'GET') {
    const entries = listEntries(palaceRoot);
    jsonResponse(res, 200, { entries, count: entries.length, ts: new Date().toISOString() });
    return true;
  }

  // For each entry, the [[wikilinks]] in the body that are NOT formalized in
  // YAML AND resolve to a known entry — the Weave's "unsung paths".
  if (urlPath === '/api/unsung-paths' && method === 'GET') {
    const records = [];
    for (const r of walkEntryRecords(palaceRoot)) records.push(r);
    const palaceIndex = buildPalaceIndex(records);
    const edges = findUnsungEdges(records, palaceIndex);
    jsonResponse(res, 200, {
      edges,
      entry_count: records.length,
      edge_count: edges.length,
      ts: new Date().toISOString(),
    });
    return true;
  }

  // The most recent Map Build snapshot in _ops/maps/.
  if (urlPath === '/api/topology' && method === 'GET') {
    const map = readLatestMap(palaceRoot);
    if (!map) {
      jsonResponse(res, 404, { error: 'no palace-map-full-*.json found in _ops/maps/' });
      return true;
    }
    jsonResponse(res, 200, map);
    return true;
  }

  // One entry: { path, title, frontmatter, body, links, bundle, summary }.
  if (urlPath === '/api/entry' && method === 'GET') {
    const rel = query.get('path');
    if (!rel) {
      jsonResponse(res, 400, { error: 'missing ?path' });
      return true;
    }
    const entry = readEntry(palaceRoot, rel);
    if (!entry) {
      jsonResponse(res, 404, { error: 'entry not found or excluded', path: rel });
      return true;
    }
    jsonResponse(res, 200, entry);
    return true;
  }

  return false;
}
