#!/usr/bin/env python3
"""
Well Morph — the visual leg of the first proof
===============================================
Cycle 3 of [[Quantum Synthesizer]] proved by ear that the shape of a
potential well decides the spacing of its energy levels, and that those
spacings, heard as partials, are the timbre: a parabolic well rings a
clean pitched tone, a quartic-bent well rings a bell.

This script makes the same claim visible, and makes the ear and the eye
read ONE timeline. It sweeps the well continuously from parabolic to
quartic-bent,

    V(x) = 1/2 x^2 + lambda * x^4,   lambda: 0 -> 0.10

solves the 1D Schrodinger equation at every step (same finite-difference
Hamiltonian as schrodinger_ab_synth.py, hbar = m = 1, x in [-8, 8],
900 points), and writes three things:

  1. well-morph-parabolic-to-quartic.wav — 12 s. The well is struck
     twelve times while it bends. Every partial glides with the solver's
     own eigenvalues, so the tone audibly stretches from harmonic to bell.
     The first strike is cycle 3's tone A; the last is tone B.
  2. well-morph-explorer.html — self-contained. Plays that WAV and draws
     V(x), the eigenfunctions phi_n(x) sitting on their energy levels, and
     the partial spectrum, all locked to the audio clock. Pause it and the
     slider bends the well by hand; the strike button rings the current
     well through WebAudio with the same additive recipe.
  3. well-morph-strip.svg — five stills across the sweep, for anywhere
     that cannot run the page.

Sonification rule (unchanged from cycle 3): partial n sits at the
transition from level n down to the ground level,
    r_n = (E_n - E_0) / (E_1 - E_0),   f_n = 196 Hz * r_n
so the first partial is pinned at G3 and the well's shape decides the rest.

Only numpy + scipy + stdlib. No matplotlib, no ffmpeg: the moving picture
is a canvas page driven by the WAV rather than a rendered video file.
"""
import base64, io, json, os, wave
import numpy as np
from scipy.linalg import eigh_tridiagonal
from scipy.signal import resample_poly

HERE = os.path.dirname(os.path.abspath(__file__))

# ---- constants shared with schrodinger_ab_synth.py ---------------------
SR = 44100
BASE_FREQ = 196.0          # G3
N_PARTIALS = 12
LAM_MAX = 0.10             # cycle 3's quartic-bent well
N_GRID, X_MAX = 900, 8.0

# ---- timeline -----------------------------------------------------------
DUR = 12.0
RAMP_T0, RAMP_T1 = 1.4, 9.4          # the well bends between these times
STRIKES = [0.0] + list(np.round(np.arange(RAMP_T0, RAMP_T1 + 1e-9, 0.8), 3))


def u_of_t(t):
    """Sweep position 0..1 at time t (held flat before and after the ramp)."""
    return np.clip((np.asarray(t) - RAMP_T0) / (RAMP_T1 - RAMP_T0), 0.0, 1.0)


def lam_of_u(u):
    """lambda = LAM_MAX * u^2. The spectrum moves fastest at small lambda,
    so squaring the sweep spreads the audible change more evenly in time."""
    return LAM_MAX * np.asarray(u) ** 2


# ---- the solver ---------------------------------------------------------
X = np.linspace(-X_MAX, X_MAX, N_GRID)
DX = X[1] - X[0]
OFF = -0.5 / DX**2 * np.ones(N_GRID - 1)


def solve(lam, k=N_PARTIALS + 1):
    V = 0.5 * X**2 + lam * X**4
    E, U = eigh_tridiagonal(1.0 / DX**2 + V, OFF, select="i", select_range=(0, k - 1))
    return E, U / np.sqrt(DX)       # eigenvectors normalized so sum |phi|^2 dx = 1


def ratios(E):
    g = E - E[0]
    return g[1:] / g[1]             # r_1 = 1 exactly


