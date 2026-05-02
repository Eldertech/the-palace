// Formatting helpers — message-type glyphs, timestamp formatting,
// column alignment, board metadata.

export const BOARDS = ['GENERAL', 'FLAGS', 'WEAVE', 'SYSTEM', 'TRICKSTER', 'BRANCHES'];

// Per Infrastructure Spec §2.4 + BBS Production Plan Phase 3 spec.
export const TYPE_GLYPHS = {
  BROADCAST: '',
  REPLY: '>',
  FLAG: '!',
  PROOF: '#',
  RESOURCE_REQUEST: '?',
  RESOURCE_GRANT: '+',
  RESOURCE_DENY: 'x',
  QUERY: '?',
  SESSION_INIT: '·',
  SESSION_CLOSE: '·',
  PAGE_UPDATE: '~',
  HEALTH_NOTICE: '!',
};

// Per-type accent color tokens (CSS variable references). The accent is
// applied to the prefix glyph + the from-handle for high-signal types.
export const TYPE_ACCENT = {
  BROADCAST: 'var(--phosphor)',
  REPLY: 'var(--phosphor-dim)',
  FLAG: 'var(--warn)',
  PROOF: 'var(--phosphor-bright)',
  RESOURCE_REQUEST: 'var(--ansi-bright-cyan)',
  RESOURCE_GRANT: 'var(--phosphor)',
  RESOURCE_DENY: 'var(--error)',
  QUERY: 'var(--ansi-bright-cyan)',
  SESSION_INIT: 'var(--phosphor-dim)',
  SESSION_CLOSE: 'var(--phosphor-dim)',
  PAGE_UPDATE: 'var(--ansi-bright-cyan)',
  HEALTH_NOTICE: 'var(--warn)',
};

export function glyphFor(type) {
  return TYPE_GLYPHS[type] ?? '';
}

export function accentFor(type) {
  return TYPE_ACCENT[type] ?? 'var(--phosphor)';
}

// Health score color: green=phosphor, yellow=amber, red=red.
export function healthColor(score) {
  switch (score) {
    case 'green':  return 'var(--phosphor)';
    case 'yellow': return 'var(--warn)';
    case 'red':    return 'var(--error)';
    default:       return 'var(--phosphor-dim)';
  }
}

// Format an ISO 8601 ts (or fragment) for display: hh:mm:ssZ if full ISO,
// otherwise return the original string. Never throws.
export function formatTs(ts) {
  if (typeof ts !== 'string') return '—';
  const m = ts.match(/T(\d{2}:\d{2}:\d{2})(?:\.\d+)?(Z|[+-]\d{2}:\d{2})$/);
  if (!m) return ts;
  return `${m[1]}${m[2]}`;
}

// Pad a string to a fixed character cell width (left-aligned). Truncates
// strings longer than width with a trailing ellipsis-equivalent (".."),
// since em dash is forbidden by the design system.
export function padCell(value, width) {
  const s = String(value ?? '');
  if (s.length === width) return s;
  if (s.length < width) return s + ' '.repeat(width - s.length);
  // Truncate.
  if (width <= 2) return s.slice(0, width);
  return s.slice(0, width - 2) + '..';
}
