// Shared entry-type → phosphor color map. Lifted out of EntryList so PULSE
// and the TREE lens paint type badges identically. Keep aligned with the
// topology role/avatar palette in TopologyLens.

export const TYPE_COLOR = {
  meta: 'var(--phosphor-white)',
  concept: 'var(--phosphor)',
  hub: 'var(--ansi-bright-cyan)',
  project: 'var(--ansi-bright-yellow)',
  breakthrough: 'var(--ansi-bright-magenta)',
  source: 'var(--ansi-bright-cyan)',
  practice: 'var(--phosphor-bright)',
  person: 'var(--ansi-bright-magenta)',
  question: 'var(--warn)',
  spore: 'var(--phosphor-dim)',
  specialist: 'var(--phosphor-bright)',
  maker: 'var(--phosphor-bright)',
};

export function typeColor(type) {
  return TYPE_COLOR[type ?? ''] ?? 'var(--phosphor-dim)';
}
