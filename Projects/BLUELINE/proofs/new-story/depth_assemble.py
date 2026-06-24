#!/usr/bin/env python3
"""
BLUELINE · NEW STORY — SHOT 05 DEPTH PASS (Loudon: "feels like a collage — be aware of depth and scale").

Reuses the existing layers (crowd bg + authored hero + authored woman) and re-composites them with real
depth cues instead of a flat same-scale paste:
  - ATMOSPHERIC PERSPECTIVE: haze the background (crowd) lighter + lower-contrast so it recedes.
  - SCALE-WITH-DEPTH: woman full-size in the foreground; hero a touch smaller and set back.
  - CONTACT SHADOWS: soft darkening on the ground under each figure so they sit IN the scene, not on it.
  - STAGING TIGHTEN: shift the woman left so her head lands under the hero -> he finally faces her head.
The figure transforms carry through to BOTH the silhouette masks and the combined OpenPose, so the
low-denoise integrate keeps the depth instead of flattening it back to a collage.

  <comfy venv>/python depth_assemble.py
Outputs -> layers/s05_depth_composite.png + s05_depth_final_d{35,45}.png
"""
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
import render_shot as RS
import compose_pose as CP
import regen_girl as RG
import author_hero as AH
from silhouette import silhouette_mask

HERE = os.path.dirname(os.path.abspath(__file__))
GP = os.path.join(HERE, "genpose"); LAY = os.path.join(HERE, "layers")
W, H = 1216, 832
SHARED = "burning noir city street at night, smoke and embers, cracked pavement"

# --- transforms: (scale, dx, dy) in normalized units; foreground bigger, background smaller/back ---
WOMAN_T = (1.00, -0.22, 0.02)   # full size, shifted LEFT so her head sits under the hero, nudged down
HERO_T  = (0.88,  0.00, -0.03)  # smaller + set back (further) than the woman

def place(layer, kp_norm, t):
    scale, dx, dy = t
    nw, nh = int(W*scale), int(H*scale)
    small = layer.resize((nw, nh), Image.LANCZOS)
    canvas = Image.new("RGB", (W, H), (244, 242, 238))
    ox = int((W-nw)/2 + dx*W); oy = int((H-nh)/2 + dy*H)
    canvas.paste(small, (ox, oy))
    kp_px = {i: (int(x*nw + ox), int(y*nh + oy)) for i, (x, y) in kp_norm.items()}
    return canvas, kp_px

def knock_plate(img, amount):
    g = np.asarray(img).astype(np.float32); lum = g.mean(axis=2, keepdims=True)
    t = np.clip((lum - 200.0)/55.0, 0, 1)
    return Image.fromarray(np.clip(g - t*amount*g, 0, 255).astype(np.uint8))

def atmospheric_haze(img, horizon=0.46, strength=0.55, haze=232.0):
    arr = np.asarray(img).astype(np.float32); h = arr.shape[0]
    col = np.linspace(0, 1, h)
    g = np.clip((horizon - col)/horizon, 0, 1)[:, None, None] * strength   # 1->0 top->horizon
    out = arr*(1 - g) + haze*g
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))

def contact_shadow(canvas, kp_px, idxs, pad_x, pad_y, dy, strength):
    pts = [kp_px[i] for i in idxs if i in kp_px]
    if not pts: return canvas
    xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
    x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
    cx, cy = (x0+x1)/2, y1 + dy
    rx, ry = (x1-x0)/2 + pad_x, pad_y
    sh = Image.new("L", (W, H), 0)
    ImageDraw.Draw(sh).ellipse([cx-rx, cy-ry, cx+rx, cy+ry], fill=int(255*strength))
    sh = sh.filter(ImageFilter.GaussianBlur(48))
    return Image.composite(Image.new("RGB", (W, H), (4, 4, 4)), canvas, sh)

def combined_openpose(hero_kp, woman_kp):
    img = Image.new("RGB", (W, H), (0, 0, 0)); dr = ImageDraw.Draw(img)
    CP.draw_skeleton(dr, hero_kp); CP.draw_skeleton(dr, woman_kp)
    p = os.path.join(GP, "S05_depth_openpose.png"); img.save(p); return p

