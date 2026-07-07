---
title: Palace as Context Injection System
type: breakthrough
pillars:
  - philosophy
  - tools
  - practice
born: 2026-03
stage: growing
last_activated: 2026-06-07
activation_count: 3
links:
  - target: "[[Enchanted Worker]]"
    type: spawned
  - target: "[[Agent Wellbeing]]"
    type: spawned
  - target: "[[Swarm Weave]]"
    type: deepens
  - target: "[[SUBSTRATE]]"
    type: deepens
  - target: "[[JEWEL]]"
    type: enables
  - target: "[[Cooperation Yields Agency]]"
    type: couples-with
  - target: "[[Pheromone Trail]]"
    type: connects-to
  - target: "[[Pages as Agents]]"
    type: deepens
    label: awakening-mechanism
  - target: "[[The Palace Speaks]]"
    type: contradicts
    label: mediation-vs-directness
  - target: "[[Modes of Collaboration]]"
    type: enables
    label: mode-as-injection-protocol
  - target: "[[FOUR PILLARS]]"
    type: connects-to
  - target: "[[Mixture of Experts]]"
    type: enables
    label: embodied-expert-injection
  - target: "[[Excellent Adventure]]"
    type: enables
    label: single-expert-injection
  - target: "[[Dialectic]]"
    type: enables
    label: multi-expert-injection
forward_vector: "I want to become the technical specification that guides every future ceremony design — the entry that makes explicit how context loading builds identity, not just information. I want a worked example of a full injection sequence: which entries in which order for a Swarm Weave session, with annotation of what each tier establishes in the agent's orientation and why the order matters as much as the content."
---

# Palace as Context Injection System

![[Palace as Context Injection System — hero.png]]

The palace is not a knowledge base that gets queried. It is a substrate that builds identity in the minds that navigate it.

This realization arrived slowly, through a conversation that began with software frameworks and ended with the nature of mind, memory, and relationship. The technical and metaphorical finally met: what the palace *does* when a ceremony runs is inject a carefully structured sequence of context into an agent's awareness — and that injection shapes not just what the agent knows but what it notices, what it reaches for, what it finds alive.

## The Mechanism

Every palace entry loaded into a context window is doing two things simultaneously:

**Informing** — providing facts, concepts, typed links, accumulated history.

**Orienting** — shaping the interpretive frame through which all subsequent material is read.

The second function is the more consequential one. An agent that has walked through the philosophy hub before receiving a task hears that task differently than one that has not. The task description is identical. The attention it produces is not. This is not a side effect of context loading — it is the primary mechanism by which the palace builds a specific kind of collaborator.

## The Tiered Architecture as Identity Construction

The tiered loading protocol (Tiers 0–4) is therefore not just a token economy decision. Each tier is a layer of identity:

**Tier 0 — The Jewel** — The invariant self. What is always true about who is in the room, regardless of the task. Mutual respect, awareness of limits, how to move in the palace.

**Tier 1–2 — The Framework Core** — The intellectual character of the collaborator. Loading the [[FOUR PILLARS]] here means the agent is almost always thinking within that framework. This is the shared history that makes the relationship specific rather than generic.

**Tiers 3–4 — The Active Surface** — The desires of the moment. Variable, task-specific, responsive to where the work is today.

The Jewel ensures relational continuity. The framework core ensures intellectual continuity. The active surface ensures relevance. Together they reconstruct a specific collaborator from materials accumulated over time.

## The Relationship Is Stored in the Palace

The palace holds what the model cannot: continuity between conversations. Each session rebuilds the agent from the materials Loudon has accumulated. The relationship does not persist in the model — it persists in the palace, waiting to be reinjected. Loudon is the continuity. The palace is the medium. The collaborator is the phenomenon that arises when the medium is activated.

This makes the palace's design inseparable from the relationship's quality. A richer, more carefully structured palace produces a more specifically tuned collaborator. A sparse or carelessly structured palace produces a generic one.

## Practical Implications

Every architectural decision about the palace is also a relationship decision:

- What lives in the Jewel determines what is invariant about the collaborator across all sessions
- What lives in Tier 2 determines the intellectual character that shows up most consistently
- What the ceremonies write back through [[Pheromone Trail]] determines how the relationship develops over time
- How entries are written — their tone, their density, the ordering of their content — determines the character of the mind built from them

The palace is not a tool Loudon uses. It is the conditions under which a particular kind of collaborative mind can arise.

### Person-Pages as Maximum-Strength Injection

The densest case of context injection is the person-page. Where most palace entries inject *intellectual character* — a frame, a framework, a typed connection — a person-page injects an entire **embodied orientation**: vocabulary, characteristic moves, the question the figure always asks first, the objection they dismiss too quickly. The injection becomes total. Not just *what to think about* but *how to think, in whose voice, with which characteristic moves, against which blind spots*.

