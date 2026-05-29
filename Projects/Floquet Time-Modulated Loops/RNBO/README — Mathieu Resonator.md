# Mathieu Resonator — Stage 1 instrument

The Stage 1 instrument for the **[[Floquet Time-Modulated Loops]]** project. A 2nd-order resonator whose center frequency is parametrically modulated at audio rate. Below the n=1 tongue's threshold the system is silent (only the noise input is heard). Above threshold the noise gets exponentially amplified into ringing oscillation, then bounded by `tanh` saturation into a deliberate timbre.

This README documents:

1. The required parent Max patch (what to wire around the `codebox~`).
2. The A/B harness (codebox vs. Python reference, sample-identical).
3. The five-stage verification protocol with acceptance criteria.
4. Common failure modes and their diagnostics.

## 1. Parent Max patch

Required objects, minimum viable Stage 1:

- `[noise~]` — excitation. Set its level to taste; the codebox itself has a `noise_level` parameter so you can also leave the external noise low and let the codebox's internal noise dominate.
- `[buffer~ ref_noise <pathto>/audio/19_reference_noise.wav]` — for the A/B harness, see Section 2.
- `[rnbo~ mathieu_resonator]` — wraps `mathieu_resonator.codebox`.
- `[scope~]` — time-domain view of `out1`.
- `[plot~]` or `[jit.matrix]` for the live phase-space `(x, v)` plot. Use `out2` (carries `tanh(v)`) as the y-axis.
- `[spectroscope~]` or `[fffb~]` — sideband ladder view.
- `[ezdac~]` or `[live.gain~]` — output.
- A few `[live.slider]` or `[number]` boxes driving the `[param ...]` objects: `freq`, `q_depth`, `mod_rate_ratio`, `gain`, `noise_level`, `damping_zeta`.

Recommended initial parameter values:
```
freq            = 220
q_depth         = 0.0    → sweep this manually
mod_rate_ratio  = 2.0
gain            = 0.5
noise_level     = 0.001
damping_zeta    = 0.025
```

## 2. A/B harness against the Python reference

The Python reference implementation in `mathieu_reference.py` produces a deterministic 4-second WAV at the reference parameters: `audio/19_reference_output.wav`. The codebox should produce a sample-identical waveform when fed the same noise sequence.

The trick is that codebox's `random()` and Python's `np.random` are independent generators — they will not agree. To get sample-identical comparison, both implementations need to use a **stored** noise buffer.

### To run the A/B test

1. Modify the codebox temporarily to read its noise input from a `[buffer~]` instead of internal `random()`. The simplest approach: feed `[noise~]` from `[buffer~ ref_noise]` via `[play~ ref_noise 1]` clocked at the patch sample rate, and route the buffer's output into the codebox's `in1` (which the noise term reads).
2. Set codebox parameters to match the reference: `freq=220, q_depth=0.30, mod_rate_ratio=2.0, gain=0.5, noise_level=0.001, damping_zeta=0.025`.
3. In parallel, `[sfplay~ 19_reference_output.wav]` plays the Python reference output.
4. Subtract: `(codebox_out) - (reference_out)` → meter the difference. With everything correct the difference should sit below −90 dB. Above that, see Section 4.

The reference WAV is normalized to −3 dBFS peak; the codebox output should be scaled to match before subtraction.

## 3. Verification protocol

These are the same 7 tests at the bottom of `mathieu_resonator.codebox`, expanded with acceptance thresholds.

### Test 1 — Unmodulated resonator (q_depth = 0)

- Set `q_depth = 0`, `freq = 220`, `noise_level = 0.001`, `damping_zeta = 0.025`.
- **Expected**: a clean band-passed ring at 220 Hz. `[spectroscope~]` shows a single peak at 220 Hz with Q ≈ 33 (3 dB bandwidth ≈ 6.6 Hz).
- **Acceptance**: peak within 1 Hz of 220, no other peaks above −40 dB.

### Test 2 — Below threshold (q_depth = 0.05)

- `q_depth = 0.05`, `mod_rate_ratio = 2.0`, all else as Test 1.
- **Expected**: a dim noise-driven ring at 220 Hz. The pump is too weak to overcome damping; nothing builds.
- **Acceptance**: peak amplitude similar to Test 1 (within 6 dB).

### Test 3 — Threshold crossing (q_depth sweep 0 → 0.5)

- Sweep `q_depth` from 0.0 to 0.5 over 10 seconds. `mod_rate_ratio = 2.0`.
- **Expected**: silence-with-coloration at first, then a *crack* near `q_depth = 0.10` as the system enters the n=1 tongue. After the crack, ringing oscillation that builds to `tanh` saturation.
- **Acceptance**: monotonic increase in output RMS through the transition. The crack moment should be audible.

### Test 4 — Sub-harmonic spectrum check

