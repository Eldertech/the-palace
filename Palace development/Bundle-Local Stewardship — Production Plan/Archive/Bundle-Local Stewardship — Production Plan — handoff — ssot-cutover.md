---
title: "Bundle-Local Stewardship — Production Plan — handoff"
born: 2026-06-09
links:
  - target: "[[Bundle-Local Stewardship — Production Plan]]"
    type: connects-to
    label: handoff-for
forward_vector: "I carry the one deferred step of the Bundle-Local Stewardship plan — the single-source-of-truth cutover that slims state.json — across the Cowork → Claude Code boundary. The Mac session rewires the readers, regenerates the plans from the board, removes the duplicated state, verifies, and commits; then I archive."
session_thread: "Cowork session 2026-06-09 — post-implementation verification"
---

# Handoff: Bundle-Local Stewardship — slim state.json (the deferred SSOT cutover)

This is a **cross-surface continuation handoff** (Cowork → Claude Code on the Mac). The Phases 0–5 build is done, verified, and committed. This carries the one step the implementer **deliberately deferred** (and flagged in commit `fbaf1ac`: *"state.json is deliberately NOT slimmed yet"*). It was gated on a clean post-migration heartbeat — which has now happened, so it is unblocked.

## Move
Complete the single-source-of-truth cutover: make the **append-only board** the source for decision state and the **entry frontmatter** the source for vector/stage, then remove the now-stale duplicated `pending_requests` / `resolved_requests` arrays and the `stewardship` block from all 19 stewards' `state.json`, leaving it pure runtime (`iteration`, `last_active`, `last_read_cursor`, `health`).

## Why this move matters
This is the whole point of the project, not a tidy-up. Verification found live proof of the drift the project set out to kill: Shepard's `state.json` still lists `shepard-steward-018` / `-019` as **pending**, while the board granted both (`APPROVE-STAGE-2`, `DRAFT-NOW`) and the bundle `plan.md` correctly shows them **resolved**. Decision truth currently lives in two places and they have already diverged. Until `state.json` stops carrying decision arrays and the stewardship vector/stage copy, the bundle-local win is real but incomplete.

**This is a refactor, not a deletion.** The arrays are not dead duplication — they are an intermediate reconciliation buffer the live cycle maintains. Delete them without rewiring the readers below and the cycle breaks.

## Tried and rejected
- **Just deleting the fields from the 19 `state.json` files** — rejected: multiple orchestrator modules read them (see Current state). They must be rewired to the board / frontmatter first.
- **Doing the slim inside the original Phases 0–5** — rejected by the implementer by design: it was gated on a clean post-migration heartbeat so a steward could never lose state mid-run. That precondition is now met.
- **Slimming `manifest.json`'s `stewardship` block too** — *not* in scope here (see the manifest note under Next move): the spawn-time snapshot is immutable forensic data and does not drift the way the `state.json` copy does. Decide its fate separately; do not fold it into this move.

## Current state
Everything from Phases 0–5 is committed and green (`verify-plans.js` → ALL GREEN, 19 stewards). Nothing about the slim has started. The fields still present in every `state.json`: `stewardship` (with `vector_at_last_activation` / `stage_at_last_activation` / `page_updates_observed_since_last`), `pending_requests`, `resolved_requests`.

**The readers that must be rewired before any field is removed** (verified this session):

