"""
fit_vowels.py - Area-function fitting for Tract Mirror.

Each vowel's area function is parameterized as

    A(x) = clip( exp( c_0 + sum_{m=1..M} c_m * cos(m * pi * x) ), A_MIN, A_MAX )

sampled at 64 control points x in [0, 1] (glottis -> lips). The cosine series is
a smooth, low-dimensional basis: optimizing the few coefficients c_m yields a
naturally smooth tube, and a smoothness penalty on the realized area curve keeps
it physical. Areas are constrained to [0.1, 12] cm^2.

The objective drives the tract transfer-function peaks toward Peterson-Barney
male formant targets. The 64-point physical area curve is the rate-INVARIANT
object; it is resampled onto N = round(fs*L/c) sections at each sample rate. We
FIT at fs = 44100 and then VERIFY the same 64-point curve also meets tolerance
at fs = 48000 with its own N.

Tolerance: F1, F2 within 5 %, F3 within 10 %.

Outputs vowels.json (consumed verbatim by the web GUI and the C++ engine).
"""

import json
import numpy as np
from scipy.optimize import minimize

import kl_reference as kl


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

CONTROL_POINTS = 64
A_MIN = 0.1     # cm^2
A_MAX = 12.0    # cm^2
N_COSINE = 18   # number of cosine basis terms (plus the DC term c_0)

# Peterson-Barney style male formant targets (Hz): F1, F2, F3.
FORMANT_TARGETS = {
    "a":     (730, 1090, 2440),
    "e":     (530, 1840, 2480),
    "i":     (270, 2290, 3010),
    "o":     (570,  840, 2410),
    "u":     (300,  870, 2240),
    "schwa": (500, 1500, 2500),
}

# Tolerances (fractional).
TOL = (0.05, 0.05, 0.10)   # F1, F2, F3

FS_FIT = 44100
FS_VERIFY = 48000

# Rough physiological starting shapes (glottis -> lips), as 8-point sketches in
# cm^2, later splined to 64 points. These are loosely Fant/Story-inspired and
# only need to put the optimizer in the right basin; the optimizer does the rest.
SEED_SHAPES = {
    # narrow front, wide back is the canonical low back /a/ (large pharynx,
    # constricted near lips is wrong -> /a/ has open mouth, narrow pharynx)
    "a":     [0.8, 0.8, 1.0, 1.5, 3.0, 6.0, 8.0, 9.0],
    "e":     [1.5, 1.2, 2.0, 3.0, 4.0, 3.0, 2.0, 3.0],
    "i":     [2.0, 3.0, 5.0, 6.0, 4.0, 1.0, 0.5, 1.5],
    "o":     [1.0, 1.0, 1.5, 4.0, 5.0, 2.0, 1.0, 0.8],
    "u":     [2.0, 3.0, 4.0, 5.0, 3.0, 1.0, 0.4, 0.6],
    "schwa": [3.0, 3.0, 3.0, 3.0, 3.0, 3.0, 3.0, 3.0],
}


# ---------------------------------------------------------------------------
# Parameterization
# ---------------------------------------------------------------------------

def cosine_basis(n_points=CONTROL_POINTS, n_cos=N_COSINE):
    """Return the (n_points x (n_cos+1)) cosine design matrix.
    Column 0 is the constant (DC); column m is cos(m*pi*x)."""
    x = np.linspace(0.0, 1.0, n_points)
    B = np.zeros((n_points, n_cos + 1))
    B[:, 0] = 1.0
    for m in range(1, n_cos + 1):
        B[:, m] = np.cos(m * np.pi * x)
    return B


_BASIS = cosine_basis()


def coeffs_to_area(coeffs, basis=_BASIS):
    """Map cosine coefficients -> clipped 64-point area function (cm^2)."""
    log_area = basis @ coeffs
    area = np.exp(log_area)
    return np.clip(area, A_MIN, A_MAX)


def area_to_coeffs(area, basis=_BASIS):
    """Least-squares fit of cosine coefficients to a given area curve (init)."""
    log_area = np.log(np.clip(area, A_MIN, A_MAX))
    coeffs, *_ = np.linalg.lstsq(basis, log_area, rcond=None)
    return coeffs


def seed_area(name):
    """Spline an 8-point seed shape to 64 points (log-domain interpolation)."""
    sketch = np.array(SEED_SHAPES[name], dtype=float)
    x_src = np.linspace(0.0, 1.0, len(sketch))
    x_dst = np.linspace(0.0, 1.0, CONTROL_POINTS)
    log = np.interp(x_dst, x_src, np.log(sketch))
    return np.exp(log)


# ---------------------------------------------------------------------------
# Objective
# ---------------------------------------------------------------------------

def measure_formants(area_cp, fs, n_formants=3):
    """Resample the 64-point area curve to N sections at this fs and measure
    the first n_formants tract poles."""
    N = kl.n_sections(fs)
    areas = kl.resample_area(area_cp, N)
    return kl.find_formants(areas, fs, n_formants=n_formants)


