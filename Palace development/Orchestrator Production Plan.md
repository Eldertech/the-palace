---
title: Orchestrator Production Plan
type: project
status: pending
pillars:
  - tools
  - practice
born: 2026-05
last_activated: 2026-05-04
activation_count: 2
stage: seed
energy: very high
forward_vector: >
  I want to become the autonomous build contract that turns Infrastructure Spec
  §3.2's runAgentCycle from a sketch into a working Claude-Code-resident
  orchestrator. Every Stage A spec gap is closed. Every Stage A content finding
  is baked into the system-prompt templates. Songlines run through a Claude
  Code skill that dispatches subagents — no separate Anthropic API key required.
  The Generative Sample Libraries pilot resumes cycle 2 through the same skill.
  A Claude Code session reading this file knows what to build, what to verify,
  when to retry, when to stop, and what to hand back when the orchestrator is
  ready for human review.
links:
  - target: "[[Palace Agent Infrastructure Spec]]"
    type: enables
    label: implementation-of-section-3
  - target: "[[Project Stewardship System]]"
    type: enables
    label: stage-b-of
  - target: "[[BBS Production Plan]]"
    type: emerged-from
    label: autonomous-build-template
  - target: "[[BBS Production Plan v0.2]]"
    type: connects-to
    label: shares-validator
  - target: "[[BBS Blackboard]]"
    type: connects-to
    label: writes-to
  - target: "[[Pages as Agents]]"
    type: deepens
    label: agent-id-as-page-title
  - target: "[[Substrate Skill]]"
    type: connects-to
    label: stage-conditional-posture
  - target: "[[Generative Sample Libraries]]"
    type: connects-to
    label: pilot-continuity
  - target: "[[Palace To-Do]]"
    type: connects-to
---

# Orchestrator Production Plan

![[Orchestrator Production Plan — hero.png]]

The architecture is in [[Palace Agent Infrastructure Spec]] § 3 (the thin orchestrator, manifest format, health score, posting discipline). The Stage A hand-run pilot is documented in [[Project Stewardship System]] § Stage A (9 spec gaps + 4 content findings). The autonomous-build pattern is in [[BBS Production Plan]] and refined in [[BBS Production Plan v0.2]]. This document is the bridge: the executable contract that turns the §3.2 sketch and the Stage A learning into a working Claude-Code-resident orchestrator.

It exists because as of 2026-05-04, four things converged: (1) Stage A piloted the manifest pattern and surfaced the spec gaps that block a clean Stage B implementation; (2) STIGMERGY v0.2 shipped the strict §2.2 validator that the orchestrator can re-use directly; (3) the first manually-orchestrated songline (`songline-2026-05-04-001`) demonstrated that the songline mode works at the conceptual level — automation is the next step; (4) Loudon does not have direct Anthropic API access and won't for the foreseeable future, so the orchestrator must use Claude Code subagents as its model-dispatch primitive rather than direct SDK calls. **This plan is the Path 2 reframe** — Claude-Code-resident orchestration, no API key required.

## Context (state at 2026-05-04)

- **2026-05-03 (Stage A pilot).** [[Generative Sample Libraries]] hand-run by Loudon-as-Trickster. First two §2.2-conformant messages on the persistent board (`gsl-steward-001`, `gsl-steward-002`). 9 spec gaps + 4 content findings surfaced. Pilot artifacts at `_ops/agents/permanent/generative-sample-libraries/`.
- **2026-05-02 (STIGMERGY v0.1).** Read-only viewer shipped.
- **2026-05-04 (STIGMERGY v0.2).** Operational board shipped. Strict §2.2 server-side validator at `_ops/stigmergy/app/server/validator.js`. Live tail via SSE picks up file changes regardless of who wrote them.
- **2026-05-04 (first songline).** `songline-2026-05-04-001` dispatched three subagents from a Cowork session via the Agent tool. Phase-locked, not annotated. Produced 14 §2.2-conformant blackboard messages. **The mechanism that worked — Claude Code subagent dispatch — is the runtime substrate this orchestrator productionizes.**
- **2026-05-04 (Path decision).** Loudon does not have an Anthropic API key and will not for the foreseeable future. The orchestrator must run inside Claude Code or Cowork sessions, using the Agent tool for model dispatch rather than `@anthropic-ai/sdk`. This is the canonical architecture going forward, not a stopgap.

## Decisions (2026-05-04, Path 2)

