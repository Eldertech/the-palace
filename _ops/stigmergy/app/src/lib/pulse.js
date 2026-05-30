// PULSE — the vitality lens.
//
// Sort/filter entries by how alive they are right now. The score combines:
//   - `last_activated` recency (months since)
//   - `activation_count` magnitude (log-scaled)
//   - `stage` signal (fruiting > growing/sprout > mature > seed > dormant > composting)
//   - has-Active-Handoff marker (body contains "## Active Handoff")
//   - has-stewardship marker (body contains "stewardship" near the top)
//
// Pure function over the normalized entry summary shape from entries.js.
// Higher score = more alive.

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

// Months between two YYYY-MM (or YYYY-MM-DD) strings; `today` defaults to
// now-ish (callers can inject a fixed clock for testing).
export function monthsBetween(then, today = new Date()) {
  if (typeof then !== 'string' || then.length < 7) return Infinity;
  const ty = parseInt(then.slice(0, 4), 10);
  const tm = parseInt(then.slice(5, 7), 10);
  if (!Number.isFinite(ty) || !Number.isFinite(tm)) return Infinity;
  const ny = today.getUTCFullYear();
  const nm = today.getUTCMonth() + 1;
  return (ny - ty) * 12 + (nm - tm);
}

// Map months-stale to a 0..1 recency score. 0 months → 1.0; 12+ months → 0.0.
function recencyScore(monthsStale) {
  if (!Number.isFinite(monthsStale)) return 0;
  if (monthsStale <= 0) return 1;
  if (monthsStale >= 12) return 0;
  return 1 - monthsStale / 12;
}

// Map activation_count to a 0..1 magnitude score via log scale.
function activationScore(count) {
  const c = typeof count === 'number' && Number.isFinite(count) ? count : 0;
  if (c <= 0) return 0;
  // log(1) = 0, log(16) ≈ 2.77 → /3 caps near 1
  return Math.min(1, Math.log(c + 1) / 3);
}

// Score one entry summary. Higher is more alive.
// Returns a number 0..~1.5.
export function scoreEntry(entry, now = new Date()) {
  if (!entry || typeof entry !== 'object') return 0;
  const monthsStale = monthsBetween(entry.last_activated, now);
  const recency = recencyScore(monthsStale);
  const magnitude = activationScore(entry.activation_count);
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
