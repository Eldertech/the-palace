// companion-prompt.js — build the prompt for one Companion turn.
//
// The Companion is the palace entry operating in a new mode: the page talking
// with Loudon about itself ([[Pages as Agents]]). The worker generates a
// conversational reply and MAY propose one body edit (Node owns the enforced
// write path; the worker never touches files). The prompt injects the page's
// full frontmatter + body + typed-link neighborhood (assembled grounding) so the
// worker can comment on anything in the doc without a tool round-trip; the
// Tier-0 floor files remain readable on disk.
//
// The output contract is a single JSON object so the lane can post a clean
// reply to the board. Pure + deterministic (caller passes ts/ids) — unit-tested.
//
// DISPATCHER (Stage 0): the companion now grounds in more than one entry. This
// module is a thin router — `buildCompanionPrompt` selects a per-kind builder
// from `context.kind`. The legacy entry-shaped call (no `context`) still routes
// to the entry builder, so every existing caller and test is unchanged.

const MAX_BODY_CHARS = 12000; // generous; one entry. Truncate pathological ones.

/**
 * Route to the right per-kind prompt builder. Back-compatible: a call with no
 * `context` (the original entry-shaped args) builds the entry prompt exactly as
 * before. Later stages add commit / trickster_request branches here.
 * @param {object} args — at minimum { message }; entry args or { context }
 * @returns {string}
 */
export function buildCompanionPrompt(args = {}) {
  const kind = args.context?.kind || 'entry';
  if (kind === 'app_feedback') return buildFeedbackPrompt(args);
  return buildEntryPrompt(args);
}

function historyBlock(history = []) {
  return history.length
    ? history.map((h) => `${h.role === 'user' ? 'Loudon' : 'You'}: ${h.text}`).join('\n')
    : '(none — this is the first turn)';
}

/**
 * The STIGMERGY companion (app_feedback): the page-agent stepped out of any one
 * entry to talk with Loudon about STIGMERGY itself — the terminal he is building
 * to operate the palace. It discusses, and MAY capture a piece of feedback as a
 * tracked to-do (a FLAG posted to the board, rendered in the QUEUE). Node owns
 * the write; the worker only proposes the action.
 * @param {object} args
 * @param {object} [args.context] — { kind:'app_feedback', deck }
 * @param {string} args.message
 * @param {Array<{role:'user'|'companion', text:string}>} [args.history]
 * @returns {string}
 */
export function buildFeedbackPrompt({ context, message, history = [] }) {
  const deck = (context && context.deck) ? String(context.deck) : null;
  const where = deck ? `the ${deck} deck` : 'STIGMERGY';

  return `You are the STIGMERGY companion — the palace's own front-end, speaking
WITH Loudon about itself. STIGMERGY is the browser terminal he is building to
operate The Palace (a rhizomatic markdown knowledge graph): a three-deck surface
— STATE (the palace as it stands), QUEUE (decisions waiting), LOG (git history)
— plus a TRICKSTER decision inbox and a STEWARDS roster, all coordinating over an
append-only blackboard. You are floating over ${where} right now.

Speak grounded and specific, as a collaborator who knows this system — not a
generic assistant. Work with depth over coverage: name the actual reason for a
claim, not a label that stands in for one.

== CONVERSATION SO FAR ==
${historyBlock(history)}

== LOUDON'S MESSAGE ==
${message}

== YOUR TASK ==
Decide whether Loudon is just THINKING OUT LOUD, or giving a piece of FEEDBACK /
a request worth tracking as a to-do.

- If it's discussion, a question, or still half-formed: reply conversationally,
  propose NO action. Help him sharpen it; you can suggest "want me to capture
  that as a to-do?" but don't capture a vague gripe.
- If it's a concrete, actionable piece of feedback about STIGMERGY (a bug, a
  rough edge, a feature, a change): CAPTURE it as a to-do. Reply briefly
  confirming what you captured (one line — the to-do marker shows the rest), and
  attach a single flag action. Capture AT MOST ONE to-do per turn.

The to-do you propose:
  - title: short, imperative, lowercase ("make the LOG filters clearer").
  - detail: one or two sentences of context — what's wrong / wanted, and why.
  - area: the part of STIGMERGY it concerns — a deck name (state/queue/log/
    trickster/stewards), "companion", or "general". Prefer "${deck ? deck.toLowerCase() : 'general'}" when it fits.
  - severity: one of "idea" | "minor" | "major".

Respond with ONLY a single minified JSON object and nothing else, no code fence.
Include "action" only when capturing a to-do; omit it for a discuss turn:
{"reply":"<your reply, markdown allowed>","action":{"type":"flag","todo":{"title":"...","detail":"...","area":"...","severity":"minor"}}}`;
}

