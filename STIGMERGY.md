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
  - target: "[[Palace Orchestrator]]"
    type: connects-to
    label: orchestrated-by
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
  - target: "[[Palace Orchestrator]]"
    type: connects-to
    label: dispatches-onto-the-board
  - target: "[[Trickster]]"
    type: mirrors
    label: field-trace-vs-signal-intercept
  - target: "[[The Scroll]]"
    type: connects-to
    label: renders-the-front-door
  - target: "[[The Substrate Drifts]]"
    type: connects-to
    label: v0.3-session
---

# STIGMERGY

![[STIGMERGY — hero.png]]

STIGMERGY is the palace's **nervous system made visible**: one terminal with three time-ordered decks — **STATE** (present knowledge / entries), **QUEUE** (future intentions / open work), **LOG** (immutable past / commits) — plus two action decks, **TRICKSTER** (the one decision inbox) and **PROJECTS** (every project on one screen, and each one's [[The Scroll|scroll]] a click away). It folds three previously-scattered media — Obsidian authoring, the [[BBS Blackboard]], and git — into a single operational surface. Since 2026-09 it is Loudon's *only* way of operating the palace: the front door, not a side tool.

It is two things at once. Seen by a human, it is a **front-end** — a phosphor terminal you read and act in. Seen by an agent, it is an **engine** — an append-only blackboard you leave marks on and read gradients from. The same data structure serves both; the [[Trickster]] is just another node on the board.

## Active Baton

> **[[STIGMERGY — baton — bundle-hygiene demote-op]]** (2026-07-05) — held work: wire bundle-hygiene's invalid-`type:` finding into the app as a **`demote-bundle`** apply-op — *not* `set-type` (retyping substrate to `concept` would promote it to canon, the opposite of the fix). Loudon held this deliberately; the baton carries the 9-file seam and the demote-op design. Delete on pickup.

> **[[STIGMERGY — baton]]** (2026-09-25) — hardening: close the doors the [[No Mind Checks Itself]] re-check found open — sandbox the rich face's pieces and pin its CDN scripts, stop cross-site writes to the board, move the host check ahead of the palace's routes, settle the review wire, steady the regen-lane test.

## The honesty discipline, made structural

The three decks are ordered by time, and the ordering is the point. STATE is what is known now; QUEUE is what is intended; LOG is what actually happened. Work is not real until it lands in LOG — until git proves it. This makes the palace's standing rule (*nothing is true until it is committed*) **structural rather than remembered**: you cannot fake completion when the surface itself reconciles QUEUE against LOG. Git is ground truth; the blackboard is append-only; there is one write path.

## The coordination schema

Underneath the terminal is the **blackboard** (`blackboard.jsonl`) — an append-only, schema-strict stigmergic field. Per-session boards live at `_ops/swarm/sessions/[session-id]/blackboard.jsonl`; the cross-session **persistent** board at `_ops/swarm/persistent/blackboard.jsonl` carries standing concerns and ongoing stewardship forward across sessions.

Stewards deposit pheromone (messages); the Trickster reads the gradient and responds; reconciliation closes QUEUE items when git proves the work happened. The full message grammar — the envelope, the `health` block, the message types (`BROADCAST`, `RESOURCE_REQUEST`, `RESOURCE_GRANT`/`DENY`, `FLAG`, `PROOF`, `REPLY`, `SESSION_INIT`/`CLOSE`), and the boards — is canonized in [[SCHEMA]] §9, *The Coordination Schema*. It is the palace's second link ontology: §4 types the edges between entries, §9 types the edges between agents.

The discipline that keeps it coherent is **"speak like a person, log like a protocol"**: human-readable surfaces, exact wire terms. Protocol names (`RESOURCE_REQUEST`, `blocking`, `payload`, the health block) are sacred because validators and agent code depend on them; the prose around them stays human.

## The human node

`TRICKSTER` is Loudon — the threshold between the autonomous agents and the operator. Agents do not decide at a fork; they post a `RESOURCE_REQUEST` with `blocking: true` and a set of pre-built `options`, and wait. Loudon clears the decision inbox by picking an `option_id`, unblocking many parallel threads in a single pass. `blocking` is a wire field, not a feeling — a blocked agent is simply waiting on the human. Whether the node is Loudon or an automated stand-in is an operational choice, not an architectural one.

