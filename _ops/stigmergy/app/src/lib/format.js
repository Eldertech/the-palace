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

// Parse a string for markdown link syntax [text](url) and bare URLs
// (computer://, http://, https://). Returns an array of segments where each
// segment is either { type: 'text', value } or { type: 'link', text, url }.
//
// Markdown links are preferred when the URL or display text contains spaces
// (e.g. computer:/// paths with spaces); the [text](url) syntax bounds the
// URL cleanly. Bare URLs are auto-detected as a fallback but only when they
// contain no whitespace.
//
// This is intentionally minimal: no support for nested brackets in link text,
// no escape sequences, no other markdown. The goal is clickable links in
// rationale prose, not full markdown rendering.
export function parseLinks(text) {
  if (typeof text !== 'string' || !text) {
    return [{ type: 'text', value: text == null ? '' : String(text) }];
  }
  const parts = [];
  // Combined regex: markdown [text](url) OR bare URL.
  // Bare URL schemes recognized: obsidian://, computer://, http(s)://, file://.
  // - obsidian:// — palace files, opens in Obsidian (the canonical scheme for palace links)
  // - computer:// — Cowork chat surface only; included so messages authored for chat
  //   still parse, but they will not click in Chrome
  // - http(s):// — standard web links
  // - file:// — direct filesystem URL (browser security may block)
  const re = /\[([^\]]+)\]\(([^)]+)\)|(obsidian:\/\/\S+|computer:\/\/[^\s\n]+|https?:\/\/\S+|file:\/\/\S+)/g;
  let lastIndex = 0;
  let match;
  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }
    if (match[1] !== undefined) {
      // Markdown link.
      parts.push({ type: 'link', text: match[1], url: match[2] });
    } else if (match[3] !== undefined) {
      // Bare URL — trim trailing sentence punctuation.
      const trailing = match[3].match(/[.,;:!?)]+$/);
      const url = trailing ? match[3].slice(0, -trailing[0].length) : match[3];
      parts.push({ type: 'link', text: url, url });
      if (trailing) {
        parts.push({ type: 'text', value: trailing[0] });
      }
    }
    lastIndex = re.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push({ type: 'text', value: text.slice(lastIndex) });
  }
  return parts.length > 0 ? parts : [{ type: 'text', value: text }];
}

// Map a parsed link url to the actual href used in the <a> tag.
//
// The `open:` pseudo-scheme points at a palace-relative file that the BBS
// server can open in its native app via GET /api/open (e.g. open a rendered
// WAV in your DAW, or `open:...?reveal` to reveal it in Finder). Authors write
// `[listen](open:Projects/Foo/bar.wav)`; this rewrites it to the API call.
// All other schemes (obsidian://, http(s)://, file://, computer://) pass
// through unchanged.
export function hrefFor(url) {
  if (typeof url !== 'string' || !url.startsWith('open:')) return url;
  let rel = url.slice('open:'.length);
  let reveal = false;
  // Optional trailing "?reveal" marker on the pseudo-scheme.
  const q = rel.indexOf('?');
  if (q !== -1) {
    reveal = /(^|[?&])reveal(=1|=true)?($|&)/.test(rel.slice(q));
    rel = rel.slice(0, q);
  }
  const base = `/api/open?path=${encodeURIComponent(rel)}`;
  return reveal ? `${base}&reveal=1` : base;
}
