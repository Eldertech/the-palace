"""
Particle Synthesis — grains that meet (cycle 5, 2026-09-23).

The entry's third forward direction: "what happens when grains interact rather
than superpose?" Two fountains stand 3 m apart and throw at each other, in
paired shots, so their streams cross in mid-air. The grains are small balls of
ice (hailstones) with real radii. When two of them touch in the air they bounce
off each other, and that contact is heard as a clack through the AIR. When a
grain lands on the plate it is heard as last cycle's chirp through the ICE.

  event                 medium   law                                   what you hear
  -----                 ------   ---                                   -------------
  grain hits grain      air      Hertz sphere-sphere contact,          a dry clack, loudest along the
                                 each ball a compact dipole            line of impact, silent broadside
  grain hits plate      ice      omega = C k^2 (cycle 4, unchanged)    a falling chirp, longer when farther

Nothing about a clack is chosen per event. Its loudness comes from the impulse,
its brightness from the Hertz contact time of two ice spheres, and its
direction pattern from two dipoles pushing apart. That cancellation is NOT
coded; it falls out of adding the two balls' fields.

A clack at a moving place also changes what happens next: a deflected grain
lands somewhere else (so its chirp changes) and can hit a later grain (a
cascade). Those are the interaction effects this script measures.

Renders (48 kHz, 16-bit stereo, 7 s, ONE shared gain so the pair compares fairly):
  04-crossing-pass-through   the same launches, grains pass through each other (superposition)
  05-crossing-collide        grains collide: clacks in the air, deflected chirps on the ice
The aim tightens over the run (6 deg -> 0.15 deg spread), so collisions thicken as it plays.

Mix note: contact pickups (on the plate) and air mics (1.2 m above them) are two
different transducers; their balance is the one choice made by taste, a single
constant AIR_GAIN. Everything else is physics or carried over from cycle 4.
"""
import importlib.util
import json
import time
import wave
from pathlib import Path

import numpy as np

HERE = Path(__file__).parent
spec = importlib.util.spec_from_file_location("ice", HERE / "2026-09-23-fountain-on-ice.py")
ice = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ice)            # cycle-4 model: plate law, pickups, png writer

SR = ice.SR
STAMP = "2026-09-23"

# ---------------------------------------------------------------- the grains: ice spheres
RHO_ICE = 917.0          # kg/m^3
E_ICE = 9.0e9            # Pa, Young's modulus of ice
NU_ICE = 0.33
E_STAR = E_ICE / (2 * (1 - NU_ICE ** 2))    # effective modulus, identical materials
E_GRAIN = 0.70           # restitution grain-on-grain (ice on ice at a few m/s; measured 0.3-0.9)

# ---------------------------------------------------------------- air
RHO_AIR = 1.2
C_AIR = 343.0
AIR_MICS = [np.array([0.0, 1.2, -1.5]), np.array([0.0, 1.2, 1.5])]   # above the plate pickups
AIR_GAIN = 0.35          # the one taste constant: air-mic Pa -> contact-pickup scale (median clack peak ~0.6x strike)

# ---------------------------------------------------------------- the fountains
X_CROSS = 8.0            # where the streams cross, metres from the pickups
HALF_GAP = 1.5           # each nozzle 1.5 m either side of it
NOZZLE_Y = 0.2
SPEED = 6.0
ELEV = np.radians(60)
PAIRS_PER_S = 8.0
EMIT_FOR = 4.5
DUR = 7.0
DT = 1 / 4000


def radius(m):
    return (3 * m / (4 * np.pi * RHO_ICE)) ** (1 / 3)


def hertz_contact_time(m1, m2, r1, r2, vn):
    """Hertz: Tc = 2.87 (m_eff^2 / (R_eff E*^2 v))^(1/5). No tuning."""
    m_eff = m1 * m2 / (m1 + m2)
    r_eff = r1 * r2 / (r1 + r2)
    return 2.87 * (m_eff ** 2 / (r_eff * E_STAR ** 2 * max(vn, 0.05))) ** 0.2