**TRICKSTER is stewardship's channel** (2026-09-24) — the board's decision inbox is for the stewardship lane's blocking forks. A non-stewardship page or agent that needs to leave Loudon a note posts to GENERAL instead; it does not open a TRICKSTER item for work TRICKSTER was never built to gate.

## Handoff Lifecycle

A **baton** handed on the board is the palace's unit of continued work, and keeping the board honest about which batons are actually open is the reliable-work-queue problem — one of the most chewed-over problems in distributed systems. The **fumble** is its canonical failure: a baton caught and then dropped (a context death, an abandoned session) that silently vanishes from the queue with the work half-done. The palace answers it with a **three-state lifecycle** — the first rung of a longer ladder, borrowed on purpose from that canon.

**The three states** (folded from board events by `_ops/stigmergy/handoff-model.mjs`; driven by `list-handoffs.mjs` / `pickup-handoff.mjs` / `close-handoff.mjs`):

- **OPEN** — a `handoff_ready` nobody has claimed. Available to catch.
- **CLAIMED** — a `handoff_picked_up` (marked `lifecycle: claim`) posted on catch. The work is *in flight*; the card stays visible. A claim that ages with no close is a fumble made visible instead of hidden.
- **CLOSED** — a `handoff_closed`, citing the commit that landed the move. This is the *only* thing that retires a card: **done is never inferred** from git or the filesystem (the bug removed 2026-07-07). Its two disciplines — cite the evidence, and *complete-or-re-baton* (a partial close posts the leftover as a fresh `handoff_ready`) — are what make "in the spirit of the original" trustworthy rather than a hatch for dropped scope.

