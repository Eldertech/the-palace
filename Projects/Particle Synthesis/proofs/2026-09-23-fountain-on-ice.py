"""
Particle Synthesis — the fountain on ice (cycle 4, 2026-09-23).

The POLYPHONIC-CLOUD audition: a fountain of particles rains onto a stiff,
dispersive plate (think a frozen lake), and two pickups on the plate hear every
impact arrive as a chirp. Nothing about the chirp is programmed per particle.

  particle state          physics                     what you hear
  --------------          -------                     -------------
  position (landing x,z)  distance r to each pickup   how long the chirp sweeps
  velocity at impact      momentum m·v·(1+e)          how loud the strike is
  mass                    Hertz contact time Tc       how bright the strike is
  bounces (restitution)   repeat impacts, shrinking   the "skip-skip-skip" rhythm

Medium: flexural (bending) waves in a thin plate, omega = C·k². Group velocity
vg = 2·sqrt(C·omega), so high frequencies arrive first and lows trail — the
"pew" of a stone thrown onto lake ice. Arrival time of frequency omega after
travelling distance r:  tau(omega) = r / (2·sqrt(C·omega)).  Applied exactly in
the frequency domain as phase Phi(omega) = r·sqrt(omega / C).

C is tuned so the ice is room-sized (chirps of 50–500 ms over 2–20 m), not
lake-sized. That is the one artistic choice; the rest is the relation.

Renders (all 48 kHz, 16-bit stereo, peak-normalised to -1 dBFS each):
  00-one-particle     one particle, launched once, skipping to rest at r~12 m
  01-cloud64-dry      64 particles, same impacts, NON-dispersive plate (reference)
  02-cloud64-ice      64 particles, dispersive plate — the audition asked for
  03-cloud1000-ice    1000 particles, same fountain — the forward vector's number
Plus a figure (trajectories + spectrogram of 02) and events JSON for the lesson.

Also checks the closed-form (stationary-phase) chirp the HTML lesson uses in
the browser against this exact FFT render, and prints the correlation.
"""
import json
import time
import wave
import zlib
import struct
from pathlib import Path

import numpy as np

SR = 48000
OUT = Path(__file__).parent
STAMP = "2026-09-23"
rng_master = np.random.default_rng(23)

# ---------------------------------------------------------------- medium
C = 0.316            # m^2/s  plate stiffness term, omega = C k^2  (room-sized ice)
F_ATTEN = 80000.0    # Hz·m   amplitude falls as exp(-f·r / F_ATTEN)
C_DRY = 340.0        # m/s    non-dispersive reference speed (all freqs arrive together)
NFFT = 1 << 16       # 1.37 s window per impact
FREQS = np.fft.rfftfreq(NFFT, 1 / SR)
OMEGA = 2 * np.pi * FREQS

# gentle band edges: nothing below ~70 Hz (their arrival would wrap the window),
# roll off above 16 kHz
HP = 1.0 / (1.0 + (70.0 / np.maximum(FREQS, 1e-6)) ** 6)
LP = 1.0 / (1.0 + (FREQS / 16000.0) ** 8)
BAND = HP * LP

# ---------------------------------------------------------------- particles
G = 9.81
RESTITUTION = 0.45
DRAG = 1e-4          # kg/m, air drag on a ~pebble: a = -(DRAG/m)·|v|·v
M0 = 0.010           # reference mass 10 g
TC0 = 0.00045        # Hertz contact time at M0, V0
V0 = 5.0


def contact_time(m, v):
    """Hertz impact: Tc ∝ m^(2/5) · v^(-1/5). Heavier = longer contact = darker."""
    return TC0 * (m / M0) ** 0.4 * (max(v, 0.2) / V0) ** -0.2


def halfsine_spectrum(f, tc):
    """Magnitude-and-sign spectrum of a half-sine force pulse of length tc."""
    x = 2 * f * tc
    denom = 1 - x ** 2
    denom = np.where(np.abs(denom) < 1e-6, 1e-6, denom)
    return (2 * tc / np.pi) * np.cos(np.pi * f * tc) / denom