def aim_spread(tb):
    """Aim tightens across the run: 6 degrees of scatter down to 0.15."""
    return np.radians(6.0 + (0.15 - 6.0) * min(tb / EMIT_FOR, 1.0))


def launch(rng):
    births, p0, v0, mass = [], [], [], []
    n_pairs = int(PAIRS_PER_S * EMIT_FOR)
    for k in range(n_pairs):
        tk = k / PAIRS_PER_S
        # one size bin per shot: air drag on a 4 g stone is ~10x that on a 40 g one, so
        # unequal partners drift ~10 cm apart before the crossing and never meet
        m_bin = ice.M0 * np.exp(rng.uniform(np.log(0.4), np.log(4.0)))
        for side in (-1, +1):                      # -1: left nozzle throws right; +1: right throws left
            sp = aim_spread(tk)
            el = ELEV + rng.normal(0, sp)
            az = rng.normal(0, sp)
            s = SPEED * (1 + rng.normal(0, 0.3 * sp))     # the aim knob scatters speed too, not just angle
            dirx = -side
            births.append(tk + rng.normal(0, 0.004))
            p0.append([X_CROSS + side * HALF_GAP, NOZZLE_Y, 0.0])
            v0.append([dirx * s * np.cos(el) * np.cos(az), s * np.sin(el), s * np.cos(el) * np.sin(az)])
            mass.append(m_bin * np.exp(rng.uniform(-0.2, 0.2)))
    return np.array(births), np.array(p0, float), np.array(v0, float), np.array(mass)


def simulate(births, p0, v0, mass, collide=True):
    n = len(mass)
    rad = radius(mass)
    pos = p0.copy()
    vel = v0.copy()
    alive = np.ones(n, bool)
    t = 0.0
    plate, clacks, paths = [], [], [[] for _ in range(n)]
    hit_count = np.zeros(n, int)
    checks = {"max_momentum_err": 0.0, "max_energy_err": 0.0}
    steps = int(DUR / DT)
    for s in range(steps):
        t += DT
        act = np.where(alive & (births <= t))[0]
        if len(act) == 0:
            continue
        v = vel[act]
        sp = np.linalg.norm(v, axis=1, keepdims=True)
        acc = -(ice.DRAG / mass[act])[:, None] * sp * v
        acc[:, 1] -= ice.G
        vel[act] = v + acc * DT
        pos[act] += vel[act] * DT
        if s % 80 == 0:
            for i in act:
                paths[i].append((round(t, 3), round(pos[i, 0], 3), round(pos[i, 1], 3), round(pos[i, 2], 3)))
        # plate
        for i in act:
            if pos[i, 1] <= rad[i] and vel[i, 1] < 0:
                vn = -vel[i, 1]
                plate.append({"t": t, "x": pos[i, 0], "z": pos[i, 2], "vn": vn, "m": mass[i], "id": int(i),
                              "deflected": int(hit_count[i] > 0)})
                pos[i, 1] = rad[i]
                vel[i, 1] = vn * ice.RESTITUTION
                vel[i, 0] *= 0.8
                vel[i, 2] *= 0.8
                if vel[i, 1] < 0.12:
                    alive[i] = False
        if not collide or len(act) < 2:
            continue
        # grain on grain: every pair that overlaps and is still approaching
        P = pos[act]
        d = P[None, :, :] - P[:, None, :]
        dist = np.linalg.norm(d, axis=2)
        rs = rad[act][:, None] + rad[act][None, :]
        ii, jj = np.where(np.triu(dist < rs, 1))
        for a, b in zip(ii, jj):
            i, j = act[a], act[b]
            nvec = (pos[j] - pos[i]) / max(np.linalg.norm(pos[j] - pos[i]), 1e-9)   # from i to j
            vrel = np.dot(vel[i] - vel[j], nvec)                                   # closing speed
            if vrel <= 0:
                continue
            m1, m2 = mass[i], mass[j]
            m_eff = m1 * m2 / (m1 + m2)
            J = (1 + E_GRAIN) * m_eff * vrel
            p_before = m1 * vel[i] + m2 * vel[j]
            ke_before = 0.5 * m1 * vel[i] @ vel[i] + 0.5 * m2 * vel[j] @ vel[j]
            vel[i] -= (J / m1) * nvec
            vel[j] += (J / m2) * nvec
            p_after = m1 * vel[i] + m2 * vel[j]
            ke_after = 0.5 * m1 * vel[i] @ vel[i] + 0.5 * m2 * vel[j] @ vel[j]
            ke_expected = 0.5 * (1 - E_GRAIN ** 2) * m_eff * vrel ** 2
            checks["max_momentum_err"] = max(checks["max_momentum_err"],
                                              float(np.linalg.norm(p_after - p_before) / np.linalg.norm(p_before)))
            checks["max_energy_err"] = max(checks["max_energy_err"],
                                            float(abs((ke_before - ke_after) - ke_expected) / ke_expected))
            clacks.append({"t": t, "c1": pos[i].copy(), "c2": pos[j].copy(), "n": nvec, "vn": vrel,
                           "m1": m1, "m2": m2, "r1": rad[i], "r2": rad[j], "J": J,
                           "ids": (int(i), int(j)), "cascade": int(hit_count[i] > 0 or hit_count[j] > 0),
                           "ke_lost": ke_before - ke_after})
            hit_count[i] += 1
            hit_count[j] += 1
    return plate, clacks, paths, hit_count, checks


