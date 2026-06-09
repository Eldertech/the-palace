#!/usr/bin/env python3
"""
fit_portamento.py — recover the second-order physical model from a real (or
synthetic) pitch glide.

The home entry models pitch as a damped harmonic oscillator settling toward a
target frequency:

    d2f/dt2 + 2*zeta*wn*(df/dt) + wn^2*(f - f_target) = 0

This tool runs that backward. Given an audio file containing one portamento,
it (1) tracks the instantaneous pitch f(t) by autocorrelation, (2) fits the
analytic step response of the second-order system to that trajectory, and
(3) reports the recovered damping ratio zeta and natural frequency wn, the
regime (over / critical / under), and the fit residual.

Why this is the bridge to real instruments: the synthetic ear set is labelled
with the EXACT zeta we rendered it at. Running the fitter on those files and
recovering those same zetas proves the measurement works. Then the identical
pipeline, pointed at a real cello or voice recording, tells us where the model
fits and where it diverges — which is the open question the project's forward
vector cares about, and the thing Loudon said he's "very excited to see."

It also speaks to Loudon's note on portamento-steward-011: he could not hear
the difference between underdamped and critically damped. This tool does not
need ears. It reads the difference straight off the trajectory geometry — an
overshoot above target is underdamped, full stop, even when the overshoot is
too brief or too small for the ear to catch.

Dependencies: numpy, scipy (pure wheels). No system libraries.

Usage:
    python3 fit_portamento.py path/to/glide.wav
    python3 fit_portamento.py --validate            # run on the curated ear set
    python3 fit_portamento.py --validate --plot out.png
"""

import argparse
import json
import sys
import wave
from pathlib import Path

import numpy as np

# scipy is used only for the final local refine; the coarse grid below already
# gets within a few percent, so the tool degrades gracefully without it.
try:
    from scipy.optimize import least_squares
    HAVE_SCIPY = True
except Exception:
    HAVE_SCIPY = False


# ---------------------------------------------------------------------------
# 1. Pitch tracking — autocorrelation per frame.
# ---------------------------------------------------------------------------

def read_wav_mono(path):
    with wave.open(str(path), "rb") as w:
        sr = w.getframerate()
        n = w.getnframes()
        ch = w.getnchannels()
        sw = w.getsampwidth()
        raw = w.readframes(n)
    if sw == 2:
        data = np.frombuffer(raw, dtype="<i2").astype(np.float64) / 32768.0
    elif sw == 4:
        data = np.frombuffer(raw, dtype="<i4").astype(np.float64) / 2147483648.0
    elif sw == 1:
        data = (np.frombuffer(raw, dtype="u1").astype(np.float64) - 128.0) / 128.0
    else:
        raise ValueError(f"unsupported sample width {sw}")
    if ch > 1:
        data = data.reshape(-1, ch).mean(axis=1)
    return data, sr


def track_pitch(signal, sr, frame_s=0.040, hop_s=0.005, fmin=60.0, fmax=1200.0):
    """Per-frame autocorrelation pitch estimate. Returns (times, freqs_hz)."""
    frame = int(frame_s * sr)
    hop = int(hop_s * sr)
    win = np.hanning(frame)
    lag_min = int(sr / fmax)
    lag_max = int(sr / fmin)
    times, freqs = [], []
    for start in range(0, len(signal) - frame, hop):
        seg = signal[start:start + frame] * win
        if np.sqrt(np.mean(seg * seg)) < 1e-4:
            continue  # silence
        seg = seg - seg.mean()
        ac = np.correlate(seg, seg, mode="full")[frame - 1:]
        ac = ac / (ac[0] + 1e-12)
        search = ac[lag_min:lag_max]
        if len(search) == 0:
            continue
        peak = np.argmax(search) + lag_min
        # parabolic interpolation around the integer-lag peak for sub-bin pitch
        if 0 < peak < len(ac) - 1:
            a, b, c = ac[peak - 1], ac[peak], ac[peak + 1]
            denom = (a - 2 * b + c)
            shift = 0.5 * (a - c) / denom if abs(denom) > 1e-9 else 0.0
            peak = peak + shift
        f = sr / peak
        times.append((start + frame / 2) / sr)
        freqs.append(f)
    return np.asarray(times), np.asarray(freqs)


# ---------------------------------------------------------------------------
# 2. Second-order step response (the model from the home entry, forward).
# ---------------------------------------------------------------------------