# ---- 1. the audio -------------------------------------------------------
def render_audio():
    # dense lookup of ratios vs sweep position, then interpolate per sample
    u_tab = np.linspace(0, 1, 401)
    r_tab = np.array([ratios(solve(l)[0]) for l in lam_of_u(u_tab)])   # (401, 12)
    t = np.arange(int(SR * DUR)) / SR
    u = u_of_t(t)
    sig = np.zeros_like(t)
    atk_len = 0.005
    for k in range(N_PARTIALS):
        f = BASE_FREQ * np.interp(u, u_tab, r_tab[:, k])
        phase = 2 * np.pi * np.cumsum(f) / SR          # glides without clicks
        amp = 1.0 / (k + 1) ** 0.9                     # cycle 3's amplitude law
        tau = 0.9 / (1 + 0.6 * k)                      # higher partials die faster
        env = np.zeros_like(t)
        for ts in STRIKES:
            dt = t - ts
            m = dt >= 0
            env[m] += np.exp(-dt[m] / tau) * np.minimum(dt[m] / atk_len, 1.0)
        sig += amp * env * np.sin(phase)
    sig *= 0.92 / (np.max(np.abs(sig)) + 1e-9)
    return sig, u_tab, r_tab


def wav_bytes(mono, sr):
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
        w.writeframes((np.clip(mono, -1, 1) * 32767).astype(np.int16).tobytes())
    return buf.getvalue()


# ---- 2. frame data for the page ----------------------------------------
N_FRAMES = 41
N_STATES = 7                         # phi_0 .. phi_6 drawn
XD = np.linspace(-4.5, 4.5, 181)     # display window


def frame_data():
    frames, prev = [], None
    for u in np.linspace(0, 1, N_FRAMES):
        lam = float(lam_of_u(u))
        E, U = solve(lam)
        phis = []
        for n in range(N_STATES):
            p = U[:, n].copy()
            if prev is None:
                # first frame: make the outermost right-hand lobe positive
                right = np.where(X > 0)[0]
                big = right[np.abs(p[right]) > 0.25 * np.abs(p[right]).max()]
                if p[big[-1]] < 0:
                    p = -p
            elif np.dot(p, prev[n]) < 0:  # keep sign continuous across frames
                p = -p
            phis.append(p)
        prev = phis
        frames.append({
            "u": round(float(u), 4),
            "lam": round(lam, 6),
            "E": [round(float(e), 4) for e in E],
            "r": [round(float(r), 4) for r in ratios(E)],
            "phi": [[round(float(v), 3) for v in np.interp(XD, X, p)] for p in phis],
        })
    return frames


# ---- 3. the still strip (hand-written SVG) ------------------------------
C = dict(bg="#0a0a0f", elev="#12121a", border="#4a4a5e", fg1="#e8e8f0", fg2="#c8c8d8",
         fg3="#8a8aa0", fg4="#4a4a5a", accent="#e8b84a", accent_dim="#7a6030", info="#4a8fff")


