"""
mathieu_core.py — Shared numerical utilities for the Floquet project.

Used by all media-NN scripts. Centralizes:
  - The symplectic-Euler Mathieu integrator (the same scheme the Stage 1
    codebox~ uses, so Python and codebox are integrating identical math).
  - The monodromy-matrix construction and stability classification.
  - The Strutt-diagram grid sampler.
  - The Floquet project palette as matplotlib hex codes, so every static
    PNG carries the same colors as the interactive HTML pages.

The numerical scheme is symplectic Euler for two reasons. First, a
symplectic integrator preserves the Hamiltonian structure of the
unmodulated harmonic oscillator, so the q=0 case is a clean sinusoid
rather than a slowly-spiraling drift. Second, RK4 introduces effective
damping that smears the marginal-stability boundary — the very feature
we are trying to make visible.
"""

import numpy as np

# Floquet project palette — match the HTML CSS variables exactly.
PALETTE = {
    "bg":         "#0a0a0f",
    "bg_card":    "#12121a",
    "bg_code":    "#1a1a28",
    "border":     "#2a2a3a",
    "text":       "#c8c8d8",
    "text_dim":   "#7a7a8e",
    "text_bright":"#e8e8f0",
    # Stability colors — green stable, orange-red unstable, yellow marginal.
    "stable":     "#4aff8b",
    "unstable":   "#ff6b4a",
    "marginal":   "#ffe44a",
    # Auxiliary accents.
    "multiplier": "#4aadff",
    "mod":        "#a64aff",
}


def mathieu_step(x, v, a, q, t, dt, mod_phase=None):
    """
    One symplectic-Euler step of the dimensionless Mathieu equation:
        x'' + (a - 2 q cos(2 t)) x = 0
    Returns updated (x, v). The optional `mod_phase` lets the caller pass
    in a precomputed phase rather than recomputing 2*t every call — useful
    for the codebox~ analog where the modulation phase is its own state.
    """
    if mod_phase is None:
        mod_phase = 2.0 * t
    coeff = a - 2.0 * q * np.cos(mod_phase)
    v_new = v + dt * (-coeff * x)
    x_new = x + dt * v_new
    return x_new, v_new


def integrate_mathieu(a, q, x0=1.0, v0=0.0, n_periods=50,
                      steps_per_period=200, mod_period=np.pi):
    """
    Integrate the dimensionless Mathieu equation for `n_periods` of the
    modulation. Returns arrays of (t, x, v) sampled at every step.

    The dimensionless equation has modulation period pi (because the
    convention is cos(2t), period 2pi/2 = pi).
    """
    dt = mod_period / steps_per_period
    n_steps = n_periods * steps_per_period
    t = np.zeros(n_steps + 1)
    x = np.zeros(n_steps + 1)
    v = np.zeros(n_steps + 1)
    x[0], v[0] = x0, v0
    for k in range(n_steps):
        t[k+1] = t[k] + dt
        x[k+1], v[k+1] = mathieu_step(x[k], v[k], a, q, t[k], dt)
    return t, x, v


def monodromy_matrix(a, q, steps_per_period=2000, mod_period=np.pi):
    """
    Build the 2x2 monodromy matrix M such that [x(T), v(T)]^T = M [x(0),v(0)]^T.
    Construction: integrate over one period twice — first from (1, 0),
    then from (0, 1) — and stack the resulting end states as columns.
    """
    dt = mod_period / steps_per_period
    M = np.zeros((2, 2))
    for col, (x0, v0) in enumerate([(1.0, 0.0), (0.0, 1.0)]):
        x, v, t = x0, v0, 0.0
        for _ in range(steps_per_period):
            x, v = mathieu_step(x, v, a, q, t, dt)
            t += dt
        M[0, col] = x
        M[1, col] = v
    return M


def characteristic_multipliers(a, q, **kwargs):
    """Eigenvalues of the monodromy matrix — the characteristic multipliers."""
    M = monodromy_matrix(a, q, **kwargs)
    return np.linalg.eigvals(M)


def stability_amplitude(a, q, n_periods=30, steps_per_period=400):
    """
    Heuristic stability metric used to render the Strutt diagram.
    Integrates from a small initial condition and returns the log-ratio
    of final-period peak amplitude to initial amplitude. Positive values
    mean amplitude grew (unstable); near-zero values mean it stayed
    bounded (stable).
    """
    t, x, v = integrate_mathieu(a, q, x0=1.0, v0=0.0,
                                n_periods=n_periods,
                                steps_per_period=steps_per_period)
    # Compare amplitude in the last period to the first period.
    nspp = steps_per_period
    first_amp = np.max(np.abs(x[:nspp])) + 1e-30
    last_amp = np.max(np.abs(x[-nspp:])) + 1e-30
    return np.log(last_amp / first_amp) / n_periods


