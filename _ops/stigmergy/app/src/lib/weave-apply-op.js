// weave-apply-op.js — the structured `apply` op a Weave proposal may carry.
//
// A `vector_proposal` / `weave_flag` BROADCAST describes a change in prose
// (`proposed_change` / `proposed_action`). To make a GRANT actually *do* the
// change — closing the Weave loop end-to-end instead of leaving the edit for a
// human to make by hand in Obsidian — the proposal may ALSO carry a structured
// `payload.apply`: a mechanically-applicable op the executor runs on approval.
//
// This module is the single source of truth for that op's shape. It is PURE
// (no fs/git) so the client (queue-model, to surface `item.apply` + drive the
// "grant & apply" affordance) and the server (weave-apply, to execute it) agree
// on exactly what is applicable — an unrecognized or malformed op normalizes to
// null, and a null `apply` means the proposal stays manual-only (a plain grant,
// as before). Backward-compatible: proposals without `apply` are untouched.
//
// Increment 1 supported `set-vector` (the Companion's proven forward_vector
// write); Increment 2 adds `add-link` — the emblematic "promote unsung path" /
// "new typed link" Weave action. The dispatch below is written to grow.

// The ops the executor can apply, each with its required fields.
export const APPLY_OPS = ['set-vector', 'add-link'];

// The §4 typed-link ontology (SCHEMA §4). An add-link op's `type` must be one of
// these — the executor never invents a link type, and the affordance never
// offers an edit the schema would reject.
export const LINK_TYPES = [
  'connects-to', 'mirrors', 'enables', 'deepens', 'spawned',
  'emerged-from', 'contradicts', 'couples-with', 'exemplifies', 'member-of',
];

/**
 * Normalize + validate a proposal's `payload.apply` into an executable op, or
 * null when it is absent / unknown / malformed. Pure.
 *
 *   { op:'set-vector', entry, text }
 *     entry — the target entry's title (a trailing ".md" is tolerated and
 *             stripped; resolution to a path is the server's job).
 *     text  — the new forward_vector (single line, non-empty).
 *
 *   { op:'add-link', entry, target, type, label? }
 *     entry  — the entry whose `links:` array gains the link.
 *     target — the linked entry (title or "[[Title]]"; normalized to a title).
 *     type   — a §4 link type (LINK_TYPES); anything else normalizes to null.
 *     label  — optional one-word register (e.g. `rhymes-with`).
 *
 * @param {*} apply — the raw payload.apply value
 * @returns {{op:string, entry:string, text?:string, target?:string, type?:string, label?:string}|null}
 */
export function normalizeApplyOp(apply) {
  if (!apply || typeof apply !== 'object' || Array.isArray(apply)) return null;
  const op = typeof apply.op === 'string' ? apply.op.trim() : '';
  if (!APPLY_OPS.includes(op)) return null;

  const entry = normalizeEntry(apply.entry);
  if (!entry) return null;

  if (op === 'set-vector') {
    const text = typeof apply.text === 'string' ? apply.text.trim() : '';
    // forward_vector is always a single line in the palace; refuse a multi-line
    // or empty value here so the executor never has to (and the button never
    // offers to apply something the write path would reject).
    if (!text || text.includes('\n')) return null;
    return { op: 'set-vector', entry, text };
  }

  if (op === 'add-link') {
    const target = normalizeEntry(apply.target); // strip .md / [[ ]], trim
    const type = typeof apply.type === 'string' ? apply.type.trim() : '';
    if (!target || !LINK_TYPES.includes(type)) return null;
    // No self-link, and target distinct from entry.
    if (target.toLowerCase() === entry.toLowerCase()) return null;
    const label = typeof apply.label === 'string' && apply.label.trim() ? apply.label.trim() : null;
    return { op: 'add-link', entry, target, type, ...(label ? { label } : {}) };
  }

  return null;
}

// An entry reference is a non-empty string; surrounding "[[ ]]" and a trailing
// ".md" are tolerated and stripped so a title ("Kuramoto Coupling"), a filename
// ("Kuramoto Coupling.md"), and a wikilink ("[[Kuramoto Coupling]]") all
// normalize to the bare title the server resolves + compares.
function normalizeEntry(v) {
  if (typeof v !== 'string') return null;
  let s = v.trim();
  const w = s.match(/^\[\[(.+?)\]\]$/);
  if (w) s = w[1].trim();
  s = s.replace(/\.md$/i, '').trim();
  return s || null;
}

/**
 * A one-line human description of what an op will do — for the "grant & apply"
 * affordance + the committed PROOF summary. Pure.
 * @param {{op:string, entry:string, text?:string}} op
 * @returns {string}
 */
export function describeApplyOp(op) {
  if (!op || typeof op !== 'object') return '';
  if (op.op === 'set-vector') return `tune ${op.entry}'s forward_vector`;
  if (op.op === 'add-link') return `link ${op.entry} → ${op.target} (${op.type})`;
  return `apply ${op.op} to ${op.entry}`;
}
