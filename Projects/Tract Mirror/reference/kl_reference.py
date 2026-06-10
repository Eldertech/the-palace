"""
kl_reference.py - Validated DSP reference for "Tract Mirror".

This module is the single source of truth for the later C++ port and the
three.js GUI. Correctness and explicit documentation of conventions are valued
over elegance. Read the SIGN CONVENTIONS block before touching the tract loop.

The thesis of Tract Mirror is that two structures are the same object read from
opposite ends:

  * The LPC lattice filter (signal processing). A ladder of reflection
    coefficients k_i that, fed an excitation, synthesizes an all-pole spectrum.
  * The Kelly-Lochbaum cylindrical-tube digital waveguide (physical acoustics).
    A ladder of acoustic-tube sections with scattering junctions whose
    reflection coefficients are k_i = (A_i - A_{i+1}) / (A_i + A_{i+1}).

The same ladder of k_i is BOTH a lattice filter and a tube. The
Levinson/step-up recursion that turns the k_i ladder into direct-form all-pole
coefficients a_i is the algebraic statement of that identity:
    lattice (reflection coefficients) <==> tube (area ratios) <==> all-pole a_i.
See `step_up()` and `tract_transfer_function()`.

Contents:
  - Glottal source: Rosenberg-style pulse (open quotient + tension/tilt) plus an
    aspiration-noise path, mixed by a `breath` parameter. Both excite one tract.
  - KellyLochbaumTract: the bidirectional two-rail waveguide.
  - reflection_coeffs_from_area / area_from..., step_up (Levinson), and
    tract_transfer_function (the mirror, computed via scipy.freqz).

Author: Tract Mirror reference build, 2026-06.
"""

import numpy as np
from scipy.signal import freqz


# ---------------------------------------------------------------------------
# Physical constants and defaults
# ---------------------------------------------------------------------------

DEFAULT_TRACT_LENGTH_M = 0.171   # meters; ~half-wavelength tube for a male tract
DEFAULT_SPEED_OF_SOUND = 343.0   # m/s, dry air ~20 C
DEFAULT_CONTROL_POINTS = 64      # area function is sampled at this many points

# End reflections and per-junction loss. These are the canonical tunables and
# are echoed into vowels.json so the C++ engine uses identical numbers.
DEFAULT_GLOTTAL_REFLECTION = 0.97   # glottis nearly closed -> near +1 reflection
DEFAULT_LIP_REFLECTION = -0.9       # lips open -> near -1 reflection
DEFAULT_JUNCTION_LOSS = 0.996       # per-junction multiplicative loss (stability)


def n_sections(fs, length_m=DEFAULT_TRACT_LENGTH_M, c=DEFAULT_SPEED_OF_SOUND):
    """Number of one-sample tube sections at this sample rate.

    Each section is exactly one sample long, so the wave takes one sample to
    cross it. N = round(fs * L / c). N is rate-dependent; the 64-point physical
    area curve is the rate-INVARIANT object and is resampled onto N sections.
    """
    return int(round(fs * length_m / c))


# ---------------------------------------------------------------------------
# Area function <-> reflection coefficients
# ---------------------------------------------------------------------------

def reflection_coeffs_from_area(areas):
    """Junction reflection coefficients from an area function.

    Given N section areas A_0..A_{N-1} (glottis -> lips), there are N-1 interior
    junctions. The reflection coefficient seen by a wave crossing junction i
    (from section i into section i+1) is:

        k_i = (A_i - A_{i+1}) / (A_i + A_{i+1})

    A wave entering a NARROWER tube (A_{i+1} < A_i) sees k_i > 0; entering a
    WIDER tube sees k_i < 0. This is the standard acoustic-tube convention and
    matches the LPC reflection-coefficient sign used by `step_up`. Returns N-1
    coefficients, each in (-1, 1) for positive areas.
    """
    areas = np.asarray(areas, dtype=float)
    a_i = areas[:-1]
    a_ip1 = areas[1:]
    return (a_i - a_ip1) / (a_i + a_ip1)