def strutt_grid(a_range=(-2.0, 6.0), q_range=(0.0, 2.0),
                a_steps=160, q_steps=120, **stab_kwargs):
    """Compute the Strutt diagram on a regular grid."""
    a_vals = np.linspace(a_range[0], a_range[1], a_steps)
    q_vals = np.linspace(q_range[0], q_range[1], q_steps)
    grid = np.zeros((q_steps, a_steps))
    for j, q in enumerate(q_vals):
        for i, a in enumerate(a_vals):
            grid[j, i] = stability_amplitude(a, q, **stab_kwargs)
    return a_vals, q_vals, grid


def audio_mathieu(freq_hz, q_depth, mod_rate_ratio=2.0,
                  duration_s=5.0, sample_rate=48000,
                  noise_level=1e-3, seed=1, sat_amp=8.0,
                  damping_zeta=0.015):
    """
    Audio-rate Mathieu resonator. This mirrors what the Stage 1 codebox~
    does sample-by-sample. Returns a float32 array suitable for a WAV.

    The mapping from "Mathieu dimensionless" to "audio sample-rate" is:
      omega0 = 2*pi*freq_hz / sample_rate       (per-sample angular freq)
      a      = omega0**2                        (so a sets the natural Hz)
      q      = q_depth * a                      (depth scales with a)
      omega_mod = mod_rate_ratio * omega0       (so ratio=2.0 is canonical)

    State is soft-clipped via tanh(x / sat_amp) * sat_amp every sample
    so in-tongue growth saturates at sat_amp instead of overflowing
    floating point. The output is tanh(x) which lives in [-1, +1]. The
    saturator is the same one named in the Stage 1 build manifest:
    in-tongue exponential growth becomes a finite, designed timbre.

    A small linear damping (`damping_zeta`) is included so the
    threshold for parametric instability sits at a finite, audible
    q rather than at q=0. Without damping the n=1 tongue covers all
    q > 0 at a = omega0^2, and the "below threshold / above threshold"
    pedagogical contrast does not exist. With zeta ~ 0.015 (Q ~ 33),
    threshold sits near q_depth ~ 0.10 for canonical 2:1 pumping.
    """
    rng = np.random.default_rng(seed)
    n = int(duration_s * sample_rate)
    omega0 = 2.0 * np.pi * freq_hz / sample_rate
    a = omega0 ** 2
    q = q_depth * a
    omega_mod = mod_rate_ratio * omega0

    delta = 2.0 * damping_zeta * omega0  # damping per sample
    x = 0.0
    v = 0.0
    phi = 0.0
    out = np.zeros(n, dtype=np.float32)
    inv_sat = 1.0 / sat_amp
    for i in range(n):
        phi += omega_mod
        coeff = a - 2.0 * q * np.cos(phi)
        noise = noise_level * rng.standard_normal()
        # Symplectic Euler with the dt=1 convention (omega0 is in
        # rad/sample so the per-step coefficient is already
        # appropriately small). Damping subtracts proportionally
        # to v before the position update.
        v = v + (-coeff * x - delta * v + noise)
        x = x + v
        # Soft-clip the state itself so the in-tongue regime stays
        # finite instead of overflowing float32 over many seconds.
        x = sat_amp * np.tanh(x * inv_sat)
        v = sat_amp * np.tanh(v * inv_sat)
        out[i] = np.tanh(x)
    return out


def normalize_peak(audio, peak_dbfs=-3.0):
    """Peak-normalize an audio buffer to the given dBFS."""
    peak = np.max(np.abs(audio)) + 1e-30
    target = 10.0 ** (peak_dbfs / 20.0)
    return audio * (target / peak)


def apply_dark_style(plt):
    """Apply the project's dark theme to a matplotlib pyplot session."""
    plt.rcParams.update({
        "figure.facecolor": PALETTE["bg"],
        "axes.facecolor":   PALETTE["bg_card"],
        "axes.edgecolor":   PALETTE["border"],
        "axes.labelcolor":  PALETTE["text_bright"],
        "axes.titlecolor":  PALETTE["text_bright"],
        "xtick.color":      PALETTE["text"],
        "ytick.color":      PALETTE["text"],
        "text.color":       PALETTE["text_bright"],
        "grid.color":       PALETTE["border"],
        "grid.alpha":       0.4,
        "savefig.facecolor": PALETTE["bg"],
        "savefig.edgecolor": PALETTE["bg"],
        "font.family":      "serif",
        "font.serif":       ["Source Serif 4", "Source Serif Pro", "Georgia",
                             "Times New Roman", "DejaVu Serif"],
    })
