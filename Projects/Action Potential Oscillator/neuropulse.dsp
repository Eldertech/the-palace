declare name        "NeuroPulse";
declare version     "0.1.0";
declare author      "Action Potential Oscillator (palace steward)";
declare description "Population of N Stage-4 action-potential neurons with Kuramoto coupling. Each neuron is the integrate-spike-hyperpolarize-recover state machine from neural_oscillator_dev_plan.md (8 CV parameters), wrapped in par(i, N, ...). Coupling injects a fraction of the mean-field 'who is spiking right now' into each neuron's drive current, parameterized by K. Heterogeneity is per-neuron offsets on frequency, leak tau, and threshold — without heterogeneity a Kuramoto population trivially locks. Outputs: mono mixed signal + the full per-neuron bus for raster / multichannel routing.";
declare copyright   "Loudon Stearns / The Palace, 2026";

// =============================================================================
// NeuroPulse — Faust population engine for Action Potential Oscillator
// =============================================================================
// Architecture:
//   1. neuron(i) — Stage 4 oscillator (charge / spike-rise / spike-fall / refractory)
//   2. par(i, N, neuron(i)) — N neurons running in parallel, sample-synchronous
//   3. mean_field — sum of all neurons' spike-indicator signals / N
//   4. coupling — each neuron's drive current is nudged by K * mean_field
//   5. heterogeneity — per-neuron multiplicative offsets on freq, tau, threshold
//
// Mapping back to the four palace claims:
//   - "neurons are oscillators"            -> neuron(i) IS an oscillator
//   - "ion channels are synthesis params"  -> 8 CV inputs per neuron, signal-rate
//   - "consciousness is timbre"            -> mean_field IS the population's timbre
//   - "K is a threshold of self-model"     -> below K_c the bus is noise,
//                                             above it the bus is a melody
//
// All inputs are signal-rate, every parameter is a CV jack. No `param` declarations
// inside neuron(i). At the top level we expose UI sliders that produce constant
// signals — replace any of them with audio-rate signals to modulate at audio rate.
// =============================================================================

import("stdfaust.lib");

// -----------------------------------------------------------------------------
// Compile-time constants
// -----------------------------------------------------------------------------

// Population size. Faust unrolls par() at compile time, so this is a compile-time
// constant, not a runtime parameter. To change N, recompile. 16 is the default
// because (a) it's enough to see Kuramoto phase transitions clearly, (b) it's
// CPU-friendly at audio rate, (c) it matches a typical microcircuit / cortical
// minicolumn order of magnitude. Tested values: 4, 8, 16, 32, 64.
N = 16;

// -----------------------------------------------------------------------------
// UI surface (each control produces a signal-rate constant; patch over it
// at audio rate by replacing the corresponding inlet in the patch graph)
// -----------------------------------------------------------------------------

// Global drive / pitch (Hz). Maps to the single-neuron `freq` input. Above
// rheobase this is the f-I curve directly.
freq        = hslider("h:neuron/[01]frequency (Hz)[style:knob]",
                      220, 20, 2000, 0.01);

// Membrane leak time constant (ms). The 1-pole-lowpass coefficient.
leak_tau_ms = hslider("h:neuron/[02]leak_tau_ms[style:knob]",
                      5.0, 0.1, 50.0, 0.01);

// Spike total duration (ms). Rise + fall together.
spike_duration_ms = hslider("h:neuron/[03]spike_duration_ms[style:knob]",
                            1.0, 0.1, 5.0, 0.01);

// Fraction of spike that is the rise portion (rest is fall).
spike_rise_fraction = hslider("h:neuron/[04]spike_rise_fraction[style:knob]",
                              0.2, 0.01, 0.99, 0.001);

// Peak spike value, normalized; must exceed threshold (1.0).
spike_peak  = hslider("h:neuron/[05]spike_peak[style:knob]",
                      1.5, 1.01, 3.0, 0.001);

// Afterhyperpolarization depth (negative, below resting voltage which is 0.0).
hyperpol_depth = hslider("h:neuron/[06]hyperpol_depth[style:knob]",
                         -0.2, -0.8, -0.01, 0.001);

