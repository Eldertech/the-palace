# Renders what the screen shows, frame by frame, in each view of study v1.2,
# from the page's own code run headless (worklet via ../offline-v1/run_worklet.mjs,
# replay playback via replay_probe.mjs).
#   screen-time-four-views.png : 2 s of screen frames per view, stacked as rows
#   screen-replay.html         : the same frames, animated, no Three.js, no network
import json, subprocess, os, base64, zlib, struct, numpy as np
from measure_strobe import run, note, LOWLOSS, V12, SCR, HERE

F0, SECONDS = 196.0, 4.0
def frames(view, stiff):
    ev = note(F0, stiff, 0.13, 'strike', view=view, **LOWLOSS)
    if view != 'replay':
        _, w, m, _ = run(V12, ev, SECONDS + 0.05, 'sv')
        return w[:int(SECONDS * 60)]
    run(V12, ev, 0.05, 'sr')
    subprocess.run(['node', os.path.join(HERE, 'replay_probe.mjs'), V12, f'{SCR}/sr_vis.f32.replay.f32', '2.0', str(SECONDS), f'{SCR}/srf.f32'],
                   check=True, capture_output=True)
    return np.fromfile(f'{SCR}/srf.f32', dtype=np.float32).reshape(-1, 180)

LANES = [('live', 0.0, 'live · stiffness 0 · the string right now, 60 times a second'),
         ('strobe', 0.0, 'strobe · stiffness 0 · the string now, caught a whole number of cycles + 1/120 later each frame'),
         ('strobe', 1.0, 'strobe · stiffness 1 · a stiff string has no single period, so the strobe churns'),
         ('replay', 1.0, 'replay · stiffness 1 · the first three cycles, recorded at every sample, played slowly')]
data = [frames(v, s) for v, s, _ in LANES]

# ---- still: first 2 s of screen time, one row per frame ------------------
bg = np.array([10, 10, 15.]); pos = np.array([255, 122, 61.]); neg = np.array([138, 122, 208.])
def colour(w):
    t = w / (np.abs(w).max(axis=1, keepdims=True) + 1e-12)   # each row to its own peak: decay divided out
    s = np.abs(t)[..., None] ** 0.55
    return np.where(t[..., None] >= 0, bg + (pos - bg) * s, bg + (neg - bg) * s)
panels = [np.repeat(np.repeat(colour(w[:120]), 2, axis=1), 3, axis=0) for w in data]
gap = np.tile(bg, (360, 14, 1))
img = panels[0]
for p in panels[1:]: img = np.concatenate([img, gap, p], axis=1)
img = img.astype(np.uint8); h, w_, _ = img.shape
raw = b''.join(b'\x00' + img[y].tobytes() for y in range(h))
chunk = lambda t, d: struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
png = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', w_, h, 8, 2, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b'')
open(os.path.join(HERE, 'screen-time-four-views.png'), 'wb').write(png)
print('png', w_, h)

# ---- animated replay of the same frames ------------------------------------
lanes = []
for (v, s, cap), w in zip(LANES, data):
    peak = float(np.abs(w).max())
    q = np.clip(np.round(w / peak * 127), -127, 127).astype(np.int8)
    lanes.append({'caption': cap, 'b64': base64.b64encode(q.tobytes()).decode()})
tpl = r"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Waveguide Study · four views, frame by frame</title>
<style>
  html, body { margin:0; background:#0a0a0f; color:#c8c8d8; font-family: ui-monospace, Menlo, monospace; }
  main { max-width: 880px; margin: 0 auto; padding: 18px 16px 12px; }
  h1 { font-size: 13px; letter-spacing: .06em; color:#e8e8f0; margin: 0 0 4px; font-weight: 500; }
  p.sub { font-size: 11px; color:#8a8aa0; margin: 0 0 12px; line-height: 1.5; }
  .lane { margin: 0 0 10px; }
  .lane .cap { font-size: 11px; color:#8a8aa0; margin: 0 0 3px; }
  canvas { display:block; width:100%; height:92px; background:#12121a; border:1px solid #1a1a28; border-radius:3px; }
  .bar { display:flex; gap:10px; align-items:center; font-size:11px; color:#8a8aa0; margin: 4px 0 0; }
  button { background:#1a1a28; color:#e8e8f0; border:1px solid #7a6030; padding:5px 12px; font:inherit; border-radius:3px; cursor:pointer; }
  footer { font-size: 11px; color:#4a4a5a; text-align:right; margin-top: 10px; letter-spacing: .06em; }
</style></head>
<body><main>
<h1>waveguide · study · strobe &mdash; what the screen shows, frame by frame</h1>
<p class="sub">One 196 Hz string, struck near the nut (left); bridge at the right. Every frame below was produced headless by the page's own code: 60 frames a second, four seconds. Orange line = the delay-line state, the same numbers the speaker hears at the pickup. Each lane is scaled to its own loudest frame.</p>
<div id="lanes"></div>
<div class="bar"><button id="play">pause</button><span id="t"></span></div>
<footer>Loud&rsquo;n Live</footer>
</main>
<script>
const LANES = /*LANES*/[];
const FRAMES = /*FRAMES*/0, N = 180;
const decoded = LANES.map(l => { const b = atob(l.b64), a = new Int8Array(b.length); for (let i = 0; i < b.length; i++) a[i] = (b.charCodeAt(i) << 24) >> 24; return a; });
const cvs = LANES.map(l => {
  const d = document.createElement('div'); d.className = 'lane';
  d.innerHTML = '<div class="cap"></div><canvas></canvas>'; d.firstChild.textContent = l.caption;
  document.getElementById('lanes').appendChild(d); return d.querySelector('canvas');
});
let playing = true, t = 0, last = performance.now();
document.getElementById('play').onclick = (e) => { playing = !playing; e.target.textContent = playing ? 'pause' : 'play'; };
function draw() {
  const now = performance.now(); if (playing) t += (now - last) / 1000; last = now;
  const j = Math.floor(t * 60) % FRAMES;
  cvs.forEach((c, k) => {
    const w = c.clientWidth, h = c.clientHeight, dpr = window.devicePixelRatio || 1;
    if (c.width !== w * dpr) { c.width = w * dpr; c.height = h * dpr; }
    const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
    g.strokeStyle = '#22222e'; g.beginPath(); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.stroke();
    g.strokeStyle = '#ff7a3d'; g.lineWidth = 1.5; g.beginPath();
    const a = decoded[k], o = j * N;
    for (let i = 0; i < N; i++) { const x = i / (N - 1) * w, y = h / 2 - a[o + i] / 127 * (h * 0.44); i ? g.lineTo(x, y) : g.moveTo(x, y); }
    g.stroke();
  });
  document.getElementById('t').textContent = 'frame ' + (j + 1) + ' of ' + FRAMES + ' · ' + (j / 60).toFixed(2) + ' s of screen time';
  requestAnimationFrame(draw);
}
requestAnimationFrame(draw);
</script>
</body></html>
"""
html = tpl.replace('/*LANES*/[]', json.dumps(lanes)).replace('/*FRAMES*/0', str(int(SECONDS * 60)))
open(os.path.join(HERE, 'screen-replay.html'), 'w').write(html)
print('html bytes', len(html))
