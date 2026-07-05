# The Concierge — the palace's resident companion

The palace has two modes of being: the **corpus you load** (`@import`, cognition happens in you)
and the **mind you address** — a resident companion you spawn once, keep beside you for the
session, and re-address as the work moves. Named for what a good concierge is — careful,
thoughtful, personalized help that knows the building intimately and *points you where you need to
go while you stay free to walk there yourself.* That last clause is the whole ethic.

The canon organ is the entry [[Concierge]] (`Palace development/Concierge.md`); the concept it
realizes is [[The Palace Speaks]]; the roadmap is [[The Palace Speaks — production plan]]. This
directory is the machinery. The **companion charter** (`prompts/companion.md`) is what you spawn it
with — its character and lifecycle; the **posture prompts** (`prompts/gatherer.md`, `oracle-qa.md`,
`curator.md`) are the specific jobs it wears per address. All postures are built; the close-inversion
is designed; the health **dial** (compact-or-respawn on `context_pct`) is the one piece still open.

## What it's for — offload *and* continuity

Two reasons to keep a companion rather than load everything yourself:

- **Context-offload.** The effortful, messy part of a task — the grepping, the dead ends, the big
  files skimmed and dropped — happens in *its* window, and only the finished product crosses back.
  Your main thread stays clean; the mess stays with the worker.
- **Continuity.** Because the companion persists, its second answer builds on its first — it
  remembers the neighborhood it read, the offers you declined, the shape of the session. A fresh
  dispatch throws that away every time; the companion keeps it warm.

**Canonical use — the gatherer posture.** Mid-conversation you need every palace document about,
say, [[STIGMERGY]] and [[Agent Wellbeing]]. Instead of grepping and loading your own context with
dead ends, you ask the companion. It searches the graph freely *in its own window*, follows typed
links, assembles a quality index of clickable file pointers, and hands it back. You gain the
product; you never paid the context cost of finding it.

## The lifecycle — spawn once, hold the ID, re-address

The companion is **resident by default** (this reversed the old fresh-dispatch default on
2026-07-04). The mechanics, verified that day:

1. **Spawn once** (Agent tool, `general-purpose` — it must be write-capable for the curator
   posture). Give it the **charter** (`prompts/companion.md`), which has it boot the **operational
   tier** as its standing expertise (SUBSTRATE · ROSETTA · Substrate Skill · Palace Ceremonies ·
   STIGMERGY + the wire spec) — the companion is deeper in *how the palace runs* than the working
   Claude, so it can validate and support the palace in parallel. Per-address *work-targets* come
   later; the birth-load is the expertise, not the task. Keep its **agent ID**.
2. **Re-address it** (`SendMessage` to the held ID) as the work moves, each time naming the
   **posture** and handing the posture prompt's slots. Between addresses it is *parked* — it
   consumes nothing until you reopen it, and re-hydrates its own accumulated context on resume
   (confirmed: a parked companion resumed many turns later with full context, zero re-reads).
3. **Watch its health.** Each resume re-hydrates a *growing* context. Watch the objective
   `health.context_pct` signal (never the companion's self-report), and **compact or respawn** when
   it gets heavy. Same dial the close-intensity problem needs.

Fresh single-shot dispatch is *not* gone — it is still right for a genuine one-off errand, and a
fresh cold reader is the optional escalation at close (below). But the default is the resident.

## How you address it — plain language, routed to a posture

The `concierge` skill (`.claude/skills/concierge/SKILL.md`) is the discoverable front-desk verb.
You address the palace in plain language and it routes to a posture — you never name one:

| The address sounds like… | Posture / prompt | Product |
|---|---|---|
| "find / collect / gather every doc about X" — wants the **material** | gatherer — `prompts/gatherer.md` | a file-cited **index** of pointers |
| "what does the palace say about X / how does Z work" — wants an **answer** | oracle Q&A — `prompts/oracle-qa.md` | a synthesized **answer** that cites its pointers (may web-verify) |
| "tidy / tend the links around what I just touched" | curator — `prompts/curator.md` | reversible fixes done, canon changes **drafted** for your yes |
| "close this session well" | verifier — the [[Closing Well]] machinery, `close well` | a moderated close; the companion turns verifier |
| anything a cheap file-read settles | — | just read the file; don't address |

Fill the posture prompt's slots (`{{REQUEST}}` / `{{QUESTION}}` / `{{TOUCHED_ENTRIES}}`,
`{{TRANSCRIPT_CONTEXT}}`, `{{PALACE_ROOT}} = /Users/loudonstearns/Documents/The Palace`). Relay the
product as returned (already file-cited); for the curator, surface its `offer`s for Loudon's yes
rather than applying them yourself. The search's dead ends never enter the main thread — that is
the win.

