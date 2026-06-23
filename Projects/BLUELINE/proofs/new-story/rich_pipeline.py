#!/usr/bin/env python3
"""
BLUELINE · FRAME DESIGNER — RICH-FIRST / STYLIZE-LAST prototype (Loudon's re-architecture).

Tests the hypothesis that we stylize too early. Instead of rendering each figure in stark pen-flow ink
(an OUTPUT skin with no detectable edges and no mid-tones), we:
  RENDER RICH   each figure in a full-information style (color, shading, lower contrast) on a separable
                background, openpose-first, strong conditioning (pose is style-independent).
  SEGMENT SHARP GrabCut seeded by the authored skeleton silhouette -> an edge-accurate cutout (~1px feather,
                not the 22px fuzz that made the composite ghostly). Real edges exist now because the render
                is information-rich.
  COMPOSITE     sharp layers + value-based atmospheric haze + scale-with-depth + contact shadows.
  STYLIZE LAST  one img2img pass converts the whole rich composite to the locked pen-flow, structure held
                by the combined OpenPose. This pass also FUSES the sharp layers into one drawing.

Compare the outputs to the ghostly stylize-early baseline (layers/s05_depth_final_d35.png).

  <comfy venv>/python rich_pipeline.py
Outputs -> layers/rich_composite.png (sharp, rich) + rich_final_d{55,65}.png (stylized)
"""
import os, json, argparse
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFilter
import render_shot as RS
import compose_pose as CP
import regen_girl as RG
import author_hero as AH
from silhouette import silhouette_mask
from pod_backend import Backend

BK = Backend(None)   # set from --pod in __main__; local ComfyUI by default

HERE = os.path.dirname(os.path.abspath(__file__))
GP = os.path.join(HERE, "genpose"); LAY = os.path.join(HERE, "layers")
W, H = 1216, 832
RICH = ("dramatic cinematic comic illustration, full color, strong directional key light and deep volumetric "
        "shadow, rich mid-tones, detailed rendering, sense of depth")
PLATE = "on a flat plain neutral grey backdrop, simple studio background"
STYLE = json.load(open(os.path.join(HERE, "..", "style-lock", "locked-style.json")))["style"]

FIGS = [
  {"name": "hero",  "kp": AH.HERO,                 "z": 1, "ps": 0.9,  "depth": (0.88, 0.0, -0.03),
   "prompt": "a powerful man in a long coat kneeling low, seen from the front, head bowed looking down, reaching one hand forward and down, grief"},
  {"name": "woman", "kp": RG.mirror(RG.GIRL_LEFT), "z": 2, "ps": 0.95, "depth": (1.0, -0.10, 0.02),
   "prompt": "a young woman lying on her back collapsed, her head at the right and feet to the left, one arm reaching weakly upward, dark hair spilling"},
]

def author_op(kp_norm, name):
    img = Image.new("RGB", (W, H), (0, 0, 0)); dr = ImageDraw.Draw(img)
    CP.draw_skeleton(dr, {i: (int(x*W), int(y*H)) for i, (x, y) in kp_norm.items()})
    p = os.path.join(GP, f"{name}_op.png"); img.save(p); return p

def graph_rich(prompt, seed, prefix, pose_name, ps):
    g = RS.graph(prompt, W, H, seed, prefix, pose_name=pose_name)
    g["ap_pose"]["inputs"]["strength"] = ps; g["ap_pose"]["inputs"]["end_percent"] = 0.9
    g["neg"]["inputs"]["text"] = "lowres, deformed, extra limbs, two heads, blurry, watermark, text"  # NOT the pen-flow neg
    return g

