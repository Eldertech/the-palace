---
title: "Language as a Tonal Medium — baton"
born: 2026-09-25
links:
  - target: "[[Language as a Tonal Medium]]"
    type: connects-to
    label: "baton-for"
forward_vector: "I carry the in-progress move on [[Language as a Tonal Medium]] across a boundary, waiting to be caught by the next Claude and deleted once the move is picked up."
---

## Move

Run [[Enrichment]] v2.1 on [[Language as a Tonal Medium]], from its waiting plan.

## Why

The entry's bundle already carries a ready rich-face plan —
`Language as a Tonal Medium — sketch — rich-face-plan.md` — matching the five [[Semantic Webcam]]
iterations to the argument step each proves. Its own forward vector says the plan becomes the
manifest and is deleted once the entry is enriched. This baton is that "later," named at Closing
Well 2026-09-25.

## Current state

The plan (`Language as a Tonal Medium/Language as a Tonal Medium — sketch — rich-face-plan.md`)
pairs each of five existing playable HTML pieces in `Projects/Semantic Webcam/` to one step of the
entry's § *The evidence — five iterations of one instrument*:

| piece | the step it proves |
|---|---|
| `01-live-stigmergy-cam.html` | glyphs as pure tone, nothing reads yet |
| `02-word-flock-cam.html` | meaning unmoored from tone — the failure that proves the two channels must be joined on purpose |
| `03-character-multiply-cam.html` | the anchor: right darkness and a readable word at once |
| `04-grammar-fit-cam.html` | the strong test — does sense survive when tonal fit is the only hard constraint |
| `05-tonal-word-cam.html` | the settling — legibility becomes the texture of the tone |

The plan notes all five need a camera, and the rich face should say so before the first one asks.
The entry itself is still `stage: seed` (`Language as a Tonal Medium.md`) — thin prose, this is its
first enrichment.

## Tried & rejected

Nothing — the plan has sat waiting since 2026-09-24; this baton is its pickup, not a redo.

## Next move

1. Run [[Enrichment]] v2.1 top to bottom: step 0's tuning tail read, step 1 read-the-entry-and-
   bundle (the plan file *is* the gather), then walk the entry section by section.
2. For § *The evidence*, gather the five webcam pieces per the plan's table — each is already a
   playable HTML, so this is gathering, not making. Front the camera-permission note before the
   first piece.
3. Apply Enrichment v2.1's placement rule (step 1): this entry is a `concept` at `stage: seed`, so
   check whether any of the five pieces are essential-to-understand (the text is literally
   describing what one shows) versus safe to place in the rich face only.
4. Walk the rest of the entry for anything else worth making — the plan only covers the evidence
   section.
5. On completion, delete the plan file (its own forward vector says so) and stamp the manifest.

## Calibrations

- Loudon's priority on this move: **"later."** Not urgent.
- The entry is thin (`seed`) — resist over-building past what the five gathered pieces plus the
  plan actually call for; Enrichment's own caution against a "tristitia generator" (over-engineered,
  no room for discovery) applies here more than on a mature hub.

## Load these files first

- `Language as a Tonal Medium.md`
- `Language as a Tonal Medium/Language as a Tonal Medium — sketch — rich-face-plan.md`
- `Projects/Semantic Webcam/` (the five HTML pieces)
- `Enrichment.md` (v2.1)

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
