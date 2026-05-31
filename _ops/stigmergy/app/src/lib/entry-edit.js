// Entry edit model — pure form-state + allow-list + validation.
//
// STATE's editor sits on top of this. Given the original entry's
// { path, frontmatter, body }, the editor mutates a `proposed` object and
// calls helpers here to:
//   - check whether the proposed change is allowed at all (allow-list)
//   - check whether anything actually changed (dirty)
//   - validate the proposed frontmatter against SCHEMA enums
//
// The §7 self-description test ("a fresh AI instance could run a Deposit
// Ceremony correctly using only this") is satisfied by the form UI; this
// module is what the UI binds to.

import { normalizeLinks, normalizePillars } from './yaml-frontmatter.js';

// ── SCHEMA enums (mirror SCHEMA.md §1, §2, §3, §4) ───────────────────────────

export const ENTRY_TYPES = [
  'concept', 'hub', 'project', 'breakthrough', 'source', 'meta',
  'practice', 'person', 'question', 'spore', 'specialist', 'maker',
];

export const STAGES = [
  'seed', 'sprout', 'growing', 'mature', 'fruiting', 'dormant', 'composting',
];
// `foundational` is reserved for canon meta-entries; surfaced separately so
// the form can warn rather than offer it as a routine choice.
export const RESERVED_STAGES = ['foundational'];

export const PILLARS = ['creation', 'tools', 'philosophy', 'practice'];

export const LINK_TYPES = [
  'connects-to', 'mirrors', 'enables', 'deepens', 'spawned',
  'emerged-from', 'contradicts', 'couples-with', 'exemplifies', 'member-of',
];

// Type-specific required fields (SCHEMA §3 "Type-Specific Required Fields").
export const TYPE_REQUIRED_FIELDS = {
  project: ['status'],
  source: ['author', 'year', 'medium'],
  spore: ['revival_conditions'],
  person: ['domains'],
  meta: ['version'],
  specialist: ['status', 'medium', 'tool', 'tool_version'],
  maker: ['status'],
};

// Types that opt out of `stage` (per SCHEMA §3.2: specialist/maker use status
// instead of the seed→fruiting lifecycle).
export const STAGE_EXEMPT_TYPES = new Set(['specialist', 'maker']);
// Types that opt out of `pillars` (per SCHEMA §3.2: specialists and makers
// are tool-citizens, not idea-citizens).
export const PILLARS_OPTIONAL_TYPES = new Set(['specialist', 'maker']);

// Stasis verbs the conatus discipline warns against in forward_vector
// (per the Entry Conatus practice / SCHEMA §3 forward_vector field).
export const STASIS_VERBS = ['remain', 'stay', 'continue', 'be', 'persist', 'endure'];

// ── Allow-list (the hard guardrail) ──────────────────────────────────────────
//
// Stage A's POST /api/entry/save refuses anything outside the entry surface.
// Stage B's armed write inherits this unchanged.

// Path-prefix denials (relative to palace root). Any entry whose path starts
// with one of these is refused outright -- machinery and infrastructure are
// not edited through the STATE form.
export const DENIED_PATH_PREFIXES = [
  '.git/',
  '.claude/',
  '.obsidian/',
  'node_modules/',
  '_ops/stigmergy/app/',
  '_ops/swarm/',
  'screenshots/',
  'dist/',
];

// Canon files -- the rules everyone operates by. Editing them changes how the
// type system, ceremonies, or agent behavior work everywhere. These must flow
// through the Claude conversation under show-before-write per CLAUDE.md and
// the handoff. STATE may READ them; STATE may not WRITE them.
export const DENIED_CANON_PATHS = new Set([
  'CLAUDE.md',
  'SCHEMA.md',
  'README - The Palace Guide.md',
  'SUBSTRATE.md',
  'JEWEL.md',
  'Jewel — Context.md',
  'ROSETTA.md',
  'FOUR PILLARS.md',
  '_ops/Substrate Skill.md',
  '_ops/Palace Ceremonies.md',
]);

// Canon path patterns -- ceremony cards in _ops/.
const DENIED_CANON_PATTERNS = [
  /^_ops\/[^/]*Ceremony[^/]*\.md$/,
];

// Returns { allowed, reason } for a proposed save target.
export function checkAllowList(relPath) {
  if (typeof relPath !== 'string' || relPath === '') {
    return { allowed: false, reason: 'no path' };
  }
  if (relPath.includes('\0') || relPath.includes('..')) {
    return { allowed: false, reason: 'unsafe path' };
  }
  if (!relPath.toLowerCase().endsWith('.md')) {
    return { allowed: false, reason: 'STATE only edits .md entries' };
  }
  for (const prefix of DENIED_PATH_PREFIXES) {
    if (relPath.startsWith(prefix)) {
      return { allowed: false, reason: `path under ${prefix} is infrastructure, not knowledge` };
    }
  }
  if (DENIED_CANON_PATHS.has(relPath)) {
    return {
      allowed: false,
      reason: 'canon file: edit through Claude conversation (show-before-write)',
    };
  }
  for (const re of DENIED_CANON_PATTERNS) {
    if (re.test(relPath)) {
      return {
        allowed: false,
        reason: 'ceremony canon: edit through Claude conversation (show-before-write)',
      };
    }
  }
  return { allowed: true, reason: null };
}

// ── Dirty tracking ───────────────────────────────────────────────────────────

// Compare frontmatter objects + body strings; return true if anything
// meaningfully changed. Set-equal on pillars/links so a form re-render
// doesn't trip dirtiness from key reorderings.
export function isDirty(original, proposed) {
  if (!original || !proposed) return false;
  const ofb = original.body ?? '';
  const pfb = proposed.body ?? '';
  if (ofb !== pfb) return true;
  return !frontmatterEqual(original.frontmatter ?? {}, proposed.frontmatter ?? {});
}

