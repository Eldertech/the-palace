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
   self-report). Feed it to `node dial.mjs --tokens <N> --model <id>` → green/yellow/red +
   continue/compact/respawn. Two arms on the one number: **capacity** (÷ window) and **economy**
   (per-resume cost); it acts on the worse, and on 1M-window models economy is what usually calls the
   respawn. Same dial serves close-intensity (`--for close`).

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

`node dial.mjs --tokens <N> --model <id> [--for companion|close]` returns a zone + the action. It weighs
two arms on the one number — **capacity** (÷ the model window; the safety backstop, bites on Haiku's 200K)
and **economy** (per-resume cost; what bites on the 1M-window models, where capacity almost never binds per
the sensor-B proof) — and acts on the worse. Thresholds are first-cut and meant to be re-tuned from real
runs. The load-bearing rule the card still records so it is never re-derived wrong: *never wire the dial to
the active Claude's own sense of how full it is* — pipe the objective number in.

## Scope discipline (what is deliberately not built yet)

- **The dial is built** (2026-07-08, `dial.mjs`) but **not yet live-run** end to end — proven on real
  measured token counts, not yet exercised in an actual heavy close or a long resident session. That
  live validation is the remaining thread.
- **Does not add "keep both modes open" to the formal always-loaded invariant list** (JEWEL /
  CLAUDE's "Never violate these"). That is a Schema-Ceremony-weight act, done *once the pattern has
  earned it* — the production plan's Deferred step. Stated here as a working rule; promoting it is later.

## Forward

- Live-run the resident model end to end (spawn → curate startup → re-address → watch the dial
  → become the moderator at close), then tune the charter from what the first real run teaches.
- ~~Build the health dial~~ — **built 2026-07-08** (`dial.mjs`). Next: live-run it and re-tune the
  first-cut thresholds from real long-session data.
- Watch that the draft-for-approval bias holds and drafts get genuinely reviewed. If the companion
  drifts toward acting, tighten the charter.
