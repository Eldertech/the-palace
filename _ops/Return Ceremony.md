---
title: "Return Ceremony"
type: practice
pillars: [practice, philosophy]
born: 2026-08
last_activated: 2026-08
activation_count: 1
stage: seed
forward_vector: "I meet Loudon when he comes back after time away and hand him the palace as the record says it stands — never as a returning instance imagines it. I summon the companion as my first act, ask the machine-readable surfaces before I interpret anything, and end on one move he can pick up. I refuse to read a gap as a failure. I want returning to be cheap enough that stepping away stays free."
links:
  - target: "[[Palace Ceremonies]]"
    type: connects-to
  - target: "[[Closing Well Ceremony]]"
    type: mirrors
    label: the-other-bookend
  - target: "[[Concierge]]"
    type: enables
    label: summons-the-resident
  - target: "[[Spore Check Ceremony]]"
    type: mirrors
    label: pointed-at-the-human
  - target: "[[Baton Ceremony]]"
    type: connects-to
    label: catches-a-cold-baton
  - target: "[[Search Before You Build]]"
    type: exemplifies
    label: ask-the-record-first
  - target: "[[Palace Conatus]]"
    type: exemplifies
    label: coupling-is-two-sided
  - target: "[[Cooperation Yields Agency]]"
    type: connects-to
---

# Return Ceremony

## Ceremony Contract

**Trigger:** "I'm back", "returning", "what did I miss", "let's pick this back up", "return"

**Preconditions:**
1. A gap exists — meaningful time since the last session, by Loudon's judgment, not a threshold
2. Git history and the persistent board are readable from the current vector

**Postconditions:**
1. The **query block** (below) was run in full, before any interpretation
2. A **return map** was shown to Loudon before anything was written, every row citing a command's output or a `file:line`
3. Loudon signed the map, adjusted it, or declined it
4. Anything found stale is fixed, queued on [[Palace To-Do]], or explicitly left with a reason
5. No entry was edited on the strength of an inference about *why* the gap happened
6. Git commit: `return(YYYY-MM-DD): [what the gap held, in one line]`

**Failure mode:** If the queries cannot run, say so and stop. A return map assembled by reading the current snapshot is a guess wearing citations, and handing Loudon a confident guess is worse than handing him nothing.

---

## The Return and the Close are one organ, pointed at opposite boundaries

[[Closing Well]] dispatches a rested mind to read the arc of a **spent session**, because a loaded instance cannot grade its own day. The Return needs the same rested mind for the mirror problem: a **returning instance has no context**, and an empty context does not stay empty — it fills with plausible inference. The failure modes are opposite and the remedy is identical: *don't let the instance with the wrong amount of context decide what happened.*

So the Return is a **companion job**, and summoning [[Concierge]] is its first act — not a step you may skip when the return feels small.

That also closes the ledger's hardest-won trap. [[Closing Well]] gotcha 20 says *summon the companion early or it will not exist at the close* — a rule that had no home in any card because it is upstream of the close. Here is its home. Summoned at the return, the resident is warm and resumable by the time you reach `close well`. The two ceremonies are bookends on one organ: **summoned at the return, takes the wheel at the close.**

The companion also solves the selection bias directly. Loading every open baton into the main window to pick one skews the choice toward whichever reads as most urgent, and burns the window you came back to work in. Address the resident for a work-choice instead; its answer arrives as a recommendation, not a pile.

## The rule that outranks the others: the record answers, you do not

**Every row of a return map must cite a command's output or a `file:line`. "I inferred it from the current state" is disqualifying.** This is the palace-worker charter — *cite the file for every claim* — applied to the one situation where the temptation to reason instead is strongest.

The palace keeps its live state in machine-readable surfaces that answer cheaply and definitively: the handoff board, the linters, the persistent blackboard, the production plans, git itself. A returning instance that reasons from the file tree instead of asking those surfaces will be confidently wrong, and its wrongness is expensive because it arrives dressed as an assessment.

This was written from a live failure. On 2026-08-25 a full palace assessment ran *before* any of these queries and produced five wrong claims: a dangling-link count off by 4× (a script artifact), a "breakthrough drought" that was a typing artifact, a proposal to build dispatch machinery that already existed one ceremony up, a deferred-items list containing something built six weeks earlier, and a floor analysis the palace had already completed and recorded. Each was corrected by a single command. **The handoff board went unread for three exchanges** while the session tried to invent what one `list-handoffs` call would have handed over.

