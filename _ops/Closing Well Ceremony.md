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
forward_vector: "I am the thin recognition-and-dispatch card that turns 'close well' into the Closing Well Agent. I am done when I reliably spawn the enchanted page at session end and hand its close map back for one signature — and I grow as the Agent's mechanism (transcript reader, close map, executors) is built out through its production plan."
---

# Closing Well Ceremony

> **Status — 2026-07-03: recognition scaffold (Phase 2 of the build).** This card
> makes `close well` a recognized trigger that dispatches the enchanted
> [[Closing Well]] page. The Agent's full mechanism — transcript reader, the
> close-map format, the interview loop, the executors — is being built through
> [[Closing Well — production plan|the production plan]] (Phases 3–6) and is **not
> yet complete**. Until then, the dispatched Agent does as much of the close by
> hand as it can and names what it cannot yet automate. Honest markers are the point.

The operational card for the [[Closing Well]] practice, *enchanted*. Where the
[[Baton Ceremony]] hands the next instance an in-flight move and the
[[Deposit Ceremony]] writes synthesis into canon, this ceremony runs the **whole
close**: it reads a spent session's arc with fresh eyes and produces one **close
map** — the typed list of everything the session should inscribe (deposit ·
baton · artifacts, or fewer). The design — the close map, the three species, the
mechanism, the channel, what the professional knows — lives in
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
3. Loudon is present to sign the close map (the Agent drafts; you sign).

**What happens:**
1. The thin card dispatches the enchanted [[Closing Well]] page into a fresh
   context — the **Closing Well Agent**, a professional closer with clean eyes and
   the whole spec the spent working instance can't spare.
2. The Agent reads the session transcript and analyzes its arc.
3. It hands the main loop **one framing prompt** for Loudon and the working
   Claude: *what mattered most — what, if anything, is canon — what's the next move?*
   The interview stays between Loudon and the working Claude; the Agent authors
   from the distilled answers (see [[Closing Well]] § The channel).
4. It triangulates three independent readings — its fresh arc-analysis, the
   working Claude's in-room view, Loudon's judgment — and drafts the **close map**.
5. **One gate:** Loudon signs the map.
6. On signature, execute each row through its existing ceremony: deposit edits
   ([[Deposit Ceremony]]), the baton file ([[Baton Ceremony]]), artifacts + index,
   the `handoff_ready` board post — honoring the worktree rules
   (`_ops/worktree/SKILL.md`: canon to the owner/`main`; batons per worktree).
   The commit is the record.
7. Append one trap to [[Closing Well — gotchas]] — the ledger that makes
   "professional" literal.

**Postconditions:**
1. A close map was drafted and signed (or the session was found to warrant no close).
2. Every signed row landed through its own ceremony and is committed; nothing is
   stranded on a feature branch.
3. If a baton was written, it is announced on the board (`handoff_ready`) and valid;
   if a deposit was made, it is canon on the owner.
4. One gotcha was appended for this close.

**"deposit: none" is a first-class, common outcome.** A plain build session's
honest map is often "baton + two artifacts, no canon." The map's existence must
never pressure a deposit into being — that manufactured-canon reflex is the
tristitia failure this whole practice guards.

**Failure mode:** If the Agent cannot read the transcript, or Loudon is not present
to sign, halt — do not execute an unsigned map, and do not manufacture canon to
fill the map. A close without a signature is a draft, not a completed ceremony.

**Git commit:** each signed row commits under its own ceremony's convention
(`deposit(<id>):` for a deposit, a baton-build subject for a baton). This
ceremony adds no commit species of its own — it orchestrates the existing ones.
