#!/usr/bin/env python3
"""
BLUELINE · FRAME DESIGNER — COMPLEX-SCENE PIPELINE (the reusable system, not one frame).

One parameterized flow for a multi-figure staged frame, consolidating everything learned on shot 05:

  AUTHOR    each figure's OpenPose skeleton (facing encoded by L/R limb colors + frontal face kp)
  GENERATE  N seeds per figure, openpose-first, STRONG conditioning (lying/critical figures obey at ~0.95);
            save a [openpose | gen0 | gen1 ...] check sheet per figure -> the obey-rate is visible
  SELECT    auto-pick a gen per figure (--pick), or eyeball the sheet
  COMPOSITE depth-aware: atmospheric haze on the gen-first crowd bg + scale-with-depth placement +
            contact shadows + silhouette masks grown from each authored skeleton
  FUSE      low-denoise integrate over the combined OpenPose -> one pen-flow drawing that keeps the staging

A SCENE is pure data (figures = skeleton + prompt + pose_strength + depth transform + z-order). Re-point
the SCENE for a future complex frame; the flow is unchanged. Run it a few times (vary --seed) to confirm
the findings reproduce and to tune.

  <comfy venv>/python scene_pipeline.py --seed 1000 --tag A --ngens 2
Outputs (tagged): genpose/<tag>_<fig>_openpose.png, <tag>_<fig>_g<seed>.png, <tag>_<fig>_sheet.png;
                  layers/<tag>_composite.png, <tag>_final.png
"""
import os, argparse
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

# ---------------- SCENE SPEC (the dying-girl frame; re-point for a new complex scene) ----------------
SCENE = {
  "bg_prompt": ("a crowd of shocked noir figures recoiling in fear in the background of a burning city "
                "street, wide empty cracked asphalt foreground, no central figure, deep shadow"),
  "figures": [
    # z = composite order (low = back). foreground figure bigger; background figure smaller + set back.
    {"name": "hero",  "kp": AH.HERO,                  "z": 1, "pose_strength": 0.9,  "knock": 0.25,
     "depth": (0.88, 0.00, -0.03), "mask_scale": 1.18,
     "prompt": ("a powerful man in a long coat kneeling low on the cracked ground, seen from the front, "
                "head bowed looking down, reaching one hand forward and down, grief and shock, dynamic")},
    {"name": "woman", "kp": RG.mirror(RG.GIRL_LEFT),  "z": 2, "pose_strength": 0.95, "knock": 0.20,
     "depth": (1.00, -0.12, 0.02), "mask_scale": 1.12,
     "prompt": ("a young woman lying on her back collapsed on the cracked ground, her head at the right and "
                "feet to the left, one arm reaching weakly upward, dark hair spilling, foreground")},
  ],
  "integrate_prompt": ("a man kneeling and bowing over a dying woman lying on the cracked ground, his hands "
                       "on her, a crowd recoiling in the hazy smoke behind, deep atmospheric depth"),
  "integrate_denoise": 0.40,
}

# ---------------- helpers ----------------
def author_openpose(kp_norm, name):
    img = Image.new("RGB", (W, H), (0, 0, 0)); dr = ImageDraw.Draw(img)
    kp_px = {i: (int(x*W), int(y*H)) for i, (x, y) in kp_norm.items()}
    CP.draw_skeleton(dr, kp_px)
    p = os.path.join(GP, f"{name}_openpose.png"); img.save(p); return p

def graph_strong(prompt, seed, prefix, pose_name, pose_strength, end_pct=0.92):
    g = RS.graph(prompt, W, H, seed, prefix, pose_name=pose_name)   # reuse base; override pose strength
    g["ap_pose"]["inputs"]["strength"] = pose_strength
    g["ap_pose"]["inputs"]["end_percent"] = end_pct
    return g

def check_sheet(op_path, gen_paths, out_path):
    imgs = [Image.open(op_path).convert("RGB")] + [Image.open(p).convert("RGB").resize((W, H)) for p in gen_paths]
    sheet = Image.new("RGB", (W, H*len(imgs) + 6*(len(imgs)-1)), (12, 12, 12))
    for i, im in enumerate(imgs): sheet.paste(im, (0, i*(H+6)))
    sheet.save(out_path)

def knock_plate(img, amount):
    g = np.asarray(img).astype(np.float32); lum = g.mean(axis=2, keepdims=True)
    t = np.clip((lum - 200.0)/55.0, 0, 1)
    return Image.fromarray(np.clip(g - t*amount*g, 0, 255).astype(np.uint8))

def place(layer, kp_norm, depth):
    scale, dx, dy = depth
    nw, nh = int(W*scale), int(H*scale)
    small = layer.resize((nw, nh), Image.LANCZOS)
    canvas = Image.new("RGB", (W, H), (244, 242, 238))
    ox = int((W-nw)/2 + dx*W); oy = int((H-nh)/2 + dy*H)
    canvas.paste(small, (ox, oy))
    kp_px = {i: (int(x*nw + ox), int(y*nh + oy)) for i, (x, y) in kp_norm.items()}
    return canvas, kp_px

