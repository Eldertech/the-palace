#!/usr/bin/env python3
"""
Rich-first / stylize-last multi-cam path (Loudon's re-architecture, adopted from BLUELINE
new-story/rich_pipeline.py + silhouette.py).

  RENDER RICH   each figure info-rich (shading, edges), pose-conditioned — NOT pen-flow yet.
  SEGMENT SHARP GrabCut seeded by the authored skeleton silhouette -> an edge-accurate ALPHA cutout
                that follows the actual drawn clothing (real edges exist because the render is rich).
  COMPOSITE     sharp RGBA figure layers over a rich env, back->front.
  STYLIZE LAST  one img2img pass over the whole composite -> pen-flow, pose held, fusing the layers.

Answers "render the character with an alpha layer so compositing is accurate" — the alpha comes from
GrabCut-seeded-by-silhouette, which is scale-correct because our pose plate is already at the figure's
true screen position (no place() step needed, unlike the original).

  <comfy venv>/python rich_first.py
Writes renders/render_NNN (the stylized result) + the pre-stylize rich composite, appends the scroll.
"""
import os, io, json, math, datetime, shutil
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance
import genai_camera as g

DIR = g.DIR; RDIR = os.path.join(DIR, "renders")
RICH = ("dramatic cinematic comic illustration, full color, strong directional key light and deep "
        "volumetric shadow, rich mid-tones, detailed rendering, plain flat background")

# ---------------- adopted verbatim: silhouette.py ----------------
LIMB_W = [((2,3),0.55),((3,4),0.42),((5,6),0.55),((6,7),0.42),((8,9),0.72),((9,10),0.52),
          ((11,12),0.72),((12,13),0.52),((1,2),0.62),((1,5),0.62),((1,8),0.95),((1,11),0.95),((1,0),0.5)]
def _d(a, b): return math.hypot(a[0]-b[0], a[1]-b[1])
def silhouette_mask(kp, W, H, feather=18, scale=1.0):
    m = Image.new("L", (W, H), 0); dr = ImageDraw.Draw(m)
    has = lambda *ids: all(i in kp for i in ids)
    torso = _d(kp[1], kp[8]) if has(1, 8) else 0.15 * H
    base = max(10.0, torso * 0.46 * scale)
    if has(2, 5, 11, 8): dr.polygon([kp[2], kp[5], kp[11], kp[8]], fill=255)
    if has(1, 8, 11):    dr.polygon([kp[1], kp[8], kp[11]], fill=255)
    if has(1, 2, 5):     dr.polygon([kp[1], kp[2], kp[5]], fill=255)
    def capsule(a, b, w):
        w = int(max(4, w)); dr.line([kp[a], kp[b]], fill=255, width=w)
        for i in (a, b):
            x, y = kp[i]; r = w / 2; dr.ellipse([x-r, y-r, x+r, y+r], fill=255)
    for (a, b), wf in LIMB_W:
        if has(a, b): capsule(a, b, base * wf)
    face = [kp[i] for i in (0, 14, 15, 16, 17) if i in kp]
    if face:
        xs = [p[0] for p in face]; ys = [p[1] for p in face]
        cx, cy = sum(xs)/len(xs), sum(ys)/len(ys)
        hr = max(base * 0.95, (max(xs)-min(xs)) * 0.9)
        dr.ellipse([cx-hr, cy-hr*1.25, cx+hr, cy+hr*1.05], fill=255)
    return m.filter(ImageFilter.GaussianBlur(feather))

# ---------------- adopted: rich_pipeline.grabcut_sharp ----------------
def grabcut_sharp(render_pil, kp_px, W, H, scale=1.18):
    img = cv2.cvtColor(np.array(render_pil.convert("RGB")), cv2.COLOR_RGB2BGR)
    sil = np.array(silhouette_mask(kp_px, W, H, feather=0, scale=scale))
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
    return Image.fromarray(out).filter(ImageFilter.GaussianBlur(1.2))

def kp_from_json(path):
    d = json.load(open(path)); return {i: (int(x), int(y)) for i, (x, y, v) in enumerate(d["keypoints"]) if v}, tuple(d["res"])

# ---------------- graphs (Lightning) ----------------
def _base():
    return {
      "ckpt": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": g.CKPT}},
      "lora": {"class_type": "LoraLoader", "inputs": {"model": ["ckpt", 0], "clip": ["ckpt", 1],
               "lora_name": g.LORA, "strength_model": 1.0, "strength_clip": 1.0}},
    }
