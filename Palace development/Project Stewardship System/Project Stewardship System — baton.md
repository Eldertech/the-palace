---
title: "Project Stewardship System — baton"
born: 2026-09-26
links:
  - target: "[[Project Stewardship System]]"
    type: connects-to
    label: "baton-for"
forward_vector: "I carry the in-progress move on [[Project Stewardship System]] across a boundary, waiting to be caught by the next Claude and deleted once the move is picked up."
---

# Baton: Project Stewardship System — the Trickster inbox's no-id requests

## Move

Decide what the Trickster inbox does with requests that carry no `request_id` — change the reader, the writers, or both — weighed against the stewardship changes of 2026-09-25, then make the test that says so pass.

## Why this move matters

A request with no id can never be answered. `buildInbox` (`_ops/stigmergy/trickster-auto/src/inbox.js`) gives each one a throwaway key, so it sits in the pending queue forever. Four sit there now, and the Phase 0 gate test (`trickster-auto/tests/unit/parse.test.js`, "live board (if present) parses every pending request without throwing") fails on them — a red test nobody can clear teaches its readers to stop looking.

None of the four is a clean ask. Three are the Shopkeeper's old sweep summaries (2026-06-23, 09-15, 09-24), typed `RESOURCE_REQUEST` with no resource and no options. The fourth is a Sam Maloof lens post (2026-07-05, session `sam-maloof-lens-blueline`) with a real Commit/Hold question and no id.

The stewardship changes are why this is a decision, not a patch:

- The Shopkeeper's special sweep, which wrote three of the four, retired on 2026-09-25 when it became an ordinary steward with Standing Orders (`b9de2e2e`). Ordinary stewards are already told to set a top-level `request_id` (`_ops/orchestrator/prompts/shared.md` ~:98).
- The Automated Trickster (Stage E) is built and still shadow, awaiting Loudon's review (§ Stage E); its digest was last written 2026-06-08.
- Gap 9 in [[Project Stewardship System]] (~:197, `request_id` location) is the same family.

So the real questions: does only an id'd ask count as pending? May a page that is not a steward — a lens, a person — post a request at all? Is Stage E still the reader stewards write for?

## Cold start

COLD START — this work has not begun; no prior state, no tried-and-rejected. Found in passing on 2026-09-26 by the [[Sentry]], while refreshing STIGMERGY's dependencies: the failure is data, not code, and `src/inbox.js` alone shows it, with no test runner involved.

## Next move

Read the 2026-09-25 stewardship commits — the Shopkeeper fold-in (`b9de2e2e`), a cycle commits what it shipped (`ae111d88`), a cycle the harness cut off is not barren (`c81a8087`, `51fd7ec0`) — and § Stage E. Then bring Loudon one question with a recommendation among: (a) the reader counts only id'd requests and names the rest once as unanswerable; (b) every writer sets one, with a validator rule; (c) both. The board is append-only: a stale ask is closed by an answer or a note, never an edit. Then a test that fails first.

## Receiving environment

Claude Code on the Mac. Work in a worktree: `node _ops/worktree/new-worktree.mjs --name fix/trickster-inbox --profile stigmergy`. The profile symlinks `node_modules` into the owner's install — fine for running tests; `rm` the links (no trailing slash) before any `npm install`, or it rewrites the owner's. Check that no steward run is live (`ps -axo command | grep "You are a permanent steward" | grep -v grep` prints nothing) before touching the steward prompts.

## Calibrations from this session

- Loudon wants this weighed against where stewardship just went, not patched to turn a test green.
- Every fix gets a test that fails on the old code first; he sees the diff before it lands.
- Never POST to the live :5173 from a test or a probe; every write there is `application/json` from a local page.

## Load these files first

1. This baton; `Palace development/Project Stewardship System.md` § Stage E and the gap table (~:197–230).
2. `_ops/stigmergy/trickster-auto/src/inbox.js`, `src/parse.js`, `tests/unit/parse.test.js`.
3. `_ops/orchestrator/prompts/shared.md` ~:59–100 (the `request_id` rules); `_ops/orchestrator/trickster-auto.md`.
4. The Shopkeeper entry, and `git show --stat b9de2e2e` — what the fold-in changed about how it posts.
5. `SCHEMA — Reference.md` §9 (the wire).

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
