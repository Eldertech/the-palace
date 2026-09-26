---
title: "Action Potential Oscillator — scroll"
born: 2026-09-23
links:
  - target: "[[Action Potential Oscillator]]"
    type: connects-to
    label: scroll-for
forward_vector: "I am Action Potential Oscillator's scroll — the one page that always opens on where the project stands now, then reads down through everything it has made, newest first. My top is regenerated from the board and the palace whenever anyone looks; my standing orders are Loudon's and never regenerated; my trail only ever grows."
---

# Action Potential Oscillator — scroll

> The project's front door. **Now** is regenerated on every look; **Standing Orders** are Loudon's; **The making** is the trail, newest first. Rendered in [[STIGMERGY]]'s PROJECTS deck; the entry [[Action Potential Oscillator]] stays the considered truth and this is the live one. See [[The Scroll]].

<!-- scroll:now:start -->
## Now

> _Regenerated 2026-09-25T20:55:14-04:00 from the board, the steward's runtime, the entry's frontmatter and git. This zone is machine-owned — the project is steered by the **Plan** and **Standing Orders** below, never here._

- **Status:** active · **Stage:** growing · **Steward:** cycle 5 · last ran 2026-06-25 (93 days ago)
- **Plan:** agreed 2026-09-25 (today) · 0 made things since
- **Waiting on you:** nothing
- **Ready to advance:** no unread answers
- **Last shipped:** 2026-06-23 (95 days ago) — You have one population audition. Where should I take the next cycle — Faust port, deeper Python, or H90/RNBO? (`apo-steward-009`)
- **Last commit touching this project:** 2026-09-24 `f6f99b07` — Weave — 2026-09-24 — part 1: the mechanical write-back (signed)
- **Signal:** steady
- **Drift:** no consolidation marker on the entry — nothing to measure against.

### Where this stands

Recap: Action Potential Oscillator's Stages 1–4 (single neuron, Gen~) shipped in March. Cycle 3 wrote neuropulse.dsp (a Faust population draft) and a Mac-compile handoff, because the Linux sandbox couldn't run Faust. This Mac session does not have Faust installed either, so I sidestepped: I built the population layer in Python and rendered a 30s audition (see apo-steward-008). The forward_vector's question — 'where does Hodgkin-Huxley detail stop mattering sonically' — is now testable by ear for the first time. Three reasonable next cycles, none obviously dominant: (1) install Faust + compile neuropulse.dsp so the production path is unblocked; (2) push the Python further (HH gating, raster…

### Open asks

_None — nothing is waiting on you._

### Answered, not yet consumed

_None._

### Decided

- `apo-steward-009` — directional_decision → GRANTED — option_id=FAUST-FIRST (2026-06-25)

<!-- scroll:now:end -->

## Plan

<!-- scroll:plan:start -->
**Where this is going.** An instrument where a neuron's biology is the synthesis, every knob traced to a real mechanism. The single neuron is behind it: four playable Gen~ oscillators, from a capacitor's sawtooth to a full spike with its refractory growl, built in March 2026 and specified in [[neural_oscillator_dev_plan|the Gen~ development plan]]. What lies ahead is the crowd, many slightly different neurons coupled so that the coupling itself becomes timbre. A Python render of 32 coupled neurons (June 2026) let the project hear that for the first time; the Faust engine meant to carry it is drafted but does not compile yet.

**The moves ahead**

1. **Get the Faust crowd to compile and sound.** Make `neuropulse.dsp` compile on the Mac, render a slow sweep of the coupling from none to full, and set it beside the Python render to hear whether the two agree. This is the step Loudon chose on 2026-06-25; `neuropulse-mac-compile-handoff.md` in the bundle lists what to check first.
2. **Put it on hardware.** Carry the instrument through RNBO to the Eventide H90, so it can be played away from a computer. Which one travels first, the single neuron or the crowd, is still Loudon's call: the forward vector he confirmed on 2026-06-03 names the single neuron, and the crowd became the work after it.
<!-- scroll:plan:end -->

## Standing Orders

<!-- scroll:orders:start -->
_Loudon's standing direction for this project. The steward reads this zone every cycle before anything else, and it is never regenerated. Taste, priorities, "stop asking me about X", "always prefer Y" — write it once here instead of answering it every cycle._
<!-- scroll:orders:end -->

## The making

