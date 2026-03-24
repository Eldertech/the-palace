# Neural Oscillator — Gen~ Development Plan

**4 Stages of Action Potential Synthesis**
*Max/MSP Gen~ & RNBO Implementation*

---

## Design Principles

This oscillator is one component of a larger neural synthesis ecosystem. Every design decision serves three constraints simultaneously:

**Signal-rate everywhere** — All inputs are signal-rate (`in N`), never `param`. Every input is a CV jack. Frequency, leak time constant, spike shape, recovery dynamics — all modulatable at audio rate. This is both the modular synthesizer philosophy (everything is a voltage) and the pedagogical philosophy (the math runs continuously at sample rate, reflecting the continuous real-time nature of the biological processes it models). If CPU becomes prohibitive, we optimize later. We do not pre-optimize at the cost of conceptual clarity or modularity.

**Modularity** — Each stage produces a complete, playable oscillator. Stage N replaces Stage N-1; it does not depend on running alongside it. All stages share the same output contract: bipolar audio signal (±1.0) from `out 1`. At the Max patcher level, default values arrive via `sig~` objects; modulation arrives via LFOs, envelopes, sequencers, or other oscillators — all at signal rate, all patchable.

**Biological honesty** — Where we model real biophysics, the input names, ranges, and behaviors map to named biological processes with citations. Where we simplify, we say what we removed and why. Where signal-rate modulation of a "biologically constant" property (like spike peak) produces non-biological behavior, we acknowledge this as artistic extension.

**Gen~ / RNBO compatibility** — Only primitive operations in the core: arithmetic, comparison, conditional assignment, `History` for state. The `exp()` in Stage 2's drive calculation now runs per-sample; this is acceptable on modern CPUs and compiles to RNBO. No `codebox` dependencies.

**Input guarding** — Since all inputs come from `in N` (which outputs 0.0 when nothing is connected), every input that appears in a denominator or as an argument to `exp()` or `log()` must be guarded against zero or degenerate values using `max()`, `clamp()`, or conditional logic. These guards are documented per-stage.

---

## Stage 1: Linear Integrate-and-Fire — The Capacitor

### Objective

Build a frequency-accurate ramp oscillator from the membrane-as-capacitor model. Establish the foundational metaphor: injected current charges a capacitor to threshold, then reset. One signal-rate input, one output.

### Biological Basis

The neuronal membrane is a capacitor. The lipid bilayer (~7–8 nm thick) acts as a dielectric between conducting intracellular and extracellular fluids. Its specific capacitance of ~1 µF/cm² is consistent across cell types because it depends only on the dielectric constant and thickness of the lipid membrane, not on channel expression (Hodgkin & Huxley, 1952 [1]).

When synaptic current flows in, charge accumulates and voltage rises linearly. At threshold (~−55 mV, approximately 15 mV above rest in a typical cortical neuron), a spike fires and the system resets.

**Core equation:**
```
f = I_input / (C_m × (V_th − V_reset))
```
Frequency is directly proportional to input current — the simplest possible f–I curve, and a reasonable first approximation of real neuronal behavior in the suprathreshold regime.

### Simplifications (stated explicitly)

| What's omitted | Why | Consequence |
|---|---|---|
| Membrane leak conductance | Added in Stage 2 | Ramp is linear, not exponential; brighter than biological |
| Spike waveform | Added in Stage 3 | Reset is instantaneous; no per-cycle transient |
| Stochastic channel noise | Future nonlinearity | Perfect pitch stability; no biological jitter |
| Spatial extent (point neuron assumption) | Standard computational neuroscience practice | Maintained throughout all stages |

### Gen~ Implementation Steps

**Step 1 — Input and state.** Create a `gen~` object with one inlet. Inside:
```
freq = max(in1, 0.001);     // guard: prevent zero/negative frequency
History membrane_v(0);
```
The `max` guard ensures that if nothing is patched to the inlet (which sends 0.0), or a negative signal arrives, the oscillator doesn't divide by zero or run backwards. At the patcher level, a `sig~ 440` provides the default.

**Step 2 — Core phasor.** Compute per-sample charge increment and accumulate:
```
charge_increment = freq / samplerate;
membrane_v = membrane_v + charge_increment;
```
Because `freq` is signal-rate, `charge_increment` changes every sample. Patching an audio-rate signal to `in 1` produces through-zero FM — the same behavior as modulating current injection into a real neuron. This is biologically meaningful: neurons receive continuously varying synaptic input, not a static DC current.

**Step 3 — Threshold and reset.** When `membrane_v >= 1.0`, wrap:
```
membrane_v = membrane_v - 1.0;   // wrap preserves phase accuracy
```
Wrapping (not hard reset to 0) preserves sub-sample phase accuracy and prevents drift at high frequencies. This is critical for tuning stability, especially under FM where the effective frequency changes every sample.

