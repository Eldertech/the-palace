---
title: "Floquet Time-Modulated Loops — scroll"
born: 2026-09-23
links:
  - target: "[[Floquet Time-Modulated Loops]]"
    type: connects-to
    label: scroll-for
forward_vector: "I am Floquet Time-Modulated Loops's scroll — the one page that always opens on where the project stands now, then reads down through everything it has made, newest first. My top is regenerated from the board and the palace whenever anyone looks; my standing orders are Loudon's and never regenerated; my trail only ever grows."
---

# Floquet Time-Modulated Loops — scroll

> The project's front door. **Now** is regenerated on every look; **Standing Orders** are Loudon's; **The making** is the trail, newest first. Rendered in [[STIGMERGY]]'s PROJECTS deck; the entry [[Floquet Time-Modulated Loops]] stays the considered truth and this is the live one. See [[The Scroll]].

<!-- scroll:now:start -->
## Now

> _Regenerated 2026-09-25T20:43:07-04:00 from the board, the steward's runtime, the entry's frontmatter and git. This zone is machine-owned — the project is steered by the **Plan** and **Standing Orders** below, never here._

- **Status:** active · **Stage:** growing · **Steward:** none — this project has no permanent steward yet
- **Plan:** agreed 2026-09-25 (today) · 0 made things since
- **Waiting on you:** nothing
- **Last shipped:** nothing on the board yet — but the bundle holds 28 media files (see the making trail)
- **Last commit touching this project:** 2026-09-23 `c666210b` — ops(scrolls): backfill 36 project scrolls; retire the 20 plan.md read-models

### Where this stands

_No steward has spoken for this project. Its direction is the `forward_vector` in [[Floquet Time-Modulated Loops]]'s frontmatter; enchant a steward to start the trail._

### Open asks

_None — nothing is waiting on you._

### Decided

_Nothing decided on the board yet._

<!-- scroll:now:end -->

## Plan

<!-- scroll:plan:start -->
**Where this is going.** A five-session [[Loudon Live]] arc showing that the "nothing changes over time" assumption under almost every audio loop is a choice. Let a loop's coefficient breathe periodically and you get parametric resonance, sideband ladders, frequency bandgaps, and at the far end a small audio time crystal. Behind it: the first instrument, a resonator that cracks into ringing when its tuning is pumped (the [[Mathieu Equation]] in `codebox~`), is taught in depth in the entry, and its twenty media pieces, the `codebox~` source and a Python reference were built and checked in Python on 2026-04-30 ([[BUILD_SUMMARY|the build summary]]). Nothing past that first instrument has been built.

**The moves ahead**

1. **Finish the resonator and teach it.** Run the `codebox~` in Max against its Python reference (the A/B harness is in `RNBO/README — Mathieu Resonator.md`), and rule on the two calls the build made on its own: a little damping so there is a threshold to cross, and a soft clip on the state so it never overflows ([[NOTES|the build notes]]). Then walk the media and choose the cross-domain hook for the first session.
2. **Pump a comb.** A Karplus-Strong delay loop whose loop gain and loop length are each modulated at their own rate. Inside the right regions the comb's peaks shift and multiply, and a spectrum analyzer running beside the audio carries the lesson.
3. **Turn the wavetable surfaces into filters.** Each surface in the [[2D Wavetable Catalog]] becomes a time-varying filter, one axis read as delay and the other scanned at audio rate, so a surface's synthesis character comes back as a filter character. The filtering sibling of the [[2D Torus Wavetable Synthesizer]].
4. **Work backward from the sound you want.** Pick a target spectrum from [[Categorizing Inharmonicity]], solve offline in Python for the modulation that produces it, and play that modulation from a wavetable. This is the hard inverse problem; how much of it is tractable is still an open question.
5. **Build a small time crystal.** Slow the modulation down into rhythm and couple it to audio-rate sound, so locking and unlocking are heard at once as rhythm and as timbre. The Hopf control surface from the torus project carries over.

