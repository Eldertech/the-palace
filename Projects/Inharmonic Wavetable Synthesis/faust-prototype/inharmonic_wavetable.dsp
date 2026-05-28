declare name        "Inharmonic Wavetable Synthesis";
declare version     "0.1.0";
declare author      "Inharmonic Wavetable Synthesis (palace steward) + Loudon Stearns";
declare description "Dual-wavetable additive synthesis prototype.
                     Wavetable A drives per-partial amplitudes.
                     Wavetable B drives per-partial frequency deviations in cents.
                     A flat horizontal Wavetable-B line at zero IS the harmonic series.
                     Any curve away from that line is the inharmonicity profile of some physical material.";
declare license     "GPL3-with-exception (Faust standard)";

//------------------------------------------------------------------------------
// Inharmonic Wavetable Synthesis — Phase 0 prototype
//------------------------------------------------------------------------------
//
// "Every material bends the flat line differently. That bending is the instrument."
//
// This is the smallest engine that exercises both wavetables. It is INTENTIONALLY
// minimal: 32 partials, 4 amplitude presets, 5 inharmonicity presets, one
// envelope, one note at a time. It exists so the architecture can be HEARD
// before any VST commitment.
//
// Architecture (see Projects/Inharmonic Wavetable Synthesis.md §The Architecture):
//
//   For each partial n in 1..N:
//     A_n = amplitudeProfile[n]                        (from Wavetable A preset)
//     dCents_n = bDepth * inharmonicityProfile(n, frameScan)   (from Wavetable B)
//     f_n      = n * f0 * 2^(dCents_n / 1200)
//     out_n    = A_n * sin(2*pi*phase_n)
//   output = sum_n out_n
//
// frameScan is an ADSR-driven scalar in [0,1] that interpolates between the
// EARLY frame of Wavetable B (high inharmonicity, attack character) and the
// LATE frame (flat, harmonic sustain). This is the "settling piano" gesture.
//
// To audition the architecture, hold a note while sweeping:
//   - WT-B PRESET   (cycles through Flat / Piano / Bessel / Stochastic)
//   - B-DEPTH       (the single most expressive control in the instrument)
//   - SETTLE-TIME   (how fast the inharmonicity profile relaxes to flat)
//
//------------------------------------------------------------------------------

import("stdfaust.lib");

//------------------------------------------------------------------------------
// Globals
//------------------------------------------------------------------------------

N = 32;                             // partial count (Phase 0 sweet spot)
TWOPI = 2.0 * ma.PI;

//------------------------------------------------------------------------------
// Performance controls (the "instrument" UI surface)
//------------------------------------------------------------------------------

// Gate is the trigger for ADSR + frame-scan accumulator. Keep it as a clean
// 0/1 step — no smoothing — so en.adsr and the frame-scan reset behave
// crisply.
gate     = button("gate");
pitchHz  = hslider("[01] f0 (Hz) [style:knob]", 110, 27.5, 880, 0.01);
vel      = hslider("[02] velocity [style:knob]", 0.8, 0, 1, 0.001) : si.smoo;
masterGain = hslider("[10] master gain (dB) [style:knob]", -12, -60, 6, 0.1)
             : ba.db2linear : si.smoo;

//------------------------------------------------------------------------------
// Wavetable A — per-partial amplitude profile
//------------------------------------------------------------------------------
// In the full instrument, Wavetable A is a 256-frame wavetable whose current
// frame is FFT-analyzed for partial amplitudes. In this prototype the partial
// amplitudes are precomputed for four characteristic timbres so the dual-WT
// concept can be heard without an FFT pipeline.

wtA_preset = nentry("[03] Wavetable A [style:menu{'saw (rich harmonic)':0;'square (odd only)':1;'hollow / triangle-ish':2;'vocal-A formant':3}]", 0, 0, 3, 1);

// Saw: A_n = 1/n (full harmonic stack).
ampSaw(n) = 1.0 / (n + 1);

