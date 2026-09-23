#!/usr/bin/env python3
"""
Slime Mold Delay — headless Physarum topology engine + offline FDN render.
Cycle 8 (2026-09-15). Grant: STAGE-4-DYNAMICS — tip-extension probes,
retraction, total-length budget; engine stays headless (no browser, no audio
device). Everything here runs to a WAV, a PNG and a CSV you can diff.

Rules implemented (Tero/Nakagaki-flavoured, audio-adapted):
  flux_e      = |RMS of the signal that tube e delivered this tick|
  dD_e        = alpha*(flux_e - mean_flux) - beta*D_e        (reinforce / decay)
  prune       if D_e < eps for tau ticks  -> retraction ramp over R ticks, then cut
  tip probe   P_spawn = gamma * headroom,  headroom = 1 - used_length/budget
  capture     a probe whose tip lands within r_cap of a food node becomes a tube
  budget      sum(length) <= L_max ; overflow prunes the lowest-flux tube first

Audio: one delay line per tube, block-rate (30 Hz) control, sample-rate
feedback inside the line. Diameters are linearly ramped across each block, so
spawns and retractions are click-free by construction.
"""
import math, os, struct, sys, wave, zlib
import numpy as np

SR        = 48000
TICK_HZ   = 30
BLOCK     = SR // TICK_HZ           # 1600 samples
DUR_S     = 24.0
TICKS     = int(DUR_S * TICK_HZ)
RNG       = np.random.default_rng(20260915)

# --- dish -------------------------------------------------------------------
FOOD = [(0.18, 0.32), (0.30, 0.72), (0.62, 0.22), (0.78, 0.62), (0.88, 0.30)]
SINK = (0.50, 0.50)
NODES = FOOD + [SINK]
SINK_I = len(FOOD)

# --- parameters -------------------------------------------------------------
VELOCITY   = 0.55      # normalized dish-units per second -> delay = length/velocity
D_MIN, D_MAX = 0.02, 0.62
ALPHA, BETA = 0.55, 0.06
EPS, TAU    = 0.045, 12       # starve threshold, ticks below it before retraction
RETRACT     = 9               # ticks of retraction ramp (0.3 s)
GAMMA       = 0.22            # eat pressure
L_MAX       = 2.6             # total tube length budget (dish units)
PROBE_LIFE  = 24              # ticks a probe may wander before it gives up
PROBE_STEP  = 0.022
R_CAP       = 0.075

def dist(a, b): return math.hypot(a[0]-b[0], a[1]-b[1])

# --- tube -------------------------------------------------------------------
class Tube:
    __slots__ = ("a","b","length","dtime","buf","w","D","Dprev","starve","retract",
                 "flux","age","dead")
    def __init__(self, a, b):
        self.a, self.b = a, b
        self.length = dist(NODES[a], NODES[b])
        self.dtime  = max(0.045, self.length / VELOCITY)
        n = int(self.dtime * SR)
        self.buf = np.zeros(n, dtype=np.float32)
        self.w = 0
        self.D = self.Dprev = 0.12
        self.starve = 0; self.retract = -1; self.flux = 0.0; self.age = 0
        self.dead = False

    def process(self, x, fb):
        """x: input block. Returns the delayed block. Feedback is written back in."""
        n = self.buf.size; N = x.size
        idx = (self.w + np.arange(N)) % n
        y = self.buf[idx].copy()
        self.buf[idx] = (x + fb * y).astype(np.float32)
        self.w = (self.w + N) % n
        return y

# --- excitation: plucked food ----------------------------------------------
def pluck(freq, n, decay):
    t = np.arange(n) / SR
    env = np.exp(-t * decay)
    sig = (np.sin(2*np.pi*freq*t) + 0.34*np.sin(2*np.pi*2*freq*t)
           + 0.13*np.sin(2*np.pi*3.01*freq*t))
    sig += 0.25 * RNG.standard_normal(n) * np.exp(-t*90)
    return (sig * env * 0.45).astype(np.float32)

FOOD_HZ = [110.0, 146.83, 220.0, 164.81, 98.0]
def build_sources():
    """Sparse pluck trains per food node, whole render pre-rendered."""
    total = TICKS * BLOCK
    src = [np.zeros(total, dtype=np.float32) for _ in FOOD]
    for i, f in enumerate(FOOD_HZ):
        t = 0.35 + 0.22*i
        while t < DUR_S - 1.0:
            s = int(t*SR); g = pluck(f, min(int(1.4*SR), total-s), 5.5)
            src[i][s:s+g.size] += g
            t += RNG.uniform(1.6, 3.4)
    return src