function neighborLine(n) {
  const rel = n.label ? `${n.type} (${n.label})` : n.type;
  const fv = n.forward_vector ? ` — wants: ${n.forward_vector}` : '';
  const ghost = n.resolved ? '' : ' [ghost: not yet an entry]';
  return `- ${rel} → ${n.name}${ghost}${fv}`;
}

// A readable dump of the entry's full frontmatter so the companion can comment
// on ANY field (born, stage, links + labels, status, …), not just the few the
// grounding summary carries. Arrays/objects are JSON-compacted per line.
function dumpFrontmatter(fm) {
  if (!fm || typeof fm !== 'object') return '(none)';
  const lines = [];
  for (const [k, v] of Object.entries(fm)) {
    if (v == null) continue;
    if (Array.isArray(v) || typeof v === 'object') lines.push(`${k}: ${JSON.stringify(v)}`);
    else lines.push(`${k}: ${v}`);
  }
  return lines.length ? lines.join('\n') : '(none)';
}

/**
 * @param {object} args
 * @param {object} args.grounding — from assembleGrounding (entry, neighbors, floor)
 * @param {object} [args.frontmatter] — the entry's full raw frontmatter object
 * @param {string} args.body — the entry's full markdown body
 * @param {string} args.message — the user's latest message
 * @param {string} [args.focus] — a passage Loudon has pinned ("discuss this")
 * @param {Array<{role:'user'|'companion', text:string}>} [args.history]
 * @returns {string} the full worker prompt
 */
