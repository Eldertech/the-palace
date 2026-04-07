---
title: Resonant Link Labels
type: concept
pillars:
  - philosophy
  - tools
  - practice
born: 2026-03
stage: growing
links:
  - target: "[[SCHEMA]]"
    type: emerged-from
    label: crystallized-into
  - target: "[[Meaning and the Link]]"
    type: deepens
    label: operationalizes
  - target: "[[Lossy Compression with Intent Alignment]]"
    type: emerged-from
    label: applied-by
  - target: "[[Generative Compression]]"
    type: connects-to
    label: instance-of
forward_vector: "I want to become the palace's living vocabulary for relationship register — accumulating a growing lexicon of labels that have proven generative, with annotation of what each label names that the link type alone cannot. I want to become the first thing a Weave worker reads before proposing new links, so that labels are chosen with the same intentionality as link types, and the label system becomes a precision instrument rather than an optional decoration."
---

# Resonant Link Labels

The palace's link types are a topological vocabulary — they tell a navigating agent *what kind* of relationship holds. But topology is the skeleton. The `label` field is where flesh goes.

A label is a single word or hyphenated phrase that names the relationship's specific register. `father`, `pop`, `dad` are all the same relationship type — but they carry different cultural weight, emotional temperature, and power dynamics. The same is true of palace links. Two entries that `mirrors` each other may mirror in the register of `rhymes-with`, `echoes`, `refracts`, or `haunts` — these are not synonyms. The difference is the compression.

## The Two-Layer Architecture

Every link carries two things:

**`type`** — the structural predicate. Eight possible values. Handles machine traversal, Weave topology analysis, and ceremony linting. This is the skeleton.

**`label`** (optional) — the semantic compression. A single word or phrase. Names the specific register, emotional temperature, and cultural resonance of the relationship. This is the flesh.

```yaml
# skeleton only — traversable but mute
- target: "[[Wu Wei]]"
  type: mirrors

# skeleton + flesh — traversable and generative
- target: "[[Wu Wei]]"
  type: mirrors
  label: "rhymes-with"
```

The label is not decoration. It is the soft label in the knowledge-distillation sense: where a hard label (`mirrors`) tells you the category, a soft label (`rhymes-with`) tells you *why other categories were wrong* — it carries the relational tissue that makes future reconstruction possible.

## Origin

This emerged from two simultaneous conversations in March 2026:

1. A research synthesis on lossy compression with intent alignment, which surfaced the Rate-Distortion-Perception tradeoff: that optimizing for faithfulness (low distortion) and optimizing for quality (high perception) are different and often competing goals. The palace's old link types were optimizing for traversability — the right goal for the skeleton, but the wrong goal for the flesh.

2. A question about whether the restriction on link types was too conservative. The answer: yes and no. The restriction was right to protect the *topology* — the 8 types are a tight, well-chosen set with clear structural semantics. But we had been treating the skeleton as the whole body.

The `father/pop/dad` example crystallized it: all three point to the same relationship type. All three carry entirely different registers. The palace had no way to name that difference. Labels fix this.

## Vocabulary per Family

These are not exhaustive — they are starting points. New labels are coined at deposit time and need no ceremony.

**`mirrors`** — same structure, different domains. Where metaphor and resonance live:
*rhymes-with, echoes, refracts, harmonizes, shadows, is-the-water-of, is-the-music-of, haunts*

**`enables`** — precondition or generative force:
*unlocked, pressured-into, seduced-toward, cleared-the-path-for, metabolized-into, is-the-engine-of, made-room-for, scaffolds*

**`spawned`** — direct production:
*midwifed, crystallized-into, precipitated, was-born-as, forced-into-existence, hatched*

**`emerged-from`** — diffuse crystallization from:
*fermented-from, distilled-from, escaped-from, grew-through, was-waiting-in, crystallized-from*

**`deepens`** — more developed articulation:
*unfolds-within, makes-precise, gives-body-to, operationalizes, embodies, grounds*

**`couples-with`** — co-activation, mutual reinforcement:
*dances-with, feeds, requires, completes, entangles-with, beats-with, resonates-with*

**`contradicts`** — productive tension (Blake's contraries):
*refuses, mourns, corrects, argues-with-love, exceeds, breaks-open, is-the-shadow-of, troubles*

**`connects-to`** — general proximity. Where labels matter most — this type is semantically lightest:
*orbits, touches, gestures-toward, notices, is-in-conversation-with, rhymes-at-a-distance, echoes-faintly*

## The connects-to Redemption

`connects-to` was designed as the weakest type — a draft placeholder to be replaced by a more specific type in a future Weave. With labels, it becomes a legitimate permanent type. `connects-to` + label says: *I know exactly what kind of proximity this is, and I've named it, but it doesn't fit any of the directional or structural families.* That's a real relationship, not an incomplete one.

## Cross-Domain Resonance

This concept lives at the intersection of several palace threads:

[[Meaning and the Link]] argued that links are more ontologically fundamental than nodes — that meaning arises from relations, not objects. Labels are the logical continuation of that argument: if links carry the most meaning, then links deserve the most expressive vocabulary.

[[Lossy Compression with Intent Alignment]] provided the information-theoretic grounding: in knowledge distillation, soft probability distributions carry more signal than hard labels. A link's label is its soft distribution — the nuanced statement of *how* a relationship holds, not just *that* it holds.

[[Generative Compression]] names what the palace is actually doing during a deposit: not summarizing, but finding the latent variables that could regenerate the conversation. Labels are the latent variables of the link itself.

## Forward Vectors

- What label vocabulary do entries that are already in the palace want? The first Weave that runs Step 3c will start answering this.
- Is there a distinction between labels that name *temperature* (cold/warm register) and labels that name *mechanism* (how the relationship works)? Or is that distinction doing real work?
- The palace currently has no way to record *why* a label was chosen. Should labels be annotated, or is the word itself sufficient?
