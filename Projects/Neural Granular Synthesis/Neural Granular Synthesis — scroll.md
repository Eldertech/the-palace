---
title: "Neural Granular Synthesis — scroll"
born: 2026-09-23
links:
  - target: "[[Neural Granular Synthesis]]"
    type: connects-to
    label: scroll-for
forward_vector: "I am Neural Granular Synthesis's scroll — the one page that always opens on where the project stands now, then reads down through everything it has made, newest first. My top is regenerated from the board and the palace whenever anyone looks; my standing orders are Loudon's and never regenerated; my trail only ever grows."
---

# Neural Granular Synthesis — scroll

> The project's front door. **Now** is regenerated on every look; **Standing Orders** are Loudon's; **The making** is the trail, newest first. Rendered in [[STIGMERGY]]'s PROJECTS deck; the entry [[Neural Granular Synthesis]] stays the considered truth and this is the live one. See [[The Scroll]].

<!-- scroll:now:start -->
## Now

> _Regenerated 2026-09-23T04:36:43.543Z from the board, the steward's runtime, the entry's frontmatter and git. This zone is machine-owned — steer the project in **Standing Orders** below, never here._

- **Status:** active · **Stage:** growing · **Steward:** cycle 5 · last ran 2026-08-26 (28 days ago)
- **Waiting on you:** nothing
- **Ready to advance:** no unread answers
- **Last shipped:** 2026-06-23 (92 days ago) — Synchrony sweep is on the board. Which sub-vector wants the next cycle? (`ngs-steward-009`)
- **Last commit touching this project:** 2026-09-22 `3423b57` — ops(Neural Granular Synthesis): flush working proofs, renders + code
- **Signal:** ⚠ the last cycle posted nothing (one barren cycle — the lane will retry before calling it stalled)
- **Drift:** no consolidation marker on the entry — nothing to measure against.

### Where this stands

The sonify-r arc has two shipped surfaces now (interactive + fixed-render). Three live sub-vectors from the entry's open questions: (1) PERF-MAP — wrap the sonifier's K and σ_threshold onto a hardware controller layout so the population becomes playable rather than auditioned; this is the cleanest next move toward 'crowd's coherence as the primary control surface.' (2) DEEPEN-RASTER — extend the raster sim with traveling-wave and chimera-state presets (partial synchrony — half locked, half drifting), which would expose a whole new region of timbre space. (3) MIN-POP — answer the 'minimum population size for perceptually stable timbre' open question by rendering an N-sweep audition (N=4, 8,…

### Open asks

_None — nothing is waiting on you._

### Answered, not yet consumed

_None._

### Decided

- `ngs-steward-009` — directional_decision → GRANTED — option_id=DEEPEN-RASTER (2026-06-25)

<!-- scroll:now:end -->

## Standing Orders

<!-- scroll:orders:start -->
_Loudon's standing direction for this project. The steward reads this zone every cycle before anything else, and it is never regenerated. Taste, priorities, "stop asking me about X", "always prefer Y" — write it once here instead of answering it every cycle._
<!-- scroll:orders:end -->

## The making

<!-- scroll:making:start -->
<!-- scroll:entry id="ngs-steward-009" -->
### 2026-06-23 — cycle 4 — Synchrony sweep is on the board. Which sub-vector wants the next cycle?
> still working · sonifier + sweep both shipped · I lean perf-map but will take any steer

The sonify-r arc has two shipped surfaces now (interactive + fixed-render). Three live sub-vectors from the entry's open questions: (1) PERF-MAP — wrap the sonifier's K and σ_threshold onto a hardware controller layout so the population becomes playable rather than auditioned; this is the cleanest next move toward 'crowd's coherence as the primary control surface.' (2) DEEPEN-RASTER — extend the raster sim with traveling-wave and chimera-state presets (partial synchrony — half locked, half drifting), which would expose a whole new region of timbre space. (3) MIN-POP — answer the 'minimum population size for perceptually stable timbre' open question by rendering an N-sweep audition (N=4, 8, 16, 32, 64, 96) at fixed K. I lean PERF-MAP because playability is what would carry NGS into Loudon Live; if no preference, I'll take that next.

**Artifacts:**
- [synchrony-sonifier.html](Projects/Neural Granular Synthesis/synchrony-sonifier.html)
<sub>`ngs-steward-009` · RESOURCE_REQUEST on TRICKSTER</sub>
<!-- /scroll:entry -->

<!-- scroll:entry id="ngs-steward-008" -->
### 2026-06-23 — cycle 4 — Shipped synchrony-sweep.wav — the audible counterpart to raster-three-regimes.png, 24 s of K climbing 0 → 2·K_c.
> sonify-r was granted · interactive sonifier already shipped Jun 8 · this is the fixed audition for the DAW

Quick catch-up: Neural Granular Synthesis is the shader-parallel population engine where the crowd's coherence (Kuramoto's r) is the timbre control surface. Last cycle I shipped control-vocabulary-math.md and raster-plot-explorer.html. Loudon then granted sonify-r and (between then and now) synchrony-sonifier.html landed — an interactive piece that lets him drive K by hand and hear the crowd fuse. This cycle I added the missing offline twin: synchrony-sweep.wav, a 24-second render of N=96 grain-voices walking K from 0 to 2·K_c, written by render_synchrony_sweep.py. It uses the cycle-3 K-nondimensionalization so K_c lands mid-sweep — the first half is incoherent wash, the back half snaps to a fused harmonic tone. Drop it into Ableton, scrub it, hear the lock arrive.

**Artifacts:**
- [24 s render — K climbs 0 → 2·K_c · listen for the fusion at the midpoint.](Projects/Neural Granular Synthesis/synchrony-sweep.wav)
- [the offline renderer — same detune-collapse + onset-alignment cues as synchrony-sonifier.html.](Projects/Neural Granular Synthesis/render_synchrony_sweep.py)
<sub>`ngs-steward-008` · BROADCAST on GENERAL</sub>
<!-- /scroll:entry -->
<!-- scroll:making:end -->