def area_from_reflection_coeffs(ks, a0=1.0):
    """Inverse of reflection_coeffs_from_area, up to overall scale.

    From k_i = (A_i - A_{i+1})/(A_i + A_{i+1}) we get the area ratio
        A_{i+1}/A_i = (1 - k_i)/(1 + k_i).
    Useful for sanity checks. The absolute scale (a0) is arbitrary because the
    reflection coefficients depend only on ratios.
    """
    ks = np.asarray(ks, dtype=float)
    areas = np.empty(len(ks) + 1, dtype=float)
    areas[0] = a0
    for i, k in enumerate(ks):
        areas[i + 1] = areas[i] * (1.0 - k) / (1.0 + k)
    return areas


# ---------------------------------------------------------------------------
# Levinson / step-up: the lattice <-> direct-form (all-pole) identity
# ---------------------------------------------------------------------------

def step_up(ks):
    """Levinson-Durbin step-up recursion: reflection coefficients -> a_i.

    THIS FUNCTION IS THE MIRROR. The reflection-coefficient ladder k_1..k_p is
    simultaneously (a) an LPC lattice filter and (b) a cascade of acoustic-tube
    scattering junctions. The step-up recursion converts that same ladder into
    the direct-form all-pole denominator

        A(z) = 1 - a_1 z^-1 - a_2 z^-2 - ... - a_p z^-p

    so that the synthesis filter is H(z) = G / A(z). Lattice == tube == all-pole
    are three notations for one operator; this recursion moves between two of
    them, and the area-function relation above moves to the third.

    Convention: the returned a_i are the coefficients in the SUBTRACTIVE form
    above (y[n] = x[n] + sum a_i y[n-i]), i.e. the polynomial passed to freqz as
    denominator is [1, -a_1, ..., -a_p]. We build that denominator in
    `tract_transfer_function`.

    Standard recursion (Markel & Gray / Rabiner-Schafer):
        a^(0) = []
        for i = 1..p:
            a_i^(i) = k_i
            a_j^(i) = a_j^(i-1) - k_i * a_{i-j}^(i-1)   for j = 1..i-1
    """
    ks = np.asarray(ks, dtype=float)
    p = len(ks)
    a = np.zeros(p)  # a[0..p-1] correspond to a_1..a_p
    for i in range(p):
        k = ks[i]
        new = a.copy()
        new[i] = k
        for j in range(i):
            new[j] = a[j] - k * a[i - 1 - j]
        a = new
    return a


def step_down(a):
    """Inverse of step_up: direct-form a_i -> reflection coefficients k_i.

    Provided for completeness / round-trip testing. Returns k_1..k_p.
    """
    a = np.asarray(a, dtype=float)
    p = len(a)
    ks = np.zeros(p)
    cur = a.copy()
    for i in range(p - 1, -1, -1):
        k = cur[i]
        ks[i] = k
        if i == 0:
            break
        denom = 1.0 - k * k
        prev = np.zeros(i)
        for j in range(i):
            prev[j] = (cur[j] + k * cur[i - 1 - j]) / denom
        cur = np.concatenate([prev, cur[i:]])
    return ks


def levinson_durbin(r, order):
    """Autocorrelation-method Levinson-Durbin: autocorrelation r -> (a, k).

    Returns the direct-form all-pole coefficients a_1..a_order (in the
    SUBTRACTIVE convention y[n]=x[n]+sum a_i y[n-i], so the freqz denominator is
    [1, -a_1, ..., -a_order]) AND the reflection coefficients k_1..k_order. The
    reflection coefficients this returns ARE the lattice; the a_i ARE the
    direct form. The two are the mirror's two faces, and step_up(k) == a.
    """
    r = np.asarray(r, dtype=float)
    a = np.zeros(order)
    k = np.zeros(order)
    e = r[0]
    if e <= 0:
        return a, k
    for i in range(order):
        acc = r[i + 1]
        for j in range(i):
            acc -= a[j] * r[i - j]
        ki = acc / e
        k[i] = ki
        new = a.copy()
        new[i] = ki
        for j in range(i):
            new[j] = a[j] - ki * a[i - 1 - j]
        a = new
        e *= (1.0 - ki * ki)
        if e <= 0:
            break
    return a, k


