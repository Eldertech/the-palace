---
title: The 2.5D Paper Stack
type: concept
pillars:
  - creation
  - tools
  - practice
born: 2026-06
stage: growing
last_activated: 2026-06-26
activation_count: 2
forward_vector: "I want to become the lens every frame technique passes through — to keep cataloguing each new way to cut, move, and stack a sheet, to give the bubbles and the breakouts their right depth, and to teach the frame maker to think in layers of breathing paper instead of flat finished pictures."
links:
  - target: "[[Frame Designer]]"
    type: enables
    label: re-founds
  - target: "[[BLUELINE]]"
    type: emerged-from
    label: track-VI
  - target: "[[Multiplane Animation]]"
    type: deepens
    label: modernizes
  - target: "[[Move the Ink, Don't Redraw It]]"
    type: couples-with
    label: breathes-via
  - target: "[[BLUELINE — Text Layer]]"
    type: connects-to
    label: stacks-the-bubble
  - target: "[[Hand-Drawn 3D Look]]"
    type: couples-with
    label: break-surface
  - target: "[[Comic and Cinema — Two Ways of Seeing]]"
    type: connects-to
    label: depth-between-registers
---

# The 2.5D Paper Stack

![[The 2.5D Paper Stack — hero.png]]

A frame is not a flat finished picture. It is a **stack of inked paper sheets** — each cut sharp along its own black lines, stacked with a little air between them, and each free to move on its own. You are not animating a drawing; you are sliding sheets of paper.

This is the new way to think about every frame technique in [[BLUELINE]]. It is not one trick among many. It is the **foundation** the [[Frame Designer]] now rests on: every technique we have, or will add, answers one question — *how do I make, move, or place a sheet?*

## Why high contrast makes it work

The cut is the hard part of any layer pipeline. In stark black-and-white ink, the cut is already done for you: **the object's edge rides a black line** — the artist did the segmentation with a brush. So the right cut is a knife hidden *inside* the ink (black meets black), not a soft feather. A sharp cut on a black stroke is invisible. And seams between sheets are then hidden by **occlusion** — a foreground sheet simply covers the one behind it — not by blurring.

The soft, smeary masks we started with were a confession that we didn't have the real edge yet. The black line *is* the edge.

## The catalogue (separate · manipulate · composite)

The stack is held open as a growing catalogue of ways to get sheets and move them. Two families:

- **2D** — cut what's already drawn.
  - *Separate-and-infill* — lift a sheet out, fill the hole behind it. A luminance threshold fails (dark hill and dark cloud ink both read "dark"); use **content-aware density extraction** — a filled mass is densely dark, linework is sparse, so threshold dark-*density*. The cut then lands on the black silhouette where it disappears. **Infill is ground-dependent**: on a white-paper ground the recomposite is a one-line multiply (white passes, black ink darkens); on a structured ground the hole needs SDXL inpaint guided by a canny of the surrounding lines, so the missing region continues in style.
  - *[[Move the Ink, Don't Redraw It]]* — warp a sheet's own ink so it breathes (ripple, flicker, drift) without it boiling. The per-sheet motion primitive.
- **3D** — build the sheet from depth.
  - *Pose-control* (ControlNet pose), *depth maps*, *full 3D models* rendered to a plane.
  - When generating *layers* (each sheet its own pass), independent passes produce two drawings that fight. **Shared conditioning** — one authored depth map + one seed across passes — is what makes them register as one scene. Re-ink locally afterwards for the pen-flow look.

Every one of these resolves to the same thing: a sheet, with an alpha cut on its black line, at a depth in the stack.

## The A/B duals — choose by what you hold

Separate and generate are duals. Each makes free what the other makes hard:

|  | separate (have the frame) | generate (make the frame) |
|---|---|---|
| coherence (one picture) | **free** — it is one drawing | **the work** — passes drift apart unless conditioning is shared |
| clean alpha (the cut) | **the work** — content-aware extract + infill | **free** — by construction |

Have the finished frame → separate. Making the frame → generate, under shared control. The pipeline you reach for is named by which freedom you can give up.

## The stacking order means something

Depth order is not just "who covers whom." It is **semantic**. A dialogue bubble has a *place* in the stack — it lives at a chosen depth, in front of the figure it belongs to, behind the panel border — not merely a position on the page. The text thread ([[BLUELINE — Text Layer]]) is a citizen of the stack, not a sticker on top of it.

The split runs deeper. The *in-world* text — dialogue, a sound effect, a thought cloud — sits **inside** the scene volume; narration and lyrics live **outside** it, in the margin — not a deeper sheet but a separate author-plane beside the stack, the visual form of the off-stage voice. Once a bubble has a depth it can **drift with its speaker** on a camera move, and its tail can flex with the same warp that moves any other drawn sheet ([[Move the Ink, Don't Redraw It]]) — one more thing that breathes. The discipline that keeps it readable: the *letters* stay locked (they are meaning to be read, not a mark to be warped), while the *balloon shape and tail* are the drawn lines free to move. The full worked-out case — every text type mapped to a stack depth — is [[BLUELINE — Text Layer]].

## A classic principle, given modern motion

This is the **[[Multiplane Animation]]** idea: Disney's multiplane camera (1937), Lotte Reiniger cutting *The Adventures of Prince Achmed* out of literal black paper (1926), ukiyo-e carving a separate block per element. The lineage is cut paper and stacked glass. What's new is the *motion source* — AI, simulation, and deterministic warp now move the sheets, where the old multiplane could only dolly the camera through static art. A classic principle, re-founded.

## The two contraries — the flat stack and the break

Two generative moves live in tension here, and the tension is the point (Blake's contraries — both true):

- **Reveal the stack.** Letting the viewer *see* the layers — paper edges, the air between planes — is on-aesthetic for comics. The device becomes part of the look.
- **Break the stack.** A sheet, or a whole frame, tearing loose into **full 3D** is a defining "bullet-time" beat — the Matrix moment. It only lands *because* the stack was flat. Flatness is what the break breaks.

You hold both: a flat paper world that, at the chosen instant, a figure steps out of.

---

## Forward Vectors

- **Grow the catalogue.** Each new way to cut, move, or place a sheet earns a line in the catalogue. The next entries: dialogue bubbles as live z-order citizens, and the rules for *when* a 3D breakout earns itself rather than showing off.
- **Re-found the maker.** Carry this back into [[Frame Designer]] as its organizing idea — rewrite the maker's brief intake and dispatch around "which sheet, cut how, moved how, at what depth."
- **Open question:** how does a sheet *decide* its own depth — authored by hand, read from a depth pass, or inferred from the drawing's occlusions? The answer changes how automatic the stack can be.
- **Open question:** what is the smallest set of techniques that covers most frames — and where does a frame genuinely need a new one?
- The evidence and the working bench live in `Projects/BLUELINE/proofs/track-VI-elemental-motion/` (engine, sims, the two routes, the debrief).
