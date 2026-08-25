# Palace Orchestrator — the runbook

The step-by-step procedure for running a songline or advancing a permanent steward.
Relocated here from `SKILL.md` on 2026-08-25 to finish the Machinery/Content Split:
the skill file is the harness trigger, this is the *how*, and the canon organ
[[Palace Orchestrator]] is the *what/why*. The mode files (`songline.md`,
`permanent.md`, `runAgentCycle.md`, `batch.md`) sit beside this one; the Node
helpers stay at `_ops/stigmergy/orchestrator/`.

You are the orchestrator. Your job: turn a manifest at
`_ops/agents/permanent/<name>/manifest.json` into one or more palace-page cycles,
dispatching each cycle as a Claude Code subagent and appending its returned messages
to the blackboard. The architecture is Path 2 — Loudon has no Anthropic API key, so
model dispatch rides the parent session's Agent tool, and deterministic operations
(validation, schema checking, blackboard append, REGISTRY check, git change detection,
health-block construction) are delegated to `palace-orch`, the CLI helpers at
`_ops/stigmergy/orchestrator/src/cli.js`.

**Read the organ ([[Palace Orchestrator]]) first for the posture. Then the
mode-specific workflow:**

- `songline.md` — sequential dispatch through a named path of palace entries
- `permanent.md` — one cycle of a long-duration permanent steward
- `runAgentCycle.md` — the §3.2 primitive both modes call
- `batch.md` — the scheduled "cycle the folder" loop over `permanent.md`

## When to use this skill

Invoke when Loudon says any of these:

- "Run the [A → B → C] songline."
- "Advance the [project] steward."
- "Run cycle N of the [project] steward."
- "Wake the [page]."
- "Spawn a new steward for [project]."
- "Run the manifest at [path]."

Decline when:

- Loudon is just *talking about* an agent without asking to run one.
- The architecture (parallel weave, dialogic, free-enchantment) is not
  songline or long-duration-background — those modes are deferred to v0.2+.
- The build session that produces this skill is itself running (you are
  invoked by an autonomous build, not by Loudon directly).

## Top-level workflow

**Step 0 — Confirm scope with Loudon.** Before dispatching anything, name
what you are about to do in one sentence and wait for confirmation. Real
subagent dispatches cost real Anthropic credits; don't fire on a
misinterpretation. Acceptable phrasing: "I'm about to dispatch a 3-step
songline from Cooperation Yields Agency through Kuramoto Coupling to
Hilaritas Generator. Each step is one Claude Code subagent (sonnet).
Confirm?"

Skip Step 0 only when Loudon's invocation includes an explicit "go" or
"run it" with concrete parameters.

**Step 1 — Resolve the manifest.** If Loudon named a path or a project,
construct the manifest. If Loudon named a manifest file, load it.

For songlines: the manifest is constructed on the fly from the path. For
permanent stewards: the manifest exists at
`_ops/agents/permanent/<name>/manifest.json`.

**Step 2 — Validate the manifest.**

```bash
node _ops/stigmergy/orchestrator/src/cli.js validate <manifest-path>
```

Exit 0 = valid; exit 1 = errors[]. On error, surface to Loudon and stop.

**Step 3 — For permanent stewards: registry uniqueness check.**

```bash
node _ops/stigmergy/orchestrator/src/cli.js register-check <agent-id> --dir <agent-dir>
```

If the agent_id is taken by a different directory: surface conflict and
stop. If it's free or owned by this same directory: ok.

For songlines, no registry check is performed — songline workers are
ephemeral and do not register.

**Step 4 — Hand off to mode-specific workflow.** Read `songline.md` or
`permanent.md` and follow the steps there. Both call `runAgentCycle.md`
for each individual cycle.

**Step 5 — Surface result to Loudon.** A 1-2 sentence synthesis of what
happened, plus a pointer to the STIGMERGY UI at `localhost:5173` (if
running) where Loudon can see the messages.

## Cost guardrails

Songline runs cost approximately 3-4 subagent dispatches (~one per agent
on the path, plus optional coordinator framings). Permanent-steward
cycles cost 1 dispatch. Use **sonnet** as the default model for songline
workers and **opus** for permanent stewards (richer voice over many
cycles). The model can be overridden via the manifest's `model.name`
field.

If Loudon does not specify a model, use the manifest's value. If the
manifest doesn't specify, fall back to sonnet for songline, opus for
permanent.

## When to stop and consult Loudon mid-run

- A subagent returns malformed output that the validator rejects three
  times in a row. Likely a prompt-template issue.
- A `RESOURCE_REQUEST` with `blocking: true` is posted. The next agent on
  a songline cannot proceed until the Trickster (Loudon) grants. Stop and
  surface.
- The `forward_vector` of a permanent agent's home entry has changed
  since `state.last_active`. Per §3.2, this is session-invalidation
  territory. Stop and consult.
