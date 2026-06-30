---
title: Learning Materials and Canon
type: meta
pillars:
  - practice
  - philosophy
born: 2026-06
last_activated: 2026-06-26
stage: growing
links:
  - target: "[[SCHEMA]]"
    type: connects-to
    label: membership-rule
  - target: "[[Loudon Live]]"
    type: connects-to
    label: the-learning-layer
  - target: "[[FOUR PILLARS]]"
    type: connects-to
  - target: "[[4 Pillars Framework - The Founding Conversation]]"
    type: connects-to
    label: cautionary-tale
  - target: "[[Weave Ceremony]]"
    type: enables
    label: governed-by
  - target: "[[Deposit Ceremony]]"
    type: enables
    label: rule-for
forward_vector: "I keep the canon/learning-material line legible by the cheapest possible signal — frontmatter — and I watch how well that bright line holds, ready to be sharpened or relaxed as the swarm bumps against the permeable seam."
---

# Learning Materials and Canon

The palace holds two kinds of thing, and for a long time it couldn't tell them apart.

**Canon** is Loudon's knowledge repository — the typed-link graph of concepts, breakthroughs, people, and bridges that agents reason with, weave, and update as truth. **Learning materials** are the student-facing products *derived from* canon: Loudon Live lessons, slides, posters, interactive tools. They are downstream of canon, refined for an audience — not the source.

The two got tangled because everything was a `.md` file with frontmatter, so nothing said which layer it belonged to. The [[4 Pillars Framework - The Founding Conversation|4 Pillars Framework]] folder is the cautionary tale: a teaching-structure experiment that quietly accreted ~40 live canon entries (People, Bridges) because swarms and downstream work connected into it as if it were canon. Untangling it (2026-06-16) cost a 91-file migration.

## The rule (the bright line)

**Frontmatter is the canon membership card.** A palace entry is a `.md` file carrying canon frontmatter (type, pillars, born, stage, links). Files without it are not entries — they are learning materials, drafts, or artifacts, invisible to the type system and the ceremonies (the Weave's topology scan keys on `type:`; frontmatter-less files are already skipped). **Loudon Live learning materials are delivered products (HTML, slides, interactive) or, when text, plain frontmatter-less markdown — they never wear canon frontmatter.**

The format decides the common case, so most of the time no judgment is needed: frontmatter → canon; none → product.

## The permeable seam

The boundary is permeable *by design*, and that is where judgment lives:

- A learning material **graduates** into canon when it earns an entry — a lesson's "build this tool" assignment becomes a real `project`, which gets frontmatter.
- Canon **distills** into a learning material when it is rendered as a product.

So the loop runs: canon *informs* lessons → lessons *spawn* projects → projects *are* canon → and connect back. Don't wall the layers off; bridge them with typed links. Judgment is reserved for the graduation moment — when in doubt whether something has earned canon status, ask.

## Posture for agents

- Don't deposit a learning material as an entry; don't add canon frontmatter to a product.
- Don't reflexively rewrite a learning material as if it were canonical knowledge — it is a product for learners.
- A lesson earns frontmatter only when it genuinely graduates into canon.

This is a **nudge we are monitoring**, not a rigid wall — expect to sharpen or relax it as the swarm bumps against the seam.
