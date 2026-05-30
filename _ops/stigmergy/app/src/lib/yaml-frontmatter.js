// YAML frontmatter parser for palace .md entries.
//
// Splits `---\n<yaml>\n---\n<body>` into { frontmatter, body, error }.
// Uses js-yaml under the hood — palace frontmatter uses nested lists of
// objects (links[]), nested object hashes (agency_profile), and quoted
// scalars that the existing Python parse_frontmatter cannot handle.
//
// Total: never throws. A malformed YAML block yields
// { frontmatter: {}, body: text, error: <message> } so the UI can still
// render the body with a warning chip.

import yaml from 'js-yaml';

const FENCE = /^---\s*\r?\n/;

export function parseFrontmatter(text) {
  if (typeof text !== 'string') {
    return { frontmatter: {}, body: '', error: null };
  }
  if (!FENCE.test(text)) {
    return { frontmatter: {}, body: text, error: null };
  }
  const afterOpen = text.replace(FENCE, '');
  const closeIdx = afterOpen.search(/\r?\n---\s*(\r?\n|$)/);
  if (closeIdx === -1) {
    return { frontmatter: {}, body: text, error: 'unterminated frontmatter' };
  }
  const fmRaw = afterOpen.slice(0, closeIdx);
  const closeMatch = afterOpen.slice(closeIdx).match(/^\r?\n---\s*(\r?\n|$)/);
  const closeLen = closeMatch ? closeMatch[0].length : 4;
  const body = afterOpen.slice(closeIdx + closeLen);

  let frontmatter = {};
  let error = null;
  try {
    const parsed = yaml.load(fmRaw, { schema: yaml.JSON_SCHEMA });
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      frontmatter = parsed;
    } else if (parsed != null) {
      error = `frontmatter is not an object (got ${typeof parsed})`;
    }
  } catch (e) {
    error = `yaml parse: ${e?.message ?? e}`;
  }
  return { frontmatter, body, error };
}

// Normalize a frontmatter `links` value to an array of { target, type, label }.
// Handles three forms observed in the palace:
//   - `target: "[[X]]"` (canonical)
//   - `target: X` (bare, no brackets — rare but seen)
//   - the whole `links` field being null/missing
// Strips `[[...]]` wrapping from the target so STATE can index by canonical name.
export function normalizeLinks(rawLinks) {
  if (!Array.isArray(rawLinks)) return [];
  const out = [];
  for (const l of rawLinks) {
    if (!l || typeof l !== 'object') continue;
    const target = stripWikiBrackets(l.target);
    if (!target) continue;
    const type = typeof l.type === 'string' ? l.type : 'connects-to';
    const label = typeof l.label === 'string' && l.label.trim() !== '' ? l.label : null;
    out.push({ target, type, label });
  }
  return out;
}

// Strip [[...]] wikilink brackets from a string. Returns the inner name, or
// the original string if no brackets, or '' if the input is falsy/non-string.
export function stripWikiBrackets(s) {
  if (typeof s !== 'string') return '';
  const t = s.trim();
  if (!t) return '';
  const m = t.match(/^\[\[(.+?)\]\]$/);
  return m ? m[1].trim() : t;
}

// Normalize a frontmatter `pillars` value to an array of lowercase strings.
// Handles the inline form (`pillars: [tools, creation]`) and the block form
// (`pillars:\n  - tools\n  - creation`). Returns [] when absent or malformed.
export function normalizePillars(rawPillars) {
  if (rawPillars == null) return [];
  if (typeof rawPillars === 'string') {
    return rawPillars
      .split(/[,\s]+/)
      .map((p) => p.trim().toLowerCase())
      .filter((p) => p !== '');
  }
  if (Array.isArray(rawPillars)) {
    return rawPillars
      .map((p) => (typeof p === 'string' ? p.trim().toLowerCase() : null))
      .filter((p) => p && p !== '');
  }
  return [];
}