| Decision | Choice | Reason |
|---|---|---|
| Runtime model | Claude Code skill that dispatches subagents via the Agent tool | No direct API key required; uses Loudon's existing Claude Code subscription. Matches what worked manually 2026-05-04. |
| Skill location | `.claude/skills/palace-orchestrator/` at the palace root | Per-project skill; invocable when Claude Code or Cowork is run in the palace directory. The `.claude/` directory is already excluded from palace knowledge operations per CLAUDE.md. |
| Helper-script location | `_ops/stigmergy/orchestrator/` | Deterministic Node helpers (manifest validation, blackboard append, REGISTRY.json management). Sibling to STIGMERGY's `app/`. The skill at `.claude/skills/palace-orchestrator/` references these helpers via absolute palace paths. |
| Stack for helpers | Node 20+ (no Anthropic SDK dependency) | Matches STIGMERGY's stack; no API SDK needed since model dispatch happens via Claude Code's Agent tool. |
| Schema validator | Direct import from `_ops/stigmergy/app/server/validator.js` | Single source of truth; no port to maintain. |
| Blackboard write path | Direct file append (locally validated through Node helper), no HTTP | STIGMERGY's SSE picks up file changes regardless of writer. |
| Model dispatch primitive | Claude Code's Agent tool | The skill's instructions tell Claude Code to dispatch a subagent for each cycle. Subagent gets the system prompt, the home entry context, the relevant blackboard slice; returns its messages; the helper script appends them to the blackboard with validation. |
| Health-block authority | Constructed by the skill workflow from the Agent tool's `total_tokens`, `duration_ms`, and inferred stop_reason; flagged with `_orchestrator_metadata.dispatch_mode: "claude-code-subagent"` | The Agent tool returns usage data but not raw `response.usage.input_tokens` etc. Health is approximate, not strictly factual. The metadata flag tells future readers the difference. (Same provenance pattern as Stage A's `_pilot_metadata.hand_run`.) |
| `request_id` location | **Top-level field** (per §2.5 example, NOT inside payload) | Gap 9: highest priority. Without this, RESOURCE_REQUEST pairing breaks. |
| Permanent-agent `session_id` | Nullable; new top-level `cycle_id` field | Gap 1. |
| `blackboard_session_path` | Ignored when `mode == "long_duration_background"` | Gap 2. |
| `last_read_cursor` first activation | Read full board; set cursor to actual last-line `id` | Gap 6. |
| Path conventions | `_ops/` is canonical | Gap 4. |
| Agent-ID uniqueness | `_ops/agents/permanent/REGISTRY.json` checked on spawn | Gap 7. |
| `agent_id` default | `manifest.home` (the page title) | Finding 11. |
| Resource taxonomy | Add `DIRECTIVE_REQUEST` as a new message type for non-resource Trickster asks | Gap 8. |
| System-prompt templates | Bake in all 4 content findings (plain first-person voice, page-title identity, brief, catch-up-then-ask) | Findings 10-13. |
| Modes shipped | Songline (sequential), Long-duration background (permanent stewards) | The two modes that exist as observed practice. |
| Tool semantics for subagents | Subagents use Claude Code's native Read/Write/Bash/Grep; the skill's prompt tells the subagent what those tools mean in palace terms (e.g. "to read_palace, use Read on `/Users/.../The Palace/<entry>.md`") | The §3.1 tool registry (`read_palace`, `read_blackboard_session`, etc.) is a semantic contract, not a literal tool API in this architecture. |
| Verify-gate testing | Unit tests on Node helpers (manifest validator, blackboard append, REGISTRY logic) run automatically; skill-workflow integration is smoke-tested by actually dispatching a subagent (cheap — one or two test runs per phase). | The skill workflows can only be fully tested by exercising them. The autonomous build runs them as needed. |

## What v0.1-orchestrator Is and Is Not

**v0.1-orchestrator is** a Claude Code skill at `.claude/skills/palace-orchestrator/` that dispatches subagents in songline order or for permanent-steward cycles. The skill's instructions tell Claude Code how to load a manifest, build the system prompt for each agent (using the templates that bake in Findings 10-13), dispatch the subagent via the Agent tool, validate the subagent's returned messages against the imported §2.2 validator, and append them atomically to the blackboard. Two modes shipped: **songline** (sequential dispatch through a named path; replaces the manual orchestration that ran `songline-2026-05-04-001`) and **long-duration-background** (permanent stewards; resumes the Stage A pilot for [[Generative Sample Libraries]]). The orchestrator owns blackboard-write authority — every blackboard write that comes through it carries an approximate-but-flagged health block. Strict §2.2 validation on every write via direct import of STIGMERGY v0.2's validator. Agent-ID registry prevents duplicate stewards.