def fig_graph(prompt, beauty_fn, pose_fn, seed, W, H, denoise=0.72):
    # img2img from the figure's own plate (already at the correct screen scale/position) so scale is
    # IMPOSED by the init, + pose ControlNet for costume freedom, RICH style. The scale lesson: a
    # standalone txt2img fills the frame — the init pins it small and in place.
    d = _base(); d.update({
      "pos": {"class_type": "CLIPTextEncode", "inputs": {"text": f"{prompt}, {RICH}", "clip": ["lora", 1]}},
      "neg": {"class_type": "CLIPTextEncode", "inputs": {"text": g.NEG + ", furniture, table", "clip": ["lora", 1]}},
      "init":{"class_type": "LoadImage", "inputs": {"image": beauty_fn}},
      "enc": {"class_type": "VAEEncode", "inputs": {"pixels": ["init", 0], "vae": ["ckpt", 2]}},
      "cnl": {"class_type": "ControlNetLoader", "inputs": {"control_net_name": g.CN["pose"]}},
      "pim": {"class_type": "LoadImage", "inputs": {"image": pose_fn}},
      "ap":  {"class_type": "ControlNetApplyAdvanced", "inputs": {"positive": ["pos", 0], "negative": ["neg", 0],
              "control_net": ["cnl", 0], "image": ["pim", 0], "strength": 0.95, "start_percent": 0.0, "end_percent": 0.9}},
      "samp":{"class_type": "KSampler", "inputs": {"model": ["lora", 0], "positive": ["ap", 0], "negative": ["ap", 1],
              "latent_image": ["enc", 0], "seed": seed, "steps": 8, "cfg": 1.8, "sampler_name": "euler", "scheduler": "sgm_uniform", "denoise": denoise}},
      "dec": {"class_type": "VAEDecode", "inputs": {"samples": ["samp", 0], "vae": ["ckpt", 2]}},
      "save":{"class_type": "SaveImage", "inputs": {"filename_prefix": "rich_fig", "images": ["dec", 0]}},
    }); return d
def env_graph(prompt, init_fn, depth_fn, seed, W, H):
    d = _base(); d.update({
      "pos": {"class_type": "CLIPTextEncode", "inputs": {"text": f"{prompt}, {RICH}", "clip": ["lora", 1]}},
      "neg": {"class_type": "CLIPTextEncode", "inputs": {"text": g.NEG, "clip": ["lora", 1]}},
      "init":{"class_type": "LoadImage", "inputs": {"image": init_fn}},
      "dep": {"class_type": "LoadImage", "inputs": {"image": depth_fn}},
      "enc": {"class_type": "VAEEncode", "inputs": {"pixels": ["init", 0], "vae": ["ckpt", 2]}},
      "cnl": {"class_type": "ControlNetLoader", "inputs": {"control_net_name": g.CN["depth"]}},
      "ap":  {"class_type": "ControlNetApplyAdvanced", "inputs": {"positive": ["pos", 0], "negative": ["neg", 0],
              "control_net": ["cnl", 0], "image": ["dep", 0], "strength": 0.5, "start_percent": 0.0, "end_percent": 0.85}},
      "samp":{"class_type": "KSampler", "inputs": {"model": ["lora", 0], "positive": ["ap", 0], "negative": ["ap", 1],
              "latent_image": ["enc", 0], "seed": seed, "steps": 8, "cfg": 1.8, "sampler_name": "euler", "scheduler": "sgm_uniform", "denoise": 0.9}},
      "dec": {"class_type": "VAEDecode", "inputs": {"samples": ["samp", 0], "vae": ["ckpt", 2]}},
      "save":{"class_type": "SaveImage", "inputs": {"filename_prefix": "rich_env", "images": ["dec", 0]}},
    }); return d
