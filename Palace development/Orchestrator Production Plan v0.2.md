---
title: Orchestrator Production Plan v0.2
type: project
status: pending
pillars:
  - tools
  - practice
born: 2026-05
last_activated: 2026-05-04
activation_count: 1
stage: seed
energy: very high
forward_vector: >
  I want to become the autonomous build contract that turns v0.1-orchestrator's
  per-cycle primitive into a true operational system. Batch-cycle mode lets one
  invocation advance every registered steward. Per-steward cadence governs who
  runs when. Spawn-from-project removes the friction in onboarding new stewards.
  Retire/pause/resume keeps the registry healthy across project lifecycles.
  Scheduled-task integration recipes make the weekly-batch pattern real on
  Loudon's machine without an Anthropic API key. A Claude Code session reading
  this file knows what to build. When this lands, the operational vision (Claude
  working on every project, surfacing only what needs Loudon's input) is achieved
  under Path 2.
links:
  - target: "[[Orchestrator Production Plan]]"
    type: emerged-from
    label: v0.1-foundation
  - target: "[[Palace Agent Infrastructure Spec]]"
    type: enables
    label: section-3-batch-extension
  - target: "[[Project Stewardship System]]"
    type: enables
    label: stage-c-of
  - target: "[[BBS Production Plan v0.2]]"
    type: connects-to
    label: shares-validator
  - target: "[[Pages as Agents]]"
    type: deepens
  - target: "[[Palace To-Do]]"
    type: connects-to
---

# Orchestrator Production Plan v0.2

The architecture is in [[Palace Agent Infrastructure Spec]] § 3. The v0.1 orchestrator at [[Orchestrator Production Plan]] established the runtime — Claude Code skill plus Node helpers, single-cycle dispatch, strict §2.2 validation, the four Stage A content findings baked into prompts. This document is the bridge: the executable contract that turns v0.1's per-cycle primitive into the operational system that delivers Loudon's vision — every project's steward running on its own cadence, batched into autonomous runs that need Loudon only when something genuinely requires his input.

It exists because v0.1-orchestrator deliberately deferred the operational primitives (batch-cycle, cadence, spawn-from-project, retire/pause/resume, scheduled-task integration) to keep v0.1's scope finishable. Without those primitives, v0.1 is a runtime that can dispatch one cycle of one steward per invocation — usable but tedious. v0.2 closes the operational gap.

**Critical context: Cowork's scheduled-tasks feature** (the `schedule` skill) provides cron-style autonomous invocation without an API key. v0.2 designs around this. A scheduled task firing every Monday at 6am invokes the orchestrator skill in batch-cycle mode; that scheduled session iterates the registry, dispatches subagents for each due steward, writes a digest. Loudon wakes Monday with overnight work done.

## Context (state at 2026-05-04)

- **2026-05-04 (Orchestrator v0.1).** Building autonomously per [[Orchestrator Production Plan]]. Expected to deliver: Claude Code skill at `.claude/skills/palace-orchestrator/`, Node helpers at `_ops/stigmergy/orchestrator/`, songline + permanent (single-cycle) modes, strict §2.2 validation, REGISTRY.json (active agents only), the four Stage A content findings baked in. **v0.2 builds on whatever v0.1 actually delivered** — sections marked "verify against v0.1 closure" must be reconciled with v0.1's `ORCHESTRATOR-V0.1-COMPLETE.md` before this build starts.
- **2026-05-04 (scheduled-tasks confirmed).** The Cowork `schedule` skill creates recurring or one-shot autonomous Claude Code/Cowork sessions via cron expressions or ISO timestamps. The scheduled session can invoke skills and dispatch subagents. **This unlocks true cron-style autonomy under Path 2.**
- **2026-05-04 (the operational vision named).** Loudon's target: every active project has a permanent steward; stewards run on per-project cadences (daily for fast-moving projects, weekly for steady, monthly for slow); batch-cycle runs from a scheduled task; the Trickster inbox in STIGMERGY surfaces only what needs Loudon's input.

## Decisions (2026-05-04)

| Decision | Choice | Reason |
|---|---|---|
| Scope of v0.2 | Batch-cycle + cadence + spawn-from-project + retire/pause/resume + scheduled-task recipes | The five operational primitives between v0.1's runtime and Loudon's vision. Each unblocks the next. |
| Architecture | Extends v0.1 — no new top-level directories | Skill files added to `.claude/skills/palace-orchestrator/`; helpers added to `_ops/stigmergy/orchestrator/src/`. REGISTRY schema extended in place. |
| Cadence semantics | Manifest field `cadence: "daily"\|"weekly"\|"biweekly"\|"monthly"\|"manual"` (default `weekly` for new permanent agents); state.json `last_active` is the comparison point; batch-cycle skips stewards not yet due | Simple enum, easy to reason about, easy to override per-steward. |
| Default model in spawn-from-project | `claude-sonnet-4-6` for all newly-spawned stewards | Cost-conscious default. Steward manifests can be edited to upgrade to opus when a steward proves it needs richer voice. |
| REGISTRY status field | `"active"\|"paused"\|"retired"` (default `"active"` on spawn) | Three lifecycle states. batch-cycle dispatches only `"active"`. |
| Retired agent archival | `_ops/agents/retired/<agent-id>/<YYYY-MM-DD>/` (full directory copy + REGISTRY entry update) | Preserves history.jsonl + manifest + state for forensic value; out of the active workspace. |
| Batch-cycle digest output | `_ops/orchestrator/scheduled-runs/<YYYY-MM-DD>-<run-id>.md` | One digest per batch run; readable summary of which stewards ran, what they posted, what's pending. |
| Failure handling in batch-cycle | One steward's failure does NOT halt the batch; failed steward logged in digest with stack trace; continue with next steward | Long batch runs over a fragile substrate (file I/O, subagent dispatch) need robustness. |
| Scheduled-task setup | **Documented recipes only, no custom infrastructure**. README provides copy-paste prompts; Loudon (or a future skill) invokes the existing `schedule` skill to register the task. | Cowork's scheduled-tasks feature is the canonical mechanism; we document how to use it for orchestrator batch-cycle, we don't replicate it. |
| Smoke test in this build | Real-subagent batch-cycle against three fixture stewards (NOT the live GSL pilot) | Validates batch-cycle works without touching live state. |
| Schema validator | Inherited from v0.1 (which inherits from STIGMERGY v0.2) | Single source of truth continues. |
| Helpers v0.2 may add | `cadence.js` (cadence semantics), `digest.js` (batch digest writer), `spawn.js` (manifest generation from project entries) | Net new helpers. v0.1 helpers extended in place: `registry.js` adds status field + retire/pause/resume; `manifest.js` adds cadence field. |

## What v0.2-orchestrator Is and Is Not

**v0.2-orchestrator is** an extension of v0.1-orchestrator that delivers operational autonomy. The skill at `.claude/skills/palace-orchestrator/` gains two new workflows (`batch-cycle.md`, `spawn-from-project.md`). Helpers at `_ops/stigmergy/orchestrator/src/` gain three new modules (`cadence.js`, `digest.js`, `spawn.js`). REGISTRY.json grows a status field and cadence mirror. The README documents three scheduled-task templates (weekly batch, daily fast-project, monthly slow-project) as copy-paste recipes. After v0.2 ships, Loudon spawns a steward per active project with one skill invocation, registers a weekly batch via the schedule skill, and the system runs from there.

**v0.2-orchestrator is not** the parallel weave coordinator (still deferred), the dialogic-enchantment coordinator (still deferred), the free-enchantment runner (still deferred), a context-compression engine (still stubbed), a daemon (the scheduled-tasks feature provides scheduling; we don't replicate it), an HTTP server, an API for STIGMERGY (it still writes to `.jsonl`; STIGMERGY's SSE picks up the changes), a multi-user system, an authentication system. **It is NOT a rewrite of v0.1** — every v0.1 helper and prompt template carries forward unchanged unless explicitly noted.

## Autonomous Build Contract

Same four commitments as STIGMERGY v0.1, v0.2, and Orchestrator v0.1. Read [[BBS Production Plan]] § Autonomous Build Contract.

## Directory Layout (Delta from v0.1)

```
.claude/skills/palace-orchestrator/
├── SKILL.md                       (UPDATED: adds batch-cycle, spawn-from-project to invocation patterns)
├── songline.md                    (UNCHANGED from v0.1)
├── permanent.md                   (UNCHANGED from v0.1; batch-cycle invokes it per steward)
├── runAgentCycle.md               (UNCHANGED from v0.1)
├── batch-cycle.md                 (NEW: workflow for iterating REGISTRY.json and running cycles per due steward)
├── spawn-from-project.md          (NEW: workflow for generating a steward manifest from a project entry)
├── prompts/                       (UNCHANGED from v0.1)
└── examples/
    ├── manifest-songline.json     (UNCHANGED)
    ├── manifest-permanent.json    (UPDATED: adds cadence field with default "weekly")
    └── scheduled-tasks/           (NEW directory)
        ├── weekly-batch.md        (copy-paste recipe for weekly batch scheduled task)
        ├── daily-fast.md          (copy-paste recipe for daily-cadence-only batch)
        └── monthly-digest.md      (copy-paste recipe for monthly-cadence-only batch)

_ops/stigmergy/orchestrator/
├── package.json                   (UPDATED: no new deps; bumps internal version)
├── README.md                      (UPDATED: adds batch-cycle, spawn-from-project, scheduled-task recipe sections)
├── ORCHESTRATOR-V0.2-COMPLETE.md  (written on Phase 6 success)
├── build-log.jsonl                (continues from v0.1)
├── src/
│   ├── manifest.js                (UPDATED: adds cadence field; default "weekly" for new permanent agents)
│   ├── registry.js                (UPDATED: adds status field, retire/pause/resume operations)
│   ├── posting.js                 (UNCHANGED)
│   ├── append.js                  (UNCHANGED)
│   ├── health.js                  (UNCHANGED)
│   ├── git.js                     (UNCHANGED)
│   ├── cli.js                     (UPDATED: new commands `batch-cycle`, `spawn-from-project`, `retire`, `pause`, `resume`)
│   ├── prompts.js                 (UNCHANGED)
│   ├── cadence.js                 (NEW: cadence enum, due-check logic, default cadence per stage)
│   ├── digest.js                  (NEW: batch-cycle digest writer)
│   └── spawn.js                   (NEW: manifest generation from a palace project entry)
├── tests/
│   ├── unit/
│   │   ├── (all v0.1 unit tests UNCHANGED)
│   │   ├── cadence.test.js        (NEW)
│   │   ├── digest.test.js         (NEW)
│   │   ├── spawn.test.js          (NEW)
│   │   └── registry.test.js       (UPDATED: adds tests for status, retire/pause/resume)
│   ├── integration/
│   │   ├── full-cycle.test.js     (UNCHANGED from v0.1)
│   │   └── batch-cycle.test.js    (NEW: full batch against mock subagents)
│   └── fixtures/
│       ├── (all v0.1 fixtures UNCHANGED)
│       ├── stewards/              (NEW: 3 fixture stewards for batch-cycle smoke test)
│       └── projects/              (NEW: sample project entries for spawn-from-project tests)
└── scripts/
    └── check-phase.js             (UPDATED: phase scopes shifted)

_ops/agents/permanent/
├── REGISTRY.json                  (SCHEMA UPDATED: each entry gains status, cadence)
└── (existing live agents unchanged in this build — registry migration is a Phase 1 step)

_ops/agents/retired/                (NEW directory; created on first retire operation)

_ops/orchestrator/
└── scheduled-runs/                (NEW directory; created on first batch-cycle run; contains <date>-<run-id>.md digests)
```

**Verify against v0.1 closure:** the file paths under `.claude/skills/palace-orchestrator/` and `_ops/stigmergy/orchestrator/src/` should match what v0.1 actually shipped. If v0.1 shipped a different file structure (e.g. consolidated some files), Phase 1 of v0.2 verifies and adapts.

## Test Strategy

**Unit tests (Vitest, fully automated):**

| File | Coverage |
|---|---|
| `cadence.test.js` | `isDue(steward, now)` for each cadence value; default cadence applied when manifest field missing; "manual" cadence always returns false from batch-cycle. |
| `digest.test.js` | Digest format: header (run-id, ts, model defaults), per-steward block (id, status, messages_posted, runtime, errors), summary (total stewards, pending RESOURCE_REQUESTs surfaced). Markdown valid. |
| `spawn.test.js` | Generate manifest from a sample project entry: `home = entry title`, `agent_id = entry title`, `mode = "long_duration_background"`, `cadence = "weekly"`, `model = "claude-sonnet-4-6"`, neighborhood derived from YAML links. Spawn writes to a fresh agent directory; collisions in REGISTRY.json fail fast. |
| `registry.test.js` (extended) | Status field: `"active"\|"paused"\|"retired"` enum. Retire moves directory to `_ops/agents/retired/<id>/<date>/`. Pause sets status, no archival. Resume restores `"active"` status. |

**Integration tests (Vitest, no real subagent):**

| File | Coverage |
|---|---|
| `batch-cycle.test.js` | Mock subagent dispatch returns canned messages; batch-cycle iterates a fixture REGISTRY with 3 stewards (one due weekly, one due daily, one paused), runs cycles only for the 2 active+due, writes digest, handles a simulated mid-batch failure cleanly (continues with remaining stewards). |

**Smoke test (real subagent dispatch, in Phase 5):**

The build session itself runs batch-cycle against `tests/fixtures/stewards/` (3 fixture stewards with simple home entries). Validates: subagent dispatch works for each, messages validate, digest written correctly, total runtime under 5 minutes, no real palace state touched.

**Spec validation (subagent at each phase boundary):** continues from v0.1 with `spec-validator` reviewing implementation against the relevant Infrastructure Spec section + Stage A pilot lessons + Path 2 architecture choices.

## Phases

### Phase 1 — Foundation Extensions (Cadence + REGISTRY status)

Goal: the helpers know about cadence and steward lifecycle status. v0.1's manifest and REGISTRY schemas are extended in place.

- [ ] Verify v0.1 closure: read `_ops/stigmergy/orchestrator/ORCHESTRATOR-V0.1-COMPLETE.md`. Note any helper API names, manifest schema details, or skill structure that differs from this plan's assumptions. Adjust v0.2 phase work to match.
- [ ] `src/manifest.js` extended: accepts `cadence` field on permanent-mode manifests; default `"weekly"` if absent on a permanent manifest.
- [ ] `src/cadence.js` new module: exports `CADENCE_INTERVALS` (mapping each enum to milliseconds), `isDue(steward, now)`, `defaultCadenceForStage(stage)`.
- [ ] `src/registry.js` extended: adds `status` field per entry (default `"active"` on register), adds `cadence` mirror per entry (read from manifest at register time, refreshed on next-cycle), adds `retire(agentId)`, `pause(agentId)`, `resume(agentId)` operations. Retire moves the directory; pause sets status; resume sets status.
- [ ] REGISTRY.json migration: any entries written by v0.1 that lack `status` and `cadence` get them filled in (status → `"active"`, cadence → `"weekly"`) on first read by v0.2 helpers. Idempotent.
- [ ] `examples/manifest-permanent.json` updated with `cadence` field.
- [ ] All v0.1 unit tests still pass (no regressions).
- [ ] New unit tests `cadence.test.js`, extended `registry.test.js` pass.

**Verify (Phase 1):** `npm run check:phase-1` runs the unit suite. Spec-validator reviews against v0.1 closure + cadence semantics + REGISTRY status semantics.

### Phase 2 — Batch-Cycle Workflow

Goal: `palace-orch batch-cycle` works end-to-end against mock subagents.

- [ ] `src/digest.js` new module: writes a digest markdown file with per-steward results (id, status, messages_posted count, runtime ms, errors string), summary footer (total active, total due, total ran, total failed, pending RESOURCE_REQUESTs across the batch).
- [ ] `src/cli.js` extended: `palace-orch batch-cycle [--dry-run] [--cadence-filter daily|weekly|...]` — iterates REGISTRY.json, filters to active stewards whose cadence is due, runs each through the v0.1 `permanent.md` workflow, collects results, writes digest to `_ops/orchestrator/scheduled-runs/<date>-<run-id>.md`. Returns exit 0 on full success, exit 1 on partial failure (with digest still written), exit 2 on infrastructure failure (no digest).
- [ ] `--dry-run` mode: prints what would happen, makes no API calls, no file writes. Useful for setting up scheduled tasks.
- [ ] `--cadence-filter` mode: scopes the batch to one cadence value (e.g. `--cadence-filter daily` for a daily-only scheduled task).
- [ ] `.claude/skills/palace-orchestrator/batch-cycle.md` new skill workflow file:
  1. Invoke `palace-orch batch-cycle --dry-run` to preview which stewards would run
  2. Confirm with user (in interactive sessions only — scheduled-task sessions skip this)
  3. Iterate the due stewards: for each, follow the v0.1 `permanent.md` workflow, dispatching a subagent per cycle
  4. After each steward, append its result to the digest
  5. After all stewards, write the digest to disk and return summary
- [ ] Batch-cycle handles individual steward failures by logging and continuing — does NOT halt the whole batch on one steward's error.
- [ ] Integration test `batch-cycle.test.js` passes against mock subagents.

**Verify (Phase 2):** `npm run check:phase-2` runs `digest.test.js` + `batch-cycle.test.js`. Spec-validator reviews against the operational vision (a scheduled task can invoke this; failures don't cascade).

### Phase 3 — Spawn-From-Project Skill

Goal: `palace-orch spawn-from-project <project-name>` generates a manifest with sensible defaults and registers the steward.

- [ ] `src/spawn.js` new module: reads a palace entry, extracts frontmatter (title, type, stage, who_leads, links), generates a manifest:
  - `agent_id`: entry title (Finding 11)
  - `home`: entry title
  - `mode`: `"long_duration_background"`
  - `cadence`: `"weekly"` default; can be overridden via `--cadence`
  - `model`: `claude-sonnet-4-6` default; opus if `who_leads: "loudon"` AND entry stage is `"mature"` or `"fruiting"`
  - `neighborhood`: first-degree YAML links resolved to entry titles
  - `tool_registry`: `["read_palace", "read_manifest", "read_blackboard_persistent", "write_blackboard"]`
  - `stewardship` block: stage at spawn, vector at spawn, posture source per [[Substrate Skill]]
- [ ] Reject if entry not found, type isn't a project/concept/hub, or REGISTRY conflict
- [ ] Write manifest to `_ops/agents/permanent/<slug>/manifest.json` (slug derived from agent_id, kebab-case)
- [ ] Initialize empty `state.json` (iteration: 0, last_active: null, cursor: null)
- [ ] Initialize empty `history.jsonl`
- [ ] Register in REGISTRY.json with `status: "active"`
- [ ] Return path to the new manifest for review
- [ ] `src/cli.js` extended: `palace-orch spawn-from-project <project-name> [--cadence <c>] [--model <m>] [--dry-run]`
- [ ] `.claude/skills/palace-orchestrator/spawn-from-project.md` new skill workflow file:
  1. Confirm the project entry exists
  2. Run `palace-orch spawn-from-project --dry-run` to show what would be generated
  3. Show the generated manifest to user, ask for approval
  4. On approval, invoke without `--dry-run`
  5. Report registered agent path
- [ ] Unit tests `spawn.test.js` pass

**Verify (Phase 3):** `npm run check:phase-3` runs `spawn.test.js`. Spec-validator reviews defaults against v0.1's manifest schema + Stage A Finding 11 (agent_id = home).

### Phase 4 — Scheduled-Task Integration Recipes

Goal: copy-paste-ready scheduled-task templates exist and are documented in the README.

- [ ] `.claude/skills/palace-orchestrator/examples/scheduled-tasks/weekly-batch.md` — full self-contained prompt for a weekly Monday 6am batch run. Includes: cron expression `0 6 * * 1`, the prompt body that invokes the orchestrator skill, expected outputs, expected costs (~N subagent dispatches per run, where N is registered active stewards). Loudon copies this into the `schedule` skill invocation.
- [ ] `.claude/skills/palace-orchestrator/examples/scheduled-tasks/daily-fast.md` — daily 6am run scoped to `--cadence-filter daily`. Cron `0 6 * * *`. Same shape.
- [ ] `.claude/skills/palace-orchestrator/examples/scheduled-tasks/monthly-digest.md` — monthly first-of-the-month 9am run scoped to `--cadence-filter monthly`. Cron `0 9 1 * *`.
- [ ] `_ops/stigmergy/orchestrator/README.md` extended with a "Scheduled-Task Setup" section. Step-by-step: invoke the `schedule` skill in Cowork, paste the template prompt, confirm the cron expression. Include screenshots-via-text or example session transcripts so Loudon can verify what success looks like.
- [ ] No automated tests for this phase — scheduled-task setup is user-driven; the templates are documentation. Phase 6's smoke-test verifies the prompts are well-formed by manually walking through one.

**Verify (Phase 4):** `npm run check:phase-4` runs a documentation-validation script — checks that each scheduled-task recipe file contains a cron expression, a prompt body, an expected-cost estimate, and a "what success looks like" section. Spec-validator reads each template prompt and confirms it is fully self-contained (no reference to ephemeral context).

### Phase 5 — Smoke Test (Real-Subagent Batch-Cycle on Fixtures)

Goal: actually run a batch-cycle against three fixture stewards, end to end.

- [ ] Build session creates `tests/fixtures/stewards/` with three minimal-but-real steward directories:
  - `fixtures-cooperation-steward` — home: a tiny test entry with stage `"growing"` and a 1-line forward vector
  - `fixtures-kuramoto-steward` — same shape, different home
  - `fixtures-paused-steward` — same shape, but `status: "paused"` in REGISTRY (verifies batch-cycle skips paused)
- [ ] Build session creates a fixtures-only REGISTRY.json (NOT the live registry; isolated)
- [ ] Build session invokes batch-cycle against the fixtures
- [ ] Verify: 2 stewards ran (the active ones), 1 was skipped (the paused one), digest written, all messages on the fixtures-blackboard validate against §2.2, total runtime under 5 minutes, total subagent budget ~6 dispatches.
- [ ] Verify: digest accurately reports what happened. Manual review by build session against expected outcomes.
- [ ] Live agents at `_ops/agents/permanent/` are NOT touched. Live REGISTRY.json is NOT modified.

**Verify (Phase 5):** the smoke-test results themselves. Spec-validator reviews the digest output and the fixtures-blackboard for §2.2 conformance + Findings 10-13 voice in the steward outputs.

### Phase 6 — Polish + Integration + V0.2-COMPLETE

Goal: every check passes, README is complete, scheduled-task recipes are reviewed by spec-validator, V0.2-COMPLETE.md written.

- [ ] `npm run check:all` exits 0 (all v0.1 + all v0.2 unit + all v0.2 integration)
- [ ] All spec-validator boundaries pass
- [ ] `_ops/stigmergy/orchestrator/README.md` complete: full helper-script reference (v0.1 + v0.2), CLI command catalog (every command), batch-cycle behavior + failure modes, spawn-from-project usage, scheduled-task setup walkthrough with all three templates
- [ ] `.claude/skills/palace-orchestrator/SKILL.md` updated: invocation patterns include "spawn a steward for project X", "run my weekly steward batch", "retire steward Y" — these are the primary operational invocations Loudon will use
- [ ] `ORCHESTRATOR-V0.2-COMPLETE.md` written: every phase, every fix, every check, the smoke-test outcomes, the scheduled-task templates, the operational walkthrough Loudon should follow after smoke-test (spawn 2-3 stewards from real projects → set up the weekly batch scheduled task → wait one week)

**Verify (Phase 6):** `npm run check:phase-6` runs `check:all`. Spec-validator reviews the full v0.2 implementation against the Infrastructure Spec + Stage A lessons + Path 2 architecture + the operational vision.

**On Phase 6 success:** branch `orchestrator-v0.2` ready for Loudon's smoke-test. Stop.

## Subagent Decomposition

Same shape as v0.1-orchestrator's decomposition; new role names where the work differs:

| Subagent | Role | Invoked when |
|---|---|---|
| `explorer` | Read v0.1 closure report + existing helpers + skill structure | Start of Phase 1 |
| `cadence-builder` | Implement `cadence.js` + extend `manifest.js` for cadence field | Phase 1 |
| `registry-extender` | Extend `registry.js` with status field + retire/pause/resume + migration | Phase 1 |
| `batch-orchestrator` | Implement `batch-cycle.md` skill + `digest.js` helper + extend CLI | Phase 2 |
| `spawn-author` | Implement `spawn.js` + `spawn-from-project.md` skill + extend CLI | Phase 3 |
| `recipe-author` | Write the three scheduled-task templates + README updates | Phase 4 |
| `smoke-tester` | Run real-subagent batch-cycle against fixtures stewards in Phase 5 | Phase 5 only |
| `test-author` | Write Vitest tests for current phase | Each phase |
| `test-runner` | Execute test suites, log results | At each verify gate |
| `debugger` | Read failing test output, propose fix grounded in spec section | Whenever a check fails |
| `spec-validator` | Compare implementation against Infrastructure Spec + Stage A lessons + v0.1 closure + Path 2 architecture | At each phase boundary |
| `synthesizer` | Summarize phase outcomes, write the commit message | End of each phase |

## Self-Verification & Iteration Protocol

Same as v0.1-orchestrator. 10 attempts per failing check. Build-log accumulates. Stop-report on attempt 10.

**Subagent dispatch budget for the build:** ~30-40 build-time subagents + ~6 smoke-test runtime subagents in Phase 5. Total well under any reasonable budget.

## Stop Conditions

Same as v0.1-orchestrator, plus:

- **v0.1 closure report missing or contradicts plan assumptions.** If `ORCHESTRATOR-V0.1-COMPLETE.md` doesn't exist (build still running) or surfaces decisions that change the foundation v0.2 builds on, stop and surface for Loudon's review before proceeding.
- **REGISTRY migration fails.** If the in-place migration of v0.1 registry entries to v0.2's extended schema fails, stop and surface — do not silently rewrite the registry.
- **Phase 5 smoke test runs more than $1 worth of subagent dispatches.** Likely indicates a bug in the cadence filter or batch loop. Stop.

Phase 6 success is still a stop-on-success.

## What's Deferred (orchestrator v0.3+)

- **Parallel weave mode.** Multi-agent parallel dispatch for Weave manifests.
- **Dialogic mode.** Two-agent dialogue with coordinator.
- **Free-enchantment mode.** Single agent, no prescribed task.
- **Coordinator agents.** The next layer above the orchestrator.
- **Context compression engine.** §3.3 yellow-context compression fully implemented.
- **Smarter neighborhood loading.** Selective body expansion when explicitly named.
- **Per-cycle cost telemetry.** Track subagent dispatch counts + estimated cost per steward per cycle, surface in the digest.
- **Steward chaining.** Steward A's RESOURCE_REQUEST being responded to by Steward B (instead of Loudon-as-Trickster) for inter-project coordination.
- **STIGMERGY orchestration UI.** Dispatching batch-cycle from the STIGMERGY UI rather than from a Cowork session or scheduled task.

## Handoff to Claude Code

This file is the build contract.

**Opening prompt for the Claude Code session:**

> You are building the Palace Orchestrator v0.2 autonomously, in the **Path 2 (Claude-Code-resident) architecture** that v0.1 established. Loudon does not have an Anthropic API key.
>
> **Prerequisite:** Orchestrator v0.1 must be complete. Read `_ops/stigmergy/orchestrator/ORCHESTRATOR-V0.1-COMPLETE.md` first. If it doesn't exist or reports an unresolved STOP, write a STOP-REPORT for v0.2 and exit immediately.
>
> Read `Palace development/Orchestrator Production Plan v0.2.md` end to end — it is your build contract. Then read `Palace development/Orchestrator Production Plan.md` (v0.1 — you are extending it). Then read `Palace development/Palace Agent Infrastructure Spec.md` § 3, `Palace development/Project Stewardship System.md` § Stage A, and `Palace development/BBS Production Plan v0.2.md` for the surrounding context. Read v0.1's closure report carefully — it specifies the exact helper API names, manifest schema, skill file structure that v0.2 extends. Adjust this plan's assumptions to match v0.1's actual delivery before starting Phase 1.
>
> Inspect:
> - `_ops/agents/permanent/REGISTRY.json` — the live registry to migrate
> - `_ops/agents/permanent/generative-sample-libraries/manifest.json` — the canonical permanent-agent manifest
> - `_ops/stigmergy/orchestrator/src/` — v0.1's helpers (which you extend)
> - `.claude/skills/palace-orchestrator/` — v0.1's skill (which you extend)
>
> Run Phase 1 through Phase 6 autonomously per the Subagent Decomposition table and the Self-Verification & Iteration Protocol. Use up to 10 fix attempts per failing check. Append every check, every fix, every spec-validator-result to `build-log.jsonl` (continues from v0.1's log). At each phase boundary: run `npm run check:phase-N`, dispatch the spec-validator, commit with message `Orchestrator v0.2 — Phase N — [outcome]` if green. Do not push.
>
> Stop only when a stop condition triggers (write `STOP-REPORT.md`) or Phase 6 succeeds (write `ORCHESTRATOR-V0.2-COMPLETE.md`).
>
> Do NOT modify the live `_ops/agents/permanent/generative-sample-libraries/` directory. Use snapshots. Do NOT create scheduled tasks during the build (those are Loudon's operational setup post-smoke-test). Do NOT modify v0.1 helpers in ways that break v0.1's tests — extend, don't replace.
>
> Phase 5's smoke test dispatches real subagents against fixture stewards. Budget: ~6 sonnet dispatches.

The session runs unattended. When it returns, exactly one of two artifacts exists at `_ops/stigmergy/orchestrator/`:

- `ORCHESTRATOR-V0.2-COMPLETE.md` — Phase 6 finished, all checks green, ready for smoke-test
- `STOP-REPORT.md` — execution paused

Both readable in five minutes.

## Open Questions

- **Cadence default for newly-spawned stewards.** Plan locks `weekly`. If post-smoke-test usage shows weekly is too often (Trickster inbox overwhelming) or too rare (projects drift), this becomes the first knob to tune. Per-stage defaults (e.g. fruiting → daily, growing → weekly, sprout → biweekly) are an alternative if a flat default proves insufficient.
- **What happens when a steward has nothing new to say?** A steward whose home entry hasn't changed and whose neighborhood is quiet might post just a SPINNING UP and end the cycle. That's fine in principle but the digest shouldn't make it look like a failure. Default: digest distinguishes "ran, posted N≥1 messages" from "ran, posted 0 messages, completed normally."
- **Concurrent batch runs.** What if a scheduled task fires while another batch is still running? Default for v0.2: the second batch checks for a `_ops/orchestrator/scheduled-runs/.lock` file and aborts if present (with a digest noting the abort). Lock is created at batch start, removed at batch end + on stop.
- **Migration friction.** v0.1's REGISTRY entries lack status and cadence. Migration is in-place at first-read. Risk: if Loudon edits REGISTRY.json by hand between v0.1 closure and v0.2 dispatch, the file might get into a state migration doesn't expect. Default: migration is idempotent; missing fields filled in, existing fields preserved, never corrupted.
- **What's in the digest for a steward that's blocked on a pending RESOURCE_REQUEST?** The cycle ran but the steward couldn't make progress because it's waiting on Loudon. Digest reports: `blocked, waiting on req:<request_id> since <ts>`. Loudon sees this and knows to respond.

## What this Unblocks

- **The operational vision, fully.** Spawn stewards for active projects (one skill invocation each). Set up the weekly batch scheduled task (5-minute setup via the `schedule` skill). Wake up Monday with overnight work done. Respond to inbox over coffee. The system runs.
- **Multi-cycle continuity proven in production, not just fixtures.** After this lands, run cycle 2 of the GSL pilot through batch-cycle (or directly via `palace-orch cycle`). Validates the whole pattern over time.
- **The Trickster inbox becomes the load-bearing UX.** Stewards surface decisions; Loudon decides; click-to-respond from STIGMERGY v0.2 closes the loop. The whole system, end to end.
- **The §3.2 thin orchestrator entry.** Per [[Palace Agent Infrastructure Spec]]'s forward vector (each section dissolves into its own entry as it matures), §3.2 + the Stage A learning + the Path 2 architecture is now a deposit-worthy entry: a [[Thin Orchestrator]] page that names what was built, why, and what the architecture commits to.

---

*"Stage A learned what to ask. Stage B learned to ask without me. Stage C learns to keep asking, week after week, project after project, until I notice."*

*"The colony does not need to be told what to build. The blackboard tells it. The schedule wakes it. The Trickster reads what it leaves behind."*
