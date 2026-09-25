---
title: "Palace Ceremonies — baton"
born: 2026-09-24
links:
  - target: "[[Palace Ceremonies]]"
    type: connects-to
    label: "baton-for"
forward_vector: "I carry the in-progress move on [[Palace Ceremonies]] across a boundary, waiting to be caught by the next Claude and deleted once the move is picked up."
---

## Move
Review this session's ceremony work with fresh eyes, then finish the project: settle whether a ceremony run reads its scroll's Standing Orders, write the Phase 5 principle into Palace Ceremonies, and clear the owed tuning items.

## Why this move matters
Everything below was made in one long session and checked by a Concierge that had argued for parts of it; no reader without a stake has read it yet, and every correction today came from a second reader. Two ends are also half-true: the ceremony scroll offers Standing Orders that nothing reads, and the principle behind versioning lives in the Schema and the cards but not in Palace Ceremonies, the page a newcomer opens.

## Tried and rejected
- Reading the last two run groups of a tuning file — groups vary too much in size; Loudon chose a fixed tail, 40 lines plus a grep for owed (Schema v1.22).
- "Write a deposit where you work, then land it" — withdrawn; [[Worktree Practice]] says canon writes to the trunk, and Deposit v2.0 step 6 follows it.
- A code list of ceremonies — the tuning ledger marks a ceremony instead.
- Runs-since by timestamp — ancestry (`spec..HEAD`); same-second commits broke the clock.
- Owed by the bare word — the ledgers' phrase, "spec change owed / still owed"; the word turns up in passing.

## Current state
Landed and pushed, origin/main `38b43f46`:
- Schema v1.22, the tail read (`38f54c83`).
- Versions and tuning ledgers for Return, Walk, Spore Check, Self-Model Update, Revival, Harvest, Baton, Deposit (1.0) and Map Build (2.0), `81f0404a..57a9f2bf`; the first return record, `5669302b`.
- Deposit v2.0, the gate — Loudon's approval of the map, whoever deposits (`cb6f8ab7`); the Closing Well executor lands a keep row only if he approved its map and read its words.
- Phase 4, `2d0d88e2..38b43f46`: `_ops/stigmergy/orchestrator/src/ceremony-scroll.js`, the deck's CEREMONIES and SERVICES boxes (`app/server/projects.js`, `ProjectsDeck.jsx`, `ScrollView.jsx`), twelve ceremony scrolls, [[The Scroll]] § The ceremony scroll.

Look first, and the risk in each:
- `RUN_SUBJECTS` in `ceremony-scroll.js` mirrors each card's run record by hand. If a card's commit form changes, the count goes quietly wrong.
- The tuning seeds were attributed from git by one reader. The Concierge checked Baton 1–8 and Deposit 1–12 against their commits; the rest were not re-checked.
- The fixes made to Deposit v2.0 after the Concierge's check were never read back by it.
- Couldn't verify: the deck as rendered — the browser pane gave black screenshots, so it was checked by page text only.

Owed, read first by each ceremony's next run: Return 7–10, Walk 2, Map Build 3–4, Weave 21/24/29/30/39. Seams: Enrichment 2.1's step 6 now "splits by size" — check it agrees with Deposit v2.0's gate. The SERVICES box is built; enchanting the Shopkeeper is its own handoff.

## Next move
Grow up, summon the Concierge, and review first: read the landed diffs (`git log 38f54c83^..38b43f46`) against the claims above, open the deck on :5173 and look at the CEREMONIES box and two ceremony scrolls rendered, and bring Loudon what you would change. Then put the Standing Orders question to him — if yes, one line in each card's opening step, and drop "nothing reads it" from the placeholder and ScrollView — and draft Phase 5.

## Calibrations from this session
- Deposits are for larger additions to canon, not upkeep. Loudon's approval of the map is the gate, and nothing stands in for it. A page's rich face and scroll are its products, made without a deposit.
- The tail read: "be generous; getting part of a past tuning isn't a problem."
- Read [[Worktree Practice]] before proposing where anything lands. Sustained work goes in a worktree; canon converges on main deliberately.
- Show diffs before canon writes; Loudon's yes per phase. A version moves on procedure, not prose.
- Other sessions are live on main (the Enrichment session was, all day). Coordinate by message; rebase before landing.
- Fable supervises; Opus does the heavy reading. Warn before a big fan-out.

## Load these files first
1. `_ops/Palace Ceremonies.md`.
2. `SCHEMA — Reference.md` §6 (versions, tuning, the tail read) and §8 (`scroll`, `tuning`).
3. `_ops/Deposit Ceremony.md` (v2.0) and `_ops/closing-well/executor.md` § keep → deposit.
4. `_ops/stigmergy/orchestrator/src/ceremony-scroll.js` and `The Scroll.md` § The ceremony scroll.
5. `Worktree Practice.md`.

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
