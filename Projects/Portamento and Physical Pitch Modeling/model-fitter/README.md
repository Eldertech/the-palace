# model-fitter — recover ζ and ωₙ from a real pitch glide

The second-order model run **backward**. Given an audio file containing one
portamento, this tool tracks the instantaneous pitch f(t), fits the analytic
step response of the damped oscillator, and reports the recovered damping
ratio ζ, natural frequency ωₙ, the regime, and the fit residual.

This is the bridge from the synthetic ear set to real instruments — the open
question in the project's forward vector ("how well does the model predict
actual portamento trajectories?") becomes a measurement instead of a hope.

## Files

- `fit_portamento.py` — the tool. numpy + scipy, no system libraries.
- `validation_results.json` — fit results on the 12 labelled synthetic examples.
- `fit_validation.png` — tracked pitch (color) vs. recovered model (white dashed),
  one panel per example.

## Run it

```bash
# Validate against the labelled set (proof the measurement works):
python3 fit_portamento.py --validate --plot fit_validation.png

# Fit any single recording (this is the real-instrument path):
python3 fit_portamento.py path/to/cello-glide.wav
```

## Validation result (the proof)

Run on the 12-example curated ear set, where every file's true ζ is known
because we rendered it:

- **Regime classification: 12 / 12 correct.**
- **Mean |ζ error|: 0.120.**
- Smooth (over/critical) cases fit to **sub-Hz residual**.

The one honest caveat: for ζ well above 1 (deep overdamping) the trajectory
shape is nearly insensitive to the exact ζ — the slow exponential dominates —
so ζ is only weakly determined there (e.g. true 2.0 → recovered 2.5) even
though the residual stays tiny. The *regime* is never in doubt; the precise ζ
is, by the physics of the inverse problem, not the tool.

## The point about hearing vs. measuring

Loudon's note on the synthetic deck: *"I found it impossible to tell the
audible difference between underdamped and critically damped."* The fitter does
not listen. It reads the difference off the trajectory geometry. The
`overshoot_measured` column is the tell:

| regime | overshoot beyond target |
|---|---|
| critically damped | **0.0%** (every case) |
| underdamped | **37 – 114%** |

An overshoot above target is underdamped, full stop — even when the overshoot
is too brief or too small for the ear to catch. The number sees what the ear
misses.

## The onset lesson (why the first pass scored 4/12)

The renders hold f0 for a beat before the glide begins. The step-response model
assumes the glide launches at t=0 from rest, so a leading plateau gets absorbed
as sluggish overdamping and dragged every fit toward ζ≈0.6–0.8. Detecting the
glide onset (first 2% departure from f0) and fitting from there took the score
from 4/12 to 12/12. Any real recording needs the same onset trim — it is built
in.