def atmospheric_haze(img, horizon=0.46, strength=0.55, haze=232.0):
    arr = np.asarray(img).astype(np.float32); h = arr.shape[0]
    g = np.clip((horizon - np.linspace(0, 1, h))/horizon, 0, 1)[:, None, None] * strength
    return Image.fromarray(np.clip(arr*(1-g) + haze*g, 0, 255).astype(np.uint8))

def contact_shadow(canvas, kp_px, idxs, pad_x, pad_y, dy, strength):
    pts = [kp_px[i] for i in idxs if i in kp_px]
    if not pts: return canvas
    xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
    cx, cy = (min(xs)+max(xs))/2, max(ys) + dy
    rx, ry = (max(xs)-min(xs))/2 + pad_x, pad_y
    sh = Image.new("L", (W, H), 0); ImageDraw.Draw(sh).ellipse([cx-rx, cy-ry, cx+rx, cy+ry], fill=int(255*strength))
    return Image.composite(Image.new("RGB", (W, H), (4, 4, 4)), canvas, sh.filter(ImageFilter.GaussianBlur(48)))

def combined_openpose(fig_kps, tag):
    img = Image.new("RGB", (W, H), (0, 0, 0)); dr = ImageDraw.Draw(img)
    for kp in fig_kps: CP.draw_skeleton(dr, kp)
    p = os.path.join(GP, f"{tag}_combined_openpose.png"); img.save(p); return p

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

# ---------------- the flow ----------------
def run(master_seed, tag, ngens, pick):
    figs = SCENE["figures"]
    # AUTHOR + GENERATE (multi-seed, openpose-first)
    chosen = {}
    for fi, f in enumerate(figs):
        op = author_openpose(f["kp"], f"{tag}_{f['name']}")
        op_up = RS.upload(op)
        prompt = f"{f['prompt']}, {SHARED}, {RS.STYLE_TXT}"
        gen_paths = []
        for gi in range(ngens):
            sd = master_seed + 1000*fi + 137*gi
            dest = os.path.join(GP, f"{tag}_{f['name']}_g{sd}.png")
            dt = RS.run(graph_strong(prompt, sd, f"{tag}_{f['name']}_g{sd}", op_up, f["pose_strength"]), dest)
            gen_paths.append(dest)
            print(f"  [gen] {tag}/{f['name']} seed={sd} ps={f['pose_strength']} ({dt:.0f}s)", flush=True)
        check_sheet(op, gen_paths, os.path.join(GP, f"{tag}_{f['name']}_sheet.png"))
        chosen[f["name"]] = gen_paths[min(pick, len(gen_paths)-1)]

    # BG (gen-first crowd) + atmospheric haze
    bg_p = os.path.join(LAY, f"{tag}_crowd_bg.png")
    RS.run(RS.graph(f"{SCENE['bg_prompt']}, {RS.STYLE_TXT}", W, H, master_seed + 777, f"{tag}_bg"), bg_p)
    stage = atmospheric_haze(Image.open(bg_p).convert("RGB").resize((W, H)))
    print(f"  [bg] {tag} crowd plate + haze", flush=True)

    # COMPOSITE depth-aware, in z-order (back -> front)
    fig_kps = []
    for f in sorted(figs, key=lambda x: x["z"]):
        layer = knock_plate(Image.open(chosen[f["name"]]).convert("RGB").resize((W, H)), f["knock"])
        img, kp_px = place(layer, f["kp"], f["depth"])
        fig_kps.append(kp_px)
        base_idx = [8, 9, 10, 11, 12, 13]
        stage = contact_shadow(stage, kp_px, base_idx, pad_x=50, pad_y=30, dy=14, strength=0.5)
        stage = Image.composite(img, stage, silhouette_mask(kp_px, W, H, feather=22, scale=f["mask_scale"]))
    comp_p = os.path.join(LAY, f"{tag}_composite.png"); stage.save(comp_p)
    print(f"  [composite] {tag} depth composite", flush=True)

    # FUSE
    op = combined_openpose(fig_kps, tag)
    comp_up = RS.upload(comp_p); op_up = RS.upload(op)
    prompt = f"{SCENE['integrate_prompt']}, {SHARED}, {RS.STYLE_TXT}"
    final_p = os.path.join(LAY, f"{tag}_final.png")
    dt = RS.run(g_integrate(prompt, comp_up, op_up, master_seed + 808, f"{tag}_final", SCENE["integrate_denoise"]), final_p)
    print(f"  [final] {tag} fused ({dt:.0f}s) -> {os.path.basename(final_p)}", flush=True)
    print(f"RUN_{tag}_DONE")

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--seed", type=int, default=1000)
    ap.add_argument("--tag", default="A")
    ap.add_argument("--ngens", type=int, default=2)
    ap.add_argument("--pick", type=int, default=0)
    a = ap.parse_args()
    run(a.seed, a.tag, a.ngens, a.pick)