// Square: A_n = 1/n for ODD n, 0 for even n.
ampSquare(n) = ba.if((int(n) % 2) == 0, 1.0 / (n + 1), 0.0);

// Hollow / triangle-ish: A_n = 1/(n^2) for odd n, very weak even n.
ampHollow(n) = ba.if((int(n) % 2) == 0,
                     1.0 / ((n + 1) * (n + 1)),
                     0.05 / (n + 1));

// Vocal "A" (ah) — three formant regions centered around partials
// (~7, ~12, ~25 at f0 ≈ 110 Hz) with Gaussian-like falloff.
// This is a rough, expressive-not-accurate vocal-A approximation.
formantBump(n, ctr, width) =
    exp(0.0 - ((n - ctr) * (n - ctr)) / (2.0 * width * width));

ampVocalA(n) = 0.50 * formantBump(n, 7,  2.0)
             + 0.35 * formantBump(n, 12, 3.0)
             + 0.20 * formantBump(n, 25, 5.0)
             + 0.05 / (n + 1);    // gentle harmonic floor

// Dispatch — pick the amplitude profile for partial n.
amplitudeProfile(n) = ba.selectn(4,
                                 wtA_preset,
                                 ampSaw(n),
                                 ampSquare(n),
                                 ampHollow(n),
                                 ampVocalA(n));

//------------------------------------------------------------------------------
// Wavetable B — per-partial frequency-deviation profile, in cents
//------------------------------------------------------------------------------
// Each curve takes (n, frame) and returns cents-deviation from the harmonic
// position of partial n. frame ∈ [0,1]:
//   frame = 0  →  EARLY frame  (full physical inharmonicity, attack character)
//   frame = 1  →  LATE frame   (relaxed toward flat harmonic baseline)
//
// The "settling piano" gesture is just: drive frame from 0 → 1 over the note
// lifetime. The shape of that drive is the SETTLE-TIME envelope.

wtB_preset = nentry("[04] Wavetable B [style:menu{'flat (harmonic)':0;'piano stretch (B-coeff)':1;'bessel zeros (bell)':2;'stochastic scatter':3;'inverse stretch':4}]", 1, 0, 4, 1);

bDepth    = hslider("[05] B depth (inharmonicity amount) [style:knob]", 1.0, 0.0, 3.0, 0.001) : si.smoo;
settleSec = hslider("[06] settle time (s) [style:knob]", 0.8, 0.01, 5.0, 0.001);

// Profile 0 — FLAT. Zero cents at every partial, both frames. Pure harmonic.
profFlat(n, frame) = 0.0;

// Profile 1 — PIANO STRETCH. Classical B-coefficient form.
// Real-instrument cents deviation for piano partial n:
//   cents_n ≈ 1200 * log2( sqrt(1 + B * n^2) )
// where B ≈ 0.0004 for treble strings (mid-piano realistic).
// EARLY frame uses full B; LATE frame uses B*0.05 (almost flat).
// We crossfade between early and late by `frame`.
pianoB_early = 0.0004;
pianoB_late  = 0.0004 * 0.05;
pianoCents(n, B) = 1200.0 * log(sqrt(1.0 + B * (n + 1) * (n + 1))) / log(2.0);
profPiano(n, frame) = (1.0 - frame) * pianoCents(n, pianoB_early)
                    +        frame  * pianoCents(n, pianoB_late);

// Profile 2 — BESSEL ZEROS (bell/cymbal physics).
// Ideal-circular-membrane mode ratios divided by integer partial position,
// expressed in cents. The first 12 ratios are baked in; beyond that we
// extrapolate with ratio_n ≈ n + 0.5.
//   bessel_ratios = [1.0, 1.594, 2.136, 2.296, 2.653, 2.918,
//                    2.917, 3.156, 3.501, 3.598, 3.652, 3.812]
// Cents deviation of partial n from harmonic = 1200 * log2(ratio_n / (n+1)).
besselRatio(n) = ba.selectn(13,
                            int(min(n, 12)),
                            1.000, 1.594, 2.136, 2.296, 2.653, 2.918,
                            2.917, 3.156, 3.501, 3.598, 3.652, 3.812,
                            (n + 1) * 0.95);    // mild extrapolation > 12