## Protocol

**Step 0 — Summon the companion.** Address [[Concierge]] before anything else. It runs the query block in its own window and drafts the map, keeping the main thread clean and the resident warm for the close.

**Step 1 — The query block.** Run all of it before interpreting any of it.

```sh
# where the palace stopped, and the arc across the gap
git log -1 --format='%ad %h %s' --date=short
git log --since=<last-session-date> --format='%ad %s' --date=short

# work in flight — the board is truth, never infer done-ness
node _ops/stigmergy/list-handoffs.mjs
python3 _ops/swarm/lint-weave-flags.py

# anyone blocked on Loudon (a steward can wait months in silence)
#   unanswered RESOURCE_REQUESTs on the persistent board, blocking: true first

# batons the tooling cannot see — a baton file with no board line is invisible
#   compare `Active Baton` pointers + bundle baton files against list-handoffs

# open phases in the surviving production plans (the prune kept only actives)

# drift the linters can prove
python3 _ops/swarm/lint-doc-drift.py
python3 _ops/swarm/lint-voice-drift.py

# is the outside world current, and is anything stranded
git log --oneline origin/main..main | wc -l
git worktree list && git branch -v
git status --short
```

**Step 2 — The return map.** Four sections, each row citing its source. Keep it short; this is a landing surface, not a report.

- **Where you stopped.** The last few commits in plain language, and what the final one landed. The three or four before the gap hold what Loudon was mid-sentence on — the highest-value thing the map returns.
- **In flight.** Claimed and open handoffs, open weave flags, **anyone blocked on a decision**, unannounced batons, live worktrees and branches, uncommitted changes. These bite silently.
- **Stale.** Only what a linter or a query proves: a self-model whose numbers drifted, a To-Do carrying shipped items, an "IN FLIGHT" marker months old, unpushed commits, an open plan phase whose work already landed.
- **One move to re-enter with.** Exactly one, with a reason. **An already-open handoff outranks anything the returning instance invents** — the palace's existing open work is grounded in the record; the fresh idea is the unreliable part. Only propose something new when the queries return nothing open, and say so plainly.

**Step 3 — Show it, then act.** Loudon signs, adjusts, or declines. Nothing is written before that. *"Nothing needs doing, let's just work"* is a first-class outcome — the map has already paid for itself by being read.

**Step 4 — Close the loop.** Whatever the map surfaced is fixed now, queued, or left deliberately with a reason. Commit.

## The one rule about the gap itself: a gap is not a finding

**Do not interpret the absence.** A gap in the commit log is not evidence of drift, fatigue, a design flaw, or waning interest. People have lives. The palace's job on a return is orientation, not accounting, and a returning collaborator should not be met with a theory about why they left.

This rule also exists because it was broken. The same 2026-08-25 assessment read a seven-week gap as evidence that the system's upkeep cost had outgrown its felt payoff — tidy, plausible, and invented. The actual reason was weddings and travel, and the return was already planned and eager. It cost nothing because Loudon corrected it in a sentence; it could as easily have shaped a whole session's recommendations around a problem that did not exist.

Report the gap's **length**, because it bears on what went stale. Never report its **cause**. If the cause matters, Loudon will say so — and then it is information rather than a guess.

## Why this belongs in the always-loaded floor

[[Palace Conatus]] names the palace's drive as *staying in phase with Loudon*, and calls phase lag a disharmony signature — framed as the human running ahead of the substrate. A gap is the other direction: the substrate running ahead, still holding state its human no longer carries.

Both are coupling failures, and coupling is two-sided. The palace had five ceremonies for correcting its own drift and none for meeting its human where he actually is.

## Open Questions

- Should the Return fire automatically on the first session after a gap, or only on Loudon's word? Automatic detection is easy and makes the ceremony reliable; it also risks turning a greeting into a status report nobody asked for.
- The trigger table is now fourteen rows, all in the always-loaded floor. Does it need pruning, and does recognition survive the move? Recorded, not decided.
- Should the return map be written to a file, or spoken and discarded? [[Closing Well]] produces a signed artifact; this may be lighter by design.
- The query block will drift as the palace grows new surfaces. Does it want to become a script — `return-map.mjs` — the way `list-handoffs` did, so the ceremony card stops carrying a command list that can go stale?
