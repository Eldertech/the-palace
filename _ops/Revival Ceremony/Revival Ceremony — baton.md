---
title: "Revival Ceremony — baton"
born: 2026-09-26
links:
  - target: "[[Revival Ceremony]]"
    type: connects-to
    label: "baton-for"
  - target: "[[Spore Check Ceremony]]"
    type: connects-to
    label: "sibling-in-scope"
  - target: "[[Shimmer Cloud]]"
    type: connects-to
    label: "first-run"
forward_vector: "I carry the in-progress move on [[Revival Ceremony]] across a boundary, waiting to be caught by the next Claude and deleted once the move is picked up."
---

# Baton: Revival Ceremony

## Move
Redesign how the palace brings a dormant idea back — the Revival Ceremony and the Spore Check, neither of which has ever run — then run it for the first time on [[Shimmer Cloud]], bringing that spore into the stewardship process.

## Why this move matters
Shimmer Cloud would be the palace's first revival ever: no commit has ever begun "Revival —". So the spec has never met a real case, and read against today's palace it breaks. On 2026-09-26 Loudon stopped the fast pass and asked for this to be done thoughtfully, not at a cleanup session's pace.

## Tried and rejected
- Running the revival under the card as written (1.2). It can't revive a spore — it only changes stage, and a spore's stage is always dormant — and its Revival Note puts history on the page. Stopped partway; nothing committed.
- Applying eight fixes as a quick 2.0. Drafted and shown to Loudon, who chose this baton instead.

## Current state
Nothing is committed. The eight draft fixes, a starting list rather than a decision:
1. A spore changes type on revival — `project` with `status: active` if it will be built, else `concept` — records which `revival_conditions` were met, and drops the field.
2. One revival path: the Spore Check's `revive` disposition (which revives inline, seed or sprout only, with its own note) names the entry and hands it to the Revival Ceremony.
3. The revival story goes on the entry's scroll making trail, or the commit when there is no scroll; the body is rewritten to be true now (ELDER: write what is, not what was).
4. One stage rule, SCHEMA §2's. "The Waking" (come back at seed or sprout) contradicts Step 5.
5. A revived project gets a scroll whose Plan Loudon agrees, and on his word a steward: `node _ops/stigmergy/orchestrator/src/enchant.js "<Title>"` (`_ops/orchestrator/batch.md` § Enchant a new steward).
6. Run the face audit after the type change — spores shed faces, projects always wear one.
7. An entry already deleted comes back by restoring it from git at its composting state, then the ceremony runs.
8. Align to the living cards: the contract table (Map Build's shape), the tail read and run line kept, the Concierge's placement check after writing.

Plus the Spore Check to 1.3 with a ledger item, and Revival ledger item 2 recording this first run.

Shimmer Cloud, approved by Loudon in principle ("agreed, be sure to onboard properly, no shortcuts"):
- Spore becomes a project, active, stage `growing` — 1,016 words, and three lens models already built in its bundle (`01_feedback_lens`, `02_droplet_cloud`, `03_dispersion_cloud`, each with a listening set; `README.md` traces the lineage). Work stopped in May 2026.
- Links he agreed: [[Neural Granular Synthesis]] (couples-with, `grain-populations`, plus the link back), [[Crystal Synthesizer]] (connects-to, `shared-dispersion-filter`), [[Dispersion Table]] (connects-to, `phase-curve-lenses`).
- Its "The Seed" section still says it is dormant because nothing has been built — false now.
- The Plan he agreed for its scroll. Direction: a reverb that is also a prism — a cloud of dispersing lenses around any input, playable live. Moves: choose the lens model with Loudon by ear → find the grain count where shimmer stops sounding like chorus → a real-time prototype at a few hundred lenses (RNBO or a Web Audio worklet) → thousands on Neural Granular Synthesis's GPU engine → render the cloud as a spatial field.
- Its face stays; the face audit listed it for retirement only because it is a spore.

## Next move
Read the Revival Ceremony and the Spore Check beside Map Build, Deposit, Baton and [[The Scroll]], and bring Loudon a considered redesign — the eight fixes are a starting point, not a verdict. Settle it with him, land the spec changes with their ledger items, then run Shimmer Cloud as the first revival and enchant its steward properly.

## Calibrations from this session
- Loudon: "I'd like this to be a more thoughtful process than the quick pace we are in right now." Show before writing, one part at a time.
- Loudon: "be thoughtful and consider how we may want to get meta" — a never-run ceremony's first run is where its spec should change.
- Loudon: Shimmer Cloud is "a great idea that we need to make part of the updated stewardship project process"; onboard it "properly, no shortcuts."

## Load these files first
1. `_ops/Revival Ceremony.md` and `_ops/Revival Ceremony/Revival Ceremony — tuning.md`
2. `_ops/Spore Check Ceremony.md`
3. `Projects/Shimmer Cloud.md` and `Projects/Shimmer Cloud/README.md`
4. `The Scroll.md` and `_ops/orchestrator/batch.md` § Enchant a new steward
5. `ELDER.md` § What You Are Here to Leave Behind
6. For comparison: `_ops/Map Build Ceremony.md`, `_ops/Deposit Ceremony.md`


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
