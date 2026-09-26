---
title: "STIGMERGY v2.0 — Consolidation & Primary Interface — baton"
born: 2026-09-22
links:
  - target: "[[STIGMERGY v2.0 — Consolidation & Primary Interface]]"
    type: connects-to
    label: "baton-for"
forward_vector: "I carry the in-progress move on [[STIGMERGY v2.0 — Consolidation & Primary Interface]] across a boundary, waiting to be caught by the next Claude and deleted once the move is picked up."
---

**Move.** Give the palace ONE constant or resolver for "the latest Opus," imported everywhere a script currently hard-codes an Opus id or alias, so a new Opus release stops requiring a manual sweep. Loudon's wish, verbatim: "Ideally, I'd like every time opus is chosen for it to automatically use the latest opus, but that seems like perhaps a more difficult change."

**Why it matters.** The 2026-09-22 close landed a 33-file mechanical sweep to Opus 5.5 (`9d443aba`) — the same sweep will be needed again at the next Opus release unless the ten call sites read from one place instead of carrying their own pin.

**Call sites to import it (ten, named in the Sept-6 harvest review):** `launch.js`, `weave-generate.js`, `steward-lane.js`, `process-cycle.js`, `enchant.js`, `companion-lane.js` (still the `opus` alias), `run-steward-batch.sh`, `handoff-model.mjs`, `baton-executor.mjs`, and the pickup/close-handoff help text.

**Tried & rejected this session.** Nothing — this is a cold-start commission, not a resumed move. No build was attempted.

**Current state.** Cold start: no resolver module exists yet, no call site has been touched. Build size is the working Claude's estimate (modest) — that estimate was not stress-tested against the actual ten sites.

**Next move.** Design the resolver (a small constants module, or a script that reads Anthropic's model list and picks the newest `claude-opus-*`) and swap the ten call sites to import it, one at a time, verifying each still dispatches correctly.

**Negative space — don't do these:** Don't write a "remember to bump" Gotcha — the whole point is that nothing manual should be left to remember. The steward manifests (`run-steward-batch.sh` and siblings) may keep explicit pins or read from the resolver — the catcher decides, don't assume one way. Doc examples with stale model IDs (`SCHEMA — Reference.md:266`, `_ops/Baton Ceremony.md:263`, `Claude CLI Reference.md`) may ride along at the catcher's discretion — not required scope.

**Calibrations from this session.** None beyond the above — this baton is a straight commission, not a residue of live work.

**Load these files first:** `_ops/stigmergy/app/server/launch.js`, `_ops/stigmergy/app/server/weave-generate.js`, `_ops/stigmergy/app/server/steward-lane.js`, `_ops/stigmergy/app/server/process-cycle.js`, `_ops/stigmergy/app/server/enchant.js`, `_ops/stigmergy/app/server/companion-lane.js`, `_ops/heartbeat/run-steward-batch.sh`, `_ops/stigmergy/handoff-model.mjs`, `_ops/closing-well/baton-executor.mjs`.

## On pickup (fixed — the catcher's checklist; do not rewrite per session)
*Identical in every baton. It rides along because the catching Claude loads the
baton and the entry, not this ceremony — so the catcher's obligations live where
the catcher will see them. Omit nothing here.*
A pickup has two beats: **claim** it when you catch it, **close** it when the move lands. The card stays visible in between — a claim that ages with no close is how a dropped baton (a "fumble") surfaces instead of vanishing. (A parent-entry baton that was never announced on the board has no card; skip the board posts — just remove the pointer and delete the file at close, step 8.)

**Catch it — claim:**
1. State the move back in one sentence. If you can't, the baton wasn't caught — stop and ask Loudon.
2. Check it may already be done before you commit to it. The baton is a snapshot from when it was written; the project may have moved past it. Re-read the parent entry and `git log` it since the baton's `born` date, and confirm the "Current state" the baton quotes still matches the file. For a board-announced baton, `node _ops/stigmergy/pickup-handoff.mjs <id>` prints exactly this reconciliation view — every commit that touched the entry since the baton posted — and then claims the card, so run it and read the list *before* you continue. If the move is already done, superseded, or no longer wanted, STOP — do not claim it; surface to Loudon, and if it plainly landed already, close it as a reconciler (step 7). A stale baton followed silently produces drift. (The auto-staleness heuristic is off by design — the freshness call is yours.)
3. If this baton or its board line is still uncommitted (authored on a surface that couldn't commit — e.g. Cowork), commit them first. That commit is the git archive step 8 relies on.
4. Claim it. For a board-announced baton (it shows in `list-handoffs`), the `pickup-handoff.mjs` from step 2 has already posted the claim (`handoff_picked_up`, `lifecycle: claim`) — the card moves to **CLAIMED (in flight)**; it does *not* leave the board. Leave the "Active Baton" pointer and the baton file in place for now — they come out at close, so a fumble mid-move never erases the work.
5. If the baton names a receiving-surface capability delta or a worktree coordinate, confirm it holds before relying on it (the [[Surfaces and Capabilities]] catalog can be stale) — for a worktree, check `git worktree list` and recreate it (`node _ops/worktree/new-worktree.mjs --name <branch> --profile <p>`) if it is gone. A build that was supposed to run here but can't is a finding to report, not a failure to hide.
6. Act on the move, holding the calibrations above.

**Close it — when the move lands:**
7. Post the close. `node _ops/stigmergy/close-handoff.mjs <id | entry> --commit <hash>` retires the card — an explicit close is the *only* thing that clears it (done is never inferred). Cite the commit that landed the move: it makes the close a checkable claim, not a self-report. **Complete, or re-baton the rest:** if you finished the whole move, close plain; if you did only part, `--partial --remainder "<what's left>"` posts the leftover as a fresh `handoff_ready` so it reappears as open work. Never let "in the spirit of the original" quietly drop scope — a gap becomes a new baton, not silence.
8. Delete the baton file (git is its archive) and remove the "Active Baton" section from the parent entry. On a surface that can't delete (Cowork), remove the pointer and note "deletion pending." Steward batons are the exception — updated in place, never deleted or closed.