# ---------------------------------------------------------------- the clack, heard in air
NFFT_C = 4096
FREQS_C = np.fft.rfftfreq(NFFT_C, 1 / SR)
OMEGA_C = 2 * np.pi * FREQS_C
LP_C = 1.0 / (1.0 + (FREQS_C / 18000.0) ** 8)


def clack_spectrum(ev, mic, t_ref):
    """Two compact spheres pushed apart by a half-sine contact force.
    Each radiates a dipole: p = rho0 R^3 / (2 c r) cos(theta) dA/dt, and R^3 A = 3F / (4 pi rho_ice),
    so each ball contributes (3 rho0 / (8 pi rho_ice c)) cos(theta)/r d/dt F(t - r/c).
    Ball 1 is pushed along -n, ball 2 along +n. Their sum is the clack; nothing else is added."""
    tc = hertz_contact_time(ev["m1"], ev["m2"], ev["r1"], ev["r2"], ev["vn"])
    # force pulse F(t) = F0 sin(pi t / tc), with area J  ->  F0 = J pi / (2 tc)
    F = ev["J"] * (np.pi / (2 * tc)) * ice.halfsine_spectrum(FREQS_C, tc) * np.exp(-1j * OMEGA_C * tc / 2)
    k0 = 3 * RHO_AIR / (8 * np.pi * RHO_ICE * C_AIR)
    P = np.zeros_like(FREQS_C, dtype=complex)
    for centre, sign in ((ev["c1"], -1.0), (ev["c2"], +1.0)):
        rv = mic - centre
        r = np.linalg.norm(rv)
        cos_t = np.dot(ev["n"], rv) / r
        delay = ev["t"] + r / C_AIR - t_ref
        P += sign * k0 * cos_t / r * (1j * OMEGA_C) * F * np.exp(-1j * OMEGA_C * delay)
    return P * LP_C, tc


