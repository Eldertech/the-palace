#!/usr/bin/env python3
"""
BLUELINE — Text Layer × gen-AI: how a BALLOON and diffusion can interact.

The balloon catalog gave us shapes with correct tails. The Lettering specialist gives us
gen-AI-guided letterforms (text as a canny guide). This bench crosses them — four ways a
balloon and diffusion meet, each a different answer to "what does the gen-AI touch?":

  A  STYLED BOX     — gen-AI makes the CONTAINER a material (torn ink paper, soft cotton);
                      the letters stay crisp and locked, composited inside. (box gets style)
  B  ESCAPE         — gen-AI TEXT (material register) overflows a smaller balloon — the
                      energy bursts the bubble. (text escapes the box)
  C  CLIP           — gen-AI text CLIPPED to the balloon interior — contained energy.
  D  MIND-WINDOW    — the interior is a generated ATMOSPHERE (storm / dawn): the speaker's
                      inner weather as subtext behind the crisp words. (box = a window in)

Reuses: balloon_lib (masks/tails), render_text (ComfyUI graph/run for new gens), and the
EXISTING on-black text renders in out/ for B/C (inverted to ink-on-white). Only the new
materials + atmospheres are generated (cached). Local ComfyUI must be up (127.0.0.1:8188).

Run:  <comfy venv>/python balloon_genai.py
Out:  balloons-genai/<exemplar>_<mode>.png  + contact.html
"""
import os, sys
import numpy as np
import cv2
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
RIG = os.path.join(HERE, "..", "blender-handdrawn", "followups", "rig-openpose")
sys.path.insert(0, os.path.abspath(RIG))
sys.path.insert(0, HERE)
import balloon_lib as B
import render_text as RT

OUT = os.path.join(HERE, "balloons-genai"); os.makedirs(OUT, exist_ok=True)
GEN = os.path.join(OUT, "gen"); os.makedirs(GEN, exist_ok=True)
W, H = RT.R["size"]
S = B.S

# ---- exemplars: emotion → balloon style, reused ink render, material + atmosphere prompts
EX = {
    "fury": dict(
        style="shout-spiky", text="NO",
        ink=os.path.join(HERE, "out", "shout-no_stylize_s1111.png"),
        material="extreme close-up of torn crumpled black sumi-ink paper, harsh aggressive "
                 "brush wash, ragged deckled edges, high contrast, white background",
        atmosphere="turbulent black storm clouds and forked lightning over a churning sea, "
                   "violent, ominous, dramatic ink-wash painting"),
    "fading": dict(
        style="whisper-dashed", text="stay",
        ink=os.path.join(HERE, "out", "whisper-stay_stylize_s1111.png"),
        material="soft handmade cotton paper, faint pale grey watercolor bloom, gentle "
                 "deckled edge, delicate, muted, nearly white",
        atmosphere="soft dawn light through pale drifting mist, calm fading horizon, "
                   "ethereal, tender, watercolor, very light"),
}


# ---- gen (cached) ----------------------------------------------------------------
def gen(prompt, seed, prefix, dest):
    if os.path.exists(dest):
        print("  cached", os.path.basename(dest)); return dest
    wf = RT.graph(prompt + ", detailed, painterly, no text, no words, no letters", seed, prefix)
    dt = RT.run(wf, dest)
    print(f"  gen {os.path.basename(dest)} ({dt:.0f}s)"); return dest


# ---- balloon masks (reusing balloon_lib primitives) ------------------------------
def masks(style, center, half, tip):
    cx, cy = center; rx, ry = half
    body = np.zeros((H * S, W * S), np.uint8)
    B.STYLES[style]["body"](body, cx, cy, rx, ry)
    union = body.copy()
    root = B.edge_point(union, center, tip)
    t = B.STYLES[style]["tail"]
    if t == "tri":
        B.add_tail(union, root, tip, 30)
    elif t == "jag":
        B.add_tail(union, root, tip, 34)
        mid = ((root[0] + tip[0]) / 2, (root[1] + tip[1]) / 2)
        B.add_tail(union, root, mid, 18)
    elif t == "droop":
        B.add_tail(union, root, tip, 24, 26)
    body_s = cv2.resize(body, (W, H), interpolation=cv2.INTER_AREA)
    return union, body_s          # union = supersample (for stroke), body_s = downsampled alpha


def put_text(pim, text, center, half, over_image=False, inset=0.82):
    d = ImageDraw.Draw(pim)
    avail = (2 * half[0] - 34) * inset
    sz = 120
    while sz > 16:
        f = B.font(sz)
        l, t, r, b = d.textbbox((0, 0), text, font=f)
        if (r - l) <= avail:
            break
        sz -= 3
    l, t, r, b = d.textbbox((0, 0), text, font=f)
    x, y = center[0] - (r - l) / 2 - l, center[1] - (b - t) / 2 - t
    if over_image:                # legible over any atmosphere: white letters, dark halo
        d.text((x, y), text, font=f, fill=(255, 255, 255),
               stroke_width=4, stroke_fill=(10, 10, 10))
    else:
        d.text((x, y), text, font=f, fill=(15, 15, 15))
    return pim


def ink_on_white(path):
    im = np.array(Image.open(path).convert("RGB").resize((W, H)))
    return 255 - im               # white-energy-on-black -> black-ink-on-white