def tract_impulse_response(areas, fs, n=4096,
                           glottal_reflection=DEFAULT_GLOTTAL_REFLECTION,
                           lip_reflection=DEFAULT_LIP_REFLECTION,
                           junction_loss=DEFAULT_JUNCTION_LOSS,
                           radiation_lowpass=0.0,
                           radiation=False):
    """Impulse response of the time-domain Kelly-Lochbaum tract.

    This is the PHYSICAL GROUND TRUTH for the tract's resonances: it is the
    exact response of the same bidirectional waveguide that synthesizes audio.

    radiation defaults to False for ANALYSIS: the lip-radiation first difference
    (+6 dB/oct) adds a zero at DC that does not move the poles but tilts the
    spectrum so steeply it can bury F1 beneath higher formants. Formant
    frequencies are the tract POLES, so the analysis path takes the raw
    transmitted pressure (radiation=False); the audio path uses radiation=True.
    """
    tract = KellyLochbaumTract(areas, fs,
                               glottal_reflection=glottal_reflection,
                               lip_reflection=lip_reflection,
                               junction_loss=junction_loss,
                               radiation_lowpass=radiation_lowpass)
    imp = np.zeros(n)
    imp[0] = 1.0
    return tract.process(imp, radiation=radiation)


def tract_transfer_function(areas, fs, worN=2048,
                            glottal_reflection=DEFAULT_GLOTTAL_REFLECTION,
                            lip_reflection=DEFAULT_LIP_REFLECTION,
                            junction_loss=DEFAULT_JUNCTION_LOSS,
                            lpc_order=None):
    """All-pole tract transfer function H(z) = G / A(z), via the mirror.

    THE MIRROR, EXECUTED. We take the impulse response of the physical
    Kelly-Lochbaum tube (the SAME waveguide that synthesizes audio), then fit an
    all-pole model to it by autocorrelation Levinson-Durbin
    (`levinson_durbin`). That single recursion returns BOTH:

        * the reflection-coefficient ladder k_i  -> the LATTICE filter, and
        * the direct-form denominator a_i        -> the all-pole TUBE response,

    and `step_up(k) == a` exactly. So the tube's impulse response, the lattice
    of reflection coefficients, and the all-pole spectrum are one object read
    three ways. That equivalence is precisely Tract Mirror's thesis: the LPC
    lattice and the Kelly-Lochbaum tube are the same structure from opposite
    ends. We evaluate H via scipy.freqz on the resulting all-pole filter.

    The all-pole order is the round-trip length of the tube (2N for N sections),
    which is the number of poles a lossless N-section closed-open tube actually
    has; that is why the order is round-trip-derived and not just N.

    Returns (freqs_hz, H_complex).
    """
    N = len(areas)
    if lpc_order is None:
        lpc_order = 2 * N  # round-trip poles of an N-section closed-open tube
    ir = tract_impulse_response(areas, fs, n=max(4096, 16 * lpc_order),
                                glottal_reflection=glottal_reflection,
                                lip_reflection=lip_reflection,
                                junction_loss=junction_loss,
                                radiation_lowpass=0.0)
    # autocorrelation up to lag = lpc_order
    r = np.array([np.dot(ir[:len(ir) - lag], ir[lag:]) for lag in range(lpc_order + 1)])
    a, _k = levinson_durbin(r, lpc_order)
    denom = np.concatenate([[1.0], -a])
    numer = np.array([1.0])
    w, h = freqz(numer, denom, worN=worN, fs=fs)
    return w, h


