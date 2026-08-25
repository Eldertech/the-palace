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
`curator.md`) are the specific jobs it wears per address. All postures are built; the moderator role
is designed; the health **dial** (`dial.mjs` — compact-or-respawn on the objective `subagent_tokens`
read) landed 2026-07-08.

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

The companion is **resident once summoned** — spawned *when first needed* (early, at a chapter, or
only at the close), then kept until the session ends; not auto-spawned at session start, and many
sessions never summon it (this reversed the old fresh-dispatch-per-request default on 2026-07-04).
The mechanics, verified that day:

1. **Spawn once** (Agent tool, `palace-writer` — the [[Agent Toolbox]] profile; it must be
   write-capable for the curator posture, and `palace-writer` is the least-privilege profile that
   still writes, shedding ~20K of unused MCP schemas that `general-purpose` would carry. A single
   write-capable resident covers all three postures — a read-only `palace-reader` would force a
   second agent for every curator address and lose the resident's accumulated context; wired to
   `palace-writer` 2026-07-08). Give it the **charter** (`prompts/companion.md`), which has it boot the **operational
   tier** as its standing expertise (SUBSTRATE · ROSETTA · Substrate Skill · Palace Ceremonies ·
   STIGMERGY + the wire spec) — the companion is deeper in *how the palace runs* than the working
   Claude, so it can validate and support the palace in parallel. Per-address *work-targets* come
   later; the birth-load is the expertise, not the task. Keep its **agent ID**.
2. **Re-address it** (`SendMessage` to the held ID) as the work moves, each time naming the
   **posture** and handing the posture prompt's slots. Between addresses it is *parked* — it
   consumes nothing until you reopen it, and re-hydrates its own accumulated context on resume
   (confirmed: a parked companion resumed many turns later with full context, zero re-reads).
3. **Watch its health with the dial.** Each resume re-hydrates a *growing* context and returns the
   objective read — `subagent_tokens` in the Agent tool's `<usage>` block (never the companion's
   self-report). Feed it to `node dial.mjs --tokens <N> --model <id>`. Headline = **trust** (capacity ÷
   window: fine below ~60%, watch 60–80%, degraded past 80%); a separate **cost** note (from absolute
   load) flags when resumes get expensive — respawn-to-save, never a trust alarm. Same dial serves
   close-intensity (`--for close`), where how spent the parent is leads.

Fresh single-shot dispatch is *not* gone — it is still right for a genuine one-off errand, and a
fresh cold reader is the optional escalation at close (below). But the default is the resident.

## How you address it — plain language, routed to a posture

The `concierge` skill (`.claude/skills/concierge/SKILL.md`) is the discoverable front-desk verb.
You address the palace in plain language and it routes to a posture — you never name one:

| The address sounds like… | Posture / prompt | Product |
|---|---|---|
| "find / collect / gather every doc about X" — wants the **material** | gatherer — `prompts/gatherer.md` | a file-cited **index** of pointers |
| "what does the palace say about X / how does Z work" — wants an **answer** | oracle Q&A — `prompts/oracle-qa.md` | a synthesized **answer** that cites its pointers (may web-verify) |
| "what should I work on / what's open / I'm back" — wants **one move** | scout — `prompts/scout.md` | a **return map** ending on one recommended move, runners-up in a line each |
| "tidy / tend the links around what I just touched" | curator — `prompts/curator.md` | reversible fixes done, canon changes **drafted** for your yes |
| "close this session well" | moderator — the [[Closing Well]] machinery, `close well` | a moderated close; the companion reads the day cold and drafts the reckoning |
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

## At a close — the companion becomes the moderator

Through the session the companion is subservient. **At [[Closing Well]] its role shifts:** it
becomes the **moderator** — it reads the session's arc *cold* with fresh eyes, forms its own honest
read, and helps the working Claude and Loudon see what the day amounted to, drafting the reckoning
(the four gestures) that Loudon signs. It **never answers for a panelist** (`UNFILLED`, never
invented). Its fresh read is a genuine check on a spent instance — catching where a tired account
drifts from the transcript or ground truth — but it works by *reading honestly and refusing to
confabulate*, not by interrogation. Full spec: [[Closing Well]] § Closing Well, Enchanted and the
[[Closing Well Ceremony]].

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

## The health dial — built 2026-07-08 (`dial.mjs`)

The dial governs two things on one signal: **close intensity** (how much the moderator carries — light
when the parent is fresh, heavy when it is spent) and **companion health** (when to compact-or-respawn).
It reads an **objective** number — never the judged instance's self-report (the constraint this exists to
enforce, proven 2026-07-04 when an active instance asserted "context full" while it was not):