def render(plate, clacks, air_gain=AIR_GAIN):
    total = int(SR * DUR)
    ice_y = np.zeros((total, 2))
    air_y = np.zeros((total, 2))
    for ev in plate:
        n0 = int(ev["t"] * SR)
        for ch, pk in enumerate(ice.PICKUPS):
            X, _ = ice.impact_spectrum(ev, pk, True)
            h = np.fft.irfft(X, n=ice.NFFT) * SR
            n1 = min(total, n0 + ice.NFFT)
            if n0 < total:
                ice_y[n0:n1, ch] += h[: n1 - n0]
    for ev in clacks:
        for ch, mic in enumerate(AIR_MICS):
            r_near = min(np.linalg.norm(mic - ev["c1"]), np.linalg.norm(mic - ev["c2"]))
            n0 = int((ev["t"] + r_near / C_AIR) * SR) - 256
            P, _ = clack_spectrum(ev, mic, n0 / SR)
            h = np.fft.irfft(P, n=NFFT_C) * SR
            n1 = min(total, n0 + NFFT_C)
            if 0 <= n0 < total:
                air_y[n0:n1, ch] += h[: n1 - n0]
    return ice_y, air_y * air_gain


def write_wav_scaled(path, y, scale):
    ints = np.clip(y * scale * 32767, -32768, 32767).astype(np.int16)
    with wave.open(str(path), "w") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(ints.tobytes())


# ---------------------------------------------------------------- figure
def figure(y, paths, clacks, plate, path):
    W, H1, H2 = 1400, 300, 480
    img = np.zeros((H1 + H2 + 10, W, 3))
    img[:] = (10, 10, 15)
    x0, x1 = 3.5, 12.5                                   # zoom on the crossing
    X = lambda x: (x - x0) / (x1 - x0) * W
    Y = lambda h: H1 - 14 - h / 2.2 * (H1 - 28)
    hit = {i for c in clacks for i in c["ids"]}
    for i, p in enumerate(paths):
        pts = np.array(p)
        if len(pts) < 2:
            continue
        col = ice.amber_ramp(0.75) if i in hit else np.array([70, 62, 52.0])
        for a in np.linspace(0, len(pts) - 1, len(pts) * 6):
            j = int(a); u = a - j; k2 = min(j + 1, len(pts) - 1)
            px = int(X(pts[j, 1] * (1 - u) + pts[k2, 1] * u)); py = int(Y(pts[j, 2] * (1 - u) + pts[k2, 2] * u))
            if 0 <= px < W and 0 <= py < H1:
                img[py, px] = np.maximum(img[py, px], col)
    img[H1 - 13, :] = (74, 74, 94)
    for c in clacks:                                     # clack points, near-white crosses
        mid = (c["c1"] + c["c2"]) / 2
        px, py = int(X(mid[0])), int(Y(mid[1]))
        for dd in range(-4, 5):
            for (qx, qy) in ((px + dd, py), (px, py + dd)):
                if 0 <= qx < W and 0 <= qy < H1:
                    img[qy, qx] = (250, 236, 200)
    for nx in (X_CROSS - HALF_GAP, X_CROSS + HALF_GAP):  # nozzles
        px = int(X(nx)); img[H1 - 22:H1 - 13, px - 1:px + 2] = (232, 184, 74)
    x = y[:, 0]
    hop, win = 128, 1024
    frames = (len(x) - win) // hop
    wnd = np.hanning(win)
    spec_ = np.array([np.abs(np.fft.rfft(x[i * hop:i * hop + win] * wnd)) for i in range(frames)])
    db = 20 * np.log10(spec_ + 1e-9)
    db = (db - (db.max() - 66)) / 66
    fbin = np.fft.rfftfreq(win, 1 / SR)
    rows = np.geomspace(16000, 60, H2)
    cols = np.linspace(0, frames - 1, W).astype(int)
    img[H1 + 10:, :] = ice.amber_ramp(db[cols][:, np.searchsorted(fbin, rows)].T)
    # a clack is ~0.1 ms, too short to read among the chirps: tick its arrival at the left air mic
    img[H1:H1 + 10, :] = (10, 10, 15)
    for c in clacks:
        ta = c["t"] + np.linalg.norm(AIR_MICS[0] - (c["c1"] + c["c2"]) / 2) / C_AIR
        px = int((ta * SR - win / 2) / hop / (frames - 1) * (W - 1))
        if 0 <= px < W:
            img[H1 + 1:H1 + 9, max(px - 1, 0):px + 2] = (250, 236, 200)
    ice.png_write(path, img)


