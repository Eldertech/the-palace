---
title: "STIGMERGY Hardening — handoff"
born: 2026-06-06
genre: cross-surface paste-prompt (Cowork → Claude Code)
links:
  - target: "[[STIGMERGY v1.0 — Palace Front-End]]"
    type: connects-to
    label: "handoff-for"
  - target: "[[STIGMERGY Audit — 2026-06-06]]"
    type: emerged-from
    label: "executes"
forward_vector: "I carry the in-progress STIGMERGY hardening move across to Claude Code on the Mac, waiting to be picked up and archived once the structural refactor is caught."
---

# Handoff: STIGMERGY Hardening

## Move

Finish the audit's structural refactor: the small fixes are done and verified in the
sandbox; carry the two large refactors (core extraction + workspace, `middleware.js`
decomposition) to Claude Code on the Mac, where `npm install` is clean and git holds.

## Why this move matters

The §2.2 protocol is STIGMERGY's load-bearing *edge* but lives buried inside a *node* —
the app's `server/` folder — which is exactly why the orchestrator has to reach backward
into the app for it, producing a circular dependency across two npm packages. Cutting that
is high-coordination, low-logic work: nothing's behavior changes, only module addresses. So
it must run where a multi-package install is clean and git checkpoints survive — not the
sandbox.

## Tried and rejected (this session — the negative space)

- **Doing the big refactor in the Cowork sandbox.** Rejected: `node_modules` is Mac-built
  (a Linux rollup binary had to be hand-patched just to run the app's tests), and Cowork
  commits leave stale `.git/*.lock`. Verified, not speculative.
- **Deleting `orchestrator/src/two-paths-merge.js` as dead code.** Rejected: it has a unit
  test and a `app/src/lib/demo-data.js` reference — it's unwired Stage-F-Phase-4 logic, not
  dead.
- **Merging the strict server validator with the lenient client `src/lib/schema.js`.**
  Rejected: intentional gate-vs-feedback divergence. Move the strict one to core; leave the
  lenient one in the app.
- **Making the SSE `id:` a monotonic line cursor** (the bug report's "cleaner long-term"
  alternative). Rejected for the fix: larger change, unnecessary — positional replay fixes
  the defect with no wire change.

## Current state

Working tree, **uncommitted**; `npx vitest run` in `_ops/stigmergy/app` is **1054/1054
green**. Three items already landed and verified this session — closing-well punchlist, with
the named risk per item:

- **SSE replay bug fixed** — `server/middleware.js` `setupSseStream` now replays positionally;
  +2 regression tests in `tests/integration/sse-middleware.test.js` (SSE suite 12/12). *Risk:
  none observed; on `middleware.js` split, carry the fix + tests into `server/sse.js` intact.*
- **`gitAsync` deduped** — new `server/git-wrapper.js` (`execGit` + `MAX_BUFFER`); `git.js` and
  `commit.js` import it (git/commit suites 89/89). *Risk: none.*
- **Phase clutter archived** — `app/*COMPLETE*.md` + `*PHASE*.md` → `app/Archive/phases/`;
  pre-v1.0 checklists → `app/tests/checklists/archive/`. *Risk: none — `check-phase.js` reads
  only `screenshots/`, verified.*

The full spec for what remains lives in the audit (`STIGMERGY Audit — 2026-06-06.md`) §3
(core extraction + workspace), §4 (`middleware.js`), §4b (SSE-as-first-slice), §6 (do-not-
touch). This handoff does not restate it.

## Next move

Review the uncommitted diff, run `npx vitest run` to confirm the 1054 baseline, and commit
Part 1. Then start Step A (audit §3): create `_ops/stigmergy/core/` (`@stigmergy/core`), move
the strict validator + blackboard I/O + inbox/parse/commit-spec into it, wire the four-package
npm workspace, re-point imports so the **app↔orchestrator cycle is cut** (orchestrator imports
the validator from core, not the app). Tests green at each commit.

## Receiving environment

Claude Code, Mac, palace root (`/Users/loudonstearns/Documents/The Palace`). Capability deltas
that bite this move: a clean multi-package `npm install` (the sandbox can't); durable git
commits; **gotcha** — if a prior Cowork commit wedged git, `rm -f .git/HEAD.lock .git/index.lock`
first. See [[Surfaces and Capabilities]]. Acceptance for Step A: vitest green in app
(≥1054), orchestrator, trickster-auto; no app↔orchestrator cycle; no `app/server/validator.js`
or `orchestrator/src/append.js` left behind.

## Calibrations from this session

- Loudon escalated scope mid-session — he wants the **whole** refactor executed, not just
  proposals, and authorized this handoff as the fallback for sandbox-impossible work.
- Loudon holds **ceremony fidelity as load-bearing**: run palace ceremonies as articulated
  (show-before-write, the standard sections, board announcement for cross-surface), don't
  improvise doc forms. This handoff was itself redrafted to honor that.
- Audit correction to carry forward: `two-paths-merge.js` is not dead code.

## Load these files first

1. `STIGMERGY Audit — 2026-06-06.md` (the spec — §3/§4/§6 most load-bearing)
2. this handoff
3. `Palace development/STIGMERGY v1.0 — Palace Front-End.md` (the entry)
4. `bug-sse-reconnect-replay.md` (mark `status: fixed` on commit)

*Loudon Live · Autodidact Polymaths*