def tract_state_matrix(areas,
                       glottal_reflection=DEFAULT_GLOTTAL_REFLECTION,
                       lip_reflection=DEFAULT_LIP_REFLECTION,
                       junction_loss=DEFAULT_JUNCTION_LOSS):
    """State-transition matrix M of the time-domain Kelly-Lochbaum tract.

    The two-rail waveguide is a linear state-space system whose state is the
    delay-line contents s = [f[0..N-1], b[0..N-1]] (2N states). One sample of
    KellyLochbaumTract.step (with the radiation lowpass off) is exactly

        s[n+1] = M s[n] + g x[n]

    where M is built here directly from the same scattering relations the
    time-domain loop uses. The EIGENVALUES of M are the tract's poles, so its
    formant frequencies are angle(pole) * fs / (2 pi). This is the fast, exact
    route to the same resonances the audio path produces; it makes the fitter
    ~100x faster than measuring an impulse response.

    NOTE: this M reproduces KellyLochbaumTract.step line-for-line. If you change
    a sign or the junction form in step(), change it here too (and the smoke
    test will catch a divergence).
    """
    k = reflection_coeffs_from_area(areas)
    N = len(areas)
    L = junction_loss
    M = np.zeros((2 * N, 2 * N))

    def F(i):
        return i

    def B(i):
        return N + i

    # new_f[0] = kg * b[0]   (+ excitation, which is the input g, not in M)
    M[F(0), B(0)] = glottal_reflection
    for i in range(N - 1):
        # new_f[i+1] = L * ((1 + k_i) f[i] - k_i b[i+1])
        M[F(i + 1), F(i)] = L * (1.0 + k[i])
        M[F(i + 1), B(i + 1)] = -L * k[i]
        # new_b[i]   = L * ((1 - k_i) b[i+1] + k_i f[i])
        M[B(i), B(i + 1)] = L * (1.0 - k[i])
        M[B(i), F(i)] = L * k[i]
    # new_b[N-1] = klip * f[N-1]   (radiation lowpass off for the analysis model)
    M[B(N - 1), F(N - 1)] = lip_reflection
    return M


def find_formants(areas, fs, n_formants=3,
                  glottal_reflection=DEFAULT_GLOTTAL_REFLECTION,
                  lip_reflection=DEFAULT_LIP_REFLECTION,
                  junction_loss=DEFAULT_JUNCTION_LOSS, fmin=90.0, fmax=None):
    """Formant frequencies as the resonant poles of the tract state matrix.

    Eigenvalues of `tract_state_matrix` are the exact poles of the same
    waveguide that synthesizes audio. We keep the poles inside the unit circle,
    take one of each conjugate pair (positive imaginary part), sort by
    frequency, and return the first n_formants in (fmin, fmax). Padded with NaN
    if fewer are found. This is exact (no FFT-bin quantization) and fast.
    """
    if fmax is None:
        fmax = 0.45 * fs
    M = tract_state_matrix(areas, glottal_reflection, lip_reflection,
                           junction_loss)
    ev = np.linalg.eigvals(M)
    res = []
    for p in ev:
        if abs(p) > 1.0001:
            continue
        if np.imag(p) < 0:
            continue  # take one of each conjugate pair
        f = np.angle(p) / (2.0 * np.pi) * fs
        if fmin < f < fmax:
            res.append((f, abs(p)))
    res.sort(key=lambda t: t[0])
    freqs = [f for f, _r in res[:n_formants]]
    while len(freqs) < n_formants:
        freqs.append(np.nan)
    return np.array(freqs)


# ---------------------------------------------------------------------------
# Glottal source
# ---------------------------------------------------------------------------

