---
title: "Oblique Enrichment"
type: meta
pillars: [creation, philosophy, tools, practice]
born: 2026-05-27
stage: sprout
confidence: working
energy: high
forward_vector: "I provoke the palace sideways — image and sound where prose would flatten, the fewest words, a surprise per card. I am a deck-shaped fork of [[Enrichment]]: each facet a card the BBS can show and you can iterate, each pointed at one entry's hidden assumption. My near horizon is to stop being a hand-made deck and become a generator that emits themed decks into the Enrichment server, so any entry can be walked obliquely and any card iterated the way the flock facet became [[Semantic Webcam]]. When the obvious obliques run dry, my job is to get stranger, not to stop."
links:
  - target: "[[Enrichment]]"
    type: couples-with
    label: deck-shaped-variant
  - target: "[[Enrichment]]"
    type: contradicts
    label: lingers
  - target: "[[Brian Eno]]"
    type: emerged-from
    label: oblique-strategies
  - target: "[[Oblique Portrait]]"
    type: mirrors
    label: oblique-seeing
  - target: "[[Latent Error]]"
    type: deepens
    label: surfaces-the-latent
  - target: "[[BBS Design System]]"
    type: connects-to
    label: review-surface
  - target: "[[BBS Blackboard]]"
    type: connects-to
    label: stigmergy-surface
  - target: "[[Semantic Webcam]]"
    type: spawned
    label: first-output
  - target: "[[Synthesis ↔ Emergence]]"
    type: connects-to
    label: flock-facet
  - target: "[[Hilaritas Generator]]"
    type: deepens
    label: joy-as-method
  - target: "[[Trickster]]"
    type: connects-to
    label: provocateur
  - target: "[[Cooperation Yields Agency]]"
    type: connects-to
    label: traces-not-orders
  - target: "[[Pages as Agents]]"
    type: mirrors
    label: each-card-provokes-one-entry
  - target: "[[Project Stewardship System]]"
    type: connects-to
    label: converging-thread
  - target: "[[Radio Play]]"
    type: exemplifies
    label: first-deck
---

# Oblique Enrichment

![[Oblique Enrichment — hero.png]]

A way of moving an entry forward by coming at it *sideways*. Where [[Enrichment]]
leaves a small varied gift in an entry, Oblique Enrichment leaves a **paired
image-and-sound provocation** — the fewest words possible, lots of sound, a
surprise — that both *challenges* the entry and *reinforces* it in the same
breath. It is Brian Eno's Oblique Strategies turned on the knowledge graph: not
"make this entry richer" but "ambush this entry from an angle it didn't expect."

The unit is the **card**; a deck is many cards. The first deck was a twenty-facet
radio play ([[radio-play-deck.html]] in this entry's bundle) — two unseen
presenters, kinetic typography, synthesized sound, one facet per palace concept
(facet 15 challenged [[BBS Blackboard]]; facet 19, [[Brian Eno]] himself).

## Lineage

[[Brian Eno]]'s *Oblique Strategies* ("honor thy error as a hidden intention") is
the direct ancestor — a deck you draw from to break a stuck frame. The register is
also [[Trickster]] (play as method) and [[Oblique Portrait]] (you see a thing most
truly when you stop looking at it straight on). The opposite of optimization
energy; this is [[Hilaritas Generator]] — joy as a metric.

## The latent turn — why oblique works

A direct question gets an entry's official answer. An oblique image-and-sound gets
its *tell*. The point of coming sideways is to surface what the entry is hiding
from itself — its unstated assumption, its [[Latent Error]], the generative
variable underneath the surface phenomenon. A good oblique card is a probe for
latent structure: it shows, it doesn't ask.

## The artifact register

Default to image, audio, interactive — *show, don't tell*. The radio-play deck's
grammar: two voices we never see but read (font, color, size, placement carry the
emotional charge while staying legible), terse to the point of koan, dense with
sound effects, embracing surprise. Text-only obliques are the minority.

## Connection to the Enrichment card queue

Oblique Enrichment needs almost no new infrastructure — it is a **deck-shaped
variant of [[Enrichment]]** and rides the existing Enrichment card queue, now
surfaced in **[[STIGMERGY]]**'s QUEUE deck (the Node server reads the card
folders, renders them in the [[BBS Design System]] grammar, and fires the
supervisor via `POST /api/cards/respond`):

- **Facet = card.** Each facet is an `Enrichment/card-NNN/` folder: a `card.md`
  plus a self-contained facet `.html`. STIGMERGY already renders `.html`
  artifacts in a sandboxed `<iframe>`, so a facet *plays* — sound and all — inside
  the queue.
- **`card.md` already fits.** `target_name` / `target_path` / `target_obsidian_uri`
  point the facet at the entry it challenges; `purpose` names the oblique; `fv` and
  `summary` are the rehydration block the card model already shows.
- **Commenting = the response box that already exists.** Every card has a free-text
  area plus `deposit / revise / more like this / forward-vector / graffiti /
  discard`. Submitting fires the `claude -p` supervisor, which regenerates that
  facet from the note — exactly the loop that turned the flock facet into
  [[Semantic Webcam]], now formalized and per-card.
- **Two front-ends, one data model.** The radio play is the *performance* view; the
  BBS is the *workbench*. Both read the same card folders. The only genuinely new
  build is a generator that emits a *themed deck* of card folders (vs. Enrichment's
  scattered five) and, optionally, a `?deck=` filter so a deck reviews as a set.

The tension is honest and generative: Enrichment's law is *breadth, never linger,
five cards*; a deck **invites lingering** — we proved it in the first five minutes.
Hence both `couples-with` and `contradicts` to the same parent.

## Converging threads — held apart on purpose

Several threads now circle the same loop of *agents tending the palace through a
terminal surface*: [[Enrichment]], the [[Project Stewardship System]], the
STIGMERGY board ([[BBS Blackboard]], app at `_ops/stigmergy/`), the
[[BBS Design System]], and [[Pages as Agents]]. Oblique Enrichment is another. They
will almost certainly converge — one surface, one card model, one worker pool.
**We are deliberately not converging them yet.** Let each develop messily and
independently long enough to learn what is actually best about each before
unifying. Convergence should be discovered, not designed. (Flag for a future Weave.)

## Open Questions

- Is a deck a *queue* (rolling five) or a *set* (all twenty reviewable at once)? The
  server assumes a queue; the radio play assumes a set.
- Should the deck-as-show grow its own inline "comment" affordance (POST to
  `/api/cards/respond` from inside a facet), or stay a pure performance view?
- When do the converging threads above actually merge — and who decides?

## Forward Vectors

Become a generator, not a hand-made deck. Teach the supervisor a deck policy.
Build the first real oblique deck *into the server* and iterate a card live. Then:
point an oblique deck at an entry nobody's looked at in months and hear its tell.