def g_integrate(prompt, init_name, pose_name, seed, prefix, denoise, pose_strength=0.55):
    return {
      "ckpt": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": RS.CKPT}},
      "pos": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt, "clip": ["ckpt", 1]}},
      "neg": {"class_type": "CLIPTextEncode", "inputs": {"text": RS.NEG, "clip": ["ckpt", 1]}},
      "init": {"class_type": "LoadImage", "inputs": {"image": init_name}},
      "pose_img": {"class_type": "LoadImage", "inputs": {"image": pose_name}},
      "cn_pose": {"class_type": "ControlNetLoader", "inputs": {"control_net_name": RS.CN_POSE}},
      "ap": {"class_type": "ControlNetApplyAdvanced", "inputs": {"positive": ["pos", 0], "negative": ["neg", 0],
             "control_net": ["cn_pose", 0], "image": ["pose_img", 0], "strength": pose_strength, "start_percent": 0.0, "end_percent": 0.75}},
      "enc": {"class_type": "VAEEncode", "inputs": {"pixels": ["init", 0], "vae": ["ckpt", 2]}},
      "samp": {"class_type": "KSampler", "inputs": {"model": ["ckpt", 0], "positive": ["ap", 0], "negative": ["ap", 1],
               "latent_image": ["enc", 0], "seed": seed, "steps": 30, "cfg": 6.0, "sampler_name": "dpmpp_2m", "scheduler": "karras", "denoise": denoise}},
      "dec": {"class_type": "VAEDecode", "inputs": {"samples": ["samp", 0], "vae": ["ckpt", 2]}},
      "save": {"class_type": "SaveImage", "inputs": {"filename_prefix": prefix, "images": ["dec", 0]}},
    }

def main():
    bg = Image.open(os.path.join(LAY, "s05_crowd_bg.png")).convert("RGB").resize((W, H))
    bg = atmospheric_haze(bg)                                   # crowd recedes

    hero_layer = knock_plate(Image.open(os.path.join(GP, "hero_311.png")).convert("RGB").resize((W, H)), 0.25)
    hero_img, hero_kp = place(hero_layer, AH.HERO, HERO_T)
    woman_layer = knock_plate(Image.open(os.path.join(GP, "girl_right_s4242.png")).convert("RGB").resize((W, H)), 0.20)
    woman_img, woman_kp = place(woman_layer, RG.mirror(RG.GIRL_LEFT), WOMAN_T)

    stage = bg
    stage = contact_shadow(stage, hero_kp, [9, 10, 12, 13], pad_x=40, pad_y=34, dy=10, strength=0.5)   # under hero base
    stage = Image.composite(hero_img, stage, silhouette_mask(hero_kp, W, H, feather=22, scale=1.18))
    stage = contact_shadow(stage, woman_kp, [8, 9, 10, 11, 12, 13], pad_x=60, pad_y=30, dy=18, strength=0.55)  # under woman
    stage = Image.composite(woman_img, stage, silhouette_mask(woman_kp, W, H, feather=22, scale=1.12))

    comp_p = os.path.join(LAY, "s05_depth_composite.png"); stage.save(comp_p)
    print("  [composite] hazed bg + scaled figures + contact shadows ->", os.path.basename(comp_p), flush=True)

    op = combined_openpose(hero_kp, woman_kp)
    comp_up = RS.upload(comp_p); op_up = RS.upload(op)
    prompt = (f"a man kneeling and bowing over a dying woman lying on the cracked ground, his hands on her, "
              f"a crowd recoiling in the hazy smoke behind, deep atmospheric depth, {SHARED}, {RS.STYLE_TXT}")
    for den in (0.35, 0.45):
        dest = os.path.join(LAY, f"s05_depth_final_d{int(den*100)}.png")
        dt = RS.run(g_integrate(prompt, comp_up, op_up, 808, f"s05_depth_d{int(den*100)}", den), dest)
        print(f"  [integrate] den={den} ({dt:.0f}s) ->", os.path.basename(dest), flush=True)
    print("DEPTH_DONE")

if __name__ == "__main__":
    main()
