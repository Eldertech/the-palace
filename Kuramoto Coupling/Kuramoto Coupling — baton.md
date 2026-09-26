---
title: "Kuramoto Coupling — baton"
born: 2026-09-25
links:
  - target: "[[Kuramoto Coupling]]"
    type: connects-to
    label: "baton-for"
forward_vector: "I carry the in-progress move on [[Kuramoto Coupling]] across a boundary, waiting to be caught by the next Claude and deleted once the move is picked up."
---

## Move

Sort [[Kuramoto Coupling]]'s inline media under the [[Enrichment]] v2.1 placement rule (Closing
Well 2026-09-25, rows 4+5): keep in the text what's needed to understand it, move the rest to the
rich face's manifest as **gathered** pieces, shown to Loudon first, then re-stamp with
`fingerprint.mjs`.

## Why

Kuramoto Coupling was the first rich face (`025528fd`), built before Enrichment's placement rule
existed. Its `.md` still embeds nine pieces of media directly (`Kuramoto Coupling.md` ~:117–184) —
predating the tendency the ceremony now names: place what you make in the rich face, leave in the
text only what it needs (formulas, essential graphics, a diagram or image the text is actually
describing).

## Current state

Inline media in `Kuramoto Coupling.md`, roughly in order:
- a mermaid regimes diagram (~:94–113) — the text explains R crossing the critical threshold
  directly against it; likely **essential**.
- an uncoupled-phasors video (:117) + a matplotlib comparison variant (:119).
- two interactive explorers — visual (:123) and audio (:127) — the text says "drag the slider" and
  "hear it too," addressing them directly; may be **essential**.
- a phenomena-walk video (:155).
- a fireflies image (:162).
- a speech-rhythm narration audio (:172).
- a sync-arriving video (:176).
- an SA3 sound (:180).
- a round-1 teaching reel (:184).

The bundle already has a rich manifest (`Kuramoto Coupling/Kuramoto Coupling — rich.json`) with
three made pieces (`— rich — ensemble.html`, `— rich — equation.md`, `— rich — stubbornness.html`,
`— rich — waveform-locking.html`) from the first rich-face round. Any gathered piece added here
joins that manifest — check it first so nothing collides.

## Tried & rejected

Nothing yet — untouched since the first rich-face round.

## Next move

1. Read [[Enrichment]] v2.1 step 1's placement rule (Loudon's own words, quoted in full there) and
   walk the nine media pieces above against it: essential to the text as written, or safe to gather
   into the rich face.
2. For each piece judged non-essential, move it into `Kuramoto Coupling — rich.json` as a
   **gathered** piece (it already exists — this is step 1's "gather first," not a make).
3. Show Loudon the proposed split before writing it — reorganizing which media lives in the text
   changes what a mature hub says, so treat it the way Enrichment v2.1 step 6 now asks: shown
   first, and if it's more than a small edit, through the [[Deposit Ceremony]]'s map.
4. Re-stamp the affected sections: `node _ops/rich-face/fingerprint.mjs "Kuramoto Coupling"
   --stamp`.

## Calibrations

- **Kuramoto Coupling is a mature hub.** Tuning item 5 on [[Enrichment — tuning]] names the exact
  failure this baton exists to avoid: a finding written in unshown, then cut, then restored. Show
  before writing, every time.
- Loudon's priority on this move: **"later."** Not urgent — pick it up when there's room.

## Load these files first

- `Kuramoto Coupling.md` (~:90–190, the media block)
- `Kuramoto Coupling/Kuramoto Coupling — rich.json`
- `Enrichment.md` (v2.1 — step 1's placement rule, step 6's shown-first split)
- `_ops/rich-face/fingerprint.mjs`
- `_ops/rich-face/README.md`

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
