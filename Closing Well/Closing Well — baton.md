---
title: "Closing Well — baton"
born: 2026-07-04
links:
  - target: "[[Closing Well]]"
    type: connects-to
    label: "baton-for"
forward_vector: "I carry the in-progress move on [[Closing Well]] across a boundary, waiting to be caught by the next Claude and deleted once the move is picked up."
---

# Baton: Closing Well

## Move
Fully test and tune the enchanted Closing Well process against varied real sessions — find where it breaks, tune it, and build what's still missing (Phase 5 executors, the thin dispatch wiring).

## Why this move matters
The wiring is proven end-to-end (homework → coaching → real interview → reckoning → thin-waist dispatch), but almost every test so far has been self-referential — the closer closing its own construction. The register was tuned on one session. It hasn't met a plain build day, a multi-deposit day, or a real "nothing here is canon" day — that's where the tweaks will surface.

## Tried and rejected this session
- Status-table / multiple-choice-form tone — read as project management. Rejected.
- Compline / ornate register — too adorned; the Deposit Ceremony's plain-and-specific is the calibration.
- `--max-turns` as a default — drops commits; full arc is default, bounded only for genuinely huge sessions.
- Pasting the template into the dispatch — use the thin waist instead: the subagent reads its own template, only pointer + result touch main.
- The Agent answering for a panelist — never; draw out, don't substitute.
- `--spine` as a token compressor — it's a legibility flag (~14%), not a way to shrink monster sessions.

## Current state
- Phase 3 merged to `main` (transcript reader + its prompt).
- Phase 4 machinery lives on `feature/closing-well-phase4` (`bd8fecc`, `372a3ec`): close-map-format.md, the two re-cast moderator prompts, README, the `UNFILLED`/`provisional` honesty guard, `--spine`, `--session` prefix-match.
- The moderator design (`DESIGN — the moderator model (draft).md`) is on the branch, and deposited into `Closing Well` § Closing Well, Enchanted on `main` as part of this close.
- Confabulation fix verified in Run 4: `UNFILLED` → provisional map + Questions-for-Loudon.

## Next move
Rebase a worktree on `feature/closing-well-phase4` onto `main` (to pick up the deposited design), then run real closes on varied past sessions — start with a "deposit: none" contrast (`e3c91c9b`, the RunPod session) and a multi-deposit day — watching for where the register or the map breaks. Then build Phase 5 (wire the reckoning's backstage checklist to the real ceremonies) and the thin dispatch wiring, so the ceremony card dispatches without pasting templates.

## Receiving environment
Cross-worktree. Branch `feature/closing-well-phase4`, dir `../palace-feature-closing-well-phase4`, profile `docs`. Recreate if torn down: `node _ops/worktree/new-worktree.mjs --name feature/closing-well-phase4 --profile docs`. Rebase onto `main` before testing — main now carries Phase 3 plus the deposited design.

## Calibrations from this session
- Register = Deposit-Ceremony plain and specific: "a graceful close, not a scripted liturgy." Not a status table, not purple.
- The moderator never answers for a panelist, even a tired one — draw out, never substitute.
- Work through the real Deposit/Baton ceremonies; never degrade their quality.
- The moderator does all mechanism backstage (deposit-in-spec, baton, board, filing, validation); the active Claude and Loudon stay front-of-house.
- Cost is a non-constraint here; judge on quality.

## Load these files first
1. `Closing Well.md` § Closing Well, Enchanted — the moderator design
2. `_ops/closing-well/DESIGN — the moderator model (draft).md`
3. `_ops/closing-well/prompts/closing-well-agent.md` + `closing-well-agent-map.md`
4. `_ops/closing-well/README.md` · `close-map-format.md` · `transcript-reader.mjs`
5. `Closing Well/Closing Well — Context.md` · `Closing Well — production plan.md` · `Closing Well — gotchas.md`

## On pickup (fixed — the catcher's checklist; do not rewrite per session)
1. State the move back in one sentence. If you can't, the baton wasn't caught — stop and ask Loudon.
2. Check it is still live before you commit to it. The baton is a snapshot from when it was written; the project may have moved past it. Re-read the parent entry and `git log` it since the baton's `born` date, and confirm the "Current state" the baton quotes still matches the file. If the move is already done, superseded, or no longer wanted, STOP — surface it to Loudon and do not execute. A stale baton followed silently produces drift. (Receive every baton with this skepticism; the auto-staleness heuristic is off by design — the freshness call is yours.)
3. If this baton or its board line is still uncommitted (authored on a surface that couldn't commit — e.g. Cowork), commit them first. That commit is the git archive Step 7 relies on.
4. Mark it caught: remove the "Active Baton" section from the parent entry; for a board-announced baton with no parent entry, post the paired `handoff_picked_up` REPLY (`re:` the `handoff_ready` id) instead.
5. Delete the baton file (git is its archive). On a surface that can't delete (Cowork), remove the marker and note "deletion pending."
6. If the baton names a receiving-surface capability delta or a worktree coordinate, confirm it holds before relying on it (the [[Surfaces and Capabilities]] catalog can be stale) — for a worktree, check `git worktree list` and recreate it (`node _ops/worktree/new-worktree.mjs --name <branch> --profile <p>`) if it is gone. A build that was supposed to run here but can't is a finding to report, not a failure to hide.
7. Act on the move, holding the calibrations above. Steward batons are the exception — updated in place, never deleted.
