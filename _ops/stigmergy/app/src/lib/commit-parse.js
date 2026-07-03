// Commit parsing — turn a raw git commit (subject + body + touched paths)
// into the structured shape the LOG deck renders as a semantic card.
//
// The commit spec (STIGMERGY v1.0 §The Commit Specification) is:
//   <kind>(<scope>): <summary, observational past tense>
//   <body>
//   Palace-Kind: <kind>          # repeatable trailers follow
//   Palace-Entry: <Title>        # repeatable
//   Palace-Stage: <Entry>: a→b   # optional, repeatable
//   Palace-Vector: <Entry>: changed
//   Palace-Resolves: <queue-id>
//   Palace-Campaign: <slug>
//   Palace-Verify: verified | unverified | couldnt
//   Palace-Author: claude | loudon | steward:<Entry>
//
// BUT most palace history predates the spec (Revision 2: "the LOG parser
// must tolerate pre-spec history"). So everything here degrades: a commit
// with a free-prose subject and no trailers still parses into a renderable
// card, with `kind` inferred from the touched paths and flagged as derived.

// The kind enum (spec table) plus Revision 2's `mixed`. Emergent-tolerant:
// an unknown subject-kind is kept verbatim but colored as `other`.
export const KNOWN_KINDS = [
  'deposit', 'edit', 'enrich', 'handoff', 'steward',
  'weave', 'schema', 'ops', 'merge', 'mixed',
];

const KIND_COLOR = {
  deposit: 'var(--phosphor-bright)',
  edit: 'var(--phosphor)',
  enrich: 'var(--ansi-bright-magenta)',
  handoff: 'var(--warn)',
  steward: 'var(--ansi-bright-cyan)',
  weave: 'var(--ansi-bright-cyan)',
  schema: 'var(--ansi-bright-yellow)',
  ops: 'var(--phosphor-dim)',
  merge: 'var(--phosphor-dim)',
  mixed: 'var(--ansi-bright-yellow)',
  other: 'var(--phosphor-dim)',
};

export function kindColor(kind) {
  return KIND_COLOR[kind] ?? KIND_COLOR.other;
}

// The body's human-readable prose, with the machine trailer block stripped.
// `Palace-*` trailers are pure metadata already surfaced as the card's kind
// badge, entry chips, and verify tag — repeating them inline is noise. Drops
// every `Palace-<Key>:` line, collapses the blank runs they leave, and trims.
// (The synthesis `Weave flags:` line is NOT a Palace- trailer, so it stays.)
export function bodyProse(body) {
  if (typeof body !== 'string') return '';
  return body
    .split(/\r?\n/)
    .filter((line) => !/^Palace-[A-Za-z-]+:\s/.test(line))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Parse a subject line into { kind, scope, summary, declared }.
// `declared` is true only when the subject matches the spec form
// `<kind>(<scope>): <summary>` AND kind is in the enum.
export function parseSubject(subject) {
  const raw = typeof subject === 'string' ? subject.trim() : '';
  // <kind>(<scope>): <summary>   -- scope optional
  const m = raw.match(/^([a-z]+)(?:\(([^)]*)\))?:\s+(.+)$/);
  if (m && KNOWN_KINDS.includes(m[1])) {
    return { kind: m[1], scope: m[2] ?? null, summary: m[3], declared: true };
  }
  // A subject that uses `<token>(scope):` or `<Token>:` form but whose token
  // is NOT a known kind -- keep the scope/summary split for display, but the
  // kind is not spec-declared.
  if (m) {
    return { kind: null, scope: m[2] ?? null, summary: m[3], declared: false, subjectToken: m[1] };
  }
  return { kind: null, scope: null, summary: raw, declared: false };
}

// Parse git trailers from a commit body. Trailers are `Key: Value` lines,
// conventionally in a trailing block. We scan the whole body (cheap, and
// tolerant of bodies where the trailer block isn't perfectly separated).
// Palace-Entry / Palace-Stage / Palace-Vector / Palace-Resolves are
// repeatable → arrays. Returns a normalized object plus `raw` (all trailers).
export function parseTrailers(body) {
  const out = {
    kind: null,
    entries: [],
    stage: [],
    vector: [],
    resolves: [],
    verify: null,
    author: null,
    campaign: null,
    raw: {},
  };
  if (typeof body !== 'string' || body === '') return out;
  const lines = body.split(/\r?\n/);
  for (const line of lines) {
    // Key: Value -- value may itself contain colons (e.g. "Entry: seed→sprout").
    const m = line.match(/^([A-Za-z][A-Za-z0-9-]*):[ \t]+(.+?)\s*$/);
    if (!m) continue;
    const key = m[1];
    const val = m[2];
    if (!(key in out.raw)) out.raw[key] = [];
    out.raw[key].push(val);
    switch (key) {
      case 'Palace-Kind': out.kind = val.toLowerCase(); break;
      case 'Palace-Entry': out.entries.push(val); break;
      case 'Palace-Stage': out.stage.push(val); break;
      case 'Palace-Vector': out.vector.push(val); break;
      case 'Palace-Resolves': out.resolves.push(val); break;
      case 'Palace-Verify': out.verify = val.toLowerCase(); break;
      case 'Palace-Author': out.author = val; break;
      case 'Palace-Campaign': out.campaign = val; break;
      default: break;
    }
  }
  return out;
}