# --- engine -----------------------------------------------------------------
def run():
    src = build_sources()
    tubes = [Tube(0, SINK_I), Tube(2, SINK_I)]     # the mold starts with two tubes
    probes = []                                     # dicts: from, pos, dir, age
    node_prev = np.zeros((len(NODES), BLOCK), dtype=np.float32)
    outL = np.zeros(TICKS*BLOCK, dtype=np.float32)
    outR = np.zeros(TICKS*BLOCK, dtype=np.float32)
    log = []; frames = []
    spawned = pruned = captured = probes_fired = 0

    for tick in range(TICKS):
        s0 = tick*BLOCK; s1 = s0+BLOCK
        node_in = np.zeros((len(NODES), BLOCK), dtype=np.float32)
        for i in range(len(FOOD)):
            node_in[i] += src[i][s0:s1]
        node_in += node_prev * 0.5           # one-block routing latency, as in a real dish
        node_out = np.zeros_like(node_in)
        sink_acc = np.zeros(BLOCK, dtype=np.float32)
        sink_accR = np.zeros(BLOCK, dtype=np.float32)

        for t in tubes:
            # per-block linear diameter ramp == click-free crossfade
            ramp = np.linspace(t.Dprev, t.D, BLOCK, dtype=np.float32)
            y = t.process(node_in[t.a] * ramp, fb=min(0.72, t.D*1.15))
            t.flux = float(np.sqrt(np.mean(y*y)) + 1e-9)
            if t.b == SINK_I:
                pan = NODES[t.a][0]
                sink_acc  += y * float(math.sqrt(1.0-pan))
                sink_accR += y * float(math.sqrt(pan))
            else:
                node_out[t.b] += y
            t.Dprev = t.D; t.age += 1

        outL[s0:s1] = sink_acc; outR[s0:s1] = sink_accR
        node_prev = node_out

        # ---- Physarum update -------------------------------------------
        if tubes:
            mean_flux = float(np.mean([t.flux for t in tubes]))
            for t in tubes:
                dD = ALPHA*(t.flux - mean_flux)/(mean_flux+1e-6)*0.08 - BETA*t.D*0.08
                t.D = float(np.clip(t.D + dD, 0.0, D_MAX))
                if t.D < EPS: t.starve += 1
                else: t.starve = 0
                if t.starve >= TAU and t.retract < 0:
                    t.retract = RETRACT
            for t in tubes:
                if t.retract > 0:
                    t.D = max(0.0, t.D * (t.retract-1)/t.retract); t.retract -= 1
                elif t.retract == 0:
                    t.dead = True
            n_before = len(tubes)
            tubes = [t for t in tubes if not t.dead]
            pruned += n_before - len(tubes)

        used = sum(t.length for t in tubes)
        # budget overflow: cut the least-used tube (pruning makes room for new growth)
        while used > L_MAX and len(tubes) > 1:
            victim = min(tubes, key=lambda t: t.flux)
            if victim.retract < 0: victim.retract = RETRACT
            used -= victim.length
            break

        # ---- tip extension ---------------------------------------------
        headroom = max(0.0, 1.0 - used / L_MAX)
        if RNG.random() < GAMMA * headroom and len(probes) < 3:
            anchor = max(tubes, key=lambda t: t.flux).a if tubes else 0
            ang = RNG.uniform(0, 2*math.pi)
            probes.append({"anchor": anchor, "pos": list(NODES[anchor]),
                           "dir": [math.cos(ang), math.sin(ang)], "age": 0,
                           "trail": [tuple(NODES[anchor])]})
            probes_fired += 1

        still = []
        for p in probes:
            # wander with slight drift toward the nearest unconnected food
            connected = {t.a for t in tubes} | {t.b for t in tubes}
            targets = [i for i in range(len(FOOD)) if i not in connected]
            if targets:
                tgt = min(targets, key=lambda i: dist(p["pos"], NODES[i]))
                vx = NODES[tgt][0]-p["pos"][0]; vy = NODES[tgt][1]-p["pos"][1]
                m = math.hypot(vx, vy) + 1e-9
                p["dir"][0] = 0.82*p["dir"][0] + 0.18*vx/m
                p["dir"][1] = 0.82*p["dir"][1] + 0.18*vy/m
            p["dir"][0] += RNG.normal(0, 0.10); p["dir"][1] += RNG.normal(0, 0.10)
            m = math.hypot(*p["dir"]) + 1e-9
            p["dir"] = [p["dir"][0]/m, p["dir"][1]/m]
            p["pos"][0] += p["dir"][0]*PROBE_STEP
            p["pos"][1] += p["dir"][1]*PROBE_STEP
            p["pos"][0] = min(0.98, max(0.02, p["pos"][0]))
            p["pos"][1] = min(0.98, max(0.02, p["pos"][1]))
            p["trail"].append(tuple(p["pos"])); p["age"] += 1
            hit = None
            for i in range(len(NODES)):
                if i == p["anchor"]: continue
                if dist(p["pos"], NODES[i]) < R_CAP: hit = i; break
            if hit is not None:
                exists = any((t.a, t.b) == (p["anchor"], hit) for t in tubes)
                if not exists and sum(x.length for x in tubes) + dist(NODES[p["anchor"]], NODES[hit]) <= L_MAX*1.15:
                    nt = Tube(p["anchor"], hit); nt.D = nt.Dprev = 0.0
                    nt.D = 0.10                     # ramps up from 0 over the next block
                    tubes.append(nt); spawned += 1; captured += 1
                continue                            # probe consumed either way
            if p["age"] < PROBE_LIFE: still.append(p)
        probes = still

        log.append((tick, len(tubes), len(probes), round(used,3), spawned, pruned,
                    round(float(np.mean([t.flux for t in tubes])) if tubes else 0.0, 5)))
        if tick in (30, 180, 420, TICKS-1):
            frames.append((tick, [(t.a, t.b, t.D) for t in tubes],
                           [list(p["trail"]) for p in probes]))

    # normalize + write
    peak = max(1e-6, float(max(np.abs(outL).max(), np.abs(outR).max())))
    outL = np.tanh(outL / peak * 1.35) * 0.89
    outR = np.tanh(outR / peak * 1.35) * 0.89
    return outL, outR, log, frames, dict(spawned=spawned, pruned=pruned,
                                         captured=captured, probes=probes_fired,
                                         final_tubes=len(tubes))

