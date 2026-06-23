#!/usr/bin/env python3
"""
BLUELINE · NEW STORY — finish the 6-shot opening. Shots 04 (plummet) and 06 (kiss) are the two left.
Neither is a dense multi-figure crowd scene (04 = a lone falling figure; 06 = two intimate figures in
close-up), so they don't need the rich-first compositing — a DIRECT pen-flow render fits, like 01-03.
First pass is prompt-driven (lone/intimate figures don't need to relate to a third element); if a frame is
a keeper, it graduates to the full authored-pose treatment (the shot 05 pipeline). Renders on the pod.

  <comfy venv>/python rest_of_story.py --pod <id>
Outputs -> out/<shot>_<name>_s<seed>.png
"""
import os, argparse
import render_shot as RS
from pod_backend import Backend

BK = Backend(None)
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, "out")

def main(seeds):
    for shot in ["04", "06"]:
        s = RS.SHOTS[shot]; W, H = s["size"]
        prompt = f"{s['prompt']}, {RS.STYLE_TXT}"
        for sd in seeds:
            dest = os.path.join(OUT, f"{shot}_{s['name']}_s{sd}.png")
            dt = BK.run(RS.graph(prompt, W, H, sd, f"shot{shot}_s{sd}"), dest)
            print(f"  [shot {shot}] {s['name']} seed={sd} ({dt:.0f}s) -> {os.path.basename(dest)}", flush=True)
    print("REST_OF_STORY_DONE")

if __name__ == "__main__":
    ap = argparse.ArgumentParser(); ap.add_argument("--pod", default=None)
    ap.add_argument("--seeds", type=int, nargs="+", default=[1234, 5678]); a = ap.parse_args()
    BK = Backend(a.pod); print(f"backend: {'pod '+a.pod if a.pod else 'local'}", flush=True)
    main(a.seeds)