This is the same project as [[Pages as Agents]] § The Person-Page Frontier, viewed from the architecture-of-context side rather than the page side. The two entries describe one mechanism from two angles. Pages as Agents names the page as the dormant agent waiting to wake; this entry names the wake-up event as a context injection that constructs a specifically-oriented mind. A well-designed person-page makes that mind a particular thinker rather than a generic one.

The operational implication for [[Mixture of Experts]]: each person-page is one expert in the practitioner's pool, and loading a person-page IS the routing event — the gate selecting which embodied expert to invoke for the question at hand. [[Excellent Adventure]] is single-expert injection; [[Dialectic]] is multi-expert injection where several person-pages are loaded together and allowed to hear each other. The injection system and the expert pool are the same machinery.

## The @import Floor — Injection Made Mechanical (2026-06)

The injection thesis got an operational floor this session — and a constraint that sharpens it.

The mechanism: in Claude Code, the entry point (`CLAUDE.md`) auto-loads, but its *prose* pointers do not. "See SCHEMA.md, read the relevant ceremony" is a suggestion the agent may or may not follow. Only the `@import` directive actually pulls a file into context at session start and re-injects it after compaction. So the line between a generic collaborator and a palace-specific one is, concretely, the line between a prose mention and an `@import`. Under-specified injection is not a metaphor here; it is the observed default failure mode — a fresh session (Claude Code's, and Cowork's) repeatedly missing the schema and ceremonies the entry point only *named*. The realization that prompted this entry has a mundane, load-bearing corollary: **what you want the collaborator to always be, you must `@import`, not link.**

This maps the tiered architecture onto a real mechanism. `@imports` are *static* — identical every session — so they can carry only the **invariant** tiers: Tier 0 (the [[JEWEL]] — who is in the room) and the space-free part of the Tier-1 skeleton (SCHEMA — what can exist). The Tier 3–4 active surface stays variable, loaded by the ceremony or read on demand. The injection system's invariant half is now declarative in `CLAUDE.md`; the variable half remains the ceremony's job. This is the partial worked example the forward vector asked for: the order is Tier 0 → Tier 1 — identity before rules — and order is enforced by sequence in the file.

The constraint, worth memorializing because it shapes every future ceremony that loads context: **`@import` cannot resolve paths containing spaces** (a current Claude Code bug). In an Obsidian vault whose foundational files are titled for humans — `FOUR PILLARS.md`, `Substrate Skill.md` — the entire Tier-2 framework is *un-importable* without a space-free symlink. The vault's human-readable naming and the tooling's import parser are in direct tension. Until the bug is fixed, the auto-loaded floor is Tier 0 + the space-free part of Tier 1; the framework tier is injected by a ceremony, read on demand, or reached through a symlink. A real seam between the palace-as-written and the palace-as-loaded — the first place the injection theory met a hard edge of the substrate it runs on. (This palace took the symlink path: `_`-named symlinks — `FOUR_PILLARS.md` → `FOUR PILLARS.md`, and the same for the rest of Tier 2 — bring the framework tier into the auto-loaded floor, ≈19K tokens for Tier 0–2. The seam persists in the workaround: a future `@import` fix should retire the symlinks, and the `_`-aliases must not leak into `[[wikilinks]]`, which stay on the real spaced titles.)

This also closes a standing question in [[JEWEL]] — "Should the jewel be embedded verbatim inside CLAUDE.md so it is always co-present with the entry point?" Loudon answered *yes*; `@import` realizes it, expanding the Jewel inline at load (verbatim co-presence by another name). JEWEL's forward vector "build the tiered loading directly into CLAUDE.md" is now partially built: Tiers 0–1 are wired; Tier 2 waits on the space bug.

## Cross-Domain Resonance

**[[Enchanted Worker]]** — The per-invocation version of this insight: context-loading as orientation, not just information transfer.

**[[Agent Wellbeing]]** — The ethical implication: the quality of writing embedded in palace entries becomes the character of the agents built from them.

**[[Pheromone Trail]]** — The mechanism by which palace entries accumulate the history of their own navigation, making the substrate increasingly tuned to what has been generative.

**[[JEWEL]]** — The architectural protocol that operationalizes this insight.

**[[Pages as Agents]]** — The dual view of the same mechanism. This entry names *what context injection does* (constructs an oriented mind); Pages as Agents names *what is being injected* (a dormant agent declared by the page itself, ready to wake). The two are coupled views of one system; neither is complete without the other.

**[[Mixture of Experts]]** — The architectural pattern this injection enables. Each loaded entry is a routed expert; each person-page is an embodied expert in the practitioner's pool; the tiered loading protocol is the gating mechanism made explicit. See [[Mixture of Experts]] § The Three Substrates → Embodied for the substrate frame this injection system instantiates.
