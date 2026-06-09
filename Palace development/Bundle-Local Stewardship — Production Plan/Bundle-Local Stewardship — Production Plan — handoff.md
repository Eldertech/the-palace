---
title: "Bundle-Local Stewardship — Production Plan — handoff"
born: 2026-06-09
links:
  - target: "[[Bundle-Local Stewardship — Production Plan]]"
    type: connects-to
    label: handoff-for
forward_vector: "I carry the in-progress move on the Bundle-Local Stewardship plan across the Cowork → Claude Code boundary — a palace-wide build that the sandbox can design but not safely commit. The Mac session picks me up, builds, verifies, and commits; then I archive."
session_thread: "Cowork session 2026-06-09 — stewardship content/machinery split design + deposit"
---

# Handoff: Bundle-Local Stewardship — Production Plan

This is a **cross-surface build handoff** (Cowork → Claude Code on the Mac). The plan entry is the build contract; this handoff carries the in-flight calibrations and the negative space, and tells you what to commit first.

## Move
Implement the Bundle-Local Stewardship plan palace-wide: introduce the `[Entry] — plan.md` bundle file as the materialized read-model of each steward's working state, teach the orchestrator to write it and to read vector/stage from entry frontmatter, backfill all 19 live stewards, clean the strays, and update canon — applying the Machinery/Content Split as a standing principle.

