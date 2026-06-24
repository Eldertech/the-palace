// Entry-reference resolution for the BBS — turn a bare entry/agent NAME into
// the two affordances Loudon asked for: a link that opens the entry in
// Obsidian, and a link that opens the entry's bundle.
//
// Names appear all over the terminal: body wikilinks and typed-link targets
// in STATE, the `@steward` header on a Trickster card, agent handles on the
// board. Each is the title of a palace entry (a page the agent inhabits).
// This module is the one place that knows how a name becomes {path, hasBundle}
// and how a path becomes an obsidian:// URL.
//
// Pure, framework-free, unit-tested. The React surface (EntryRefChips) and the
// app-wide provider (palace-ref.jsx) build on top of it.
//
// The index shape is Map(name -> { path, hasBundle }) where `name` is the
// entry's basename minus .md and `path` is palace-relative. This is the richer
// sibling of wikilink.js's buildIndex (name -> path string) -- it adds the
// has_bundle flag the /api/entries summary already carries, so the [BUN] chip
// can be shown only where a bundle actually exists.

// Build a name -> { path, hasBundle } index from the /api/entries summaries.
// Multiple entries sharing a basename keep the first (filesystem walk order),
// matching wikilink.js's flat-namespace collision rule.
export function buildRefIndex(entrySummaries) {
  const map = new Map();
  if (!Array.isArray(entrySummaries)) return map;
  for (const s of entrySummaries) {
    if (!s || typeof s.path !== 'string') continue;
    const name = basenameNoExt(s.path);
    if (name && !map.has(name)) {
      map.set(name, {
        path: s.path,
        hasBundle: s.has_bundle === true,
        icon: typeof s.icon === 'string' && s.icon.trim() !== '' ? s.icon : null,
      });
    }
  }
  return map;
}

function basenameNoExt(p) {
  const slash = p.lastIndexOf('/');
  const base = slash === -1 ? p : p.slice(slash + 1);
  return base.replace(/\.md$/, '');
}

// Resolve a name (an entry title, an agent handle, or a [[wikilink]] target)
// against a ref index. Returns { name, path, hasBundle } when the name is a
// known entry, else null. Strips accidental [[ ]] wrappers and `|alias` so the
// same call works on a raw wikilink target or a bare handle.
export function resolveRef(refIndex, rawName) {
  if (typeof rawName !== 'string') return null;
  let t = rawName.trim();
  const wrapped = t.match(/^\[\[(.+?)\]\]$/);
  if (wrapped) t = wrapped[1].trim();
  const pipe = t.indexOf('|');
  const name = pipe === -1 ? t : t.slice(0, pipe).trim();
  if (!name || !refIndex || typeof refIndex.get !== 'function') return null;
  const hit = refIndex.get(name);
  if (!hit) return null;
  return { name, path: hit.path, hasBundle: hit.hasBundle === true, icon: hit.icon ?? null };
}

// Build the obsidian:// URL that opens a palace-relative path inside the
// already-open vault. This is the scheme format.js already calls "the
// canonical scheme for palace links."
//
// The .md extension is stripped (Obsidian's `file` param names the note, not
// the file) and the whole path is percent-encoded -- spaces become %20 and the
// folder separator becomes %2F, which Obsidian decodes back to a real path.
// Returns '' for an unusable path so callers can render plain text instead.
export function obsidianUri(vault, relPath) {
  if (typeof relPath !== 'string' || relPath.trim() === '') return '';
  const v = typeof vault === 'string' && vault.trim() !== '' ? vault : 'The Palace';
  const file = relPath.replace(/\.md$/i, '');
  return `obsidian://open?vault=${encodeURIComponent(v)}&file=${encodeURIComponent(file)}`;
}