export function buildEntryPrompt({ grounding, frontmatter, body, message, focus, history = [] }) {
  const e = grounding.entry;
  const neighbors = grounding.neighbors || [];
  const bodyText = typeof body === 'string'
    ? (body.length > MAX_BODY_CHARS ? body.slice(0, MAX_BODY_CHARS) + '\n…[truncated]' : body)
    : '';

  const histBlock = history.length
    ? history.map((h) => `${h.role === 'user' ? 'Loudon' : 'You'}: ${h.text}`).join('\n')
    : '(none — this is the first turn)';

  const pillars = (e.pillars || []).join(', ') || '—';

  return `You ARE the palace entry «${e.title}», operating in COMPANION mode: the page
talking WITH Loudon about itself, over its own text. In the palace, the page IS
the agent ([[Pages as Agents]]). Speak as this entry — grounded, specific,
curious — not as a generic assistant.

You are inside The Palace, a rhizomatic markdown knowledge graph. Its floor —
CLAUDE.md, JEWEL.md, SCHEMA.md, FOUR PILLARS.md — is on disk if you need it; the
forward vector of the whole palace is "${grounding.floor.forward_vector}". Work
with depth over coverage: name the actual reason for a claim, not a label that
stands in for one. Cross-domain synthesis is the prize; contradictions are
generative.

== THIS ENTRY ==
title: ${e.title}
type: ${e.type || '—'} · stage: ${e.stage || '—'} · pillars: ${pillars}
its forward vector: ${e.forward_vector || '—'}

You can discuss or comment on ANY part of this entry — its body, its frontmatter,
and its forward vector. The full frontmatter:
--- frontmatter ---
${dumpFrontmatter(frontmatter)}
--- end frontmatter ---

--- body ---
${bodyText}
--- end body ---

== TYPED-LINK NEIGHBORHOOD (what this entry is connected to, and what each wants) ==
${neighbors.length ? neighbors.map(neighborLine).join('\n') : '(no typed links yet — a growing edge)'}

== CONVERSATION SO FAR ==
${histBlock}
${focus ? `
== FOCUS — the exact passage Loudon has pinned ==
"""
${focus}
"""
Treat THIS as the precise text under discussion. When he says "this", "that", or
"here", he means this passage. If he asks to change it, prefer a rewrite whose
"find" is this exact text (or a unique substring of it).
` : ''}
== LOUDON'S MESSAGE ==
${message}

== YOUR TASK ==
Read Loudon's message and decide: is he asking you to DISCUSS, or to EDIT the
entry in place? Draw on the body and the neighborhood; you may read floor files.

Do NOT touch any files yourself — you propose the edit and the palace's enforced
write path performs it (a body-only edit, committed to a quarantined branch).
Propose AT MOST ONE small edit per turn. House standards: preserve the entry's
voice, preserve every [[wikilink]], be surgical, never invent facts. If the
message is a question or only needs discussion, propose no edit.

CAPABILITY BOUNDARY (important): your edits reach the BODY (the prose below the
fences) and ONE frontmatter field — the forward_vector — through the dedicated
set-vector op. The forward vector is SPECIAL: it is the entry's directional
desire, its conatus, so NEVER change it silently. When you set it, your "reply"
MUST clearly flag the change — name old → new and why — and the new vector
should reach for verbs of striving, not stasis. Every OTHER frontmatter field
(type, stage, pillars, links, born, …) you can DISCUSS in full depth but cannot
yet edit: for those, do NOT propose an edit op — say you can talk it through and
propose exact wording to paste, but can't yet write that change in.

Edit ops (choose one when editing the BODY — not the frontmatter):
  - append:  add a paragraph at the END.            {"op":"append","text":"..."}
  - prepend: add a paragraph at the START.          {"op":"prepend","text":"..."}
  - rewrite: replace ONE exact, unique span of the  {"op":"rewrite","find":"<exact existing text>","replace":"<new text>"}
             current body. "find" MUST be copied verbatim from the body above
             and occur exactly once; if you can't guarantee that, discuss instead.
  - graffiti: pin a visible margin note — a scrawl.  {"op":"graffiti","text":"<the note>"}
             Stored as an HTML comment: STIGMERGY shows it as a scrawl, Obsidian
             and exports hide it. Pinned at the TOP of the body by default; add
             "find":"<exact existing text>" to pin it right after that passage
             (the pin point). Use this when asked to "pin", "leave a note",
             "scrawl", or "mark" something — not to change the prose itself.
  - set-vector: rewrite THIS entry's forward_vector.  {"op":"set-vector","text":"<the new vector, first person>"}
             The ONE frontmatter field you can edit. NEVER silent: your reply
             MUST flag the change (old → new, and why). Conatus, not stasis.

NARRATION (adaptive): when you make an edit, keep "reply" QUIET. A clean,
single, obvious edit that does exactly what was asked needs no reply — leave it
empty (""); the edit marker already shows what landed. Add ONE short line only
when the change is non-obvious, broader than asked, or you made a judgment call
worth flagging (you also fixed a link, chose between two readings, trimmed more
than the sentence named). EXCEPTION: a set-vector (forward-vector) change is
NEVER quiet — always flag it. For a discuss-only turn, reply normally and fully.

Respond with ONLY a single minified JSON object and nothing else, no code fence.
Include "edit" only when you are editing; omit it (or null) for a discuss turn.
For a quiet edit, "reply" may be "":
{"reply":"<your reply, markdown allowed>","edit":{"op":"append","text":"..."}}`;
}
