#!/usr/bin/env python3
"""
BLUELINE · Track VI — ELEMENTAL MOTION · the ink-warp engine.

Take ONE stylized pen-flow still, a feathered element mask, and a displacement field
(see fields.py), and render a seamless loop by sampling the source ink under the field.
The AI drew the ink once; this moves it with pure geometry — so the loop never flickers.

  python warp.py --plate plates/water.png --field water --mask auto:bottom \
                 --frames 48 --fps 24 --amp 1.0 --name water_v1

Outputs (under renders/<name>/):  frames/ (PNG seq) · <name>.gif · <name>.mp4 ·
  <name>_strip.png (contact strip) · <name>_anaglyph.png (frame0=red vs mid=cyan, so the
  subtle motion is visible in a single still) · manifest.json.

Masks:  full | auto:bottom[:frac] | auto:top[:frac] | <path.png> (white = moves).
Anchor: base (pin the bottom of the mask, let the top dance — for flame/smoke).
"""
import os, sys, json, argparse, subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy.ndimage import map_coordinates, gaussian_filter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import fields as F


# ---------------------------------------------------------------------------
# io
# ---------------------------------------------------------------------------

def load_rgb(path):
    return np.asarray(Image.open(path).convert("RGB"), np.float32) / 255.0


def save_rgb(arr, path):
    Image.fromarray(np.clip(arr * 255.0, 0, 255).astype(np.uint8), "RGB").save(path)


# ---------------------------------------------------------------------------
# masks
# ---------------------------------------------------------------------------