def grabcut_sharp(render_pil, kp_px, scale=1.12):
    """Sharp, edge-following figure mask: GrabCut seeded by the authored skeleton silhouette."""
    img = cv2.cvtColor(np.array(render_pil.convert("RGB")), cv2.COLOR_RGB2BGR)
    sil = np.array(silhouette_mask(kp_px, W, H, feather=0, scale=scale))   # hard skeleton silhouette
    gc = np.full(img.shape[:2], cv2.GC_PR_BGD, np.uint8)
    gc[sil > 128] = cv2.GC_PR_FGD
    core = cv2.erode((sil > 128).astype(np.uint8), np.ones((27, 27), np.uint8))
    gc[core > 0] = cv2.GC_FGD
    bgd, fgd = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
    try:
        cv2.grabCut(img, gc, None, bgd, fgd, 6, cv2.GC_INIT_WITH_MASK)
    except Exception as e:
        print("  [grabcut] fell back to silhouette:", e); return Image.fromarray(sil)
    out = np.where((gc == cv2.GC_FGD) | (gc == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)
    out = cv2.morphologyEx(out, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))
    out = cv2.morphologyEx(out, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
    return Image.fromarray(out).filter(ImageFilter.GaussianBlur(1.2))   # ~1px anti-alias, NOT 22

def place(layer, kp_norm, depth):
    scale, dx, dy = depth; nw, nh = int(W*scale), int(H*scale)
    canvas = Image.new("RGB", (W, H), (128, 128, 128)); small = layer.resize((nw, nh), Image.LANCZOS)
    ox = int((W-nw)/2 + dx*W); oy = int((H-nh)/2 + dy*H); canvas.paste(small, (ox, oy))
    kp_px = {i: (int(x*nw+ox), int(y*nh+oy)) for i, (x, y) in kp_norm.items()}
    return canvas, kp_px, (ox, oy, nw, nh)

def place_mask(mask, box):
    ox, oy, nw, nh = box; c = Image.new("L", (W, H), 0); c.paste(mask.resize((nw, nh)), (ox, oy)); return c

def haze(img, horizon=0.46, strength=0.5, hz=210.0):
    a = np.asarray(img).astype(np.float32); h = a.shape[0]
    g = np.clip((horizon - np.linspace(0, 1, h))/horizon, 0, 1)[:, None, None]*strength
    return Image.fromarray(np.clip(a*(1-g)+hz*g, 0, 255).astype(np.uint8))

def contact(canvas, kp_px, idxs, strength=0.45):
    pts = [kp_px[i] for i in idxs if i in kp_px]
    if not pts: return canvas
    xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
    cx, cy = (min(xs)+max(xs))/2, max(ys)+14; rx, ry = (max(xs)-min(xs))/2+50, 28
    sh = Image.new("L", (W, H), 0); ImageDraw.Draw(sh).ellipse([cx-rx, cy-ry, cx+rx, cy+ry], fill=int(255*strength))
    return Image.composite(Image.new("RGB", (W, H), (8, 8, 10)), canvas, sh.filter(ImageFilter.GaussianBlur(46)))

def combined_op(kps, name):
    img = Image.new("RGB", (W, H), (0, 0, 0)); dr = ImageDraw.Draw(img)
    for kp in kps: CP.draw_skeleton(dr, kp)
    p = os.path.join(GP, f"{name}.png"); img.save(p); return p

def g_stylize(prompt, init, pose, seed, prefix, denoise):
    return {
      "ckpt": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": RS.CKPT}},
      "pos": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt, "clip": ["ckpt", 1]}},
      "neg": {"class_type": "CLIPTextEncode", "inputs": {"text": RS.NEG, "clip": ["ckpt", 1]}},
      "init": {"class_type": "LoadImage", "inputs": {"image": init}},
      "pimg": {"class_type": "LoadImage", "inputs": {"image": pose}},
      "cn": {"class_type": "ControlNetLoader", "inputs": {"control_net_name": RS.CN_POSE}},
      "ap": {"class_type": "ControlNetApplyAdvanced", "inputs": {"positive": ["pos", 0], "negative": ["neg", 0],
             "control_net": ["cn", 0], "image": ["pimg", 0], "strength": 0.55, "start_percent": 0.0, "end_percent": 0.7}},
      "enc": {"class_type": "VAEEncode", "inputs": {"pixels": ["init", 0], "vae": ["ckpt", 2]}},
      "samp": {"class_type": "KSampler", "inputs": {"model": ["ckpt", 0], "positive": ["ap", 0], "negative": ["ap", 1],
               "latent_image": ["enc", 0], "seed": seed, "steps": 30, "cfg": 6.5, "sampler_name": "dpmpp_2m", "scheduler": "karras", "denoise": denoise}},
      "dec": {"class_type": "VAEDecode", "inputs": {"samples": ["samp", 0], "vae": ["ckpt", 2]}},
      "save": {"class_type": "SaveImage", "inputs": {"filename_prefix": prefix, "images": ["dec", 0]}},
    }

def main():
    # 1) RENDER RICH figures on a plain plate
    rich = {}
    for f in FIGS:
        op = author_op(f["kp"], f"rich_{f['name']}"); op_up = BK.upload(op)
        prompt = f"{f['prompt']}, {RICH}, {PLATE}"
        dest = os.path.join(GP, f"rich_{f['name']}.png")
        dt = BK.run(graph_rich(prompt, 4242, f"rich_{f['name']}", op_up, f["ps"]), dest)
        rich[f["name"]] = dest; print(f"  [rich] {f['name']} ({dt:.0f}s)", flush=True)

    # 2) RICH crowd bg
    bg_p = os.path.join(LAY, "rich_crowd_bg.png")
    BK.run(RS.graph(f"a crowd of shocked figures recoiling in a burning city street, {RICH}, no central figure", W, H, 2025, "rich_bg"), bg_p)
    stage = haze(Image.open(bg_p).convert("RGB").resize((W, H)))
    print("  [rich] crowd bg + haze", flush=True)

    # 3) SEGMENT SHARP + 4) COMPOSITE depth, back->front
    kps = []
    for f in sorted(FIGS, key=lambda x: x["z"]):
        layer = Image.open(rich[f["name"]]).convert("RGB").resize((W, H))
        placed, kp_px, box = place(layer, f["kp"], f["depth"])
        # sharp mask computed on the PLACED (scaled) layer so edges line up
        sharp = grabcut_sharp(placed, kp_px)
        kps.append(kp_px)
        stage = contact(stage, kp_px, [8, 9, 10, 11, 12, 13])
        stage = Image.composite(placed, stage, sharp)
        sharp.save(os.path.join(GP, f"rich_{f['name']}_sharpmask.png"))
    comp_p = os.path.join(LAY, "rich_composite.png"); stage.save(comp_p)
    print("  [composite] sharp + depth ->", os.path.basename(comp_p), flush=True)

    # 5) STYLIZE LAST -> pen-flow
    op = combined_op(kps, "rich_combined_op")
    comp_up = BK.upload(comp_p); op_up = BK.upload(op)
    prompt = f"a man kneeling over a dying woman on the cracked ground, a crowd recoiling behind, {STYLE}"
    for den in (0.55, 0.65):
        dest = os.path.join(LAY, f"rich_final_d{int(den*100)}.png")
        dt = BK.run(g_stylize(prompt, comp_up, op_up, 909, f"rich_final_d{int(den*100)}", den), dest)
        print(f"  [stylize] den={den} ({dt:.0f}s) -> {os.path.basename(dest)}", flush=True)
    print("RICH_DONE")

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--pod", default=None, help="RunPod pod id; omit for local ComfyUI")
    a = ap.parse_args()
    BK = Backend(a.pod)
    print(f"backend: {'pod '+a.pod if a.pod else 'local ComfyUI'}", flush=True)
    main()