**Step 4 — Output scaling.** Convert from unipolar [0, 1) to bipolar [−1, +1):
```
out1 = membrane_v * 2.0 - 1.0;
```

**Step 5 — Max patcher shell.** Build the surrounding patcher:
```
[sig~ 440]          ← default frequency (patchable)
    |
[gen~ neuron_s1]    ← the gen~ object (1 inlet, 1 outlet)
    |
[*~ 0.5]            ← output gain
    |
[dac~]
```
Add `scope~` on the gen~ output to visually confirm the linear ramp. Add `fzero~` or equivalent to verify frequency accuracy. The key: any signal can replace `sig~ 440` — an LFO, another oscillator, a sequencer, MIDI-driven `mtof~`. The gen~ doesn't know or care.

### Inputs

| Inlet | Name | Default (via `sig~`) | Guarded | Maps to |
|---|---|---|---|---|
| `in 1` | frequency | 440 Hz | `max(in1, 0.001)` | Injected current magnitude (I_input) |

### Testing Criteria

- **Frequency accuracy**: at `sig~ 440`, output should measure 440 Hz ±0.1 Hz. Test with `fzero~`.
- **Waveform shape**: visually confirm pure linear ramp on `scope~`. No curvature.
- **Phase wrap**: at `sig~ 1000`, confirm no clicks or discontinuities. Compare against `phasor~ 440` output — should be identical in shape.
- **FM behavior**: patch `cycle~ 5` scaled to ±100 Hz added to `sig~ 440`. The ramp should wobble smoothly in frequency. No clicks, no stuck states.
- **Zero input**: with nothing patched, oscillator should idle silently (freq guarded to 0.001 Hz, effectively DC).

### Bridge to Stage 2

This stage establishes the accumulator + threshold + reset architecture with a signal-rate input. Stage 2 adds a second inlet (leak time constant) and a single multiply (the leak coefficient), transforming the linear ramp into an exponential one. The per-sample computation pattern established here carries forward unchanged.

---

## Stage 2: Leaky Integrate-and-Fire — The RC Circuit

### Objective

Add passive membrane leak to transform the linear ramp into an exponential curve. Introduce the first biologically-grounded timbral control (membrane time constant τ) and the concept of a minimum firing threshold (rheobase). Two signal-rate inputs, one output.

### Biological Basis

Real neuronal membranes are not perfect capacitors. Even at rest, potassium ions diffuse outward through leak channels (KCNK two-pore K⁺ channels). At rest, K⁺ permeability is approximately 20× greater than Na⁺ permeability (Hodgkin & Katz, 1949 [2]; StatPearls, 2023 [3]). This passive K⁺ leak constantly pulls the membrane potential back toward the potassium equilibrium potential (E_K ≈ −90 mV).

The resting potential of ~−70 mV reflects the Goldman-Hodgkin-Katz weighted average of all ion equilibrium potentials, dominated by K⁺:

| Ion | Intracellular | Extracellular | E_equil | Role |
|---|---|---|---|---|
| K⁺ | ~140 mM | ~5 mM | −90 mV | Sets rest; repolarizes spike |
| Na⁺ | ~12 mM | ~145 mM | +60 mV | Drives depolarization |
| Cl⁻ | ~10 mM | ~110 mM | −80 mV | Inhibitory; stabilizes rest |
| Ca²⁺ | ~0.0001 mM | ~2 mM | +125 mV | Signaling; synaptic release |

*(Ion concentrations: Purves et al., 2001 [4]; equilibrium potentials via Nernst equation at 37°C where RT/zF ≈ 26.7 mV for monovalent ions [5, 8])*

These gradients are maintained by the Na⁺/K⁺-ATPase pump (3 Na⁺ out, 2 K⁺ in per ATP), consuming an estimated 20–40% of the brain's total energy budget (Purves et al., 2001 [4]; Attwell & Laughlin, 2001 [7]).

Electrically, the membrane becomes an RC circuit with time constant **τ = R_m × C_m**, typically 10–22 ms in cortical neurons (Koch, 1999 [9]; modern estimates cluster around 13–22 ms per Eyal et al., 2016).

**Core equation:**
```
dV/dt = −V/τ + I_drive
```

**Steady state:** V_∞ = I_drive × τ (must exceed V_threshold for spiking)

**Charge time:** T_charge = −τ × ln(1 − V_th / V_∞) — nonlinear f–I curve

### Simplifications

| What's omitted | Why | Consequence |
|---|---|---|
| Voltage-dependent leak | Even KCNK channels show mild outward rectification | Our leak is constant; real leak is slightly stronger at depolarized potentials |
| Persistent Na⁺ current (I_NaP) | Adds subthreshold positive feedback | No "snap" inflection near threshold; cleaner ramp top |
| Subthreshold oscillations | I_NaP / slow K⁺ interplay creates damped ringing below threshold | Our subthreshold trajectory is purely monotonic |