def fly(p0, v0, m, dt=1 / 2000):
    """Integrate one particle: gravity + quadratic drag, bounce on the plate y=0.
    Returns (path samples for drawing, list of impacts)."""
    p = np.array(p0, float)
    v = np.array(v0, float)
    t = 0.0
    path, impacts = [], []
    k = DRAG / m
    while t < 8.0:
        sp = np.linalg.norm(v)
        a = np.array([0.0, -G, 0.0]) - k * sp * v
        v = v + a * dt
        p = p + v * dt
        t += dt
        if len(path) == 0 or t - path[-1][0] >= 0.02:
            path.append((t, p[0], p[1], p[2]))
        if p[1] <= 0 and v[1] < 0:
            vn = -v[1]
            impacts.append({"t": t, "x": p[0], "z": p[2], "vn": vn, "m": m})
            p[1] = 0.0
            v[1] = vn * RESTITUTION
            v[0] *= 0.8
            v[2] *= 0.8
            if v[1] < 0.12:
                break
    return path, impacts


def launch_cloud(n, dur, rng, walk=(3.0, 18.0)):
    """n particles from an emitter that walks away from the pickups over dur s."""
    births = np.sort(rng.uniform(0, dur, n))
    events, paths = [], []
    for i, tb in enumerate(births):
        ex = walk[0] + (walk[1] - walk[0]) * tb / dur
        speed = rng.uniform(4.0, 7.0)
        elev = np.radians(rng.uniform(55, 80))
        az = rng.uniform(0, 2 * np.pi)
        v0 = [speed * np.cos(elev) * np.cos(az), speed * np.sin(elev), speed * np.cos(elev) * np.sin(az)]
        m = M0 * np.exp(rng.uniform(np.log(0.4), np.log(4.0)))
        path, imps = fly([ex, 0.0, 0.0], v0, m)
        for im in imps:
            im["t"] += tb
            im["id"] = i
        events.extend(imps)
        paths.append({"id": i, "born": float(tb), "m": float(m),
                      "path": [[round(tb + a, 3), round(b, 3), round(c, 3), round(d, 3)] for a, b, c, d in path]})
    return events, paths


# two contact pickups on the plate, 3 m apart, at the origin
PICKUPS = [(0.0, -1.5), (0.0, 1.5)]


def impact_spectrum(ev, pickup, dispersive=True):
    r = max(np.hypot(ev["x"] - pickup[0], ev["z"] - pickup[1]), 0.5)
    tc = contact_time(ev["m"], ev["vn"])
    amp = ev["m"] * ev["vn"] * (1 + RESTITUTION) / M0      # impulse, in units of M0·m/s
    S = amp * halfsine_spectrum(FREQS, tc) * BAND
    S = S * np.exp(-FREQS * r / F_ATTEN) / np.sqrt(r)
    if dispersive:
        phase = r * np.sqrt(OMEGA / C)                     # Phi(omega) = r·sqrt(omega/C)
    else:
        phase = OMEGA * (r / C_DRY)                        # plain delay, every freq together
    return S * np.exp(-1j * phase), r


def render(events, dur, dispersive=True):
    total = int(SR * (dur + 2.0))
    y = np.zeros((total, 2))
    for ev in events:
        n0 = int(ev["t"] * SR)
        if n0 >= total:
            continue
        for ch, pk in enumerate(PICKUPS):
            X, _ = impact_spectrum(ev, pk, dispersive)
            h = np.fft.irfft(X, n=NFFT) * SR               # scale so values are O(1)
            n1 = min(total, n0 + NFFT)
            y[n0:n1, ch] += h[: n1 - n0]
    return y


def write_wav(path, y, peak_db=-1.0):
    y = y / (np.max(np.abs(y)) or 1.0) * 10 ** (peak_db / 20)
    ints = np.clip(y * 32767, -32768, 32767).astype(np.int16)
    with wave.open(str(path), "w") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(ints.tobytes())
    return path


