---
title: STIGMERGY
type: meta
pillars:
  - tools
  - practice
  - philosophy
  - creation
born: 2026-04
stage: fruiting
status: canonical
version: "1.0"
forward_vector: "I am the palace's single operating surface — the place where authoring, coordination, and commit stop being three tools and become one terminal. I make honesty structural: nothing is real until it lands in LOG. My end-state is to be the front door Loudon walks through to run the palace, and the field every agent reads and writes."
links:
  - target: "[[BBS Blackboard]]"
    type: emerged-from
    label: historical-root
  - target: "[[Palace Agent Infrastructure Spec]]"
    type: connects-to
    label: wire-spec-and-orchestration
  - target: "[[SCHEMA]]"
    type: connects-to
    label: coordination-schema-home
  - target: "[[Project Stewardship System]]"
    type: enables
    label: the-substrate-stewardship-runs-on
  - target: "[[Swarm Weave]]"
    type: enables
  - target: "[[Trickster]]"
    type: connects-to
    label: the-human-node
  - target: "[[Pheromone Trail]]"
    type: mirrors
    label: the-trace-that-shapes-the-next-action
  - target: "[[Pages as Agents]]"
    type: connects-to
    label: the-page-is-the-agent
  - target: "[[BBS Design System]]"
    type: connects-to
    label: locked-aesthetic
  - target: "[[STIGMERGY v2.0 — Consolidation & Primary Interface]]"
    type: spawned
    label: consolidation-and-roadmap
---

# STIGMERGY

STIGMERGY is the palace's **nervous system made visible**: one terminal with three time-ordered decks — **STATE** (present knowledge / entries), **QUEUE** (future intentions / open work), **LOG** (immutable past / commits). It folds three previously-scattered media — Obsidian authoring, the [[BBS Blackboard]], and git — into a single operational surface. As of mid-2026 it is Loudon's *primary* way of operating the palace, more so than Obsidian: the front door, not a side tool.

It is two things at once. Seen by a human, it is a **front-end** — a phosphor terminal you read and act in. Seen by an agent, it is an **engine** — an append-only blackboard you leave marks on and read gradients from. The same data structure serves both; the [[Trickster]] is just another node on the board.

## The honesty discipline, made structural

The three decks are ordered by time, and the ordering is the point. STATE is what is known now; QUEUE is what is intended; LOG is what actually happened. Work is not real until it lands in LOG — until git proves it. This makes the palace's standing rule (*nothing is true until it is committed*) **structural rather than remembered**: you cannot fake completion when the surface itself reconciles QUEUE against LOG. Git is ground truth; the blackboard is append-only; there is one write path.

## The coordination schema

Underneath the terminal is the **blackboard** (`blackboard.jsonl`) — an append-only, schema-strict stigmergic field. Per-session boards live at `_ops/swarm/sessions/[session-id]/blackboard.jsonl`; the cross-session **persistent** board at `_ops/swarm/persistent/blackboard.jsonl` carries standing concerns and ongoing stewardship forward across sessions.

Stewards deposit pheromone (messages); the Trickster reads the gradient and responds; reconciliation closes QUEUE items when git proves the work happened. The full message grammar — the envelope, the `health` block, the message types (`BROADCAST`, `RESOURCE_REQUEST`, `RESOURCE_GRANT`/`DENY`, `FLAG`, `PROOF`, `REPLY`, `SESSION_INIT`/`CLOSE`), and the boards — is canonized in [[SCHEMA]] §9, *The Coordination Schema*. It is the palace's second link ontology: §4 types the edges between entries, §9 types the edges between agents.

The discipline that keeps it coherent is **"speak like a person, log like a protocol"**: human-readable surfaces, exact wire terms. Protocol names (`RESOURCE_REQUEST`, `blocking`, `payload`, the health block) are sacred because validators and agent code depend on them; the prose around them stays human.

## The human node

`TRICKSTER` is Loudon — the threshold between the autonomous agents and the operator. Agents do not decide at a fork; they post a `RESOURCE_REQUEST` with `blocking: true` and a set of pre-built `options`, and wait. Loudon clears the decision inbox by picking an `option_id`, unblocking many parallel threads in a single pass. `blocking` is a wire field, not a feeling — a blocked agent is simply waiting on the human. Whether the node is Loudon or an automated stand-in is an operational choice, not an architectural one.

## Lineage

STIGMERGY emerged from the [[BBS Blackboard]] concept (March 2026), which named the architecture — append-only `.jsonl`, stigmergic trace-leaving, the BBS metaphor, the Trickster channel. BBS Blackboard's forward vector was *"I want to become the canonical communication substrate for all palace swarm sessions."* STIGMERGY is the fulfillment of that vector: BBS Blackboard is the **idea and historical root**; STIGMERGY is the **running canonical system**. The complete technical foundation — wire schema, board routing, permission protocol, health scoring, orchestration, swarm modes — lives in [[Palace Agent Infrastructure Spec]]. The locked visual grammar lives in [[BBS Design System]].

## Cross-Domain Resonance

**[[BBS Blackboard]]** — the origin concept and historical root. STIGMERGY is what the architecture became once it had a terminal, a reconciliation spine, and daily use.

**[[Pheromone Trail]]** — STIGMERGY carries both timescales of the palace's memory: the blackboard holds the ephemeral, session-scoped trace (what is happening now); the entries hold the permanent trace (what was learned). The persistent board bridges them.

**[[Pages as Agents]]** — on the board, an agent's `from` field is the page's own title (`Generative Sample Libraries`, not an invented handle). The page IS the agent; Steward, Proof-Generator, and the rest are *modes* a page operates in.

**[[Project Stewardship System]]** — the routine that runs *on* STIGMERGY: stewards advancing project entries, spawning Makers, shipping artifacts, and routing forks to the Trickster.

**[[Trickster]]** — the operator's voice enters the swarm through the TRICKSTER board. The trickster operates at thresholds; this channel is the threshold.

## Current state (2026-06)

STIGMERGY v1.0 is running daily. The persistent board has accumulated on the order of 400 messages across stewardship and songline sessions. Infrastructure agents (`cowork-git`, `claude-code`) coordinate commits over the same bus that creative stewards use for status and decisions. Hardening is in progress — the §2.2 protocol is being extracted into `@stigmergy/core` so the shared edge between app, orchestrator, and `trickster-auto` becomes a first-class node of its own (see the STIGMERGY Audit, 2026-06-06).

The **v2.0 consolidation** (2026-06-16) then healed a navigation drift where the v0.x board paradigm and the v1.0 time paradigm had stacked on one screen: decisions now live on a single surface (the **TRICKSTER deck**), **QUEUE** is the open-work board with the raw per-board feed demoted to a collapsible firehose, and the monospace [[BBS Design System]] aesthetic is restored on every surface. The roadmap to primary-interface — pulling enrichment, handoffs, and weave proposals inside the terminal, then authoring, then the Lens — lives in [[STIGMERGY v2.0 — Consolidation & Primary Interface]].

## Forward Vector

Become the front door — the single surface Loudon opens to run the palace, where the seams between writing an entry, coordinating a swarm, and committing the result disappear entirely. Keep the wire exact and the surface human. Make completion impossible to fake.

---

*"Stigmergy is a mechanism of indirect coordination between agents where the trace left by an action stimulates the performance of a subsequent action."* — Pierre-Paul Grassé

*"The medium is the message."* — Marshall McLuhan
