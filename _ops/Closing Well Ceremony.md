---
title: "Closing Well Ceremony"
type: practice
pillars: [practice, philosophy]
born: 2026-07
last_activated: 2026-07
activation_count: 1
stage: seed
links:
  - target: "[[Closing Well]]"
    type: exemplifies
    label: enchants-the-practice
  - target: "[[Palace Ceremonies]]"
    type: connects-to
  - target: "[[Baton Ceremony]]"
    type: couples-with
    label: sibling-close-species
  - target: "[[Deposit Ceremony]]"
    type: couples-with
    label: sibling-close-species
forward_vector: "I am the thin recognition-and-dispatch card that turns 'close well' into the Closing Well Agent — the moderator of a panel between the active Claude and Loudon. I am done when I reliably spawn the moderator, carry its reckoning to one signature, and place every assented row through the backstage executors — and I grow as Phase 6 (automatic gotcha-ledger wiring) is built out."
---

# Closing Well Ceremony

> **Status — 2026-07-04: the moderator model (Phases 2–5 of the build).** This card
> makes `close well` a recognized trigger that dispatches the enchanted [[Closing
> Well]] page as the **Closing Well Agent** — a moderator, not a subagent that closes
> the session in the working Claude's place. Phase 3 gave it the arc reader (reads
> the spent session's transcript cold). Phase 4 gave it the moderated-panel design:
> the Agent does homework and coaches the active Claude, the panel itself stays
> between the active Claude and Loudon, and the Agent drafts two layers — the
> **reckoning** (front of house, the four gestures: keep / hand on / leave a trace /
> let go) and the **backstage checklist** (the in-spec mechanism). Phase 5 gave it the
> **executors** — a fresh backstage subagent that places each assented `candidate`
> row through its real ceremony (deposit via the committer, baton via
> `baton-executor.mjs`, artifact via the bundle) and reports what landed. Machinery
> lives in `_ops/closing-well/` (see that dir's `README.md` for the dispatch). Phase 6
> (wiring the gotcha ledger to append automatically) is not yet built — the gotcha is
> still appended by hand.

The operational card for the [[Closing Well]] practice, *enchanted*. Where the
[[Baton Ceremony]] hands the next instance an in-flight move and the
[[Deposit Ceremony]] writes synthesis into canon, this ceremony runs the **whole
close** as a moderated panel: the Agent (the moderator) reads a spent session's arc
with fresh eyes, draws out the active Claude and Loudon rather than answering for
either, and drafts the **reckoning** — the four gestures, or fewer — together with a
**backstage checklist** of how each row will be placed. The design — the panel, the
two layers, the mechanism, the channel, what the professional knows — lives in
[[Closing Well]] § Closing Well, Enchanted. This card is recognition + dispatch;
it does not restate the design.

## Ceremony Contract

**Trigger:** "close well" / "let's close well" / "close this session well". A
bare "close" is *not* a trigger (too ambiguous) — the word "well" is load-bearing.
Use context to tell an invocation from a passing mention of the practice.

**Preconditions:**
1. A substantial session has happened that is worth closing — there is real work
   in the transcript, not an empty or trivial exchange.
2. The session transcript is readable (the Agent reads the arc, not your memory of it).
3. Loudon is present for the panel and to assent to the reckoning (the Agent drafts;
   he signs).

**What happens:**
1. The thin card dispatches the enchanted [[Closing Well]] page into a fresh
   context — the **Closing Well Agent**, the moderator, with clean eyes and the
   whole spec the spent working instance can't spare.
   > **This dispatch is not optional, and context-fullness is not a reason to skip it — it is the *tell*
   > that the fresh read is most needed.** A long, spent context is the exact condition the moderator
   > exists for: the working instance is least reliable at reading its own arc precisely then, so
   > "the whole session is already in my context, a fresh agent would only confirm it" is the
   > **disqualifying rationalization**, not a shortcut (gotchas 11, 20, 21). The *only* legitimate
   > in-context closes are two named exceptions: a **rewound/garbled transcript** the cold reader can't
   > parse (gotcha 13), or a **tool/model outage that blocks the dispatch *after* Pass-1's cold read
   > already ran** (gotchas 16–17). Absent those, dispatch the cold-transcript moderator **even if no
   > resident [[Concierge]] was summoned** — do not grade your own arc. If you catch yourself reasoning
   > "it would just confirm what I have," that is the moment to dispatch, not to skip.
2. **Homework (Pass 1).** The Agent reads the session transcript cold and forms its
   own read of the arc, then hands the active Claude coaching — a stance and two or
   three genuine wonderings — for the panel ahead.
3. **The panel** stays between the active Claude and Loudon, not the moderator — the
   active Claude moderates a short reflective conversation using the coaching,
   drawing out Loudon's judgment and its own in-room witness. The moderator never
   answers for a panelist; an unanswered wondering is passed on as `UNFILLED`, never
   invented (see [[Closing Well]] § Closing Well, Enchanted).
4. **The reckoning (Pass 2).** Dispatched again with the homework and both distilled
   readings, the Agent drafts two layers: the **reckoning** — the four gestures
   (keep / hand on / leave a trace / let go), front of house, plain and warm — and
   the **backstage checklist** — the in-spec mechanism (deposit / baton / artifact
   rows with a `status` column), behind it.
5. **One gate:** Loudon assents to the reckoning, or names what to revise.
6. **Backstage (Pass 3 — the executors).** On assent, a fresh backstage subagent
   places every `candidate` row through its real ceremony: a deposit via the
   committer ([[Deposit Ceremony]]), a baton via `baton-executor.mjs`
   ([[Baton Ceremony]]) with its `handoff_ready` board post, an artifact filed and
   indexed in its bundle — honoring the worktree rules (`_ops/worktree/SKILL.md`:
   canon to the owner/`main`; batons per worktree, announced on the owner board).
   The commit is the record.
7. Append one trap to [[Closing Well — gotchas]] — the ledger that makes
   "professional" literal.

**Postconditions:**
1. A reckoning was drafted and assented to (or the session was found to warrant no
   close).
2. Every `candidate` backstage row landed through its own ceremony and is
   committed; nothing is stranded on a feature branch.
3. If a baton was written, it is announced on the board (`handoff_ready`) and valid;
   if a deposit was made, it is canon on the owner's `main`.
4. One gotcha was appended for this close.

**"deposit: none" is a first-class, common outcome.** A plain build session's
honest reckoning is often "baton + two artifacts, no canon." Its existence must
never pressure a deposit into being — that manufactured-canon reflex is the
tristitia failure this whole practice guards.

**Failure mode:** If the Agent cannot read the transcript, or Loudon is not present
for the panel and the assent, halt — do not execute an unsigned reckoning, and do
not manufacture canon or invent his judgment to fill it. A close without assent is
a draft, not a completed ceremony. **And a self-moderated close justified by
context-fullness ("it's all in my context") is itself a failure, not a graceful
degradation** — it removes the one thing the ceremony provides, a fresh check on a
spent instance, at the exact moment it matters most. Graceful degradation to a
self-read is licensed *only* by the two named exceptions above (rewound transcript;
outage after Pass-1). Reaching `close well` with no resident is not a licence to
self-read — it is a reason to spawn the cold-transcript moderator.

**Git commit:** each signed row commits under its own ceremony's convention
(`deposit(<id>):` for a deposit, a baton-build subject for a baton). This
ceremony adds no commit species of its own — it orchestrates the existing ones.