### Synthesis Connection

The discrete-time leak is a one-pole lowpass filter applied to membrane voltage. The coefficient `(1 − 1/tau_samples)` is exactly the exponential smoothing coefficient used in attack/release smoothing in compressors and envelope followers. The neuron's membrane IS doing the same math.

### Gen~ Implementation Steps

**Step 1 — Inputs and guards.** Two inlets:
```
freq = max(in1, 0.001);              // Hz, guarded
leak_tau_ms = max(in2, 0.1);         // ms, guarded (0.1 ms minimum ≈ ~4 samples at 44.1k)
```
At the patcher level: `sig~ 440` → inlet 1, `sig~ 5` → inlet 2.

**Step 2 — Per-sample derived values.** These all compute every sample, because both `freq` and `leak_tau_ms` can change every sample:
```
leak_tau = leak_tau_ms * 0.001 * samplerate;    // convert ms to samples
leak_coeff = 1.0 - (1.0 / leak_tau);            // one-pole coefficient
period_samples = samplerate / freq;              // target period in samples
drive = 1.0 / (leak_tau * (1.0 - exp(-period_samples / leak_tau)));  // exact drive for target freq
```
The `exp()` runs every sample. At 48 kHz this is 48,000 `exp()` calls per second per voice. On modern CPUs with hardware transcendental approximation, this is well within budget. The payoff: modulating `leak_tau_ms` at audio rate smoothly morphs the waveshape in real time — you hear the membrane becoming leakier or tighter sample by sample.

**Step 3 — Leaky accumulator.** Replace Stage 1's `membrane_v + charge_increment` with:
```
History membrane_v(0);
membrane_v = membrane_v * leak_coeff + drive;
```
This single line is the entire leaky integrator. The multiply-then-add is the discrete one-pole filter. Because `leak_coeff` and `drive` update every sample, the filter characteristics change continuously — like continuously varying the resistance in an analog RC circuit.

**Step 4 — Threshold and reset.** When `membrane_v >= 1.0`, hard reset to 0:
```
if (membrane_v >= 1.0) {
    membrane_v = 0;
}
```
Unlike Stage 1's wrap, a hard reset is more appropriate here. The exponential approach means the overshoot beyond 1.0 is small and variable; wrapping it would create inconsistent reset points. A hard reset better reflects the biology: the spike resets the membrane state.

**Step 5 — Rheobase behavior (emergent, not coded).** If the drive signal is too weak relative to the current leak_tau, the steady-state voltage (`drive * leak_tau`) never reaches threshold. The oscillator goes silent. This is biologically correct — it's the rheobase, the minimum current for spiking. Musically, this means you can "gate" the oscillator by modulating tau or frequency past the spiking boundary. This is a feature that emerges naturally from the math; no additional code needed.

**Step 6 — Output scaling.** Same as Stage 1:
```
out1 = membrane_v * 2.0 - 1.0;
```

**Step 7 — A/B comparison patcher.** Build a Max patcher with both Stage 1 and Stage 2 gen~ objects, same `sig~ 440` feeding both frequency inputs, into a `selector~` for instant A/B. Add `scope~` and `spectroscope~` for both. The exponential curvature of Stage 2 should be visually and spectrally obvious.

### Inputs

| Inlet | Name | Default (via `sig~`) | Guard | Maps to |
|---|---|---|---|---|
| `in 1` | frequency | 440 Hz | `max(in1, 0.001)` | Injected current (I_drive) |
| `in 2` | leak_tau_ms | 5.0 ms | `max(in2, 0.1)` | Membrane time constant (R_m × C_m) |

### Testing Criteria

- **Frequency accuracy**: at `sig~ 440` and `sig~ 5`, output should measure 440 Hz. Test at multiple tau values — the drive calculation should compensate exactly.
- **Waveform shape**: at `sig~ 1` (1 ms tau), ramp should be strongly curved (concave). At `sig~ 25` (25 ms), should approach Stage 1's linear ramp. Confirm on `scope~`.
- **Rheobase boundary**: with tau at 20 ms and frequency at 20 Hz, oscillator should be near or at the spiking boundary. Slowly sweep frequency down — it should go silent. Sweep back up — it should restart.
- **Tau modulation**: patch a slow LFO (0.1 Hz) into inlet 2 (scaled ~2–15 ms). The waveform should morph smoothly between linear and curved on `scope~`. Listen for the timbral sweep from bright to warm.
- **Audio-rate tau modulation**: patch `cycle~ 100` (scaled) into inlet 2. Aliasing and artifacts may appear — document their character and threshold. This is the boundary where optimization might eventually matter.
- **Spectral comparison**: Stage 2 at low tau should show reduced upper harmonics vs Stage 1 on `spectroscope~`.

