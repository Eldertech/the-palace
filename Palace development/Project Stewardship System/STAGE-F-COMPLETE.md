# STAGE F — Two Paths — COMPLETE (dry-run verified)

Built 2026-05-29 from `Stage F — Two Paths — handoff.md`. All five phases built and
tested; the whole pipeline defaults to **dry-run** (no models, no worktrees, no
merges, no page edits) until live execution is opted into.

## Decisions taken to build (Loudon, 2026-05-29)

| Question | Answer |
|---|---|
| Which forks fire? | **Build-both only** — genuinely different things to build. Verdict forks (approve/adjust/reject of one deliverable) stay single-path Stage E. |
| Cost box per branch | **1 cycle + 1 artifact**; steward self-estimates; oversized → fall back to plain escalation. |
| Who merges after the pick | **Orchestrator auto-merges** on the `choice_response` (the human's pick is the gate; Two Paths never picks). |
| Card board | **TRICKSTER** + a Two Paths row in the Stage E digest. |
| (handoff defaults) | Directed fresh cycle, not checkpoints. Loser branch preserved + one-line page note. |

## What was built

| Phase | File | Tests |
|---|---|---|
| 0 selection | `_ops/stigmergy/trickster-auto/src/two-paths.js` (+ `digest.js` integration) | `tests/unit/two-paths.test.js` (13) |
| 1 dispatch | `_ops/stigmergy/orchestrator/src/two-paths-dispatch.js` | `tests/unit/two-paths-dispatch.test.js` (9) |
| 2 reconcile | `_ops/stigmergy/orchestrator/src/two-paths-reconcile.js` | `tests/unit/two-paths-reconcile.test.js` (7) |
| 3 emit | `_ops/stigmergy/orchestrator/src/two-paths-card.js` | `tests/unit/two-paths-card.test.js` (6) |
| 4 merge | `_ops/stigmergy/orchestrator/src/two-paths-merge.js` | `tests/unit/two-paths-merge.test.js` (7) |
| skill doc | `_ops/orchestrator/two-paths.md` | — |

Suites after build: trickster-auto **91**, orchestrator **158**, app **352** (app
untouched — Phase 3 consumes the already-merged v0.4 `choice` primitive, so its
render is the existing green `rich-content2.spec.js`). 41 new tests.

## Verified against the live board

Phase 0 over the live digest (16 pending): **7 eligible, 4 verdict-forks excluded.**
- Clean build-both: `apo-004` (K-SWEEP vs DUAL-SWEEP — the canonical case),
  `slime-mold-004`, `preset-004`.
- Correctly excluded (verdict): `shepard-008`, `gsl-026`, `inharmonic-005`, `shepard-009`.
- Phase 1 dry-run on `apo-004` resolved the agent dir, cycle 3, two isolated worktrees
  *outside* the palace tree, and assembled both 128 KB cycle prompts without dispatching.

## For Loudon to eyeball (the tunable eligibility tail)

These passed the mechanical classifier but are borderline — review before live dispatch:
- `retrospective-007` — flagged borderline (greenlight-variants).
- `portamento-006`, `blood-005` — one selected path is itself an `AUDITION-*` option.
- `meadows-007` — an engagement-mode fork (how to be interviewed), not really two
  deliverables.

The keyword classes in `two-paths.js` are a tunable safety net (the audition-gate
precedent): they bias toward over-excluding, and you validate the set in shadow.

## Deferred (deliberate, documented in the skill)

- **Live auto-dispatch + daily run cap.** Branch dispatch is a manual, opt-in
  Agent-tool step today; the per-day two-paths cap belongs with a future automated
  dispatcher (nothing to count yet). The per-branch cost box is already enforced.
- **Checkpoints (§10.1).** Branches run a directed fresh cycle, not a checkpoint fork.

## Open item flagged back to the handoff

OQ3(a) is fully resolved (TRICKSTER + digest). The v0.4 `choice` dependency the
handoff said to wait on **has landed** (commit `23a4d88`), so the build-order gate
("pause before Phase 3") no longer applies — Phases 0–4 shipped in one pass.