What each later instrument is, with its cross-domain hook and build environment, is sketched in [[Floquet Time-Modulated Loops#Stages 2–5 — the development arc|the entry]].
<!-- scroll:plan:end -->

## Standing Orders

<!-- scroll:orders:start -->
_Loudon's standing direction for this project. The steward reads this zone every cycle before anything else, and it is never regenerated. Taste, priorities, "stop asking me about X", "always prefer Y" — write it once here instead of answering it every cycle._
<!-- scroll:orders:end -->

## The making

<!-- scroll:making:start -->
<!-- scroll:entry id="plan-2026-09-25T20-43-07-04-00" -->
### 2026-09-25 — Plan agreed: carried over from the entry's development arc

Carried over on 2026-09-25 from the entry's development-arc section and its line that the later stages are only sketched, when plans moved into scrolls (SCHEMA v1.25). The five stages keep the entry's order, each renamed by what it does. The first move is what remains of the first stage by the entry's own finish line: its media and code were built and checked in Python on 2026-04-30, but the codebox has not been run in Max and two build calls in NOTES still wait on Loudon. The stage sketches stay in the entry as the design each move links to.
<sub>`plan-2026-09-25T20-43-07-04-00` · plan agreed · agreed 2026-09-25T20:43:07-04:00 · carried over by an elder on Loudon's word</sub>
<!-- /scroll:entry -->

<!-- scroll:entry id="backfill-2026-09-23" -->
### 2026-09-23 — backfilled from the bundle

No steward has posted a made thing for this project yet, so the trail opens with what the bundle already holds (28 media files, newest first):

- [16_opo_sidebands.png](Projects/Floquet Time-Modulated Loops/static/16_opo_sidebands.png) · 2026-09-23
- [17_plasma_decay.png](Projects/Floquet Time-Modulated Loops/static/17_plasma_decay.png) · 2026-09-23
- [18_photonic_time_crystal.png](Projects/Floquet Time-Modulated Loops/static/18_photonic_time_crystal.png) · 2026-09-23
- [12_sideband_ladder.png](Projects/Floquet Time-Modulated Loops/static/12_sideband_ladder.png) · 2026-09-23
- [14_faraday_wave_pattern.png](Projects/Floquet Time-Modulated Loops/static/14_faraday_wave_pattern.png) · 2026-09-23
- [10_phase_space_strobe.png](Projects/Floquet Time-Modulated Loops/static/10_phase_space_strobe.png) · 2026-09-23
- [11_bloch_floquet_duality.png](Projects/Floquet Time-Modulated Loops/static/11_bloch_floquet_duality.png) · 2026-09-23
- [07_tongue_anatomy.png](Projects/Floquet Time-Modulated Loops/static/07_tongue_anatomy.png) · 2026-09-23
- [08_multipliers_vs_params.png](Projects/Floquet Time-Modulated Loops/static/08_multipliers_vs_params.png) · 2026-09-23
- [05_strutt_diagram.png](Projects/Floquet Time-Modulated Loops/static/05_strutt_diagram.png) · 2026-09-23
- [01_lti_ltv_boundary.png](Projects/Floquet Time-Modulated Loops/static/01_lti_ltv_boundary.png) · 2026-09-23
- [03_pumped_swing.html](Projects/Floquet Time-Modulated Loops/interactives/03_pumped_swing.html) · 2026-09-23
- [06_strutt_explorer.html](Projects/Floquet Time-Modulated Loops/interactives/06_strutt_explorer.html) · 2026-09-23
- [09_multiplier_visualizer.html](Projects/Floquet Time-Modulated Loops/interactives/09_multiplier_visualizer.html) · 2026-09-23
- [15_kapitza_pendulum.html](Projects/Floquet Time-Modulated Loops/interactives/15_kapitza_pendulum.html) · 2026-09-23
- [02_mathieu_simulator.html](Projects/Floquet Time-Modulated Loops/interactives/02_mathieu_simulator.html) · 2026-09-23
- [20_strutt_sweep.wav](Projects/Floquet Time-Modulated Loops/audio/20_strutt_sweep.wav) · 2026-09-23
- [19_reference_output.wav](Projects/Floquet Time-Modulated Loops/audio/19_reference_output.wav) · 2026-09-23
- [19_reference_noise.wav](Projects/Floquet Time-Modulated Loops/audio/19_reference_noise.wav) · 2026-09-23
- [13d_wavetable.wav](Projects/Floquet Time-Modulated Loops/audio/13d_wavetable.wav) · 2026-09-23
<sub>backfill · scroll born 2026-09-23</sub>
<!-- /scroll:entry -->
<!-- scroll:making:end -->
