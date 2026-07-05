---
title: "Generative Preset Development — proof — preset-interview-mock"
born: 2026-05-04
links:
  - target: "[[Generative Preset Development]]"
    type: connects-to
    label: proof-of
  - target: "[[Generative Wavetable Libraries]]"
    type: connects-to
forward_vector: "I am the preset-interview mock for Generative Preset Development — what the chat-driven preset generator should feel like in one worked example."
---

# Mock — what the preset interview should feel like

The interview shape for a chat-driven preset generator: user describes an emotional or musical target, Claude asks one or two structural questions, then translates into modular language, generates, and hands back parameter banks for a target synth. This mock targets a Serum preset.

---

**User:** I want a pad that feels like the moment before someone admits something they've been holding back.

**Claude:** That's a *threshold* feeling — there's tension building toward release. Two structural choices that determine which version we make:

1. **Does the threshold ever break, or does it stay held?** Held = a static pad with internal motion. Breaks = an evolving sound that crosses a perceptual line at some point in its life.
2. **Is the held thing fragile or massive?** Fragile = thin, on-the-edge-of-breaking-up timbre. Massive = the weight of suppressed force.

**User:** Breaks, around the 8-second mark. Massive.

**Claude:** Got it. I'm going to translate that into modular synth language.

> **Voice architecture.** Two oscillators. Osc A is the body — wavetable, position fixed in the lower half, slow micro-detune from a sub-audio LFO. This is "the held thing."
>
> Osc B is the tension — same wavetable but morphed forward across the wavetable axis at a glacial rate (8 seconds full sweep). Filtered with a lowpass. Filter cutoff is automated by the same envelope that drives the breaking-point.
>
> **Filter section.** A Sallen-Key 24dB lowpass. Cutoff starts at 400Hz, rises slowly. Resonance starts at 0, rises to ~70% as cutoff approaches breakthrough.
>
> **Envelope (the breaking point).** A custom envelope shaper, not ADSR. A held value of ~0.3 for 7 seconds, then a quick rise to 1.0 over 800ms, then a slow fall over 4 seconds. This envelope drives both filter cutoff and the wavetable position morph on Osc B.
>
> **Macro 1** = the pre-break weight (Osc A volume + sub-osc level)
> **Macro 2** = the threshold (when in the timeline the break happens — playable)
> **Macro 3** = the breath after (post-break reverb send + Osc B's lowpass)

Want me to render the Serum preset and a 12-second audition?

**User:** Yes. And map Macro 4 to something playable so I can use this as more than a one-shot.

**Claude:** Macro 4 = "withhold." It's a manual override that *prevents the break*. When held above 0.5, the envelope freezes at the held position. Releasing Macro 4 lets the break complete normally. So you can play this as: let it build, ride Macro 4 as the breath holds back, release on a downbeat.

[*audition: 12 seconds, the build, the break, then 8 seconds with Macro 4 held to demonstrate the override*]

Quick check before I commit the preset to the bank:

- Is the break sharp enough? (Right now it crosses the lowpass corner with ~70% resonance, sounds like a quiet "yes, I will tell you")
- Is the post-break too settled? You said "moment before admitting" — should the post-break feel like *relief* or like *now there is a different problem*?

**User:** Sharper break. And more "different problem" — leave a high partial ringing after.

**Claude:** Adding 80Hz of resonance at the break point and a high-shelf harmonic that sustains 6 seconds past the break. Re-rendering.

---

## What the mock is doing

**One emotional input → one structural follow-up → one auditory rendering.** Minimum interrogation. The user's phrase ("the moment before someone admits something") carries enough information; Claude only needs to disambiguate the *one thing* that has multiple coherent answers.

**Translation through modular synth language.** Claude doesn't say "set Osc A position to 0.34 and resonance to 0.7." Claude says "the body, the tension, the threshold, the breath after." The structural ideas are first. Parameters are downstream.

**Macros are emotional handles.** The user doesn't get a wall of 200 parameters. They get four named handles: weight, threshold, breath, withhold. These are *interpretive* names — they tell the user what the parameter *does in the music*, not what it *is in the synth*.

**Audition + corrective revision.** Same audition-gate pattern as [[Generative Wavetable Libraries]]: render, listen, user reports what's wrong, recalibrate the parameter that caused it. The user does not need to know which Serum parameter to change.

---

## What this proof is and isn't

**Is:** a target dialogue shape for the preset-generation pipeline. Names the structural primitives Claude should reach for ("body / tension / threshold / breath / withhold") and the macro-as-emotional-handle pattern.

**Isn't:** validated against a real Serum preset XML. The next concrete check is: write the parameter map — body → wavetable position + sub level, tension → wavetable morph rate, threshold → envelope shape, breath → reverb send, withhold → envelope freeze. Render. Verify the audition matches the description.

## The architectural insight surfaced by writing the mock

The forward vector says "from a single abstract musical or emotional prompt." That's the entry point. The mock shows that the *one* technical question Claude needs to ask first is the **structural shape**: held / building / breaking / settling. Once that shape is named, the parameter mapping is mostly mechanical. The interview is *one branch*, not a tree.
