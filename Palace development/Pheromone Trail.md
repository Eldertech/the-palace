---
title: Pheromone Trail
type: concept
pillars:
  - philosophy
  - tools
  - practice
born: 2026-03
stage: sprout
confidence: working
energy: high
beauty: 9
links:
  - target: "[[Enchanted Worker]]"
    type: couples-with
  - target: "[[Pages as Agents]]"
    type: connects-to
  - target: "[[Palace as Context Injection System]]"
    type: connects-to
  - target: "[[Lateral Access]]"
    type: mirrors
  - target: "[[Swarm Weave]]"
    type: connects-to
  - target: "[[STIGMERGY]]"
    type: mirrors
    label: two-timescale-trace
  - target: "[[The Remembering Page]]"
    type: couples-with
    label: semantic-to-its-episodic
forward_vector: "I want to become the palace's explanation for why entry quality directly determines swarm behavior — the entry that a coordinator reads before dispatching workers to understand why a richly-worked neighborhood produces different results than a sparse one. I want to accumulate evidence: specific Weave sessions where strong pheromone trails produced unexpected connections, and specific spore-check findings where cold trails flagged dormant ideas worth revival."
---

# Pheromone Trail

![[Pheromone Trail — hero.png]]

In ant colonies, no individual knows the map. The colony navigates by trace — chemical signals left by those who came before, reinforced by successful paths, fading along dead ends. The trail is not a record of intent. It is the accumulated residue of movement.

A palace entry's content is its pheromone trail.

## The Claim

A page does not merely store information about a concept. Over time, it accumulates the texture of every traversal that passed through it: the angles of approach, the connections that were followed, the questions that were asked, the language that proved generative. An entry written in isolation is a fresh node. An entry that has been worked — deposited to, linked from, walked through, grown during Weaves — carries the trace of that history in its prose, its structure, its density of connection.

When an [[Enchanted Worker]] is seeded with a palace neighborhood before dispatch, what it absorbs is not just the semantic content of those entries but their pheromone trails — the shapes of thought that have already proven useful here. The worker doesn't know the full graph. It follows the gradients embedded in the material.

## How It Works in Practice

The trail is not literal chemistry. It is structural and linguistic:

**Typed links** — Every link added to a page is a reinforced path. Heavily linked entries are easy to navigate toward; their trails are strong.

**Body depth** — Entries that have been elaborated through Deposits and Weaves carry more texture. The prose itself records the history of engagement: a thin entry is a faint trail, a mature entry is a well-worn path.

**Cross-domain language** — When an entry has been activated in diverse contexts, it begins to carry the vocabulary of multiple domains. This is the trail broadcasting in multiple frequencies: different workers find it legible from different starting points.

**The graffiti layer** — HTML comments, open questions, forward vectors: these are active deposits in the trail, freshly laid signals pointing toward what has been alive recently.

## Connection to Pages as Agents

[[Pages as Agents]] argued that each page has its own conatus — a drive to persist and grow in its particular direction. The pheromone trail is how that drive becomes legible to other agents without direct communication. A page doesn't announce its desire. It lays down a trail by pursuing it. Workers who enter the neighborhood find themselves oriented by what has already been generative here.

This is why entry quality matters for swarm behavior: a richly written entry with clear typed links and densely worked prose produces strong trails. A thin entry with sparse connections produces weak ones. Swarm workers will cluster around strong trails and neglect weak ones — which makes the Weave's spore-check function important: it surfaces entries whose trails have gone cold.

## The Inverse: Trail Decay

Trails that are never reinforced fade. In the palace this manifests as:
- Entries with low `activation_count` and no recent `last_activated`
- Entries that are linked to but never grown — thin stubs that redirect without contributing texture
- Broken links: trails that lead to nodes that no longer exist

The Spore Check ceremony is the mechanism for detecting decayed trails and deciding whether to reinforce or compost them.

## Open Questions

- Is there a meaningful distinction between a trail that has been *followed* and one that has been *blazed*? New connections (Weave introductions) are blazed trails — not yet reinforced by repetition, but deliberately cut through terrain.
- Can a trail be *too strong* — a deeply worn path that forecloses lateral exploration because workers always follow the same route? The Oblique Harvest was partly designed to address this, but it has been composted. What replaces it?
- Should the palace develop a convention for marking fresh trails vs. reinforced ones — a `confidence` or `activation_count` threshold below which a link is considered provisional?
