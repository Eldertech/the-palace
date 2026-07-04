---
name: concierge
description: Address the palace instead of loading it — say what you need in plain language and the Concierge triages it to a disposable read-only agent that works in its own context window and hands back a finished product, keeping the main thread clean (context-offload). Use when Loudon or a working Claude "addresses the palace" — "concierge, …", "ask the palace …", "spin up the concierge", "find me every palace doc about X", "collect the entries on X and Y" (→ gatherer), or "what does the palace say about X", "where does the palace stand on Y", "how does ceremony Z work" (→ oracle Q&A). Do NOT use to close a session — that is the moderator face, triggered by "close well". Do NOT use for edits/writes — the read-only faces cannot touch files; route those to their own path.
---

# The Concierge (front-desk shim — the address verb)

This file is a **thin shim** — the harness-discoverable trigger for the Concierge. The organ
is the canon entry `Palace development/Concierge.md` ([[Concierge]]); the dispatch machinery is
`_ops/concierge/`. Per [[Skills Are Enchantable Pages]], the page is the organ and this file is
one dispatch surface onto it — so read the canon entry and machinery rather than duplicating them.

You are the working Claude, invoking the Concierge on an **address** — a plain-language request
to the palace. Your job: **triage it to the right face, dispatch one disposable agent, relay the
product, let it vanish.** The search never enters this conversation; only the finished thing does.

## Triage — classify the address, route to a face

| The address sounds like… | Face | Dispatch |
|---|---|---|
| "find / collect / gather / assemble every doc/link/entry about X" — wants the **material** | **gatherer** | `_ops/concierge/prompts/gatherer.md` |
| "what does the palace say about X / where does it stand / how does Z work" — wants an **answer** | **oracle Q&A** | `_ops/concierge/prompts/oracle-qa.md` |
| "close this session well" — wants a **close** | **moderator** | not this skill — the `close well` trigger |
| "tidy / tend the links around what I touched" | **steward** | not built (Phase 3) — do it in-context, one hop, and say so |
| anything a cheap file-read settles | — | just read the file; don't dispatch |

If an address blends two (e.g. "find the entries *and* tell me what they say"), you may run the
gatherer then the oracle, or dispatch one agent told to do both — but keep each dispatch's product
clean.

## Dispatch (both read-only faces share the shape)

Read `_ops/concierge/README.md` § *Dispatching* for the in-spec detail. In short:

1. **Context.** If the address depends on this conversation, distill the transcript
   (`node _ops/closing-well/transcript-reader.mjs --resolve` → `--distill --out <scratch>/arc.md`);
   for a self-contained address, write a 2–3 line context note instead.
2. **Spawn one read-only agent** (Agent tool; `Explore` or general-purpose — the prompts forbid
   writes regardless). Point it at the face's prompt with slots filled — `{{REQUEST}}` or
   `{{QUESTION}}`, `{{TRANSCRIPT_CONTEXT}}`, `{{PALACE_ROOT}} = /Users/loudonstearns/Documents/The Palace`.
   Keep it to one agent unless the topic is genuinely large; if you expect a big fan-out, tell
   Loudon the rough cost first (his standing preference).
3. **Relay the product** as returned (already file-cited). Offer to save it; note the search
   never entered this context.

## The guard (carry it every time)

Every face is a **faster path to ground truth, never a replacement** ([[Concierge]] § The guard).
Every line it returns is a clickable file pointer to verify; git stays ground truth; the palace's
silence is a real answer, never a confabulated one. Keep this shim thin — when the dispatch
changes, change `_ops/concierge/README.md` and the canon entry, not this file.
