#!/usr/bin/env python3
"""
BLUELINE — the LIVING BALLOON: the bubble and its words as ONE gen-AI material object.

The weak composites masked flat ink onto a drawn bubble — the diffusion never touched the
balloon relationship. This does the opposite: build ONE canny guide = the balloon OUTLINE
+ the word skeleton (in the voice font) inside it, and let SDXL render the whole thing —
rim AND letters — out of the same living material (bleeding ink, flame). [[Blocked, Not
Prompted]] applied to the balloon, not just the letterform: the shape is the pose, the
material is the render. The bubble bleeds; the letters bleed; they are one object.

Reuses render_text.py's ComfyUI graph/run/upload + the balloon catalog balloon_lib.py.
Local ComfyUI must be up (127.0.0.1:8188).

Run:  <comfy venv>/python balloon_material.py
Out:  balloons-genai/living-balloon/<id>_guide.png + <id>_s<seed>.png + contact
"""
import os, sys
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.abspath(os.path.join(HERE, "..", "blender-handdrawn", "followups", "rig-openpose")))
sys.path.insert(0, HERE)
import balloon_lib as B
import render_text as RT

OUT = os.path.join(HERE, "balloons-genai", "living-balloon"); os.makedirs(OUT, exist_ok=True)
W, H = RT.R["size"]
S = B.S

# balloon + word are what we want, so DON'T ban frame/border here (the default neg does).
RT.NEG = ("neat font, typeface, typography, printed text, typed text, helvetica, arial, "
          "sans-serif, watermark, signature, logo, UI, photograph, photorealistic, 3d render, "
          "smooth digital gradient, jumbled letters, gibberish, misspelled, duplicate letters, "
          "extra letters, repeated text, duplicate word, second line of text, two rows of text, "
          "ghost text, mirrored text, clutter")

EX = {
    "toolate-bleed": dict(
        word="too late", font="Nosifer", style="weak-wavy",
        prompt="a single comic speech balloon with the two words \"too late\" hand-lettered "
               "inside it, the balloon's wavy outline AND the letters both made of the same "
               "sickly bleeding dark crimson ink, wet and dripping and oozing downward, the "
               "whole bubble bleeding, raw exhausted hand-lettering, stark high contrast"),
    "burning-flame": dict(
        word="BURNING", font="Metal Mania", style="speech-oval",
        prompt="a single comic speech balloon with the word \"BURNING\" hand-lettered inside "
               "it, the balloon's rim AND the letters both made of living orange and gold "
               "flame and streaming molten light, fire licking upward off the bubble's edge "
               "and off every letter, trailing embers, luminous, high contrast"),
    "thoom-shatter": dict(
        word="THOOM", font="Frijole", style="shout-spiky",
        prompt="a single jagged comic impact balloon with the onomatopoeia \"THOOM\" inside "
               "it, the spiky balloon edge AND the letters struck from the same bone-white "
               "ink shattering on impact, a radial shockwave and flying debris bursting off "
               "the whole bubble, cracked and explosive, stark high contrast"),
}


def build_guide(word, fontname, style, dest):
    """Canny guide: white balloon outline + white word (voice font) inside, on black."""
    center, half, tip = (W/2, H*0.46), (W*0.33, H*0.27), (W/2 - 90, H*0.92)
    mask = np.zeros((H*S, W*S), np.uint8)
    B.STYLES[style]["body"](mask, center[0], center[1], half[0], half[1])
    union = mask.copy()
    root = B.edge_point(union, center, tip)
    t = B.STYLES[style]["tail"]
    if t == "tri":
        B.add_tail(union, root, tip, 34)
    elif t == "jag":
        B.add_tail(union, root, tip, 40)
        mid = ((root[0]+tip[0])/2, (root[1]+tip[1])/2); B.add_tail(union, root, mid, 22)
    elif t == "droop":
        B.add_tail(union, root, tip, 28, 30)
    canvas = np.zeros((H, W, 3), np.uint8)
    B.stroke(canvas, union, thick=8, color=(255, 255, 255))
    # word inside, fit to ~70% of the body box
    pim = Image.fromarray(canvas); d = ImageDraw.Draw(pim)
    fp, fi = RT.resolve_font(fontname)
    avail_w, avail_h = 2*half[0]*0.72, 2*half[1]*0.60
    sz = 360
    while sz > 30:
        f = ImageFont.truetype(fp, sz, index=fi)
        l, t2, r, b = d.textbbox((0, 0), word, font=f)
        if (r-l) <= avail_w and (b-t2) <= avail_h:
            break
        sz -= 8
    l, t2, r, b = d.textbbox((0, 0), word, font=f)
    d.text((center[0]-(r-l)/2-l, center[1]-(b-t2)/2-t2), word, font=f, fill=(255, 255, 255))
    pim.save(dest); return dest


def gen(prompt, seed, prefix, guide_name, dest):
    full = f"{prompt}, on a pure solid black background, generous black negative space, " \
           f"hand-lettered expressive illustration, the forms themselves carrying the emotion, " \
           f"NOT a clean typeface"
    wf = RT.graph(full, seed, prefix, skel_name=guide_name, cn=0.85, cn_end=0.85)
    return RT.run(wf, dest)


def contact():
    cells = []
    for name in EX:
        imgs = [f"{name}_guide.png"] + [f"{name}_s{s}.png" for s in (1111, 2222)]
        row = "".join(f'<figure><img src="{i}"><figcaption>{i}</figcaption></figure>'
                      for i in imgs if os.path.exists(os.path.join(OUT, i)))
        cells.append(f'<section><h2>{name}</h2><div class=row>{row}</div></section>')
    html = ('<!doctype html><meta charset=utf-8><title>living balloon</title>'
            '<style>body{background:#0b0b0d;color:#e9e7e2;font-family:monospace;padding:24px}'
            '.row{display:flex;gap:10px;flex-wrap:wrap}img{height:300px;background:#000;'
            'border:1px solid #2c2e36;border-radius:6px}h2{color:#e0a83a}</style>'
            '<h1>BLUELINE · the living balloon — bubble + word as one material</h1>' + "".join(cells))
    open(os.path.join(OUT, "contact.html"), "w").write(html)


def main():
    for name, ex in EX.items():
        guide = build_guide(ex["word"], ex["font"], ex["style"], os.path.join(OUT, f"{name}_guide.png"))
        gname = RT.upload(guide)
        print(f"[{name}] guide built ({ex['font']}, {ex['style']})", flush=True)
        for sd in (1111, 2222):
            dest = os.path.join(OUT, f"{name}_s{sd}.png")
            try:
                dt = gen(ex["prompt"], sd, f"living_{name}_s{sd}", gname, dest)
                print(f"  [{name}] s{sd} ({dt:.0f}s) -> {os.path.basename(dest)}", flush=True)
            except Exception as e:
                print(f"  [{name}] s{sd} FAILED: {str(e)[:160]}", flush=True)
        contact()
    print("LIVING_BALLOON_DONE -> balloons-genai/living-balloon/", flush=True)


if __name__ == "__main__":
    main()