def stylize_graph(init_fn, pose_fn, prompt, seed, denoise, W, H):
    d = _base(); d.update({
      "pos": {"class_type": "CLIPTextEncode", "inputs": {"text": f"{prompt}, {g.PENFLOW}", "clip": ["lora", 1]}},
      "neg": {"class_type": "CLIPTextEncode", "inputs": {"text": g.NEG, "clip": ["lora", 1]}},
      "init":{"class_type": "LoadImage", "inputs": {"image": init_fn}},
      "pim": {"class_type": "LoadImage", "inputs": {"image": pose_fn}},
      "enc": {"class_type": "VAEEncode", "inputs": {"pixels": ["init", 0], "vae": ["ckpt", 2]}},
      "cnl": {"class_type": "ControlNetLoader", "inputs": {"control_net_name": g.CN["pose"]}},
      "ap":  {"class_type": "ControlNetApplyAdvanced", "inputs": {"positive": ["pos", 0], "negative": ["neg", 0],
              "control_net": ["cnl", 0], "image": ["pim", 0], "strength": 0.85, "start_percent": 0.0, "end_percent": 0.9}},
      "samp":{"class_type": "KSampler", "inputs": {"model": ["lora", 0], "positive": ["ap", 0], "negative": ["ap", 1],
              "latent_image": ["enc", 0], "seed": seed, "steps": 8, "cfg": 1.8, "sampler_name": "euler", "scheduler": "sgm_uniform", "denoise": denoise}},
      "dec": {"class_type": "VAEDecode", "inputs": {"samples": ["samp", 0], "vae": ["ckpt", 2]}},
      "save":{"class_type": "SaveImage", "inputs": {"filename_prefix": "rich_final", "images": ["dec", 0]}},
    }); return d

def run(graph):
    b, dt = g.run_graph(graph); return g._to_pil(b), dt

def main():
    layers = json.load(open(os.path.join(DIR, "layers.json")))
    env, figs = layers[0], layers[1:]
    SEED = 21
    # size from the env depth plate
    W, H = Image.open(os.path.join(DIR, "depth_env.png")).size

    # 1) RICH env base
    ei = g.upload(os.path.join(DIR, "beauty_env.png")); ed = g.upload(os.path.join(DIR, "depth_env.png"))
    stage, _ = run(env_graph(env["prompt"], ei, ed, SEED, W, H)); stage = stage.convert("RGB")
    print("  [rich] env base", flush=True)

    # 2) RICH figures -> 3) SEGMENT SHARP -> 4) COMPOSITE back->front
    combined = Image.new("RGB", (W, H), (0, 0, 0))
    for ly in figs:
        nm = ly["name"]
        op = g.layer_pose(nm)                              # openpose_<nm>.png (drawn if needed)
        kp, res = kp_from_json(os.path.join(DIR, f"keypoints_{nm}.json"))
        rich, _ = run(fig_graph(ly["prompt"], g.upload(os.path.join(DIR, f"beauty_{nm}.png")), g.upload(op), SEED, W, H))
        rich = rich.convert("RGB").resize((W, H))
        sharp = grabcut_sharp(rich, kp, W, H)              # edge-accurate ALPHA
        stage = Image.composite(rich, stage, sharp)        # paste the cut figure over the env
        # accumulate the combined pose plate for the final stylize
        combined = Image.fromarray(np.maximum(np.array(combined), np.array(Image.open(op).convert("RGB").resize((W, H)))))
        sharp.save(os.path.join(DIR, f"_sharp_{nm}.png"))
        print(f"  [rich+cut] {nm}", flush=True)
    comp_path = os.path.join(RDIR, "rich_composite.png"); stage.save(comp_path)
    print("  [composite] sharp RGBA layers over env", flush=True)

    # 5) STYLIZE LAST: desaturate (value carries depth) + img2img high-denoise pen-flow, pose held
    desat = ImageEnhance.Contrast(stage.convert("L")).enhance(1.2).convert("RGB")
    dp = os.path.join(DIR, "_rich_desat.png"); desat.save(dp)
    cop = os.path.join(DIR, "_rich_combined_op.png"); combined.save(cop)
    prompt = " and ".join(l["prompt"][:40] for l in figs) + ", two figures facing off on a battlefield"
    final, dt = run(stylize_graph(g.upload(dp), g.upload(cop), prompt, 909, 0.8, W, H))
    print(f"  [stylize-last] pen-flow fuse ({dt:.0f}s)", flush=True)

    streams = [("env beauty", os.path.join(DIR, "beauty_env.png")),
               ("env depth", os.path.join(DIR, "depth_env.png"))]
    for ly in figs:
        streams += [(f"{ly['name']} pose", os.path.join(DIR, f"openpose_{ly['name']}.png")),
                    (f"{ly['name']} sharp-α", os.path.join(DIR, f"_sharp_{ly['name']}.png"))]
    streams.append(("rich composite (pre-stylize)", comp_path))
    g.emit(final.convert("RGB"), "proof",
           {"prompt": "rich-first / stylize-last", "denoise": 0.8, "seed": 909, "dt": round(dt, 1),
            "note": "RICH-FIRST: render rich -> GrabCut-seeded-by-silhouette alpha cutout -> composite -> stylize last (adopted from BLUELINE rich_pipeline)"},
           streams)
    print("RICH_FIRST_DONE")

if __name__ == "__main__":
    main()
