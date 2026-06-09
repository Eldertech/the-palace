// entry-grounding.js — assemble the Companion's grounding context for one entry.
//
// The entry-agent window is "a blackboard client wearing an entry's face": when
// it discusses or edits a passage it must be grounded in (1) the page itself,
// (2) the page's typed-link neighborhood — each neighbor's title, stage, and
// forward_vector, the directional desire that says what the neighbor is for —
// and (3) the palace floor (the Tier-0 invariants every agent shares).
//
// This module is page-agnostic: the grounding is assembled at runtime from
// whatever entry is open, read from frontmatter. It is pure over the filesystem
// (readEntry / listEntries) so it unit-tests against a temp palace.
//
// M1a uses this to make the window's grounding readout HONEST (real neighbors,
// real vectors) instead of the M0 stub. M1c reuses the same object to build the
// Companion worker's prompt — one grounding, two consumers.

import { readEntry, listEntries } from './entries.js';
import { buildIndex, resolveWikilink } from './wikilink.js';

// The Tier-0 floor every Companion inherits. Invariant across entries, so it is
// a small cached descriptor rather than a per-call file read — the full floor
// text (JEWEL/SCHEMA/pillars) is injected into the worker prompt at edit time;
// here it only needs to tell the reader the floor is present and what it is.
export const PALACE_FLOOR = Object.freeze({
  forward_vector: 'symbiotic human and AI flourishing through joyful creation',
  pillars: ['creation', 'tools', 'philosophy', 'practice'],
  note: 'Tier-0 invariants (the Jewel, the Four Pillars, the link ontology) are injected at edit time.',
});

// A neighbor as the readout/worker wants it: who it is, how it relates, and what
// it wants (forward_vector). Unresolved targets (ghost nodes) are kept — a
// missing connection is an invitation, not an error — flagged resolved:false.
function neighborFrom(palaceRoot, link, index) {
  const { name, path } = resolveWikilink(index, link.target);
  const base = {
    name,
    path: path ?? null,
    type: link.type ?? 'connects-to',
    label: link.label ?? null,
    resolved: !!path,
    stage: null,
    type_of_entry: null,
    forward_vector: null,
  };
  if (!path) return base;
  const nb = readEntry(palaceRoot, path);
  if (!nb) return base;
  return {
    ...base,
    name: nb.title || name,
    stage: typeof nb.frontmatter?.stage === 'string' ? nb.frontmatter.stage : null,
    type_of_entry: typeof nb.frontmatter?.type === 'string' ? nb.frontmatter.type : null,
    forward_vector: typeof nb.frontmatter?.forward_vector === 'string' ? nb.frontmatter.forward_vector : null,
  };
}

/**
 * Assemble the grounding for one entry.
 *
 * @param {string} palaceRoot
 * @param {string} relPath — palace-relative path to the entry (.md)
 * @returns {object|null} grounding, or null if the entry can't be read
 *   {
 *     entry: { path, title, type, stage, pillars, forward_vector, body_chars, link_count },
 *     neighbors: [{ name, path, type, label, resolved, stage, type_of_entry, forward_vector }],
 *     counts: { links, neighbors_resolved, neighbors_ghost },
 *     floor: PALACE_FLOOR,
 *   }
 */
/**
 * Resolve an entry TITLE (a flat-vault name, e.g. a steward's `from`) to its
 * palace-relative path, or null when no such entry exists. The page IS the
 * agent, so a RESOURCE_REQUEST's `from` is usually the project entry's title.
 */
export function resolveTitleToPath(palaceRoot, title) {
  if (typeof title !== 'string' || title.trim() === '') return null;
  const index = buildIndex(listEntries(palaceRoot));
  const { path } = resolveWikilink(index, title.trim());
  return path || null;
}

/**
 * Assemble grounding for the entry behind a given TITLE. Returns { path,
 * grounding } — grounding is null (and path null) when the title names no
 * palace entry (e.g. a non-page agent handle), so the caller can still ground a
 * trickster turn in the request itself without an entry.
 */
export function assembleGroundingByTitle(palaceRoot, title) {
  const path = resolveTitleToPath(palaceRoot, title);
  if (!path) return { path: null, grounding: null };
  return { path, grounding: assembleGrounding(palaceRoot, path) };
}

export function assembleGrounding(palaceRoot, relPath) {
  const entry = readEntry(palaceRoot, relPath);
  if (!entry) return null;

  const index = buildIndex(listEntries(palaceRoot));

  // One neighbor per typed link, de-duplicated by resolved path (an entry can
  // point at the same target with two link types; the readout shows it once,
  // keeping the first relation's type/label).
  const neighbors = [];
  const seenPaths = new Set();
  for (const link of entry.links || []) {
    const nb = neighborFrom(palaceRoot, link, index);
    if (nb.path) {
      if (seenPaths.has(nb.path)) continue;
      seenPaths.add(nb.path);
    }
    neighbors.push(nb);
  }

  const resolved = neighbors.filter((n) => n.resolved).length;
  return {
    entry: {
      path: entry.path,
      title: entry.title,
      type: typeof entry.frontmatter?.type === 'string' ? entry.frontmatter.type : null,
      stage: typeof entry.frontmatter?.stage === 'string' ? entry.frontmatter.stage : null,
      pillars: Array.isArray(entry.summary?.pillars) ? entry.summary.pillars : [],
      forward_vector: typeof entry.frontmatter?.forward_vector === 'string' ? entry.frontmatter.forward_vector : null,
      body_chars: typeof entry.body === 'string' ? entry.body.length : 0,
      link_count: (entry.links || []).length,
    },
    neighbors,
    counts: {
      links: (entry.links || []).length,
      neighbors_resolved: resolved,
      neighbors_ghost: neighbors.length - resolved,
    },
    floor: PALACE_FLOOR,
  };
}