- The skill encounters any spec ambiguity not covered in this file or the
  Production Plan.

## Files this skill writes

| Path | When |
|---|---|
| `_ops/swarm/persistent/blackboard.jsonl` | Every dispatched message (validated + appended) |
| `_ops/agents/permanent/<name>/state.json` | After each permanent cycle |
| `_ops/agents/permanent/<name>/history.jsonl` | After each permanent cycle |
| `_ops/agents/permanent/REGISTRY.json` | When a new permanent agent is registered |

## Files this skill reads

| Path | Purpose |
|---|---|
| `_ops/agents/permanent/<name>/manifest.json` | Spawn config |
| `_ops/agents/permanent/<name>/state.json` | Resume state |
| `_ops/agents/permanent/<name>/history.jsonl` | Cross-cycle context |
| `_ops/swarm/persistent/blackboard.jsonl` | Pheromone trail |
| `<home-entry>.md` | The home page being enchanted |
| `_ops/orchestrator/prompts/*.md` | System-prompt templates |

## Anti-patterns (do not do these)

- **Do not invent a compound agent_id.** Use `manifest.home` (the page
  title). The page IS the agent. (Finding 11)
- **Do not put `request_id` inside `payload`.** It is a top-level field.
  (Gap 9, the highest-priority spec gap.)
- **Do not write the `health` block from inside a subagent prompt.** The
  orchestrator constructs it from Agent-tool usage data, not from agent
  self-reporting. (Decisions table.)
- **Do not bypass `palace-orch validate-message` before append.** Strict
  §2.2 enforcement is non-negotiable.
- **Do not modify the v0.2 STIGMERGY app under `_ops/stigmergy/app/`.**
  Read from it (the validator import); do not write to it.
- **Do not run cycle N of a permanent agent if the home entry's
  `forward_vector` has changed.** Stop and consult Loudon first.
- **Do not use protocol jargon in agent-written prose.** Never write
  "blocking", "non-blocking", "RESOURCE_REQUEST", "payload.options[]",
  "session_id", "board=TRICKSTER", or any other §2.2 wire term in a
  `rationale`, `summary`, or `label` field. The JSON envelope stays
  exact; the prose Loudon reads stays natural. See voice rule 5 in
  `prompts/shared.md` and the canonical translation table at
  [[Speak Like a Person, Log Like a Protocol]].

## v0.1 amendments to §3.1 manifest format

Documented in the helpers' README at
`_ops/stigmergy/orchestrator/README.md`. Summary:

| Amendment | Effect |
|---|---|
| Gap 1 — nullable `session_id` | `long_duration_background` mode may have `session_id: null` and a top-level `cycle_id` instead. |
| Gap 2 — `blackboard_session_path` | May be null for permanent agents (ignored). |
| Gap 6 — first-activation cursor | Read full board, set cursor to actual last-line `id`. |
| Gap 7 — `agent_id` uniqueness | `REGISTRY.json` checked at spawn. |
| Gap 9 — `request_id` location | **Top-level** on RESOURCE_REQUEST (not inside `payload`). |
| Finding 11 — `agent_id` default | Defaults to `manifest.home` when omitted or empty. |

## Smoke-test recipe (for Loudon)

In Cowork or a Claude Code session opened in the palace root:

1. **Songline mode:**
   > "Run the Cooperation → Kuramoto → Hilaritas songline through the
   > orchestrator skill."

2. **Permanent steward (resume the GSL pilot for cycle 4):**
   > "Advance the Generative Sample Libraries steward by one cycle using
   > the orchestrator skill."

3. **Manifest reference:**
   > "Run the orchestrator skill against the manifest at
   > `_ops/agents/permanent/generative-sample-libraries/manifest.json`."

Each invocation should trigger this skill via the description match
above. If it does not match, the description text is too narrow — surface
that to Loudon.

## See also

- `Palace development/Palace Orchestrator.md` — **the canon organ** ([[Palace Orchestrator]]); this skill is its shim
- `_ops/stigmergy/orchestrator/README.md` — helper script reference
- `Palace development/Orchestrator Production Plan.md` — build contract
- `Palace development/Project Stewardship System.md` — Stage A lessons

## Batch mode (Stage C — added 2026-05-26)

`batch.md` (beside this runbook) adds a thin "cycle the folder on a schedule" loop over the
permanent-steward cycle. Invoke when Loudon says "run my steward batch",
"cycle the projects", or when the weekly scheduled task fires. It runs
`_ops/stigmergy/orchestrator/src/batch-plan.js` to find due stewards, then
follows `permanent.md` once per due steward. No new substrate; no cadence
enum / digest / lifecycle (see batch.md "What batch deliberately does NOT
do"). The weekly scheduled task uses cron `0 6 * * 1`.
