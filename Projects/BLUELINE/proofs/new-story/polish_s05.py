#!/usr/bin/env python3
"""
BLUELINE · NEW STORY — SHOT 05 POLISH HARNESS (the craft pass on the proven layering method).

The proven layer_render.py got the METHOD right (scene layer + dedicated girl layer + composite +
integrate) but the dying-girl frame is rough where Loudon flagged it: the composite drags the girl's
bright burning-street plate into the dark scene (loose ellipse mask), and the integrate at denoise 0.42
over-paints and MELTS the hero+girl into one dark mass. This harness REUSES the two strong existing
layers (layers/scene.png, layers/girl.png — no re-render) and only fixes the two weak links:

  compose  — PIL only, FREE, instant: a tight body-following mask (not a fat ellipse) + a luminance
             match so the girl sits in the scene's value range + tunable scale/drop. Several geometry
             variants for Loudon to pick by eye. NO ComfyUI needed.
  integrate — ComfyUI :8189: img2img over a chosen composite, conditioned on the combined openpose,
             swept over (denoise x seed) so a LOWER denoise can preserve the staging the old 0.42 lost.
             generate-many-select; Loudon picks the final.

Identity (InstantID) is the PAID pod step and is deliberately NOT here — it is gated on Loudon's pick.

  <comfy venv>/python polish_s05.py compose
  <comfy venv>/python polish_s05.py integrate --comp layers/composite_v2_a.png --denoise 0.30 0.40 --seeds 7373 1111 9090
"""
import os, sys, argparse
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
import render_shot as RS      # graph/run/upload, STYLE_TXT, NEG, CKPT, CN_POSE
import compose_pose as CP     # GIRL_ON_GROUND, LIMBS, draw_skeleton

HERE = os.path.dirname(os.path.abspath(__file__))
LAY = os.path.join(HERE, "layers")
GP = os.path.join(HERE, "genpose")
W, H = 1216, 832
SHARED = "burning noir city street at night, smoke and embers, cracked pavement"

# ---------- composite (PIL, free) ----------
def ellipse_mask(kp_px, pad_x=0.12, pad_y=0.16, blur=44):
    """A GENEROUS feathered ellipse around the figure keypoints — like the proven composite's mask, which
    read the girl boldly. SDXL draws her looser than her skeleton, so a skeleton-tight mask clips her to a
    sliver; the ellipse carries her whole body. Reducing plate bleed is knock_back_plate's job, not the
    mask's."""
    xs = [x for x, y in kp_px.values()]; ys = [y for x, y in kp_px.values()]
    x0, x1 = min(xs), max(xs); y0, y1 = min(ys), max(ys)
    px = int((x1 - x0) * pad_x + 0.06 * W); py = int((y1 - y0) * pad_y + 0.05 * H)
    m = Image.new("L", (W, H), 0)
    ImageDraw.Draw(m).ellipse([x0 - px, y0 - py, x1 + px, y1 + py], fill=255)
    return m.filter(ImageFilter.GaussianBlur(blur))

def knock_back_plate(girl_rgb, amount):
    """GENTLE: pull only the girl plate's brightest near-white street pixels down toward mid, so the bright
    burning-street background reads less, WITHOUT flattening her bold black ink or her lit skin. amount=0
    is a no-op (keep her exactly as rendered). Operates per-pixel, contrast-preserving."""
    if not amount:
        return girl_rgb
    g = np.asarray(girl_rgb).astype(np.float32)
    lum = g.mean(axis=2, keepdims=True)
    t = np.clip((lum - 200.0) / 55.0, 0.0, 1.0)        # only the >200 near-whites engage
    out = g - t * amount * (g)                          # scale those toward black by `amount`
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))

def scale_about_centroid(girl_rgb, kp_norm, scale, drop):
    """Scale the girl layer about the figure centroid and shift down by `drop` (fraction of H),
    so she reads smaller + lower-foreground with the hero looming over. Returns (img, new_kp_px)."""
    cx = sum(x for x, y in kp_norm.values()) / len(kp_norm) * W
    cy = sum(y for x, y in kp_norm.values()) / len(kp_norm) * H
    nw, nh = int(W * scale), int(H * scale)
    small = girl_rgb.resize((nw, nh), Image.LANCZOS)
    canvas = Image.new("RGB", (W, H), (250, 248, 244))  # rough-paper white = matches style negative space
    ox = int(cx - cx * scale); oy = int(cy - cy * scale + drop * H)
    canvas.paste(small, (ox, oy))
    new_kp = {i: (int(x * W * scale + ox), int(y * H * scale + oy + 0)) for i, (x, y) in kp_norm.items()}
    return canvas, new_kp

