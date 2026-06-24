#!/usr/bin/env python3
"""
BLUELINE · NEW STORY — OPENPOSE COMPOSITING (Loudon's alternate). A figure LYING DOWN won't survive DWPose
(it's trained on upright people), so re-rolling gens can't reliably place her. Instead: take a clean
crowd+hero OpenPose (extracted from a gen) and DRAW a hand-placed downed figure into the foreground, then
render with the composite as the structure guidance. Explicit multi-character staging — "Blocked, Not
Prompted" applied to the generate-then-extract pipeline.

Run (comfy venv): python compose_pose.py --base genpose/S05_0_openpose_00001_.png
Then:             python render_shot.py --shot 05 --pose genpose/S05_composite_openpose.png
"""
import os, sys, argparse
from PIL import Image, ImageDraw
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "staging-skeleton"))
import staging_skeleton as SK
LIMBS = [tuple(l) for l in SK.OPENPOSE_LIMBS]; COLORS = [tuple(c) for c in SK.OPENPOSE_COLORS]
HERE = os.path.dirname(os.path.abspath(__file__))

# a downed figure, lying horizontal in the FOREGROUND: head-left, one arm reaching UP (toward the hero),
# the other along the ground, legs trailing right. COCO-18 in NORMALIZED image coords (x right, y down).
GIRL_ON_GROUND = {
    0:(.25,.80), 1:(.31,.80),
    2:(.33,.76), 3:(.35,.66), 4:(.37,.55),     # R arm reaching up
    5:(.33,.84), 6:(.41,.88), 7:(.48,.90),     # L arm along the ground
    8:(.52,.81), 9:(.62,.79), 10:(.71,.80),    # R leg trailing right
    11:(.52,.87),12:(.62,.87),13:(.71,.88),    # L leg
    14:(.24,.785),15:(.265,.785),16:(.225,.80),17:(.285,.80),
}

def draw_skeleton(dr, kp_px):
    for idx,(a,b) in enumerate(LIMBS):
        if a in kp_px and b in kp_px:
            dr.line([*kp_px[a], *kp_px[b]], fill=COLORS[idx % 18], width=8)
    for i,(x,y) in kp_px.items():
        dr.ellipse([x-6, y-6, x+6, y+6], fill=COLORS[i % 18])

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="genpose/S05_0_openpose_00001_.png", help="crowd+hero openpose to add the downed figure into")
    ap.add_argument("--out", default="genpose/S05_composite_openpose.png")
    ap.add_argument("--fig", default="girl", help="which extra figure to add (only 'girl' for now)")
    a = ap.parse_args()
    base_p = os.path.join(HERE, a.base)
    base = Image.open(base_p).convert("RGB"); W, H = base.size
    dr = ImageDraw.Draw(base)
    kp_px = {i: (int(x * W), int(y * H)) for i, (x, y) in GIRL_ON_GROUND.items()}
    draw_skeleton(dr, kp_px)
    out_p = os.path.join(HERE, a.out); base.save(out_p)
    print(f"COMPOSE_DONE base={os.path.basename(a.base)} + {a.fig} -> {os.path.basename(a.out)} ({W}x{H})")

if __name__ == "__main__":
    main()