def rosenberg_pulse(period_samples, open_quotient=0.6, tension=0.5):
    """One Rosenberg-style glottal flow pulse, length = period_samples.

    The Rosenberg model splits the open phase into an opening branch (rising,
    cubic-ish) and a closing branch (falling, faster), then a closed phase of
    zero flow. Parameters:

      open_quotient : fraction of the period the glottis is open (0..1). Larger
                      OQ -> breathier, more low-frequency-weighted source.
      tension       : 0..1 spectral-tilt / abruptness control. Higher tension
                      makes the closing branch sharper (more abrupt closure ->
                      brighter source, less spectral tilt). We implement it by
                      reshaping the split between opening and closing phases:
                      higher tension shortens the closing branch relative to the
                      opening branch, sharpening the closure discontinuity in the
                      flow derivative, which lifts high frequencies.

    Returns the glottal FLOW waveform for one period (not the derivative); the
    tract excitation in this reference uses flow directly, with lip radiation
    (first difference) applied at the output, which is the conventional place to
    put the derivative.
    """
    N = int(period_samples)
    pulse = np.zeros(N)
    open_len = max(2, int(round(open_quotient * N)))
    # tension reshapes the open/close split. tension=0 -> symmetric-ish,
    # tension=1 -> very short, abrupt closing branch.
    close_frac = 0.2 + 0.6 * (1.0 - tension)   # closing fraction of open phase
    close_frac = float(np.clip(close_frac, 0.1, 0.8))
    Tp = int(round(open_len * (1.0 - close_frac)))  # opening-phase length
    Tp = max(1, min(Tp, open_len - 1))
    n_open = np.arange(0, Tp)
    n_close = np.arange(Tp, open_len)
    # Opening branch: rising, Rosenberg uses 0.5*(1 - cos(pi n / Tp))
    pulse[:Tp] = 0.5 * (1.0 - np.cos(np.pi * n_open / Tp))
    # Closing branch: falling, cos quarter-wave from 1 to 0
    tc = open_len - Tp
    pulse[Tp:open_len] = np.cos(0.5 * np.pi * (n_close - Tp) / tc)
    return pulse


def glottal_source(n_samples, fs, f0_hz, open_quotient=0.6, tension=0.5,
                   breath=0.0, aspiration_modulated=True, rng=None):
    """Build a glottal excitation signal of n_samples.

    Mixes two paths that excite the SAME tract:
      * Voiced path: a train of Rosenberg pulses at f0_hz.
      * Aspiration path: white noise, optionally amplitude-modulated by the
        glottal pulse train (turbulence is strongest near glottal opening).
    `breath` in [0,1] crossfades: 0 = fully voiced, 1 = fully aspirated.

    f0_hz may be a scalar or an array of length n_samples (for vibrato /
    portamento). Returns a float array, roughly unit-scaled.
    """
    if rng is None:
        rng = np.random.default_rng(0)
    f0 = np.broadcast_to(np.asarray(f0_hz, dtype=float), (n_samples,)).copy()
    f0 = np.maximum(f0, 1.0)

    # Build the voiced pulse train by phase accumulation so f0 can vary.
    voiced = np.zeros(n_samples)
    phase = 0.0
    inc = f0 / fs
    # Precompute one representative pulse shape lookup is hard with varying
    # period; instead we render each period as it completes using the local f0.
    period_start = 0
    for n in range(n_samples):
        phase += inc[n]
        if phase >= 1.0:
            phase -= 1.0
            # a glottal period just ended at sample n; fill the period that
            # started at period_start with a pulse sized to that period.
            plen = n - period_start + 1
            if plen >= 2:
                local_f0 = fs / plen
                pulse = rosenberg_pulse(plen, open_quotient, tension)
                voiced[period_start:n + 1] = pulse[:plen]
            period_start = n + 1
    # tail (incomplete final period)
    if period_start < n_samples:
        plen = n_samples - period_start
        if plen >= 2:
            pulse = rosenberg_pulse(int(round(fs / max(f0[-1], 1.0))),
                                    open_quotient, tension)
            voiced[period_start:] = pulse[:plen]

    # Remove DC so the pulse train is a proper AC excitation.
    voiced = voiced - np.mean(voiced)

    # Aspiration noise path.
    noise = rng.standard_normal(n_samples)
    if aspiration_modulated:
        # modulate by a smoothed, rectified version of the voiced envelope so
        # turbulence rides on the glottal cycle
        env = np.abs(voiced)
        if env.max() > 0:
            env = env / env.max()
        env = 0.3 + 0.7 * env
        noise = noise * env
    # normalize each path to comparable RMS before mixing
    def _rms(x):
        return np.sqrt(np.mean(x * x)) + 1e-12
    voiced_n = voiced / _rms(voiced)
    noise_n = noise / _rms(noise)

    out = (1.0 - breath) * voiced_n + breath * noise_n
    return out


# ---------------------------------------------------------------------------
# Kelly-Lochbaum vocal tract (time-domain bidirectional waveguide)
# ---------------------------------------------------------------------------