# ---------------------------------------------------------------- closed form used in the browser
def chirp_closed_form(ev, pickup, n):
    """Stationary-phase chirp: instantaneous omega*(t) = r² / (4 C t²).
    y(t) ≈ (1/π)·S(omega*)·sqrt(2π / psi'')·cos(-r²/(4 C t) + π/4),
    psi'' = r / (4 sqrt(C) omega*^(3/2)).  Same law, no FFT — cheap in JS."""
    r = max(np.hypot(ev["x"] - pickup[0], ev["z"] - pickup[1]), 0.5)
    tc = contact_time(ev["m"], ev["vn"])
    amp = ev["m"] * ev["vn"] * (1 + RESTITUTION) / M0
    t = (np.arange(n) + 0.5) / SR
    w = r ** 2 / (4 * C * t ** 2)
    f = w / (2 * np.pi)
    ok = (f > 20) & (f < SR / 2)
    band = 1.0 / (1.0 + (70.0 / np.maximum(f, 1e-6)) ** 6) / (1.0 + (f / 16000.0) ** 8)
    S = amp * halfsine_spectrum(f, tc) * band * np.exp(-f * r / F_ATTEN) / np.sqrt(r)
    psi2 = r / (4 * np.sqrt(C) * w ** 1.5)
    y = (1 / np.pi) * S * np.sqrt(2 * np.pi / psi2) * np.cos(-r ** 2 / (4 * C * t) + np.pi / 4)
    # units match the FFT render: irfft(X)·SR ≈ (1/π)·Re ∫₀^∞ X(ω) e^{iωt} dω
    return np.where(ok, y, 0.0)


# ---------------------------------------------------------------- figure (PNG without matplotlib)
def png_write(path, rgb):
    h, w, _ = rgb.shape
    raw = b"".join(b"\x00" + rgb[i].astype(np.uint8).tobytes() for i in range(h))
    def chunk(tag, data):
        c = struct.pack(">I", len(data)) + tag + data
        return c + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
    png = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b"")
    Path(path).write_bytes(png)


def amber_ramp(v):
    """0..1 -> graphite ground to amber #e8b84a to near-white. No cyan."""
    stops = np.array([[10, 10, 15], [58, 40, 20], [122, 96, 48], [232, 184, 74], [250, 236, 200]], float)
    x = np.clip(v, 0, 1) * (len(stops) - 1)
    i = np.minimum(x.astype(int), len(stops) - 2)
    fr = (x - i)[..., None]
    return stops[i] * (1 - fr) + stops[i + 1] * fr


def figure(y, paths, dur, path):
    W, H1, H2 = 1400, 260, 520
    img = np.zeros((H1 + H2 + 10, W, 3))
    img[:] = (10, 10, 15)
    # top: side view of every trajectory (x vs height), time mapped to colour
    for p in paths:
        pts = np.array(p["path"])
        if len(pts) < 2:
            continue
        xs = (pts[:, 1] + 1) / 24 * W
        ys = H1 - 12 - pts[:, 2] / 2.6 * (H1 - 24)
        col = amber_ramp(0.35 + 0.6 * p["born"] / dur)
        for a in np.linspace(0, len(pts) - 1, len(pts) * 4):
            j = int(a)
            u = a - j
            k2 = min(j + 1, len(pts) - 1)
            px = int(xs[j] * (1 - u) + xs[k2] * u)
            py = int(ys[j] * (1 - u) + ys[k2] * u)
            if 0 <= px < W and 0 <= py < H1:
                img[py, px] = np.maximum(img[py, px], col)
    img[H1 - 11, :] = (74, 74, 94)                          # the plate
    for pk in PICKUPS:                                      # pickups at x=0
        px = int((pk[0] + 1) / 24 * W)
        img[H1 - 18:H1 - 4, px:px + 3] = (232, 184, 74)
    # bottom: spectrogram of the left channel, log frequency 60 Hz – 16 kHz
    x = y[:, 0]
    hop, win = 256, 2048
    frames = (len(x) - win) // hop
    wnd = np.hanning(win)
    spec = np.array([np.abs(np.fft.rfft(x[i * hop:i * hop + win] * wnd)) for i in range(frames)])
    db = 20 * np.log10(spec + 1e-9)
    db = (db - (db.max() - 70)) / 70
    fbin = np.fft.rfftfreq(win, 1 / SR)
    rows = np.geomspace(16000, 60, H2)
    cols = np.linspace(0, frames - 1, W).astype(int)
    idx = np.searchsorted(fbin, rows)
    img[H1 + 10:, :] = amber_ramp(db[cols][:, idx].T)
    png_write(path, img)