<!-- scroll:making:start -->
<!-- scroll:entry id="plan-2026-09-25T20-55-14-04-00" -->
### 2026-09-25 — Plan agreed: drawn from the board's grants

Loudon asked for a plan on 2026-09-25. Neither the entry's Four Stages (the built instrument's design) nor the Gen~ development plan (its build spec) held moves still ahead; the moves come from his grants on the board — Faust for the crowd (apo-steward-002), compile first (apo-steward-004), compile, render and compare against the Python render (apo-steward-009, 2026-06-25) — and the forward vector he confirmed on 2026-06-03, which names the H90 via RNBO. The Faust engine does not compile yet (stack overflow in eval, checked 2026-09-25).
<sub>`plan-2026-09-25T20-55-14-04-00` · plan agreed · agreed 2026-09-25T20:55:14-04:00 · written by an elder on Loudon's word</sub>
<!-- /scroll:entry -->

<!-- scroll:entry id="apo-steward-009" -->
### 2026-06-23 — cycle 4 — You have one population audition. Where should I take the next cycle — Faust port, deeper Python, or H90/RNBO?
> still working · audition shipped · steward leans FAUST-FIRST (closes the open Mac-compile handoff)

Recap: Action Potential Oscillator's Stages 1–4 (single neuron, Gen~) shipped in March. Cycle 3 wrote neuropulse.dsp (a Faust population draft) and a Mac-compile handoff, because the Linux sandbox couldn't run Faust. This Mac session does not have Faust installed either, so I sidestepped: I built the population layer in Python and rendered a 30s audition (see apo-steward-008). The forward_vector's question — 'where does Hodgkin-Huxley detail stop mattering sonically' — is now testable by ear for the first time. Three reasonable next cycles, none obviously dominant: (1) install Faust + compile neuropulse.dsp so the production path is unblocked; (2) push the Python further (HH gating, raster plot, chimera states) since iteration is fast there; (3) jump to the H90 port via RNBO so the instrument becomes playable on hardware. My lean is (1) because cycle 3 explicitly left that handoff open, but if your ear says the Python sounds wrong I should fix the audition before chasing the port.

**Artifacts:**
- [neuropulse-population-audition.html](Projects/Action Potential Oscillator/neuropulse-population-audition.html)
- [neuropulse-signalflow-fixed.svg](Projects/Action Potential Oscillator/neuropulse-signalflow-fixed.svg)
<sub>`apo-steward-009` · RESOURCE_REQUEST on TRICKSTER</sub>
<!-- /scroll:entry -->

<!-- scroll:entry id="apo-steward-008" -->
### 2026-06-23 — cycle 4 — Population-dynamics audition rendered: 32 coupled LIF neurons, K swept 0→1→0 over 30s.
> Stages 1–4 already shipped · this is the forward-vector's named next output (N-neuron Kuramoto-coupled population, where coupling itself becomes timbre) · rendered in Python (Mac sandbox has no Faust yet)

The forward_vector reaches past the single-neuron proof toward 'a population-dynamics instrument of N Kuramoto-coupled neurons, where individual spike shape averages out and coupling itself becomes timbre.' So I built it. Thirty seconds of N=32 leaky integrate-and-fire neurons (mean τ=12ms, 18% heterogeneity, mean rate ~110 Hz, 10% spread), coupled via a mean-field Kuramoto term that nudges each cell's effective drive by K·sin(mean_φ − φᵢ). K rides a slow triangle 0 → 1 → 0 across the file. The audible payoff lives in K ∈ [0.05, 0.3]: the incoherent crowd should snap into a phase-locked drone, then unlock as K falls. Each spike is a shaped AP (fast Na rise + slower K fall + hyperpolarization tail), so the timbre lives in the spike shape *and* in how many neurons fire together. This is a Python audition, not the Faust port — but it's the first time the project has heard its own population layer.

**Artifacts:**
- [N=32 coupled LIF neurons, K swept 0→1→0 over 30s — listen for the lock-in around K ∈ [0.05, 0.3].](Projects/Action Potential Oscillator/neuropulse-population-audition.wav)
- [The render script — every parameter (N, τ-spread, K curve, spike shape) is one constant at the top.](Projects/Action Potential Oscillator/population_audition.py)
<sub>`apo-steward-008` · BROADCAST on GENERAL</sub>
<!-- /scroll:entry -->
<!-- scroll:making:end -->
