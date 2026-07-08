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
  - target: "[[SCHEMA]]"
    type: connects-to
    label: enforces-the-wire
  - target: "[[Concierge]]"
    type: connects-to
    label: sibling-organ-address-pole
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
key; model dispatch rides the parent session's Agent tool), validates every message it emits
against [[SCHEMA]] §9, and appends to the persistent blackboard.

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
- **The wire it enforces** — strict [[SCHEMA]] §9 validation before every board append; `health`
  written by the orchestrator, never by the woken agent; `request_id` top-level.
- **The voice it protects** — no protocol jargon in agent-written prose ([[Speak Like a Person,
  Log Like a Protocol]]); catch the human up before asking.
- **The Concierge boundary** — same family ([[Skills Are Enchantable Pages]]), opposite poles. The
  [[Concierge]] is the *address* pole — you speak to it, it drafts you a product — and it is
  *resident*: spawned once, held by ID, warmer across a session. I am the *execute* pole — a cadence,
  manifest, or path runs me — and *job-shaped*: each cycle a bounded dispatch that ends. It persists
  and answers *you*; I fire, finish, and leave marks on the board for the swarm. Its safety lives in
  character (drafts for your yes); mine lives in the validator (strict §2.2, `health` written by me).

## Definitions of record

Four rules the running engine (`_ops/stigmergy/orchestrator/src/`) cites by name and was built
from. They lived in the Infrastructure Spec; that document is being retired, so their canonical
home is here — beside the code that enforces them. The wire format itself is **not** here: that is
[[SCHEMA]] §9, the ratified grammar the validator implements.

**The manifest.** Written once at spawn, never modified; the orchestrator reads it at the start of
every cycle. It is the agent's whole identity: `agent_id`, `home` (the page title it wakes),
`session_id`, `mode` (selects the loop variant), `neighborhood`, `model {provider, name, endpoint}`,
`tool_registry[]`, `stopping_conditions {max_iterations, stop_on[]}`, the two blackboard paths,
`partner_id`, `trickster_mode`, `parallel_safe`. Adding a mode means a new loop variant + template;
existing agents are untouched. The live manifests and their v0.1 amendments are in
`_ops/agents/permanent/*/manifest.json` and the orchestrator README.

**Git page-change detection.** Before each cycle the orchestrator runs `git log` on the home page
since `state.last_active`. If the page changed, it appends a `PAGE_UPDATE_NOTICE` (the diff + commit
messages) to history before the model call — so a commit message is Trickster-to-agent
communication; write them deliberately. If the change touched `forward_vector`, consider session
invalidation (archive history, start fresh) — the vector is the agent's direction, and a new one is
a new agent.

**Dual-path health.** The `health` block is always written by the orchestrator, never by the woken
agent. Two paths:
- *Path 1 (API-direct)* — real `response.usage.input_tokens`, so `context_pct` is authoritative and
  yellow/red escalation is real. Not what runs today.
- *Path 2 (Claude Code subagent)* — the live path. The Agent tool returns combined tokens only, no
  `input_tokens` breakdown, so `context_pct` can't be computed honestly. The orchestrator stamps a
  minimal stub — `{ score: "green", model, _orchestrator_metadata: { dispatch_mode, note } }` — where
  `score` is a **sentinel, always green** (real escalation needs Path 1). The §9 validator relaxes
  the full-health requirement for the `STUB_HEALTH_DISPATCH` set — `claude-code-subagent`,
  `hand-authored`, `cowork`, `claude-code`, `claude-code-mac-session` — requiring only `score` and
  `model`. A new non-API dispatch mode joins the set; it is never exempted ad-hoc.

**The Trickster `options[]` shape.** A blocking decision goes to the TRICKSTER board as a
`RESOURCE_REQUEST` whose `payload.options[]` is the fork. Canonical shape is objects — `{ id, label }`,
never bare strings, never `{ value, text }`. `id` is a short stable token (`APPROVE`, `tweak-model`);
`label` is the full one-line tradeoff, id-first so the button reads for itself; optional `next` names
a follow-up. The `RESOURCE_GRANT` records `option_id` / `option_label`. Stewards produce the object
shape; the inbox tolerates lenient strings but that is a fallback, not the contract. (The inbox's own
render — pending-request view, choice cards — is [[STIGMERGY]]'s concern, not the orchestrator's.)

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
