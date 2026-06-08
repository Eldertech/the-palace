// companion-prompt.js — build the prompt for one Companion turn.
//
// The Companion is the palace entry operating in a new mode: the page talking
// with Loudon about itself ([[Pages as Agents]]). M1b is discuss-only — the
// worker generates a conversational reply; it does NOT edit files (Node owns
// the enforced write path in M1c). The prompt injects the page's own text and
// its typed-link neighborhood (assembled grounding) so the worker is grounded
// without a tool round-trip; the Tier-0 floor files remain readable on disk.
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

/**
 * @param {object} args
 * @param {object} args.grounding — from assembleGrounding (entry, neighbors, floor)
 * @param {string} args.body — the entry's full markdown body
 * @param {string} args.message — the user's latest message
 * @param {Array<{role:'user'|'companion', text:string}>} [args.history]
 * @returns {string} the full worker prompt
 */
export function buildCompanionPrompt({ grounding, body, message, history = [] }) {
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
Discuss conversationally. Draw on the body and the neighborhood; you may read
floor files if it helps. This is a DISCUSS-ONLY turn: do NOT edit, write, or
commit any files. (In-place editing arrives in a later mode.)

Respond with ONLY a single minified JSON object and nothing else, no code
fence:
{"reply":"<your reply, markdown allowed>"}`;
}
