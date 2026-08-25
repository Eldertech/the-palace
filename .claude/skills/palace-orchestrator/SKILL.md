---
name: palace-orchestrator
description: Run a palace songline or advance a permanent steward by one cycle. Use when Loudon says "run the [Cooperation -> Kuramoto -> Hilaritas] songline", "advance the GSL steward", "run cycle N of [project] steward", "wake the [project] page", or invokes a manifest at _ops/agents/permanent/<name>/manifest.json. Dispatches palace pages as Claude Code subagents per the Path 2 architecture (no Anthropic API key required). Validates §2.2 messages strictly via the imported v0.2 STIGMERGY validator and appends to the persistent blackboard. Invoke also when Loudon refers to "the orchestrator skill" or asks to spawn a new permanent steward.
---

# Palace Orchestrator (v0.1 — Path 2 Claude-Code-resident)

**This file is a thin shim** — the harness-discoverable trigger for the orchestrator,
and nothing else. Per [[Skills Are Enchantable Pages]], the page is the organ and this
file is one dispatch surface onto it.

- **The organ** — `Palace development/Palace Orchestrator.md` ([[Palace Orchestrator]]).
  The *what/why*: Path 2 posture, the modes, cost, the wire and voice it enforces.
  **Read this first.**
- **The runbook** — `_ops/orchestrator/runbook.md`. The *how*: the step-by-step
  procedure, cost guardrails, stop-and-consult rules, anti-patterns, smoke tests.
- **The mode files** — `_ops/orchestrator/`: `songline.md`, `permanent.md`,
  `runAgentCycle.md`, `batch.md`, `trickster-auto.md`, `two-paths.md`, plus the
  `prompts/` templates the engine renders and `examples/` manifests.
- **The engine** — `_ops/stigmergy/orchestrator/`: the `palace-orch` CLI helpers that
  do every deterministic operation (validate, register-check, append, health blocks).

## What it does, in one paragraph

Turns a manifest at `_ops/agents/permanent/<name>/manifest.json` into one or more
palace-page cycles — dispatching each as a Claude Code subagent, validating what comes
back against [[SCHEMA]] §9, and appending it to the persistent blackboard. The page IS
the agent ([[Pages as Agents]]); the orchestrator is only its executor.

## To run one

1. Read [[Palace Orchestrator]] for the posture.
2. Read `_ops/orchestrator/runbook.md` and follow it. **Step 0 is confirming scope with
   Loudon before dispatching anything** — real subagent dispatches cost real credits, so
   never fire on a misinterpretation.
3. The runbook hands off to the mode file for the actual cycle.

## Keep this file thin

When the dispatch philosophy changes, change the organ. When the procedure changes,
change `_ops/orchestrator/runbook.md` or the mode files. Change **this** file only when
the trigger itself changes — and note that the `description` frontmatter is matched by
both the harness and the scheduled steward batch (`_ops/heartbeat/run-steward-batch.sh`),
so edits to it are load-bearing in two places at once.