def svg_strip(frames, path):
    pick = [0, 10, 20, 30, 40]            # u = 0, .25, .5, .75, 1
    W, H = 1500, 600
    pw, gap, left, top = 272, 22, 34, 70
    ph, sh = 330, 110                     # well panel, spectrum panel heights
    Emax = 10.5
    out = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" '
           f'font-family="JetBrains Mono, Menlo, monospace">',
           f'<rect width="{W}" height="{H}" fill="{C["bg"]}"/>',
           f'<text x="{left}" y="34" fill="{C["fg3"]}" font-size="11" letter-spacing="2.5">'
           f'QUANTUM SYNTHESIZER · WELL MORPH · FIVE STILLS</text>',
           f'<text x="{left}" y="56" fill="{C["fg1"]}" font-size="17" font-family="Georgia, serif">'
           f'Bend the well, and the partials stretch. V(x) = ½x² + λx⁴, solved at each step; '
           f'partial n = (Eₙ − E₀)/(E₁ − E₀) × 196 Hz.</text>']
    for i, fi in enumerate(pick):
        f = frames[fi]
        x0 = left + i * (pw + gap)
        sx = lambda x: x0 + (x + 4.5) / 9.0 * pw
        sy = lambda e: top + ph - e / Emax * ph
        out.append(f'<rect x="{x0}" y="{top}" width="{pw}" height="{ph}" fill="{C["elev"]}" stroke="{C["border"]}" stroke-width="0.6"/>')
        # ghost parabola
        pts = " ".join(f"{sx(x):.1f},{sy(min(0.5*x*x, Emax)):.1f}" for x in XD)
        out.append(f'<polyline points="{pts}" fill="none" stroke="{C["fg4"]}" stroke-dasharray="3 3" stroke-width="1"/>')
        # the well
        V = 0.5 * XD**2 + f["lam"] * XD**4
        pts = " ".join(f"{sx(x):.1f},{sy(min(v, Emax)):.1f}" for x, v in zip(XD, V))
        out.append(f'<polyline points="{pts}" fill="none" stroke="{C["fg2"]}" stroke-width="1.6"/>')
        # levels + eigenfunctions
        for n in range(N_STATES):
            E = f["E"][n]
            if E > Emax - 0.3:
                continue
            inside = XD[V <= E]
            xa, xb = inside.min(), inside.max()
            col = C["accent"] if n else C["info"]
            out.append(f'<line x1="{sx(xa):.1f}" y1="{sy(E):.1f}" x2="{sx(xb):.1f}" y2="{sy(E):.1f}" stroke="{col}" stroke-opacity="0.35" stroke-width="0.8"/>')
            pts = " ".join(f"{sx(x):.1f},{sy(E + 0.55 * p):.1f}" for x, p in zip(XD, f["phi"][n]))
            out.append(f'<polyline points="{pts}" fill="none" stroke="{col}" stroke-width="1.2"/>')
        out.append(f'<text x="{x0+8}" y="{top+18}" fill="{C["fg3"]}" font-size="11">λ = {f["lam"]:.4f}</text>')
        # spectrum sticks
        sy0 = top + ph + 30
        rmax = 18.0
        out.append(f'<rect x="{x0}" y="{sy0}" width="{pw}" height="{sh}" fill="{C["elev"]}" stroke="{C["border"]}" stroke-width="0.6"/>')
        sxr = lambda r: x0 + 8 + (r / rmax) * (pw - 16)
        for h in range(1, 13):
            out.append(f'<line x1="{sxr(h):.1f}" y1="{sy0+sh-4}" x2="{sxr(h):.1f}" y2="{sy0+sh-14}" stroke="{C["fg4"]}" stroke-width="1"/>')
        for k, r in enumerate(f["r"]):
            a = 1.0 / (k + 1) ** 0.9
            out.append(f'<line x1="{sxr(r):.1f}" y1="{sy0+sh-4}" x2="{sxr(r):.1f}" y2="{sy0+sh-4-a*(sh-22):.1f}" stroke="{C["accent"]}" stroke-width="2"/>')
        cents = 1200 * np.log2(f["r"][3] / 4.0)
        out.append(f'<text x="{x0+8}" y="{sy0+16}" fill="{C["fg3"]}" font-size="10">partials · 4th is {cents:+.0f} cents off harmonic</text>')
    out.append(f'<text x="{left}" y="{H-18}" fill="{C["fg3"]}" font-size="10">dashed: the parabola the well started as · '
               f'grey ticks under the spectrum: the harmonic series 1..12 · blue: ground state φ₀ · gold: φ₁..φ₆</text>')
    out.append(f'<text x="{W-34}" y="{H-18}" fill="{C["fg3"]}" font-size="10" text-anchor="end" letter-spacing="2">LOUD’N LIVE</text>')
    out.append("</svg>")
    with open(path, "w") as fh:
        fh.write("\n".join(out))


if __name__ == "__main__":
    sig, u_tab, r_tab = render_audio()
    wav44 = wav_bytes(sig, SR)
    with open(os.path.join(HERE, "well-morph-parabolic-to-quartic.wav"), "wb") as fh:
        fh.write(wav44)
    wav22 = wav_bytes(resample_poly(sig, 1, 2), SR // 2)   # lighter copy embedded in the page

    frames = frame_data()
    data = {
        "base_freq": BASE_FREQ, "lam_max": LAM_MAX, "dur": DUR,
        "ramp": [RAMP_T0, RAMP_T1], "strikes": [float(s) for s in STRIKES],
        "xd": [round(float(x), 3) for x in XD], "frames": frames,
    }
    tpl = open(os.path.join(HERE, "well_morph_template.html")).read()
    html = (tpl.replace("/*__DATA__*/null", json.dumps(data, separators=(",", ":")))
               .replace("__AUDIO_B64__", base64.b64encode(wav22).decode()))
    with open(os.path.join(HERE, "well-morph-explorer.html"), "w") as fh:
        fh.write(html)

    svg_strip(frames, os.path.join(HERE, "well-morph-strip.svg"))

    print("strikes at", STRIKES)
    print("first strike ratios", np.round(frames[0]["r"][:6], 3))
    print("last strike ratios ", np.round(frames[-1]["r"][:6], 3))
    print("html", len(html) // 1024, "KB")
