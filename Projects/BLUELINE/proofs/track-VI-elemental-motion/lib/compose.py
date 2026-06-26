#!/usr/bin/env python3
"""
BLUELINE · Track VI — the SEPARATE -> INFILL -> ANIMATE -> RECOMPOSITE pipeline.

The workflow Loudon described, specialized to ink-on-paper:
  1. SEPARATE  a moving element from a still plate (a mask).
  2. INFILL    the hole behind it. For BLUELINE the background is white paper, so infill
               is paper-white + faint grain — nearly free. (Diffusion inpaint is the
               fallback for plates whose background carries structure behind the element.)
  3. ANIMATE   the element as its own looping sequence — either a warp of the cut-out, or a
               stylized Blender sim composited in (this script's job is the recomposite).
  4. RECOMPOSITE  ink-on-paper compositing IS multiply blend: out = base * element. White
               paper (1) passes the base through; black ink (0) darkens. No alpha needed
               when the element sits on white.

  python compose.py --base plates/smoke.png --infill-mask masks/smoke_plume.png \
        --element renders/smoke_sim_npr/frames --place 470 250 0.9 --name smoke_recomp

Output: <renders>/<name>/ loop (gif+mp4+strip). With --over-warp it instead multiplies the
element onto a warped base loop (so the inked element AND a subtly-warped background co-move).
"""
import os, sys, json, argparse, subprocess
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)


def load_rgb(p):
    return np.asarray(Image.open(p).convert("RGB"), np.float32) / 255.0


def paper_infill(base, mask, seed=11):
    """Replace masked pixels with warm paper-white + faint cold-press grain."""
    H, W = base.shape[:2]
    rng = np.random.default_rng(seed)
    grain = gaussian_filter(rng.random((H, W)).astype(np.float32), 1.0)
    paper = (0.985 + 0.015 * (grain - 0.5))[..., None] * np.ones(3, np.float32)
    m = gaussian_filter(mask.astype(np.float32), 6)[..., None]
    return base * (1 - m) + paper * m


def diffuse_infill(base, mask, iters=120):
    """Background-matching infill: bleed surrounding colors into the hole (cheap inpaint).
    Use on plates whose ground is NOT white paper (dark wash, texture behind the element)."""
    m = gaussian_filter(mask.astype(np.float32), 4) > 0.4
    m3 = m[..., None]
    fill = base.copy()
    if (~m).any():
        fill[m] = base[~m].reshape(-1, 3).mean(0)      # seed hole with surrounding mean
    for _ in range(iters):
        blur = gaussian_filter(fill, (3, 3, 0))
        fill = np.where(m3, blur, base)                # known pixels stay fixed; hole diffuses
    return np.clip(fill, 0, 1)


def place_element(elem, canvas_hw, x, y, scale):
    """Put an inked-on-white element onto a white canvas at (x,y) top-left, scaled."""
    H, W = canvas_hw
    eh, ew = elem.shape[:2]
    nw, nh = max(1, int(ew * scale)), max(1, int(eh * scale))
    e = np.asarray(Image.fromarray((np.clip(elem, 0, 1) * 255).astype(np.uint8)).resize((nw, nh)), np.float32) / 255.0
    canvas = np.ones((H, W, 3), np.float32)
    x0, y0 = int(x), int(y)
    dx0, dy0 = max(0, x0), max(0, y0)           # destination region, clamped to canvas
    dx1, dy1 = min(W, x0 + nw), min(H, y0 + nh)
    if dx1 > dx0 and dy1 > dy0:                  # crop the element source to match (handles off-edge)
        sx0, sy0 = dx0 - x0, dy0 - y0
        canvas[dy0:dy1, dx0:dx1] = e[sy0:sy0 + (dy1 - dy0), sx0:sx0 + (dx1 - dx0)]
    return canvas


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", required=True)
    ap.add_argument("--infill-mask", default=None, help="white = remove (drawn element to replace)")
    ap.add_argument("--infill", default="paper", choices=["paper", "diffuse"],
                    help="paper = white (white-ground plates); diffuse = bleed bg in (dark-ground plates)")
    ap.add_argument("--element", required=True, help="dir of inked-on-white element frames")
    ap.add_argument("--place", type=float, nargs=3, default=[0, 0, 1.0], metavar=("X", "Y", "SCALE"))
    ap.add_argument("--name", required=True)
    ap.add_argument("--fps", type=int, default=24)
    ap.add_argument("--over-warp", default=None, help="optional dir of warped base frames to co-move")
    a = ap.parse_args()

    base = load_rgb(a.base); H, W = base.shape[:2]
    if a.infill_mask:
        mask = np.asarray(Image.open(a.infill_mask).convert("L"), np.float32) / 255.0
        base = paper_infill(base, mask) if a.infill == "paper" else diffuse_infill(base, mask)

    el_paths = sorted(p for p in (os.path.join(a.element, f) for f in os.listdir(a.element))
                      if p.endswith(".png"))
    warp_paths = None
    if a.over_warp:
        warp_paths = sorted(p for p in (os.path.join(a.over_warp, f) for f in os.listdir(a.over_warp))
                            if p.endswith(".png"))

    out_dir = os.path.join(os.path.dirname(HERE), "renders", a.name)
    os.makedirs(os.path.join(out_dir, "frames"), exist_ok=True)
    x, y, s = a.place
    paths = []
    for i, ep in enumerate(el_paths):
        elem = load_rgb(ep)
        canvas = place_element(elem, (H, W), x, y, s)
        bg = load_rgb(warp_paths[i % len(warp_paths)]) if warp_paths else base
        out = np.clip(bg * canvas, 0, 1)                      # ink-on-paper = multiply
        p = os.path.join(out_dir, "frames", f"{a.name}_{i:04d}.png")
        Image.fromarray((out * 255).astype(np.uint8)).save(p); paths.append(p)

    subprocess.run(["ffmpeg", "-y", "-framerate", str(a.fps), "-i",
                    os.path.join(out_dir, "frames", f"{a.name}_%04d.png"), "-pix_fmt",
                    "yuv420p", "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2", "-loglevel",
                    "error", os.path.join(out_dir, f"{a.name}.mp4")], check=False)
    pil = [Image.open(p) for p in paths]
    pil[0].save(os.path.join(out_dir, f"{a.name}.gif"), save_all=True,
                append_images=pil[1:], duration=int(1000 / a.fps), loop=0, optimize=True)
    json.dump({"base": a.base, "element": a.element, "place": [x, y, s], "frames": len(paths)},
              open(os.path.join(out_dir, "manifest.json"), "w"), indent=2)
    print(f"COMPOSE_DONE {a.name} {len(paths)} frames -> {out_dir}", flush=True)


if __name__ == "__main__":
    main()
