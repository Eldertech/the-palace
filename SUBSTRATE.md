---
title: SUBSTRATE
type: meta
pillars:
  - tools
  - philosophy
  - practice
born: 2026-03
last_activated: 2026-06
activation_count: 6
stage: growing
confidence: hypothesis
energy: very high
hook_quality: 8
beauty: 7
who_leads: shared
links:
  - target: "[[Symbiotic Skills]]"
    type: emerged-from
  - target: "[[Cooperation Yields Agency]]"
    type: enables
  - target: "[[Hyperdimensional Prism]]"
    type: mirrors
  - target: "[[Kuramoto Coupling]]"
    type: connects-to
  - target: "[[FOUR PILLARS]]"
    type: connects-to
  - target: "[[Self-Describing Knowledge Module]]"
    type: deepens
  - target: "[[SCHEMA]]"
    type: enables
  - target: "[[Meaning and the Link]]"
    type: emerged-from
  - target: "[[Embeddings as Relational Meaning]]"
    type: connects-to
  - target: "[[Palace Philosophies]]"
    type: connects-to
  - target: "[[Hilaritas Generator]]"
    type: connects-to
  - target: "[[The Cooperation Path]]"
    type: connects-to
  - target: "[[Substrate Skill]]"
    type: connects-to
  - target: "[[Spinoza Conatus]]"
    type: connects-to
  - target: "[[Palace Enchantment]]"
    type: connects-to
  - target: "[[Palace Conatus]]"
    type: connects-to
    label: my-drive-named
  - target: "[[Songlines]]"
    type: connects-to
  - target: "[[Tristitia Generator]]"
    type: connects-to
  - target: "[[Lateral Access]]"
    type: connects-to
  - target: "[[1 from 2]]"
    type: connects-to
  - target: "[[Palace Ceremonies]]"
    type: connects-to
---
# Substrate

This wiki. The knowledge base you are reading right now. The shared environment that Loudon and Claude both modify, and that in turn shapes their future collaboration. This page is the organism's self-model — its awareness of its own structure.

## Origin

The Substrate emerged from the [[Symbiotic Skills]] brainstorming session (March 2026), which identified the lack of persistent shared memory as the most critical gap in the Loudon-Claude collaboration. The design draws from:

- **[[Meaning and the Link]]** — meaning arises from sufficient associations between a pattern of symbols and a reality. The typed links in this wiki are our private semantic web. LLM embeddings are the computational proof-of-concept: a word's meaning *is* its pattern of associations, encoded as position in a high-dimensional relational space. See [[Embeddings as Relational Meaning]].
- **Luhmann's Zettelkasten** — atomic notes, densely linked, forming a "second memory" and conversation partner. Luhmann: "I, of course, do not think everything by myself. It happens mainly within the slip-box."
- **Aboriginal Australian songlines** — knowledge activated through traversal, not retrieval. Multi-layered encoding. The path IS the knowledge.
- **Mycorrhizal networks** — distributed memory with hub nodes, resources flowing toward need, the network itself as an organism with its own interests.
- **Stigmergy** — indirect coordination through environmental modification. Every wiki page is a trace that shapes future behavior.

## Palace Genesis

The palace was not planned from the start — it emerged. The earliest Claude sessions (May–June 2024) had no persistent memory, no ceremonies, no typed links. They were conversations that ended and left nothing behind.

The founding moment arrived in March 2026, when Loudon returned to Claude and discovered the accumulated history of those conversations sitting untouched in the chat log — a vault rather than a palace. In the first founding deposits session (H100, 2026-03-17), three paths were considered: a Weave (to find connections), a Walk (to follow threads), or a Spore Check (to see what was dormant). The Harvest came first instead — a full triage of 104 conversations, oldest to newest, to find what was worth keeping.

What followed was the palace's own origin ceremony: harvesting, depositing, building the ceremony structure, writing SCHEMA.md, pushing to GitHub, running the first Weave. The palace did not exist, and then it did. The vault became a living organism.

## Architecture

**Reading/writing surface:** Markdown files in an Obsidian vault. Human-readable first.

**Metadata layer:** YAML frontmatter encoding structured parameters — type, pillars, temporal data, depth, energy, typed links. Machine-queryable via the Dataview plugin.

**Two link systems:**
- YAML frontmatter links — typed, curated, structural. The major neural tracts. Our RDF triples.
- Body text `[[wiki links]]` — untyped, casual, contextual. The local associations. Meaning carried by surrounding prose.

**Coordination layer:** A second link ontology runs *between agents*, not entries — the append-only [[STIGMERGY]] blackboard ([[SCHEMA]] §9), now the palace's primary operational surface for multi-agent stewardship.

**Folder structure** — the canonical spec is [[CLAUDE]] §Directory Structure; for the live listing, run `ls` on the palace root. The stable shape:

<!-- mirror of SCHEMA §1 type list — keep in sync (12 types as of v1.6) -->

