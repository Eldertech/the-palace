// Palace-aware diff: frontmatter changes as FIELD-LEVEL changes, not raw
// text diff. Given the before/after text of an entry .md, compute:
//   - frontmatter field changes: added / removed / changed (scalar),
//     with links + pillars compared as sets so a reordering reads as no-op
//   - a body text changed flag (true if the markdown body differs)
//
// This is what makes the LOG diff view legible: `stage: seed→sprout`,
// `forward_vector changed`, `+2 links` instead of a sea of +/- lines.

import { parseFrontmatter, normalizeLinks, normalizePillars } from './yaml-frontmatter.js';

// Compare two frontmatter objects, return an array of field-change records:
//   { field, kind: 'added'|'removed'|'changed', before, after }
// `links` and `pillars` get set-aware treatment; everything else is compared
// by JSON value so nested objects (agency_profile) diff cleanly.
export function diffFrontmatter(beforeFm = {}, afterFm = {}) {
  const changes = [];
  const keys = new Set([...Object.keys(beforeFm || {}), ...Object.keys(afterFm || {})]);

  for (const key of keys) {
    if (key === 'links') {
      const lc = diffLinks(beforeFm.links, afterFm.links);
      if (lc) changes.push(lc);
      continue;
    }
    if (key === 'pillars') {
      const pc = diffPillars(beforeFm.pillars, afterFm.pillars);
      if (pc) changes.push(pc);
      continue;
    }
    const had = key in (beforeFm || {});
    const has = key in (afterFm || {});
    const b = beforeFm?.[key];
    const a = afterFm?.[key];
    if (had && !has) {
      changes.push({ field: key, kind: 'removed', before: b, after: undefined });
    } else if (!had && has) {
      changes.push({ field: key, kind: 'added', before: undefined, after: a });
    } else if (JSON.stringify(b) !== JSON.stringify(a)) {
      changes.push({ field: key, kind: 'changed', before: b, after: a });
    }
  }
  // Stable order: stage and forward_vector first (the high-signal transitions),
  // then alphabetical.
  const priority = { stage: 0, forward_vector: 1, type: 2, status: 3 };
  changes.sort((x, y) => {
    const px = priority[x.field] ?? 50;
    const py = priority[y.field] ?? 50;
    if (px !== py) return px - py;
    return x.field.localeCompare(y.field);
  });
  return changes;
}

// Set-aware link diff. Returns a single change record with added/removed
// link descriptors, or null if the link set is identical (ignoring order).
function diffLinks(beforeRaw, afterRaw) {
  const before = normalizeLinks(beforeRaw);
  const after = normalizeLinks(afterRaw);
  const keyOf = (l) => `${l.type}::${l.target}::${l.label ?? ''}`;
  const beforeKeys = new Set(before.map(keyOf));
  const afterKeys = new Set(after.map(keyOf));
  const added = after.filter((l) => !beforeKeys.has(keyOf(l)));
  const removed = before.filter((l) => !afterKeys.has(keyOf(l)));
  if (added.length === 0 && removed.length === 0) return null;
  return {
    field: 'links',
    kind: 'changed',
    addedLinks: added,
    removedLinks: removed,
    beforeCount: before.length,
    afterCount: after.length,
  };
}

// Set-aware pillar diff.
function diffPillars(beforeRaw, afterRaw) {
  const before = normalizePillars(beforeRaw);
  const after = normalizePillars(afterRaw);
  const bSet = new Set(before);
  const aSet = new Set(after);
  const added = after.filter((p) => !bSet.has(p));
  const removed = before.filter((p) => !aSet.has(p));
  if (added.length === 0 && removed.length === 0) return null;
  return { field: 'pillars', kind: 'changed', addedPillars: added, removedPillars: removed };
}

// Full palace-aware diff of one .md file given its before/after text.
// Returns { frontmatterChanges: [...], bodyChanged: bool, hadFrontmatter,
// hasFrontmatter }.
export function diffEntryText(beforeText, afterText) {
  const before = parseFrontmatter(beforeText ?? '');
  const after = parseFrontmatter(afterText ?? '');
  const frontmatterChanges = diffFrontmatter(before.frontmatter, after.frontmatter);
  const bodyChanged = (before.body ?? '').trim() !== (after.body ?? '').trim();
  return {
    frontmatterChanges,
    bodyChanged,
    hadFrontmatter: Object.keys(before.frontmatter || {}).length > 0,
    hasFrontmatter: Object.keys(after.frontmatter || {}).length > 0,
  };
}

// Compact human label for a single frontmatter change (used on commit cards
// and the diff view). Examples: "stage: seed -> sprout", "forward_vector
// changed", "+2 links", "type added: concept".
export function changeLabel(change) {
  if (!change) return '';
  if (change.field === 'links') {
    const parts = [];
    if (change.addedLinks?.length) parts.push(`+${change.addedLinks.length} links`);
    if (change.removedLinks?.length) parts.push(`-${change.removedLinks.length} links`);
    return parts.join(' ');
  }
  if (change.field === 'pillars') {
    const parts = [];
    if (change.addedPillars?.length) parts.push(`+pillars ${change.addedPillars.join(',')}`);
    if (change.removedPillars?.length) parts.push(`-pillars ${change.removedPillars.join(',')}`);
    return parts.join(' ');
  }
  if (change.kind === 'added') return `${change.field} added: ${short(change.after)}`;
  if (change.kind === 'removed') return `${change.field} removed`;
  // changed
  if (change.field === 'forward_vector') return 'forward_vector changed';
  const b = short(change.before);
  const a = short(change.after);
  if (b.length + a.length < 60) return `${change.field}: ${b} -> ${a}`;
  return `${change.field} changed`;
}

function short(v) {
  if (v == null) return '∅';
  const s = typeof v === 'string' ? v : JSON.stringify(v);
  return s.length > 40 ? s.slice(0, 37) + '...' : s;
}
