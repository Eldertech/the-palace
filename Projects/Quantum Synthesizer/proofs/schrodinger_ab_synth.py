#!/usr/bin/env python3
"""
Schrodinger A/B Synthesizer — first audio proof
================================================
The claim of [[Quantum Synthesizer]]: the time-independent Schrodinger
equation IS a synthesis engine. The shape of the potential well decides
the SPACING of the energy levels, and the energy levels ARE the partials.

This script proves it with the ear, not the page. It solves the 1D
Schrodinger equation for two wells:

  A) PARABOLIC well   V(x) = 1/2 k x^2
       -> equally spaced energy levels  E_n = (n + 1/2)
       -> partials in the harmonic series 1 : 2 : 3 : ...
       -> a CLEAN PITCHED TONE.

  B) QUARTIC-BENT well V(x) = 1/2 k x^2 + lambda x^4
       -> the upper levels stretch apart (the well gets steeper than
          parabolic as you climb) -> level spacing grows with n
       -> stretched, inharmonic partials
       -> a BELL / struck-metal TONE.

Same solver, same resynthesis, only the potential changes between A and B.
That is the whole argument: timbre is geometry of confinement.

No scipy needed: the Hamiltonian is a symmetric tridiagonal matrix,
diagonalized with numpy.linalg.eigh; WAV written with the stdlib wave module.
"""
import numpy as np
import wave, struct, os

SR        = 44100
DUR       = 4.0
BASE_FREQ = 196.0           # G3 — the fundamental we pin the ground-mode gap to
N_PARTIALS = 12             # how many energy gaps we sonify
OUTDIR    = os.path.dirname(os.path.abspath(__file__))

# ---- the eigensolver: finite-difference 1D Schrodinger -----------------
def solve(potential, n_grid=900, x_max=8.0):
    """Return sorted energy eigenvalues for V(x) on [-x_max, x_max].
    Units: hbar = m = 1. H = -1/2 d2/dx2 + V(x)."""
    x = np.linspace(-x_max, x_max, n_grid)
    dx = x[1] - x[0]
    V = potential(x)
    # kinetic term: -1/2 * second-difference -> tridiagonal
    main = 1.0 / dx**2 + V          # diagonal
    off  = -0.5 / dx**2 * np.ones(n_grid - 1)  # off-diagonal
    H = np.diag(main) + np.diag(off, 1) + np.diag(off, -1)
    E = np.linalg.eigvalsh(H)       # ascending, symmetric solver
    return np.sort(E)

# ---- the two wells -----------------------------------------------------
def parabolic(x):
    return 0.5 * x**2

def quartic_bent(x):
    return 0.5 * x**2 + 0.10 * x**4   # lambda = 0.10 bends the upper wall up

# ---- energy levels -> partial-frequency ratios -------------------------
def partials_from_energy(E, n):
    E = E[:n+1]
    gaps = np.diff(E)               # level spacings E_{k+1}-E_k
    # cumulative gaps from ground = partial positions; first gap = fundamental
    cum = np.cumsum(gaps)
    ratios = cum / cum[0]           # normalize so first partial = 1.0
    return ratios

# ---- additive resynthesis ---------------------------------------------
def render(ratios, base_freq, decay_high_faster=True):
    t = np.linspace(0, DUR, int(SR*DUR), endpoint=False)
    sig = np.zeros_like(t)
    for k, r in enumerate(ratios):
        f = base_freq * r
        if f > 0.45*SR:             # below Nyquist
            continue
        # higher partials quieter and decaying faster — physical de-excitation
        amp = 1.0 / (k + 1)**0.9
        tau = (0.9 if not decay_high_faster else 0.9 / (1 + 0.6*k))
        env = np.exp(-t / tau)
        sig += amp * env * np.sin(2*np.pi*f*t)
    # soft attack
    atk = int(0.005*SR)
    sig[:atk] *= np.linspace(0, 1, atk)
    sig /= (np.max(np.abs(sig)) + 1e-9)
    return (sig * 0.92)

def write_wav(path, mono):
    data = (np.clip(mono, -1, 1) * 32767).astype(np.int16)
    with wave.open(path, 'w') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(data.tobytes())

def write_ab(path, a, b, gap=0.5):
    silence = np.zeros(int(SR*gap))
    both = np.concatenate([a, silence, b])
    both /= (np.max(np.abs(both)) + 1e-9)
    write_wav(path, both * 0.92)

if __name__ == "__main__":
    Ea = solve(parabolic)
    Eb = solve(quartic_bent)
    ra = partials_from_energy(Ea, N_PARTIALS)
    rb = partials_from_energy(Eb, N_PARTIALS)

    print("PARABOLIC (harmonic) partial ratios:")
    print("  " + "  ".join(f"{x:.3f}" for x in ra))
    print("QUARTIC-BENT (anharmonic) partial ratios:")
    print("  " + "  ".join(f"{x:.3f}" for x in rb))

    a = render(ra, BASE_FREQ)
    b = render(rb, BASE_FREQ)
    write_wav(os.path.join(OUTDIR, "parabolic-harmonic-clean-tone.wav"), a)
    write_wav(os.path.join(OUTDIR, "quartic-bent-anharmonic-bell.wav"), b)
    write_ab(os.path.join(OUTDIR, "schrodinger-AB-harmonic-then-anharmonic.wav"), a, b)
    print("Wrote 3 WAVs to", OUTDIR)
