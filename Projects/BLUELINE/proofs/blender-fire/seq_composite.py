#!/usr/bin/env python3
"""
BLUELINE blender-fire — composite the animated holdout flame sequence over the shot-02 drawing as a
forward loop. Each transparent flame frame is screen-blended onto the ink (cinematic-glow register),
then a crossfade closes the loop. Output: a GIF + a light MP4.

  <comfy venv>/python seq_composite.py
"""
import os, glob
import numpy as np
from PIL import Image, ImageChops

HERE = os.path.dirname(os.path.abspath(__file__)); REND = os.path.join(HERE, "renders")
SHOT = os.path.join(HERE, "..", "new-story", "out", "02_hero-on-sedan-pointing.png")
XF, GIF_W = 10, 560
NUDGE_Y = int(os.environ.get("NUDGE_Y", "150"))   # +down: lower the fire to line up with the drawing's car

shot = Image.open(SHOT).convert("RGB"); W, H = shot.size
shot_arr = np.asarray(shot, dtype=np.float32)
hm = np.asarray(Image.open(os.path.join(REND, "hero_mask_feather.png")).convert("L"), dtype=np.float32) / 255.0
hm3 = hm[..., None]                                   # the REAL hero outline → he occludes the fire
fs = sorted(glob.glob(os.path.join(REND, "seq", "flame_*.png")))
print("flame frames:", len(fs))

comp = []
for f in fs:
    fl = Image.open(f).convert("RGBA")
    fl = fl.resize((W, int(fl.height * W / fl.width)), Image.LANCZOS)
    canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0)); canvas.alpha_composite(fl, (0, NUDGE_Y))   # position over the car
    flat = Image.new("RGB", (W, H), (0, 0, 0)); flat.paste(canvas.convert("RGB"), (0, 0), canvas.split()[3])
    fired = np.asarray(ImageChops.screen(shot, flat), dtype=np.float32)
    comp.append(fired * (1 - hm3) + shot_arr * hm3)   # restore the real hero on top → fire behind him

N = len(comp); body = [c.copy() for c in comp[:N - XF]]
for i in range(XF):                                   # crossfade tail into head → forward loop
    w = 1.0 - (i + 1) / (XF + 1)
    body[i] = comp[N - XF + i] * w + body[i] * (1 - w)
frames = [Image.fromarray(np.clip(b, 0, 255).astype("uint8")) for b in body]

g = [im.resize((GIF_W, int(im.height * GIF_W / im.width)), Image.LANCZOS) for im in frames]
out = os.path.join(REND, "fire_anim_composite.gif")
g[0].save(out, save_all=True, append_images=g[1:], duration=66, loop=0)
print("WROTE", out, len(g), "frames")