# --- writers ----------------------------------------------------------------
def write_wav(path, L, R):
    data = np.stack([L, R], axis=1)
    pcm = (np.clip(data, -1, 1) * 32767).astype("<i2").tobytes()
    with wave.open(path, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm)

def write_png(path, rgb):
    h, w, _ = rgb.shape
    raw = b"".join(b"\x00" + rgb[y].tobytes() for y in range(h))
    def chunk(tag, data):
        return (struct.pack(">I", len(data)) + tag + data +
                struct.pack(">I", zlib.crc32(tag + data) & 0xffffffff))
    png = (b"\x89PNG\r\n\x1a\n"
           + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0))
           + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b""))
    open(path, "wb").write(png)

def draw(frames, path):
    PW, PH, PAD = 480, 300, 8
    cols = len(frames)
    cv = np.zeros((PH, PW*cols, 3), dtype=np.float32)
    cv[:, :, 0] = 0.055; cv[:, :, 1] = 0.078; cv[:, :, 2] = 0.062
    def splat(ox, x, y, rgb, r=1.6, a=1.0):
        px, py = ox + x*(PW-2*PAD)+PAD, y*(PH-2*PAD)+PAD
        x0, x1 = int(px-r-1), int(px+r+2); y0, y1 = int(py-r-1), int(py+r+2)
        for yy in range(max(0,y0), min(PH,y1)):
            for xx in range(max(0,x0), min(PW*cols,x1)):
                d = math.hypot(xx-px, yy-py)
                if d <= r+1:
                    k = a*max(0.0, 1.0 - d/(r+1))
                    cv[yy, xx] = cv[yy, xx]*(1-k) + np.array(rgb)*k
    def line(ox, p, q, rgb, r, a):
        n = max(2, int(dist(p,q)*420))
        for i in range(n):
            t = i/(n-1)
            splat(ox, p[0]+(q[0]-p[0])*t, p[1]+(q[1]-p[1])*t, rgb, r, a)
    for k, (tick, edges, trails) in enumerate(frames):
        ox = k*PW
        for tr in trails:
            for i in range(1, len(tr)):
                line(ox, tr[i-1], tr[i], (0.42,0.40,0.20), 0.8, 0.55)
        for a, b, D in edges:
            w = 0.9 + 5.0*D; al = 0.30 + 1.1*D
            line(ox, NODES[a], NODES[b], (0.82,0.72,0.28), w, min(1.0, al))
        for i, f in enumerate(FOOD):
            splat(ox, f[0], f[1], (0.95,0.83,0.27), 4.2, 1.0)
        splat(ox, SINK[0], SINK[1], (0.86,0.29,0.29), 4.6, 1.0)
        for x in range(PW):        # frame divider
            cv[0, ox+x] = cv[PH-1, ox+x] = np.array([0.16,0.23,0.18])
        for y in range(PH):
            cv[y, ox] = np.array([0.16,0.23,0.18])
    write_png(path, (np.clip(cv,0,1)*255).astype(np.uint8))

if __name__ == "__main__":
    here = os.path.dirname(os.path.abspath(__file__))
    L, R, log, frames, stats = run()
    write_wav(os.path.join(here, "slime-mold-headless-24s.wav"), L, R)
    draw(frames, os.path.join(here, "slime-mold-growth-frames.png"))
    with open(os.path.join(here, "growth-log.csv"), "w") as f:
        f.write("tick,tubes_alive,probes_alive,used_length,spawned,pruned,mean_flux\n")
        for row in log: f.write(",".join(str(x) for x in row) + "\n")
    print("stats:", stats)
    ticks_ok = [r for r in log if r[1] > 0]
    print("ticks with >=1 tube:", len(ticks_ok), "/", len(log))
    print("peak L/R:", float(np.abs(L).max()), float(np.abs(R).max()))
    print("max used length:", max(r[3] for r in log), "budget:", L_MAX)
