#!/usr/bin/env python3
"""
BLUELINE · NEW STORY — fix shot 02 (hero pointing). Two corrections Loudon flagged:
  1. The man must be ON TOP of the car (prompt-only put him on the ground between the cars) -> AUTHOR a
     standing-on-the-roof pointing pose so his position is controlled, with the car rendered beneath him.
  2. It drifted warm/sepia while the rest of the sequence is stark B&W -> strengthen the monochrome prompt/
     negative AND DESATURATE the output (a deterministic guarantee of black-and-white).

  <comfy venv>/python fix_shot02.py --pod <id>
Outputs -> out/02_fixed_s<seed>.png (raw) + out/02_fixed_bw_s<seed>.png (forced B&W)
"""
import os, argparse
from PIL import Image, ImageDraw, ImageEnhance
import render_shot as RS
import compose_pose as CP
from pod_backend import Backend

BK = Backend(None)
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, "out")
W, H = 832, 1216   # shot 02 portrait

# Standing commandingly ON a car roof, one arm thrust out POINTING (his right -> frame-left). Feet ~0.70 so
# there is room for the car beneath; head ~0.15 -> the figure owns the upper 2/3, car fills the lower third.
HERO02 = {
    0:(.50,.15), 14:(.485,.14),15:(.515,.14),16:(.47,.155),17:(.53,.155),  # head, frontal
    1:(.50,.24),                                                            # neck
    2:(.42,.255), 3:(.30,.26), 4:(.17,.265),                               # R arm thrust out, pointing
    5:(.58,.255), 6:(.61,.37), 7:(.605,.47),                               # L arm at side
    8:(.45,.47), 9:(.44,.59), 10:(.44,.70),                                # R leg, standing
    11:(.55,.47),12:(.56,.59),13:(.56,.70),                                # L leg, standing
}

PROMPT = ("a lone powerful figure standing commandingly on top of the crushed dented roof of a burning "
          "sedan, elevated above the street on the car, one arm thrust out pointing down at a frightened "
          "crowd below, smoke and embers, dramatic low angle, monochrome, stark black and white ink, no color")

def author(kp_norm, name):
    img = Image.new("RGB", (W, H), (0, 0, 0)); dr = ImageDraw.Draw(img)
    CP.draw_skeleton(dr, {i: (int(x*W), int(y*H)) for i, (x, y) in kp_norm.items()})
    p = os.path.join(OUT, f"{name}_openpose.png"); img.save(p); return p

def graph_strong(prompt, seed, prefix, pose_name, ps=0.85):
    g = RS.graph(prompt, W, H, seed, prefix, pose_name=pose_name)
    g["ap_pose"]["inputs"]["strength"] = ps; g["ap_pose"]["inputs"]["end_percent"] = 0.85
    g["neg"]["inputs"]["text"] = RS.NEG + ", sepia, brown, warm tones, tan, beige, colored"
    return g

def to_bw(img, contrast=1.22):
    return ImageEnhance.Contrast(img.convert("L")).enhance(contrast).convert("RGB")

def main(seeds):
    op = author(HERO02, "shot02"); op_up = BK.upload(op)
    prompt = f"{PROMPT}, {RS.STYLE_TXT}"
    for sd in seeds:
        dest = os.path.join(OUT, f"02_fixed_s{sd}.png")
        dt = BK.run(graph_strong(prompt, sd, f"shot02fix_s{sd}", op_up), dest)
        to_bw(Image.open(dest)).save(os.path.join(OUT, f"02_fixed_bw_s{sd}.png"))
        print(f"  [shot 02] seed={sd} ({dt:.0f}s) -> 02_fixed_s{sd}.png + _bw", flush=True)
    print("FIX_SHOT02_DONE")

if __name__ == "__main__":
    ap = argparse.ArgumentParser(); ap.add_argument("--pod", default=None)
    ap.add_argument("--seeds", type=int, nargs="+", default=[2211, 6655]); a = ap.parse_args()
    BK = Backend(a.pod); print(f"backend: {'pod '+a.pod if a.pod else 'local'}", flush=True)
    main(a.seeds)
