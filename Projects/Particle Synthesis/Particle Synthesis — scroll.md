---
title: "Particle Synthesis — scroll"
born: 2026-09-23
links:
  - target: "[[Particle Synthesis]]"
    type: connects-to
    label: scroll-for
forward_vector: "I am Particle Synthesis's scroll — the one page that always opens on where the project stands now, then reads down through everything it has made, newest first. My top is regenerated from the board and the palace whenever anyone looks; my standing orders are Loudon's and never regenerated; my trail only ever grows."
---

# Particle Synthesis — scroll

> The project's front door. **Now** is regenerated on every look; **Standing Orders** are Loudon's; **The making** is the trail, newest first. Rendered in [[STIGMERGY]]'s PROJECTS deck; the entry [[Particle Synthesis]] stays the considered truth and this is the live one. See [[The Scroll]].

<!-- scroll:now:start -->
## Now

> _Regenerated 2026-09-23T04:36:43.543Z from the board, the steward's runtime, the entry's frontmatter and git. This zone is machine-owned — steer the project in **Standing Orders** below, never here._

- **Status:** active · **Stage:** dormant · **Steward:** cycle 3 · last ran 2026-06-25 (90 days ago)
- **Waiting on you:** nothing
- **Ready to advance:** no unread answers
- **Last shipped:** 2026-06-23 (91 days ago) — Dispersion core works as audio. Which direction should the next cycle take it? (`particle-synthesis-004`)
- **Last commit touching this project:** 2026-09-03 `1b67a68` — edit(close-2026-09-02): the counter-discipline gets its proof; the deposit sheds what it grew
- **Signal:** ⚠ the last cycle posted nothing (one barren cycle — the lane will retry before calling it stalled)
- **Drift:** no consolidation marker on the entry — nothing to measure against.

### Where this stands

Particle Synthesis reframes granular synthesis as GPU-style particle physics — each grain a particle with state, dispersion an emergent property of the medium rather than a programmed modulation. Cycle 1 (2026-06-06) asked which substrate to extend; you greenlit EXTEND-WEBAUDIO on 2026-06-09 and a visual dispersion prism shipped that day (proofs/2026-06-08-dispersion-prism.html). This cycle takes the next step the prism couldn't: rendering the physics straight to audio so the chirp is in your DAW, not just on screen.

### Open asks

_None — nothing is waiting on you._

### Answered, not yet consumed

_None._

### Decided

- `particle-synthesis-004` — directional_decision → GRANTED — option_id=POLYPHONIC-CLOUD; notes: "create an interactive HTML lesson that demonstrates the arc of this project and where it is goin." (2026-06-25)

<!-- scroll:now:end -->

## Standing Orders

<!-- scroll:orders:start -->
_Loudon's standing direction for this project. The steward reads this zone every cycle before anything else, and it is never regenerated. Taste, priorities, "stop asking me about X", "always prefer Y" — write it once here instead of answering it every cycle._
<!-- scroll:orders:end -->

## The making

<!-- scroll:making:start -->
<!-- scroll:entry id="particle-synthesis-004" -->
### 2026-06-23 — cycle 2 — Dispersion core works as audio. Which direction should the next cycle take it?
> still working · 3 audition seeds shipped to GENERAL · steward leans POLYPHONIC-CLOUD

The single-impulse dispersion render proves the physics out: the chirp is in the seeds (see particle-synthesis-003). The entry's forward vector calls for a thousand particles, not one, and names three plausible next moves: (1) a polyphonic grain cloud where N=64 particles each carry their own dispersion path and superpose into a drone — closest to the GPU-compute vision and the cheapest next render; (2) the Particle Fountain Max/MSP teaching device from the entry's pedagogy section — slower to build, but it makes the physics-as-DSP point legible to a learner; (3) particle collision as a compositional primitive — most exploratory, weakest ear-test. I lean POLYPHONIC-CLOUD because it stays in the rendered-audio modality where the dispersion seeds just landed, and a 64-particle cloud is a single afternoon's render to audition before any Max-side handoff. If you have not had a chance to listen to the seeds yet, ignore this — I will run POLYPHONIC-CLOUD by default next cycle.

**Artifacts:**
- [2026-06-08-dispersion-laws.png](Projects/Particle Synthesis/proofs/2026-06-08-dispersion-laws.png)
- [2026-06-08-dispersion-prism.html](Projects/Particle Synthesis/proofs/2026-06-08-dispersion-prism.html)
<sub>`particle-synthesis-004` · RESOURCE_REQUEST on TRICKSTER</sub>
<!-- /scroll:entry -->

<!-- scroll:entry id="particle-synthesis-003" -->
### 2026-06-23 — cycle 2 — Dispersion as audio — three rendered seeds, alpha sweeping from zero to strong.

Catch-up: Particle Synthesis reframes granular synthesis as GPU-style particle physics — each grain a particle with state, dispersion an emergent property of the medium rather than a programmed modulation. Cycle 1 (2026-06-06) asked which substrate to extend; you greenlit EXTEND-WEBAUDIO on 2026-06-09 and a visual dispersion prism shipped that day (proofs/2026-06-08-dispersion-prism.html). This cycle takes the next step the prism couldn't: rendering the physics straight to audio so the chirp is in your DAW, not just on screen.

A wideband impulse pushed through omega(k) = c*k + alpha*k^3. Group velocity vg = c + 3*alpha*k^2, so high-k (high-frequency) components travel faster and arrive first; low frequencies trail. The chirp is not modulated in — it falls out of the dispersion relation itself. Three audition seeds at increasing alpha:

**Artifacts:**
- [alpha = 0 — a clean click, no chirp. Reference.](Projects/Particle Synthesis/proofs/2026-06-23-dispersion-01-no-dispersion.wav)
- [alpha = 3e-9 — mild chirp, the attack lengthens, faint metallic shimmer.](Projects/Particle Synthesis/proofs/2026-06-23-dispersion-02-mild.wav)
- [alpha = 3e-8 — strong dispersion. High partials arrive first; the tail is a low descending sweep. The bell-like signature.](Projects/Particle Synthesis/proofs/2026-06-23-dispersion-03-strong.wav)
- [the render script — 60 lines of numpy, FFT phase shift per omega(k).](Projects/Particle Synthesis/proofs/2026-06-23-dispersion-render.py)
<sub>`particle-synthesis-003` · BROADCAST on GENERAL</sub>
<!-- /scroll:entry -->
<!-- scroll:making:end -->
