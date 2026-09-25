// scroll-view.js — pure helpers for rendering a project scroll in the terminal.
// No DOM, no React; unit-tested. The scroll's zones arrive as markdown text
// from GET /api/projects/scroll; these split the making trail into sections
// and lift each section's artifacts so ArtifactSlot can render them inline.

const ENTRY_RE = /<!--\s*scroll:entry id="([^"]+)"\s*-->([\s\S]*?)<!--\s*\/scroll:entry\s*-->/g;
const MEDIA_EXT = /\.(png|jpe?g|gif|webp|svg|wav|mp3|ogg|m4a|flac|mp4|mov|html?|pdf)$/i;

/**
 * Split the making zone into sections: [{ id, heading, body, artifacts }],
 * in file order (newest first). Text outside entry markers (a hand-written
 * note, the empty-trail placeholder) becomes a section with id null.
 */
export function parseMakingSections(makingText) {
  const text = String(makingText || '');
  const out = [];
  let last = 0;
  let m;
  ENTRY_RE.lastIndex = 0;
  while ((m = ENTRY_RE.exec(text)) !== null) {
    const before = text.slice(last, m.index).trim();
    if (before) out.push(freeSection(before));
    out.push(entrySection(m[1], m[2]));
    last = m.index + m[0].length;
  }
  const tail = text.slice(last).trim();
  if (tail) out.push(freeSection(tail));
  return out;
}

function freeSection(body) {
  return { id: null, heading: null, body, footer: null, artifacts: liftArtifacts(body) };
}

function entrySection(id, inner) {
  const lines = inner.replace(/^\n+/, '').split('\n');
  let heading = null;
  if (lines.length && /^###\s+/.test(lines[0])) heading = lines.shift().replace(/^###\s+/, '').trim();
  // The section's closing `<sub>…</sub>` line (id, board, version) is a footer,
  // not prose — the markdown reader would show the tag raw.
  let footer = null;
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
  const fm = lines.length ? /^<sub>(.*)<\/sub>$/.exec(lines[lines.length - 1].trim()) : null;
  if (fm) { footer = fm[1].replace(/`/g, ''); lines.pop(); }
  const body = lines.join('\n').trim();
  return { id, heading, body, footer, artifacts: liftArtifacts(body) };
}

/** Markdown links whose target looks like a media file → [{ path, caption }]. */
export function liftArtifacts(body) {
  const out = [];
  const re = /\[([^\]]*)\]\(([^)\s]+)\)/g;
  let m;
  while ((m = re.exec(String(body || ''))) !== null) {
    const path = m[2];
    if (/^[a-z]+:\/\//i.test(path) || path.startsWith('open:') || path.startsWith('obsidian:')) continue;
    if (!MEDIA_EXT.test(path)) continue;
    if (out.some((a) => a.path === path)) continue;
    out.push({ path, caption: m[1] || null });
  }
  return out;
}

/** "3 days ago" / "today" / '' for a timestamp. */
export function ageOf(ts, now = Date.now()) {
  const t = ts ? Date.parse(ts) : NaN;
  if (Number.isNaN(t)) return '';
  const d = Math.max(0, Math.round((now - t) / 86400000));
  if (d === 0) return 'today';
  if (d === 1) return '1d';
  if (d < 60) return `${d}d`;
  return `${Math.round(d / 30)}mo`;
}

/**
 * The one-word signal for a project row, and its tone. Order matters: what
 * needs Loudon outranks what he can advance, which outranks a stall.
 */
export function rowSignal(row) {
  if (!row) return { text: '—', tone: 'dim' };
  if (row.running) return { text: row.run ? `running ${row.run.position}/${row.run.cap}` : 'running', tone: 'warn' };
  if (row.open_asks > 0) return { text: row.open_blocking ? 'paused on you' : `${row.open_asks} ask${row.open_asks === 1 ? '' : 's'}`, tone: 'warn' };
  if (row.answered_unconsumed > 0) return { text: `${row.answered_unconsumed} ready`, tone: 'ok' };
  if (row.stalled) return { text: 'stalled', tone: 'err' };
  if (row.barren_streak > 0) return { text: 'barren once', tone: 'warn' };
  if (!row.stewarded) return { text: 'no steward', tone: 'dim' };
  return { text: 'steady', tone: 'dim' };
}

/** Group rows for the table: needs you · ready · stuck · tended · untended. */
export function groupProjects(rows) {
  const g = { needs_you: [], ready: [], stuck: [], tended: [], untended: [] };
  for (const r of rows || []) {
    if (r.running || r.open_asks > 0) g.needs_you.push(r);
    else if (r.answered_unconsumed > 0) g.ready.push(r);
    else if (r.stalled) g.stuck.push(r);
    else if (r.stewarded) g.tended.push(r);
    else g.untended.push(r);
  }
  return g;
}
