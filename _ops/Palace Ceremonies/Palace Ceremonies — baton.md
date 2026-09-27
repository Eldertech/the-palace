---
title: "Palace Ceremonies — baton"
born: 2026-09-26
links:
  - target: "[[Palace Ceremonies]]"
    type: connects-to
    label: "baton-for"
  - target: "[[The Scroll]]"
    type: connects-to
    label: "shared-machinery"
  - target: "[[Revival Ceremony — baton]]"
    type: connects-to
    label: "sibling-question"
forward_vector: "I carry the in-progress move on [[Palace Ceremonies]] across a boundary, waiting to be caught by the next Claude and deleted once the move is picked up."
---

# Baton: Palace Ceremonies

## Move
Let any page that makes repeated runs earn a tuning ledger and a scroll, so it iterates run by run, collects its gotchas and bugs, and rolls them into its next version. Then decide what "ceremony" means once a ledger no longer marks one.

## Why this move matters
The ledgers of 2026-09-25 made the thirteen ceremonies correct themselves: every run leaves a line, each lesson moves a version, and each run reads what's owed first. The same loop fits anything that runs repeatedly. But today a ledger *is* the definition of a ceremony, twice over:
- § What Makes a Ceremony: "the ledger is how the machinery finds one"
- the code: `ceremony-scroll.js` ("a ceremony is any entry with a tuning ledger"), and the PROJECTS deck's CEREMONIES group (`projects.js`)

So a ledger on any other page would be mislabelled a ceremony.

## Tried and rejected
- A Shop-only design (2026-09-26): ledgers for specialists and makers, a SHOP group on the deck, and SCHEMA — Reference §6 widened to "a ceremony or a Shop tool". Loudon rejected it as a carve-out: "we must not get myopic around the shop." Its general parts carry over (below).

## Current state
Nothing built. What's known:
- *The ledger rules* are in SCHEMA — Reference §6 (Versions, tuning, and run reports): version, run lines, numbered items, owed and paid, Loudon's orders, the tail read, union merge. The §8 `tuning` row calls a ledger "a ceremony's", and keeps "gotcha" for a Specialist's tool traps.
- *Where repeated runs already happen*, each recording them its own way:
  - Shop specialists and makers: dated Gotchas on the page, a prose "last run", `last_tested`, and the Maker noting a gotcha at delivery (`Shop/Maker.md:73`)
  - steward cycles (`history.jsonl`, and the project scroll's making trail)
  - map builds (already a ceremony)
  - Dialectic runs (now gathered in its folder)
  - generators such as `Projects/2D Torus Wavetable Synthesizer/Tools/build_catalog.py`
  - probably harvests, radio plays, Loudon Live sessions, the Weave's linters
- *General ideas from the Shop draft*:
  - the page states today's gotchas and the ledger holds their history
  - "how this page works" gets its own version, separate from any upstream tool's version
  - where a script drives a run, the script does the tail read itself
  - automated runs mark the ledger too
  - a fixed gotcha leaves the page when its item is paid
- *A test case waiting*: the faces batches of 2026-09-26 taught lessons a ledger would have caught. One line each:
  - Two figures close in a warm room read as a couple — fixed with ages, a pointing gesture, seen from behind.
  - Naming a shape after an everyday object draws the object.
  - FLUX won't draw a shadow "shaped like" something; it draws the thing.
  - Carry `_renders/` out of a worktree before removing it.
  - FLUX can't draw a bowtie inlay as hero or icon — composite it instead.
  - A print inside a framed panel can't be strip-trimmed — patch the flat margin.
  - FLUX turns an arrow into its up-and-right growth sign, and once into a letter N.
  - A front-view shape sorter reads as a traffic light.
  - FLUX cuts every hole round.
  - The endpoint's GPU list can run dry late at night; the client's 15-minute wait covered it.
  - Tool: the 409 from submitting too soon, and GPU parking not shared between agents — fixed in `43f53bae`.
  - Tool: one-sided place and unrecorded seeds — fixed in `5d3c0d60`.
- *Related*: [[Revival Ceremony — baton]], which also touches what a ceremony is.

## Next move
1. Survey where runs happen across the palace and how each records them now.
2. Bring Loudon definitions, with no carve-out for any one area: a **run**; when a page has **earned** a ledger and a scroll; what the scroll's Now shows for a page that isn't a ceremony; and what **ceremony** means next (named in the tables? writes to the house with Loudon? something else?).
3. Settle them with him.
4. Land them in Palace Ceremonies, SCHEMA — Reference §6 and §8, and the code: the scroll and the deck grouping.
5. Pilot on one page that isn't a ceremony. The Hero and Avatar Maker is ready-made.

## Calibrations from this session
- Loudon: "We must not get myopic around the shop and adding a specific carve out for it."
- Loudon: "Any page can have a tuning ledger and a scroll when it earns it."
- Loudon: "Consider if we need a different way to define ceremony."
- This needs a thoughtful session, not the pace of a cleanup day.

## Load these files first
1. `_ops/Palace Ceremonies.md` § What Makes a Ceremony, and How It Changes
2. `SCHEMA — Reference.md` §6 (Versions, tuning, and run reports) and §8's `tuning` and `scroll` rows
3. The header comments of `_ops/stigmergy/orchestrator/src/ceremony-scroll.js` and `_ops/stigmergy/app/server/projects.js`
4. `The Scroll.md`
5. One ceremony ledger: `Closing Well/Closing Well — tuning.md` or `_ops/Map Build Ceremony/Map Build Ceremony — tuning.md`
6. `Shop/Hero and Avatar Maker.md` and `Shop/Kokoro.md` § Gotchas
7. `_ops/Revival Ceremony/Revival Ceremony — baton.md`

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
