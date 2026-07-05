---
title: "Semantic Delay — substitution chain mockup"
born: 2026-05-04
links:
  - target: "[[Semantic Delay]]"
    type: connects-to
    label: proof-of
forward_vector: "I am the substitution-chain mockup for Semantic Delay — a text proof of how a word decays into its neighbors across the delay taps."
---

# Substitution chain — what the delay tap actually does

A mockup of what Semantic Delay's output stream looks like when the input phrase is held against an embedding-space neighborhood of size *r*, with each delay tap pulling a substitute from progressively further away.

The ghost is not the same word played later — it is a **conceptually adjacent** word played later. As taps recede in time they also recede in meaning.

---

## Input phrase

> *"the river remembers everything it has touched"*

---

## Tap 1 — ⅛ note delay, r = 0.05  (synonym neighborhood)

> *"the river recalls everything it has touched"*

Almost identical. The substitution is a near-synonym. A listener would only catch it on second pass.

## Tap 2 — ¼ note delay, r = 0.12  (close kin)

> *"the stream remembers all it has held"*

`river → stream`, `everything → all`, `touched → held`. Still recognizably the same statement; the surface has shifted.

## Tap 3 — ½ note delay, r = 0.25  (cousins)

> *"the current carries each thing it has known"*

The verb has migrated from memory to motion. The phrase still belongs to the river, but it's a different river.

## Tap 4 — whole note delay, r = 0.45  (genus boundary)

> *"the road repeats every place it has crossed"*

`river → road`. The substrate has changed but the shape — *a thing that retains the trace of its passage* — survives. This is where the delay starts being heard as a different statement.

## Tap 5 — 2 whole notes, r = 0.7  (other side of the embedding)

> *"the page forgets nothing it has shown"*

We've crossed into a different domain entirely. River and page share only the abstract structure: *medium retaining inscription*. The sentence is grammatically the same, semantically a sibling, sonically a cousin.

## Tap 6 — 4 whole notes, r = 0.95  (antipode)

> *"the silence answers each cry it has swallowed"*

Maximum semantic distance. The original "river" and this "silence" share, perhaps, only that something is held in something else. At this radius the listener experiences the delay as a separate voice — a chorus of speakers each saying their own version of the original truth.

---

## What this artifact is and isn't

**Is:** a mock of the perceptual texture, hand-curated. Shows what good output should *feel* like across the radius axis, so the build has a target to hit.

**Isn't:** model output. The Phase 1 plan calls for a real embedding-space neighbor sampler against a sentence-level model. This mock just demonstrates that the project's premise — *delay-as-semantic-distance* — produces musically/poetically interesting material. If the real model can hit this kind of progression at r=0.05 → r=0.95, the project lives.

## The next concrete check

Pick three test phrases of different shapes (declarative, question, fragment) and run a real embedding-neighbor sampler at the six radii above. If the radius progression survives across phrase shapes, the architectural assumption is validated and Stage 0's pass/fail check has a real target.