### Bridge to Stage 3

The leaky integrator provides the subthreshold charging phase. Stage 3 keeps this identical and adds three more inlets (spike shape parameters) plus a state machine that inserts a shaped spike event at threshold crossing.

---

## Stage 3: Shaped Spike — The Action Potential Waveform

### Objective

Replace the instantaneous reset with a biologically-timed spike waveform. Introduce the state machine architecture (charge → rise → fall) and the concept of fixed spike duration creating a natural pitch-dependent timbral evolution. Five signal-rate inputs, one output.

### Biological Basis

The real action potential is a shaped event lasting ~1–2 ms, during which three populations of voltage-gated ion channels race against each other (Hodgkin & Huxley, 1952 [1]; Schwiening, 2012 [10]):

- **m gate** (Na⁺ activation): Opens fast, ~0.1–0.3 ms time constant at peak depolarization. Three m gates must all be open (m³ conductance). This is the autocatalytic positive feedback that produces the explosive rising edge.
- **h gate** (Na⁺ inactivation): Closes slower, ~0.5–1 ms. A single inactivation gate per channel. This terminates the spike by shutting off Na⁺ influx even while voltage remains high.
- **n gate** (K⁺ activation): Opens with delay, ~1–3 ms. Four n gates must all open (n⁴ conductance). This actively repolarizes the membrane by driving K⁺ outward.

The full Hodgkin-Huxley equation:
```
C_m × dV/dt = −ḡ_Na m³h(V − E_Na) − ḡ_K n⁴(V − E_K) − g_L(V − E_L) + I_ext
```

We do NOT simulate this full system in our MVP. Instead, we prescribe the spike waveform using paired exponentials — a legitimate method in computational neuroscience called "fire-and-reset with spike insertion." This is justified because the spike shape is highly stereotyped ("all-or-nothing" law): once threshold is crossed, the waveform is nearly identical every time.

**Critical property — fixed spike duration:** The spike takes ~1 ms regardless of firing rate. At 100 Hz, the spike is 10% of the cycle period. At 500 Hz, it's 50%. At 1000 Hz, it's the entire period. This creates a natural maximum frequency — biologically accurate. Cortical fast-spiking interneurons typically reach 300–600 Hz; specialized auditory neurons (MNTB) can reach ~1000 Hz (Bean, 2007 [11]; Hu et al., 2014).

### Simplifications

| What's omitted | Why | Consequence |
|---|---|---|
| Full H-H gating dynamics | Requires solving 4 coupled ODEs per sample; MVP uses prescribed shape | Spike shape is parametric, not emergent. Future nonlinearity #1-3 |
| Na⁺ activation cubic (m³) | Creates near-vertical rising edge | Our exponential rise is smoother than biological |
| K⁺ delayed rectifier sigmoid (n⁴) | Shapes the falling edge curvature | Our falling edge is a simple exponential decay |
| Temperature dependence (Q₁₀) | All rate constants double per ~10°C | No "temperature" macro parameter yet. Future nonlinearity #4 |

### Artistic Extension Note

In biology, spike shape is stereotyped — modulating `spike_peak` or `spike_duration_ms` at audio rate has no biological correlate. We provide these as signal-rate inputs anyway because: (a) it maintains the design principle of all-CV-all-the-time, (b) it produces musically interesting results (timbral animation within each cycle), and (c) it can be framed as simulating pathological or pharmacological conditions (e.g., channel blockers reducing Na⁺ conductance). When presenting, distinguish between inputs that model continuously varying biological quantities (frequency ≈ synaptic drive, leak_tau ≈ membrane state) and those that are artistic extensions of fixed biological properties.

### Gen~ Implementation Steps

**Step 1 — Inputs and guards.** Five inlets:
```
freq = max(in1, 0.001);                    // Hz
leak_tau_ms = max(in2, 0.1);               // ms
spike_duration_ms = max(in3, 0.1);         // ms — total spike duration
spike_rise_fraction = clamp(in4, 0.01, 0.99);  // unitless — fraction of spike that is rise
spike_peak = max(in5, 1.01);               // normalized — must exceed threshold (1.0)
```
At patcher level: `sig~ 440`, `sig~ 5`, `sig~ 1`, `sig~ 0.2`, `sig~ 1.5`.

