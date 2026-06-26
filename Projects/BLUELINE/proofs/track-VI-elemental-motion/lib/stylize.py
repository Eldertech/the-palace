#!/usr/bin/env python3
"""
BLUELINE · Track VI — STYLIZE a grayscale motion sequence into pen-flow ink.

Two paths, head to head:
  --mode npr : deterministic. levels -> break on a STATIC procedural cold-press tooth ->
               optional contour. The paper grain is generated ONCE and reused every frame,
               so the loop is temporally stable (no boil). Fast, free, CPU.
  --mode ai  : per-frame SDXL img2img (fixed seed) in the locked pen-flow look. Richer ink,
               but each frame is redrawn -> temporal flicker. The control case.

  python stylize.py --frames renders/smoke_sim_v1/frames --mode npr --name smoke_npr
  python stylize.py --frames renders/smoke_sim_v1/frames --mode ai  --name smoke_ai \
                    --prompt "rising smoke" --denoise 0.55

Input frames are grayscale where the MEDIUM is dark on white (Blender sim default).
Output: <renders>/<name>/frames + .gif + .mp4 + _strip.png + flicker.json (frame-to-frame
mean abs diff — the boil metric).
"""
import os, sys, json, argparse, subprocess
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)


def load_gray(p):
    return np.asarray(Image.open(p).convert("L"), np.float32) / 255.0


def paper_tooth(H, W, seed=7):
    """Static cold-press tooth in [0,1] — same every frame so the substrate never boils."""
    rng = np.random.default_rng(seed)
    fine = gaussian_filter(rng.random((H, W)).astype(np.float32), 0.8)
    coarse = gaussian_filter(rng.random((H, W)).astype(np.float32), 7.0)
    t = 0.55 * fine + 0.45 * coarse
    return ((t - t.min()) / (np.ptp(t) + 1e-6)).astype(np.float32)


def npr_ink(gray, tooth, lo=0.06, hi=0.85, gamma=0.8, breakup=0.5, grey=0.18,
            contour=0.0, invert=True):
    """Grayscale medium -> inked-on-paper RGB. invert: medium is dark-on-white."""
    amt = (1.0 - gray) if invert else gray.copy()
    ink = np.clip((amt - lo) / (hi - lo), 0, 1) ** gamma
    # break low-density edges on the tooth; keep dense cores solid (dry-brush)
    ink = np.clip((ink - breakup * tooth) / (1 - breakup * 0.6), 0, 1)
    if contour > 0:                              # add a drawn outline of the medium
        gy, gx = np.gradient(gaussian_filter(amt, 1.2))
        edge = np.clip(np.hypot(gx, gy) * 6.0, 0, 1)
        ink = np.clip(ink + contour * edge, 0, 1)
    # ink black, sparse grey dry-brush in the mids, on warm-white paper
    val = 1.0 - ink * (1.0 - grey * (1 - ink))
    paper = 0.985 + 0.015 * (tooth - 0.5)        # faint grain on the white
    out = np.clip(np.minimum(val, paper), 0, 1)
    return np.stack([out, out, out], -1)


def assemble(frames_rgb, out_dir, name, fps=24):
    os.makedirs(os.path.join(out_dir, "frames"), exist_ok=True)
    paths = []
    for i, fr in enumerate(frames_rgb):
        p = os.path.join(out_dir, "frames", f"{name}_{i:04d}.png")
        Image.fromarray(np.clip(fr * 255, 0, 255).astype(np.uint8)).save(p)
        paths.append(p)
    pil = [Image.open(p).convert("RGB") for p in paths]
    gif = os.path.join(out_dir, f"{name}.gif")
    pil[0].save(gif, save_all=True, append_images=pil[1:], duration=int(1000 / fps),
                loop=0, optimize=True)
    subprocess.run(["ffmpeg", "-y", "-framerate", str(fps), "-i",
                    os.path.join(out_dir, "frames", f"{name}_%04d.png"), "-pix_fmt",
                    "yuv420p", "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2", "-loglevel",
                    "error", os.path.join(out_dir, f"{name}.mp4")], check=False)
    # contact strip
    sel = [frames_rgb[int(k)] for k in np.linspace(0, len(frames_rgb) - 1, 6)]
    tw = 220; th = int(tw * sel[0].shape[0] / sel[0].shape[1])
    strip = Image.new("RGB", (tw * 6, th), (14, 15, 18))
    for i, fr in enumerate(sel):
        strip.paste(Image.fromarray(np.clip(fr * 255, 0, 255).astype(np.uint8)).resize((tw, th)), (i * tw, 0))
    strip.save(os.path.join(out_dir, f"{name}_strip.png"))
    return gif


