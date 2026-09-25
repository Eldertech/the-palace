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
Carry the ceremony-evolution rollout through phases 2 to 5: version and tuning for Closing Well at the next close, then the remaining ceremonies, then scrolls for every entry with a ceremonies group on the PROJECTS deck, then the principle written into Palace Ceremonies.

## Why this move matters
Schema v1.20 states the rule and the Weave runs under it; nothing else does yet. Until each ceremony carries a version and a tuning file, "what changed since I last ran this" is answerable only for one ceremony, and the improvements Loudon feels every run stay in commit logs and session folders nobody reads on the way in. The order matters: Closing Well next because it has the model ledger and an executor that can append; scrolls after two ledgers exist so the renderer has something real to render; the principle last so it describes what has been done, not what was planned.

## Tried and rejected
- A ledger entry mandatory per run — too much for Closing Well, which runs often and has plateaued. The question is mandatory; the entry only when a run changed the spec.
- Keying the version on `type: practice` — Enrichment and Map Build are `meta`. v1.20 keys on what Palace Ceremonies names as a spec.
- Calling the file "gotchas" — that word stays with Specialists' tool traps. A run *tunes* a ceremony.
- Putting the Weave's stamp-and-teach step in the session plan rather than the card — the card owns procedure; plans inherit it.

## Current state
Landed: Schema v1.20 (`1ea3e978`); Weave v1.0 with `_ops/Weave Ceremony/Weave Ceremony — tuning.md` (`40acf9fa`). Not started: everything under Next move. The Weave's ledger already names four owed spec changes — entries 21, 24, 29, 30 (Step 1c's "a touch retires a flag", the ≥5 hub bar, one link per pair, the flag linter's card line); the first move off Weave 1.0 belongs to the next weave.

## Next move
- **Phase 2, at the next `close well`:** stamp `version: "1.0"` on `Closing Well.md` (the real spec, not the thin trigger card); rename `Closing Well/Closing Well — gotchas.md` to `— tuning.md` and repoint every file that names it (`grep -rl "Closing Well — gotchas"`); dedupe its doubled entries 12 and 13; add two entries from the 2026-09-23 close (Path A's first run; the executor never touched the ledger); give `_ops/closing-well/executor.md` a `tuning` species row that appends the close's "what this run taught" line, "nothing" legal; the moderator's close map stamps `ceremony_version`; one rationale paragraph in `Closing Well — Context.md`.
- **Phase 3:** Baton, Harvest, Deposit, Return, Enrichment, Map Build (normalize its bare `version: 2` to a quoted string), Revival, Walk, Spore Check, Self-Model Update. Each: version, a tuning file seeded from its Context rationale and inline history, one Context paragraph. Decide per ceremony where a run with no report file answers the question — a Deposit's record is its commit, so the commit body is the likely place.
- **Phase 4:** extend the scroll materializer (`_ops/stigmergy/orchestrator/src/scroll-file.js`, `scroll.js`) and `_ops/stigmergy/app/server/projects.js` from `type: project` to any entry; a ceremony's Now zone counts runs since the spec last changed and shows its version; the PROJECTS deck gets a "ceremonies" group, built in the same pass as the "services" group the Shopkeeper baton calls for.
- **Phase 5:** one paragraph in `_ops/Palace Ceremonies.md`: the question is mandatory every run, an entry only when a run changed the ceremony, the version moves only when the spec does. After two ceremonies have run under it.

## Receiving environment
Claude Code on the Mac, palace root, `main`. Phase 2 fires inside a close, so it is Sonnet executor work under a resident moderator; phases 3 and 4 are Opus drafting under a supervising session (Loudon's standing rule: Fable supervises, Opus does the heavy reading). Don't edit `_ops/stigmergy/app/server/*` while a steward run is live — Vite restarts the server in place and the lane loses its run label.

## Calibrations from this session
- "Assume all pages can have scrolls."
- Fable supervises; Opus agents run token-heavy work.
- The version moves on procedure changes only — a step, a gate, a postcondition, a linter — not prose.
- Quoted-string versions ("1.0").
- Show diffs before canon writes; Loudon's yes per phase.

## Load these files first
1. `SCHEMA — Reference.md` §6 (Versions, tuning, and run reports) and §8
2. `SCHEMA — Context.md` — the v1.20 record, with its "Held open"
3. `_ops/Weave Ceremony/Weave Ceremony — tuning.md` — the model as applied
4. `Closing Well/Closing Well — gotchas.md`
5. `_ops/closing-well/executor.md`
6. `_ops/Palace Ceremonies.md`
7. `The Scroll.md`

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