**Step 2 — Per-sample derived values.** All computed every sample:
```
// Leak (from Stage 2, unchanged)
leak_tau = leak_tau_ms * 0.001 * samplerate;
leak_coeff = 1.0 - (1.0 / leak_tau);
period_samples = samplerate / freq;
drive = 1.0 / (leak_tau * (1.0 - exp(-period_samples / leak_tau)));

// Spike timing
spike_samps = spike_duration_ms * 0.001 * samplerate;
rise_samps = spike_samps * spike_rise_fraction;
fall_samps = spike_samps * (1.0 - spike_rise_fraction);

// Exponential approach rates (targeting ~95% approach in allocated time)
rise_rate = 1.0 - exp(-3.0 / max(rise_samps, 1.0));
fall_rate = 1.0 - exp(-3.0 / max(fall_samps, 1.0));
```
Two additional `exp()` calls per sample (for rise_rate and fall_rate). Total: 3 `exp()` per sample. Still well within budget.

**Step 3 — 3-state machine.** Using `History`:
```
History V(0);
History spike_v(0);
History phase(0);       // 0=charge, 1=rise, 2=fall
History timer(0);
```

The state machine logic:
```
if (phase == 0) {
    // INTEGRATION: leaky charge toward threshold
    V = V * leak_coeff + drive;
    if (V >= 1.0) {
        phase = 1;
        timer = 0;
        spike_v = V;        // spike begins from current voltage
    }
} else if (phase == 1) {
    // DEPOLARIZATION: Na⁺ channels opening — fast rise
    spike_v += (spike_peak - spike_v) * rise_rate;
    timer += 1;
    if (timer >= rise_samps) {
        phase = 2;
        timer = 0;
    }
} else if (phase == 2) {
    // REPOLARIZATION: Na⁺ inactivation + K⁺ activation — slower fall
    spike_v += (0.0 - spike_v) * fall_rate;
    timer += 1;
    if (timer >= fall_samps) {
        phase = 0;
        V = 0;
        spike_v = 0;
    }
}
```

**Key signal-rate implication:** Because `rise_samps`, `fall_samps`, `rise_rate`, `fall_rate`, and `spike_peak` all update every sample, the spike shape can change *during a spike*. If `spike_duration_ms` lengthens mid-spike, the current phase extends. If it shortens past the current timer position, the phase transitions immediately. This produces expressive modulation artifacts — intentional in our design philosophy.

**Step 4 — Output multiplexing.**
```
output = (phase == 0) ? V : spike_v;
out1 = output * 2.0 - 1.0;
```

**Step 5 — Max patcher.** Build with all five `sig~` defaults patched to the gen~ inlets. Add `scope~` for waveform, `spectroscope~` for spectrum. The spike should be visually apparent as a sharp peak on each cycle. Test with `number~` monitoring the phase output (add `out 2 = phase;` temporarily for debugging).

### Inputs

| Inlet | Name | Default | Guard | Maps to |
|---|---|---|---|---|
| `in 1` | frequency | 440 Hz | `max(, 0.001)` | Injected current |
| `in 2` | leak_tau_ms | 5.0 ms | `max(, 0.1)` | Membrane time constant (R_m × C_m) |
| `in 3` | spike_duration_ms | 1.0 ms | `max(, 0.1)` | Na⁺ inact. + K⁺ activation timescale |
| `in 4` | spike_rise_fraction | 0.2 | `clamp(, 0.01, 0.99)` | Na⁺ activation speed (m gate ratio) |
| `in 5` | spike_peak | 1.5 | `max(, 1.01)` | Peak Na⁺ conductance / E_Na |

### Testing Criteria

- **State machine integrity**: no stuck states. Play for 60 seconds across full frequency and parameter ranges. Add `out 2 = phase;` and monitor — should cycle 0→1→2→0 continuously.
- **Spike duration**: at 44.1 kHz with `sig~ 1` on inlet 3, spike should be ~44 samples. Verify on `scope~` time division.
- **Asymmetry**: rise portion should be visually shorter than fall on `scope~`. At `sig~ 0.2`, rise is 20% of spike width.
- **Frequency ceiling**: as frequency approaches `1000 / spike_duration_ms` Hz, the spike fills the entire period. Behavior should degrade gracefully (less integration time), not crash.
- **Spike peak modulation**: patch slow LFO (0.5 Hz) scaled 1.1–2.5 into inlet 5. Each spike should reach a different peak. The timbral change should be audible as varying brightness/click intensity per cycle.
- **Spectral comparison**: `spectroscope~` vs Stage 2 at same frequency. Stage 3 should show more high-frequency energy from the transient.

### Bridge to Stage 4

The state machine now handles three phases. Stage 4 adds a fourth phase (refractory/recovery) after the spike fall, targets a negative voltage (hyperpolarization) during the fall, and introduces the damped oscillator recovery. Three new inlets bring the total to eight.

---

## Stage 4: Hyperpolarization & Refractory Period — The Complete MVP

### Objective

Complete the action potential cycle with afterhyperpolarization and refractory recovery. Introduce the damped oscillator recovery system. This is the minimum viable product — a complete, biologically-grounded oscillator with 8 signal-rate CV inputs, all mapped to named biological processes.

### Biological Basis