def objective(coeffs, targets, fs, smooth_weight=0.002):
    """Weighted squared fractional formant error + smoothness penalty.

    Formant error is fractional (so all three formants matter comparably) and
    weighted slightly toward F1/F2 (the perceptually and tolerance-tightest).
    The smoothness penalty acts on the realized log-area second difference,
    discouraging jagged tubes that would be physically implausible and would
    make the C++/GUI port look wrong.
    """
    area = coeffs_to_area(coeffs)
    fmts = measure_formants(area, fs)
    t = np.array(targets, dtype=float)
    if np.any(np.isnan(fmts)):
        # missing formant: large penalty, but smooth in coeffs via distance to
        # target band so the optimizer still gets gradient information
        err = 5.0
    else:
        frac = (fmts - t) / t
        weights = np.array([1.3, 1.2, 0.8])   # F1,F2 weighted up; F3 looser tol
        err = np.sum(weights * frac * frac)
    # smoothness on realized log-area
    log_area = np.log(area)
    d2 = np.diff(log_area, 2)
    smooth = smooth_weight * np.sum(d2 * d2)
    return err + smooth


def within_tolerance(fmts, targets, tol=TOL):
    """True if all three formants are within their fractional tolerances."""
    if np.any(np.isnan(fmts)):
        return False
    frac = np.abs((np.array(fmts) - np.array(targets)) / np.array(targets))
    return bool(np.all(frac <= np.array(tol)))


# ---------------------------------------------------------------------------
# Fit one vowel
# ---------------------------------------------------------------------------

def fit_vowel(name, targets, fs=FS_FIT, verbose=True, restarts=6):
    """Fit one vowel's 64-point area curve. Returns (area_cp, coeffs, fmts).

    Strategy: initialize from the physiological seed shape, then run
    Nelder-Mead (derivative-free; the formant measurement is piecewise-smooth
    but has the peak-picking nonsmoothness, so a simplex method is robust).
    Multiple restarts with small perturbations escape shallow local minima.
    """
    init_area = seed_area(name)
    base = area_to_coeffs(init_area)

    best = None
    best_err = np.inf
    rng = np.random.default_rng(hash(name) % (2**32))

    for r in range(restarts):
        x0 = base.copy()
        if r > 0:
            x0 = x0 + rng.standard_normal(len(x0)) * 0.15 * (1.0 + r * 0.1)
        res = minimize(objective, x0, args=(targets, fs),
                       method="Nelder-Mead",
                       options={"maxiter": 4000, "xatol": 1e-5, "fatol": 1e-7})
        fmts = measure_formants(coeffs_to_area(res.x), fs)
        err = res.fun
        ok = within_tolerance(fmts, targets)
        if verbose:
            print(f"  [{name}] restart {r}: err={err:.5f} "
                  f"fmts={np.round(fmts,0)} ok={ok}")
        if ok and (best is None or err < best_err):
            best = res.x
            best_err = err
        elif best is None and err < best_err:
            best = res.x
            best_err = err
        if ok and err < 0.002:
            break

    area = coeffs_to_area(best)
    fmts = measure_formants(area, fs)
    return area, best, fmts


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    print(f"Fitting vowels at fs={FS_FIT} (N={kl.n_sections(FS_FIT)}), "
          f"verifying at fs={FS_VERIFY} (N={kl.n_sections(FS_VERIFY)})")
    print(f"Tolerance: F1/F2 <= {TOL[0]*100:.0f}%, F3 <= {TOL[2]*100:.0f}%\n")

    results = {}
    all_ok_44 = True
    all_ok_48 = True

    for name, targets in FORMANT_TARGETS.items():
        print(f"Vowel /{name}/ targets={targets}")
        area, coeffs, fmts44 = fit_vowel(name, targets, fs=FS_FIT)
        fmts48 = measure_formants(area, FS_VERIFY)
        ok44 = within_tolerance(fmts44, targets)
        ok48 = within_tolerance(fmts48, targets)
        all_ok_44 = all_ok_44 and ok44
        all_ok_48 = all_ok_48 and ok48
        print(f"  -> 44.1k: {np.round(fmts44,0)} ok={ok44}")
        print(f"  -> 48.0k: {np.round(fmts48,0)} ok={ok48}\n")
        results[name] = {
            "area_cm2": [float(a) for a in area],
            "formant_targets_hz": [float(t) for t in targets],
            "formants_measured_44k_hz": [float(f) for f in fmts44],
            "formants_measured_48k_hz": [float(f) for f in fmts48],
        }

    payload = {
        "tract_length_m": kl.DEFAULT_TRACT_LENGTH_M,
        "speed_of_sound": kl.DEFAULT_SPEED_OF_SOUND,
        "control_points": CONTROL_POINTS,
        "glottal_reflection": kl.DEFAULT_GLOTTAL_REFLECTION,
        "lip_reflection": kl.DEFAULT_LIP_REFLECTION,
        "junction_loss": kl.DEFAULT_JUNCTION_LOSS,
        "vowels": results,
    }
    with open("vowels.json", "w") as f:
        json.dump(payload, f, indent=2)

    print("=" * 60)
    print("VERIFICATION GATE")
    print(f"  all vowels within tolerance @ 44.1k: {all_ok_44}")
    print(f"  all vowels within tolerance @ 48.0k: {all_ok_48}")
    print(f"  wrote vowels.json")
    if not (all_ok_44 and all_ok_48):
        print("  GATE NOT GREEN - iterate.")
    return all_ok_44 and all_ok_48


if __name__ == "__main__":
    ok = main()
    raise SystemExit(0 if ok else 1)