- `src/plan-file.js:78-79` — the materializer reads `state.pending_requests` / `state.resolved_requests` to render the plan. **This is why the plan can be board-current only if the arrays are.** Repoint it to derive open/resolved from the board (the inbox-builder logic in `process-cycle.js` already does the board scan), or have `process-cycle` persist the reconciled view and pass it in.
- `src/process-cycle.js:271-276` — reconciles board grants into `state.resolved_requests` / `state.pending_requests`. This is the board→state bridge; after cutover it should produce the reconciled view for the plan without writing it back to a slimmed `state.json`.
- `src/build-cycle-prompt.js:180` — reads `state.pending_requests` to tell the steward what's still open. Repoint to the board-derived open set.
- `src/git.js:110` — uses `state.stewardship.vector_at_last_activation` for **drift detection**. Needs a frontmatter-based replacement (compare against the entry's live `forward_vector`) before the `stewardship` block is removed.
- `src/build-cycle-prompt.js:135-141` — already prefers live frontmatter for stage, with `state.stewardship` then `manifest.stewardship` as fallbacks. Drop the `state` fallback once the block is gone; keep the `manifest` spawn fallback.
- `src/enchant.js:139-147` — the spawn template that *writes* the `stewardship` block and empty `pending`/`resolved` arrays into a new steward's `state.json`. Update so new stewards are born slim.

## Next move
Do it in this order so a live cycle is never left inconsistent:
1. **Rewire reads** (plan-file, build-cycle-prompt, git drift) to the board / frontmatter; keep `process-cycle`'s board reconciliation but stop persisting the arrays to disk. Add/adjust `vitest` coverage — especially a test that a steward with board-granted-but-not-in-state decisions renders them resolved in the plan (the Shepard case).
2. **Regenerate all 19 `plan.md` from the board** so they're current, and confirm Shepard now reflects `018`/`019` resolved from the board path (not from stale state arrays).
3. **Slim the 19 `state.json`**: remove `pending_requests`, `resolved_requests`, and `stewardship`. Update `enchant.js` so new spawns are born slim.
4. **Manifest decision** (separate, quick): keep `manifest.stewardship.{vector,stage}_at_spawn` as the immutable spawn snapshot, or move it into the plan's done-trail. Recommend keep-as-forensic; just confirm.
5. **Verify**: `verify-plans.js` green; a dry-run cycle on one steward; grep the 19 `state.json` to confirm only runtime keys remain; confirm `git.js` drift detection still fires against frontmatter.

## Receiving environment
- **Surface:** Claude Code on the Mac, palace root. Normal `git commit` (no Cowork lock dance). Full Node toolchain + `vitest` under `_ops/stigmergy/orchestrator/`.
- **No direct Anthropic API key** — Path 2 (Agent-tool / subagent dispatch). Don't introduce a raw-SDK assumption.
- **Gotcha — the heartbeat is live.** The every-other-morning batch dispatches the 19 stewards. Land the read-rewiring (step 1) and prove it green *before* removing fields (step 3), so a mid-flight cycle never reads a field that's already gone. Ideally do the field removal right after a heartbeat, not right before one.
- **Working tree has unrelated uncommitted drift** (live steward/companion output: Octave Equivalence, the blackboard, Maker/Shopkeeper, enrichment cards). Don't sweep it into this commit — keep the slim commits scoped to the orchestrator + the 19 `state.json`.

## Calibrations from this session
- The board is the **event log / source of truth**; the bundle `plan.md` is its **read-model**; `state.json` is **pure runtime**. That CQRS split is the spine of the whole project — this step is what finally makes it literally true.
- Single-source-of-truth is the success test: after this, decision truth exists in exactly one place (the board, surfaced through the plan), and vector/stage in exactly one place (frontmatter).
- Append-only board integrity is sacred — one write path, no `git add -A` in the N-writer repo.

## Load these files first
1. `Palace development/Bundle-Local Stewardship — Production Plan.md` — the contract; the *Two files, one bundle* and *The read seam* sections and the CQRS design.
2. `_ops/stigmergy/orchestrator/src/plan-file.js` — the materializer to repoint (lines 78-79).
3. `_ops/stigmergy/orchestrator/src/process-cycle.js` — board reconciliation (lines 271-276).
4. `_ops/stigmergy/orchestrator/src/build-cycle-prompt.js` and `src/git.js` — the other readers (pending IDs; drift detection).
5. `_ops/stigmergy/orchestrator/src/enchant.js` — spawn template to slim.
6. `_ops/agents/permanent/shepard-tone-synthesizer/state.json` — the canonical drift case to fix and test against.
7. `_ops/stigmergy/orchestrator/scripts/verify-plans.js` — extend it to assert `state.json` carries only runtime keys.