def compose(variants):
    scene = Image.open(os.path.join(LAY, "scene.png")).convert("RGB").resize((W, H))
    girl = Image.open(os.path.join(LAY, "girl.png")).convert("RGB").resize((W, H))
    saved = []
    for tag, scale, drop, knock in variants:
        g_scaled, kp_px = scale_about_centroid(girl, CP.GIRL_ON_GROUND, scale, drop)
        mask = ellipse_mask(kp_px)
        g_lit = knock_back_plate(g_scaled, knock)
        comp = Image.composite(g_lit, scene, mask)
        p = os.path.join(LAY, f"composite_v2_{tag}.png"); comp.save(p)
        mask.save(os.path.join(LAY, f"mask_v2_{tag}.png"))
        print(f"  [compose] {tag}: scale={scale} drop={drop} knock={knock} -> {os.path.basename(p)}", flush=True)
        saved.append(p)
    print("COMPOSE_DONE")
    return saved

# ---------- integrate (ComfyUI) ----------
def g_integrate(prompt, init_name, pose_name, seed, prefix, denoise, pose_strength):
    return {
      "ckpt": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": RS.CKPT}},
      "pos": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt, "clip": ["ckpt", 1]}},
      "neg": {"class_type": "CLIPTextEncode", "inputs": {"text": RS.NEG, "clip": ["ckpt", 1]}},
      "init": {"class_type": "LoadImage", "inputs": {"image": init_name}},
      "pose_img": {"class_type": "LoadImage", "inputs": {"image": pose_name}},
      "cn_pose": {"class_type": "ControlNetLoader", "inputs": {"control_net_name": RS.CN_POSE}},
      "ap": {"class_type": "ControlNetApplyAdvanced", "inputs": {"positive": ["pos", 0], "negative": ["neg", 0],
             "control_net": ["cn_pose", 0], "image": ["pose_img", 0], "strength": pose_strength, "start_percent": 0.0, "end_percent": 0.8}},
      "enc": {"class_type": "VAEEncode", "inputs": {"pixels": ["init", 0], "vae": ["ckpt", 2]}},
      "samp": {"class_type": "KSampler", "inputs": {"model": ["ckpt", 0], "positive": ["ap", 0], "negative": ["ap", 1],
               "latent_image": ["enc", 0], "seed": seed, "steps": 30, "cfg": 6.0, "sampler_name": "dpmpp_2m", "scheduler": "karras", "denoise": denoise}},
      "dec": {"class_type": "VAEDecode", "inputs": {"samples": ["samp", 0], "vae": ["ckpt", 2]}},
      "save": {"class_type": "SaveImage", "inputs": {"filename_prefix": prefix, "images": ["dec", 0]}},
    }

def integrate(comp_path, denoises, seeds, pose_strength):
    combined_op = os.path.join(GP, "S05_composite_openpose.png")
    comp_up = RS.upload(comp_path); pose_up = RS.upload(combined_op)
    prompt = f"a man in a crouch over a dying woman on cracked ground, a crowd recoiling, {SHARED}, {RS.STYLE_TXT}"
    outs = []
    for den in denoises:
        for sd in seeds:
            name = f"final_v2_d{int(den*100):02d}_s{sd}"
            dest = os.path.join(LAY, f"{name}.png")
            dt = RS.run(g_integrate(prompt, comp_up, pose_up, sd, name, den, pose_strength), dest)
            print(f"  [integrate] den={den} seed={sd} ps={pose_strength} ({dt:.0f}s) -> {os.path.basename(dest)}", flush=True)
            outs.append(dest)
    print("INTEGRATE_DONE")
    return outs

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("compose")
    pi = sub.add_parser("integrate")
    pi.add_argument("--comp", required=True)
    pi.add_argument("--denoise", type=float, nargs="+", default=[0.30, 0.40])
    pi.add_argument("--seeds", type=int, nargs="+", default=[7373, 1111])
    pi.add_argument("--pose-strength", type=float, default=0.65)
    a = ap.parse_args()
    if a.cmd == "compose":
        # keep the girl PROMINENT (the proven composite read her well); the fix is the tight body mask
        # (kills the bright-plate bleed) + an optional gentle plate knock-back, NOT shrinking her away.
        compose([
            ("a", 1.00, 0.00, 0.00),   # girl exactly as rendered, tight-masked into the scene (minimal fix)
            ("b", 1.00, 0.00, 0.35),   # same, gently knock back her plate's brightest burning-street whites
            ("c", 0.96, 0.04, 0.20),   # a touch smaller + lower so the hero looms slightly more, mild knock
        ])
    else:
        comp = a.comp if os.path.isabs(a.comp) else os.path.join(HERE, a.comp)
        integrate(comp, a.denoise, a.seeds, a.pose_strength)
