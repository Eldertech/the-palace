---
title: "Enrichment — baton"
born: 2026-09-25
links:
  - target: "[[Enrichment]]"
    type: connects-to
    label: "baton-for"
forward_vector: "I carry the in-progress move on [[Enrichment]] across a boundary, waiting to be caught by the next Claude and deleted once the move is picked up."
---

## Move

Make rich-face review notes into work — both shapes Loudon named: **(a)** notes surface in
STIGMERGY as work items on the QUEUE, **(b)** a floating companion (the entry-agent window) on
the page itself, for fast corrections without leaving it.

## Why

Loudon's framing, from Closing Well 2026-09-25: enrichment is ongoing, and as enrichment flags
accumulate he becomes aware of them on entry to the palace and dispatches agents to work them
and help him review. Today that loop is open at both ends.

## Current state

`_ops/rich-face/rich-handler.mjs` posts a `human_eval` message from `TRICKSTER` to the `FLAGS`
board when the review dock is used — but nothing consumes it. `queue-model.js` only switches on
`weave_flag` (`_ops/stigmergy/app/src/lib/queue-model.js:171`) and `stigmergy_todo` (`:221`); no
`human_eval` case exists, so a posted note never becomes a QUEUE item. Checked against the live
board: `grep -c human_eval _ops/swarm/persistent/blackboard.jsonl` returns 0 — no rich-face note
has ever reached it (nothing posted yet, or the review dock hasn't been used in earnest).

Separately: no step in [[Enrichment]] reads a page's prior notes before making anything, even
though `Review Layer.md:77` says they're "there for the page's next round to read." Wiring (a)
without (b) leaves the notes surfaced but still unread by the ceremony that should act on them.

## Tried & rejected

Nothing yet — this is a fresh finding from Closing Well's review, not a prior attempt.

## Next move

1. Add a `human_eval` case to `queue-model.js`, beside `weave_flag`/`stigmergy_todo`
   (`:171`/`:221`), so a rich-face note becomes a QUEUE item — closed the same way a `weave_flag`
   closes (an entry touch, or a RESOURCE_GRANT/DENY).
2. Build the floating companion — the entry-agent window — for fast, in-place corrections on the
   rich face. Check the STIGMERGY v2.0 baton first (see Calibrations) before adding a second
   companion surface.
3. Add a step (or a clause in step 1, "gather first") to [[Enrichment]] that reads a page's prior
   `human_eval` notes before making anything — closing the gap `Review Layer.md` names but the
   ceremony never honors.

## Calibrations

- **No edits to `_ops/stigmergy/app/server/*` while a steward run is live** — a live run can break
  silently under an edited handler; check for one before touching that folder.
- **`companion-lane.js` is also on the STIGMERGY v2.0 baton's list**
  (`Palace development/STIGMERGY v2.0 — Consolidation & Primary Interface/STIGMERGY v2.0 —
  Consolidation & Primary Interface — baton.md`) — read it first so the two moves don't collide.

## Load these files first

- `_ops/rich-face/rich-handler.mjs`
- `_ops/stigmergy/app/src/lib/queue-model.js` (around :150–:230)
- `Review Layer.md`
- `Enrichment.md`
- `_ops/stigmergy/app/server/companion-lane.js`
- `Palace development/STIGMERGY v2.0 — Consolidation & Primary Interface/STIGMERGY v2.0 —
  Consolidation & Primary Interface — baton.md`

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