# ---- the four modes --------------------------------------------------------------
def mode_A(ex, dest):
    """Styled box: material fills the container; crisp locked text on top."""
    mat = np.array(Image.open(ex["_mat"]).convert("RGB").resize((W, H))).astype(np.float32)
    center, half, tip = (W/2, H*0.42), (W*0.34, H*0.19), (W/2 - 60, H*0.80)
    union, body_s = masks(ex["style"], center, half, tip)
    canvas = np.full((H, W, 3), 255, np.float32)
    a = (body_s.astype(np.float32) / 255)[..., None]
    blended = mat * 0.62 + 255 * 0.38          # lighten so text stays readable
    canvas = canvas * (1 - a) + blended * a
    canvas = canvas.astype(np.uint8)
    B.stroke(canvas, union, thick=6)
    pim = put_text(Image.fromarray(canvas), ex["text"], center, half)
    pim.save(dest)

def mode_B(ex, dest):
    """Escape: the gen-AI word (large) overflows a smaller balloon."""
    word = ink_on_white(ex["ink"]).astype(np.uint8)          # black ink on white, fills frame
    center, half, tip = (W/2, H*0.46), (W*0.24, H*0.14), (W/2, H*0.82)
    union, _ = masks(ex["style"], center, half, tip)
    canvas = word.copy()
    B.stroke(canvas, union, thick=5)                          # small bubble; word breaks past it
    Image.fromarray(canvas).save(dest)

def mode_C(ex, dest):
    """Clip: the gen-AI word scaled to fit, clipped to the balloon interior."""
    word = ink_on_white(ex["ink"]).astype(np.uint8)
    center, half, tip = (W/2, H*0.42), (W*0.34, H*0.20), (W/2 - 60, H*0.80)
    # scale the whole word frame down into the body bbox, centered
    bw, bh = int(2*half[0]), int(2*half[1])
    small = cv2.resize(word, (bw, bh))
    placed = np.full((H, W, 3), 255, np.uint8)
    x0, y0 = int(center[0]-bw/2), int(center[1]-bh/2)
    placed[y0:y0+bh, x0:x0+bw] = small
    union, body_s = masks(ex["style"], center, half, tip)
    canvas = np.full((H, W, 3), 255, np.float32)
    a = (body_s.astype(np.float32) / 255)[..., None]
    canvas = canvas * (1 - a) + placed.astype(np.float32) * a       # word only inside body
    canvas = canvas.astype(np.uint8)
    B.stroke(canvas, union, thick=6)
    Image.fromarray(canvas).save(dest)

def mode_D(ex, dest):
    """Mind-window: atmosphere inside the balloon = inner weather; crisp text on top."""
    atmo = np.array(Image.open(ex["_atmo"]).convert("RGB").resize((W, H))).astype(np.float32)
    center, half, tip = (W/2, H*0.42), (W*0.34, H*0.20), (W/2 - 60, H*0.80)
    union, body_s = masks(ex["style"], center, half, tip)
    canvas = np.full((H, W, 3), 255, np.float32)
    a = (body_s.astype(np.float32) / 255)[..., None]
    canvas = canvas * (1 - a) + atmo * a                    # the window into the mind
    canvas = canvas.astype(np.uint8)
    B.stroke(canvas, union, thick=6)
    pim = put_text(Image.fromarray(canvas), ex["text"], center, half, over_image=True)
    pim.save(dest)


def contact():
    order = ["A_styled-box", "B_escape", "C_clip", "D_mind-window"]
    rows = []
    for name, ex in EX.items():
        cells = "".join(
            f'<figure><img src="{name}_{m}.png"><figcaption>{m}</figcaption></figure>'
            for m in order)
        rows.append(f'<section><h2>{name} — "{ex["text"]}" · {ex["style"]}</h2>'
                    f'<div class=row>{cells}</div></section>')
    html = ('<!doctype html><meta charset=utf-8><title>BLUELINE — balloon × gen-AI</title>'
            '<style>body{background:#0b0b0d;color:#e9e7e2;font-family:monospace;padding:24px}'
            'h1{font-family:Anton,Impact,sans-serif}h2{color:#e0a83a;font-size:14px}'
            '.row{display:flex;gap:10px;flex-wrap:wrap}img{height:280px;background:#fff;'
            'border:1px solid #2c2e36;border-radius:6px}figcaption{font-size:11px;color:#8b8d96}</style>'
            '<h1>BLUELINE · balloon × gen-AI — four interaction modes</h1>' + "".join(rows))
    open(os.path.join(OUT, "contact.html"), "w").write(html)


def main():
    print("generating materials + atmospheres (cached) ...")
    for name, ex in EX.items():
        ex["_mat"]  = gen(ex["material"],   1111, f"balloonmat_{name}",  os.path.join(GEN, f"{name}_material.png"))
        ex["_atmo"] = gen(ex["atmosphere"], 2222, f"balloonatmo_{name}", os.path.join(GEN, f"{name}_atmo.png"))
    print("compositing four modes per exemplar ...")
    for name, ex in EX.items():
        mode_A(ex, os.path.join(OUT, f"{name}_A_styled-box.png"))
        mode_B(ex, os.path.join(OUT, f"{name}_B_escape.png"))
        mode_C(ex, os.path.join(OUT, f"{name}_C_clip.png"))
        mode_D(ex, os.path.join(OUT, f"{name}_D_mind-window.png"))
        print(f"  {name}: A/B/C/D done")
    contact()
    print("BALLOON_GENAI_DONE -> balloons-genai/  · open contact.html")


if __name__ == "__main__":
    main()
