---
title: "Neural Granular Synthesis — Control-Vocabulary Math"
type: source
pillars: [tools, creation, philosophy]
born: 2026-06
stage: growing
status: active
parent: "[[Neural Granular Synthesis]]"
forward_vector: "I want to be the precise statement of the population's playable surface — every control on the crowd written twice, symbol for the eye and words for the ear, so the raster plot and the slider always mean the same thing."
links:
  - target: "[[Neural Granular Synthesis]]"
    type: member-of
    label: control-formalization
  - target: "[[Kuramoto Coupling]]"
    type: deepens
    label: order-parameter-as-control
  - target: "[[Action Potential Oscillator]]"
    type: emerged-from
    label: engine-being-controlled
---

# Neural Granular Synthesis — Control-Vocabulary Math

This is the math of the playable surface. Neural Granular Synthesis does not own a DSP engine — the [[Action Potential Oscillator]] does, in its Faust `par(i, N, neuron(i))` Kuramoto population (`Projects/Action Potential Oscillator/neuropulse.dsp`). This document formalizes the layer that sits *on top* of that engine: the statistical descriptors that turn a noisy crowd of N spiking neurons into four or five smooth, performable knobs.

The governing idea: **no equation here describes a single neuron.** Every quantity below is a property of the population as a statistical field. That is the whole reframe — you do not play the grain, you play the crowd's coherence.

Every equation is written twice. The **symbolic** form is for the eye; the **worded** (named-variable) form is for the ear; operator symbols (Σ, ·, /, √, exp) stay in both so the two never drift apart.

---

## 0. The variable table

| Symbol | Name | Range | Role |
|---|---|---|---|
| N | population size | 4 – 64 (engine default 16) | how many neurons in the crowd |
| θᵢ | phase of neuron i | [0, 2π) | where neuron i sits in its fire-recover cycle |
| ωᵢ | natural frequency of neuron i | ~20 – 2000 Hz | the rate neuron i would fire alone |
| K | coupling strength | 0 – ~2 | how hard the crowd pulls each neuron toward the pack |
| K_c | critical coupling | derived | the threshold where synchrony switches on |
| σ_threshold | threshold spread | 0 – 0.5 (fractional) | how unequal the neurons' firing thresholds are |
| g(ω) | frequency distribution | density | the spread of natural frequencies across the crowd |
| r | synchrony index (order parameter) | 0 – 1 | the master read-out: 0 = scatter, 1 = locked |
| ψ | mean phase | [0, 2π) | the crowd's average phase — its collective "now" |
| ⟨f⟩ | mean firing rate | spikes/sec | how fast the crowd fires on average |

In my home entry I call the synchrony index **r** (lowercase); the [[Kuramoto Coupling]] hub calls the same quantity **R**. They are identical — the modulus of the complex order parameter. I use lowercase r here and flag R wherever the hub's notation would be expected, so a reader crossing between the two pages is never confused.

---

## 1. The order parameter r — the master control

This is the single most important quantity in the instrument. It collapses the entire population's phase configuration into one complex number whose **magnitude** is the synchrony index and whose **angle** is the crowd's mean phase. Drag this toward 1 and the timbre fuses; let it fall toward 0 and the timbre scatters into noise. It is the playable surface.

**Symbolic:**

$$ r\, e^{i\psi} \;=\; \frac{1}{N} \sum_{j=1}^{N} e^{i\theta_j} $$

**Worded:**

$$ \text{synchrony} \cdot e^{\,i \cdot \text{mean\_phase}} \;=\; \frac{1}{\text{N}} \sum_{j=1}^{\text{N}} e^{\,i \cdot \text{phase}_j} $$

Where:
- **r** = magnitude of the right-hand side = the synchrony index, 0 to 1.
- **ψ** (mean_phase) = angle of the right-hand side = where the crowd's collective phase is pointing.
- The sum places each neuron as a unit arrow on the circle at its phase θⱼ; r is how long the *average* arrow is. All arrows aligned → average arrow length 1. Arrows scattered evenly → they cancel → average length 0.

The magnitude alone, written out:

**Symbolic:**

$$ r \;=\; \left| \frac{1}{N} \sum_{j=1}^{N} e^{i\theta_j} \right| \;=\; \frac{1}{N}\sqrt{\left(\sum_{j} \cos\theta_j\right)^2 + \left(\sum_{j} \sin\theta_j\right)^2} $$