besselCents(n) = 1200.0 * log(besselRatio(n) / (n + 1)) / log(2.0);
// LATE frame: still some bell character (bells barely "settle") — 30% of early.
profBessel(n, frame) = (1.0 - 0.7 * frame) * besselCents(n);

// Profile 3 — STOCHASTIC SCATTER. Pseudo-random per-partial cents using a
// deterministic hash so the timbre is stable note-to-note. Range ±50 cents
// at full B. LATE frame: scatter shrinks to ±5 cents.
hashCents(n) = (((n + 1) * 2654435761) % 1000) / 1000.0 * 100.0 - 50.0;
profStochastic(n, frame) = (1.0 - 0.9 * frame) * hashCents(n);

// Profile 4 — INVERSE STRETCH. Lower partials sharp, upper partials flat —
// the OPPOSITE of piano. Not a real physical instrument but a beautiful
// inversion to demonstrate "the curve IS the material."
profInverse(n, frame) = (1.0 - 0.5 * frame) * (15.0 - 1.5 * (n + 1));

// Dispatch
inharmonicityProfile(n, frame) = ba.selectn(5,
                                            wtB_preset,
                                            profFlat(n, frame),
                                            profPiano(n, frame),
                                            profBessel(n, frame),
                                            profStochastic(n, frame),
                                            profInverse(n, frame));

//------------------------------------------------------------------------------
// Envelopes
//------------------------------------------------------------------------------

// Amplitude envelope — short attack, modest decay, sustain, release.
ampEnv = en.adsr(0.005, 0.20, 0.65, 0.50, gate);

// Frame-scan envelope — drives Wavetable B from EARLY (0) to LATE (1) over
// `settleSec`. This IS the "settling piano" trajectory. A simple exponential
// approach to 1 while gate is held; resets when gate is released.
//
// Implementation: accumulate `dt = 1/SR` per sample while gate is high; clear
// to 0 when gate is low. Then frameScan = 1 - exp(-t / settleSec).
frameScan = (1.0 - exp(0.0 - t / max(0.01, settleSec))) * gate
with {
    // Seconds-since-gate-on accumulator. Faust recursion `~ _`: each sample
    // the previous output feeds back, gets dt added, then * gate so release
    // zeroes it out instantly.
    dt = 1.0 / ma.SR;
    t  = (+(dt) : *(gate)) ~ _;
};

//------------------------------------------------------------------------------
// One partial — phase accumulator → sine → amplitude
//------------------------------------------------------------------------------

partial(n) = os.osc(freq) * amp
with {
    cents = bDepth * inharmonicityProfile(n, frameScan);
    freq  = pitchHz * (n + 1) * pow(2.0, cents / 1200.0);
    amp   = amplitudeProfile(n);
    // os.osc is Faust's sine oscillator — each partial gets its own phase
    // accumulator implicitly through the parallel `sum(n, N, partial(n))`.
};

//------------------------------------------------------------------------------
// The additive bank — sum N partials in parallel
//------------------------------------------------------------------------------

bank = sum(n, N, partial(n));

//------------------------------------------------------------------------------
// Output
//------------------------------------------------------------------------------
// Mono signal scaled by amp envelope, velocity, master gain, and a 1/sqrt(N)
// normalization so loudness doesn't depend on partial count. Wired to both
// channels for a centered stereo image; Wavetable C (per-partial pan) is the
// next architectural extension and lives in the .md spec, not this prototype.

normGain = 1.0 / sqrt(N);
voice = bank * ampEnv * vel * masterGain * normGain;

process = voice, voice;