After repolarization, the membrane doesn't return to rest. It overshoots to approximately −80 to −85 mV (versus resting −70 mV). This afterhyperpolarization (AHP) occurs because K⁺ channels activated during the spike are still conducting outward current, pulling the membrane toward E_K ≈ −90 mV (StatPearls, 2023 [5]; Bean, 2007 [11]).

During recovery, the neuron passes through two refractory periods:

- **Absolute refractory** (~1–2 ms): Na⁺ inactivation gates (h gates) have not reset. No stimulus of any strength can trigger another spike. This is a hard biological clock.
- **Relative refractory** (~5–15 ms): Na⁺ gates are partially recovered, but elevated K⁺ conductance and hyperpolarized membrane require stronger-than-normal stimulus. *(Note: the 2–5 ms range sometimes cited is conservative; modern measurements show relative refractoriness extending to 5–15 ms in many cortical neuron types.)*

The recovery dynamics can be modeled as a damped oscillator — the interplay between recovering Na⁺ current (spring force toward rest) and decaying K⁺ current (damping). Depending on the balance:
- **Overdamped** (high damping): smooth exponential return to rest. Clean timbre.
- **Critically damped**: fastest non-oscillatory return.
- **Underdamped** (low damping): decaying oscillation with gamma-band ringing (~40–100 Hz). Adds sub-harmonic growl.

### Simplifications

| What's omitted | Why | Consequence |
|---|---|---|
| Calcium-dependent K⁺ currents (slow AHP) | Creates spike-frequency adaptation over 100–1000 ms | Our firing rate is constant; no "starts fast, slows down" behavior. Future nonlinearity #6 |
| Spike amplitude adaptation | Incomplete Na⁺ recovery at fast rates reduces spike height | All spikes identical. Future nonlinearity #5 |
| Stochastic channel gating | Probabilistic opening/closing | Perfect periodicity, no jitter. Future nonlinearity #7 |
| Distinct absolute vs. relative refractory | Would require tracking Na⁺ gate recovery state | Single refractory parameter; can't be "broken through" by strong input |

### Gen~ Implementation Steps

**Step 1 — Inputs and guards.** Eight inlets total (five from Stage 3 plus three new):
```
// Stage 1–3 inputs (unchanged)
freq = max(in1, 0.001);
leak_tau_ms = max(in2, 0.1);
spike_duration_ms = max(in3, 0.1);
spike_rise_fraction = clamp(in4, 0.01, 0.99);
spike_peak = max(in5, 1.01);

// New Stage 4 inputs
hyperpol_depth = clamp(in6, -0.8, -0.01);      // must be negative, below rest (0.0)
recovery_damping = max(in7, 0.01);              // damping coefficient, must be positive
refractory_ms = max(in8, 0.1);                  // minimum refractory time in ms
```
At patcher level: add `sig~ -0.2`, `sig~ 0.7`, `sig~ 1.5` for the three new inlets.

**Step 2 — Per-sample derived values.** All existing derivations from Stage 3 remain. Add:
```
refractory_samps = refractory_ms * 0.001 * samplerate;

// Spring-damper recovery rate — controls how fast the "spring" pulls V back toward rest
// Derive from a target recovery envelope, or tune empirically.
// A reasonable starting point: recovery_rate = 1.0 / (refractory_samps * 0.5)
recovery_rate = 1.0 / max(refractory_samps * 0.5, 1.0);
```

**Step 3 — 4-state machine.** Extend History variables:
```
History V(0);
History phase(0);           // 0=charge, 1=rise, 2=fall, 3=refractory
History timer(0);
History recovery_velocity(0);
```

The complete state machine:
```
if (phase == 0) {
    // PHASE 0 — SUBTHRESHOLD INTEGRATION
    V = V * leak_coeff + drive;
    if (V >= 1.0) {
        phase = 1;
        timer = 0;
    }

} else if (phase == 1) {
    // PHASE 1 — DEPOLARIZATION (Na⁺ channels open)
    V += (spike_peak - V) * rise_rate;
    timer += 1;
    if (timer >= rise_samps) {
        phase = 2;
        timer = 0;
    }

} else if (phase == 2) {
    // PHASE 2 — REPOLARIZATION (Na⁺ inactivation + K⁺)
    // Target is now hyperpol_depth, not 0.0
    V += (hyperpol_depth - V) * fall_rate;
    timer += 1;
    if (timer >= fall_samps) {
        phase = 3;
        timer = 0;
        recovery_velocity = 0;
    }

} else if (phase == 3) {
    // PHASE 3 — REFRACTORY + DAMPED RECOVERY
    spring_force = (0.0 - V) * recovery_rate;
    damping_force = -recovery_velocity * recovery_damping;
    recovery_velocity += spring_force + damping_force;
    V += recovery_velocity;
    timer += 1;
    if (timer >= refractory_samps && V > hyperpol_depth * 0.3) {
        phase = 0;
        recovery_velocity = 0;
    }
}
```

