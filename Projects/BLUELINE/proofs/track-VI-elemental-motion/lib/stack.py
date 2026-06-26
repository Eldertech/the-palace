#!/usr/bin/env python3
"""
BLUELINE · Track VI — STACK: the 2.5D paper compositor.

Ordered RGBA sheets (back -> front), each with its own motion field and depth/parallax.
Per frame: warp each sheet's colour AND alpha by its field, then alpha-over composite onto
white paper. The sharp matte rides the black line, so the seam is hidden by OCCLUSION, not
by feathering — a static foreground silhouette simply covers the moving sheet behind it.

A "layer spec" is a dict:
  rgba    : HxWx4 float sheet
  field   : preset name in fields.PRESETS, or None (static)
  amp     : displacement scale
  anchor  : "base" to pin the bottom of the sheet (flame/smoke)
  parallax: extra amp multiplier for depth (far sheets move less)
"""
import os, sys, json, subprocess
import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import map_coordinates

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import fields as F
import layers as LZ
from warp import base_anchor_weight


def warp_rgba(sheet, dx, dy):
    H, W = sheet.shape[:2]
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    coords = np.stack([(yy - dy).ravel(), (xx - dx).ravel()])
    out = np.empty_like(sheet)
    for c in range(sheet.shape[2]):
        out[..., c] = map_coordinates(sheet[..., c], coords, order=1,
                                      mode="reflect").reshape(H, W)
    return out


def render_stack(specs, frames=60, seed=1):
    H, W = specs[0]["rgba"].shape[:2]
    field_fns = {}
    for i, s in enumerate(specs):
        if s.get("field"):
            field_fns[i] = F.PRESETS[s["field"]](H, W, seed=seed + i)
    out = []
    for fr in range(frames):
        t = fr / frames
        comp = np.ones((H, W, 3), np.float32)            # white paper
        for i, s in enumerate(specs):                    # back -> front
            sheet = s["rgba"]
            if i in field_fns:
                dx, dy = field_fns[i](t)
                amp = s.get("amp", 1.0) * s.get("parallax", 1.0)
                if s.get("anchor") == "base":
                    w = base_anchor_weight(sheet[..., 3])
                    dx, dy = dx * w, dy * w
                sheet = warp_rgba(sheet, dx * amp, dy * amp)
            rgb, a = sheet[..., :3], sheet[..., 3:4]
            comp = rgb * a + comp * (1 - a)              # alpha over
        out.append(comp)
    return out


def write_loop(frames, out_dir, name, fps=24, anaglyph=True):
    os.makedirs(os.path.join(out_dir, "frames"), exist_ok=True)
    paths = []
    for i, fr in enumerate(frames):
        p = os.path.join(out_dir, "frames", f"{name}_{i:04d}.png")
        Image.fromarray((np.clip(fr, 0, 1) * 255).astype(np.uint8)).save(p); paths.append(p)
    pil = [Image.open(p).convert("RGB") for p in paths]
    pil[0].save(os.path.join(out_dir, f"{name}.gif"), save_all=True, append_images=pil[1:],
                duration=int(1000 / fps), loop=0, optimize=True)
    subprocess.run(["ffmpeg", "-y", "-framerate", str(fps), "-i",
                    os.path.join(out_dir, "frames", f"{name}_%04d.png"), "-pix_fmt", "yuv420p",
                    "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2", "-loglevel", "error",
                    os.path.join(out_dir, f"{name}.mp4")], check=False)
    if anaglyph:
        a = frames[0].mean(2); b = frames[len(frames) // 2].mean(2)
        Image.fromarray((np.clip(np.stack([a, b, b], -1), 0, 1) * 255).astype(np.uint8)).save(
            os.path.join(out_dir, f"{name}_anaglyph.png"))
    return os.path.join(out_dir, f"{name}.mp4")


def matte_board(specs, out_path, labels=None):
    """Show each sheet's matte (over a tint) so the cut quality is visible in one still."""
    n = len(specs); cw = 300
    cells = []
    for i, s in enumerate(specs):
        prev = LZ.alpha_preview(s["rgba"])
        im = Image.fromarray((prev * 255).astype(np.uint8))
        h = int(cw * im.height / im.width); im = im.resize((cw, h))
        c = Image.new("RGB", (cw, h + 26), (14, 15, 18)); d = ImageDraw.Draw(c)
        d.text((6, 5), (labels[i] if labels else f"sheet {i}"), fill=(232, 184, 74))
        c.paste(im, (0, 26)); cells.append(c)
    Hc = max(c.height for c in cells)
    board = Image.new("RGB", (cw * n + 10 * (n + 1), Hc + 20), (14, 15, 18))
    x = 10
    for c in cells:
        board.paste(c, (x, 10)); x += cw + 10
    board.save(out_path); return out_path
