// Wikilink resolver — flat-vault name → path lookup.
//
// Obsidian resolves [[Foo]] to a file named "Foo.md" regardless of folder,
// case-sensitively. STATE's body renderer (EntryBody) calls resolveWikilink
// to turn a [[name]] match into a click target. Bundle files are reachable
// the same way: [[Foo — handoff]] → Foo/Foo — handoff.md if that file
// exists (CLAUDE.md says agents must search recursively).
//
// Pure function over an entry index (built once on /api/entries hit).
// The index shape is { name → relPath } where name is the basename minus .md.

// Build a name→relPath index from a list of entry summaries (each carrying
// `path` relative to palace root). Multiple entries with the same basename
// keep the first occurrence (filesystem walk order); collisions are rare
// in a flat-namespace vault.
export function buildIndex(entrySummaries) {
  const map = new Map();
  if (!Array.isArray(entrySummaries)) return map;
  for (const s of entrySummaries) {
    if (!s || typeof s.path !== 'string') continue;
    const name = basenameNoExt(s.path);
    if (name && !map.has(name)) map.set(name, s.path);
  }
  return map;
}

function basenameNoExt(p) {
  const slash = p.lastIndexOf('/');
  const base = slash === -1 ? p : p.slice(slash + 1);
  return base.replace(/\.md$/, '');
}

// Resolve a wikilink target string to { name, path } or { name, path: null }
// when unresolved. Trims, strips [[ ]] if accidentally passed.
export function resolveWikilink(index, target) {
  if (typeof target !== 'string') return { name: '', path: null };
  let t = target.trim();
  const m = t.match(/^\[\[(.+?)\]\]$/);
  if (m) t = m[1].trim();
  if (!t) return { name: '', path: null };
  // Allow [[Foo|display text]] aliases — resolve on the left of `|`.
  const pipe = t.indexOf('|');
  const name = pipe === -1 ? t : t.slice(0, pipe).trim();
  if (index && index.get) {
    return { name, path: index.get(name) ?? null };
  }
  if (index && typeof index === 'object') {
    return { name, path: index[name] ?? null };
  }
  return { name, path: null };
}

// Extract every [[wikilink]] from a string body, returning their bare names
// (left of any `|` alias) in document order. Used by the Weave-side audit
// and by STATE's body renderer.
export function extractWikilinks(body) {
  if (typeof body !== 'string' || !body) return [];
  const out = [];
  const re = /\[\[([^\]\n]+?)\]\]/g;
  let m;
  while ((m = re.exec(body)) !== null) {
    const inside = m[1].trim();
    const pipe = inside.indexOf('|');
    const name = pipe === -1 ? inside : inside.slice(0, pipe).trim();
    if (name) out.push(name);
  }
  return out;
}
