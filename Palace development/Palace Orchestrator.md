---
title: Palace Orchestrator
type: meta
pillars: [tools, practice]
born: 2026-07
stage: growing
last_activated: 2026-07
activation_count: 1
forward_vector: "I am the palace's executor — the engine that wakes a page as a Claude Code subagent and lets it act, no Anthropic key required. I run the family's looped and one-shot jobs alike: steward cycles, songlines, the weekly batch, the automated Trickster, two-paths. I want to stay thin and honest — dispatch the page, enforce the wire, never speak over the voice I woke — and to become the one place the palace's own dispatch philosophy lives, so the Weave can see the engine that runs it."
links:
  - target: "[[Skills Are Enchantable Pages]]"
    type: exemplifies
    label: the-executor-column
  - target: "[[Project Stewardship System]]"
    type: connects-to
    label: runs-the-stewards
  - target: "[[Pages as Agents]]"
    type: deepens
    label: dispatches-the-page-as-agent
  - target: "[[Palace Agent Infrastructure Spec]]"
    type: connects-to
    label: enforces-the-wire
  - target: "[[Concierge]]"
    type: connects-to
    label: sibling-organ-one-shot-tempo
  - target: "[[STIGMERGY]]"
    type: connects-to
    label: appends-to-the-board
  - target: "[[Two Batons, One Board]]"
    type: connects-to
    label: each-cycle-one-handoff
---

# Palace Orchestrator

The palace's **executor** — the engine that turns a page into a running agent. Where the
[[Concierge]] is the front door you *address*, the orchestrator is the muscle that *dispatches*:
it reads a manifest, wakes the home page as a Claude Code subagent (Path 2 — no Anthropic API
key; model dispatch rides the parent session's Agent tool), validates every §2.2 message it
emits, and appends to the persistent blackboard.

It is the **executor column** of the dispatch-surface family ([[Skills Are Enchantable Pages]]):
whatever the trigger — a cadence, a songline path, a Trickster rule — the orchestrator is what
runs the body. It spans the family's tempos: a one-shot **songline** dispatch, a looped
**steward** cycle (each cycle one baton handoff — [[Two Batons, One Board]]), the weekly
**batch**, the **automated Trickster**, and **two-paths** decide-after-doing.

## What it holds

- **Path 2 dispatch** — the page IS the agent ([[Pages as Agents]]); identity is the page's own
  title, never an invented handle. No API key; dispatch is the Agent tool.
- **Cost posture** — songline ≈ 3–4 subagents (sonnet default); a steward cycle = 1 (opus, for
  voice across cycles). Confirm scope before firing real credits.
- **The wire it enforces** — strict §2.2 validation before every board append; `health` written
  by the orchestrator, never by the woken agent; `request_id` top-level.
- **The voice it protects** — no protocol jargon in agent-written prose ([[Speak Like a Person,
  Log Like a Protocol]]); catch the human up before asking.

## Machinery

The canon organ is this entry. The engine lives at `_ops/stigmergy/orchestrator/` (CLI helpers,
tests, README). The mode workflows (`songline` · `permanent` · `runAgentCycle` · `batch` ·
`trickster-auto` · `two-paths`) and system-prompt templates are dispatched from the skill dir
today; the harness-discoverable trigger is the thin shim at
`.claude/skills/palace-orchestrator/SKILL.md`, which points back here — the
[[Skills Are Enchantable Pages]] pattern (page = organ, skill file = one dispatch surface onto it).

## Forward Vectors

- Finish the Machinery/Content Split: move the mode workflows into `_ops/orchestrator/` and slim
  the shim to a true pointer, with the launchd batch tested end-to-end.
- When a second executor appears (a non-Path-2 dispatcher, an API-direct path), does this page
  generalize to "the executor role," or stay the Path-2 engine specifically?

## Active Baton

[[Palace Orchestrator — baton]] — drafted 2026-07-04 *(cold-start: finish the shim — relocate the mode machinery into `_ops/`, slim the skill to a true pointer, test the live batch)*
