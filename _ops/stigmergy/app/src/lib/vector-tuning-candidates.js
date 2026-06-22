// Vector-tuning candidates — entries whose `forward_vector` wants a sharper one.
//
// The first GENERATIVE Weave proposal type (`vector_tuning`) needs taste, not a
// threshold: an agent reads an entry against its body and proposes a sharper
// vector (server/weave-generate.js). This module is the cheap MECHANICAL
// pre-filter that decides which entries are worth spending a generation on, so
// the audit never reads a body it has no reason to touch.
//
// It encodes the palace's own forward_vector discipline (SCHEMA §3, [[Entry
// Conatus]], and the standing "conatus, not stasis" rule): a vector should voice
// striving, not a state of rest. The three signals, in priority order:
//
//   missing — no forward_vector at all (the entry has no articulated desire).
//   stasis  — the vector leans on a rest-verb (remain / stay / persist / be the
//             …) — the documented failure mode ("I will remain X" → "I will keep
//             X-ing").
//   thin    — a present vector too short to carry striving (a bare label, not a
//             sentence of desire).
//
// PURE (no fs/git): the runner walks the live palace into entry summaries
// (listEntries, which already carries forward_vector + stage + type) and feeds
// them here; this module only classifies + ranks.

import { ENTRY_TYPES } from './weave-apply-op.js';

// Rest-verbs that signal stasis rather than striving. Deliberately conservative:
// these read as a *state of rest* in a forward_vector ("I remain the canonical
// …", "I stay the record of …", "I exist as …"). Striving phrasings that happen
// to contain "keep" / "continue …-ing" are NOT matched — "I will keep teaching"
// is exactly the substitution the rule asks for, not a failure.
const STASIS_RE = /\b(remain|remains|stay|stays|persist|persists|endure|endures|exist as|exists as|continue to be|stay the|remain the|be the)\b/i;

// A forward_vector below this many words is too short to carry a sentence of
// directional desire — almost always a bare label ("the canonical X") rather
// than a striving claim. Tuned to flag stubs without nagging real one-liners.
const THIN_WORDS = 12;

const wordCount = (s) => String(s || '').trim().split(/\s+/).filter(Boolean).length;

// Priority weight per reason — the strongest deficiency leads the queue so the
// most-deserving tunings are generated first under a --limit cap.
const REASON_WEIGHT = { missing: 3, stasis: 2, thin: 1 };

/**
 * Classify one entry summary's forward_vector. Returns the reasons it wants
 * tuning (strongest first) — `[]` when the vector is already a healthy sentence
 * of striving. Pure.
 *
 * @param {{forward_vector?:string|null}} entry
 * @returns {string[]}
 */
export function vectorTuningReasons(entry) {
  const v = entry && typeof entry.forward_vector === 'string' ? entry.forward_vector.trim() : '';
  if (!v) return ['missing'];
  const reasons = [];
  if (STASIS_RE.test(v)) reasons.push('stasis');
  if (wordCount(v) < THIN_WORDS) reasons.push('thin');
  return reasons;
}

/**
 * Entries whose forward_vector wants tuning — the vector_tuning audit's
 * candidates, ranked most-deserving first (missing > stasis > thin, then path
 * for a stable order). Considers only real §1 entries — a `type` outside the
 * entry-type ontology (e.g. `agent-prompt`) or absent (bundle/machinery files)
 * is excluded. Also skips the skeleton: `meta` entries and `foundational`-stage
 * entries are structural self-description, not striving knowledge entries, and
 * are never auto-tuned. Pure.
 *
 * @param {Array<{path:string,title?:string,type?:string|null,stage?:string|null,forward_vector?:string|null}>} entries
 *        — listEntries-style summaries (forward_vector + stage + type present).
 * @param {object} [opts]
 * @param {Set<string>|string[]} [opts.skipTypes] — entry types to never tune (default: meta)
 * @returns {Array<{path:string, title:string, currentVector:string, reasons:string[]}>}
 */
export function findVectorTuningCandidates(entries, { skipTypes } = {}) {
  if (!Array.isArray(entries)) return [];
  const skip = skipTypes instanceof Set ? skipTypes
    : new Set(Array.isArray(skipTypes) ? skipTypes : ['meta']);
  const out = [];
  for (const e of entries) {
    if (!e || typeof e.path !== 'string') continue;
    // Must be a real §1 palace entry. A frontmatter `type` outside the entry-type
    // ontology (e.g. `agent-prompt`) — or none at all (bundle files, batons, the
    // `_ops/` machinery) — is not a knowledge entry and is never auto-tuned.
    if (!ENTRY_TYPES.includes(e.type)) continue;
    if (skip.has(e.type)) continue;                  // skeleton / self-description (meta)
    if (e.stage === 'foundational') continue;        // CLAUDE / SCHEMA / README …
    const reasons = vectorTuningReasons(e);
    if (reasons.length === 0) continue;
    out.push({
      path: e.path,
      title: e.title || e.path.split('/').pop().replace(/\.md$/i, ''),
      currentVector: typeof e.forward_vector === 'string' ? e.forward_vector.trim() : '',
      reasons,
    });
  }
  // Rank by the strongest reason's weight, then by path for a stable order.
  const rank = (c) => Math.max(...c.reasons.map((r) => REASON_WEIGHT[r] || 0));
  out.sort((a, b) => rank(b) - rank(a) || a.path.localeCompare(b.path));
  return out;
}
