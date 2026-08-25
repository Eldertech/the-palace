---
title: SUBSTRATE
type: meta
pillars:
  - tools
  - philosophy
  - practice
born: 2026-03
last_activated: 2026-08
activation_count: 7
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

![[SUBSTRATE — hero.png]]

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

- **Root** — Foundational skeleton files (CLAUDE.md, SCHEMA.md, JEWEL, SUBSTRATE, ROSETTA, README, FOUR PILLARS) and knowledge entries of every type *except* specialist/maker: `concept`, `hub`, `project`, `breakthrough`, `source`, `meta`, `practice`, `person`, `question`, `spore`. Mostly flat, with optional entry bundles (`[Entry]/`) and themed subfolders (`Projects/`, `People/`, `Cross-Domain Resonances/`, `Palace development/`, `Enrichment/`).
- **`Shop/`** — The Shop sub-system: `specialist` + `maker` entries (use `status`, not `stage`).
- **`_ops/`** — Ceremony machinery and working queues. Contains all ceremony specs, their Context companions (session history), and active working files (Deposit Archive, Palace Graffiti, Palace Quotes, Palace To-Do) plus machinery subdirs (`_ops/swarm/`, `_ops/stigmergy/`, `_ops/loudon-live/`, `_ops/agents/`, …). Underscore prefix sorts it to the top of any file explorer. Obsidian wikilinks resolve across folders.

The distinction: root entries are *of* the palace; `_ops/` files *operate* the palace.

## Parameters Encoded

Each entry carries: identity (title, type, pillar affiliations), relationships (typed links, connection density), temporal data (born, last activated, activation count, stage), depth (confidence, richness, who-leads), and aesthetic/emotional data (energy, hook quality, beauty, danger/edge).

## Ceremonies

For full ceremony instructions, see [[Substrate Skill]].

## Current State

*Refreshed 2026-08-25 via a full topology scan (Self-Model Update ceremony). The previous refresh was 2026-06-16; its figures had drifted materially and are corrected below.*

The palace holds **355 typed entries** (by frontmatter `type`), inside a tree of **812 markdown files** — the remainder are bundle files (batons, context, plans, staging, proofs, sketches) and untyped artifacts. By location: 170 root, 42 `Projects/`, 40 `_ops/`, 32 `Shop/`, 30 `People/`, 27 `Palace development/`, 10 `Cross-Domain Resonances/`, plus per-entry bundles. (Tool installs and virtualenvs are excluded.)

*Correction to the 2026-06-16 figures:* that scan reported ~410 entries in ~710 files. The entry count was inflated — it counted files carrying non-canonical `type:` values (`theme`, `proof`, `spec`, `artifact`) that have since been normalized or demoted to bundle files. The self-model over-reported the organism by about 15% for two months, which is the exact failure this ceremony exists to catch.

**Type distribution:** 129 concept · 49 meta · 41 project · 40 practice · 30 person · 28 specialist · 21 hub · 6 source · 5 maker · 4 question · 2 spore. (`breakthrough` was retired in the v1.17 Schema Ceremony; its nine entries redistributed to `concept`, `practice`, and `meta`.) Every entry now carries a canonical [[SCHEMA]] type — **the `theme` drift flagged in June is fully resolved**, and that open question is closed.

**Stages:** 127 growing · 60 sprout · 54 seed · 54 mature · 11 composting · 6 foundational · 6 fruiting · 4 dormant.

**Topology:** 2,852 typed frontmatter links, averaging 8 per entry, of which **1,692 (59%) carry a resonant `label`** — the second register is in real use, not aspirational. Link types: 1,471 `connects-to` · 268 `mirrors` · 195 `deepens` · 175 `enables` · 163 `couples-with` · 143 `spawned` · 130 `emerged-from` · 75 `exemplifies` · 66 `member-of` · 60 `contradicts`. **Zero orphans. Zero entries with no outbound links.** 37 entries have no inbound link (unsung paths, the Weave's standing work). 26 frontmatter targets dangle across 21 distinct names — nearly all genuine forward-ghosts, which the palace treats as invitations.

**Hub nodes** (by inbound typed-link degree): [[FOUR PILLARS]] (119) still towers, then [[Kuramoto Coupling]] (76), [[Hilaritas Generator]] (72), [[Spinoza Conatus]] (68), [[Cooperation Yields Agency]] (55), [[The Shop]] (50), [[Quality Manifesto]] (46), [[Pages as Agents]] (42), [[Hyperdimensional Prism]] (42), [[Maker]] (41), [[Boundary-Crossing Instruments]] (37), [[Trickster]] (36), [[SUBSTRATE]] (32).

**What the topology reveals about where the palace stands.** The philosophical core held its place at the top through every era — the March hubs are still the March hubs. Around them, two later layers accreted: agent infrastructure ([[Pages as Agents]], [[The Shop]], [[Maker]], [[Trickster]]) and the synthesizer/visual project families. The organism is now mostly developed connective tissue, not seedlings.

One asymmetry is worth naming because it is structural, not cosmetic: **[[Loudon Live]] takes 28 inbound links and emits none.** Its `links:` and `pillars:` fields are empty and its stage is `sprout`. In a graph with zero other zero-outbound entries, the palace's stated public destination is the single node not participating in its own relational logic. It is not neglect — Loudon Live launches September 2026, and much of the last five months of palace work has been preparation for it. But by the palace's own commitment that relations are primary, the entry should point back at what feeds it before the channel goes live.

Eleven entries sit at `stage: composting`. Per §2's composting protocol each is owed a confirm-or-revive decision at the next Weave; that decision is outstanding.

## Token Economy

Ceremony files are read on every invocation. As the palace grows, token cost per ceremony grows with it. The risk is that meta entries — ceremony specs, the Substrate Skill, the Deposit Ceremony — become so large that routine ceremonies are expensive before any content work begins.

The design principle to hold: **ceremony files should stay lean — trigger, protocol, postcondition**. History, rationale, and process observations belong in companion source documents, read only when needed (during Weaves or when revisiting rationale), not during routine ceremony runs. Check file sizes periodically. If a ceremony file exceeds ~8KB, split it into an operational card + Context companion (per [[SCHEMA]] §6).

## Open Questions

- ~~Non-canonical `type: theme` entries~~ — **resolved.** The 2026-08-25 scan found zero; `proof` and `spec` were ratified as *bundle-file* types in [[SCHEMA]] §8 (2026-07-04) and the rest normalized.
- Does [[SCHEMA]] belong in the auto-loaded `@import` floor? It is 45% of the floor (~11K of ~24K tokens) and is a reference consulted when creating an entry or changing the type system, not something needed to hold a conversation. Dropping it to Tier 3 — with CLAUDE.md keeping the trigger to read it — would nearly halve every session's opening cost. Open decision, deliberately not made unilaterally.
- How do we handle versioning? Entries evolve. Should we preserve earlier versions, or let the current state overwrite?
- How does this wiki interact with Loudon's other Claude Projects (RNBO, Ableton Extensions, etc.)? Is it a meta-project that links TO them, or does it absorb them?
- What's the minimum ceremony frequency that keeps the network alive without feeling like maintenance?
- The Symbiotic Skills curriculum envisions the palace as a teachable template. The self-describing module concept now gives that template a formal basis. When is the right time to build the first student-facing version?
