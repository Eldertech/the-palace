#!/usr/bin/env python3
"""
Double Well — the sound no parabola can make
============================================
Cycles 3 and 5 of [[Quantum Synthesizer]] showed by ear and by eye that the
shape of a potential well sets the spacing of its energy levels, and that
those spacings, heard as partials, are the timbre. A parabola rings a clean
harmonic tone; a quartic-bent well rings a bell.

This script raises a barrier in the middle of the parabola,

    V(x) = 1/2 x^2 + h * exp(-x^2 / (2 sigma^2)),   sigma = 0.5,  h: 0 -> 10

until it becomes two wells joined by a wall. A particle can cross that wall
only by tunnelling, and tunnelling does one thing to the spectrum: every
level splits into a close pair. The gap inside each pair is the tunnelling
rate, and two partials that close together BEAT. So the claim to test is:

    tunnelling, heard, is beating; and the higher the pair sits,
    the thinner the wall it sees, the faster it beats.

Sonification rule. Each eigenstate rings at its own energy:

    f_n = 196 Hz * (E_n - E_0 + 1)

The Schrodinger equation only fixes energy DIFFERENCES; where you put zero
is a free choice that no measurement can see. I set it so the ground state
sits on G3. With no barrier this gives 196, 392, 588 ... Hz, the same
partials as cycle 3's clean tone A. Cycle 3's rule (partial n at the gap
from level n down to the ground) would put the lowest pair's beat at 1.4 Hz
as a partial of its own, below hearing; this rule keeps it as a beat on G3.

Writes (all beside this script):
  1. double-well-morph.wav      16 s. The barrier rises while the well is
     struck eleven times, then the last strike rings out over the finished
     double well so the slow beats have room.
  2. double-well-tunnelling.wav 10 s. No additive recipe at all: a wave
     packet is dropped in the LEFT well of the finished double well and the
     Schrodinger equation is run forward in time (eigen-expansion, checked
     against direct Crank-Nicolson stepping). The audio is psi at a pickup
     point inside the left well. Its loudness is |psi| there, so the sound
     swells and fades as the particle tunnels away and comes back.
  3. double-well-explorer.html  self-contained page: both WAVs, the well
     with its eigenfunctions pairing up, the partial spectrum, the beat-rate
     table, and the particle's density sloshing between the wells, all
     locked to the audio clock.
  4. double-well-strip.svg      five stills across the barrier's rise.

Only numpy + scipy + stdlib.
"""
import base64, io, json, os, wave
import numpy as np
from scipy.linalg import eigh_tridiagonal, solve_banded
from scipy.signal import resample_poly, hilbert

HERE = os.path.dirname(os.path.abspath(__file__))

SR = 44100
BASE_FREQ = 196.0            # G3: 1 energy unit (hbar*omega of the parabola) = 196 Hz
N_LEVELS = 12
SIGMA, H_MAX = 0.5, 10.0
N_GRID, X_MAX = 1200, 8.0    # converged: splittings agree with 2400 pts to 0.02 Hz

X = np.linspace(-X_MAX, X_MAX, N_GRID)
DX = X[1] - X[0]
OFF = -0.5 / DX**2 * np.ones(N_GRID - 1)


def V_of(h, x=X):
    return 0.5 * x**2 + h * np.exp(-x**2 / (2 * SIGMA**2))


def solve(h, k=N_LEVELS):
    E, U = eigh_tridiagonal(1.0 / DX**2 + V_of(h), OFF, select="i", select_range=(0, k - 1))
    return E, U / np.sqrt(DX)


def partials(E):
    """Hz for every level: ground pinned to G3, differences from the solver."""
    return BASE_FREQ * (E - E[0] + 1.0)


def wav_bytes(mono, sr):
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
        w.writeframes((np.clip(mono, -1, 1) * 32767).astype(np.int16).tobytes())
    return buf.getvalue()


# ======================================================================
# 1. the morph: barrier rises from nothing to a wall
# ======================================================================
DUR_M = 16.0
RAMP_T0, RAMP_T1 = 1.5, 10.5
STRIKES = [0.0] + [round(t, 3) for t in np.arange(RAMP_T0, RAMP_T1 + 1e-9, 1.0)]


def u_of_t(t):
    return np.clip((np.asarray(t) - RAMP_T0) / (RAMP_T1 - RAMP_T0), 0.0, 1.0)


def h_of_u(u):
    return H_MAX * np.asarray(u)       # linear: the splittings shrink roughly exponentially in h