// Infer a kind from the touched paths when neither a Palace-Kind trailer nor
// a spec-declared subject is present. Low-confidence; flagged `inferred`.
// Heuristics, in priority order:
//   - any SCHEMA.md            → schema
//   - any *handoff*.md         → handoff
//   - only _ops/ or app code   → ops
//   - a NEW top-level entry .md (added) → deposit  (caller passes addedPaths)
//   - a media file inside a bundle → enrich
//   - mixed knowledge + ops    → mixed
//   - else                     → edit
export function inferKind(paths = [], addedPaths = []) {
  if (!Array.isArray(paths) || paths.length === 0) return 'edit';
  const lower = paths.map((p) => p.toLowerCase());
  if (lower.some((p) => /(^|\/)schema\.md$/.test(p))) return 'schema';
  if (lower.some((p) => /handoff.*\.md$/.test(p))) return 'handoff';

  const isOps = (p) => p.startsWith('_ops/') || p.startsWith('enrichment/') || p.endsWith('.js') || p.endsWith('.py') || p.endsWith('.json') || p.endsWith('.css') || p.endsWith('.jsx');
  const isKnowledge = (p) => p.endsWith('.md') && !isOps(p);

  const opsCount = lower.filter(isOps).length;
  const knowledgeCount = lower.filter(isKnowledge).length;

  // A media file added inside a sibling-folder bundle reads as enrich.
  const mediaExts = /\.(png|jpe?g|gif|svg|webp|wav|mp3|ogg|m4a|flac|mp4|webm|mov)$/;
  if (lower.some((p) => mediaExts.test(p)) && knowledgeCount === 0) return 'enrich';

  if (knowledgeCount > 0 && opsCount > 0) return 'mixed';
  if (opsCount > 0 && knowledgeCount === 0) return 'ops';

  // A single newly-added knowledge .md reads as a deposit.
  if (Array.isArray(addedPaths) && addedPaths.some((p) => isKnowledge(p.toLowerCase()))) {
    return 'deposit';
  }
  return 'edit';
}

// Combine subject + trailers + paths into one normalized commit-meta.
// `kindSource` records provenance: 'trailer' | 'subject' | 'inferred'.
export function classifyCommit({ subject, body, paths = [], addedPaths = [] }) {
  const subj = parseSubject(subject);
  const trailers = parseTrailers(body);

  let kind, kindSource;
  if (trailers.kind && KNOWN_KINDS.includes(trailers.kind)) {
    kind = trailers.kind; kindSource = 'trailer';
  } else if (subj.declared) {
    kind = subj.kind; kindSource = 'subject';
  } else {
    kind = inferKind(paths, addedPaths); kindSource = 'inferred';
  }

  // Entries: prefer Palace-Entry trailers; else derive from touched .md paths
  // (basename minus .md), excluding obvious machinery.
  let entries = trailers.entries;
  if (entries.length === 0) {
    entries = derivedEntriesFromPaths(paths);
  }

  return {
    kind,
    kindSource,
    knownKind: KNOWN_KINDS.includes(kind),
    scope: subj.scope ?? null,
    summary: subj.summary,
    subjectToken: subj.subjectToken ?? null,
    entries,
    stage: trailers.stage,
    vector: trailers.vector,
    resolves: trailers.resolves,
    verify: trailers.verify,
    author: trailers.author,
    campaign: trailers.campaign,
    trailers: trailers.raw,
  };
}

// Entry titles derived from touched knowledge .md paths (basename minus .md).
// Skips machinery dirs so the card doesn't list app files as "entries."
export function derivedEntriesFromPaths(paths) {
  if (!Array.isArray(paths)) return [];
  const out = [];
  const seen = new Set();
  for (const p of paths) {
    if (typeof p !== 'string' || !p.endsWith('.md')) continue;
    const lower = p.toLowerCase();
    if (lower.startsWith('_ops/stigmergy/app/')) continue;
    if (lower.startsWith('_ops/swarm/')) continue;
    if (lower.startsWith('node_modules/')) continue;
    const base = p.slice(p.lastIndexOf('/') + 1).replace(/\.md$/, '');
    if (!seen.has(base)) { seen.add(base); out.push(base); }
  }
  return out;
}
