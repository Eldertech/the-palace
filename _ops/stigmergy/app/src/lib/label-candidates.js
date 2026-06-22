// Label candidates — typed links that carry a §4 `type` but no `label`, i.e.
// links whose register is unstated. The detection half of `label_enrichment`,
// the HYBRID Weave type: the candidate-finding is a cheap mechanical scan (this
// module), but the proposal — the label itself — needs taste and so is GENERATED
// (server/weave-generate.js), grounded in [[Resonant Link Labels]].
//
// A label is "the flesh on the skeleton" ([[Resonant Link Labels]]): the `type`
// says what KIND of relationship holds; the `label` names its specific register
// (a `mirrors` link as `rhymes-with` vs. `echoes` vs. `haunts`). Most links in
// the palace carry only the type, so the unstated-register pool is large — this
// finds the links whose BOTH ends are readable entries (so a worker can judge
// the register from the actual material), capped + human-gated downstream.
//
// PURE (no fs/git): the runner walks the palace into entry records (path, title,
// type, links, body) and feeds them here; this builds the name→path index and
// filters.

import { buildPalaceIndex } from './unsung-paths.js';
import { ENTRY_TYPES } from './weave-apply-op.js';

const titleOf = (p) => String(p || '').split('/').pop().replace(/\.md$/i, '');

// Resolve a YAML link target (a bare title, post-normalizeLinks) to a palace
// path via the name→path index. Returns null for off-palace targets.
function resolveTarget(target, index) {
  if (typeof target !== 'string') return null;
  return index.get(target.trim().toLowerCase()) ?? null;
}

/**
 * Typed links lacking a `label` whose target resolves to a known entry — the
 * label-enrichment audit's candidates. Considers only real §1 source entries
 * (machinery / bundle files excluded, like the other audits); skips self-links
 * and off-palace targets (a label needs both ends readable). Stable order
 * (source, target, type) for determinism. Pure.
 *
 * @param {Array<{path:string,title?:string,type?:string|null,links:Array<{target:string,type:string,label?:string|null}>}>} records
 *        — walkEntryRecords output (links normalized to {target,type,label}).
 * @param {object} [opts]
 * @param {Set<string>|string[]} [opts.skipTypes] — entry types to never scan (default: none beyond the §1 gate)
 * @returns {Array<{source:string, sourceTitle:string, target:string, targetTitle:string, type:string}>}
 */
export function findLabelCandidates(records, { skipTypes } = {}) {
  if (!Array.isArray(records)) return [];
  const skip = skipTypes instanceof Set ? skipTypes : new Set(Array.isArray(skipTypes) ? skipTypes : []);
  const index = buildPalaceIndex(records);
  const out = [];
  for (const e of records) {
    if (!e || typeof e.path !== 'string' || !Array.isArray(e.links)) continue;
    if (!ENTRY_TYPES.includes(e.type)) continue; // real §1 source entry only
    if (skip.has(e.type)) continue;
    for (const l of e.links) {
      if (!l || typeof l.type !== 'string' || !l.type) continue;
      if (l.label) continue;                       // already has a register — leave it
      const tp = resolveTarget(l.target, index);
      if (!tp || tp === e.path) continue;          // off-palace target or self-link
      out.push({
        source: e.path,
        sourceTitle: e.title || titleOf(e.path),
        target: tp,
        targetTitle: titleOf(tp),
        type: l.type,
      });
    }
  }
  out.sort((a, b) => a.source.localeCompare(b.source) || a.target.localeCompare(b.target) || a.type.localeCompare(b.type));
  return out;
}
