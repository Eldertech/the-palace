#!/usr/bin/env python3
"""
BLUELINE · NEW STORY — GENERATIVE LAYERING (the render-leg fix). One render can't hold a dense
multi-figure scene against heavy pen-flow ink — secondary figures dissolve. So render each character in
its own clean pass under SHARED context (the locked style, scene words) + UNIQUE context (its pose +
identity), composite the layers, then run a final INTEGRATE pass (img2img over the combined OpenPose) to
fuse them into one coherent drawing. Photoshop layers, but generative — shared context buys
compositability, the integrate pass is the authored seam.

Reuses render_shot (per-layer pose-conditioned pen-flow render) + compose_pose (the hand-placed girl).
Default config = the dying-girl frame: a SCENE layer (crowd + hero) + a GIRL layer (clean foreground),
composited, then integrated against the combined openpose.

Run (comfy venv, :8189): python layer_render.py
Outputs -> proofs/new-story/layers/<name>.png (each layer) + composite.png + final.png
"""
import os, json, time, uuid, urllib.request, urllib.parse
from PIL import Image, ImageDraw, ImageFilter
import render_shot as RS       # graph(), run(), upload(), STYLE_TXT, NEG, CKPT, CN_POSE
import compose_pose as CP      # GIRL_ON_GROUND, draw_skeleton

HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, "layers"); os.makedirs(OUT, exist_ok=True)
HOST = "127.0.0.1:8189"; CLIENT = uuid.uuid4().hex
W, H = 1216, 832  # the S05 wide frame
SHARED = "burning noir city street at night, smoke and embers, cracked pavement"  # shared scene context

def _req(method, path, data=None):
    h = {"Content-Type": "application/json"} if data else {}
    r = urllib.request.Request(f"http://{HOST}{path}", data=data, method=method, headers=h)
    with urllib.request.urlopen(r, timeout=900) as resp: return resp.read()

# ---- per-layer render: a pose-conditioned pen-flow pass (reuses render_shot's proven graph) ----
def render_layer(layer_prompt, openpose_path, seed, name):
    pu = RS.upload(openpose_path)
    prompt = f"{layer_prompt}, {SHARED}, {RS.STYLE_TXT}"
    dest = os.path.join(OUT, f"{name}.png")
    RS.run(RS.graph(prompt, W, H, seed, f"layer_{name}", pose_name=pu), dest)
    return dest

# ---- synthesize the girl-only openpose (hand-placed, on black) ----
def synth_girl_openpose():
    img = Image.new("RGB", (W, H), (0, 0, 0)); dr = ImageDraw.Draw(img)
    kp = {i: (int(x * W), int(y * H)) for i, (x, y) in CP.GIRL_ON_GROUND.items()}
    CP.draw_skeleton(dr, kp)
    p = os.path.join(OUT, "girl_only_openpose.png"); img.save(p)
    return p, kp

def feathered_mask(kp, pad_x=0.10, pad_y=0.14, blur=40):
    xs = [x for x, y in kp.values()]; ys = [y for x, y in kp.values()]
    x0, x1 = min(xs), max(xs); y0, y1 = min(ys), max(ys)
    px, py = int((x1 - x0) * pad_x + 0.06 * W), int((y1 - y0) * pad_y + 0.05 * H)
    m = Image.new("L", (W, H), 0)
    ImageDraw.Draw(m).ellipse([x0 - px, y0 - py, x1 + px, y1 + py], fill=255)
    return m.filter(ImageFilter.GaussianBlur(blur))

# ---- integrate pass: img2img over the composite, conditioned on the COMBINED openpose, to fuse ----
def g_integrate(prompt, init_name, pose_name, seed, prefix, denoise):
    return {
      "ckpt": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": RS.CKPT}},
      "pos": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt, "clip": ["ckpt", 1]}},
      "neg": {"class_type": "CLIPTextEncode", "inputs": {"text": RS.NEG, "clip": ["ckpt", 1]}},
      "init": {"class_type": "LoadImage", "inputs": {"image": init_name}},
      "pose_img": {"class_type": "LoadImage", "inputs": {"image": pose_name}},
      "cn_pose": {"class_type": "ControlNetLoader", "inputs": {"control_net_name": RS.CN_POSE}},
      "ap": {"class_type": "ControlNetApplyAdvanced", "inputs": {"positive": ["pos", 0], "negative": ["neg", 0],
             "control_net": ["cn_pose", 0], "image": ["pose_img", 0], "strength": 0.5, "start_percent": 0.0, "end_percent": 0.7}},
      "enc": {"class_type": "VAEEncode", "inputs": {"pixels": ["init", 0], "vae": ["ckpt", 2]}},
      "samp": {"class_type": "KSampler", "inputs": {"model": ["ckpt", 0], "positive": ["ap", 0], "negative": ["ap", 1],
               "latent_image": ["enc", 0], "seed": seed, "steps": 28, "cfg": 6.0, "sampler_name": "dpmpp_2m", "scheduler": "karras", "denoise": denoise}},
      "dec": {"class_type": "VAEDecode", "inputs": {"samples": ["samp", 0], "vae": ["ckpt", 2]}},
      "save": {"class_type": "SaveImage", "inputs": {"filename_prefix": prefix, "images": ["dec", 0]}},
    }

def main():
    gp = os.path.join(HERE, "genpose")
    scene_op = os.path.join(gp, "S05_0_openpose_00001_.png")     # crowd + hero (extracted)
    combined_op = os.path.join(gp, "S05_composite_openpose.png")  # crowd + hero + girl (for the integrate pass)

    # 1) SCENE layer — crowd + hero
    scene = render_layer("a powerful man landing in a crouch, a shocked crowd recoiling behind him",
                         scene_op, 5151, "scene")
    print(f"  [layer] scene -> {os.path.basename(scene)}", flush=True)

    # 2) GIRL layer — clean foreground, her own pass (the fix: she gets a dedicated render)
    girl_op, girl_kp = synth_girl_openpose()
    girl = render_layer("a dying young woman lying collapsed on the ground in the foreground, reaching up weakly",
                        girl_op, 6262, "girl")
    print(f"  [layer] girl -> {os.path.basename(girl)}", flush=True)

    # 3) COMPOSITE — overlay the masked girl onto the scene foreground
    scene_im = Image.open(scene).convert("RGB").resize((W, H))
    girl_im = Image.open(girl).convert("RGB").resize((W, H))
    mask = feathered_mask(girl_kp)
    composite = Image.composite(girl_im, scene_im, mask)
    comp_p = os.path.join(OUT, "composite.png"); composite.save(comp_p)
    print(f"  [composite] girl over scene -> composite.png", flush=True)

    # 4) INTEGRATE — img2img over the composite, conditioned on the combined openpose, to fuse the layers
    comp_up = RS.upload(comp_p); pose_up = RS.upload(combined_op)
    prompt = f"a man in a crouch over a dying woman on cracked ground, a crowd recoiling, {SHARED}, {RS.STYLE_TXT}"
    final_p = os.path.join(OUT, "final.png")
    RS.run(g_integrate(prompt, comp_up, pose_up, 7373, "layer_final", denoise=0.42), final_p)
    print(f"  [integrate] fused -> final.png", flush=True)
    print("LAYER_RENDER_DONE")

if __name__ == "__main__":
    main()
