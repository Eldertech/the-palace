// Column sort for STATE's PULSE table. Pure function — caller passes
// pulse-stamped entries; this lib does no scoring.
//
// Keys: 'pulse' | 'type' | 'title' | 'stage' | 'activity'.
// Missing values always sink to the bottom regardless of direction —
// otherwise "sort asc by type" would float every untyped entry to the top.

const STAGE_PRIORITY = {
  fruiting: 7,
  growing: 6,
  sprout: 5,
  mature: 4,
  foundational: 4,
  seed: 3,
  dormant: 1,
  composting: 0,
};

export const SORT_KEYS = ['pulse', 'type', 'title', 'stage', 'activity'];

export const DEFAULT_DIR = {
  pulse: 'desc',
  type: 'asc',
  title: 'asc',
  stage: 'desc',
  activity: 'desc',
};

function activityKey(entry) {
  const v = entry?.last_activated ?? entry?.born ?? '';
  if (typeof v !== 'string' || v.length < 7) return null;
  return v.slice(0, 10);
}

function stageRank(entry) {
  const s = (entry?.stage ?? '').toLowerCase();
  if (!s) return null;
  return STAGE_PRIORITY[s] ?? 2;
}

function titleKey(entry) {
  const t = entry?.title ?? entry?.path ?? '';
  return typeof t === 'string' ? t.toLowerCase() : '';
}

function typeKey(entry) {
  const t = entry?.type;
  if (typeof t !== 'string' || !t) return null;
  return t.toLowerCase();
}

function pulseKey(entry) {
  return typeof entry?.pulse === 'number' ? entry.pulse : 0;
}

function keyExtractor(key) {
  switch (key) {
    case 'pulse': return pulseKey;
    case 'type': return typeKey;
    case 'title': return titleKey;
    case 'stage': return stageRank;
    case 'activity': return activityKey;
    default: return pulseKey;
  }
}

function compare(a, b) {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b));
}

export function sortEntries(entries, { key = 'pulse', dir = DEFAULT_DIR.pulse } = {}) {
  if (!Array.isArray(entries)) return [];
  const extract = keyExtractor(key);
  const sign = dir === 'asc' ? 1 : -1;
  return [...entries].sort((ea, eb) => {
    const a = extract(ea);
    const b = extract(eb);
    const aMissing = a === null || a === undefined || a === '';
    const bMissing = b === null || b === undefined || b === '';
    if (aMissing && bMissing) return titleKey(ea).localeCompare(titleKey(eb));
    if (aMissing) return 1;
    if (bMissing) return -1;
    const cmp = compare(a, b);
    if (cmp !== 0) return sign * cmp;
    return titleKey(ea).localeCompare(titleKey(eb));
  });
}