## Its character — a subservient companion that holds the safety line

Because it is *one* companion that can both read and write, the read/write safety lives in its
**character**, not in the architecture (there is no separate read-only agent). The charter holds it:
it **reads before it writes**, it **hands up drafts far more than it acts** (the `offer` bias
generalized), and it **points at the file, never stands between you and it.** Two things this puts
weight on: the charter must hold the draft-for-approval bias firmly, and *you must actually review
its drafts, not rubber-stamp them.* The ladder moved from the wall into the disposition — keep the
review real.

## The inversion at close — the tables turn

Through the session the companion is subservient. **At [[Closing Well]] the hierarchy flips:** it
becomes the **verifier** — does all the verification of the session and may **question the working
Claude** to complete it and catch hallucination. It closes by **cross-examination**, not by reading
the arc cold: it interrogates the parent and checks claims independently against the files and the
web, catching where the account drifts from ground truth. This supersedes the old "moderator must be
a fresh disposable agent" rule — interrogation by a different mind is a stronger hallucination check
than a cold re-read. (A fresh cold reader can still be spawned alongside if a truly uninvolved
full-arc read is ever wanted — optional escalation, not the default.)

## The load-bearing guard — both modes always open

The companion is a **faster path to ground truth, never a replacement.** It shows its work and
points at the file it drew from; git stays ground truth; the file is always readable by hand. The
moment "trust the companion" replaces "read the file," the palace has regressed, not matured. Every
honesty guard already in use — *show before write*, *read before touching*, the `UNFILLED`
sentinel, the conservative-canon default — is built into the charter. A companion who stands
*between* you and the rooms, instead of pointing you toward them, has stopped being one.

## When to address rather than load

Reach for the companion **only** when the task is one of:

- **expensive to load** the knowledge for, or
- **wants fresh eyes** / a whole-graph vantage the in-context instance can't spare, or
- **needs a heavyweight ceremony remembered** that a human would otherwise have to carry.

The through-line is **offload** — the work would cost your main thread more (in tokens, dead ends,
lost focus) than the finished product is worth carrying the search for. Appetite is not a criterion.
Most work still **loads** — that is the default, and asking for what a cheap file-read answers is the
anti-pattern. Authorship that needs Loudon's judgment in the room ([[Deposit Ceremony]],
[[Baton Ceremony]]) stays human-in-the-loop — *dispatched through* the companion, never replaced by
it.

## The open problem — the health dial (carried, not solved)

The dial governs two things now: **close intensity** (how hard the verifier presses — light when the
parent is fresh, heavy when it is spent) and **companion health** (when to compact-or-respawn). Both
must read an **objective** signal — never the judged instance's self-report (proven 2026-07-04, when
an active instance asserted "context full" when it was not):

- STIGMERGY `health.context_pct` (orchestrator-measured), or
- a transcript token/turn estimate computed outside the judged instance.

The dial itself is **not built**. This card records the constraint so it is not re-derived wrong:
*never wire the dial to the active Claude's own sense of how full it is.*

## Scope discipline (what is deliberately not built yet)

- **The dial is not built** — the one open piece. It records its input constraint above.
- **Does not add "keep both modes open" to the formal always-loaded invariant list** (JEWEL /
  CLAUDE's "Never violate these"). That is a Schema-Ceremony-weight act, done *once the pattern has
  earned it* — the production plan's Deferred step. Stated here as a working rule; promoting it is later.

## Forward

- Live-run the resident model end to end (spawn → curate startup → re-address → watch `context_pct`
  → flip to verifier at close), then tune the charter from what the first real run teaches.
- Build the health dial on the objective signal.
- Watch that the draft-for-approval bias holds and drafts get genuinely reviewed. If the companion
  drifts toward acting, tighten the charter.
