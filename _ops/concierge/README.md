# The Concierge — the palace's front door for being *addressed*

The thin recognition-and-routing membrane between the palace's two modes of being:
the **corpus you load** (`@import`, cognition happens in you) and the **mind you
address** (a standing agent you send a request to, that works with fresh eyes and
replies). Named for what a good concierge is — careful, thoughtful, personalized
assistance that knows the building intimately and *points you where you need to go
while you stay free to walk there yourself.* That last clause is the whole ethic.

The canon organ is the entry [[Concierge]] (`Palace development/Concierge.md`); the concept
it realizes is [[The Palace Speaks]]; the roadmap is [[The Palace Speaks — production plan]].
This directory is the Concierge's machinery (the pattern of `_ops/closing-well/`): the always-loaded floor block *recognizes* the
Concierge and names the faces; this card holds the roster, the triage, the guard, and
the open problem. **All three faces are now built** — the oracle (Phase 2: gatherer + Q&A), the
moderator (`close well`), and the curator (Phase 3: the first face that *writes*). What remains
unbuilt is the **dial** (Phase 4) — how the moderator's effort scales with room-fullness.

## What it's for — keep your thread clean

The everyday reason to address the Concierge is **context-offload**: the effortful, messy
part of a task — the grepping, the dead ends, the big files skimmed and thrown away — happens
in a *disposable* agent's context, and only the finished product crosses back into your
conversation. Your main thread stays clean and on-topic; the mess evaporates with the agent.
This is the sharpest statement of the whole idea, and the exact *opposite* of a persistent
agent: a standing Concierge would drag every dead end back into the room; a dispatched one
leaves it behind.

**Canonical use case — the gatherer.** Mid-conversation you need every palace document related
to, say, [[STIGMERGY]] and [[Agent Wellbeing]]. Instead of grepping and loading your own context
with dead ends, you dispatch the request to the Concierge. It reads your transcript for context,
searches the graph freely *in its own window*, follows typed links, assembles a quality index of
entries — each a clickable file pointer — hands it back, and vanishes. You gain the product; you
never paid the context cost of finding it. This is the **oracle** face's first job (Phase 2, in build).

## How you invoke it — a face, not the Concierge

There is no `concierge` command. The Concierge is the **recognition map** (the CLAUDE.md
floor section + this card); you act on it by invoking a **face** directly, or by deciding
to just load-and-read. Invocation is **per-face**, and the mechanisms differ:

- **moderator** — the trigger phrase **`close well`** (recognized in CLAUDE.md's ceremony
  trigger table; dispatches the [[Closing Well]] Agent). *Live today.*
- **oracle** — the `concierge` Claude Code **skill**, invoked like any skill. *Built (Phase 2).*
- **curator** — dispatched via `prompts/curator.md` on the entries a session touched. *Built (Phase 3).*

A single natural-language front-desk verb — "address the palace / ask the Concierge X," which
*triages* to a face — is the destination once more than one face is live; it arrives with the
oracle in Phase 2. Building it now would be a router with only one place to route (the
moderator), so Phase 1 keeps invocation per-face and honest.

## Dispatching a read-only face — the address verb (Phase 2)

The oracle has two jobs, both read-only, both dispatched the same way — the working Claude
**triages the address**, then dispatches one disposable agent (Path 2, the Agent tool):

| The address wants… | Face / prompt | Product |
|---|---|---|
| the **material** on a topic ("find/collect/gather every doc about X") | gatherer — `prompts/gatherer.md` | a file-cited **index** of pointers |
| an **answer** ("what does the palace say about X / how does Z work") | oracle Q&A — `prompts/oracle-qa.md` | a synthesized **answer** that cites its pointers |

The `concierge` skill (`.claude/skills/concierge/SKILL.md`) is the discoverable front-desk verb
that does this triage. Either way:

1. **Give the agent our context.** For a conversation-dependent address, distill this session's
   transcript: `node _ops/closing-well/transcript-reader.mjs --resolve` then
   `--distill --out <scratch>/arc.md`. For a self-contained address, a 2–3 line context note is
   enough — don't over-distill.
2. **Dispatch one read-only agent** (Agent tool; `Explore` or a read-only-instructed
   general-purpose — the prompts forbid writes regardless). Point it at the face's prompt:

   ```
   You are the Concierge, wearing the <gatherer | oracle Q&A> mask (read-only).
   Read _ops/concierge/prompts/<gatherer.md | oracle-qa.md> and follow it, with these slots:
     {{REQUEST}} or {{QUESTION}} = <the address>
     {{TRANSCRIPT_CONTEXT}}      = <the distilled arc, or the 2–3 line note>
     {{PALACE_ROOT}}             = /Users/loudonstearns/Documents/The Palace
   Return only the product it specifies.
   ```
3. **Relay the product** as returned (already file-cited); offer to save it (the bundle of the
   entry it most serves, or the scratchpad if throwaway). The search's dead ends never entered
   the main thread — that is the win.

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

The through-line of all three is **context-offload** — the work would cost your main thread
more (in tokens, in dead ends, in lost focus) than the finished product is worth carrying the
search for. Appetite is not a criterion. Most work still **loads** — that is the default, and asking
a face for what a cheap file-read answers is the anti-pattern. Authorship that needs
Loudon's judgment in the room ([[Deposit Ceremony]], [[Baton Ceremony]]) stays
human-in-the-loop — *dispatched through* a face, never replaced by one.

## The roster — three faces, with build status

| Face | What it does | Weight | Status |
|---|---|---|---|
| **oracle** | Read-only retrieval + synthesis, always citing the file. First job: the **gatherer** — collect and assemble every palace link/context for a topic, dispatched to a disposable window. Later grows to Q&A (the migration of the Query ceremony from load-directly to fresh-eyes dispatch). | read-only | **Phase 2 — in build (the gatherer).** Skill: `concierge`. Until live, run **Query** / **Map Build** in-context. |
| **curator** | Neighborhood tending — `do / offer / flag` — of the entries a session touched. The first face that *writes*. Reads the **whole palace + web** (a check on host hallucination); writes by **graduated consent**: `do` = near+mechanical, performed; `offer` = canon judgment *or* far from the work, drafted for Loudon's yes; `flag` = noticed, not acted. Nothing walled off from being proposed — distance only raises act→ask. | read: unlimited · write: graduated | **Built (Phase 3).** Verify gate passed 2026-07-04. Prompt: `prompts/curator.md`. |
| **moderator** | Runs a whole session close as a moderated panel between the active Claude and Loudon — the four gestures + backstage placement. | full close | **Built** — the [[Closing Well]] Agent (Phases 0–5, live gate passed 2026-07-04). Trigger: `close well`. |

The faces are a **weight ladder by what each can *write*** — oracle (writes nothing) → curator
(writes by graduated consent) → moderator (runs a full close). The ladder is about mutation, not
access: every face *reads* freely (the curator reads the whole palace and the web). Oracle is the
safe first migration precisely because there is nothing to mis-place and both modes are trivially
open: you can always just read the file.

## Triage — which question reaches for which face

| The request sounds like… | Route |
|---|---|
| "What does X mean / where does the palace stand on Y / how does this ceremony work?" | **oracle** (until built: **Query** in-context, or just read the entry) |
| "Tidy the links / stage / vector around what I just touched." | **curator** — dispatch `prompts/curator.md` on the touched entries (reads wide, writes the `do`s, drafts the `offer`s for your yes) |
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

## Scope discipline (what is deliberately not built yet)

- **The curator is built** (Phase 3, `prompts/curator.md`) — the first writing face. What is *not*
  yet built past it is the **dial** (Phase 4) below.
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