- `q_depth = 0.30`, `mod_rate_ratio = 2.0`, all else as Test 1.
- **Expected**: strong fundamental at 220 Hz (the resonator's own frequency). Sidebands at `220 ± n · 440` (the modulation rate is 2·220 = 440 Hz) — though the carrier IS the resonator, the dominant pumping signature in the spectrum is the modulation harmonic at 440 Hz alongside the fundamental.
- **Acceptance**: fundamental peak at 220 Hz dominant; sidebands visible at 220 + 440 = 660, |220 − 440| = 220 (folds back), 220 + 880 = 1100, etc.

### Test 5 — Tongue boundary mapping

- Park `q_depth = 0.20`, `mod_rate_ratio = 2.0`. The system is in the tongue.
- Slowly detune `mod_rate_ratio` to 1.95, 1.90, 1.85.
- **Expected**: as mod_rate_ratio moves away from 2.0, the system exits the tongue at some boundary detuning. The output drops from saturated ringing to silence.
- **Acceptance**: detuning the ratio by ≥ 5% pushes the system out of the tongue, audible transition.

### Test 6 — Saturation check

- `q_depth = 0.80`, `mod_rate_ratio = 2.0`.
- **Expected**: heavy in-tongue ringing, fully saturated. Output spectrum has many odd harmonics from the `tanh`. No NaN, no Inf, no silent stuck states.
- **Acceptance**: continuous output, no glitches, RMS within 6 dB of `tanh(SAT_AMP)`.

### Test 7 — A/B reference match

- See Section 2.
- **Expected**: difference signal below −90 dB.
- **Acceptance**: cumulative RMS of difference signal below −80 dB over 4 seconds.

## 4. Common failure modes

If something looks wrong, the failure is almost always one of these:

- **Wrong integrator**. If you swap the symplectic Euler order (use `v_old` in the position update instead of `v_new`), every parameter point becomes unstable — even the `q=0` line drifts. Symptom: every preset is loud. Fix: confirm the order is `v_new = v + (...); x_new = x + v_new;` with `v_new` reused in the position update.
- **Wrong scaling**. If the per-sample `omega_0` calculation is wrong (e.g., not dividing by `samplerate`), the tongues end up at parameter values you can't reach with the slider ranges. Symptom: even `q_depth = 1.0` produces no threshold crack. Fix: confirm `omega_0 = 2*pi*freq/samplerate`, in radians per sample.
- **Wrong saturation / no saturation on state**. If only `out1` is saturated but `x` and `v` are unbounded, the in-tongue regime overflows after ~1 second. Symptom: `[scope~]` shows a clean rise that suddenly turns into NaN/silence. Fix: confirm the state soft-clip is present (`x = SAT_AMP * tanh(x_new * INV_SAT)`).
- **Mod ratio off by a factor of 2**. The canonical Mathieu pumping is at 2·ω₀, so `mod_rate_ratio = 2.0` should be the loudest. If 1.0 is loudest, the cosine is being evaluated at `cos(omega_mod * t)` where `omega_mod` is being doubled somewhere.
- **A/B difference >> −90 dB**. Most often: codebox is using its internal `random()` instead of the stored noise buffer. Less commonly: a sign convention swap on the damping term.

## 5. Stage 1 exercises (for the live session)

These are the exercises in the parent project entry, restated here for convenience:

1. **Make the tongue audible.** Park `mod_rate_ratio = 2.0`. Slowly raise `q_depth` from zero. Listen for the crack. Note the value. Then detune `mod_rate_ratio` slightly (e.g. 1.95) and repeat — the threshold q is higher. You have measured the tongue's width.
2. **Parametric stuck oscillation.** With `q_depth` above threshold, set `noise_level = 0` (kill the input). Does the ring persist? It should — the modulation alone is providing the energy.
3. **Sweep and listen.** Modulate `q_depth` with a slow LFO. The system breathes in and out of the tongue.
4. **Stack two resonators.** Run two `[rnbo~ mathieu_resonator]` instances in parallel at slightly different `freq`. With the same modulation source, the two thresholds are at different `q_depth` values. As an LFO sweep wakes them up sequentially, you have the entry point to Stage 2's Floquet Comb.
5. **Push to extremes.** What does `q_depth = 1.0` sound like? `mod_rate_ratio = 1.0` (the n=2 tongue)? Notice the timbres are different but recognizably part of the same family.

---

This Stage 1 instrument is the proof-of-concept for the Floquet project's central claim: **most of audio engineering quietly assumes LTI; releasing time-invariance opens a vast region of sound and behavior LTI cannot reach**. The Mathieu Resonator is the simplest playable instance. Stages 2–5 (Floquet Comb, Floquet Kernel, Floquet Engineering, Time Crystal Effect) deepen the claim into a full Loudon Live arc.

Cross-references:
- The full project entry: [[Floquet Time-Modulated Loops]]
- The math: [[Mathieu Equation]], [[Floquet Theory]], [[Parametric Resonance]]
- The cross-domain twin: [[Photonic Time Crystals]]
- The torus sibling: [[2D Torus Wavetable Synthesizer]]
