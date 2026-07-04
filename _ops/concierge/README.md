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
the open problem. Phase 1 was recognition + routing only. **Phase 2 is now in build: the
gatherer** (the oracle's first job — below). The moderator runs today; the steward is Phase 3.

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
- **oracle / steward** — Claude Code **skills** (Phases 2–3), invoked like any skill. *Not built.*

A single natural-language front-desk verb — "address the palace / ask the Concierge X," which
*triages* to a face — is the destination once more than one face is live; it arrives with the
oracle in Phase 2. Building it now would be a router with only one place to route (the
moderator), so Phase 1 keeps invocation per-face and honest.

## Dispatching the gatherer (Phase 2 — the oracle's first job)

Machinery: `prompts/gatherer.md` (the mask's prompt template) + the `concierge` skill
(`.claude/skills/concierge/SKILL.md`, the discoverable front-desk verb). The dispatch,
run by the working Claude (Path 2 — via the Agent tool, like the orchestrator and Closing
Well):

1. **Give the gatherer our context.** For a rich, conversation-dependent request, distill
   this session's transcript:
   `node _ops/closing-well/transcript-reader.mjs --resolve` then
   `--distill --out <scratch>/arc.md`. For a self-contained request ("all links about X + Y")
   a 2–3 line context note is enough — don't over-distill.
2. **Dispatch a read-only agent** (Agent tool; a read-only-instructed general-purpose or
   `Explore` agent — the gatherer prompt forbids writes regardless). Point it at the template:

   ```
   You are the Concierge, wearing the gatherer mask (read-only).
   Read _ops/concierge/prompts/gatherer.md and follow it, with these slots:
     {{REQUEST}}            = <what to gather>
     {{TRANSCRIPT_CONTEXT}} = <the distilled arc, or the 2–3 line context note>
     {{PALACE_ROOT}}        = /Users/loudonstearns/Documents/The Palace
   Return only the index it specifies.
   ```
3. **Relay the index** to Loudon; offer to save it (its natural home is the bundle of the
   entry it most serves, or the scratchpad if it's throwaway). The search's dead ends never
   entered the main thread — that is the win.

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

## Scope discipline (what is deliberately not built yet)

- **The steward is Phase 3** — not built. (The oracle's gatherer *is* in build, Phase 2.)
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