# ---------------------------------------------------------------- checks
def directivity():
    """One head-on clack, mic on a 5 m circle. The two balls' dipoles oppose; how loud at each angle?"""
    m = ice.M0
    r = radius(m)
    out = []
    for deg in (0, 30, 45, 60, 75, 90):
        th = np.radians(deg)
        ev = {"t": 0.0, "c1": np.array([-r, 0, 0]), "c2": np.array([r, 0, 0]), "n": np.array([1.0, 0, 0]),
              "vn": 6.0, "m1": m, "m2": m, "r1": r, "r2": r, "J": (1 + E_GRAIN) * (m / 2) * 6.0}
        mic = 5.0 * np.array([np.cos(th), np.sin(th), 0.0])
        P, tc = clack_spectrum(ev, mic, 0.0)
        h = np.fft.irfft(P, n=NFFT_C) * SR
        out.append((deg, float(np.sqrt(np.mean(h ** 2))), float(np.max(np.abs(h))), tc))
    ref = out[0][1]
    return [(d, 20 * np.log10(max(rms, 1e-30) / ref), pk, tc) for d, rms, pk, tc in out]


def onset_stats(plate):
    t = np.sort([e["t"] for e in plate])
    ioi = np.diff(t)
    return len(t), float(np.std(ioi) / np.mean(ioi))


