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

const MAX_BODY_CHARS = 12000; // generous; one entry. Truncate pathological ones.

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
 * @param {Array<{role:'user'|'companion', text:string}>} [args.history]
 * @returns {string} the full worker prompt
 */
export function buildCompanionPrompt({ grounding, frontmatter, body, message, history = [] }) {
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

Edit ops (choose one when editing the BODY — not the frontmatter):
  - append:  add a paragraph at the END.            {"op":"append","text":"..."}
  - prepend: add a paragraph at the START.          {"op":"prepend","text":"..."}
  - rewrite: replace ONE exact, unique span of the  {"op":"rewrite","find":"<exact existing text>","replace":"<new text>"}
             current body. "find" MUST be copied verbatim from the body above
             and occur exactly once; if you can't guarantee that, discuss instead.

Respond with ONLY a single minified JSON object and nothing else, no code fence.
Include "edit" only when you are editing; omit it (or null) for a discuss turn:
{"reply":"<your reply, markdown allowed>","edit":{"op":"append","text":"..."}}`;
}
