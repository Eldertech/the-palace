---
title: "Baton Ceremony — baton"
born: 2026-07-04
links:
  - target: "[[Baton Ceremony]]"
    type: connects-to
    label: "baton-for"
forward_vector: "I carry a cold-start move on [[Baton Ceremony]] — naming the cold-start baton variant and testing whether Palace To-Do becomes a board of batons — across a boundary, waiting to be caught and deleted once the move is picked up."
---

# Baton: Baton Ceremony — the cold-start variant + Palace To-Do as a baton board

> **COLD START — this work has not begun.** No prior state, no tried-and-rejected; those
> sections are intentionally absent. The cargo is the framing below, captured while hot.
> This baton is *itself* an instance of the thing it asks you to formalize — a cold-start
> baton — so it is also the first test of the pattern. Read the On-pickup "still live?"
> check as load-bearing: un-started ideas drift.

## Move
Update the [[Baton Ceremony]] spec to recognize the **cold-start (commissioning) baton** variant, then assess whether the [[Palace To-Do]] list should migrate onto the board as cold-start batons — possibly making the board, not the file, the palace's planning surface.

## Why this move matters
This session validated using a baton to **commission un-started work** (two cold-start batons — this one and the reconciliation — now exist). The spec only describes *momentum-transfer* batons, so the variant is undocumented: its empty `Current state` / `Tried and rejected` sections read as *loss* rather than *intent*, and its faster staleness drift isn't flagged. Naming it is the low-risk half. The coupled, higher-stakes half: if cold-start batons work, every actionable [[Palace To-Do]] item could become a board baton with a baton's visibility and detail — and the board could replace the file as the planning surface (the way weave flags already migrated off To-Do onto the board, 2026-06-05). But **not all to-dos are moves**, and flooding the handoff queue has real cost. The assessment decides scope.

## The framing (the cargo)

**The cold-start baton concept** (from this session — see `git log` around 2026-07-04, the Concierge/Palace-Speaks work):
- A baton for un-started work is a *commissioning brief*, not momentum-transfer. Same mechanism, different payload (setup, not residue).
- Three things it must handle: (1) **queue semantics** — it shows *live* in `list-handoffs` until caught; right if you want it advertised as available work, noise if you only meant to record it; (2) the empty `Current state`/`Tried-rejected` sections must be **labeled "cold start,"** never left blank; (3) **staleness drifts faster** (un-started ideas change), so the on-pickup "still live?" check matters more.
- Where it lands in the spec: a new shape under § Where the Baton Lives ("cold-start / commissioning baton"); a Cold-start note in the template (replacing Current-state/Tried-rejected); a line in § The Scope; maybe a § Trigger form ("drop a cold-start baton for [X]").

**The Palace To-Do assessment** — read `_ops/Palace To-Do.md` in full (272 lines, ~10 sections). Sort every item into:
- *actionable single move* → cold-start baton candidate
- *multi-part project* → wants a production-plan or decomposition, not one baton
- *open question* (the "Questions Being Carried" section) → stays carried, not a baton
- *conditional / dormant ghost* (the "Composting Candidates") → a spore, not a baton
- *Claude→Loudon observation* → a different channel

Then the real decision: **should the board replace [[Palace To-Do]] as the planning surface?** Weigh: the weave-flags-already-migrated precedent (2026-06-05); queue-flood cost at scale (dozens of items in `list-handoffs`); whether a backlog wants a *different board* than `GENERAL` (e.g. a `BACKLOG`/`TODO` board) so live handoffs stay distinct from the standing backlog; and whether "disposable, deleted on pickup" fits items that persist until done.

**Constraint:** editing the Baton Ceremony spec is a *ceremony-spec refinement*, not a Schema Ceremony (no ceremony is added/removed). But keep the mirrors consistent if wording changes — ROSETTA's Baton row (§5 ceremony card) and [[Palace Ceremonies]].

**Related:** [[Two Batons, One Board]]; the list-handoffs script (`_ops/stigmergy/list-handoffs.mjs`); the `handoff_ready`/`handoff_picked_up` convention + [[SCHEMA]] §9; the weave-flags-to-board precedent (Palace To-Do § Structural Improvements).

## Next move
Read the Baton Ceremony spec + `Palace To-Do.md` (full) + [[Two Batons, One Board]]. Draft the **cold-start variant into the spec first** (the low-risk, self-contained half). Then run the To-Do triage and bring Loudon the sort **plus** a recommendation on "board as planning surface (and which board)?" — do not migrate anything before he rules on scope.

## Load these files first
1. `_ops/Baton Ceremony.md` (the spec to update) + `_ops/Baton Ceremony — Context.md`
2. `_ops/Palace To-Do.md` (the full list to assess)
3. `Two Batons, One Board.md`; `_ops/stigmergy/list-handoffs.mjs`; `SCHEMA.md` §9

## On pickup (fixed — the catcher's checklist; do not rewrite per session)
1. State the move back in one sentence. If you can't, the baton wasn't caught — stop and ask Loudon.
2. Check it is still live before you commit to it. The baton is a snapshot from when it was written; the project may have moved past it. Re-read the parent entry and `git log` it since the baton's `born` date, and confirm the "Current state" the baton quotes still matches the file. If the move is already done, superseded, or no longer wanted, STOP — surface it to Loudon and do not execute. A stale baton followed silently produces drift. (Receive every baton with this skepticism; the auto-staleness heuristic is off by design — the freshness call is yours.)
3. If this baton or its board line is still uncommitted (authored on a surface that couldn't commit — e.g. Cowork), commit them first. That commit is the git archive Step 7 relies on.
4. Mark it caught: remove the "Active Baton" section from the parent entry; for a board-announced baton with no parent entry, post the paired `handoff_picked_up` REPLY (`re:` the `handoff_ready` id) instead. (This baton is both — remove the pointer *and* post the REPLY.)
5. Delete the baton file (git is its archive). On a surface that can't delete (Cowork), remove the marker and note "deletion pending."
6. If the baton names a receiving-surface capability delta or a worktree coordinate, confirm it holds before relying on it (the [[Surfaces and Capabilities]] catalog can be stale) — for a worktree, check `git worktree list` and recreate it if it is gone. A build that was supposed to run here but can't is a finding to report, not a failure to hide.
7. Act on the move, holding the calibrations above. Steward batons are the exception — updated in place, never deleted.