# ---------------------------------------------------------------- main
if __name__ == "__main__":
    t_start = time.time()
    made = []

    # 00 — one particle, skipping to rest ~12 m away
    rng = np.random.default_rng(7)
    _, imps = fly([12.0, 0.0, 0.0], [0.4, 6.5, 0.2], M0)
    y = render(imps, 3.0)
    made.append(write_wav(OUT / f"{STAMP}-fountain-00-one-particle.wav", y[: int(SR * 3.6)]))
    print(f"00: {len(imps)} impacts, first at {imps[0]['t']:.2f}s")

    # 01/02 — 64 particles, dry reference then ice
    rng = np.random.default_rng(64)
    ev64, paths64 = launch_cloud(64, 10.0, rng)
    y_dry = render(ev64, 10.0, dispersive=False)
    made.append(write_wav(OUT / f"{STAMP}-fountain-01-cloud64-dry.wav", y_dry))
    y_ice = render(ev64, 10.0, dispersive=True)
    made.append(write_wav(OUT / f"{STAMP}-fountain-02-cloud64-ice.wav", y_ice))
    print(f"64-cloud: {len(ev64)} impacts")

    # 03 — the forward vector's thousand
    rng = np.random.default_rng(1000)
    ev1k, _ = launch_cloud(1000, 10.0, rng)
    t0 = time.time()
    y1k = render(ev1k, 10.0, dispersive=True)
    t_1k = time.time() - t0
    made.append(write_wav(OUT / f"{STAMP}-fountain-03-cloud1000-ice.wav", y1k))
    print(f"1000-cloud: {len(ev1k)} impacts, rendered in {t_1k:.1f}s CPU for 12 s of audio")

    # figure
    figure(y_ice, paths64, 10.0, OUT / f"{STAMP}-fountain-cloud64.png")

    # closed-form check: browser chirp vs exact FFT chirp, a few impacts
    corrs = []
    for ev in ev64[::9]:
        X, r = impact_spectrum(ev, PICKUPS[0], True)
        exact = np.fft.irfft(X, n=NFFT) * SR
        approx = chirp_closed_form(ev, PICKUPS[0], NFFT)
        # compare where the chirp lives, skip the first ms where stationary phase is loosest
        s = slice(int(0.001 * SR), NFFT - 1)
        a, b = exact[s], approx[s]
        corrs.append(float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))))
        # amplitude ratio (should be ~1 if units agree)
        ratio = float(np.linalg.norm(b) / np.linalg.norm(a))
        print(f"  r={r:5.2f} m  corr={corrs[-1]:.3f}  energy ratio={ratio:.3f}")
    print(f"closed-form vs FFT: mean corr {np.mean(corrs):.3f}, min {np.min(corrs):.3f}")

    # events for the lesson (the 64-cloud, so the page can show what the WAV holds)
    (OUT / f"{STAMP}-fountain-cloud64-events.json").write_text(json.dumps({
        "sr": SR, "C": C, "pickups": PICKUPS, "restitution": RESTITUTION,
        "impacts": [{k: round(float(v), 4) if k != "id" else int(v) for k, v in e.items()} for e in ev64],
        "paths": paths64,
    }))
    print(f"done in {time.time() - t_start:.1f}s")