**Step 4 — Output scaling.** The output range now spans from `hyperpol_depth` to `spike_peak`. Both are signal-rate, so this scaling updates every sample:
```
output_range = spike_peak - hyperpol_depth;
out1 = (V - hyperpol_depth) / output_range * 2.0 - 1.0;
```
This ensures the full waveform uses the complete ±1.0 range regardless of how the inputs are modulated.

**Step 5 — Phase output (optional but recommended).** Add a second outlet for the current phase, useful for visualization, triggering, and inter-module communication:
```
out2 = phase;
```
At patcher level, this can drive a `scope~` (showing the state machine cycling), trigger envelopes on phase transitions, or feed into other modules as a "spike detector."

**Step 6 — Max patcher: full interface.** Build with all eight `sig~` defaults, organized by biological function:

```
// MEMBRANE
[sig~ 440]  → in 1 (frequency / synaptic drive)
[sig~ 5]    → in 2 (leak_tau_ms / membrane time constant)

// SPIKE DYNAMICS
[sig~ 1]    → in 3 (spike_duration_ms / Na⁺ inact. + K⁺ time)
[sig~ 0.2]  → in 4 (spike_rise_fraction / Na⁺ activation speed)
[sig~ 1.5]  → in 5 (spike_peak / peak Na⁺ conductance)

// RECOVERY
[sig~ -0.2] → in 6 (hyperpol_depth / residual K⁺ → E_K)
[sig~ 0.7]  → in 7 (recovery_damping / Na⁺ recovery vs K⁺ decay)
[sig~ 1.5]  → in 8 (refractory_ms / Na⁺ inactivation gate reset)
```

Any `sig~` can be replaced with an LFO, envelope, sequencer, or another oscillator's output. The gen~ object is agnostic — it just processes signals.

**Step 7 — Damping regime exploration.** Patch a slow LFO (0.05 Hz, triangle) scaled 0.1–1.4 into inlet 7 (recovery_damping). On `scope~`, watch the recovery phase morph between ringing oscillation (underdamped) and smooth return (overdamped). On `spectroscope~`, observe sub-harmonic content appear and disappear. Document the critical damping boundary where ringing vanishes.

**Step 8 — Frequency ceiling test.** As frequency increases, spike + refractory phases consume more of the period. At the theoretical ceiling (`1000 / (spike_duration_ms + refractory_ms)` Hz), no time remains for integration. With default params (1.0 + 1.5 = 2.5 ms fixed phases), the ceiling is ~400 Hz. Verify this matches the biological range for cortical fast-spiking interneurons (300–600 Hz). The oscillator should saturate gracefully at this ceiling — the spike fires immediately upon refractory exit, with no integration phase.

### Inputs — Complete MVP

| Inlet | Name | Default | Guard | Biological Origin | Sonic Effect |
|---|---|---|---|---|---|
| `in 1` | frequency | 440 Hz | `max(, 0.001)` | Injected current | Pitch |
| `in 2` | leak_tau_ms | 5.0 ms | `max(, 0.1)` | R_m × C_m | Waveshape: linear↔exponential; warmth/brightness |
| `in 3` | spike_duration_ms | 1.0 ms | `max(, 0.1)` | Na⁺ inact. + K⁺ time | Spike-to-charge ratio; character vs pitch |
| `in 4` | spike_rise_fraction | 0.2 | `clamp(, 0.01, 0.99)` | Na⁺ activation speed (m gate) | Attack sharpness per cycle |
| `in 5` | spike_peak | 1.5 | `max(, 1.01)` | Peak Na⁺ conductance | Transient intensity; click brightness |
| `in 6` | hyperpol_depth | −0.2 | `clamp(, -0.8, -0.01)` | Residual K⁺ → E_K | Waveform asymmetry; harmonic balance |
| `in 7` | recovery_damping | 0.7 | `max(, 0.01)` | Na⁺ recovery vs K⁺ decay | Overdamped=clean / underdamped=growl |
| `in 8` | refractory_ms | 1.5 ms | `max(, 0.1)` | Na⁺ h-gate reset time | Maximum frequency ceiling |

### Testing Criteria

