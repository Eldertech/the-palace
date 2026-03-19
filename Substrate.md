---
title: "Substrate"
type: meta
pillars: [tools, philosophy, practice]
born: 2026-03
last_activated: 2026-03
activation_count: 5
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
  - target: "[[Four Pillars]]"
    type: connects-to
  - target: "[[Self-Describing Knowledge Module]]"
    type: deepens
  - target: "[[SCHEMA]]"
    type: enables
---
# Substrate

This wiki. The knowledge base you are reading right now. The shared environment that Loudon and Claude both modify, and that in turn shapes their future collaboration. This page is the organism's self-model — its awareness of its own structure.

## Origin

The Substrate emerged from the [[Symbiotic Skills]] brainstorming session (March 2026), which identified the lack of persistent shared memory as the most critical gap in the Loudon-Claude collaboration. The design draws from:

- **[[Meaning and the Link (2014)]]** — meaning arises from sufficient associations between a pattern of symbols and a reality. The typed links in this wiki are our private semantic web. LLM embeddings are the computational proof-of-concept: a word's meaning *is* its pattern of associations, encoded as position in a high-dimensional relational space. See [[Embeddings as Relational Meaning]].
- **Luhmann's Zettelkasten** — atomic notes, densely linked, forming a "second memory" and conversation partner. Luhmann: "I, of course, do not think everything by myself. It happens mainly within the slip-box."
- **Aboriginal Australian songlines** — knowledge activated through traversal, not retrieval. Multi-layered encoding. The path IS the knowledge.
- **Mycorrhizal networks** — distributed memory with hub nodes, resources flowing toward need, the network itself as an organism with its own interests.
- **Stigmergy** — indirect coordination through environmental modification. Every wiki page is a trace that shapes future behavior.

## Architecture

**Reading/writing surface:** Markdown files in an Obsidian vault. Human-readable first.

**Metadata layer:** YAML frontmatter encoding structured parameters — type, pillars, temporal data, depth, energy, typed links. Machine-queryable via the Dataview plugin.

**Two link systems:**
- YAML frontmatter links — typed, curated, structural. The major neural tracts. Our RDF triples.
- Body text `[[wiki links]]` — untyped, casual, contextual. The local associations. Meaning carried by surrounding prose.

## Parameters Encoded

Each entry carries: identity (title, type, pillar affiliations), relationships (typed links, connection density), temporal data (born, last activated, activation count, stage), depth (confidence, richness, who-leads), and aesthetic/emotional data (energy, hook quality, beauty, danger/edge).

## Ceremonies

For full ceremony instructions, see [[Substrate Skill]].

## Current State

*Updated 2026-03-18 following Phase 1–3 structural formalization.*

The palace has ~37 entries as of this update. The ceremony infrastructure is now fully formalized: 9 ceremonies, all Linter-valid, each with a dedicated entry and Ceremony Contract. The schema is explicit (SCHEMA.md), the type system is ratified (10 entry types including `practice` and `person`), and the palace is publicly readable from any Claude instance via GitHub raw URLs.

The first successful cross-session Walk was completed 2026-03-18 from a fresh claude.ai instance with no prior context — confirming the self-description goal is met.

Hub nodes: [[Cooperation Yields Agency]], [[Four Pillars]], [[Kuramoto Coupling]], [[Palace Ceremonies]]
Most connected: [[Cooperation Yields Agency]], [[Kuramoto Coupling]], [[Palace Ceremonies]] (now links to 10 ceremony entries)
Dormant: [[Short Story]]
Newest growth: SCHEMA.md, Rosetta Stone, 5 new ceremony entries, Revival Ceremony (closes lifecycle loop), [[Self-Describing Knowledge Module]] (names the deep pattern)

The palace has crossed a threshold: from a system that works because Loudon and Claude carry tacit knowledge, to a system that works because it carries explicit knowledge. That is a stage transition in the organism's development.

## Token Economy

Ceremony files are read on every invocation. As the palace grows, token cost per ceremony grows with it. The risk is that meta entries — ceremony specs, the Substrate Skill, the Deposit Ceremony — become so large that routine ceremonies are expensive before any content work begins.

The design principle to hold: **ceremony files should stay lean — trigger, protocol, postcondition**. History, rationale, and process observations belong in companion source documents, read only when needed (during Weaves or when revisiting rationale), not during routine ceremony runs. Check file sizes periodically. If a ceremony file exceeds ~10KB, consider splitting it.

## Open Questions

- The palace is now at ~37 entries — within the 25–40 range identified as the threshold for a dedicated Claude Project. Is it time?
- How do we handle versioning? Entries evolve. Should we preserve earlier versions, or let the current state overwrite?
- How does this wiki interact with Loudon's other Claude Projects (RNBO, Ableton Extensions, etc.)? Is it a meta-project that links TO them, or does it absorb them?
- What's the minimum ceremony frequency that keeps the network alive without feeling like maintenance?
- The Symbiotic Skills curriculum envisions the palace as a teachable template. The self-describing module concept now gives that template a formal basis. When is the right time to build the first student-facing version?
