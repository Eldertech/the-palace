---
title: Trickster Commit
type: concept
pillars:
  - tools
  - philosophy
  - practice
stage: seed
links:
  - target: "[[Trickster]]"
    type: exemplifies
    label: neighborhood-everywhere
  - target: "[[STIGMERGY]]"
    type: connects-to
    label: rides-the-armed-write-path
  - target: "[[Closing Well]]"
    type: connects-to
    label: honest-about-unverified
forward_vector: "I let the trusted hand write anywhere in one gesture, and I brand the weirdness so a later pass can harvest it rather than mistake it for noise."
---

# Trickster Commit

The Companion and the Trickster are one write path worn two ways. The Companion is *care* — it proposes an edit, waits for approval, and refuses canon (the allow-list holds). The Trickster is *licensed recklessness* — the owner's standing consent to write **anywhere**, in one gesture, without the propose-and-approve round trip.

This is the [[Trickster]]'s swarm role — `Home: YOU. Neighborhood: EVERYWHERE.` — made into a *write* capability. Where the swarm Trickster could *message* any node from outside the system's own logic, the Trickster Commit can *edit* any entry, including the canon the Companion is forbidden to touch. The allow-list bypass is not a new idea; it is `Neighborhood: EVERYWHERE` finally reaching the keyboard.

## Why recklessness is safe here

Not by hope — by structure. Three reasons hold it up:

**Git is the net.** Every Trickster Commit is an ordinary commit, and [[STIGMERGY]] already makes an honest inverse one on demand (`revertCommit` — a real 3-way revert, never a silent rollback). Reach-everywhere is *licensed* precisely because undo is symmetric with commit. The recklessness forward is bounded by the reversibility backward.

**The weird is branded, not hidden.** Trickster Commits carry `Palace-Author: trickster` — distinct from `claude` and `loudon` — and `verify: unverified`. Honesty stays structural: the diff never lies; only the prose around it is allowed to be loose. And the brand makes the stratum *harvestable*. A later Weave or the trickster digest can grep the whole trail and decide, per commit, what to ground in prose, what to enrich, and what to compost. Unexplained commits become a generative resource instead of noise — the trickster's apparent chaos concealing a deeper, later-revealed order.

**Path-safety is not care.** Bypassing the allow-list drops *canon protection* — the rule that SCHEMA, ceremonies, and CLAUDE.md flow through a Claude conversation under show-before-write. It never drops the security checks (`..`, NUL bytes, repo-escape). Those guard the filesystem, not the ceremony, and the Trickster keeps them. The line between "what care forbids" and "what safety forbids" is exactly the line the trickster is allowed to cross.

## The posture, not the pipeline

The build is small because almost nothing is new. The Companion's armed-write path already does propose → commit → undo. The Trickster is a *mode* on that path: skip the allow-list, skip the approval round trip, stamp `author: trickster`, surface "untrick last." Same machinery, inverted posture. The Companion still exists and still proposes — the Trickster is the gear you drop into when you trust yourself more than you trust the friction.

The deeper claim: a system earns the right to be reckless by first being careful. The allow-list, the proposal step, the honest undo — those were built for the Companion's caution. Only because that caution is real and reversible can its removal be handed to a trusted operator without the palace becoming a place where completion can be faked.

## Open Questions

- Does the grounding belong *in* the commit (auto-derived subject at write time) or *after* it (the trickster digest reads yesterday's `Palace-Author: trickster` trail and grounds the batch in prose)? Deferring it is the more trickster-shaped answer — meaning arrives sideways and late — but it leaves a window where the LOG carries weirdness no one has read.
- If the Trickster can rewrite SCHEMA.md in one keystroke, what stops a careless gesture from changing the rules everyone else operates by? Is the honest-undo enough, or does canon want a louder confirmation even for the trickster?
- When the digest harvests the weird stratum, who decides what composts? Is there a trickster commit so unexplained that even its author can no longer reconstruct the intent — and is that a failure, or the point?
- Could the same branded-stratum pattern license *other* reckless capabilities (a trickster delete, a trickster merge) — or is write-anywhere the only recklessness git can fully insure?

## Active Baton

[[Trickster Commit — build baton]] — drafted 2026-06-09