def step_response(t, f0, f_target, zeta, wn):
    """f(t) for the damped oscillator settling from f0 to f_target,
    starting at rest (df/dt = 0 at t=0). Covers all three regimes."""
    dy = (f0 - f_target)
    if zeta < 1.0:                      # underdamped — overshoot + ring-back
        wd = wn * np.sqrt(1 - zeta**2)
        env = np.exp(-zeta * wn * t)
        return f_target + dy * env * (np.cos(wd * t) + (zeta / np.sqrt(1 - zeta**2)) * np.sin(wd * t))
    elif abs(zeta - 1.0) < 1e-6:        # critically damped — fastest, no overshoot
        return f_target + dy * (1 + wn * t) * np.exp(-wn * t)
    else:                               # overdamped — two real exponentials
        s = wn * np.sqrt(zeta**2 - 1)
        r1 = -zeta * wn + s
        r2 = -zeta * wn - s
        c1 = dy * (-r2) / (r1 - r2)
        c2 = dy * (r1) / (r1 - r2)
        return f_target + c1 * np.exp(r1 * t) + c2 * np.exp(r2 * t)


# ---------------------------------------------------------------------------
# 3. Fit the model to a tracked trajectory.
# ---------------------------------------------------------------------------

def find_onset(t, f, f0, f_target):
    """The renders hold f0 for a beat before the glide begins. The step-response
    model assumes the glide starts at t=0 with df/dt=0, so a leading plateau
    confounds the fit (it gets absorbed as sluggish overdamping). Trim to the
    first frame that has departed f0 by 2% of the total interval."""
    span = abs(f_target - f0)
    if span < 1e-6:
        return 0
    thresh = 0.02 * span
    departed = np.where(np.abs(f - f0) > thresh)[0]
    if len(departed) == 0:
        return 0
    # back up one frame so the fit sees the launch from rest
    return max(0, int(departed[0]) - 1)