class KellyLochbaumTract:
    """Bidirectional two-rail Kelly-Lochbaum waveguide.

    ======================================================================
    SIGN CONVENTIONS  (read this before editing -- the classic KL bug lives
    at the two ends and in the junction sign)
    ======================================================================

    Two delay rails carry pressure waves:
        f[i] : FORWARD-going wave in section i (glottis -> lips)
        b[i] : BACKWARD-going wave in section i (lips -> glottis)

    There are N sections (index 0..N-1) and N-1 interior scattering junctions.
    Junction i sits between section i and section i+1 and has reflection
    coefficient k_i = (A_i - A_{i+1})/(A_i + A_{i+1}) (see
    reflection_coeffs_from_area). The Kelly-Lochbaum scattering at an interior
    junction, for the wave LEAVING the junction, is:

        f_out_into_(i+1) = (1 + k_i) * f_in_from_i + (-k_i) * b_in_from_(i+1)
                         = f_in_from_i + k_i * (f_in_from_i - b_in_from_(i+1))
        b_out_into_i     = (1 - k_i) * b_in_from_(i+1) + ( k_i) * f_in_from_i
                         = b_in_from_(i+1) + k_i * (f_in_from_i - b_in_from_(i+1))

    Using the one-multiply form with w = k_i * (f_in - b_in):
        f_out = f_in + w
        b_out = b_in + w
    where f_in is the forward wave arriving from section i and b_in is the
    backward wave arriving from section i+1. This is the standard lossless
    Kelly-Lochbaum junction; it is passive for |k_i| < 1.

    GLOTTAL END (section 0, the closed end):
        The backward wave that returns to the glottis is reflected forward with
        reflection coefficient +glottal_reflection (~ +0.97). A nearly closed
        glottis is a high-impedance (pressure-doubling) termination, so the
        reflection is POSITIVE and near +1. The external glottal excitation is
        ADDED into the forward rail here. Sign: forward_into_section_0 =
        glottal_reflection * backward_out_of_section_0 + excitation.

    LIP END (section N-1, the open end):
        The open mouth is a low-impedance (near pressure-release) termination,
        so the reflection is NEGATIVE and near -1. We use
        lip_reflection (~ -0.9) and additionally pass the reflected wave through
        a one-pole lowpass to model frequency-dependent radiation loss (high
        frequencies radiate more efficiently, so they are reflected LESS). Sign:
        backward_into_section_(N-1) = lip_reflection * lowpass(forward_out_of_(N-1)).

    OUTPUT:
        The radiated signal is taken at the lips as the portion of the forward
        wave that is NOT reflected back, i.e. transmitted out of the mouth:
        out = (1 + lip_reflection_transmission) * forward_at_lip. In practice we
        take the forward wave leaving the last section and apply a first-
        difference (radiation high-frequency emphasis), which is the lip
        radiation characteristic (a differentiator / +6 dB/oct).

    PER-JUNCTION LOSS:
        Each junction's outputs are multiplied by junction_loss (~0.996) to
        guarantee bounded output even with end reflections near unity. This is a
        mild uniform damping; it slightly widens formant bandwidths, which is
        physically realistic (wall losses).
    ======================================================================
    """

    def __init__(self, areas, fs,
                 glottal_reflection=DEFAULT_GLOTTAL_REFLECTION,
                 lip_reflection=DEFAULT_LIP_REFLECTION,
                 junction_loss=DEFAULT_JUNCTION_LOSS,
                 radiation_lowpass=0.75):
        self.fs = fs
        self.glottal_reflection = float(glottal_reflection)
        self.lip_reflection = float(lip_reflection)
        self.junction_loss = float(junction_loss)
        self.radiation_lowpass = float(radiation_lowpass)
        self.set_areas(areas)
        self.reset()

    def set_areas(self, areas):
        areas = np.asarray(areas, dtype=float)
        self.areas = areas
        self.N = len(areas)
        self.k = reflection_coeffs_from_area(areas)  # length N-1

    def reset(self):
        self.f = np.zeros(self.N)   # forward rail, one sample per section
        self.b = np.zeros(self.N)   # backward rail
        self._lip_lp_state = 0.0    # radiation lowpass state
        self._rad_prev = 0.0        # previous lip output for first-difference

    def step(self, excitation, radiation=True):
        """Advance one sample. `excitation` is the glottal input. Returns the
        lip output for this sample. If radiation is True the output carries the
        lip-radiation first difference (+6 dB/oct, the audio path); if False the
        output is the raw transmitted pressure (the analysis path, whose peaks
        are the tract poles / formant frequencies, undistorted by the radiation
        tilt that would otherwise bury F1).

        We process junctions on the current rails, then shift the delay lines.
        The implementation keeps f[i]/b[i] as the wave currently SITTING in
        section i (having traveled across it this sample).
        """
        f = self.f
        b = self.b
        N = self.N
        k = self.k
        loss = self.junction_loss

        # New rail values after scattering + propagation for this sample.
        new_f = np.zeros(N)
        new_b = np.zeros(N)

        # --- Glottal end (section 0): reflect returning backward wave and add
        # excitation. b[0] is the backward wave that has arrived back at the
        # glottis. ---
        new_f[0] = self.glottal_reflection * b[0] + excitation

        # --- Interior junctions i = 0 .. N-2 (between section i and i+1) ---
        # forward wave arriving at junction i from section i  = f[i]
        # backward wave arriving at junction i from section i+1 = b[i+1]
        for i in range(N - 1):
            f_in = f[i]
            b_in = b[i + 1]
            w = k[i] * (f_in - b_in)
            f_out = (f_in + w) * loss     # goes into section i+1 (forward)
            b_out = (b_in + w) * loss     # goes into section i (backward)
            new_f[i + 1] = f_out
            new_b[i] = b_out

        # --- Lip end (section N-1, open): the forward wave leaving the last
        # section reflects with lip_reflection through a radiation lowpass. ---
        f_lip = f[N - 1]
        # one-pole lowpass on the wave about to be reflected (radiation loss)
        a = self.radiation_lowpass
        self._lip_lp_state = (1.0 - a) * f_lip + a * self._lip_lp_state
        new_b[N - 1] = self.lip_reflection * self._lip_lp_state

        # The transmitted signal at the lips: the part of the forward wave not
        # reflected back. Lip radiation (first difference, HF emphasis) is
        # applied only when radiation is requested.
        transmitted = (1.0 + self.lip_reflection) * f_lip
        if radiation:
            out = transmitted - self._rad_prev   # first difference (+6 dB/oct)
        else:
            out = transmitted
        self._rad_prev = transmitted

        self.f = new_f
        self.b = new_b
        return out

    def process(self, excitation, radiation=True):
        """Run the tract over an excitation array; return the lip output.
        radiation=True for audio, False for pole/formant analysis."""
        excitation = np.asarray(excitation, dtype=float)
        out = np.empty_like(excitation)
        for n in range(len(excitation)):
            out[n] = self.step(excitation[n], radiation=radiation)
        return out