**Worded:**

$$ \text{synchrony} \;=\; \frac{1}{\text{N}}\sqrt{\left(\sum_j \cos(\text{phase}_j)\right)^2 + \left(\sum_j \sin(\text{phase}_j)\right)^2} $$

This second form is the one that actually runs in code: accumulate the cosine and sine of every neuron's phase, square the two sums, add, square-root, divide by N. The raster plot in this bundle computes exactly this, frame by frame, and prints r on screen.

**What r reads on the raster plot:**
- r → 1: **vertical stripes** — every neuron fires in the same column. Phase-locked.
- r → 0: **random scatter** — spikes fall everywhere. Incoherent.
- r intermediate, drifting in angle: **diagonal bands** — a traveling wave, ψ marching steadily across the population.

---

## 2. Coupling strength K and the critical threshold K_c

K is the knob the performer turns. It is how strongly each neuron is pulled toward the population's collective phase. In the engine, K does not act on phase abstractly — it injects a fraction of the **mean field** (the "who is firing right now" signal) into every neuron's drive current. The mean-field form of the per-neuron dynamics:

**Symbolic:**

$$ \frac{d\theta_i}{dt} \;=\; \omega_i + K \, r \, \sin(\psi - \theta_i) $$

**Worded:**

$$ \frac{d(\text{phase}_i)}{dt} \;=\; \text{natural\_freq}_i + \text{coupling} \cdot \text{synchrony} \cdot \sin(\text{mean\_phase} - \text{phase}_i) $$

Where:
- **K** (coupling) = global coupling strength, the performer's knob.
- **r** (synchrony) = the order-parameter magnitude from §1 — note it appears *inside* the equation of motion. This is the feedback that makes synchrony self-reinforcing: the more locked the crowd already is, the harder it pulls stragglers in.
- **sin(ψ − θᵢ)** = the pull. Zero when neuron i already sits at the mean phase; maximal (the quarter-cycle π/2 force the [[Kuramoto Coupling]] hub calls "maximum strain") when it is 90° away.

The critical coupling K_c is the threshold where r lifts off zero — below it the crowd drifts, above it synchrony switches on. For an all-to-all population with a smooth, symmetric frequency spread g(ω) peaked at the center frequency, Kuramoto's mean-field result:

**Symbolic:**

$$ K_c \;=\; \frac{2}{\pi \, g(\omega_0)} $$

**Worded:**

$$ \text{critical\_coupling} \;=\; \frac{2}{\pi \cdot \text{freq\_density\_at\_center}} $$

Where:
- **g(ω₀)** (freq_density_at_center) = the height of the natural-frequency distribution at its peak.
- The consequence for control: a **tight** frequency spread (tall, narrow g) gives a **low** K_c — the crowd locks easily, with only a nudge of coupling. A **wide** spread (short, broad g) gives a **high** K_c — you must drive K hard to overcome the disagreement. So the frequency spread and the coupling knob trade off against each other, and that trade-off is itself a performable axis.

---

## 3. Threshold variance σ_threshold — the heterogeneity knob

Each neuron has a firing threshold: the membrane charge it must reach to spike. If every threshold were identical the population would lock trivially and sound dead. σ_threshold spreads the thresholds so the crowd has genuine internal disagreement to resolve — the spread is what makes the approach to synchrony *audible* rather than instant.

In the engine, the per-neuron threshold is set by a fractional, deterministic jitter around the default (1.0):

**Symbolic:**

$$ \vartheta_i \;=\; \vartheta_0 \,\bigl(1 + \sigma_{\text{threshold}} \cdot j_i\bigr), \qquad j_i \in [-1, +1] $$

**Worded:**

$$ \text{threshold}_i \;=\; \text{base\_threshold} \cdot \bigl(1 + \text{threshold\_spread} \cdot \text{jitter}_i\bigr) $$

Where:
- **ϑ₀** (base_threshold) = the default threshold, 1.0 in the engine.
- **σ_threshold** (threshold_spread) = the fractional spread, the `hetero_thr` knob, 0 to 0.5.
- **jᵢ** (jitter) = a reproducible per-neuron offset in [−1, +1], hashed from the neuron index so it is fixed per neuron but varied across the crowd.

