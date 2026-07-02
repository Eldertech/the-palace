#!/usr/bin/env python3
"""
BLUELINE — living-balloon PARAMETER SWEEP: find the canny sweet spot.

The tension for "bubble + word as one gen-AI material": a FIRM canny keeps the word legible
and the bubble shape crisp (but the rim stays a clean traced line — undramatic); a LOOSE
canny lets the rim + letters bloom into organic living material (but shape/legibility drift).
Two knobs govern it: control STRENGTH and END_PERCENT (when the canny releases during
denoising — the Lettering gotcha says letters go organic when released early ~45%).

This sweeps STRENGTH × END_PERCENT on the most demanding exemplar (bleeding "too late"), one
seed, and builds a labelled grid so we can read the sweet spot directly. Then phase 2 applies
the winner to the other materials.

Run:  <comfy venv>/python balloon_sweep.py
Out:  balloons-genai/sweep/cn<S>_end<E>.png  + sweep_grid.png
"""
import os, sys
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import balloon_material as BM     # sets RT.NEG, provides build_guide + EX
import render_text as RT

OUT = os.path.join(HERE, "balloons-genai", "sweep"); os.makedirs(OUT, exist_ok=True)
EX = BM.EX["toolate-bleed"]
SEED = 2222
STRENGTH = [0.35, 0.5, 0.65, 0.8, 1.0]      # rows
END_PCT  = [0.4, 0.7, 1.0]                  # cols

FULL = (f'{EX["prompt"]}, on a pure solid black background, generous black negative space, '
        f'hand-lettered expressive illustration, the forms themselves carrying the emotion, '
        f'NOT a clean typeface')


def run_grid(gname):
    for cn in STRENGTH:
        for cne in END_PCT:
            dest = os.path.join(OUT, f"cn{cn}_end{cne}.png")
            if os.path.exists(dest):
                print(f"  cached cn{cn}_end{cne}"); continue
            wf = RT.graph(FULL, SEED, f"sweep_cn{cn}_e{cne}", skel_name=gname, cn=cn, cn_end=cne)
            try:
                dt = RT.run(wf, dest)
                print(f"  cn={cn} end={cne} ({dt:.0f}s) -> {os.path.basename(dest)}", flush=True)
            except Exception as e:
                print(f"  cn={cn} end={cne} FAILED: {str(e)[:140]}", flush=True)


def montage(guide_path):
    cw, ch, lab = 300, 205, 60
    W = lab + cw * len(END_PCT)
    Hh = 34 + ch * len(STRENGTH)
    sheet = Image.new("RGB", (W, Hh), (12, 12, 14))
    d = ImageDraw.Draw(sheet)
    def f(sz):
        try: return ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", sz)
        except: return ImageFont.load_default()
    d.text((6, 8), "STRENGTH \\ END%", font=f(15), fill=(224, 168, 58))
    for c, cne in enumerate(END_PCT):
        d.text((lab + c*cw + cw//2 - 24, 8), f"end {cne}", font=f(16), fill=(224, 168, 58))
    for r, cn in enumerate(STRENGTH):
        y = 34 + r*ch
        d.text((6, y + ch//2), f"cn\n{cn}", font=f(16), fill=(224, 168, 58))
        for c, cne in enumerate(END_PCT):
            p = os.path.join(OUT, f"cn{cn}_end{cne}.png")
            if os.path.exists(p):
                im = Image.open(p).convert("RGB"); im.thumbnail((cw-8, ch-8))
                sheet.paste(im, (lab + c*cw + 4, y + 4))
    sheet.save(os.path.join(OUT, "sweep_grid.png"))
    print("wrote", os.path.join(OUT, "sweep_grid.png"))


def main():
    guide = BM.build_guide(EX["word"], EX["font"], EX["style"], os.path.join(OUT, "guide.png"))
    gname = RT.upload(guide)
    print(f"sweep: {len(STRENGTH)}x{len(END_PCT)} = {len(STRENGTH)*len(END_PCT)} renders, "
          f"seed {SEED}, exemplar toolate-bleed ({EX['font']}, {EX['style']})", flush=True)
    run_grid(gname)
    montage(guide)
    print("SWEEP_DONE -> balloons-genai/sweep/sweep_grid.png", flush=True)


if __name__ == "__main__":
    main()
