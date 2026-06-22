// Stage candidates — entries that have outgrown their declared `stage` and want
// advancement along the SCHEMA §2 lifecycle. The third MECHANICAL detection
// audit, after unsung-path (add-link) and hub-promotion (set-type): it proposes
// `stage_transition`s applied via the `set-stage` op, completing the detection-
// tier op trio.
//
// SCHEMA §2 is explicit that "stages are proposed by the operator and confirmed
// by Loudon. The Weave is the primary ceremony for stage transitions." So this
// audit only ever PROPOSES; the human grant & apply confirms. To keep the signal
// high (a noisy proposer Loudon must keep denying is worse than none), the rule
// is conservative:
//
//   - Advance ONE step only, along the size/link-driven arc seed → sprout →
//     growing → mature. The later stages (fruiting / dormant / composting) are
//     deliberate judgement calls, never size-driven, so they are never proposed.
//   - Require BOTH signals of the next stage's §2 band: enough body AND enough
//     typed links. Either alone is too weak.
//   - Never demote; never skip a stage; never touch the skeleton (foundational).
//
// §2 gives word bands (seed 50-150, sprout 150-400, growing 400-800, mature
// 800+) and link thresholds (sprout 1-2, growing 3+). listEntries gives body
// size in CHARACTERS, so the bands are expressed in chars at ~6 chars/word
// (150w≈900c, 400w≈2400c, 800w≈4800c) — approximate by design, and the human
// gate absorbs any borderline call.
//
// PURE (no fs/git): the runner walks the live palace into listEntries summaries
// (stage + link_count + body_size all present) and feeds them here.

import { ENTRY_TYPES } from './weave-apply-op.js';

// current stage -> { next stage, the next band's char floor, its link floor }.
const LADDER = {
  seed: { next: 'sprout', minChars: 900, minLinks: 1 },
  sprout: { next: 'growing', minChars: 2400, minLinks: 3 },
  growing: { next: 'mature', minChars: 4800, minLinks: 3 },
};

// specialist / maker are §1 entry types but follow `status` (alive | stub), not
// the seed→fruiting lifecycle, so they never carry a stage to advance.
const STATUS_TYPES = new Set(['specialist', 'maker']);

/**
 * The single-step advancement an entry wants, or null. Pure.
 * @param {{stage?:string|null, body_size?:number, link_count?:number}} entry
 * @returns {{from:string, to:string, chars:number, links:number}|null}
 */
export function stageAdvancement(entry) {
  if (!entry) return null;
  const stage = typeof entry.stage === 'string' ? entry.stage : null;
  const rule = stage ? LADDER[stage] : null;
  if (!rule) return null; // mature / fruiting / dormant / composting / foundational / unknown — not size-driven
  const chars = Number.isFinite(entry.body_size) ? entry.body_size : 0;
  const links = Number.isFinite(entry.link_count) ? entry.link_count : 0;
  if (chars >= rule.minChars && links >= rule.minLinks) {
    return { from: stage, to: rule.next, chars, links };
  }
  return null;
}

/**
 * Entries that have outgrown their stage — the stage-transition audit's
 * candidates, ranked most-overgrown first (largest body, the clearest cases
 * lead the queue) then by path for a stable order. Considers only real §1
 * entries on the lifecycle (specialist/maker excluded — they use `status`).
 * Pure.
 *
 * @param {Array<{path:string,title?:string,type?:string|null,stage?:string|null,body_size?:number,link_count?:number}>} entries
 *        — listEntries-style summaries (stage + link_count + body_size present).
 * @param {object} [opts]
 * @param {Set<string>|string[]} [opts.skipTypes] — types to never stage (default: specialist, maker)
 * @returns {Array<{path:string, title:string, from:string, to:string, chars:number, links:number}>}
 */
export function findStageCandidates(entries, { skipTypes } = {}) {
  if (!Array.isArray(entries)) return [];
  const skip = skipTypes instanceof Set ? skipTypes
    : new Set(Array.isArray(skipTypes) ? skipTypes : [...STATUS_TYPES]);
  const out = [];
  for (const e of entries) {
    if (!e || typeof e.path !== 'string') continue;
    if (!ENTRY_TYPES.includes(e.type)) continue; // real §1 entry only (excludes machinery / bundle files)
    if (skip.has(e.type)) continue;              // specialist/maker use status, not stage
    const adv = stageAdvancement(e);
    if (!adv) continue;
    out.push({
      path: e.path,
      title: e.title || e.path.split('/').pop().replace(/\.md$/i, ''),
      from: adv.from,
      to: adv.to,
      chars: adv.chars,
      links: adv.links,
    });
  }
  out.sort((a, b) => b.chars - a.chars || a.path.localeCompare(b.path));
  return out;
}