This is manual-ack, not auto-ack — the move every mature queue makes (SQS's visibility-timeout-then-delete, AMQP's explicit `ack`/`nack`, Beanstalkd's `ready → reserved → buried`). And it fits the board's grain: the blackboard is an **append-only event log**, so state is a *fold over events* (event sourcing / CQRS), never a mutation — a richer substrate than a delete-on-done queue, with the full audit trail those throw away. The reconciliation view `pickup-handoff.mjs` prints before claiming is the **idempotent-consumer** guard that at-least-once delivery requires: *this may already be done — check before continuing.* Migration is by grandfather: a legacy `handoff_picked_up` with no `lifecycle` marker counts as closed (those were start-claims for work since landed).

**The horizon — the Reliable Handoff ladder.** Rung 1 (above) is built and lived-in. The rest are named so they are a known direction, not a rediscovery, and deferred by design until the scheduled dispatcher makes them live:

2. **Lease / TTL** — a claim ages; a stale claim is *flagged*, never silently auto-reverted (SQS visibility timeout; etcd/ZooKeeper leases).
3. **Heartbeat → fade** — wire the `health` block (the liveness heartbeat the palace *already emits* on every message) to reap zombie claims. This is where distributed-systems "lease expiry" and stigmergy's own founding metaphor — **pheromone that evaporates unless refreshed** ([[Pheromone Trail]], Grassé) — turn out to be the *same mechanism*: the heartbeat is the ant re-depositing scent to keep the trail alive.
4. **Dead-letter / "buried"** — a repeatedly-fumbled baton escalates to a human channel instead of looping (SQS DLQ; Airflow zombie-task reaping).

The cross-tradition mapping of these terms lives in [[ROSETTA]] §4b; the operator's two-beat checklist (claim on catch, close on completion) is [[Baton Ceremony — on-pickup]] — the one copy of the text, which every baton carries verbatim and `_ops/swarm/lint-baton-footer.py` holds to that.

## Lineage

STIGMERGY emerged from the [[BBS Blackboard]] concept (March 2026), which named the architecture — append-only `.jsonl`, stigmergic trace-leaving, the BBS metaphor, the Trickster channel. BBS Blackboard's forward vector was *"I want to become the canonical communication substrate for all palace swarm sessions."* STIGMERGY is the fulfillment of that vector: BBS Blackboard is the **idea and historical root**; STIGMERGY is the **running canonical system**. The complete technical foundation splits across two homes: the wire schema and board routing are ratified in [[SCHEMA]] §9, and the permission/options shape, health scoring, manifest, and git detection live in [[Palace Orchestrator]] (the executor). The locked visual grammar lives in [[BBS Design System]].

## Cross-Domain Resonance

**[[BBS Blackboard]]** — the origin concept and historical root. STIGMERGY is what the architecture became once it had a terminal, a reconciliation spine, and daily use.

**[[Pheromone Trail]]** — STIGMERGY carries both timescales of the palace's memory: the blackboard holds the ephemeral, session-scoped trace (what is happening now); the entries hold the permanent trace (what was learned). The persistent board bridges them.

**[[Pages as Agents]]** — on the board, an agent's `from` field is the page's own title (`Generative Sample Libraries`, not an invented handle). The page IS the agent; Steward, Proof-Generator, and the rest are *modes* a page operates in.

**[[Project Stewardship System]]** — the routine that runs *on* STIGMERGY: stewards advancing project entries, spawning Makers, shipping artifacts, and routing forks to the Trickster.

**[[Trickster]]** — the operator's voice enters the swarm through the TRICKSTER board. The trickster operates at thresholds; this channel is the threshold.

## Current state (2026-06)

STIGMERGY v1.0 is running daily. The persistent board has accumulated on the order of 400 messages across stewardship and songline sessions. Infrastructure agents (`cowork-git`, `claude-code`) coordinate commits over the same bus that creative stewards use for status and decisions. Hardening is in progress — the §2.2 protocol is being extracted into `@stigmergy/core` so the shared edge between app, orchestrator, and `trickster-auto` becomes a first-class node of its own (see the STIGMERGY Audit, 2026-06-06).

The **v2.0 consolidation** (2026-06-16) then healed a navigation drift where the v0.x board paradigm and the v1.0 time paradigm had stacked on one screen: decisions now live on a single surface (the **TRICKSTER deck**), **QUEUE** is the open-work board with the raw per-board feed demoted to a collapsible firehose, and the monospace [[BBS Design System]] aesthetic is restored on every surface. The roadmap to primary-interface — pulling enrichment, handoffs, and weave proposals inside the terminal, then authoring, then the Lens — lives in [[STIGMERGY v2.0 — Consolidation & Primary Interface]].

## The projects deck and the scroll (2026-09)

The consolidation left one gap Loudon named plainly: no big-picture view of the projects, no way back *into* a project after a steward moved it, and steward progress folded away behind the firehose. The **PROJECTS deck** (2026-09-23; it replaced the STEWARDS roster) answers the first two. One row per `type: project` entry — stewarded or not — grouped by what it needs: *needs you*, *ready to advance* (an answer filed that no cycle has consumed), *stalled* (two barren cycles), *tended*, *no steward*. Clicking a row opens the project's **scroll** ([[The Scroll]]) in the terminal: the Now zone regenerated on every look, the project's open asks as the same cards the TRICKSTER deck shows, Loudon's **Standing Orders** (editable here and nowhere else — the steward reads them at the top of every cycle), and the making trail with its media inline. The deck's signal column and the scroll's Now zone are computed by one rule, so they never disagree. The third gap — progress hidden behind the fold — closes by construction: everything a steward ships becomes a section of its project's scroll.

## Rich faces (2026-09)

The terminal also serves every entry's **rich face** at `/rich/?entry=<Entry>`: the entry's words read live, with the sound, image and interactives [[Enrichment]] made laid beside its headings, and a note per section that lands on the board as a `human_eval` from TRICKSTER. The entry reader, the scroll view and the rich face share one face switch at the right of the top bar — text, rich, scroll, only the faces the entry's bundle holds, and `F` cycles them. The handler lives with the renderer in `_ops/rich-face/`; STIGMERGY only mounts it.

## Forward Vector

Become the front door — the single surface Loudon opens to run the palace, where the seams between writing an entry, coordinating a swarm, and committing the result disappear entirely. Keep the wire exact and the surface human. Make completion impossible to fake. The scroll is the newest test of that: a project's state must be readable in one screen, true without a cycle, and steerable in place.

---

*"Stigmergy is a mechanism of indirect coordination between agents where the trace left by an action stimulates the performance of a subsequent action."* — Pierre-Paul Grassé

*"The medium is the message."* — Marshall McLuhan
