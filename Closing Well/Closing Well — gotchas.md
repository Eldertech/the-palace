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

## From the second close — 2026-07-03 (the first real `close well`, closing the session that built Phase 2)

6. **A close's real work is the drift the exciting work left behind, not new canon.** This session's flashy output — a Schema Ceremony, three merges — all landed *mid-flight*, so the close map's only owed rows were the two unglamorous ones: a stale status banner and a session-log append. The pull to "produce a deposit" at close is the tristitia reflex the practice guards against; here the honest map was *deposit: none pending beyond cleanup*. **A close that goes looking for a deposit to make has misunderstood itself.** The status column earns its keep exactly here — it lets `landed` rows show the session was productive without any of them being *owed*.

## From the Phase-4 validation test — 2026-07-04 (sandbox closes on non-self-referential sessions, not a live close)

7. **A baton pass will silently ground "Current state" in the live repo, not just the arc.** The blind baton draft (cold on the arc of `f7017000`) quietly ran `git log` and read files, so its Current-state carried exact commit SHAs and caught real doc-drift — *more* accurate than the human baton written in-session. Good for accuracy (a baton's Current-state *should* reflect reality), but two edges: it can report state the original session couldn't have known (later commits), and — shown drift in the repo — it will **expand a tight one-move baton into a two-move "…and reconcile the drift" Move**. The fix is scoping, not suppression: let the pass ground *Current state* in the repo, but hold the *Move* to a single move (the Baton Ceremony's discipline the human instinctively kept).
8. **Commit SHAs and file-path density leak into the front-of-house reckoning.** The reckoning is supposed to be plain and warm — "a graceful close, not a scripted liturgy." Under a heavy build day the draft drifts toward inventory (hashes, file lists) in the *front* layer, which reads like the project-management tone the register explicitly rejects. Those specifics belong in the **backstage checklist**; keep the reckoning prose.
9. **The species set (deposit/baton/artifact) doesn't cleanly hold weave-flags or verification-checks.** Closing a fully-landed day, the backstage draft improvised `flag`, `check`, and `practice` rows because a close genuinely produces those (a `FLAG` to the WEAVE board, a "confirm the worktree is torn down" check) and the four gestures have no home for them — they got folded awkwardly into *let-go* and the open wonderings. Open design question for a later pass: admit `flag`/`check` as first-class backstage species, or name where they live. Recorded, not resolved.

## From the first live close — 2026-07-04

10. **For a live `close well`, resolve with bare `--resolve`, not `--session <id>`.** Bare `--resolve` correctly returns the *currently-running* session's transcript — verified in the first live close — and the documented dispatch uses it, so the standard flow works. The explicit `--session <id>` form, by contrast, *fails* on the running session (the guard against grabbing a running subagent's transcript also filters the live main session), returning "could not resolve"; `--file <path>` is only a fallback if you deviate to `--session`. *(Recorded backwards at first — the corrected lesson: the documented path is fine; don't reach for `--session` on a live close.)*