// Recovery damping coefficient for the post-spike spring-mass return.
recovery_damping = hslider("h:neuron/[07]recovery_damping[style:knob]",
                           0.7, 0.05, 2.0, 0.001);

// Minimum refractory time (ms) before next spike can be initiated.
refractory_ms = hslider("h:neuron/[08]refractory_ms[style:knob]",
                        1.5, 0.1, 20.0, 0.01);

// -----------------------------------------------------------------------------
// Population controls (the Kuramoto-flavored layer)
// -----------------------------------------------------------------------------

// Kuramoto coupling constant. 0 = independent neurons; > critical K = phase locking.
// The "critical K" depends on the heterogeneity below — that's the whole point
// of the Kuramoto picture. Sweep this slowly to hear the synchronization
// phase transition.
K           = hslider("h:population/[01]K (coupling)[style:knob]",
                      0.0, 0.0, 2.0, 0.001);

// Frequency heterogeneity, fractional. 0 = all neurons want the same freq
// (homogeneous; trivially synchronize). 0.1 = each neuron's natural freq
// spread ±10% around `freq`. Heterogeneity is what makes synchronization
// non-trivial — see palace entry §Population Dynamics, "symmetry breaking
// through heterogeneity".
hetero_freq = hslider("h:population/[02]hetero_freq (frac)[style:knob]",
                      0.05, 0.0, 0.5, 0.001);

// Leak-tau heterogeneity, fractional. Spreads the per-neuron leak constants
// around the global `leak_tau_ms`. This breaks not just frequency symmetry
// but waveshape symmetry — different neurons have different timbres before
// they're even coupled.
hetero_tau  = hslider("h:population/[03]hetero_tau (frac)[style:knob]",
                      0.05, 0.0, 0.5, 0.001);

// Threshold heterogeneity, fractional. Spreads the per-neuron firing thresholds
// (default threshold = 1.0). Some neurons are jumpy, some are stubborn.
hetero_thr  = hslider("h:population/[04]hetero_thr (frac)[style:knob]",
                      0.05, 0.0, 0.5, 0.001);

// Output gain on the population mix bus.
gain_mix    = hslider("h:population/[05]gain_mix[style:knob]",
                      0.4, 0.0, 1.0, 0.001);

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

// Pseudo-deterministic per-neuron jitter in [-1, +1]. Faust has no random() at
// compile time, but i is a known integer per par-instance, so we hash it
// trigonometrically into a number that varies neuron-to-neuron but stays
// fixed within one neuron. Cheap, no allocations, no RNG state.
//   jitter(i) — returns a small reproducible offset per neuron index i.
jitter(i) = sin(i * 12.9898 + 78.233) * 43758.5453 - floor(sin(i * 12.9898 + 78.233) * 43758.5453) * 2.0 - 1.0;

// SR = sample rate, ms-to-samples conversion helper.
SR          = ma.SR;
ms2samp(t)  = t * 0.001 * SR;

// Phase state encoding for the per-neuron state machine:
//   0 = charging (integrate-and-fire ramp)
//   1 = spike rise
//   2 = spike fall (target = hyperpol_depth)
//   3 = refractory + damped recovery
// We store this as an integer in a feedback loop.

// -----------------------------------------------------------------------------
// neuron(i) — one full Stage 4 oscillator
// -----------------------------------------------------------------------------
// The neuron receives a single audio-rate signal — the mean-field coupling
// drive added to its own intrinsic drive. Internally it runs the four-phase
// state machine. It outputs TWO signals (Faust functions return tuples):
//   (audio_out, spike_indicator)
// where spike_indicator is 1.0 while the neuron is in phase 1 (spike rise)
// and 0.0 otherwise. This is the "is this neuron firing right now" pulse
// that feeds the mean-field.
//
// The signature is `neuron(i, coupling_in)` — i is the neuron index (used
// for heterogeneity), coupling_in is the mean-field coupling signal.
// -----------------------------------------------------------------------------

