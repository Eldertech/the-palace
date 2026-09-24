---
title: "Shopkeeper — baton"
born: 2026-09-23
links:
  - target: "[[Shopkeeper]]"
    type: connects-to
    label: "baton-for"
forward_vector: "I carry the in-progress move on [[Shopkeeper]] across a boundary, waiting to be caught by the next Claude and deleted once the move is picked up."
---

# Baton: Shopkeeper

## Move
Fold the Shopkeeper into ordinary stewardship: enchant it as a permanent steward with Standing Orders written from its sweep wrapper's prose, retire the special sweep script and its launchd job, and let the deck stop guessing at its asks. After the 2026-09-23 GSL run has ended, not before.

## Why this move matters
The Shopkeeper was special-cased in June because the things it needed — a standing instruction file, a rewritten "where things stand," a trail of probes, a cheap model on a cadence — did not exist for stewards. The 2026-09-23 stewardship branch built all of them for everyone: Standing Orders, the Now zone, the making trail, per-manifest model pins, the batch planner's due rule, the run. What remains special is now pure cost: a second prompt that never reads the ask rules (so it posts several questions in one note and the deck infers a session request), a second wrapper and launchd plist, a second commit path, and no cursor, so Loudon's answers are read but never consumed. Its two open cards sat unanswered for three months looking exactly like live asks.

## Cold start
COLD START — this work has not begun; no prior state, no tried-and-rejected. What was considered in conversation and set aside: changing the deck's session-inference threshold (wrong fix; the rule was written for the Shopkeeper's shape and goes away with it), and splitting `decisions_needed` into per-question cards in the deck (papering over the missing ask rules rather than teaching them).

## Next move
Answer the two open Shopkeeper cards on TRICKSTER first, by note, so the first steward cycle starts clean. Then, in order: decide the page question — the Shopkeeper is `type: maker` and the PROJECTS deck lists projects, so either give the deck a "services" group for stewarded non-project pages (preferred; the Shop may have other tenders) or retype the page; enchant it (`node _ops/stigmergy/orchestrator/src/enchant.js "Shopkeeper"`) and pin its manifest to the Sonnet-class model the wrapper used; write its Standing Orders from `_ops/heartbeat/run-shopkeeper-sweep.sh` and `Shop/Shopkeeper/next-run-commission.md` (commission first, then the discovery loop, be frugal, stub Specialists only on approval); give its cycle prompt one line of role framing so it sweeps outward; run one cycle from the deck and watch it post one card per decision; then retire `run-shopkeeper-sweep.sh`, its plist, and the digest expectations that referenced it, and add a status note to the Shopkeeper page and the Project Stewardship System entry.

## Receiving environment
Claude Code on the Mac, palace root, `main`. Needs the Homebrew `claude` at 2.1.280 or newer (installed 2026-09-23 via the `claude-code@latest` cask) and the STIGMERGY dev server. Don't edit `_ops/stigmergy/app/server/*` while a steward run is live; Vite restarts the server in place and the lane loses its in-memory run label.

## Calibrations from this session
- Loudon: the Shopkeeper "is special and we coded it that way" — then, on discussion, agreed it need not stay special.
- "STIGMERGY is my primary interface": anything he reads or answers lives on a deck.
- One card files one decision.
- The deck's session inference stays as is until the Shopkeeper stops needing it.
- Loudon chose (by default, offered and not overridden) the "services group" over retyping the page.

## Load these files first
1. `Shop/Shopkeeper.md`
2. `_ops/heartbeat/run-shopkeeper-sweep.sh`
3. `_ops/orchestrator/batch.md` § Enchant a new steward
4. `_ops/orchestrator/prompts/shared.md` § ask rules
5. `_ops/stigmergy/orchestrator/src/enchant.js`
6. `_ops/stigmergy/app/src/lib/inbox.js` (deriveKind)
7. `Palace development/Project Stewardship System.md` (2026-09-23 status)
8. `The Scroll.md`

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
