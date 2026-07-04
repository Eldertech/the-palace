---
name: concierge
description: Address the palace instead of loading it — say what you need in plain language and the Concierge triages it to a disposable agent that works in its own context window and hands back a finished product, keeping the main thread clean (context-offload). Use when Loudon or a working Claude "addresses the palace" — "concierge, …", "ask the palace …", "spin up the concierge", "find me every palace doc about X", "collect the entries on X and Y" (→ gatherer), "what does the palace say about X", "where does the palace stand on Y", "how does ceremony Z work" (→ oracle Q&A, read-only), or "tidy / tend the links around what I just touched" (→ curator — the one face that writes: it reads the whole palace and the web to verify, performs reversible mechanical fixes directly, and drafts canon changes for your yes). Do NOT use to close a session — that is the moderator face, triggered by "close well".
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
| "tidy / tend the links around what I touched" | **curator** | `_ops/concierge/prompts/curator.md` — the one **writing** face; dispatch on the touched entries. It reads the whole palace + web (a check on host hallucination), performs the reversible `do`s, and drafts the `offer`s (canon judgment, or anything far from the work) for Loudon's yes |
| anything a cheap file-read settles | — | just read the file; don't dispatch |

If an address blends two (e.g. "find the entries *and* tell me what they say"), you may run the
gatherer then the oracle, or dispatch one agent told to do both — but keep each dispatch's product
clean.

## Dispatch (the faces share a shape; the curator differs in one way)

Read `_ops/concierge/README.md` § *Dispatching* for the in-spec detail. In short:

1. **Context.** If the address depends on this conversation, distill the transcript
   (`node _ops/closing-well/transcript-reader.mjs --resolve` → `--distill --out <scratch>/arc.md`);
   for a self-contained address, write a 2–3 line context note instead.
2. **Spawn one agent** (Agent tool; `Explore` or general-purpose). Point it at the face's prompt
   with slots filled — `{{REQUEST}}` / `{{QUESTION}}` / `{{TOUCHED_ENTRIES}}`,
   `{{TRANSCRIPT_CONTEXT}}`, `{{PALACE_ROOT}} = /Users/loudonstearns/Documents/The Palace`.
   Keep it to one agent unless the topic is genuinely large; if you expect a big fan-out, tell
   Loudon the rough cost first (his standing preference).
   - **oracle (gatherer / Q&A) is read-only** — the prompts forbid writes regardless of agent type,
     but may reach the web to verify a claim (label palace vs. web; never dress web as canon).
   - **the curator writes** — it must be a write-capable agent (general-purpose, not `Explore`).
     Its prompt lets it read the whole palace + web, performs only the near+mechanical `do`s, and
     *drafts* everything with canon judgment or far from the work as `offer`s.
3. **Relay the product** as returned (already file-cited). For the curator, this means: report
   what it *did* (reversible), surface its *offers* for Loudon's yes (do not apply them yourself),
   and pass along its *flags* and anything it web-verified. Note the search never entered this context.

## The guard (carry it every time)

Every face is a **faster path to ground truth, never a replacement** ([[Concierge]] § The guard).
Every line it returns is a clickable file pointer to verify; git stays ground truth; the palace's
silence is a real answer, never a confabulated one. Keep this shim thin — when the dispatch
changes, change `_ops/concierge/README.md` and the canon entry, not this file.