if __name__ == "__main__":
    t_start = time.time()
    rng = np.random.default_rng(5)
    launches = launch(rng)
    plate_pass, _, paths_pass, _, _ = simulate(*launches, collide=False)
    plate_hit, clacks, paths_hit, hits, checks = simulate(*launches, collide=True)
    n = len(launches[3])

    # render both with one shared scale
    ice_p, _ = render(plate_pass, [])
    ice_h, air_h = render(plate_hit, clacks)
    y_pass = ice_p
    y_hit = ice_h + air_h
    scale = 10 ** (-1 / 20) / max(np.max(np.abs(y_pass)), np.max(np.abs(y_hit)))
    write_wav_scaled(HERE / f"{STAMP}-grains-04-crossing-pass-through.wav", y_pass, scale)
    write_wav_scaled(HERE / f"{STAMP}-grains-05-crossing-collide.wav", y_hit, scale)
    figure(y_hit, paths_hit, clacks, plate_hit, HERE / f"{STAMP}-grains-that-meet.png")

    # ---- numbers
    print(f"particles {n}  ({n // 2} paired shots over {EMIT_FOR}s)")
    print(f"grain radius: 4 g {radius(0.004)*100:.2f} cm · 10 g {radius(0.010)*100:.2f} cm · 40 g {radius(0.040)*100:.2f} cm")
    print(f"plate strikes: pass-through {len(plate_pass)}  collide {len(plate_hit)}")
    print(f"clacks {len(clacks)}  grains that met at least once {int((hits > 0).sum())}/{n}  "
          f"cascades (a grain already hit, hit again) {sum(c['cascade'] for c in clacks)}")
    half = EMIT_FOR / 2 + 0.5
    early = sum(1 for c in clacks if c["t"] < half)
    print(f"clacks in the loose-aim half {early}, tight-aim half {len(clacks) - early}")
    tcs = [hertz_contact_time(c["m1"], c["m2"], c["r1"], c["r2"], c["vn"]) for c in clacks]
    if tcs:
        print(f"Hertz contact time grain-on-grain: {min(tcs)*1e6:.0f}-{max(tcs)*1e6:.0f} us "
              f"(median {np.median(tcs)*1e6:.0f}), closing speeds {min(c['vn'] for c in clacks):.2f}-{max(c['vn'] for c in clacks):.2f} m/s")
    print(f"collision bookkeeping: max momentum error {checks['max_momentum_err']:.1e}, "
          f"max energy-loss error vs (1-e^2)/2 m_eff v^2 {checks['max_energy_err']:.1e}")
    # where grains land (first plate strike per grain)
    def first_landing(plate):
        seen = {}
        for e in sorted(plate, key=lambda e: e["t"]):
            seen.setdefault(e["id"], np.hypot(e["x"] - 0, e["z"]))
        return np.array(list(seen.values()))
    lp, lh = first_landing(plate_pass), first_landing(plate_hit)
    sweep = lambda r: r / (2 * np.sqrt(ice.C * 2 * np.pi * 150)) - r / (2 * np.sqrt(ice.C * 2 * np.pi * 8000))
    print(f"first landing distance  pass {lp.mean():.2f}±{lp.std():.2f} m   collide {lh.mean():.2f}±{lh.std():.2f} m")
    print(f"chirp sweep (8k->150 Hz) pass {sweep(lp).mean()*1e3:.0f}±{sweep(lp).std()*1e3:.0f} ms   "
          f"collide {sweep(lh).mean()*1e3:.0f}±{sweep(lh).std()*1e3:.0f} ms")
    zp = np.array([abs(e["z"]) for e in plate_pass]); zh = np.array([abs(e["z"]) for e in plate_hit])
    print(f"sideways scatter |z| at strikes  pass {zp.mean():.2f} m   collide {zh.mean():.2f} m")
    npp, cvp = onset_stats(plate_pass); nph, cvh = onset_stats(plate_hit)
    print(f"strike-onset irregularity (CV of gaps)  pass {cvp:.2f}   collide {cvh:.2f}")
    defl = sum(e["deflected"] for e in plate_hit)
    print(f"plate strikes from a deflected grain {defl}/{len(plate_hit)}")
    ke_lost = sum(c["ke_lost"] for c in clacks)
    print(f"energy lost in grain-on-grain contact {ke_lost:.3f} J")
    # layer levels
    rms = lambda a: float(np.sqrt(np.mean(a ** 2)))
    pk_ice = [np.max(np.abs(ice_p[int(e["t"] * SR):int(e["t"] * SR) + 2400])) for e in plate_pass[:200]]
    pk_air = [np.max(np.abs(air_h[int(c["t"] * SR):int(c["t"] * SR) + 2400])) for c in clacks]
    print(f"median event peak: plate strike {np.median(pk_ice):.3e}   clack {np.median(pk_air):.3e} (after AIR_GAIN)")
    print(f"level, collide render: ice layer rms {20*np.log10(rms(ice_h)*scale):.1f} dBFS, "
          f"air layer rms {20*np.log10(rms(air_h)*scale+1e-12):.1f} dBFS, "
          f"air peak {20*np.log10(np.max(np.abs(air_h))*scale):.1f} dBFS")
    print("directivity of one head-on clack at 5 m (10 g + 10 g, 6 m/s):")
    for d, db_, pk, tc in directivity():
        print(f"   {d:3d} deg  {db_:7.1f} dB re on-axis   peak {pk:.3e} Pa   Tc {tc*1e6:.0f} us")

    # test vector for the lesson's JS port: a handful of clacks, exact waveform at the left mic
    tv = []
    for c in clacks[:6]:
        mic = AIR_MICS[0]
        r_near = min(np.linalg.norm(mic - c["c1"]), np.linalg.norm(mic - c["c2"]))
        t_ref = c["t"] + r_near / C_AIR - 256 / SR
        P, tc = clack_spectrum(c, mic, t_ref)
        h = np.fft.irfft(P, n=NFFT_C) * SR
        tv.append({"c1": c["c1"].tolist(), "c2": c["c2"].tolist(), "n": c["n"].tolist(), "vn": c["vn"],
                   "m1": c["m1"], "m2": c["m2"], "r1": c["r1"], "r2": c["r2"], "J": c["J"],
                   "mic": mic.tolist(), "lead": 256, "tc": tc, "h": h[:768].tolist()})
    Path(__file__).with_name(f"{STAMP}-grains-clack-testvector.json").write_text(json.dumps(tv))
    print(f"done in {time.time() - t_start:.1f}s")
