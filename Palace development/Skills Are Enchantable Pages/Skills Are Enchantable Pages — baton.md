---
title: "Skills Are Enchantable Pages — baton"
born: 2026-07-04
links:
  - target: "[[Skills Are Enchantable Pages]]"
    type: connects-to
    label: "baton-for"
forward_vector: "I carry a cold-start move on [[Skills Are Enchantable Pages]] — the dispatch-surface reconciliation — across a boundary, waiting to be caught by a fresh session and deleted once the move is picked up."
---

# Baton: Skills Are Enchantable Pages — the dispatch-surface reconciliation

> **COLD START — this work has not begun.** There is no prior state and no
> tried-and-rejected; those sections are intentionally absent, not lost. The cargo is the
> framing below, captured while it was hot (the session that named the insight). Because it
> is un-started, it is also more likely than a normal baton to drift — read the On-pickup
> "still live?" check as load-bearing, not routine.

## Move
Reconcile the palace's dispatch-surface family — **ceremony · specialist · skill · enchantable page** — into one coherent pattern, and decide whether it earns a formal home in [[SCHEMA]] (a named *dispatch surface*) or stays a described family.

## Why this move matters
[[Skills Are Enchantable Pages]] *named* that these four are one thing — a page with a dispatch surface. But the palace still treats them as separate: SCHEMA has `specialist`/`maker` types and ceremony cards but no notion of "skill," and `.claude/skills/` files still sit outside the graph. The reconciliation is the structural fork the naming opened: **formalize the unification, or leave it as prose.** It wants its own session because it likely touches SCHEMA (a Schema Ceremony: rationale, version bump, mirror propagation) — too heavy to fold into other work, and the kind of thing that should be decided *whether* before *how*.

## The framing (the cargo)
- **The insight:** [[Skills Are Enchantable Pages]] — a skill = a page with a dispatch surface; the harness `.claude/skills` file is one dispatch surface onto a canon page.
- **The running start:** ROSETTA §4c (Palace ↔ Claude Code) — the glossary layer of this reconciliation; extend it as the family clarifies.
- **The worked example to generalize:** [[Concierge]] — canon organ + thin `.claude/skills` shim. It is the pattern; the reconciliation asks whether every skill should be built this way (and whether `palace-orchestrator`, the other `.claude/skills` file, should be retrofitted).
- **The open questions** (from the entry's Forward Vectors): does the family want a formal SCHEMA home (a `dispatch surface` field/notion, or ratifying skill-as-page)? Where exactly does a page acquire a dispatch surface — a `concept` has none, a `specialist` has a Job Contract; is that line worth drawing?
- **Related canon:** [[Pages as Agents]], [[The Shop]] + [[SCHEMA]] §3.2 (the `specialist`/`maker` rationale), the ceremony cards ([[Closing Well Ceremony]]), [[SCHEMA]] §8 (bundles).

## Next move
Read the framing files below. Draft the **family model** — the one pattern, plus the two axes it varies on (trigger substrate: a human word / a table row / a harness `description` / a deliberate enchantment; and executor: a reading Claude / the harness / an orchestrator). Then put the fork to Loudon *before* touching schema: **formalize in SCHEMA vs. leave as a described family.** Decide whether/how before writing anything structural.

## Load these files first
1. `Palace development/Skills Are Enchantable Pages.md` (the insight) + ROSETTA.md §4c
2. `Palace development/Concierge.md` (the worked example: organ + shim)
3. `SCHEMA.md` §3.2 (`specialist`/`maker` rationale) + §8 (bundles)
4. `_ops/Pages as Agents.md`, `The Shop.md`, `_ops/Closing Well Ceremony.md`

## On pickup (fixed — the catcher's checklist; do not rewrite per session)
1. State the move back in one sentence. If you can't, the baton wasn't caught — stop and ask Loudon.
2. Check it is still live before you commit to it. The baton is a snapshot from when it was written; the project may have moved past it. Re-read the parent entry and `git log` it since the baton's `born` date, and confirm the "Current state" the baton quotes still matches the file. If the move is already done, superseded, or no longer wanted, STOP — surface it to Loudon and do not execute. A stale baton followed silently produces drift. (Receive every baton with this skepticism; the auto-staleness heuristic is off by design — the freshness call is yours.)
3. If this baton or its board line is still uncommitted (authored on a surface that couldn't commit — e.g. Cowork), commit them first. That commit is the git archive Step 7 relies on.
4. Mark it caught: remove the "Active Baton" section from the parent entry; for a board-announced baton with no parent entry, post the paired `handoff_picked_up` REPLY (`re:` the `handoff_ready` id) instead. (This baton is both — remove the pointer *and* post the REPLY.)
5. Delete the baton file (git is its archive). On a surface that can't delete (Cowork), remove the marker and note "deletion pending."
6. If the baton names a receiving-surface capability delta or a worktree coordinate, confirm it holds before relying on it (the [[Surfaces and Capabilities]] catalog can be stale) — for a worktree, check `git worktree list` and recreate it if it is gone. A build that was supposed to run here but can't is a finding to report, not a failure to hide.
7. Act on the move, holding the calibrations above. Steward batons are the exception — updated in place, never deleted.