function frontmatterEqual(a, b) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    if (k === 'pillars') {
      const av = new Set(normalizePillars(a.pillars));
      const bv = new Set(normalizePillars(b.pillars));
      if (av.size !== bv.size) return false;
      for (const p of av) if (!bv.has(p)) return false;
      continue;
    }
    if (k === 'links') {
      const av = normalizeLinks(a.links);
      const bv = normalizeLinks(b.links);
      if (av.length !== bv.length) return false;
      const keyOf = (l) => `${l.type}::${l.target}::${l.label ?? ''}`;
      const aset = new Set(av.map(keyOf));
      for (const l of bv) if (!aset.has(keyOf(l))) return false;
      continue;
    }
    if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) return false;
  }
  return true;
}

// ── Validation (SCHEMA enforcement) ──────────────────────────────────────────

// Returns { valid, errors, warnings } for a proposed frontmatter.
// Errors prevent save; warnings flag conatus discipline lapses etc.
export function validateFrontmatter(fm) {
  const errors = [];
  const warnings = [];
  const f = fm || {};

  if (!f.title || typeof f.title !== 'string' || f.title.trim() === '') {
    errors.push('title is required');
  }

  if (!f.type) {
    errors.push('type is required');
  } else if (!ENTRY_TYPES.includes(f.type)) {
    errors.push(`type "${f.type}" is not in SCHEMA §1 (${ENTRY_TYPES.join(', ')})`);
  }

  if (f.type && !PILLARS_OPTIONAL_TYPES.has(f.type)) {
    const pillars = normalizePillars(f.pillars);
    if (pillars.length === 0) {
      errors.push('pillars is required (one or more of: creation, tools, philosophy, practice)');
    }
    for (const p of pillars) {
      if (!PILLARS.includes(p)) errors.push(`pillar "${p}" is not a SCHEMA pillar`);
    }
  }

  if (f.type && !STAGE_EXEMPT_TYPES.has(f.type)) {
    if (!f.stage) {
      errors.push('stage is required');
    } else if (!STAGES.includes(f.stage) && !RESERVED_STAGES.includes(f.stage)) {
      errors.push(`stage "${f.stage}" is not in SCHEMA §2 (${STAGES.join(', ')})`);
    } else if (RESERVED_STAGES.includes(f.stage)) {
      warnings.push('stage "foundational" is reserved for canon meta-entries');
    }
  }

  if (!f.born || typeof f.born !== 'string' || !/^\d{4}-\d{2}/.test(f.born)) {
    errors.push('born is required (YYYY-MM)');
  }

  // Type-specific required fields.
  const extra = TYPE_REQUIRED_FIELDS[f.type] ?? [];
  for (const field of extra) {
    const v = f[field];
    const missing = v == null
      || (typeof v === 'string' && v.trim() === '')
      || (Array.isArray(v) && v.length === 0);
    if (missing) {
      errors.push(`${field} is required for type "${f.type}"`);
    }
  }

  // Link validation.
  const links = normalizeLinks(f.links);
  for (const [i, l] of links.entries()) {
    if (!LINK_TYPES.includes(l.type)) {
      errors.push(`links[${i}]: link type "${l.type}" is not in SCHEMA §4 (${LINK_TYPES.join(', ')})`);
    }
    if (!l.target || l.target.trim() === '') {
      errors.push(`links[${i}]: target is required`);
    }
  }

  // forward_vector conatus discipline (warn, don't block).
  if (typeof f.forward_vector === 'string' && f.forward_vector.trim() !== '') {
    const lc = f.forward_vector.toLowerCase();
    // The pattern catches "I will remain", "I want to stay", etc. — verbs of
    // stasis in first-person construction.
    for (const verb of STASIS_VERBS) {
      const re = new RegExp(`\\b(?:will|want to|keep|aim to|intend to)\\s+${verb}\\b`, 'i');
      if (re.test(lc)) {
        warnings.push(`forward_vector contains stasis verb "${verb}" — conatus discipline calls for striving-verbs (teach, spawn, integrate, cast, keep <doing>)`);
        break;
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

// ── Wikilink autocomplete suggestions ────────────────────────────────────────

// Given the current textarea value, caret position, and wikilink index,
// return { active, prefix, start, end, candidates } where:
//   - active is true if the caret is inside an unfinished [[ ... ]]
//   - prefix is what's been typed since [[
//   - start / end are the slice indices for replacement
//   - candidates is up to N matching entry titles
export function wikilinkSuggestions(text, caret, index, limit = 8) {
  if (typeof text !== 'string' || typeof caret !== 'number') {
    return { active: false, prefix: '', start: caret, end: caret, candidates: [] };
  }
  const upto = text.slice(0, caret);
  // Find the most recent `[[` not closed before the caret.
  const lastOpen = upto.lastIndexOf('[[');
  if (lastOpen === -1) {
    return { active: false, prefix: '', start: caret, end: caret, candidates: [] };
  }
  const between = upto.slice(lastOpen + 2);
  if (between.includes(']]') || between.includes('\n')) {
    return { active: false, prefix: '', start: caret, end: caret, candidates: [] };
  }
  const prefix = between;
  // Collect candidates from the index. Index is a Map(name -> path).
  const lower = prefix.toLowerCase();
  const out = [];
  if (index && index.keys) {
    for (const name of index.keys()) {
      if (lower === '' || name.toLowerCase().includes(lower)) {
        out.push(name);
        if (out.length >= limit) break;
      }
    }
  }
  return { active: true, prefix, start: lastOpen + 2, end: caret, candidates: out };
}