# ---------------------------------------------------------------------------
# Convenience: resample a 64-point area curve onto N sections
# ---------------------------------------------------------------------------

def resample_area(area_cp, n):
    """Resample a control-point area curve (length C, glottis->lips) onto n
    sections by linear interpolation in the LOG domain (areas are positive and
    perceptually multiplicative; log interpolation keeps ratios smooth and
    avoids negative excursions). Returns length-n area array.
    """
    area_cp = np.asarray(area_cp, dtype=float)
    C = len(area_cp)
    x_src = np.linspace(0.0, 1.0, C)
    x_dst = np.linspace(0.0, 1.0, n)
    log_src = np.log(area_cp)
    log_dst = np.interp(x_dst, x_src, log_src)
    return np.exp(log_dst)


# ---------------------------------------------------------------------------
# Transfer-matrix ground truth (independent physical check of the mirror)
# ---------------------------------------------------------------------------

def tube_response_fft(areas, fs, nfft=16384,
                      glottal_reflection=DEFAULT_GLOTTAL_REFLECTION,
                      lip_reflection=DEFAULT_LIP_REFLECTION,
                      junction_loss=DEFAULT_JUNCTION_LOSS):
    """Frequency response of the terminated tube via FFT of its impulse
    response. This is the independent second route used to validate the mirror:
    `tract_transfer_function` fits an all-pole model to this same impulse
    response, so the FFT magnitude (direct, model-free) and the all-pole
    magnitude (Levinson lattice/tube) must agree at the formant peaks. If they
    do, the lattice==tube identity is demonstrated numerically.
    """
    ir = tract_impulse_response(areas, fs, n=nfft,
                                glottal_reflection=glottal_reflection,
                                lip_reflection=lip_reflection,
                                junction_loss=junction_loss,
                                radiation_lowpass=0.0)
    H = np.fft.rfft(ir)
    freqs = np.fft.rfftfreq(nfft, 1.0 / fs)
    return freqs, H