def fit_trajectory(t, f):
    """Recover (zeta, wn, f0, f_target, residual_hz). t is shifted to start at 0."""
    f0_pre = float(np.median(f[: max(1, len(f) // 10)]))
    ftar_pre = float(np.median(f[-max(1, len(f) // 10):]))
    onset = find_onset(t, f, f0_pre, ftar_pre)
    t = t[onset:]
    f = f[onset:]
    t = t - t[0]
    f0_guess = f0_pre
    ftar_guess = ftar_pre

    def model(zeta, wn, f0, ftar):
        return step_response(t, f0, ftar, max(zeta, 1e-3), max(wn, 1e-3))

    def rms(zeta, wn, f0, ftar):
        return float(np.sqrt(np.mean((model(zeta, wn, f0, ftar) - f) ** 2)))

    # Coarse grid first — robust to local minima, no derivative needed.
    best = None
    for zeta in np.concatenate([np.linspace(0.1, 0.95, 18), np.linspace(1.0, 2.5, 16)]):
        for wn in np.linspace(3.0, 45.0, 43):
            r = rms(zeta, wn, f0_guess, ftar_guess)
            if best is None or r < best[0]:
                best = (r, zeta, wn)
    _, zeta0, wn0 = best

    if HAVE_SCIPY:
        def resid(p):
            return model(p[0], p[1], p[2], p[3]) - f
        sol = least_squares(
            resid, [zeta0, wn0, f0_guess, ftar_guess],
            bounds=([0.02, 1.0, f0_guess * 0.5, ftar_guess * 0.5],
                    [3.0, 60.0, f0_guess * 1.5, ftar_guess * 1.5]),
            max_nfev=4000,
        )
        zeta, wn, f0, ftar = sol.x
        residual = float(np.sqrt(np.mean(sol.fun ** 2)))
    else:
        zeta, wn, f0, ftar = zeta0, wn0, f0_guess, ftar_guess
        residual = rms(zeta, wn, f0, ftar)

    return dict(zeta=float(zeta), wn=float(wn), f0=float(f0),
                f_target=float(ftar), residual_hz=residual)


def classify(zeta):
    if zeta < 0.92:
        return "underdamped"
    if zeta <= 1.08:
        return "critically_damped"
    return "overdamped"


def measured_overshoot(t, f, f_target):
    """Peak fractional overshoot beyond target — the geometric signature the
    ear may miss but the trajectory cannot hide. Direction-aware."""
    if len(f) == 0:
        return 0.0
    f0 = f[0]
    if f_target >= f0:               # rising glide — overshoot is above target
        peak = f.max()
        return max(0.0, (peak - f_target) / max(f_target - f0, 1e-6))
    else:                            # falling glide — overshoot is below target
        trough = f.min()
        return max(0.0, (f_target - trough) / max(f0 - f_target, 1e-6))


# ---------------------------------------------------------------------------
# Drivers.
# ---------------------------------------------------------------------------

def fit_one(path, verbose=True):
    sig, sr = read_wav_mono(path)
    t, f = track_pitch(sig, sr)
    if len(f) < 8:
        raise RuntimeError(f"too few pitch frames in {path} (got {len(f)})")
    res = fit_trajectory(t, f)
    res["regime_fit"] = classify(res["zeta"])
    res["overshoot_measured"] = measured_overshoot(t - t[0], f, res["f_target"])
    if verbose:
        print(f"  fit: zeta={res['zeta']:.3f}  wn={res['wn']:.2f} rad/s  "
              f"regime={res['regime_fit']}  overshoot={res['overshoot_measured']*100:.1f}%  "
              f"residual={res['residual_hz']:.2f} Hz")
    return res, (t, f)


def validate(manifest_path, plot_path=None):
    """Run the fitter on the labelled synthetic set; compare recovered zeta to
    the ground-truth zeta we rendered each example at. This is the proof the
    measurement works before we trust it on real recordings."""
    man = json.loads(Path(manifest_path).read_text())
    base = Path(manifest_path).parent
    rows = []
    trajectories = []
    print(f"Validating fitter against {len(man['examples'])} labelled examples\n")
    for ex in man["examples"]:
        wav = base / ex["wav"]
        if not wav.exists():
            print(f"  [skip] {ex['slug']} — wav missing")
            continue
        print(f"{ex['slug']}  (true zeta={ex['zeta']}, regime={ex['regime']})")
        res, (t, f) = fit_one(wav)
        zeta_err = res["zeta"] - ex["zeta"]
        regime_ok = res["regime_fit"] == ex["regime"]
        rows.append(dict(slug=ex["slug"], true_zeta=ex["zeta"], fit_zeta=round(res["zeta"], 3),
                         zeta_err=round(zeta_err, 3), true_regime=ex["regime"],
                         fit_regime=res["regime_fit"], regime_correct=regime_ok,
                         overshoot_pct=round(res["overshoot_measured"] * 100, 1),
                         residual_hz=round(res["residual_hz"], 2)))
        trajectories.append((ex, t, f, res))
        print(f"    -> regime {'MATCH' if regime_ok else 'MISS '}   zeta error {zeta_err:+.3f}\n")

    n = len(rows)
    correct = sum(r["regime_correct"] for r in rows)
    mean_abs_err = np.mean([abs(r["zeta_err"]) for r in rows]) if rows else float("nan")
    print("=" * 64)
    print(f"Regime classification: {correct}/{n} correct")
    print(f"Mean |zeta error|:     {mean_abs_err:.3f}")
    print("=" * 64)

    summary = dict(n=n, regime_correct=correct,
                   mean_abs_zeta_err=round(float(mean_abs_err), 4), rows=rows)
    out_json = base.parent / "model-fitter" / "validation_results.json"
    out_json.parent.mkdir(exist_ok=True)
    out_json.write_text(json.dumps(summary, indent=2))
    print(f"\nWrote {out_json}")

    if plot_path:
        make_plot(trajectories, plot_path)
        print(f"Wrote {plot_path}")
    return summary


def make_plot(trajectories, plot_path):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    n = len(trajectories)
    cols = 4
    rows = (n + cols - 1) // cols
    fig, axes = plt.subplots(rows, cols, figsize=(15, 3.2 * rows))
    fig.patch.set_facecolor("#1a1a1a")
    axes = np.atleast_1d(axes).ravel()
    color = {"overdamped": "#d8a657", "critically_damped": "#7daea3", "underdamped": "#d3869b"}
    for ax, (ex, t, f, res) in zip(axes, trajectories):
        ax.set_facecolor("#222222")
        t0 = t - t[0]
        ax.plot(t0, f, lw=1.6, color=color.get(ex["regime"], "#cccccc"),
                label="tracked f(t)")
        fit = step_response(t0, res["f0"], res["f_target"], res["zeta"], res["wn"])
        ax.plot(t0, fit, "--", lw=1.2, color="#ffffff", alpha=0.8, label="model fit")
        ax.axhline(ex["f_target_hz"], color="#888888", lw=0.7, ls=":")
        ok = "MATCH" if res["regime_fit"] == ex["regime"] else "MISS"
        ax.set_title(f"{ex['slug']}\ntrue z={ex['zeta']}  fit z={res['zeta']:.2f}  [{ok}]",
                     color="#e8e8e8", fontsize=8.5)
        ax.tick_params(colors="#999999", labelsize=6)
        for s in ax.spines.values():
            s.set_color("#444444")
    for ax in axes[n:]:
        ax.set_visible(False)
    fig.suptitle("Second-order model fit vs. tracked pitch trajectory  (white dashed = recovered model)",
                 color="#f0f0f0", fontsize=12)
    fig.tight_layout(rect=[0, 0, 1, 0.97])
    fig.savefig(plot_path, dpi=110, facecolor=fig.get_facecolor())


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("wav", nargs="?", help="audio file containing one portamento")
    ap.add_argument("--validate", action="store_true",
                    help="run against the curated ear set manifest")
    ap.add_argument("--manifest",
                    default=str(Path(__file__).parent.parent / "curated-ear-set" / "manifest.json"))
    ap.add_argument("--plot", help="write a comparison plot PNG (validate mode)")
    args = ap.parse_args()

    if args.validate:
        validate(args.manifest, args.plot)
    elif args.wav:
        print(f"Fitting {args.wav}")
        fit_one(args.wav)
    else:
        ap.print_help()
        sys.exit(1)
