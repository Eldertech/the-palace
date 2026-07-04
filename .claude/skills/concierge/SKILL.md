---
name: concierge
description: Address the palace instead of loading it — dispatch a disposable read-only agent that searches the graph in its own context window and hands back a finished product, keeping the main thread clean (context-offload). Use when Loudon or a working Claude says "spin up the concierge", "ask the concierge to…", "concierge, find me…", "gather every palace doc/link about X", "collect the entries related to X and Y", or otherwise wants palace material assembled without loading the main context with the search. The built job today is the gatherer (find + assemble links/context for a topic). Do NOT use for closing a session — that is the moderator face, triggered by "close well". Do NOT use for edits/writes — the gatherer is read-only.
---

# The Concierge (front-desk skill)

You are the working Claude, invoking the **Concierge** — the palace's front door for
being *addressed* rather than loaded. Full design: `_ops/concierge/README.md` and
[[The Palace Speaks]]. Your job here is to **dispatch a disposable specialist**, relay
its product, and let it vanish — so the effortful search never fills this conversation's
context. That offload is the whole point.

## What is built (Phase 2)

One job: the **gatherer** — "find/collect/assemble every palace doc, entry, or link
related to [topic(s)]." Read-only. It searches the graph in its own window, follows typed
links, and returns a quality, file-cited index.

Not yet built: oracle **Q&A** (Phase 2 second job), the **steward** (Phase 3). The
**moderator** (whole-session close) is *not* this skill — it is the `close well` trigger.
If the request is really a close, or really an edit, say so and route there instead.

## Dispatch the gatherer

1. **Context for the gatherer.** If the request depends on what this conversation has been
   doing, distill the transcript so the gatherer inherits that context:

   ```bash
   node _ops/closing-well/transcript-reader.mjs --resolve
   node _ops/closing-well/transcript-reader.mjs --distill --out <scratchpad>/arc.md
   ```

   For a self-contained request ("all links about X and Y"), skip the distill and write a
   2–3 line context note yourself. Don't over-distill a huge session for a narrow ask.

2. **Spawn one read-only subagent** (Agent tool). Use a read-only-capable agent
   (`Explore`, or general-purpose with the read-only instruction — the gatherer prompt
   forbids writes either way). Keep it to **one** agent unless the topic is genuinely large;
   if you expect a big fan-out, tell Loudon the rough cost first (his standing preference).
   The task you hand it:

   ```
   You are the Concierge, wearing the gatherer mask (read-only).
   Read _ops/concierge/prompts/gatherer.md and follow it exactly, with these slots:
     {{REQUEST}}            = <the user's gather request, verbatim + any sharpening>
     {{TRANSCRIPT_CONTEXT}} = <the distilled arc path's contents, or your 2–3 line note>
     {{PALACE_ROOT}}        = /Users/loudonstearns/Documents/The Palace
   Return only the index it specifies; nothing else.
   ```

3. **Relay the index.** Hand Loudon the returned index as-is (it is already file-cited and
   organized). Offer to save it — its natural home is the bundle of the entry it most
   serves, else the scratchpad if throwaway. Note that you did *not* run the search in this
   context; only the product crossed back.

## The guard (carry it every time)

The gatherer is a **faster path to ground truth, never a replacement.** Every line it
returns points at a file Loudon can open and verify. Never let its index stand as a claim
to be trusted over the files themselves — it hands back pointers, and git is ground truth.