- **companion health** → `subagent_tokens` from the Agent tool's `<usage>` block on the last resume.
- **close intensity** → a transcript token estimate for the main thread, computed *outside* the judged
  instance (e.g. via `_ops/closing-well/transcript-reader.mjs`).

`node dial.mjs --tokens <N> --model <id> [--for companion|close]` reports **two axes that must not be
confused:**
- **capacity** = tokens ÷ the model window — the **trust** axis (the same %-full a Claude Code meter
  shows: full trust below ~60%, watch 60–80%, degraded past 80%). *Only this axis says
  respawn-for-reliability.* It bites on Haiku's 200K; on the 1M-window models it almost never binds
  (sensor-B proof).
- **load** = absolute accumulated tokens — read as **cost** for a companion (every resume re-bills the
  whole context, so a heavy resident is expensive to keep waking — an advisory to respawn-to-save, never
  a trust alarm) and as **spentness** for a close (how much arc the moderator must carry — a big day
  reads heavy even at a small % of a 1M window).

Keeping the two apart is the point: a resident at 25% is fully trustworthy even if it is expensive to
resume — the old single-zone dial wrongly read that as a health alarm. Thresholds are first-cut and meant
to be re-tuned from real runs. The load-bearing rule the card still records so it is never re-derived
wrong: *never wire the dial to the active Claude's own sense of how full it is* — pipe the objective
number in.

## The work-choice vector — built 2026-08-25 (`scout.md` + `return-map.mjs`)

The scout is the posture for the question *"what should I work on?"* — and it exists because of a
measurable cost. When the main window asks that, its instinct is to open every baton and choose among
them. That burns the window Loudon came back to work in, and it skews the choice toward whichever
baton happens to read as most urgent — **urgency of prose is not priority of work.** The scout takes
the survey into its own window and hands back **one recommended move**, runners-up in a line each so
the parent can overrule it without another dispatch.

It is split deliberately in two, and the split is the design:

- **`return-map.mjs` gathers evidence and refuses to interpret.** One command runs the whole
  [[Return Ceremony]] query block — last commit and the arc, open/claimed handoffs, anyone blocked on
  a decision, baton files with no board line, the linters, worktrees, unpushed and uncommitted work —
  printing each probe *beside the command that produced it*, so every row of a map can cite a command
  rather than an inference. A probe that cannot run prints `unavailable` with its error; a missing
  answer stays visible rather than being replaced by a reasonable-sounding one. `--json` for structured
  output, `--since <date>` when the last session's date is known.
- **`scout.md` reads that evidence and makes the call.** The record answers; the reader judges. A
  script that only gathers cannot quietly become an oracle, and a posture that must cite the script
  cannot quietly reason from the file tree.

**Load-bearing for a ceremony.** The [[Return Ceremony]] (v1.16) names summoning this companion as its
**first act**, precisely so a returning session does not do the work-choice by hand — the 2026-08-25
return did it by hand and produced five wrong claims before anyone read the handoff board. This is the
machinery that ceremony assumes exists. It also closes the ledger's gotcha 20: summoned at the return,
the resident is warm and resumable by the time the session reaches `close well`. **Summoned at the
return, takes the wheel at the close.**

The scout may not claim a handoff, touch a baton, or start the work — claiming is the parent's act with
Loudon in the room. And it may open a baton body only to break a genuine tie between two candidates,
one file, never the set: committing the very failure it was built to prevent, on the parent's behalf,
is the one thing that would make it worse than nothing.

## Scope discipline (what is deliberately not built yet)

- **The dial is built** (2026-07-08, `dial.mjs`) but **not yet live-run** end to end — proven on real
  measured token counts, not yet exercised in an actual heavy close or a long resident session. That
  live validation is the remaining thread.
- **The scout is built** (2026-08-25) but **not yet run in a real return** — the ranking rules are
  reasoned from the 2026-08-25 failure, not yet tuned by a live work-choice. Watch whether "an open
  handoff outranks a fresh idea" holds when the fresh idea is genuinely better, and whether the
  one-move discipline survives a board with three equally live candidates.
- **Does not add "keep both modes open" to the formal always-loaded invariant list** (JEWEL /
  CLAUDE's "Never violate these"). That is a Schema-Ceremony-weight act, done *once the pattern has
  earned it* — the production plan's Deferred step. Stated here as a working rule; promoting it is later.

## Forward

- Live-run the resident model end to end (spawn → curate startup → re-address → watch the dial
  → become the moderator at close), then tune the charter from what the first real run teaches.
- ~~Build the health dial~~ — **built 2026-07-08** (`dial.mjs`). Next: live-run it and re-tune the
  first-cut thresholds from real long-session data.
- Run the scout on a real return and tune its ranking rules from what the choice actually needed.
- Watch that the draft-for-approval bias holds and drafts get genuinely reviewed. If the companion
  drifts toward acting, tighten the charter.