## Why this move matters
The actual reason is **findability under the palace's own principle**, not tidiness. The stewardship system stores an entry's most task-like state (`pending_requests`, the staged plan, the steward's reasoning) in `_ops/agents/permanent/[slug]/`, divorced from the entry. An agent loading the entry cold cannot see where the work stands. The deeper constraint: this must happen **without a wholesale `state.json` relocation**, because the registry + append-only board model depends on the engine keeping its runtime files. The design threads that needle with a CQRS split — board = event log, bundle plan = read-model, `_ops` = slim runtime. Get the split right and the principle generalizes past stewardship; get it wrong (e.g. copy vector/stage into the bundle without teaching the reader to use frontmatter) and you've just moved the drift.

## Tried and rejected
- **Relocating `state.json` into the bundle wholesale** — rejected: fights `REGISTRY.json` and the orchestrator's path model, and puts mutable runtime state in canon space.
- **A new `HANDOFF_READY` / `PLAN` board message type** — rejected: the board vocabulary stays closed without a Schema Ceremony; the plan is a *read* of existing `RESOURCE_REQUEST`/`GRANT` messages, not a new write.
- **Per-entry steward machinery in the bundle** — rejected: the engine is shared; only content is per-entry.
- **A `plan` Schema Ceremony** — unnecessary: §8's bundle-type vocabulary is explicitly open; adding `plan` is documentation, not ceremony.
- **Merging staging into `plan.md`** — considered and rejected (decided 2026-06-09). Staging (the teaching arc) and planning (the work state) are two distinct registers for two readers and stay two distinct files, both bundle-local. See the contract's *Two files, one bundle*. The machinery/content principle requires both in the bundle, not one file — do not merge them.
- **Doing this from Cowork** — rejected for the commit: Cowork strands git lockfiles (see memory + CLAUDE.md). The files are already *written* by the Cowork session; the Mac session owns build + verify + commit.

## Current state
Already written to the palace by the Cowork session (uncommitted):
- `Palace development/Bundle-Local Stewardship — Production Plan.md` — the full build contract (phases 0–5, stranding audit, CQRS design, migration plan, forward vectors).
- `Palace development/Bundle-Local Stewardship — Production Plan/Bundle-Local Stewardship — Production Plan — handoff.md` — this file.
- A row appended to `_ops/Deposit Archive.md` (`D-2026-06-09-BLS`).

Nothing else has been touched. No orchestrator code changed. No steward files changed. The 19 stewards are running unmodified on the heartbeat.

Confirmed during design (so you don't re-derive):
- 19 live stewards in `REGISTRY.json`; per-steward files are `manifest.json`, `state.json`, `history.jsonl`.
- The orchestrator joins steward↔entry by the `home` field (exact entry title) — bundle path is derivable from it. Path references live in `_ops/stigmergy/orchestrator/src/process-cycle.js` (reads `state.json`/`history.jsonl`/`manifest.json`) and `src/manifest.js` (uses `home`).
- `REGISTRY.json` `dir` paths are inconsistently absolute vs. relative — normalize to relative in Phase 3.
- Three staging files already sit inside bundles: Crystal Synthesizer, Retrospective Delay, Shepard Tone Synthesizer. **They stay put** — staging is its own bundle-local register, separate from `plan.md`. Phase 3 leaves them where they are (optionally lowercasing to `— staging.md` for type-name consistency); no fold, no `project-stage-builder` change, since the skill already writes into the bundle.
- **The read seam (decided 2026-06-09):** the steward *reads* `staging.md` but writes only `plan.md`. Phase 1 step (d) makes the orchestrator load the entry's `staging.md` into steward context when present, so decisions are weighed against the staged teaching arc. If a decision implies the arc itself should change, the steward **flags it** (`RESOURCE_REQUEST` / `FLAG` to Loudon) — it does not edit `staging.md`. See the contract's *The read seam*.
- GSL strays to relocate: `_ops/agents/permanent/generative-sample-libraries/HANDOFF.md` and `STAGE-A-LESSONS.md` (also a `pending-bbs-append.jsonl` there — check whether it's live machinery before moving it).
- Shepard's two open decisions to preserve verbatim in backfill: `shepard-steward-018` (blocking), `shepard-steward-019` (non-blocking).

## Next move
Start with **Phase 0 + Phase 1** as one branch. Add `plan` to SCHEMA §8, define the `plan.md` template, then make the orchestrator changes additively (write plan alongside state; read vector/stage from frontmatter; resolve bundle path from `home`) with vitest coverage for the materializer and the frontmatter read. Do **not** slim `state.json` until the frontmatter-read path is green — that ordering is load-bearing. Then Phase 2 backfill (idempotent script, verify against board), Phase 3 strays, Phase 4 canon, Phase 5 verify. Commit per phase; the plan entry lists the completion checks.

## Receiving environment
- **Surface:** Claude Code on the Mac, palace root `/Users/loudonstearns/Documents/The Palace`.
- **Capability delta vs. Cowork:** you can `git commit` normally (no lock-moving dance — that restriction is Cowork-only). You can run the orchestrator's `vitest` suite. You have the full Node toolchain under `_ops/stigmergy/orchestrator/`.
- **No direct Anthropic API key.** The orchestrator runs under Path 2 (Claude-Code-resident, dispatching subagents via the Agent tool). Any code you add must not assume a raw API SDK — follow the existing Path 2 patterns in `src/`.
- **Gotcha — the heartbeat is live.** An every-other-morning launchd batch (`_ops/heartbeat/`) dispatches the 19 stewards. Keep Phase 1 additive so a mid-flight cycle never loses state; land `state.json` slimming only after the read-path is proven.
- **First commit:** commit the already-written plan entry + this handoff + the archive row before starting code, so you build from a clean tree and the baton is in git. Suggested message: `Deposit — D-2026-06-09-BLS — Bundle-Local Stewardship production plan + handoff (1 new entry)`.

## Calibrations from this session
- The **Machinery/Content Split** is now a *strong standing principle*, not a one-off — Loudon's words. Apply it as the lens, and watch for its next non-steward application (that's the signal it should graduate to its own concept entry).
- Keep `plan.md` internals **loose** — palace categories earn their place across many runs before hardening. Don't over-specify the section schema.
- **Single-source-of-truth on vector/stage** is the test of success: if the bundle ends up with a *copy* rather than the orchestrator reading frontmatter, the change failed its own goal.
- Preserve append-only board integrity — one write path, no `git add -A` in the N-writer repo.

## Load these files first
1. `Palace development/Bundle-Local Stewardship — Production Plan.md` — the build contract (read fully).
2. `SCHEMA.md` §8 (bundles) and §9 (coordination / append-only board rules).
3. `Palace development/Project Stewardship System.md` + its bundle handoffs — the system being hardened.
4. `_ops/stigmergy/orchestrator/src/process-cycle.js`, `src/manifest.js`, `src/registry.js` — where the path/state/home logic lives.
5. `_ops/agents/permanent/shepard-tone-synthesizer/{manifest,state}.json` — the canonical per-steward shape and the open-decision case to round-trip.
6. `_ops/Substrate Skill.md` — steward posture doc to update in Phase 4.
7. One `[Entry] — Staging.md` file (e.g. Shepard Tone Synthesizer's) — to see the staging register's shape, so you keep `plan.md` distinct from it *and* wire the steward to read it (Phase 1 step d).