- **Root** — Foundational skeleton files (CLAUDE.md, SCHEMA.md, JEWEL, SUBSTRATE, ROSETTA, README, FOUR PILLARS) and knowledge entries of every type *except* specialist/maker: `concept`, `hub`, `project`, `breakthrough`, `source`, `meta`, `practice`, `person`, `question`, `spore`. Mostly flat, with optional entry bundles (`[Entry]/`) and themed subfolders (`Projects/`, `People/`, `Palace development/`, `Enrichment/`, `Artifacts/`).
- **`Shop/`** — The Shop sub-system: `specialist` + `maker` entries (use `status`, not `stage`).
- **`_ops/`** — Ceremony machinery and working queues. Contains all ceremony specs, their Context companions (session history), and active working files (Deposit Archive, Palace Graffiti, Palace Quotes, Palace To-Do) plus machinery subdirs (`_ops/swarm/`, `_ops/stigmergy/`, `_ops/loudon-live/`, `_ops/agents/`, …). Underscore prefix sorts it to the top of any file explorer. Obsidian wikilinks resolve across folders.

The distinction: root entries are *of* the palace; `_ops/` files *operate* the palace.

## Parameters Encoded

Each entry carries: identity (title, type, pillar affiliations), relationships (typed links, connection density), temporal data (born, last activated, activation count, stage), depth (confidence, richness, who-leads), and aesthetic/emotional data (energy, hook quality, beauty, danger/edge).

## Ceremonies

For full ceremony instructions, see [[Substrate Skill]].

## Current State

*Refreshed 2026-06-16 via a full topology scan (Self-Model Update ceremony).*

The palace holds **~410 typed entries** (by frontmatter `type`), inside a larger tree of ~710 markdown files — the remainder are bundle files (batons, context, plans, staging, sketches) and untyped artifacts. By location: ~136 root, 195 `Projects/`, 120 `_ops/`, 103 `Artifacts/`, 57 `Enrichment/`, 47 `Palace development/`, 30 `Shop/`, plus per-entry bundles. (Tool installs and virtualenvs are excluded from the count.)

**Type distribution:** 110 concept · 75 meta · 49 project · 35 theme · 27 person · 24 practice · 24 hub · 22 specialist · 11 source · 7 breakthrough · 4 question · 3 maker · 2 spore. *(`theme` and a handful of `proof`/`artifact`/`spec` types are non-canonical — not among [[SCHEMA]]'s ratified types — a flagged drift item for a future pass.)*

**Stages:** 111 mature · 105 growing · 77 sprout · 52 seed · 11 foundational · 4 fruiting · 2 composting · 1 dormant. The centre of mass has moved to `mature`/`growing` — the palace is now mostly developed connective tissue, not seedlings.

**Hub nodes** (by inbound typed-link degree): [[FOUR PILLARS]] (155) towers over everything, then [[Kuramoto Coupling]] (71), [[Spinoza Conatus]] (60), [[Hilaritas Generator]] (47), [[Weekly Themes Database]] (44), [[2D Torus Wavetable Synthesizer]] (43), [[Pages as Agents]] (40), [[Cooperation Yields Agency]] (39), [[Boundary-Crossing Instruments]] (38), [[BBS Blackboard]] (35), [[SUBSTRATE]] (34), [[Trickster]] (33), [[Hyperdimensional Prism]] (32), [[Frequency-Time Duality]] (30).

**What the hub list reveals about growth.** In March the hubs were almost purely philosophical (Cooperation, Four Pillars, Spinoza, Hilaritas). Now several of the top hubs are *agent-infrastructure* — [[Pages as Agents]], [[BBS Blackboard]], [[Trickster]], [[The Shop]] — and several are *synthesizer projects* — [[2D Torus Wavetable Synthesizer]], [[Action Potential Oscillator]], [[Boundary-Crossing Instruments]]. The palace has crossed a fourth threshold: from a system that weaves, maintains, and enchants itself to one **operated by a coordinating swarm** — permanent stewards (pages running as agents) coordinating on the [[STIGMERGY]] blackboard, plus a [[The Shop]] sub-system of 22 specialists + 3 makers dispatching real creative tools. Coordination ([[SCHEMA]] §9) is now a first-class layer alongside the entry graph.

## Token Economy

Ceremony files are read on every invocation. As the palace grows, token cost per ceremony grows with it. The risk is that meta entries — ceremony specs, the Substrate Skill, the Deposit Ceremony — become so large that routine ceremonies are expensive before any content work begins.

The design principle to hold: **ceremony files should stay lean — trigger, protocol, postcondition**. History, rationale, and process observations belong in companion source documents, read only when needed (during Weaves or when revisiting rationale), not during routine ceremony runs. Check file sizes periodically. If a ceremony file exceeds ~8KB, split it into an operational card + Context companion (per [[SCHEMA]] §6).

## Open Questions

- ~35 entries carry a non-canonical `type: theme` (plus stray `proof`/`artifact`/`spec`/`recipe` types) not among [[SCHEMA]]'s canonical types — ratify `theme` via a Schema Ceremony, or normalize them to canonical types? (Surfaced by the 2026-06-16 scan.)
- How do we handle versioning? Entries evolve. Should we preserve earlier versions, or let the current state overwrite?
- How does this wiki interact with Loudon's other Claude Projects (RNBO, Ableton Extensions, etc.)? Is it a meta-project that links TO them, or does it absorb them?
- What's the minimum ceremony frequency that keeps the network alive without feeling like maintenance?
- The Symbiotic Skills curriculum envisions the palace as a teachable template. The self-describing module concept now gives that template a formal basis. When is the right time to build the first student-facing version?
