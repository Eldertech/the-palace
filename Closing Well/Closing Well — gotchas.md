---
title: "Closing Well — gotchas"
born: 2026-07-03
links:
  - target: "[[Closing Well]]"
    type: connects-to
    label: gotcha-ledger-of
forward_vector: "I am the Closing Well Agent's growing list of traps — one per close — so 'done this many times, knows the gotchas' becomes literal rather than metaphor. Append; never prune what a real close taught."
---

# Closing Well — gotchas

One trap per close, appended. This is what makes the Agent *professional* — a track
record, not a fresh subagent spun up cold. Newest last.

## From the first close — 2026-07-03 (hand-run pilot, the design of Closing Well itself)

1. **The close map needs a `status` column** (`landed / candidate / in-flight / none`). A deposit can land *mid-session*, so the map is not only "pending things" — it is the full ledger of what the session inscribed, including what is already done. Without the column, an already-landed deposit reads as still-owed. *(This is a format revision the pilot forced — the map's most important finding.)*
2. **Check the owner's branch before assuming canon can land.** The primary was thrashed off `main` onto another session's feature branch. Never restore the primary out from under that session — work in your own worktree and flag it. `git -C "<owner>" branch --show-current` before any canon commit.
3. **A worktree forked "off main" can still diverge** if `main` advances mid-session. A `--ff-only` merge then fails; check `merge-base`, `rebase` the feature branch onto `main`, then fast-forward. Don't force a merge commit blindly.
4. **Explicit pathspecs + scoped stash** keep other sessions' uncommitted files out of your commit. This session's owner tree held an uncommitted `blackboard.jsonl` and `.claude/launch.json` that were not mine — `git stash push -u -- <my paths>` and `git add <my paths>` (never `git add -A`) kept them untouched.
5. **The board announcement can't be committed cleanly when another session has the board dirty.** The persistent blackboard is one append-only file; appending your `handoff_ready` line is correct, but committing it would sweep the other session's pending board writes. Append and leave uncommitted — a later batch commit (or the other session) lands the board.
