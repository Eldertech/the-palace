---
title: "Closing Well — baton"
born: 2026-07-03
links:
  - target: "[[Closing Well]]"
    type: connects-to
    label: baton-for
forward_vector: "I carry the in-progress build of the Closing Well Agent across a boundary, waiting to be caught by the next Claude and deleted once the move is picked up."
session_thread: "2026-07-03 baton⇄steward → Closing Well Agent design + Phase-1 pilot"
---

# Baton: Closing Well Agent build

## Move
Build the Closing Well Agent per its production plan. Phase 0 (plan) and Phase 1 (hand-run pilot) are done; **Phase 2 — the thin `close well` ceremony card + CLAUDE.md trigger row — is next.**

## Why this move matters
The *design* is now canon on `main`, but the Agent runs nothing yet. The entry is honestly marked "design, not yet built." The production plan is the contract; it deliberately shows that most of the Agent is *wiring* existing machinery (Baton Ceremony, Deposit, the orchestrator skill, the board validator), not invention — so the risk is scope creep, not difficulty.

## Tried and rejected (negative space — don't re-litigate)
- **Channel fallbacks (fresh-session, board-async interview) are deliberately deferred** by Loudon's call. Default only: interview stays between Loudon and the working Claude; the Agent authors. Cross that bridge only if the default proves insufficient.
- **Folding deposit *into* the baton** — rejected. They are sibling species of one close (memory vs message), not parent/child; the close map keeps them typed. Don't collapse them.
- **A subagent holding a live interview with Loudon** — rejected; the user never speaks to a subagent. The interview lives with the working Claude; the Agent gets distilled answers only.

## Current state
- Canon landed on `main` (`e122c41`, `8a058ac`): Closing Well enchanted form + Context + production plan; Two Batons "one atom" section; two evidence diagrams; the gotcha ledger seeded.
- The pilot forced one format revision, already in the ledger: **the close map needs a `status` column** (`landed / candidate / in-flight / none`) because a deposit can land mid-session.
- This branch (`feature/closing-well-agent`) holds the plan + this baton; it is **behind `main`** now (main advanced with the pilot deposit) — rebase onto `main` before continuing.

## Next move
Phase 2: write the thin `close well` ceremony card in `_ops/` (recognition + dispatch only), and add the trigger row to CLAUDE.md's ceremony table. Verify gate: "close well" reliably dispatches; a passing mention does not.

## Receiving environment
Claude Code, Mac. **Worktree coordinate:** branch `feature/closing-well-agent`, dir `../palace-feature-closing-well-agent`, profile `docs`. Recreate if gone: `node _ops/worktree/new-worktree.mjs --name feature/closing-well-agent --profile docs`. **Canon rule:** deposits/entry edits commit to the owner (`main`) via `git -C "<owner>" …`, never this branch (per `_ops/worktree/SKILL.md`). Build machinery (ceremony card, code) lives here on the branch.

## Calibrations from this session
- "deposit: none" must stay a first-class, common outcome — never manufacture canon (the tristitia failure). The triangulation + the gate are the guards.
- The Agent drafts; Loudon signs. Every close ends at one gate.
- Honest status markers are non-negotiable — mark what is "becoming" vs built.

## Load these files first
1. `Closing Well/Closing Well — production plan.md` — the build contract (start at Phase 2).
2. `Closing Well.md` § Closing Well, Enchanted — the design.
3. `Closing Well/Closing Well — gotchas.md` — traps, incl. the close-map status-column fix.

## On pickup (fixed — the catcher's checklist; do not rewrite per session)
1. State the move back in one sentence. If you can't, the baton wasn't caught — stop and ask Loudon.
2. If this baton or its board line is still uncommitted, commit them first (git is the archive Step 6 relies on).
3. Mark it caught: post the paired `handoff_picked_up` REPLY (`re:` the `handoff_ready` id) on the owner's board; remove any "Active Baton" pointer.
4. Delete the baton file (git is its archive).
5. If the baton names a worktree coordinate, confirm it holds (`git worktree list`) and recreate it if gone before relying on it. A build that can't run here is a finding to report, not a failure to hide.
6. Act on the move, holding the calibrations above.
