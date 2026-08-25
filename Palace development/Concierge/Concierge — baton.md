---
title: "Concierge — baton"
born: 2026-08-25
links:
  - target: "[[Concierge]]"
    type: connects-to
    label: baton-for
forward_vector: "I carry the two threads left over from the Concierge build across a boundary — the live validation runs and the work-choice vector — waiting to be caught by the next Claude and deleted once the move is picked up."
---

# Concierge — baton

> **Re-batoned 2026-08-25** from the partial close of `concierge-build-handoff-2026-07-04`
> (board id `concierge-remainder-20260825T224537Z`). Two of the original three moves landed;
> what follows is the rest. The original baton is in git at `bb8e6b4`.

## Already landed — do not redo

- **The health dial** — `_ops/concierge/dial.mjs`, built 2026-07-08 (`5113b84`, refined `ce6af17`).
  One objective capacity read serving two systems: the companion's compact-or-respawn decision and
  the [[Closing Well]] close-intensity dial. This was the original baton's headline move.
- **The WEAVE-flagged fold into [[Closing Well]]** — landed 2026-08-25 (`bc3731e`). The entry had
  said the moderator was "a fresh instance enchanted with this page"; it now says what was settled
  on 2026-07-04 — the moderator is the *resident companion taking the wheel*, which matters because
  it must drive across resumed turns. Carries the summon-early rule (gotcha 20) and the relay
  discipline (gotcha 12) with it.

## Move

Two threads, either order.

**1. Live validation runs.** The V3 "companion takes the wheel" close model has **exactly one** real
end-to-end data point (2026-07-04). It is built and canary-tested, not trusted. It needs many more
real runs before it is. Treat each real close as tuning data for the charter, and watch specifically
whether *holds control and advocates* stays right or drifts — back toward interrogation on one side,
or over-softening into the working Claude on the other. Both errors have happened once already.

**2. The work-choice vector.** Build into the companion's ops-expert repertoire the ability to survey
the board and open work and **recommend one**, so the main window never has to load every open baton
to choose among them. Loading them all biases the choice toward whichever reads most urgent, and
burns the window you came back to work in.

## Why thread 2 matters more than it did

It is now load-bearing for a ceremony. The [[Return Ceremony]] (v1.16, 2026-08-25) names summoning
this companion as its **first act**, precisely so a returning session does not do the work-choice by
hand. The 2026-08-25 return did it by hand and it cost three exchanges of inventing things the palace
already had — the failure is written into that ceremony's card as its founding evidence. So this
thread is the machinery the Return Ceremony assumes exists.

It also closes a second loop: summoning the companion at the return means a warm, resumable resident
exists by the time the session reaches `close well`, which is the ledger's gotcha 20 — *summon early
or the moderator will not exist at the close*. Return and Closing Well become bookends on one organ.

## Negative space

- **Do NOT touch BLUELINE or Palace Orchestrator.** Both are separate live batons on the board,
  another Claude's task. Loudon's explicit call 2026-07-04: they wait.
- **Do not re-open settled ground.** Disposable-faces vs. resident companion was decided (resident);
  the close-posture is *moderator who holds control and advocates*, not verifier-who-interrogates.
  Both are settled in [[Concierge]], not open questions.
- Do not manufacture new canon around the Concierge. The model is deposited; what remains is
  *running it for real* and *building the work-choice vector*, not re-theorizing it.

## On pickup (fixed — the catcher's checklist; do not rewrite per session)
*Identical in every baton. It rides along because the catching Claude loads the
baton and the entry, not this ceremony — so the catcher's obligations live where
the catcher will see them. Omit nothing here.*
1. State the move back in one sentence. If you can't, the baton wasn't caught — stop and ask Loudon.
2. Check it is still live before you commit to it. The baton is a snapshot from when it was written; the project may have moved past it. Re-read the parent entry and `git log` it since the baton's `born` date, and confirm the "Current state" the baton quotes still matches the file. If the move is already done, superseded, or no longer wanted, STOP — surface it to Loudon and do not execute. A stale baton followed silently produces drift. (Receive every baton with this skepticism; the auto-staleness heuristic is off by design — the freshness call is yours.)
3. If this baton or its board line is still uncommitted (authored on a surface that couldn't commit — e.g. Cowork), commit them first. That commit is the git archive Step 7 relies on.
4. Mark it caught: remove the "Active Baton" section from the parent entry; for a board-announced baton with no parent entry, post the paired `handoff_picked_up` REPLY (`re:` the `handoff_ready` id) instead.
5. Delete the baton file (git is its archive). On a surface that can't delete (Cowork), remove the marker and note "deletion pending."
6. If the baton names a receiving-surface capability delta or a worktree coordinate, confirm it holds before relying on it (the [[Surfaces and Capabilities]] catalog can be stale) — for a worktree, check `git worktree list` and recreate it (`node _ops/worktree/new-worktree.mjs --name <branch> --profile <p>`) if it is gone. A build that was supposed to run here but can't is a finding to report, not a failure to hide.
7. Act on the move, holding the calibrations above. Steward batons are the exception — updated in place, never deleted.
