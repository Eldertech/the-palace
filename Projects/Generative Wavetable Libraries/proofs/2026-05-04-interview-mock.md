---
title: "Generative Wavetable Libraries — chat-driven interview mock"
born: 2026-05-04
links:
  - target: "[[Generative Wavetable Libraries]]"
    type: connects-to
    label: proof-of
forward_vector: "I am the chat-driven interview mock for Generative Wavetable Libraries — the conversation that turns a described target into a wavetable pack."
---

# Mock — what the wavetable interview should feel like

A first-pass mock of the chat the project's forward vector implies: Claude conducts the interview, the user describes a target sound, partials get sourced, a wavetable comes out the other side. Hand-drafted, not from a real model — sets the *shape* the future Interview skill must hit.

---

**Claude:** What's the sound you're trying to make? Don't worry about getting the technical language right — describe it however feels honest.

**User:** A bell, but not a normal bell. It should sound like it's been buried for a long time. The fundamental is clear but everything else is bent and dampened.

**Claude:** Got it. A few things to lock in before I generate.

A real bell has its strike tone (the fundamental you'll perceive as the pitch), a hum tone an octave below, a prime above the fundamental, and then a stack of inharmonic partials — that's where the metallic ring lives. The "buried" quality you're describing — is that:

  (a) the upper partials get *quieter* the higher they go, so the bell sounds muffled, or
  (b) the upper partials get *more inharmonic*, like the bell's geometry has been deformed, or
  (c) the upper partials have *slow attacks*, like they're emerging from underneath something?

Or some combination.

**User:** All three but mostly (b). Like the bell is the wrong shape now.

**Claude:** Right — geometric deformation. I'll source the partial structure from a Helmholtz resonator computation for a deformed bell shell, then bend the upper partials' frequency offsets toward chaotic. The "muffled" comes from a logarithmic amplitude rolloff above the 4th partial.

Two questions before I render:

1. How morphable do you want this to be? In your wavetable target (Serum / Ableton), the second axis can do something. Options:
   - sweep from "intact bell" to "fully deformed" along the morph axis (pedagogical, you can hear the deformation arrive)
   - sweep from "fresh strike" to "long sustain" (timbral, you can ride the decay manually)
   - sweep across different *shapes* of deformation — symmetric, asymmetric, cracked
2. Single-cycle or 64-frame wavetable? Single-cycle is just the strike-instant timbre. 64-frame lets the partials shift over the morph axis as you described.

**User:** Sweep across shapes of deformation. 64-frame.

**Claude:** Building. 64 frames, pitch f₀ = 220 Hz, partial structure from a parametric bell-shell deformation field. Each frame has the same number of partials (12) but their frequencies and amplitudes drift across the morph axis. I'll render to .wav at 2048 samples/cycle and to Serum's native format.

A render preview is below. Listen and tell me which is wrong.

[*audition link — 5 strikes spaced across the morph axis*]

**User:** Frame 32 is getting too clangy. The deformation is over-articulated by the middle.

**Claude:** That's the deformation field hitting maximum eccentricity at the midpoint. I'll reshape the field so eccentricity grows quadratically and only reaches max at frame 64 — the start-of-axis is more intact, the end is more deformed, and the middle is the sweet spot where it's *recognizably* a bell but warped.

Re-rendering. Listen again.

---

## Notes on what the mock is hitting

**The interview pattern.** Claude does not ask "what synthesizer parameters do you want?" Claude asks about *the sound itself*. The technical translation happens silently. This is the project's whole premise — the user's mental model is the timbre, not the patch.

**Three options at each branch point.** When Claude has to disambiguate, three named options are offered, not open-ended "tell me more." Three is enough variety; more becomes a quiz. Each option is a *commitment* with a tradeoff named.

**Audition gate before commit.** Claude renders a preview, the user listens, the user reports what's *wrong*. The user does not have to know what's right — only what's missing. This is how the [[Substrate Skill]] § audition gate manifests in this domain.

**Response to "wrong" is recalibration, not full restart.** When the user says "frame 32 is too clangy", Claude identifies which generative parameter caused that and adjusts. The interview holds the architecture; the user gives the aesthetic feedback.

---

## What this proof is and isn't

**Is:** the dialogue shape the future Interview skill must produce. A spec by example.

**Isn't:** a working pipeline. The bell-deformation field math is real (Helmholtz on a parametric shell) but the audition links don't go anywhere yet. Build target: render this exact conversation against a real partial-sourcing backend, see if the dialogue survives contact with real generation.

## Concrete next step

Pick one of the three deformation modes (symmetric, asymmetric, cracked), implement the partial-sourcing for *just that one*, and build the dialogue to convergence. If the audition gate works on the easy case, the harder cases scale.