def build_mask(spec, H, W, feather=24):
    """Return a feathered float mask in [0,1] (1 = this region moves)."""
    if spec in (None, "full", "none"):
        m = np.ones((H, W), np.float32)
    elif spec.startswith("auto:"):
        parts = spec.split(":")
        where = parts[1]
        frac = float(parts[2]) if len(parts) > 2 else 0.42
        m = np.zeros((H, W), np.float32)
        h = int(H * frac)
        if where == "bottom":
            m[H - h:, :] = 1.0
        elif where == "top":
            m[:h, :] = 1.0
        elif where == "mid":
            m[(H - h) // 2:(H + h) // 2, :] = 1.0
    else:
        m = np.asarray(Image.open(spec).convert("L"), np.float32) / 255.0
    if feather > 0:
        m = gaussian_filter(m, feather)
    return np.clip(m, 0, 1).astype(np.float32)


def base_anchor_weight(mask, power=1.2):
    """Per-pixel 0..1 weight that is 0 at the mask's lowest occupied row and 1 at its
    highest — pins the base, frees the tips. For flame/smoke."""
    H, W = mask.shape
    occ = mask > 0.05
    rows = np.where(occ.any(axis=1))[0]
    if len(rows) == 0:
        return np.ones_like(mask)
    top, bot = rows.min(), rows.max()
    yy = np.mgrid[0:H, 0:W][0].astype(np.float32)
    w = (bot - yy) / max(bot - top, 1)
    return np.clip(w, 0, 1).astype(np.float32) ** power


# ---------------------------------------------------------------------------
# warp
# ---------------------------------------------------------------------------

def warp_image(img, dx, dy):
    """Backward warp: out(y,x) = img(y - dy, x - dx). Moves ink by (dx, dy)."""
    H, W = img.shape[:2]
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    coords = np.stack([(yy - dy).ravel(), (xx - dx).ravel()])
    out = np.empty_like(img)
    for c in range(img.shape[2]):
        out[..., c] = map_coordinates(img[..., c], coords, order=1,
                                      mode="reflect").reshape(H, W)
    return out


# ---------------------------------------------------------------------------
# loop render
# ---------------------------------------------------------------------------

def render_loop(plate, field_fn, mask, frames=48, amp=1.0, anchor=None,
                lum_amp=0.0):
    """Yield warped frames for one seamless loop."""
    confine = mask.copy()
    if anchor == "base":
        confine = confine * base_anchor_weight(mask)
    out = []
    for i in range(frames):
        t = i / frames
        dx, dy = field_fn(t)
        dx = dx * amp * confine
        dy = dy * amp * confine
        fr = warp_image(plate, dx, dy)
        if lum_amp:                                 # slow light shift (sky time-lapse)
            shade = 1.0 + lum_amp * np.sin(2 * np.pi * t)
            fr = np.clip(1.0 - (1.0 - fr) * shade, 0, 1)  # modulate ink darkness on paper
        out.append(fr)
    return out


# ---------------------------------------------------------------------------
# outputs
# ---------------------------------------------------------------------------

def write_outputs(frames, out_dir, name, fps=24):
    os.makedirs(os.path.join(out_dir, "frames"), exist_ok=True)
    paths = []
    for i, fr in enumerate(frames):
        p = os.path.join(out_dir, "frames", f"{name}_{i:04d}.png")
        save_rgb(fr, p); paths.append(p)

    pil = [Image.open(p).convert("RGB") for p in paths]
    gif = os.path.join(out_dir, f"{name}.gif")
    pil[0].save(gif, save_all=True, append_images=pil[1:],
                duration=int(1000 / fps), loop=0, optimize=True)

    mp4 = os.path.join(out_dir, f"{name}.mp4")
    subprocess.run(["ffmpeg", "-y", "-framerate", str(fps), "-i",
                    os.path.join(out_dir, "frames", f"{name}_%04d.png"),
                    "-pix_fmt", "yuv420p", "-vf",
                    "scale=trunc(iw/2)*2:trunc(ih/2)*2", "-loglevel", "error", mp4],
                   check=False)

    strip = contact_strip(frames, name)
    strip_p = os.path.join(out_dir, f"{name}_strip.png"); strip.save(strip_p)

    ana = anaglyph(frames[0], frames[len(frames) // 2])
    ana_p = os.path.join(out_dir, f"{name}_anaglyph.png"); ana.save(ana_p)

    return dict(gif=gif, mp4=mp4, strip=strip_p, anaglyph=ana_p,
                frames=len(frames), motion_px=motion_stats(frames))


def contact_strip(frames, name, cols=6, tw=240):
    sel = [frames[int(k)] for k in np.linspace(0, len(frames) - 1, cols)]
    H, W = sel[0].shape[:2]; th = int(tw * H / W); pad = 22
    m = Image.new("RGB", (tw * cols, th + pad), (14, 15, 18))
    dr = ImageDraw.Draw(m)
    for i, fr in enumerate(sel):
        im = Image.fromarray(np.clip(fr * 255, 0, 255).astype(np.uint8)).resize((tw, th))
        m.paste(im, (i * tw, pad)); dr.text((i * tw + 6, 6), f"f{int(np.linspace(0,len(frames)-1,cols)[i])}", fill=(232, 184, 74))
    return m


def anaglyph(a, b):
    """frame A into red, frame B into green+blue — moved ink shows as colored fringe.
    Reveals subtle motion in a single still."""
    ga = a.mean(2); gb = b.mean(2)
    out = np.stack([ga, gb, gb], -1)
    return Image.fromarray(np.clip(out * 255, 0, 255).astype(np.uint8))


def motion_stats(frames):
    g = np.stack([f.mean(2) for f in frames])
    return float(np.percentile(np.abs(g - g.mean(0)).max(0), 99) * 255)


# ---------------------------------------------------------------------------
# cli
# ---------------------------------------------------------------------------

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--plate", required=True)
    ap.add_argument("--field", default="water", choices=list(F.PRESETS))
    ap.add_argument("--mask", default="full")
    ap.add_argument("--frames", type=int, default=48)
    ap.add_argument("--fps", type=int, default=24)
    ap.add_argument("--amp", type=float, default=1.0)
    ap.add_argument("--anchor", default=None, choices=[None, "base"])
    ap.add_argument("--lum", type=float, default=0.0, help="slow light-shift amplitude (sky)")
    ap.add_argument("--feather", type=int, default=24)
    ap.add_argument("--seed", type=int, default=None)
    ap.add_argument("--name", default=None)
    ap.add_argument("--out", default=None)
    a = ap.parse_args()

    plate = load_rgb(a.plate)
    H, W = plate.shape[:2]
    kw = {} if a.seed is None else {"seed": a.seed}
    field_fn = F.PRESETS[a.field](H, W, **kw)
    mask = build_mask(a.mask, H, W, feather=a.feather)

    name = a.name or f"{os.path.splitext(os.path.basename(a.plate))[0]}_{a.field}"
    here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    out_dir = a.out or os.path.join(here, "renders", name)
    os.makedirs(out_dir, exist_ok=True)

    print(f"WARP plate={os.path.basename(a.plate)} {W}x{H} field={a.field} "
          f"frames={a.frames} amp={a.amp} mask={a.mask} anchor={a.anchor}", flush=True)
    frames = render_loop(plate, field_fn, mask, frames=a.frames, amp=a.amp,
                         anchor=a.anchor, lum_amp=a.lum)
    man = write_outputs(frames, out_dir, name, fps=a.fps)
    man.update(plate=a.plate, field=a.field, mask=a.mask, amp=a.amp,
               anchor=a.anchor, frames_n=a.frames, fps=a.fps, size=[W, H])
    json.dump(man, open(os.path.join(out_dir, "manifest.json"), "w"), indent=2)
    print(f"WARP_DONE {name}  motion_p99={man['motion_px']:.1f}px  -> {out_dir}", flush=True)


if __name__ == "__main__":
    main()