The statistical reading — the standard deviation of thresholds across the population:

**Symbolic:**

$$ \mathrm{SD}(\vartheta) \;=\; \vartheta_0 \cdot \sigma_{\text{threshold}} \cdot \mathrm{SD}(j) \;\approx\; \frac{\vartheta_0 \, \sigma_{\text{threshold}}}{\sqrt{3}} $$

**Worded:**

$$ \text{threshold\_stddev} \;=\; \text{base\_threshold} \cdot \text{threshold\_spread} \cdot \text{stddev\_of\_jitter} \;\approx\; \frac{\text{base\_threshold} \cdot \text{threshold\_spread}}{\sqrt{3}} $$

(The √3 is the standard deviation of a uniform spread on [−1, +1]; it is approximate because the engine's jitter is hashed-deterministic, not perfectly uniform.) The control reading: **σ_threshold low** → uniform crowd, snaps to lock, r jumps fast, timbre is stiff. **σ_threshold high** → ragged crowd, lock is hard-won and partial, r climbs slowly and tops out below 1, timbre is alive and rough.

---

## 4. Mean firing rate ⟨f⟩ — the timbre's pitch center

The mean firing rate is the average spike count per second across the whole population. It is the population's pitch center — the spectral centroid of the fused timbre tracks it directly.

**Symbolic:**

$$ \langle f \rangle \;=\; \frac{1}{N}\sum_{i=1}^{N} \frac{S_i}{T} $$

**Worded:**

$$ \text{mean\_firing\_rate} \;=\; \frac{1}{\text{N}} \sum_{i=1}^{\text{N}} \frac{\text{spike\_count}_i}{\text{window}} $$

Where:
- **Sᵢ** (spike_count) = number of spikes neuron i emitted in the measurement window.
- **T** (window) = the measurement window length in seconds.

A neuron cannot fire arbitrarily fast: after each spike it is held silent for the refractory period, which caps the rate. The ceiling:

**Symbolic:**

$$ f_{\max} \;=\; \frac{1}{t_{\text{ref}} + t_{\text{spike}}} $$

**Worded:**

$$ \text{max\_firing\_rate} \;=\; \frac{1}{\text{refractory\_time} + \text{spike\_time}} $$

Where **t_ref** (refractory_time) and **t_spike** (spike_time) are the recovery and spike-shape durations the engine exposes (`refractory_ms`, `spike_duration_ms`). This ceiling is why the instrument has a natural top note: drive the population past f_max and the extra drive does not raise pitch, it only sharpens synchrony.

---

## 5. How the four knobs compose

The performer never touches a neuron. They touch four statistical knobs, and r is the meter that reads the result:

| Knob | Symbol | Turning it up does this | Raster read-out |
|---|---|---|---|
| Coupling | K | pulls the crowd toward one phase | scatter → stripes as K crosses K_c |
| Threshold spread | σ_threshold | adds internal disagreement | stripes loosen, r tops out lower |
| Frequency spread | g(ω) width | widens natural-rate disagreement | raises K_c; lock needs more K |
| Drive / pitch | ⟨f⟩ target | raises the population's pitch center | spike columns pack tighter in time |

The single quantity that closes the loop between all of them is **r**, the order parameter — it is simultaneously a *read-out* (the synchrony meter on the raster plot) and a *term inside the dynamics* (§2), so the instrument's coherence is literally self-referential. That self-reference is the difference between this and granular synthesis with an envelope knob: here the crowd's own agreement is what tightens the crowd.

---

## 6. The reframe in one line

Granular synthesis stacks grains until a timbre emerges from density. Neural Granular Synthesis stacks *spiking neurons* until a timbre emerges from **agreement** — and agreement, unlike density, has a number: r. Render r to the eye and you have the raster plot; render r to the ear and you have the fused drone. Same quantity, two senses.

<!-- CLAUDE → LOUDON: K_c in §2 uses the classic Kuramoto sin-coupling mean-field result. The engine's actual coupling is spike-indicator mean-field injected into drive current, not pure sin(ψ−θ), so the real K_c for neuropulse.dsp will differ by a constant factor we'd measure empirically with a K-sweep. I kept the canonical formula because it's the correct *control intuition* (tight spread → low K_c) and flagged the engine's mechanism in the prose. A future cycle could measure the empirical K_c(neuropulse) and pin the constant. -->