neuron(i, coupling_in) = (V_out, spike_out)
with {
    // -- per-neuron heterogeneity (applied multiplicatively) ------------------
    // Each neuron has slightly different freq, tau, and threshold. The jitter
    // is bounded so we never cross zero or invert sign.
    j           = jitter(i);
    my_freq     = max(0.001, freq        * (1.0 + hetero_freq * j));
    my_tau_ms   = max(0.1,   leak_tau_ms * (1.0 + hetero_tau  * j));
    my_thr      = max(0.1,   1.0         + hetero_thr  * j);  // default thr = 1.0

    // -- per-sample derived values --------------------------------------------
    leak_tau     = max(2.0, my_tau_ms * 0.001 * SR);  // floor at 2 samples
    leak_coeff   = 1.0 - (1.0 / leak_tau);
    period_samps = SR / my_freq;

    // Spike + refractory durations (in samples) ------------------------------
    spike_samps    = max(2.0, ms2samp(spike_duration_ms));
    rise_samps     = max(1.0, spike_samps * spike_rise_fraction);
    fall_samps     = max(1.0, spike_samps - rise_samps);
    refrac_samps   = max(1.0, ms2samp(refractory_ms));

    // Phases consumed by non-charge stages — subtract from target period so
    // that the freq input behaves as true pitch regardless of spike width.
    fixed_phase_samps   = spike_samps + refrac_samps;
    charge_period_samps = max(1.0, period_samps - fixed_phase_samps);

    // Drive current targeted to reach threshold in charge_period_samps,
    // accounting for leak. This is the analytic drive from the dev plan
    // Stage 2 / Stage 4 — the (1 - exp(-T/tau)) form, scaled to threshold.
    drive_intrinsic = my_thr / (leak_tau * (1.0 - exp(-charge_period_samps / leak_tau)));

    // Add Kuramoto coupling. The coupling signal is in roughly [0, 1] (it's
    // a mean of {0,1} indicators), so scaling by K and adding directly to
    // drive nudges every neuron toward firing-when-the-pack-fires.
    drive = drive_intrinsic + K * coupling_in;

    // Per-sample rise / fall increments. Linear within each phase for
    // numerical robustness and code clarity; the dev plan's exponential
    // approach is also valid but the linear form preserves spike SHAPE
    // exactly across freq modulation.
    rise_rate = (spike_peak - my_thr) / rise_samps;
    fall_rate = (hyperpol_depth - spike_peak) / fall_samps;

    // -- feedback loop: the state machine ------------------------------------
    // We carry three pieces of state across samples:
    //   V        — membrane voltage
    //   phase    — 0/1/2/3
    //   timer    — samples spent in current phase
    //   vel      — recovery-phase velocity (for damped oscillator)
    //
    // Faust handles state via mem / @ — we use the canonical "letrec on a
    // tuple, deref previous sample with `'`" pattern.

    V = V_step ~ _;
    V_step(V_prev) = next_V
    with {
        // Last-sample phase / timer / velocity, recomputed by mutual recursion.
        // Faust unfolds these into a single coupled feedback graph.
        phase_prev = phase ~ _;
        timer_prev = timer ~ _;
        vel_prev   = vel   ~ _;

        // -- phase 0: charge --------------------------------------------------
        // V' = V * leak_coeff + drive ; on V >= my_thr, jump to phase 1.
        charging_next_V = V_prev * leak_coeff + drive;
        charging_fires  = charging_next_V >= my_thr;

        // -- phase 1: spike rise ----------------------------------------------
        // Linear ramp from my_thr to spike_peak over rise_samps samples.
        rising_next_V = V_prev + rise_rate;
        rising_done   = timer_prev >= rise_samps;

        // -- phase 2: spike fall ----------------------------------------------
        // Linear ramp from spike_peak to hyperpol_depth over fall_samps.
        falling_next_V = V_prev + fall_rate;
        falling_done   = timer_prev >= fall_samps;

        // -- phase 3: refractory damped recovery ------------------------------
        // Spring-mass system pulling V back toward resting voltage (0.0):
        //   accel = -k_spring * V - recovery_damping * vel
        // We use unit spring constant (k_spring = 1 / (leak_tau)) so recovery
        // timescale is coupled to the membrane time constant. Underdamped
        // (low recovery_damping) -> ringing; overdamped -> smooth return.
        spring_k        = 1.0 / leak_tau;
        recover_accel   = -spring_k * V_prev - recovery_damping * vel_prev;
        recover_next_vel = vel_prev + recover_accel;
        recover_next_V   = V_prev + recover_next_vel;

        // Recovery completes when both: (a) at least refrac_samps elapsed,
        // (b) voltage has returned above 30% of hyperpol_depth — i.e. close
        // enough to rest to accept new input. Same gate as dev plan §Stage 4
        // step 3.
        recover_done = (timer_prev >= refrac_samps)
                     & (V_prev > hyperpol_depth * 0.3);

        // -- phase dispatcher -------------------------------------------------
        // The next sample's voltage is selected by current phase.
        next_V = select4(int(phase_prev),
                         charging_next_V,
                         rising_next_V,
                         falling_next_V,
                         recover_next_V);
    };

    // Phase machine, mutually recursive with V via the feedback graph above.
    // Implemented as a 4-way select fed by the four "should we transition"
    // tests. Each phase's next-phase decision is encoded as a small select.
    phase = phase_step ~ _;
    phase_step(p_prev) = next_phase
    with {
        // Recompute the same transition predicates as in V_step using the
        // PREVIOUS sample's values, which Faust accesses via `'`.
        V_p     = V';
        timer_p = timer';

        charging_next_V_p = V_p * leak_coeff + drive;
        fires_now         = charging_next_V_p >= my_thr;

        rising_done_now   = timer_p >= rise_samps;
        falling_done_now  = timer_p >= fall_samps;
        recover_done_now  = (timer_p >= refrac_samps) & (V_p > hyperpol_depth * 0.3);

        // Phase transitions:
        //   0 -> 1 on fire
        //   1 -> 2 on rising_done
        //   2 -> 3 on falling_done
        //   3 -> 0 on recover_done
        from_0 = ba.if(fires_now,        1, 0);
        from_1 = ba.if(rising_done_now,  2, 1);
        from_2 = ba.if(falling_done_now, 3, 2);
        from_3 = ba.if(recover_done_now, 0, 3);

        next_phase = select4(int(p_prev), from_0, from_1, from_2, from_3);
    };

    // Timer: increments while in current phase, resets to 0 on phase change.
    timer = timer_step ~ _;
    timer_step(t_prev) = ba.if(phase != phase', 0, t_prev + 1);

    // Recovery velocity: integrates only while in phase 3, resets to 0 otherwise.
    vel = vel_step ~ _;
    vel_step(v_prev) =
        ba.if(int(phase) == 3,
              v_prev + (-(1.0 / leak_tau) * V' - recovery_damping * v_prev),
              0.0);

    // -- outputs --------------------------------------------------------------
    // Mono audio output, normalized to [-1, +1] based on the full range
    // [hyperpol_depth, spike_peak].
    output_range = spike_peak - hyperpol_depth;
    V_out        = (V - hyperpol_depth) / output_range * 2.0 - 1.0;

    // Spike indicator: 1.0 while in spike rise (phase 1), else 0.0. This is
    // what feeds the mean-field coupling. Using only the rise phase (not the
    // full spike) keeps the indicator a fast pulse — closer to the
    // biological "did this neuron just fire" event.
    spike_out = ba.if(int(phase) == 1, 1.0, 0.0);
};

// -----------------------------------------------------------------------------
// Population — N neurons in parallel, coupled via mean-field
// -----------------------------------------------------------------------------
// Faust's natural idiom for "N parallel things" is par(i, N, expr). The Kuramoto
// twist is that every neuron's input depends on EVERY neuron's output — a
// fully connected coupling graph. This is exactly the mean-field approximation:
//   coupling_to_i = (1/N) * sum_{j} spike_j
// We compute the mean-field by summing all spike indicators and dividing by N,
// then feed that same signal into every neuron's coupling inlet. Because Faust
// is sample-synchronous, the mean-field at sample n is built from sample (n-1)
// of each neuron — there's one sample of delay through the feedback loop,
// which is negligible at audio rates and ALSO closer to biology (axonal delay).
//
// The graph we want:
//   coupling_bus = sum(spike_out_i) / N         (feedback)
//   neuron_i(coupling_bus) -> (V_out_i, spike_out_i)
//   audio_out = sum(V_out_i) / N * gain_mix
//
// The cleanest Faust expression of this uses a feedback operator (~) that
// closes the loop between coupling_bus and the per-neuron spike outputs.
// -----------------------------------------------------------------------------

// One bank of N neurons, all receiving the same coupling signal on a single
// shared inlet. The signature: 1 input (coupling) -> 2*N outputs (V then spike,
// interleaved per neuron).
population_bank(coupling_in) = par(i, N, neuron(i, coupling_in));

// From the 2*N interleaved outputs, split into two N-wide buses: the V bus
// (audio) and the spike bus (mean-field source). The dev plan calls these
// "the raster" and "the audio mix" respectively.
//
// Per-neuron pair (V_i, spike_i) -> two banks. We use par with a deinterleave.
// Faust ships `ba.selector` / `ba.interleave`; the most readable form here is
// explicit:
deinterleave_2N = par(i, N, _) , par(i, N, _);

// Sum across the spike bus, divided by N, gives the mean-field.
sum_N           = par(i, N, _) :> _;
mean_field_op   = sum_N : *(1.0 / N);

// Sum across the V bus, divided by N (and gained), gives the audio mix.
audio_mix_op    = sum_N : *(1.0 / N) : *(gain_mix);

// The full population with the Kuramoto feedback loop closed.
//
// Conceptually:
//   loop:
//     coupling = mean_field
//     (V_bus, spike_bus) = population_bank(coupling)
//     mean_field <- mean of spike_bus  (this is the recursion)
//   output:
//     audio_out = mean of V_bus * gain_mix
//
// In Faust feedback syntax:
neuropulse = (population_bank
              : (par(i, N, _), (par(i, N, _) :> *(1.0 / N))))
             ~ _
             : audio_select
with {
    // After the feedback fixpoint, we have N audio outs + 1 mean-field tap.
    // We discard the mean-field tap at the top level and keep only the audio
    // mix. (To expose the raster bus or the mean-field, replace audio_select.)
    audio_select = (par(i, N, _) :> *(1.0 / N) : *(gain_mix))
                 , !;
};

// -----------------------------------------------------------------------------
// Top-level process
// -----------------------------------------------------------------------------
// Default top-level voice: the population mix, mono in, mono out (the input
// is unused at the top level for now — the population is self-driving).
// Replace `0` with an audio-rate signal to drive frequency or any other
// parameter at audio rate.
process = neuropulse;

// =============================================================================
// Notes for the next cycle (handoff to future steward)
// =============================================================================
//
// 1. The feedback graph above (`~ _` over the deinterleaved spike bus) is the
//    rate-limiting compile step. Faust will inline the par across N — at N=64
//    expect noticeably longer compile, but runtime is still linear in N.
//
// 2. The mean-field uses spike indicators (binary {0,1}). An alternative,
//    closer to the original Kuramoto math, is to project each neuron's
//    *phase* (a continuous angle in [0, 2*pi)) onto sin/cos and average those
//    two channels — that gives the full complex order parameter. The
//    spike-indicator mean-field is the integrate-and-fire flavor; the
//    sin/cos mean is the smooth-phase flavor. The palace entry's
//    [[Kuramoto Coupling]] hub discusses both; we picked the integrate-and-fire
//    flavor for biological fidelity. A second .dsp implementing the sin/cos
//    flavor would be a clean A/B comparison.
//
// 3. Heterogeneity uses a deterministic per-index hash (jitter(i)). To
//    randomize differently per session, add a `seed` slider that XORs into
//    the hash. Currently each neuron's "personality" is fixed at compile
//    time, which makes ear-training and A/B comparisons reproducible.
//
// 4. The raster signal (per-neuron spike indicators) is currently discarded
//    at the top level — see `audio_select`. To export the raster for
//    visualization, change `process` to expose the N-wide spike bus as
//    auxiliary channels. RNBO targets won't preserve that channel layout
//    cleanly; for raster visualization the Faust → JACK path is the right
//    target.
//
// 5. Critical K behavior: with default heterogeneity (5% on each), the
//    transition from incoherent to phase-locked should be audible somewhere
//    in K ∈ [0.05, 0.3]. Slow LFO on K (0.05 Hz triangle, 0 to 1) sweeps
//    through the synchronization phase transition — this is the demo.
//
// =============================================================================