def amp(k):
    return 1.0 / (k + 1) ** 0.9        # cycle 3's amplitude law


def tau(k):
    return 2.2 / (1 + 0.35 * k)        # rung longer than cycle 3 (0.9 s) so slow beats have time


def render_morph():
    u_tab = np.linspace(0, 1, 401)
    f_tab = np.array([partials(solve(h)[0]) for h in h_of_u(u_tab)])      # (401, 12)
    t = np.arange(int(SR * DUR_M)) / SR
    u = u_of_t(t)
    sig = np.zeros_like(t)
    for k in range(N_LEVELS):
        f = np.interp(u, u_tab, f_tab[:, k])
        phase = 2 * np.pi * np.cumsum(f) / SR
        env = np.zeros_like(t)
        for ts in STRIKES:
            dt = t - ts
            m = dt >= 0
            env[m] += np.exp(-dt[m] / tau(k)) * np.minimum(dt[m] / 0.005, 1.0)
        sig += amp(k) * env * np.sin(phase)
    sig *= 0.9 / (np.max(np.abs(sig)) + 1e-9)
    return sig, u_tab, f_tab


# ======================================================================
# 2. the tunnelling tone: real time evolution, heard at a pickup
# ======================================================================
DUR_T = 10.0
X0, W0 = -2.3, 0.62          # packet dropped in the left well (left minimum sits at x = -1.36)
X_PICK = -1.9                # the pickup, inside the left well
N_EXP = 40                   # eigenstates in the expansion
TAU_T = 4.0                  # ring time of the lowest pair; pairs share a ring time


def packet():
    p = np.exp(-(X - X0) ** 2 / (2 * W0**2))
    return p / np.sqrt(np.sum(p**2) * DX)


def expansion():
    E, U = solve(H_MAX, N_EXP)
    c = U.T @ packet() * DX
    return E, U, c


