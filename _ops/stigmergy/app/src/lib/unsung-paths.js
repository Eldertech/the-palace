// Unsung paths — body wikilinks that aren't formalized in YAML.
//
// In Palace ontology: typed links (YAML frontmatter) are the semantic
// web; body wikilinks are conversational fabric. An *unsung path* is a
// [[wikilink]] that appears in an entry's body but does NOT appear in the
// entry's YAML `links` block — a connection the prose asserts but the
// graph layer doesn't yet ratify. The Weave looks for these to propose
// promotion to typed links.
//
// This module provides:
//   - findUnsungInEntry({ links, body }) — pure, returns body-wikilink
//     target NAMES not covered by the entry's YAML links.
//   - findUnsungEdges(entryRecords, palaceIndex) — pure, walks records,
//     resolves names against a name→path index, returns edge records of
//     the form { source: path, target_name, target_path }.
//
// The server-side `/api/unsung-paths` endpoint walks the live palace
// (via listEntries/readEntry primitives) and feeds the pure pipeline.

import { extractWikilinks } from './wikilink.js';

// Names the YAML link block already covers, normalized (lowercased + trimmed).
// YAML link targets may include [[brackets]] from raw frontmatter; the parser
// strips those, so we just lowercase the resulting string.
function yamlLinkNames(entry) {
  const out = new Set();
  for (const l of entry?.links ?? []) {
    if (!l || typeof l.target !== 'string') continue;
    out.add(l.target.trim().toLowerCase());
  }
  return out;
}

// Body wikilinks not covered by YAML links. Returns unique target names
// in document-first order.
export function findUnsungInEntry(entry) {
  if (!entry || typeof entry.body !== 'string') return [];
  const yaml = yamlLinkNames(entry);
  const seen = new Set();
  const out = [];
  for (const name of extractWikilinks(entry.body)) {
    const key = name.trim().toLowerCase();
    if (!key || yaml.has(key) || seen.has(key)) continue;
    seen.add(key);
    out.push(name);
  }
  return out;
}

// Resolve a wikilink name to a palace entry path via the supplied index
// (lowercased slug → path). Returns null when the name doesn't resolve to
// any known entry — those are body-mentions of off-palace concepts, not
// edges in the typed-link graph.
function resolveName(name, palaceIndex) {
  if (!palaceIndex) return null;
  const key = name.trim().toLowerCase();
  // Index may be a Map<string,string> or a plain object.
  if (palaceIndex.get) return palaceIndex.get(key) ?? null;
  return palaceIndex[key] ?? null;
}

// Walk entry records, return [{ source, target_name, target_path }] for
// each body wikilink not in YAML AND resolving to a known palace entry.
// Self-loops (source === target_path) are excluded.
export function findUnsungEdges(entryRecords, palaceIndex) {
  if (!Array.isArray(entryRecords)) return [];
  const out = [];
  for (const e of entryRecords) {
    if (!e || typeof e.path !== 'string') continue;
    const unsung = findUnsungInEntry(e);
    for (const name of unsung) {
      const targetPath = resolveName(name, palaceIndex);
      if (!targetPath || targetPath === e.path) continue;
      out.push({ source: e.path, target_name: name, target_path: targetPath });
    }
  }
  return out;
}

// Build a name→path index from an entries array. The name uses both the
// entry's title and its filename (sans .md) so a wikilink like [[Foo]] resolves
// whether title or filename matches.
export function buildPalaceIndex(entries) {
  const out = new Map();
  if (!Array.isArray(entries)) return out;
  for (const e of entries ?? []) {
    if (!e || typeof e.path !== 'string') continue;
    const file = e.path.split('/').pop().replace(/\.md$/, '');
    const fileKey = file.trim().toLowerCase();
    if (fileKey && !out.has(fileKey)) out.set(fileKey, e.path);
    if (typeof e.title === 'string') {
      const titleKey = e.title.trim().toLowerCase();
      if (titleKey && !out.has(titleKey)) out.set(titleKey, e.path);
    }
  }
  return out;
}