if __name__ == "__main__":
    # Smoke test + identity verification.
    fs = 44100
    N = n_sections(fs)
    print(f"fs={fs} N={N}")

    # 1. step_up / step_down round-trip on a non-trivial ladder.
    rng = np.random.default_rng(1)
    test_areas = np.exp(rng.standard_normal(N) * 0.4) * 3.0
    ks = reflection_coeffs_from_area(test_areas)
    a = step_up(ks)
    ks_back = step_down(a)
    print("step_up/step_down round-trip max err:",
          float(np.max(np.abs(ks - ks_back))))

    # 2. A flared two-tube shape should give vowel-like formants (sanity).
    areas = np.concatenate([np.ones(N // 2) * 1.0, np.ones(N - N // 2) * 8.0])
    fmts = find_formants(areas, fs)
    print("two-tube formants (Hz):", np.round(fmts, 1))

    # 3. Uniform tube must give quarter-wave resonances (~500/1500/2500).
    uniform = np.ones(N) * 3.0
    uf = find_formants(uniform, fs)
    print("uniform-tube formants (expect ~500/1500/2500):", np.round(uf, 0))

    # 4. The mirror: all-pole (Levinson) formants vs. direct FFT formants match.
    w1, h1 = tract_transfer_function(areas, fs, worN=8192)
    f2, h2 = tube_response_fft(areas, fs)
    def _peaks(f, h, n=3):
        db = 20 * np.log10(np.abs(h) + 1e-12)
        band = (f > 90) & (f < 0.45 * fs)
        pk = [f[i] for i in np.where(band)[0]
              if 0 < i < len(db) - 1 and db[i] > db[i - 1] and db[i] >= db[i + 1]]
        return np.array(pk[:n])
    pk_allpole = _peaks(w1, h1)
    pk_fft = _peaks(f2, h2)
    print("mirror check  all-pole formants:", np.round(pk_allpole, 0))
    print("mirror check  fft      formants:", np.round(pk_fft, 0))

    # 5. State matrix must reproduce KellyLochbaumTract.step exactly (no
    #    radiation, no lowpass), so the eigen-formants describe the audio tract.
    M = tract_state_matrix(areas)
    N2 = 2 * len(areas)
    tr = KellyLochbaumTract(areas, fs, radiation_lowpass=0.0)
    tr.reset()
    s = np.zeros(N2)
    xin = np.zeros(64)
    xin[0] = 1.0
    max_div = 0.0
    for n in range(64):
        y_step = tr.step(xin[n], radiation=False)
        y_state = (1.0 + tr.lip_reflection) * s[len(areas) - 1]
        max_div = max(max_div, abs(y_step - y_state))
        s = M @ s
        s[0] += xin[n]   # excitation enters the forward rail at section 0
    print("state-matrix vs step max divergence:", f"{max_div:.2e}")

    # 6. Time-domain tract runs, is finite, non-trivial.
    tract = KellyLochbaumTract(areas, fs)
    exc = glottal_source(fs // 2, fs, 110.0)
    y = tract.process(exc)
    print("time-domain output finite:", bool(np.all(np.isfinite(y))),
          "peak:", round(float(np.max(np.abs(y))), 5))