def tau_t(n):
    return TAU_T / (1 + 0.5 * (n // 2))    # both members of a pair decay together


def psi_at(E, U, c, idx, t, damp=True):
    """psi(x_idx, t) as a complex signal. Time is scaled so 1 energy unit = 196 Hz;
    the global phase exp(-i(E_0 - 1)t) is dropped (the free choice of zero)."""
    w = 2 * np.pi * BASE_FREQ * (E - E[0] + 1.0)
    out = np.zeros((np.size(idx), t.size), complex)
    for n in range(len(E)):
        d = np.exp(-t / tau_t(n)) if damp else 1.0
        out += np.outer(U[idx, n] * c[n], np.exp(-1j * w[n] * t) * d)
    return out


def render_tunnelling():
    E, U, c = expansion()
    t = np.arange(int(SR * DUR_T)) / SR
    ip = int(np.argmin(np.abs(X - X_PICK)))
    z = psi_at(E, U, c, [ip], t)[0]
    ramp_in = np.minimum(t / 0.004, 1.0)
    sig = np.real(z) * ramp_in
    scale = 0.9 / (np.max(np.abs(sig)) + 1e-9)
    return sig * scale, z * ramp_in * scale, t, (E, U, c)


def left_probability(E, U, c, t, damp=True):
    """P(particle in left well) through time, from the slow cross terms only
    (fast ones average away within one audio frame)."""
    L = X < 0
    M = (U[L].T @ U[L]) * DX                              # <phi_m | left | phi_n>
    w = 2 * np.pi * BASE_FREQ * E
    P = np.zeros_like(t); N = np.zeros_like(t)
    for m in range(len(E)):
        for n in range(len(E)):
            if abs(E[m] - E[n]) * BASE_FREQ > 80:        # skip audio-rate terms
                continue
            dm = np.exp(-t / tau_t(m)) if damp else 1.0
            dn = np.exp(-t / tau_t(n)) if damp else 1.0
            term = c[m] * c[n] * np.cos((w[m] - w[n]) * t) * dm * dn
            P += M[m, n] * term
            if m == n:
                N += term
    return P / N


def crank_nicolson_check(steps_per_unit=100, t_units=900.0):
    """Independent check: step the undamped Schrodinger equation directly and
    compare P_left against the eigen-expansion. Returns the max difference."""
    dt = 1.0 / steps_per_unit
    H_d = 1.0 / DX**2 + V_of(H_MAX); H_o = OFF
    ab = np.zeros((3, N_GRID), complex)
    ab[0, 1:] = 0.5j * dt * H_o; ab[1] = 1 + 0.5j * dt * H_d; ab[2, :-1] = 0.5j * dt * H_o
    psi = packet().astype(complex)
    L = X < 0
    E, U, c = expansion()
    n_steps = int(t_units * steps_per_unit)
    worst, check_every = 0.0, steps_per_unit * 30
    for s in range(1, n_steps + 1):
        rhs = (1 - 0.5j * dt * H_d) * psi
        rhs[1:] -= 0.5j * dt * H_o * psi[:-1]
        rhs[:-1] -= 0.5j * dt * H_o * psi[1:]
        psi = solve_banded((1, 1), ab, rhs)
        if s % check_every == 0:
            tn = s * dt
            p_cn = np.sum(np.abs(psi[L]) ** 2) * DX
            ex = (U @ (c * np.exp(-1j * E * tn)))
            p_ex = np.sum(np.abs(ex[L]) ** 2) * DX
            worst = max(worst, abs(p_cn - p_ex))
    return worst, n_steps


# ======================================================================
# 3. page data
# ======================================================================
N_FRAMES = 41
N_STATES = 8
XD = np.linspace(-4.5, 4.5, 181)
FPS = 30


def morph_frames():
    frames, prev = [], None
    for u in np.linspace(0, 1, N_FRAMES):
        h = float(h_of_u(u))
        E, U = solve(h)
        phis = []
        for n in range(N_STATES):
            p = U[:, n].copy()
            if prev is None:
                right = np.where(X > 0)[0]
                big = right[np.abs(p[right]) > 0.25 * np.abs(p[right]).max()]
                if p[big[-1]] < 0:
                    p = -p
            elif np.dot(p, prev[n]) < 0:
                p = -p
            phis.append(p)
        prev = phis
        frames.append({
            "u": round(float(u), 4), "h": round(h, 4),
            "E": [round(float(e), 5) for e in E],
            "f": [round(float(f), 3) for f in partials(E)],
            "phi": [[round(float(v), 3) for v in np.interp(XD, X, p)] for p in phis],
        })
    return frames


def tunnel_frames(E, U, c):
    """|psi(x,t)|^2 per video frame, averaged over the frame's 1/30 s so the
    audio-rate motion inside each well blurs the way the eye would see it."""
    idx = np.array([int(np.argmin(np.abs(X - x))) for x in XD])
    n_fr = int(DUR_T * FPS)
    sub = 24
    dens = []
    for i in range(n_fr):
        tt = (i + (np.arange(sub) + 0.5) / sub) / FPS
        z = psi_at(E, U, c, idx, tt)
        dens.append(np.mean(np.abs(z) ** 2, axis=1))
    dens = np.array(dens)
    dens /= dens.max()
    tfr = (np.arange(n_fr) + 0.5) / FPS
    P = left_probability(E, U, c, tfr)
    return [[round(float(v), 3) for v in d] for d in dens], [round(float(p), 4) for p in P]


# ======================================================================
# 4. still strip
# ======================================================================
C = dict(bg="#0a0a0f", elev="#12121a", border="#4a4a5e", fg1="#e8e8f0", fg2="#c8c8d8",
         fg3="#8a8aa0", fg4="#4a4a5a", accent="#e8b84a", info="#4a8fff")


def svg_strip(frames, path):
    pick = [0, 10, 20, 30, 40]
    W, H = 1500, 620
    pw, gap, left, top = 272, 22, 34, 70
    ph, sh = 340, 120
    Emax = 12.5
    out = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" '
           f'font-family="JetBrains Mono, Menlo, monospace">',
           f'<rect width="{W}" height="{H}" fill="{C["bg"]}"/>',
           f'<text x="{left}" y="34" fill="{C["fg3"]}" font-size="11" letter-spacing="2.5">'
           f'QUANTUM SYNTHESIZER · DOUBLE WELL · FIVE STILLS</text>',
           f'<text x="{left}" y="56" fill="{C["fg1"]}" font-size="17" font-family="Georgia, serif">'
           f'Raise a wall in the middle, and every level splits into a beating pair. '
           f'V(x) = ½x² + h·exp(−x²/2σ²), σ = 0.5; fₙ = 196 Hz × (Eₙ − E₀ + 1).</text>']
    for i, fi in enumerate(pick):
        f = frames[fi]
        x0 = left + i * (pw + gap)
        sx = lambda x: x0 + (x + 4.5) / 9.0 * pw
        sy = lambda e: top + ph - e / Emax * ph
        out.append(f'<rect x="{x0}" y="{top}" width="{pw}" height="{ph}" fill="{C["elev"]}" stroke="{C["border"]}" stroke-width="0.6"/>')
        pts = " ".join(f"{sx(x):.1f},{sy(min(0.5*x*x, Emax)):.1f}" for x in XD)
        out.append(f'<polyline points="{pts}" fill="none" stroke="{C["fg4"]}" stroke-dasharray="3 3" stroke-width="1"/>')
        V = V_of(f["h"], XD)
        pts = " ".join(f"{sx(x):.1f},{sy(min(v, Emax)):.1f}" for x, v in zip(XD, V))
        out.append(f'<polyline points="{pts}" fill="none" stroke="{C["fg2"]}" stroke-width="1.6"/>')
        for n in range(N_STATES):
            E = f["E"][n]
            if E > Emax - 0.3:
                continue
            col = C["info"] if n % 2 == 0 else C["accent"]
            pts = " ".join(f"{sx(x):.1f},{sy(E + 0.5 * p):.1f}" for x, p in zip(XD, f["phi"][n]))
            out.append(f'<polyline points="{pts}" fill="none" stroke="{col}" stroke-width="1.1" stroke-opacity="0.9"/>')
        out.append(f'<text x="{x0+8}" y="{top+18}" fill="{C["fg3"]}" font-size="11">barrier h = {f["h"]:.2f}</text>')
        # spectrum: partial sticks on a 0..2400 Hz axis
        sy0 = top + ph + 30
        fmax = 2400.0
        out.append(f'<rect x="{x0}" y="{sy0}" width="{pw}" height="{sh}" fill="{C["elev"]}" stroke="{C["border"]}" stroke-width="0.6"/>')
        sxf = lambda fr: x0 + 8 + (fr / fmax) * (pw - 16)
        for hm in range(1, 13):
            out.append(f'<line x1="{sxf(196*hm):.1f}" y1="{sy0+sh-4}" x2="{sxf(196*hm):.1f}" y2="{sy0+sh-14}" stroke="{C["fg4"]}" stroke-width="1"/>')
        for k, fr in enumerate(f["f"]):
            a = amp(k)
            col = C["info"] if k % 2 == 0 else C["accent"]
            out.append(f'<line x1="{sxf(fr):.1f}" y1="{sy0+sh-4}" x2="{sxf(fr):.1f}" y2="{sy0+sh-4-a*(sh-26):.1f}" stroke="{col}" stroke-width="2"/>')
        b0 = f["f"][1] - f["f"][0]; b1 = f["f"][3] - f["f"][2]
        out.append(f'<text x="{x0+8}" y="{sy0+16}" fill="{C["fg3"]}" font-size="10">beats: lowest pair {b0:.1f} Hz · next {b1:.1f} Hz</text>')
    out.append(f'<text x="{left}" y="{H-18}" fill="{C["fg3"]}" font-size="10">dashed: the parabola it started as · '
               f'grey ticks: the harmonic series on G3 · blue: even states φ₀ φ₂ φ₄ φ₆ · gold: odd states φ₁ φ₃ φ₅ φ₇ · '
               f'each blue/gold pair is one split level</text>')
    out.append(f'<text x="{W-34}" y="{H-18}" fill="{C["fg3"]}" font-size="10" text-anchor="end" letter-spacing="2">LOUD’N LIVE</text>')
    out.append("</svg>")
    with open(path, "w") as fh:
        fh.write("\n".join(out))


# ======================================================================
# 5. measurements
# ======================================================================
def beat_rate(sig, sr, t0, t1, f_lo, f_hi):
    """Band-pass a slice to one pair of partials, take its loudness envelope,
    and return the strongest envelope frequency: the beat the ear hears."""
    s = sig[int(t0 * sr):int(t1 * sr)]
    S = np.fft.rfft(s); fr = np.fft.rfftfreq(s.size, 1 / sr)
    S[(fr < f_lo) | (fr > f_hi)] = 0
    env = np.abs(hilbert(np.fft.irfft(S, s.size)))
    env = env * np.exp((np.arange(env.size) / sr) / 2.2)       # undo the ring-out decay (tau of partial 0, approx)
    env -= env.mean()
    Ev = np.abs(np.fft.rfft(env * np.hanning(env.size), 16 * env.size))
    fe = np.fft.rfftfreq(16 * env.size, 1 / sr)
    band = (fe > 0.5) & (fe < 60)
    return float(fe[band][np.argmax(Ev[band])])


def first_strike_peaks(sig, sr):
    s = sig[: int(1.4 * sr)] * np.hanning(int(1.4 * sr))
    S = np.abs(np.fft.rfft(s, 8 * s.size)); fr = np.fft.rfftfreq(8 * s.size, 1 / sr)
    pk = []
    for k in range(1, 7):
        band = (fr > 196 * k - 40) & (fr < 196 * k + 40)
        pk.append(float(fr[band][np.argmax(S[band])]))
    return pk


if __name__ == "__main__":
    # --- audio
    sig_m, u_tab, f_tab = render_morph()
    sig_t, z_t, t_t, (E_t, U_t, c_t) = render_tunnelling()
    with open(os.path.join(HERE, "double-well-morph.wav"), "wb") as fh:
        fh.write(wav_bytes(sig_m, SR))
    with open(os.path.join(HERE, "double-well-tunnelling.wav"), "wb") as fh:
        fh.write(wav_bytes(sig_t, SR))

    # --- page
    frames = morph_frames()
    dens, P = tunnel_frames(E_t, U_t, c_t)
    fin = frames[-1]["f"]
    data = {
        "base_freq": BASE_FREQ, "h_max": H_MAX, "sigma": SIGMA,
        "dur_m": DUR_M, "ramp": [RAMP_T0, RAMP_T1], "strikes": [float(s) for s in STRIKES],
        "dur_t": DUR_T, "fps": FPS, "x0": X0, "x_pick": X_PICK,
        "xd": [round(float(x), 3) for x in XD], "frames": frames,
        "dens": dens, "pleft": P, "h_t": H_MAX,
        "levels_t": [round(float(e), 5) for e in E_t[:N_STATES]],
        "weights_t": [round(float(abs(c)) ** 2, 4) for c in c_t[:N_STATES]],
    }
    tpl = open(os.path.join(HERE, "double_well_template.html")).read()
    b64 = lambda s: base64.b64encode(wav_bytes(resample_poly(s, 1, 4), SR // 4)).decode()
    html = (tpl.replace("/*__DATA__*/null", json.dumps(data, separators=(",", ":")))
               .replace("__AUDIO_MORPH_B64__", b64(sig_m))
               .replace("__AUDIO_TUNNEL_B64__", b64(sig_t)))
    with open(os.path.join(HERE, "double-well-explorer.html"), "w") as fh:
        fh.write(html)
    svg_strip(frames, os.path.join(HERE, "double-well-strip.svg"))

    # --- measurements, printed for the record
    print("first strike peaks (Hz):", [round(p, 1) for p in first_strike_peaks(sig_m, SR)])
    print("final well partials (Hz):", [round(f, 1) for f in fin])
    splits = [fin[2 * k + 1] - fin[2 * k] for k in range(4)]
    print("predicted pair splittings (Hz):", [round(s, 2) for s in splits])
    tail0, tail1 = RAMP_T1 + 0.02, DUR_M
    print("measured beat, lowest pair  (band 150-260 Hz):", round(beat_rate(sig_m, SR, tail0, tail1, 150, 260), 2))
    print("measured beat, second pair  (band 560-680 Hz):", round(beat_rate(sig_m, SR, tail0, tail1, 560, 680), 2))
    print("measured beat, third pair   (band 960-1060 Hz):", round(beat_rate(sig_m, SR, tail0, tail1, 960, 1060), 2))

    print("expansion captures", round(float(np.sum(c_t**2)), 5), "of the packet")
    print("packet weight per level:", [round(float(c) ** 2, 3) for c in c_t[:10]])
    env = np.abs(hilbert(sig_t)); envz = np.abs(z_t)
    mid = slice(int(0.05 * SR), int((DUR_T - 0.05) * SR))
    print("audio envelope vs |psi(pickup)|, max error:", round(float(np.max(np.abs(env[mid] - envz[mid]))), 5))
    # slow loudness vs slow left-probability
    win = int(SR / FPS)
    nwin = sig_t.size // win
    rms = np.sqrt(np.mean(sig_t[: nwin * win].reshape(nwin, win) ** 2, axis=1))
    tw = (np.arange(nwin) + 0.5) / FPS
    Pw = left_probability(E_t, U_t, c_t, tw)
    decay = np.exp(-tw / TAU_T)
    r = np.corrcoef(rms / decay, Pw)[0, 1]
    print("slow loudness (decay removed) vs P(left) correlation:", round(float(r), 3))
    worst, n = crank_nicolson_check()
    print(f"Crank-Nicolson vs expansion, P(left) max diff over {n} steps:", round(worst, 5))
    print("html", len(html) // 1024, "KB")
