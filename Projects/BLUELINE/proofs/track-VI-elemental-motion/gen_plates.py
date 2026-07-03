#!/usr/bin/env python3
"""
BLUELINE · Track VI — generate pen-flow test PLATES (inked B&W environmental stills),
one dominant moving element each, with lots of white paper so the "infill behind the
element" step is nearly free. Each plate gets a sidecar naming the field/mask/anchor the
warp engine should use. Local SDXL on :8188.

  python gen_plates.py            # all plates
  python gen_plates.py --only flame --size 768 1024
"""
import os, sys, json, argparse
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "lib"))
import comfy

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "plates"); os.makedirs(OUT, exist_ok=True)

# tag -> (scene, seed, suggested {field, mask, anchor})
PLATES = {
  "flame": ("a lone bonfire blazing on an empty plain at night, tall licking flames and "
            "rising sparks, a small seated figure silhouette beside it, low horizon, vast "
            "white sky",
            7011, {"field": "flame", "mask": "auto:mid", "anchor": "base"}),
  "water": ("a calm wide lake at dusk, broad rippling water reflections filling the lower "
            "half of the frame, a lone figure standing at the near shoreline gazing across, "
            "distant low far shore, open empty sky",
            7022, {"field": "water", "mask": "auto:bottom:0.5", "anchor": None}),
  "sky":   ("immense dramatic billowing storm clouds piled high over a bare windswept hill, "
            "a tiny lone figure standing on the ridge below, sweeping cloud forms, deep noir "
            "shadow, lots of white paper",
            7033, {"field": "sky", "mask": "auto:top:0.55", "anchor": None}),
  "smoke": ("a thin column of dark smoke curling and rising from a single snuffed candle on "
            "an empty table, delicate wisps against white paper, close intimate study",
            7044, {"field": "smoke", "mask": "auto:top:0.7", "anchor": "base"}),
  "smoke_billow": ("thick black smoke billowing violently from the chimney of a lone burning "
            "house on a bleak hill, dense rolling plumes, dramatic noir light",
            7055, {"field": "smoke", "mask": "auto:top:0.6", "anchor": "base",
                   "note": "topology-changing — sim path, not pure warp"}),
  "dust":  ("a fierce dust storm sweeping low across a desolate flat plain, a cloaked figure "
            "leaning hard into the howling wind, long streaks of blowing grit and haze, pale "
            "empty sky above",
            7066, {"field": "dust", "mask": "auto:bottom:0.6", "anchor": None}),
}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", default=None, help="single plate tag")
    ap.add_argument("--size", type=int, nargs=2, default=[832, 1216])
    ap.add_argument("--steps", type=int, default=26)
    a = ap.parse_args()
    w, h = a.size
    tags = [a.only] if a.only else list(PLATES)
    index = {}
    for i, tag in enumerate(tags):
        scene, seed, rec = PLATES[tag]
        prompt = f"{scene}, {comfy.SUBSTRATE}"
        dest = os.path.join(OUT, f"{tag}.png")
        dt = comfy.txt2img(prompt, dest, seed=seed, w=w, h=h, steps=a.steps)
        rec = dict(rec, plate=f"plates/{tag}.png", prompt=prompt, seed=seed, size=[w, h])
        index[tag] = rec
        json.dump(rec, open(os.path.join(OUT, f"{tag}.json"), "w"), indent=2)
        print(f"  [{i+1}/{len(tags)}] {tag}  ({dt:.0f}s)  {w}x{h}", flush=True)
    # merge into a master index (don't clobber other tags)
    mp = os.path.join(OUT, "plates-index.json")
    allidx = json.load(open(mp)) if os.path.exists(mp) else {}
    allidx.update(index)
    json.dump(allidx, open(mp, "w"), indent=2)
    print(f"PLATES_DONE {len(index)} -> {OUT}", flush=True)


if __name__ == "__main__":
    main()
