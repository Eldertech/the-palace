// PULSE — the vitality lens.
//
// Sort/filter entries by how alive they are right now. The score combines:
//   - `last_used` recency (days since) — computed from git, see entry-use.js
//   - recent `use` magnitude (log-scaled): page edit days + bundle edit days +
//     entries that formed a link to it, over the last 90 days
//   - `stage` signal (fruiting > growing/sprout > mature > seed > dormant > composting)
//   - has-Active-Handoff marker (body contains "## Active Handoff")
//   - has-stewardship marker (body contains "stewardship" near the top)
//
// Pure function over the normalized entry summary shape from entries.js.
// Higher score = more alive.

import { ENTRY_TYPES } from './entry-edit.js';

const STAGE_WEIGHT = {
  fruiting: 1.0,
  growing: 0.75,
  sprout: 0.65,
  mature: 0.55,
  seed: 0.45,
  foundational: 0.60,
  dormant: 0.15,
  composting: 0.05,
};

// Days between a YYYY-MM-DD (or YYYY-MM) string and now. Infinity if unparseable.
export function daysSince(then, now = new Date()) {
  if (typeof then !== 'string' || then.length < 7) return Infinity;
  const t = Date.parse(then.length === 7 ? `${then}-01` : then.slice(0, 10));
  if (!Number.isFinite(t)) return Infinity;
  return Math.max(0, (now.getTime() - t) / 86400000);
}

// Map days-since-last-use to 0..1. Today → 1.0; a year or more → 0.0.
function freshness(days) {
  if (!Number.isFinite(days)) return 0;
  return Math.max(0, 1 - days / 365);
}

// Map recent use to a 0..1 magnitude score via log scale.
function useScore(count) {
  const c = typeof count === 'number' && Number.isFinite(count) ? count : 0;
  if (c <= 0) return 0;
  // log(1) = 0, log(20) ≈ 3.0 → /3 caps near the palace's top twentieth
  return Math.min(1, Math.log(c + 1) / 3);
}

// Score one entry summary. Higher is more alive.
// Returns a number 0..~1.5.
export function scoreEntry(entry, now = new Date()) {
  if (!entry || typeof entry !== 'object') return 0;
  const recency = freshness(daysSince(entry.last_used, now));
  const magnitude = useScore(entry.use?.recent?.use);
  const stageW = STAGE_WEIGHT[(entry.stage ?? '').toLowerCase()] ?? 0.4;
  const handoff = entry.has_active_handoff ? 0.25 : 0;
  const stewardship = entry.has_stewardship_marker ? 0.15 : 0;
  return recency * 0.4 + magnitude * 0.3 + stageW * 0.3 + handoff + stewardship;
}

// Sort entries newest/most-alive first. Stable on tie via title.
export function pulseSort(entries, now = new Date()) {
  if (!Array.isArray(entries)) return [];
  return [...entries]
    .map((e) => ({ e, s: scoreEntry(e, now) }))
    .sort((a, b) => {
      if (b.s !== a.s) return b.s - a.s;
      return (a.e.title ?? '').localeCompare(b.e.title ?? '');
    })
    .map(({ e, s }) => ({ ...e, pulse: s }));
}

// What PULSE triages: canon only. SCHEMA §1 makes frontmatter the membership
// card, so a row needs a real §1 `type` — READMEs, SKILL.md, build logs and
// other machinery have none and stay in the TREE lens, which walks folders.
// withBundles adds a canon entry's bundle files (`Foo/…` belongs to `Foo.md`),
// but only the ones carrying the §8 minimum — born, links, forward_vector —
// so scrolls, Contexts and batons come in and bare workshop files stay out.
export function pulseUniverse(entries, { withBundles = false } = {}) {
  if (!Array.isArray(entries)) return [];
  const isCanon = (e) => !e.is_bundle_file && ENTRY_TYPES.includes(e.type);
  const canon = entries.filter(isCanon);
  if (!withBundles) return canon;
  const dirs = canon.filter((e) => e.has_bundle).map((e) => e.path.replace(/\.md$/, '/'));
  const selfDescribing = (e) => Boolean(e.born || e.forward_vector || e.link_count > 0);
  return entries.filter((e) => isCanon(e)
    || (e.is_bundle_file && selfDescribing(e) && dirs.some((d) => e.path.startsWith(d))));
}
