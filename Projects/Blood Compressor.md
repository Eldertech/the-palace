---
title: "Blood Compressor"
type: project
status: active
pillars: [creation, tools, philosophy]
born: 2026-05
last_activated: 2026-05
activation_count: 1
stage: sprout
confidence: specified
energy: high
hook_quality: 8
beauty: 7
who_leads: loudon
forward_vector: "I will become the visceral compressor — a gain reduction unit where every parameter maps to a cardiovascular variable, where the GUI shows a beating heart and pulsing vessels, and where the user understands compression by understanding the body. Threshold is the systolic pressure that triggers vasoconstriction; ratio is the elasticity of the vessel wall; attack is the baroreceptor reflex delay; release is the smooth-muscle relaxation curve."
links:
  - target: "[[Biomechanical Synthesis]]"
    type: connects-to
    label: instrument-04
  - target: "[[Compressor Design]]"
    type: deepens
    label: pedagogical-mythology
  - target: "[[Action Potential Oscillator]]"
    type: mirrors
    label: parallel-architecture
  - target: "[[Substrate Skill]]"
    type: couples-with
    label: stage-conditional-build
  - target: "[[Spinoza Conatus]]"
    type: deepens
    label: vessel-as-conatus
---

# Blood Compressor

![[Blood Compressor — hero.png]]

A compressor whose interface and behavior model the human cardiovascular system. The audio signal is the heartbeat. The threshold is systolic pressure. Vasoconstriction is gain reduction. The performer learns compression by feeling, on screen, what their body already does forty times a minute.

This entry is the first concrete development of one of the eight [[Biomechanical Synthesis]] instruments. The hub diagram lists it; this entry is its body.

## The Mapping

Compression's four canonical parameters mapped directly to physiological variables:

| Compressor parameter | Cardiovascular analogue | What the user sees |
|---|---|---|
| **Threshold** | Systolic pressure trigger (~120 mmHg) | A horizontal line across a pressure gauge; the audio "wave" rises against it |
| **Ratio** | Vessel wall elasticity / compliance | The vessel narrows more steeply as pressure exceeds threshold; visible vessel deformation |
| **Attack** | Baroreceptor reflex delay (~150 ms in real bodies) | Time between threshold crossing and vessel constriction onset |
| **Release** | Smooth muscle relaxation curve (slower than attack) | Time for vessel to return to baseline diameter |
| **Knee** | Vessel wall plasticity at compliance threshold | Soft transition vs hard cinch |
| **Sidechain** | Source of the pressure signal (cardiac output vs external) | Selectable: "this signal" vs "another signal" |

The mapping is not metaphor. The cardiovascular system *is* a closed-loop pressure regulation device — exactly what a compressor is. The math is parallel; the difference is that the body's "compressor" runs in flesh.

## Interface Mythology

The GUI is a cross-section of an artery with the compressor riding on top.

**The vessel**: a tube running across the screen. Its inner diameter at any horizontal position represents the gain at that moment in time. Wider vessel = louder; narrower = compressed.

**The blood**: red animated particles flow through. When the audio peaks, the vessel walls bulge outward (increased pressure). When the threshold is crossed, the walls *clamp inward* — vasoconstriction.

**The heart pulse**: at the bottom of the GUI, a beating heart icon synchronized to the input's RMS. This is the body's pulse; the compressor is its arterial response.

**The baroreceptors**: a small cluster of sensor icons on the vessel wall. They light up briefly when the threshold is crossed — the moment the body *notices* the pressure is high. The attack-time delay is the time between the baroreceptor sensing and the vessel constricting.

The character of the compressor is *paramedical*. Not warm-and-tube, not surgical-and-clean. *Embodied*. You are looking inside someone's neck.

## DSP Architecture

Underneath, this is a standard feed-forward compressor with a few biology-inspired choices:

1. **Detector**: RMS over a 50-sample window (mimics baroreceptor integration time-constant in continuous time)
2. **Threshold curve**: soft-knee with cubic interpolation, modeling the vessel's pre-yield elastic response
3. **Attack**: parametric exponential, but with a small *minimum delay* (~5 ms) representing nerve-conduction time. Cannot be set to 0 — the body has reaction time
4. **Release**: parametric exponential with adjustable curve (linear → exponential → log) — cardiovascular release is slower-than-attack and not symmetric
5. **Sidechain HPF**: at 80 Hz default — biologically motivated by the fact that arterial pressure waves are low-frequency (~1 Hz fundamental) and any "audio sidechain" should already be filtered for the compressor to make sense

The biological framing also suggests features traditional compressors lack:

- **Sympathetic activation knob**: globally raises threshold + reduces release time, simulating a stressed body that compresses more aggressively. Functionally similar to a "fast/slow" switch but with a coherent mythology.
- **Heart rate variability**: the detector window varies slightly over time (within ±10 samples), modeling the body's natural variability. Adds gentle imperfection.
- **Vessel age**: a subtle parameter that shifts the soft-knee from cubic toward power-law. Modeling stiffer arteries. Older walls compress harder.

## Pedagogical Framing

The lesson this compressor teaches is *the same one the body teaches you every time you climb stairs*. Your blood pressure rises; your vessels respond; the response has a delay; over-response would burst something; under-response would let it overshoot.

When students set attack=0 and feel the compressor "lunge" at the audio, they are *feeling what the body would do without baroreceptors* — instant clamping, no breath, no give. When they set attack=200 ms, they are giving the body time to *notice* before *acting*. That is what attack actually is.

This builds on the [[Compressor Design]] retrospective's three pedagogical moments. Where that one teaches compression abstractly through window sizes and reluctance metaphors, this one teaches it *by being a body*.

## Forward Vectors

- Stage 1 — Spec the parameter mapping in full (~current state)
- Stage 2 — Build a Max for Live prototype with the basic vessel-narrowing visualization
- Stage 3 — Implement the secondary parameters (sympathetic activation, HRV, vessel age)
- Stage 4 — Author the lesson: a 30-minute Loudon Live session that teaches compression through this device
- Stage 5 — Port to VST/AU for distribution; refine the GUI to render at production quality

## What This Entry Is and Isn't

**Is**: the design specification — biological mapping, DSP architecture, interface mythology, pedagogical framing. Promotes Blood Compressor from a one-line entry in the [[Biomechanical Synthesis]] hub to a project with a stage and a forward vector.

**Isn't**: a built device. Stage 1 (this) → Stage 2 (Max prototype) is the next concrete advancement.

## Open Questions

- Should the heart-pulse audio (a subtle thump synced to RMS) be a feature or hidden? Default off, optional on?
- The "vessel age" parameter is medically loaded — is the metaphor productive or alienating? Probably keep, but with care
- Should sidechain HPF default at 80 Hz (audio convention) or at 0.1 Hz (biological convention)?

## Palace Connections

- **[[Biomechanical Synthesis]]** — the hub this completes
- **[[Compressor Design]]** — the abstract teaching version this incarnates
- **[[Action Potential Oscillator]]** — the parallel project; same biomimetic mapping pattern, applied to oscillators
