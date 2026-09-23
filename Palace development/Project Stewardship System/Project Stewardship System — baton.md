---
title: "Project Stewardship System — baton"
born: 2026-09-23
links:
  - target: "[[Project Stewardship System]]"
    type: connects-to
    label: "baton-for"
forward_vector: "I carry the in-progress move on [[Project Stewardship System]] across a boundary, waiting to be caught by the next Claude and deleted once the move is picked up."
---

**Move.** Merge branch `claude/gifted-knuth-axzhkw` (the 2026-09-23 stewardship session, 15 commits) into main on the Mac, then prove the new contract in the one place it could not be proven here: a real steward **run** through the STIGMERGY lane or the launchd heartbeat, on a project that needs the Shop. Watch whether the run makes a larger jump than one cycle did, whether the scroll's making trail reads well after ten cycles, and whether Standing Orders cut the question traffic.

**Why it matters.** Loudon's three complaints — no big-picture view, no way back into a project, steward progress folded away — were answered in code and canon this session, and every project now has a scroll. But the container this was built in runs as root, where the headless worker refuses to fire, so every real cycle here went through the Agent-tool path with a two-cycle cap. The run controller, the barren-retry-then-STALLED rule, and the ten-cycle cap have unit and integration proofs and no live proof. That proof is the Mac's to give.

**What landed (read the commits on the branch; each is one unit):**
- `_ops/stigmergy/orchestrator/src/scroll-file.js` + `scroll.js` — the scroll materializer; 36 scrolls backfilled; 20 `plan.md` files retired.
- `process-cycle.js` — scroll per cycle, `stop_hint`, STALLED on the second barren cycle, `spawn_failed` when the worker never spoke.
- `server/steward-lane.js` — the run (`max_iterations`, default 10; `max_cycles` per call), barren retry, stop on a paused ask or a session request.
- `build-cycle-prompt.js` — injects Standing Orders + the Now zone; the mandate is ship-first and run-aware.
- STIGMERGY: STEWARDS → **PROJECTS** deck, `server/projects.js`, `GET /api/projects`, `GET /api/projects/scroll`, `PUT /api/projects/orders`.
- Canon: [[The Scroll]], [[Project Stewardship System]], [[STIGMERGY]], [[STIGMERGY v2.0 — Consolidation & Primary Interface]], [[Palace Orchestrator]], [[Drift and Consolidation]], [[Substrate Skill]], [[SCHEMA — Reference]] §8.
- Prompts + runbooks: `steward.md`, `shared.md` (the `shipped_artifact` contract), `batch.md`, `permanent.md`, `runAgentCycle.md`, the heartbeat wrapper.

**Pilot results (Agent-tool dispatch, two-cycle cap, no Shop):** Eight cycles, four stewards, two cycles each, every one shipped — zero barren, every run ended at its cap, none on a paused ask. Nineteen messages appended, all validated. Nothing was heard or seen in a browser here; every claim below is checked by numbers.
- **Generative Sample Libraries 20–21** consumed the 2026-08-26 BOTH-PARALLEL grant that no cycle had read: a four-arm pitch probe (Stable Audio · MusicGen guided · MusicGen text · the Crystal instrument as reference), a three-grade grader checked on the Crystal (48/48, worst 1.85 cents), then `build_sfz.py` turning a graded run into a playable SFZ (Crystal reference 59/59 keys on target). No ask posted; the Mac runs one command (`ai-source-probe/run-on-mac.sh`). Its WAVs are gitignored, so the samples live only on the container.
- **Waveguide Synthesizer 8–9** — STALLED at the start of the session — ran Study v1's own audio code headless in node, found three real bugs (stiffness did nothing, 28-cent drift, −35 dBFS), shipped v1.1, then v1.2 with a strobe view (exact for a flexible string, 392× slow) and a replay view (exact at any stiffness). Audio bit-identical across views. One ask open: the default view.
- **Quantum Synthesizer 5–6** (dormant; revival probe by standing order): the well-morph explorer, a wrong table from June corrected, then the double well — tunnelling heard as beating, measured 1.40 / 6.28 / 20.38 Hz against the solver's 1.40 / 6.29 / 20.39. Two asks open: REVIVE-TO-SPROUT, and a drafted fix for the entry's piano paragraph (bending stiffness, not nonlinearity — it disagrees with [[Piano String Inharmonicity]]).
- **Particle Synthesis 4–5** (dormant; revival probe): the fountain on ice — 64 and 1000 particles skipping on a stiff plate, each strike a dispersion chirp — with an interactive lesson, then grains that meet mid-air with a Hertz-contact clack; momentum and energy balance to rounding. One ask open: REVIVE-TO-SPROUT.

**Tried & rejected this session.** Firing the pilots through the live lane in this container — the worker refuses `bypassPermissions` as root and every cycle read as barren; that produced the `spawn_failed` fix. Regenerating the scroll's Now zone on disk on every terminal look — it would churn 36 files in the working tree between cycles; the deck regenerates in memory and writes only on a cycle or a Standing Orders save.

**Current state.** Branch pushed, all commits on `claude/gifted-knuth-axzhkw`; not merged. Orchestrator suite 272/272; app suite green but for one pre-existing live-board validator failure (a 2026-09-02 weave flag missing Path-1 health fields — not this branch's). The launchd heartbeat has never fired since the 2026-08-25 skill relocation *or* this change. Quantum Synthesizer and Particle Synthesis still carry `stage: dormant`; Loudon asked for cycles on them and got them via Standing Orders that override the dormant posture, but the batch planner still skips them until the stage changes (a [[Revival Ceremony]], his call).

**Next move.** On the Mac: merge the branch; `cd _ops/stigmergy/app && npm install && npm run dev`; open `?deck=projects`; pick one project with answers waiting and click **advance** — watch the row read `running k/N`, watch the scroll's making trail grow, read the lane log's `run:` lines. Then install the launchd job (`_ops/heartbeat/README.md`) so runs happen without a click. If a run stalls, the scroll says so; that is the signal working, not the signal failing.

**Negative space — don't do these:** Don't regenerate scrolls on every GET to disk (see Tried & rejected). Don't give the steward write access to its own scroll — the orchestrator materializes it from what the steward *posts*; a steward that edits its scroll by hand breaks the single-source-of-truth the Now zone depends on. Don't re-litigate `plan.md`; git has it. Don't raise `max_iterations` past 10 before a real run has been watched. Don't touch the STIGMERGY v2.0 "latest Opus" baton — it is a separate open card.

**Calibrations from this session.** Loudon: "I am not using Obsidian any more, STIGMERGY is my primary interface from now on" — so anything he must read or write lives on a deck, never only in a file. "Move forward with confidence, I don't need to watch" — standing authorization for canon edits within the stewardship scope, one commit per entry. Ten cycles as the run cap "as a starting point."

**Load these files first:** `Palace development/Project Stewardship System.md` (the 2026-09-23 status block), `The Scroll.md`, `_ops/stigmergy/orchestrator/src/scroll-file.js`, `_ops/stigmergy/app/server/steward-lane.js`, `_ops/stigmergy/app/server/projects.js`, `_ops/orchestrator/runAgentCycle.md` § The run, `_ops/heartbeat/README.md`.

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