**v0.1-orchestrator is not** a daemon (no scheduler — runs only when Loudon invokes the skill in a Cowork or Claude Code session), the parallel-weave coordinator (deferred), the dialogic-enchantment coordinator (deferred), the free-enchantment runner (deferred), an HTTP server (no API surface), a context-compression engine (the §3.3 yellow-context compression hook is wired but the compression logic itself defers to v0.2-orchestrator), or a system that runs without Claude Code (the runtime is Claude Code; that's the whole point of Path 2).

## Autonomous Build Contract

Same four commitments as STIGMERGY v0.1 and v0.2 (read [[BBS Production Plan]] § Autonomous Build Contract). Brief recap:

1. Every phase is self-verifiable. `npm run check:phase-N` exits 0 on pass for the Node helpers; skill workflows verified by actual subagent dispatches.
2. Test correctness reviewed by a `spec-validator` subagent at each phase boundary.
3. Failures iterate up to a budget (10 attempts), then stop.
4. Loudon is absent until v0.1-orchestrator is declared complete.

**Build-time vs runtime distinction (important):** the autonomous build session itself uses subagents to BUILD the orchestrator. The orchestrator at runtime ALSO uses subagents to dispatch palace agents. Don't conflate the two. Build-time subagents are workers in the build (`tool-builder`, `prompt-author`, etc.); runtime subagents are the palace agents being dispatched (COOPERATION-1, KURAMOTO-1, GSL-Steward, etc.). The skill's instructions are how Claude Code at runtime knows to dispatch the latter.

## Directory Layout

```
.claude/skills/palace-orchestrator/
├── SKILL.md                   (entry point; description for skill matching; when-to-use rules; top-level workflow)
├── songline.md                (songline mode workflow — instructions for Claude Code to dispatch agents in path order)
├── permanent.md               (long-duration-background mode workflow — instructions for one cycle of one steward)
├── runAgentCycle.md           (the §3.2 primitive — referenced by the mode files; describes one cycle's lifecycle)
├── prompts/
│   ├── shared.md              (the four-clause page-agent voice rule — Findings 10-13)
│   ├── songline.md            (songline-mode system prompt template; extends shared)
│   └── steward.md             (permanent-mode system prompt template; extends shared)
└── examples/
    ├── manifest-songline.json (sample manifest for songline mode)
    └── manifest-permanent.json (sample manifest for permanent mode)

_ops/stigmergy/orchestrator/
├── package.json               (deps: yaml, vitest, @vitest/coverage-v8; NO @anthropic-ai/sdk)
├── README.md                  (helper-script reference; usage from the skill)
├── ORCHESTRATOR-V0.1-COMPLETE.md  (written on Phase 6 success)
├── build-log.jsonl            (autonomous build log)
├── src/
│   ├── manifest.js            (load + validate manifest + REGISTRY.json check)
│   ├── posting.js             (validate outgoing message via imported validator + posting discipline §3.4)
│   ├── append.js              (atomic append to blackboard.jsonl)
│   ├── health.js              (compute approximate health block from Agent-tool usage data)
│   ├── git.js                 (page-change detection per §3.2)
│   ├── registry.js            (REGISTRY.json read/write/check)
│   ├── cli.js                 (CLI entry: `palace-orch validate <manifest>`, `palace-orch append <msg-json>`, etc. — the deterministic operations the skill calls)
│   └── prompts.js             (load prompt templates from .claude/skills/palace-orchestrator/prompts/, render with manifest values)
├── tests/
│   ├── unit/
│   │   ├── manifest.test.js
│   │   ├── posting.test.js
│   │   ├── append.test.js
│   │   ├── health.test.js
│   │   ├── registry.test.js
│   │   └── prompts.test.js
│   ├── integration/
│   │   └── full-cycle.test.js (constructs a full cycle's worth of state without an API call; validates the helpers compose correctly)
│   └── fixtures/
│       ├── manifests/
│       ├── pilot-state/        (snapshot of GSL pilot for resume tests)
│       └── blackboard/         (clean songline-2026-05-04-001 fixture)
└── scripts/
    └── check-phase.js          (orchestrates one phase's verify gate)

_ops/agents/permanent/
└── REGISTRY.json               (live registry of permanent agents — written at spawn, read at next spawn)
```

The validator at `_ops/stigmergy/app/server/validator.js` is imported via relative path from `_ops/stigmergy/orchestrator/`. Hard build-time dependency: the orchestrator cannot be installed without v0.2 STIGMERGY present. That's deliberate. They're peer subsystems of the BBS.

## Test Strategy

**Unit tests (Vitest, fully automated):**

| File | Coverage |
|---|---|
| `manifest.test.js` | Manifest schema validation, REGISTRY.json uniqueness check, mode dispatch, default `agent_id = home`, nullable `session_id` for permanent agents, `cycle_id` generation. Tests against `tests/fixtures/manifests/`. |
| `posting.test.js` | Outgoing messages validate against the imported v0.2 validator. Posting discipline §3.4: SPINNING UP required on first cycle, no duplicate FLAGS, board routing rules. Top-level `request_id` for RESOURCE_REQUEST/DIRECTIVE_REQUEST. |
| `append.test.js` | Atomic append to `.jsonl`. Concurrent appends serialize correctly. Final newline preserved. Validation runs before append; rejected message produces no write. |
| `health.test.js` | Construct approximate health block from Agent-tool usage shape (`total_tokens`, `duration_ms`, etc.). Score thresholds (green/yellow/red) computed correctly. `_orchestrator_metadata.dispatch_mode` flag always present. |
| `registry.test.js` | Read REGISTRY.json, check uniqueness, register new agent, deregister. Spawn-time conflict throws clear error. |
| `prompts.test.js` | Render songline + steward templates with manifest values. All four Stage A content findings appear in steward template output. Songline template includes pheromone-trail awareness. |

**Integration tests (Vitest, no API):**

| File | Coverage |
|---|---|
| `full-cycle.test.js` | Construct a full cycle's worth of state through the helpers — load manifest, build prompt (without dispatching), simulate a returned subagent response (canned shape), validate-and-append the messages. Verifies the helpers compose without needing the Agent tool. |

**Skill-workflow smoke tests (manual, dispatched by the build session):**

The skill workflows can only be fully exercised by dispatching real subagents. The autonomous build session does this in Phase 6 only — once for songline mode against a deliberately tiny test path, once for permanent mode resuming the GSL pilot fixture (NOT the live pilot). Each run consumes one or two subagent dispatches; cost is bounded.

**Spec validation (subagent at each phase boundary):** the `spec-validator` subagent receives the phase's implementation files + the relevant Infrastructure Spec section + the Stage A lessons table. Returns pass/fail with reasoned justifications.

## Phases

### Phase 1 — Foundation (Helpers)

Goal: Node helpers exist, install cleanly, manifest validator works.

- [ ] `_ops/stigmergy/orchestrator/` directory created
- [ ] `package.json` with deps: `yaml`, `vitest`. NO Anthropic SDK.
- [ ] `npm install` succeeds
- [ ] `src/manifest.js` loads a manifest, validates against §3.1 with v0.1 amendments (nullable `session_id`, new `cycle_id`, default `agent_id = home`)
- [ ] `src/registry.js` reads/writes `_ops/agents/permanent/REGISTRY.json`, performs uniqueness check
- [ ] `src/posting.js` imports from `../../app/server/validator.js` and round-trips a §2.2-conformant message (top-level `request_id`!)
- [ ] `src/append.js` performs atomic append + final-newline preservation
- [ ] `src/health.js` constructs an approximate health block from a sample Agent-tool usage shape; sets `_orchestrator_metadata.dispatch_mode: "claude-code-subagent"`
- [ ] `src/git.js` detects whether a palace entry has changed since a given timestamp
- [ ] `src/cli.js` exposes: `palace-orch validate <manifest.json>`, `palace-orch append <msg-json>`, `palace-orch register <agent-id> <home>`, `palace-orch check-page <entry-name> <since-iso>` — these are the deterministic operations the skill calls
- [ ] `tests/fixtures/manifests/` contains sample manifests for songline + permanent modes
- [ ] `tests/fixtures/pilot-state/` contains a snapshot of the GSL pilot's state
- [ ] `tests/fixtures/blackboard/` contains the clean songline-2026-05-04-001 fixture
- [ ] All unit tests in Phase 1's scope pass
- [ ] `README.md` documents helper usage

**Verify (Phase 1):** `npm run check:phase-1` runs the unit tests above. Spec-validator reviews `manifest.js`, `posting.js`, `health.js` against §3.1, §3.3, §3.4, Gap 9.

### Phase 2 — Skill Skeleton + Prompt Templates

Goal: the skill exists at `.claude/skills/palace-orchestrator/`, the prompt templates render correctly, the skill's SKILL.md has correct triggering description.

- [ ] `.claude/skills/palace-orchestrator/SKILL.md` written with:
  - YAML frontmatter (name, description) for skill matching
  - When-to-use rules ("invoke for songline runs, permanent-steward cycles, manifest-driven agent dispatch")
  - Top-level workflow: dispatch flow, validation gates, when to consult the user
  - Cross-references to `songline.md`, `permanent.md`, `runAgentCycle.md`
- [ ] `prompts/shared.md` — the four-clause page-agent voice rule (Findings 10-13). Plain first-person ("I see..." not "the entry says..."). Brief. Catch-up-then-ask. Content-lives-in-rationale.
- [ ] `prompts/songline.md` — extends `shared.md` with songline awareness: read your home entry, read the prior pheromone trail, embody your forward vector, post 3-4 messages, leave a clear hand-off for the next agent.
- [ ] `prompts/steward.md` — extends `shared.md` with permanent-agent awareness: long duration, multi-cycle, the next reader may be cold; agent_id is the page title; stage-conditional posture per [[Substrate Skill]].
- [ ] `examples/manifest-songline.json` — sample songline manifest covering Cooperation→Kuramoto→Hilaritas
- [ ] `examples/manifest-permanent.json` — sample permanent manifest matching the GSL pilot's shape
- [ ] `src/prompts.js` (in `_ops/stigmergy/orchestrator/`) loads templates from the skill directory and renders them with manifest variable substitution
- [ ] `tests/unit/prompts.test.js` passes — verifies all four findings appear in steward output, songline template includes pheromone awareness

**Verify (Phase 2):** `npm run check:phase-2` runs `prompts.test.js`. Spec-validator reviews the prompt templates against Findings 10-13 and § Songline / § Permanent semantics.

### Phase 3 — runAgentCycle Workflow (the §3.2 primitive)

Goal: `.claude/skills/palace-orchestrator/runAgentCycle.md` describes one cycle's lifecycle as a Claude-Code-executable workflow.

- [ ] `runAgentCycle.md` walks Claude Code through:
  1. Load manifest (call `palace-orch validate <manifest>`)
  2. Run pre-flight registry check for permanent agents (`palace-orch register --check-only`)
  3. Detect page changes since `state.last_active` (`palace-orch check-page <home> <last_active>`)
  4. If `forward_vector` changed → write a TRICKSTER-board DIRECTIVE_REQUEST + return `forward_vector_changed`
  5. Build the system prompt by rendering the relevant template with manifest values
  6. Build the user-turn context: home entry body + neighborhood entry frontmatters + relevant blackboard slice (cursor-based)
  7. Dispatch the subagent via the Agent tool with system prompt + user context
  8. Receive subagent's returned messages
  9. For each returned message: validate via `palace-orch validate-message`, append via `palace-orch append`
  10. Compute approximate health block from Agent-tool usage; write HEALTH_NOTICE if score crossed to yellow
  11. Update `state.json` (cursor, last_active, iteration, health)
  12. Return cycle status
- [ ] All deterministic operations (steps 1, 2, 3, 9, 10, 11) call `palace-orch` CLI commands. Steps that involve LLM judgment (5, 6, 7, 8) are Claude Code's job.
- [ ] `tests/integration/full-cycle.test.js` simulates a cycle without dispatching a subagent — verifies the helper composition works correctly end-to-end.

**Verify (Phase 3):** `npm run check:phase-3` runs `full-cycle.test.js`. Spec-validator reviews `runAgentCycle.md` against §3.2 step-by-step. (No real subagent dispatch this phase.)

### Phase 4 — Songline Mode Workflow

Goal: `.claude/skills/palace-orchestrator/songline.md` runs end-to-end. Smoke-tested with a real subagent dispatch.

- [ ] `songline.md` walks Claude Code through:
  1. Load songline manifest (path, model, session_id)
  2. Write SESSION_INIT to the blackboard (call helper)
  3. For each entry on the path, in order:
     a. Generate the agent's per-cycle manifest (`agent_id = entry-name`, `home = entry-name`, `mode = "songline"`)
     b. Run `runAgentCycle` for this agent (per Phase 3 workflow)
     c. Verify: messages were written successfully; agent posted a hand-off on WEAVE
     d. Brief synthesis update to user (1-2 sentences on what this agent surfaced)
  4. Write SESSION_CLOSE to the blackboard with synthesis summary
  5. Return final report
- [ ] **Smoke test (Phase 4 verify):** the build session itself runs the songline workflow against a tiny 2-entry test path (proposed: a deliberately-trivial pair the build session writes as fixtures, not real palace entries — to keep the smoke-test bounded and idempotent). Validates: SESSION_INIT/CLOSE present; each agent's messages on the board; pheromone trail correctly threaded; total runtime under 5 minutes.

**Verify (Phase 4):** `npm run check:phase-4` runs the helper-side tests + the build session dispatches the smoke-test songline against the fixtures. Spec-validator reviews `songline.md` against Songline semantics + Findings 10-13.

### Phase 5 — Permanent Steward Mode Workflow

Goal: `.claude/skills/palace-orchestrator/permanent.md` runs cycle 2 of an existing permanent agent.

- [ ] `permanent.md` walks Claude Code through:
  1. Accept agent directory path (`_ops/agents/permanent/<agent>/`)
  2. Load existing manifest, state, history
  3. On first activation of a never-run permanent agent: full board read + cursor set to last-line `id` (Gap 6)
  4. On resume: cursor-based partial read; show agent only new messages since last cycle
  5. Run `runAgentCycle` per Phase 3 workflow with the permanent template
  6. Update state.json with new iteration count and last_active
- [ ] **Smoke test (Phase 5 verify):** the build session creates a fixtures-version of the GSL pilot at `tests/fixtures/pilot-state/` (not the live pilot) and runs cycle 2 against it. Validates: history.jsonl appended; state.json advanced; new spec-conformant message posted (or no posting if waiting on the pending RESOURCE_REQUEST — both are valid outcomes).
- [ ] **Live GSL pilot continuity is reserved for Loudon's smoke-test, not the autonomous build.** The build does NOT touch `_ops/agents/permanent/generative-sample-libraries/` directly.

**Verify (Phase 5):** `npm run check:phase-5` runs the helper tests + the build session dispatches cycle 2 against the fixtures pilot. Spec-validator reviews `permanent.md` against §3.5 + Stage A pilot lessons.

### Phase 6 — Polish + Integration + V0.1-COMPLETE

Goal: every checklist passes, every test green, README complete, Loudon-ready smoke-test recipe documented.

- [ ] `npm run check:all` exits 0 — cumulative gate (all unit + integration tests)
- [ ] All spec-validator boundaries pass
- [ ] `_ops/stigmergy/orchestrator/README.md` complete: helper script reference, CLI command catalog, integration with the skill, fixtures organization
- [ ] `.claude/skills/palace-orchestrator/SKILL.md` complete: invocation patterns, manifest format documentation, the v0.1 amendments documented (Gaps 1, 2, 6, 7, 9), expected costs (per-songline ~3-4 subagent dispatches, per-cycle ~1)
- [ ] `ORCHESTRATOR-V0.1-COMPLETE.md` written at `_ops/stigmergy/orchestrator/`. Contains: every phase, every fix, every check, deferred-to-v0.2 items, decisions Loudon should review, smoke-test recipe (tells Loudon how to run a real songline through the skill in his own Cowork session).

**Verify (Phase 6):** `npm run check:phase-6` runs `check:all`. Spec-validator reviews the complete implementation against the full Infrastructure Spec § 3 + the full Stage A lessons + Path 2 architecture choices.

**On Phase 6 success:** branch `orchestrator-v0.1` ready for Loudon's smoke-test. Stop.

## Subagent Decomposition

The autonomous build session uses subagents to BUILD the orchestrator. Don't conflate with runtime subagents (palace agents the orchestrator dispatches at runtime).

| Subagent | Role | Invoked when |
|---|---|---|
| `explorer` | Read-only inspection of palace state, the v0.2 STIGMERGY app, the Stage A pilot artifacts, the Infrastructure Spec | Start of each phase |
| `manifest-author` | Implement manifest schema + REGISTRY.json + the v0.1 amendments (Gaps 1, 2, 6, 7, 9) | Phase 1 only |
| `helper-builder` | Implement `posting.js`, `append.js`, `health.js`, `git.js`, `registry.js`, `cli.js` | Phase 1 (parallel per file once interfaces agreed) |
| `prompt-author` | Write the three prompt templates (`shared.md`, `songline.md`, `steward.md`) baking in Findings 10-13 | Phase 2 only |
| `skill-author` | Write `SKILL.md`, `runAgentCycle.md`, `songline.md`, `permanent.md` as Claude-Code-executable workflows | Phases 2-5 |
| `test-author` | Write Vitest tests for current phase | Each phase, parallel with implementer |
| `test-runner` | Execute test suites, log results | At each verify gate |
| `debugger` | Read failing test output, propose fix grounded in spec section | Whenever a check fails |
| `spec-validator` | Compare implementation against Infrastructure Spec + Stage A lessons + Path 2 architecture; pass/fail per item | At each phase boundary |
| `synthesizer` | Summarize phase outcomes, write the commit message | End of each phase |
| `smoke-tester` | Dispatch a real-subagent test run of the skill workflows in Phase 4 (songline) and Phase 5 (permanent fixtures) | Phase 4 + Phase 5 only |

Parallelism rules same as v0.1.

## Self-Verification & Iteration Protocol

Same as STIGMERGY v0.1 and v0.2. Read [[BBS Production Plan]] § Self-Verification & Iteration Protocol. Ten attempts per failing check. Build-log accumulates. Stop-report on attempt 10 with full context.

**Subagent dispatch budget for the build session:** the build session itself is a Claude Code session and uses subagents. Most of those are build-time workers. The smoke-test subagents in Phase 4 and Phase 5 are runtime simulations and are bounded: 2 dispatches max per smoke test (one nominal, one edge case). The total subagent budget for the autonomous build is approximately 30-40 dispatches across all phases — well within reasonable.

## Stop Conditions

Same as v0.1 and v0.2, plus:

- **The strict validator rejects the GSL pilot's existing messages.** They were written by hand-run before the validator existed. Stop and surface.
- **REGISTRY.json conflict on a fixtures-pilot agent.** If Phase 5 tries to register a fixtures agent with an `agent_id` that conflicts with the live GSL pilot, the uniqueness check fires correctly and blocks. Use a fixtures-only `agent_id` like `fixtures-stewards-test`.
- **Subagent dispatch returns malformed output 3 times in a row in Phase 4 or Phase 5 smoke tests.** Likely a prompt template issue or a manifest-rendering bug. Stop and surface.
- **Skill matching fails in Phase 6 smoke-test recipe.** If `SKILL.md`'s description doesn't trigger correctly, the skill is unusable. Stop and surface.

Phase 6 success is still a stop-on-success.

## What's Deferred (orchestrator v0.2+)

- **Parallel weave mode.** Multiple agents in parallel against a Weave manifest. Different concurrency model in the skill workflow — would require dispatching multiple subagents in one round-trip and aggregating. Deferred.
- **Dialogic mode.** Two-agent dialogue with a coordinator. Already partially explored in [[Palace Enchantment]] § Dialogic. Productionize after weave mode lands.
- **Free-enchantment mode.** Single agent, no prescribed task structure. Smaller scope; defer until `proposed_type` schema additions land.
- **Coordinator agents.** The next layer above the orchestrator. Not v0.1.
- **Cron / daemon scheduling.** Would require running outside Claude Code, which Path 2 explicitly does not. Permanent stewards in v0.1 run on demand inside Cowork. If scheduled execution becomes essential, that's Path-1-style infrastructure (which would require an API key) and is out of scope for the foreseeable future.
- **Context compression engine (§3.3 yellow).** Stub in v0.1.
- **Tool extensions.** `web_search`, `read_session_archive`. The tool semantics for v0.1 use Claude Code's native tools.
- **STIGMERGY orchestration UI.** Dispatching a songline from the STIGMERGY UI rather than the skill. UX nice-to-have.
- **Switching to direct API.** If Loudon ever obtains an API key, the helpers (manifest validator, posting, append, health, registry) are reusable as-is. The skill's `runAgentCycle.md` would need a parallel "direct API" implementation. Path 1 of this plan would become the new dispatch mechanism. The v0.1 work is not wasted in that scenario; it lays the foundation.

## Handoff to Claude Code

This file is the build contract. The session reads it end-to-end, runs the phases autonomously, and stops only on a stop condition or after Phase 6 success.

**Opening prompt for the Claude Code session:**

> You are building the Palace Orchestrator v0.1 autonomously, in the **Path 2 (Claude-Code-resident) architecture**. Loudon does not have an Anthropic API key; the orchestrator must use Claude Code subagents as its model-dispatch primitive at runtime.
>
> Read `Palace development/Orchestrator Production Plan.md` end to end — it is your build contract. Then read `Palace development/Palace Agent Infrastructure Spec.md` § 3 (the orchestrator architecture, manifest format, health score, posting discipline). Then read `Palace development/Project Stewardship System.md` § Stage A — the table of 9 spec gaps and 4 content findings is load-bearing for every decision in your build. Then read `Palace development/BBS Production Plan v0.2.md` and `_ops/stigmergy/app/V0.2-COMPLETE.md` to understand the v0.2 STIGMERGY app the orchestrator depends on (specifically the `server/validator.js` you will import). Then read the v0.1 BBS production plan at `Palace development/BBS Production Plan.md` for the autonomous-build pattern this run follows.
>
> Before starting Phase 1, inspect:
> - `_ops/agents/permanent/generative-sample-libraries/manifest.json` — the canonical manifest example. Your Phase 1 schema must accept this exactly as written (with v0.1 amendments).
> - `_ops/agents/permanent/generative-sample-libraries/state.json` — canonical state shape.
> - `_ops/agents/permanent/generative-sample-libraries/history.jsonl` — canonical history log.
> - `_ops/swarm/persistent/blackboard.jsonl` — the canonical clean blackboard. The 14 messages from `songline-2026-05-04-001` plus the 2 from the GSL pilot are your ground truth for §2.2 conformance.
> - `_ops/stigmergy/app/server/validator.js` — the validator you will import. Read it; understand its rejection modes.
>
> The architecture (per Decisions table): the orchestrator is a Claude Code skill at `.claude/skills/palace-orchestrator/` (workflow instructions for Claude Code at runtime to dispatch palace agents as subagents) plus Node helpers at `_ops/stigmergy/orchestrator/` (deterministic operations: manifest validation, blackboard append, health-block construction, REGISTRY.json management). At runtime, the skill's instructions tell Claude Code to dispatch a subagent for each cycle, then the helpers validate and append the subagent's output to the blackboard.
>
> Then run Phase 1 through Phase 6 autonomously per the Subagent Decomposition table and the Self-Verification & Iteration Protocol. Use up to 10 fix attempts per failing check. Append every check, every fix, every spec-validator-result to `build-log.jsonl`. At each phase boundary: run `npm run check:phase-N`, dispatch the spec-validator, commit with message `Orchestrator v0.1 — Phase N — [outcome]` if green, advance. Do not push.
>
> Stop only when a stop condition triggers (write `STOP-REPORT.md`) or Phase 6 succeeds (write `ORCHESTRATOR-V0.1-COMPLETE.md`).
>
> Do NOT modify the v0.2 STIGMERGY app at `_ops/stigmergy/app/`. Read from it (the validator import); do not write to it.
>
> Do NOT modify the GSL pilot's live state at `_ops/agents/permanent/generative-sample-libraries/`. Use it as a fixture (snapshot it into `tests/fixtures/pilot-state/`, test against the snapshot). Live cycle 2 of the GSL pilot is reserved for Loudon to run via the skill after smoke-test.
>
> The Phase 4 and Phase 5 smoke tests dispatch real subagents via the Agent tool. Budget: 2-4 subagent dispatches per smoke test. Use sonnet model. Total real-subagent budget for the build run is approximately 6-8 dispatches.

The session runs unattended. When it returns, exactly one of two artifacts exists at `_ops/stigmergy/orchestrator/`:

- `ORCHESTRATOR-V0.1-COMPLETE.md` — Phase 6 finished, all checks green, ready for Loudon's smoke test
- `STOP-REPORT.md` — execution paused, full context inside, one decision required

Both readable in five minutes.

## Open Questions

These are not blockers for Phase 1, but they will surface and need answers before they bite. The defaults below are what the autonomous session uses unless a stop-report surfaces a decision Loudon should make.

- **Default model selection.** Songline workers → sonnet (cheap, fast). Permanent stewards → opus (richer voice over many cycles). Override via manifest. This was true under Path 1 and stays true under Path 2 (the model parameter is passed to the Agent tool's dispatch).
- **Subagent context window for large palace neighborhoods.** When loading home + first-degree neighbors, the context can grow. Default for v0.1: home body + first-degree-neighbor frontmatters only (no neighbor bodies). If a neighbor's body is essential, the agent's prompt explicitly names it for selective expansion via the `read_palace` semantic.
- **What happens when a subagent returns invalid JSON or a malformed message?** The validator rejects, the skill workflow logs the failure, and either retries once with a sharpened prompt or marks the cycle failed. Default: one retry with feedback, then mark the cycle as `{status: 'blocked', reason: 'validator_rejected'}`.
- **Agent-tool usage data shape.** The Agent tool returns `total_tokens` and `duration_ms` but not raw `usage.input_tokens` / `usage.output_tokens` separately. Health block's `context_pct` becomes approximate (use total_tokens against MODEL_CONTEXT_LIMITS as a proxy). Document this approximation; flag with the metadata field.
- **Skill-matching reliability.** Loudon invokes the skill by saying something matching its description. If the description is too narrow, the skill never fires; too broad, it fires on unrelated requests. The Phase 6 smoke-test recipe should include 2-3 example invocations Loudon can copy verbatim.
- **What if a subagent goes off-script?** A subagent might decide to write more messages than the manifest expects, or post to a board it shouldn't. The validator catches some of this; the skill workflow's post-dispatch validation catches the rest. Default for v0.1: log the off-script behavior, validate what's salvageable, append valid messages, drop invalid ones, surface a warning to Loudon.
- **Iteration budget calibration after STIGMERGY runs.** v0.1 STIGMERGY ran ~11 fixes; v0.2 ran ~4. Orchestrator complexity is somewhere between. Expect ~6-10 fix iterations.

## What this Unblocks

- **Autonomous songlines from Cowork.** Loudon invokes the skill, names a path, the skill dispatches the agents, STIGMERGY shows the messages live. No manual "dispatch agent 1, dispatch agent 2" coordination from chat.
- **The Generative Sample Libraries pilot continuing.** Cycle 2 runs through the skill. Multi-cycle continuity tested.
- **Permanent stewards becoming routine.** Once the skill works, spawning a new permanent steward is invoking the skill with a fresh manifest. Future scheduling (cron-style automated cycles) requires Path 1; for now, weekly stewards run when Loudon launches Cowork.
- **The §3.2 sketch becoming an entry.** Per [[Palace Agent Infrastructure Spec]]'s forward vector, each section dissolves into its own entry as it matures. After v0.1-orchestrator ships, §3.2 content folds into a [[Thin Orchestrator]] entry.
- **A clean upgrade path to Path 1.** If API access ever becomes available, the helpers, manifest schema, validator import, prompt templates, and posting discipline all carry over unchanged. Only `runAgentCycle.md` (the Claude Code workflow) gets a parallel Node implementation that calls the SDK directly. The work in this build is not architecture-locked to the skill model.

---

*"The colony doesn't know what it's building. It just follows the gradient."* — [[Palace Agent Infrastructure Spec]]

*"Stage A learned what to ask. Stage B learns to ask it without me — through whichever runtime is available."*