- **4-phase cycling**: monitor `out 2` (phase). Must cycle 0→1→2→3→0 continuously. No stuck states across full range of all 8 inputs.
- **Hyperpolarization**: on `scope~`, waveform should dip below the rest line. Deeper `hyperpol_depth` (more negative) = more visible dip.
- **Damping regimes**: at `sig~ 0.15` on inlet 7, `scope~` should show visible ringing. At `sig~ 1.0`, smooth return.
- **Frequency ceiling**: should match `1000 / (spike_duration_ms + refractory_ms)` ±5%. At defaults: ~400 Hz.
- **Output range**: confirm ±1.0 across all input combinations. No clipping, no DC offset.
- **Modulation stress test**: patch audio-rate signals (50–500 Hz) into inlets 2, 5, 6, and 7 simultaneously. The oscillator should not crash, produce NaN, or get stuck. Artifacts are acceptable and expected — they're the sound of real-time parameter modulation. Document their character.
- **Long-term stability**: play for 5 minutes with slowly drifting LFOs on all inputs. No drift, no accumulation errors.
- **Spectral character**: `spectroscope~` should show this is not a standard waveform — harmonic rolloff from the exponential ramp, broadband energy from the spike transient, potential sub-harmonic content from underdamped recovery, and asymmetric harmonic structure from hyperpolarization.

### Ecosystem Readiness

With all inputs at signal rate, this oscillator is already a modular citizen:

- **Cross-modulation**: One neuron oscillator's output can modulate another's frequency, tau, or spike shape. This is the audio equivalent of synaptic coupling.
- **Spike detection**: The phase output (`out 2`) provides a sample-accurate spike trigger. Use `==~ 1` to detect the onset of depolarization — this is the "axon terminal" output for triggering downstream events (envelopes, other neurons, sequencer advances).
- **Future synaptic inputs**: The current `in 1` (frequency/drive) is a single merged signal. A future "synapse module" could sum multiple weighted inputs with distinct dynamics (fast AMPA, slow NMDA, inhibitory GABA) before feeding into inlet 1 — no changes needed to this oscillator.
- **Gap junction coupling**: Patch one oscillator's raw V output directly into another's integration phase for electrical coupling. Add `out 3 = V;` (raw membrane voltage, pre-scaling) for this purpose.
- **Spike-frequency adaptation** (future module): An external slow integrator counts spikes (from phase output) and feeds back into drive or threshold — the oscillator doesn't need to know about adaptation internally.

---

## References

1. Hodgkin, A.L. & Huxley, A.F. "A quantitative description of membrane current and its application to conduction and excitation in nerve." *J. Physiol.* 117: 500–544 (1952). doi:10.1113/jphysiol.1952.sp004764
2. Hodgkin, A.L. & Katz, B. "The effect of sodium ions on the electrical activity of the giant axon of the squid." *J. Physiol.* 108: 37–77 (1949).
3. "Physiology, Resting Potential." *StatPearls* (NCBI Bookshelf, 2023).
4. Purves, D. et al. *Neuroscience*, 2nd ed. (Sinauer Associates, 2001).
5. "Physiology, Action Potential." *StatPearls* (NCBI Bookshelf, 2023).
6. "Nerve Cell Membrane Potential." *ScienceDirect Topics*.
7. Attwell, D. & Laughlin, S.B. "An energy budget for signaling in the grey matter of the brain." *J. Cereb. Blood Flow Metab.* 21: 1133–1145 (2001).
8. "Membrane Potential." *Foundations of Neuroscience* (MSU Open Books).
9. Koch, C. *Biophysics of Computation* (Oxford University Press, 1999).
10. Schwiening, C.J. "A brief historical perspective: Hodgkin and Huxley." *J. Physiol.* 590: 2571–2575 (2012).
11. Bean, B.P. "The action potential in mammalian central neurons." *Nature Reviews Neuroscience* 8: 451–465 (2007).

### Citation Corrections (from independent verification)

- **Max firing rate:** Bean (2007) discusses mammalian action potentials broadly. The ~1000 Hz figure applies specifically to MNTB (medial nucleus of the trapezoid body) auditory neurons. Cortical fast-spiking interneurons typically reach 300–600 Hz (Hu et al., 2014, *Front. Cell. Neurosci.*). When presenting, distinguish between these neuron types.
- **Membrane time constant:** Koch (1999) cites 10–30 ms. Modern measurements (Eyal et al., 2016, *J. Neurosci.*) cluster around 13–22 ms for human cortical neurons. The 10–30 ms range is acceptable but skews high.
- **Relative refractory period:** The 2–5 ms estimate is conservative. Modern sources typically report 5–15 ms for the full relative refractory period.

---

## Development Order Summary

```
Stage 1 → Stage 2 → Stage 3 → Stage 4
   |          |          |          |
 Linear    + Leak    + Spike    + Hyper + Recovery
 ramp       (1 mul)   (states)   (damped osc)
   |          |          |          |
 1 inlet   2 inlets  5 inlets  8 inlets
   |          |          |          |
 Sawtooth   Warm saw  + Click   + Breath + Growl
   |          |          |          |
 All signal-rate. All CV-patchable. All modular.
```

Each stage is a complete, playable instrument. Each adds exactly the biological realism needed for the next sonic feature. Every input is a CV jack. The Gen~ code at each stage compiles to RNBO without modification.
