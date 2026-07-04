---
name: concierge
description: Address the palace instead of loading it — dispatch a disposable read-only agent that searches the graph in its own context window and hands back a finished product, keeping the main thread clean (context-offload). Use when Loudon or a working Claude says "spin up the concierge", "ask the concierge to…", "concierge, find me…", "gather every palace doc/link about X", "collect the entries related to X and Y", or otherwise wants palace material assembled without loading the main context with the search. The built job today is the gatherer (find + assemble links/context for a topic). Do NOT use for closing a session — that is the moderator face, triggered by "close well". Do NOT use for edits/writes — the gatherer is read-only.
---

# The Concierge (front-desk shim)

This file is a **thin shim** — the harness-discoverable trigger for the Concierge. The organ
itself is the canon entry `Palace development/Concierge.md` ([[Concierge]]); the dispatch
machinery is `_ops/concierge/`. Per [[Skills Are Enchantable Pages]], the page is the organ
and this file is one dispatch surface onto it — so read the canon entry and machinery rather
than duplicating them here.

**To act on an invocation:**

1. **Read** `_ops/concierge/README.md` § *Dispatching the gatherer* — the current, in-spec
   dispatch (transcript-reader for context → one read-only Agent reading
   `_ops/concierge/prompts/gatherer.md` → relay the index). Follow it; it is the source of truth.
2. **Route honestly.** The one built job is the **gatherer** (read-only find/collect/assemble).
   A session *close* is the moderator face — the `close well` trigger, not this skill. An
   *edit/write* is out of scope (the gatherer is read-only). If the request is really one of
   those, say so and route there.
3. **Carry the guard** ([[Concierge]] § The guard): the gatherer is a faster path to ground
   truth, never a replacement — every line it returns is a clickable file pointer to verify,
   and git stays ground truth. Relay the product; note the search never entered this context.

Keep this shim thin. When the dispatch changes, change `_ops/concierge/README.md` and the
canon entry — not this file.
