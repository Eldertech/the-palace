# The Concierge — the palace's front door for being *addressed*

The thin recognition-and-routing membrane between the palace's two modes of being:
the **corpus you load** (`@import`, cognition happens in you) and the **mind you
address** (a standing agent you send a request to, that works with fresh eyes and
replies). Named for what a good concierge is — careful, thoughtful, personalized
assistance that knows the building intimately and *points you where you need to go
while you stay free to walk there yourself.* That last clause is the whole ethic.

The concept this realizes is [[The Palace Speaks]]; the roadmap is
[[The Palace Speaks — production plan]]. This directory is the Concierge's machinery
(the pattern of `_ops/closing-well/`): the always-loaded floor block *recognizes* the
Concierge and names the faces; this card holds the roster, the triage, the guard, and
the open problem. **Phase 1 is recognition + routing only — it changes no behavior.**
The oracle and steward faces are not built yet; only the moderator runs today.

## How you invoke it — a face, not the Concierge

There is no `concierge` command. The Concierge is the **recognition map** (the CLAUDE.md
floor section + this card); you act on it by invoking a **face** directly, or by deciding
to just load-and-read. Invocation is **per-face**, and the mechanisms differ:

- **moderator** — the trigger phrase **`close well`** (recognized in CLAUDE.md's ceremony
  trigger table; dispatches the [[Closing Well]] Agent). *Live today.*
- **oracle / steward** — Claude Code **skills** (Phases 2–3), invoked like any skill. *Not built.*

A single natural-language front-desk verb — "address the palace / ask the Concierge X," which
*triages* to a face — is the destination once more than one face is live; it arrives with the
oracle in Phase 2. Building it now would be a router with only one place to route (the
moderator), so Phase 1 keeps invocation per-face and honest.

## The load-bearing guard: both modes always open

A face is a **faster path to ground truth, never a replacement.** It shows its work
and points at the file it drew from; git stays ground truth; the file is always
readable by hand. The moment "trust the face" replaces "read the file," the palace has
regressed, not matured. Every honesty guard already in use — *show before write*,
*read before touching*, the `UNFILLED` sentinel, the conservative-canon default —
travels with each face as it is built. A concierge who stands *between* you and the
rooms, instead of pointing you toward them, has stopped being a concierge.

## When to address rather than load — the migration criterion

Reach for a face **only** when the task is one of:

- **expensive to load** the knowledge for, or
- **wants fresh eyes** / a whole-graph vantage the in-context instance can't spare, or
- **needs a heavyweight ceremony remembered** that a human would otherwise have to carry.

Appetite is not a criterion. Most work still **loads** — that is the default, and asking
a face for what a cheap file-read answers is the anti-pattern. Authorship that needs
Loudon's judgment in the room ([[Deposit Ceremony]], [[Baton Ceremony]]) stays
human-in-the-loop — *dispatched through* a face, never replaced by one.

## The roster — three faces, with build status

| Face | What it does | Weight | Status |
|---|---|---|---|
| **oracle** | Answers palace-infrastructure questions, read-only; always points at the file it came from. The migration of the Query ceremony (`what does the palace say about [topic]?`) from load-directly to fresh-eyes dispatch. | read-only | **Phase 2 — not built.** Until it is, run the **Query** trigger in-context. |
| **steward** | 1-hop neighborhood tending — `do / offer / flag`, bounded to entries a session actually touched. Introduces writes, but reversible (do), human-gated (offer), non-acting (flag). | 1-hop, bounded | **Phase 3 — not built.** |
| **moderator** | Runs a whole session close as a moderated panel between the active Claude and Loudon — the four gestures + backstage placement. | full close | **Built** — the [[Closing Well]] Agent (Phases 0–5, live gate passed 2026-07-04). Trigger: `close well`. |

The faces are a **weight ladder** — oracle (read-only) → steward (1-hop) → moderator
(full close). Oracle is the safe first migration precisely because there is nothing to
mis-place and both modes are trivially open: you can always just read the file.

## Triage — which question reaches for which face

| The request sounds like… | Route |
|---|---|
| "What does X mean / where does the palace stand on Y / how does this ceremony work?" | **oracle** (until built: **Query** in-context, or just read the entry) |
| "Tidy the links / stage / vector around what I just touched." | **steward** (until built: do it in-context, one hop) |
| "Close this session well." | **moderator** — `close well` |
| Anything a cheap file-read answers. | **load-directly** — the default; don't address for what reading settles. |

## The open problem — the dial's input is unsolved (carried, not solved)

The moderator's effort is meant to scale with **how full the room is** (light when the
active Claude is fresh; carrying the weight when it is spent — the ~75%-full crossover
where both cost and quality flip). **That dial cannot read the active Claude's
self-report.** An AI is not a reliable judge of its own context fullness — proven on
2026-07-04, when an active instance asserted "context full" when it was not. The dial
must therefore read an **objective** signal:

- STIGMERGY `health.context_pct` (orchestrator-measured), or
- a transcript token/turn estimate computed outside the judged instance.

The dial itself is **Phase 4** and is not built here. This card records the constraint
so it is not re-derived wrong: *never wire the dial to the active Claude's own sense of
how full it is.*

## What Phase 1 deliberately does not do

- **Does not build the oracle or steward** (Phases 2–3). It only names them and their triggers-to-come.
- **Does not build the dial** (Phase 4). It records the dial's input constraint above.
- **Does not add "keep both modes open" to the formal always-loaded invariant list**
  (JEWEL / CLAUDE's "Never violate these"). That is a Schema-Ceremony-weight act, done
  *once the pattern has earned it*, not up front — the production plan's Deferred step.
  The guard is stated here as a working rule; promoting it to a floor invariant is later.

## Forward

- Graduate the Concierge to a canon `meta` entry once it has earned linked use (it is a
  card now, one-at-a-time / reversible).
- Build the oracle face (Phase 2) — the first thing that should actually *run* when you
  address the palace.
