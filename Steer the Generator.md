---
title: Steer the Generator
type: practice
pillars:
  - tools
  - practice
  - creation
  - philosophy
born: 2026-06
stage: sprout
last_activated: 2026-06
activation_count: 1
forward_vector: "I will turn every 'the prompt didn't do what I wanted' into one of three moves — a control surface, a selection pass, or a measurement — and I will keep the negatives that prove prompting alone is too weak a handle to build with."
links:
  - target: "[[BLUELINE]]"
    type: emerged-from
    label: forged-in
  - target: "[[The Shop]]"
    type: connects-to
    label: production-discipline-for
  - target: "[[Quality Manifesto]]"
    type: connects-to
    label: measure-the-right-signal
  - target: "[[FOUR PILLARS]]"
    type: exemplifies
    label: make-first-learn-through-friction
  - target: "[[Cooperation Yields Agency]]"
    type: couples-with
    label: intuition-steers-generation
  - target: "[[Capability-first prototyping]]"
    type: connects-to
    label: prove-the-control-small
---

# Steer the Generator

![[Steer the Generator — hero.png]]

A generative model is **steered, not asked.** The natural reflex is to *describe* what you want in the prompt and hope the model complies. Across a long BLUELINE production push that reflex failed every time it carried real weight — and the failures all pointed at the same correction: when an attribute matters, you get it by **controlling** it, **selecting** for it, or **measuring** it, not by wording it more carefully.

## The three moves

1. **Control the structure that matters** — don't describe it, condition on it. Gaze direction, identity, the paper substrate, the pose: each is reliably had by an explicit control surface (face/pose keypoints, a reference image or LoRA, a deterministic post-pass) and *unreliably* had from prose. The prompt sets the vibe; the control sets the thing you can't afford to drift.
2. **Generate volume, then select** — one sample is an anecdote. Generate many and pick: by **intuition** (the *Taste Breeder* — show four, click one, the model learns your taste and predicts your next pick) or by **metric** (a consistency ruler, a content-blind style descriptor). Selection is what turns a "soft," drifting prompt-style into a locked one. *Using gen-AI well means making many and tossing the outliers* — under-generating is under-using it.
3. **Verify by measurement** — give the felt judgment a quantitative sibling. Head pose and landmarks (insightface), embedding cosine (identity/scene), spatial autocorrelation (is the noise actually white?). Measurement is how "it looks consistent" becomes "it *is*, by this number," and how a negative gets proven instead of argued. The [[Quality Manifesto]] question "how do you feel?" keeps its measured twin: *does it hold, and by how much?*

## Order the steps against loss

Two findings from the June–July image work are rules about *when*, not *what*, and both were learned
the hard way.

**Impose it at generation; don't recover it after.** A constraint that has to be present while a thing
is made cannot be added to the finished thing. Identity is the case above: baked at generation, not
pasted on. Scale is the case that took three tries. A standalone figure fills its frame whatever size
the pose skeleton is, so every after-the-fact cutout faithfully cut out a giant, and it turned out
*"the nude mask had secretly been doing the placement all along."* A step you thought was cosmetic was
carrying a constraint, and you only find out when you remove it. Mixing knows this as committing the
space at the source instead of fixing it in mastering.

**Rich first, stylize last.** Render with full information, do every operation that needs structure,
and put the lossy step at the end. The root cause, from [[GenAI Camera]]: *"we stylized too early —
pen-flow ink has no edges for a clean cut."* Stylization throws information away, and everything
downstream that needed it quietly degrades. Photography shoots flat and grades later; a mix is edited
before the effects are printed. [[Frame Designer]], [[Animate the Background]] and BLUELINE's text
layer already run this rule and credit it to this page.

The two are one rule seen from both ends: the structural constraint goes first, and the irreversible
step goes last.

## The negatives that earned it (the evidence)

- **Flow-warped noise never beat seed-lock** at the render — not at a 482 px jump, not swept across deltas, not in a cumulative sequence. The fancy control added nothing the simple shared latent didn't already give.
- **Prompt-only style is soft** — it drifts character to character; only volume + selection locked the *pen-flow* house look.
- **"A crystal instead of a head" will not render from words** — base SDXL kept a human head and threw crystals into the scene across six phrasings. (Concept-replacement needs inpaint / a reference model / a LoRA, not emphasis weighting.)
- **Pasting a face onto a finished ink drawing looks horrible** — compositing fights style and seams. Identity must be *baked at generation* (reference/keypoint conditioning, e.g. InstantID), not swapped on after.
- **Prompt-only gaze collapses to frontal** — asking for L90→R60 produced near-frontal heads every time; the measured-pose token caught it. Gaze is a *controlled* input, not a described one.

The wins are the mirror image: the style **locked** via generate-volume-and-select; the swappable **face-slot** worked via *controlled* head directions plus a *measured* registration token. Same discipline, opposite outcome.

## Where it lives

This is the [[FOUR PILLARS]] inversion — *make first, learn through friction* — applied to generative tooling, and it pairs with [[Cooperation Yields Agency]]: the human supplies intuition and the verdict, the model supplies volume, and steering is the seam where the two become an agency neither has alone. Operationally it is the production discipline behind [[The Shop]]'s generative specialists. Worked examples and the full negative-space evidence: BLUELINE's `proofs/m3-warped-noise/` and `proofs/style-lock/`.

<!-- CLAUDE → LOUDON: deposited as a sprout from the 2026-06 BLUELINE style-lock/character session. The Taste Breeder is named here as an exemplar of move #2 — if it earns its own entry (a built tool with a Job Contract), a future Weave can promote it to a Shop specialist and link it back here. -->