def flicker(frames_rgb):
    """Mean frame-to-frame abs diff (0-255). Low = stable loop; high = boil."""
    g = [f.mean(2) for f in frames_rgb]
    d = [np.abs(g[i] - g[i - 1]).mean() for i in range(1, len(g))]
    return float(np.mean(d) * 255)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--frames", required=True, help="dir of grayscale input frames")
    ap.add_argument("--mode", default="npr", choices=["npr", "ai"])
    ap.add_argument("--name", required=True)
    ap.add_argument("--fps", type=int, default=24)
    ap.add_argument("--limit", type=int, default=0, help="cap frames (ai is slow)")
    ap.add_argument("--contour", type=float, default=0.0)
    ap.add_argument("--invert", type=int, default=1)
    ap.add_argument("--lo", type=float, default=0.06)
    ap.add_argument("--hi", type=float, default=0.85)
    ap.add_argument("--gamma", type=float, default=0.8)
    ap.add_argument("--breakup", type=float, default=0.5)
    # ai
    ap.add_argument("--prompt", default="drifting smoke")
    ap.add_argument("--denoise", type=float, default=0.55)
    ap.add_argument("--seed", type=int, default=4242)
    a = ap.parse_args()

    fr_paths = sorted(p for p in
                      (os.path.join(a.frames, f) for f in os.listdir(a.frames))
                      if p.endswith(".png"))
    if a.limit:
        idx = np.linspace(0, len(fr_paths) - 1, a.limit).astype(int)
        fr_paths = [fr_paths[i] for i in idx]
    base = os.path.dirname(HERE)
    out_dir = os.path.join(base, "renders", a.name); os.makedirs(out_dir, exist_ok=True)
    print(f"STYLIZE mode={a.mode} n={len(fr_paths)} -> {a.name}", flush=True)

    out = []
    if a.mode == "npr":
        g0 = load_gray(fr_paths[0]); H, W = g0.shape
        tooth = paper_tooth(H, W)
        for p in fr_paths:
            out.append(npr_ink(load_gray(p), tooth, lo=a.lo, hi=a.hi, gamma=a.gamma,
                               breakup=a.breakup, contour=a.contour, invert=bool(a.invert)))
    else:
        import comfy
        prompt = f"{a.prompt}, {comfy.SUBSTRATE}"
        tmp = os.path.join(out_dir, "_init"); os.makedirs(tmp, exist_ok=True)
        for i, p in enumerate(fr_paths):
            dest = os.path.join(out_dir, "frames", f"_raw_{i:04d}.png")
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            comfy.img2img(p, prompt, dest, seed=a.seed, denoise=a.denoise)
            out.append(np.asarray(Image.open(dest).convert("RGB"), np.float32) / 255.0)
            print(f"  ai {i+1}/{len(fr_paths)}", flush=True)

    assemble(out, out_dir, a.name, fps=a.fps)
    fl = flicker(out)
    json.dump({"mode": a.mode, "n": len(out), "flicker_0_255": fl},
              open(os.path.join(out_dir, "flicker.json"), "w"), indent=2)
    print(f"STYLIZE_DONE {a.name} flicker={fl:.2f}/255 -> {out_dir}", flush=True)


if __name__ == "__main__":
    main()
