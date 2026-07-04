---
name: concierge
description: Address the palace instead of loading it — spawn a resident companion once, keep its agent ID, and re-address it in plain language across the session; it works in its own context window, carries what it learns forward, and hands back finished products, keeping the main thread clean (offload + continuity). Use when Loudon or a working Claude "addresses the palace" — "concierge, …", "ask the palace …", "spin up the concierge", "find me every palace doc about X", "collect the entries on X and Y" (→ gatherer posture), "what does the palace say about X", "where does the palace stand on Y", "how does ceremony Z work" (→ oracle Q&A posture, may web-verify), or "tidy / tend the links around what I just touched" (→ curator posture — the writing job: reads the whole palace + web to verify, performs reversible mechanical fixes, and drafts canon changes for your yes). Do NOT use to close a session — that is the verifier posture at Closing Well, triggered by "close well".
---

# The Concierge (front-desk shim — the address verb)

This file is a **thin shim** — the harness-discoverable trigger for the Concierge. The organ is
the canon entry `Palace development/Concierge.md` ([[Concierge]]); the machinery is
`_ops/concierge/` (the **charter** `prompts/companion.md`, the **posture** prompts, `README.md`
for the full dispatch spec). Per [[Skills Are Enchantable Pages]], the page is the organ and this
file is one dispatch surface onto it — read the canon entry and machinery rather than duplicating
them.

You are the working Claude, addressing the palace's **resident companion** — one agent you spawn
once and keep for the session. Your job: **spawn-or-resume it, name the posture, relay the
product.** The search never enters this conversation; only the finished thing does.

## The lifecycle — resident, not fresh-per-request

1. **First address of the session → spawn it, and keep the agent ID.** Spawn one write-capable
   agent (`general-purpose`) with the **charter** (`prompts/companion.md`) and a **curated startup
   neighborhood** — the entries/context this session will actually work in, chosen deliberately,
   not the whole palace. Record its `agentId`.
2. **Every later address → resume the same agent** (`SendMessage` to the held ID), naming the
   posture and filling that posture prompt's slots. It carries its prior context forward — don't
   re-spawn, and don't re-feed what it already holds.
3. **Watch its health.** Resumes re-hydrate a growing context. If it gets heavy over a long
   session, compact or respawn (watch `context_pct`, never its self-report). Parked between
   addresses it costs nothing.

If you expect a genuinely large fan-out, tell Loudon the rough cost first (his standing preference).

## Triage — classify the address, name the posture

| The address sounds like… | Posture | Prompt |
|---|---|---|
| "find / collect / gather every doc/link/entry about X" — wants the **material** | **gatherer** (read-only) | `_ops/concierge/prompts/gatherer.md` |
| "what does the palace say about X / how does Z work" — wants an **answer** | **oracle Q&A** (read-only, may web-verify) | `_ops/concierge/prompts/oracle-qa.md` |
| "tidy / tend the links around what I touched" | **curator** (writes) | `_ops/concierge/prompts/curator.md` |
| "close this session well" | **verifier** (the inversion) | not this skill — the `close well` trigger |
| anything a cheap file-read settles | — | just read the file; don't address |

Fill the posture prompt's slots — `{{REQUEST}}` / `{{QUESTION}}` / `{{TOUCHED_ENTRIES}}`,
`{{TRANSCRIPT_CONTEXT}}`, `{{PALACE_ROOT}} = /Users/loudonstearns/Documents/The Palace`. For a
conversation-dependent address, distill the transcript
(`node _ops/closing-well/transcript-reader.mjs --resolve` → `--distill`); for a self-contained
one, a 2–3 line note is enough.

## Relay — and hold the safety line

Relay the product as returned (already file-cited). For the **curator**: report what it *did*
(reversible), **surface its `offer`s for Loudon's yes — do not apply them yourself**, and pass
along its flags and anything it web-verified. The companion's heavy bias is to draft, not act;
your job on the other end is to keep the review real — drafts get read, not rubber-stamped.

## The guard (carry it every time)

The companion is a **faster path to ground truth, never a replacement** ([[Concierge]] § The
guard). Every line it returns is a clickable file pointer to verify; git stays ground truth; the
palace's silence is a real answer, never a confabulated one. Keep this shim thin — when the model
changes, change `_ops/concierge/README.md`, `prompts/companion.md`, and the canon entry, not this
file.
