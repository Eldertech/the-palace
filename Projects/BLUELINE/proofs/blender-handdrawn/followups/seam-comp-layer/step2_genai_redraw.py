"""
BLUELINE seam-comp-layer PROOF — Step 2
Gen-AI redraw of city_plate.png (and city_with_blobs_baked.png for the baked comparison).
Uses the locked pen-flow style + d0.92 / loose canny.

Outputs to followups/seam-comp-layer/:
  inked_plate.png          — gen-AI redrawn city_plate (the base for comp-layer composite)
  inked_baked.png          — gen-AI redrawn city_with_blobs_baked (the 'baked' comparison)
"""
import json, os, shutil, time, urllib.request, uuid

SERVER = "127.0.0.1:8188"
PALACE = "/Users/loudonstearns/Documents/The Palace"
ROOT = os.path.join(PALACE, "Projects/BLUELINE/proofs/blender-handdrawn")
PROOF = os.path.join(ROOT, "followups/seam-comp-layer")
COMFY = os.path.join(PALACE, "_tools/ComfyUI")
INDIR  = os.path.join(COMFY, "input")
OUTDIR = os.path.join(COMFY, "output")
LOCK_PATH = os.path.join(ROOT, "..", "style-lock", "locked-style.json")

os.makedirs(PROOF, exist_ok=True)
LOCK = json.load(open(LOCK_PATH))

# locked style front-loads the ink medium per 02b_stylize_push.py convention
INK = ("stark black and white pen and ink illustration, sumi-e brush, manga inking, "
       "heavy spotted blacks, bold dramatic sweeping flow lines and speed streaks, "
       "scattered energetic ink splatter, rough white paper, lots of white space, "
       "film-noir deep shadow, loose gestural linework, low canted angle")
SCENE = "a burning city street at night, tall buildings, a lone figure, smoke rising"
NEG = LOCK["neg_extra"]
POS = f"{INK}, {SCENE}"


def stage(src_path, name):
    """Copy a file into ComfyUI input dir; return the filename."""
    dst = os.path.join(INDIR, name)
    shutil.copyfile(src_path, dst)
    return name


def graph(init_img, ctrl_img, denoise, cn_strength, cn_end, seed, cfg=7.5, steps=26):
    """SDXL img2img + canny controlnet — same topology as seam_variation.py."""
    return {
        "ckpt": {
            "class_type": "CheckpointLoaderSimple",
            "inputs": {"ckpt_name": "sd_xl_base_1.0.safetensors"}
        },
        "pos": {
            "class_type": "CLIPTextEncode",
            "inputs": {"text": POS, "clip": ["ckpt", 1]}
        },
        "neg": {
            "class_type": "CLIPTextEncode",
            "inputs": {"text": NEG, "clip": ["ckpt", 1]}
        },
        "init": {"class_type": "LoadImage", "inputs": {"image": init_img}},
        "ctrl": {"class_type": "LoadImage", "inputs": {"image": ctrl_img}},
        "canny": {
            "class_type": "Canny",
            "inputs": {"image": ["ctrl", 0], "low_threshold": 0.15, "high_threshold": 0.4}
        },
        "cnet": {
            "class_type": "ControlNetLoader",
            "inputs": {"control_net_name": "controlnet-canny-sdxl.safetensors"}
        },
        "cna": {
            "class_type": "ControlNetApplyAdvanced",
            "inputs": {
                "positive": ["pos", 0], "negative": ["neg", 0],
                "control_net": ["cnet", 0], "image": ["canny", 0],
                "strength": cn_strength, "start_percent": 0.0, "end_percent": cn_end,
                "vae": ["ckpt", 2]
            }
        },
        "venc": {
            "class_type": "VAEEncode",
            "inputs": {"pixels": ["init", 0], "vae": ["ckpt", 2]}
        },
        "ks": {
            "class_type": "KSampler",
            "inputs": {
                "model": ["ckpt", 0],
                "positive": ["cna", 0], "negative": ["cna", 1],
                "latent_image": ["venc", 0],
                "seed": seed, "steps": steps, "cfg": cfg,
                "sampler_name": "dpmpp_2m", "scheduler": "karras",
                "denoise": denoise
            }
        },
        "vd": {"class_type": "VAEDecode", "inputs": {"samples": ["ks", 0], "vae": ["ckpt", 2]}},
        "sv": {
            "class_type": "SaveImage",
            "inputs": {"images": ["vd", 0], "filename_prefix": "seam_comp"}
        },
    }


def queue(g, timeout=1200):
    cid = str(uuid.uuid4())
    req = urllib.request.Request(
        f"http://{SERVER}/prompt",
        data=json.dumps({"prompt": g, "client_id": cid}).encode(),
        headers={"Content-Type": "application/json"}
    )
    pid = json.loads(urllib.request.urlopen(req).read())["prompt_id"]
    print(f"  queued {pid}", flush=True)
    t0 = time.time()
    while True:
        time.sleep(3)
        h = json.loads(urllib.request.urlopen(f"http://{SERVER}/history/{pid}").read())
        if pid in h:
            for node in h[pid]["outputs"].values():
                for im in node.get("images", []):
                    return os.path.join(OUTDIR, im.get("subfolder", ""), im["filename"]), time.time() - t0
        if time.time() - t0 > timeout:
            raise TimeoutError(f"Timeout waiting for {pid}")


JOBS = [
    # (label,           init_src,                         ctrl_src,               denoise, cn,   cn_end, seed)
    ("inked_plate",     "city_plate.png",                 "city_plate.png",       0.92,    0.42, 0.50,   4242),
    ("inked_baked",     "city_with_blobs_baked.png",      "city_with_blobs_baked.png", 0.92, 0.42, 0.50, 4242),
]

for label, init_src, ctrl_src, denoise, cn, cn_end, seed in JOBS:
    init_path = os.path.join(PROOF, init_src)
    ctrl_path = os.path.join(PROOF, ctrl_src)
    assert os.path.exists(init_path), f"Missing init: {init_path} — run step1 first"
    assert os.path.exists(ctrl_path), f"Missing ctrl: {ctrl_path} — run step1 first"
    in_name  = stage(init_path, f"comp_{label}_init.png")
    ctrl_name = stage(ctrl_path, f"comp_{label}_ctrl.png")
    g = graph(in_name, ctrl_name, denoise, cn, cn_end, seed)
    print(f"[{label}] denoise={denoise} cn={cn}/{cn_end} seed={seed} ...", flush=True)
    out_path, dt = queue(g)
    dst = os.path.join(PROOF, f"{label}.png")
    shutil.copyfile(out_path, dst)
    print(f"[{label}] done in {dt:.0f}s → {dst}", flush=True)

print("\nSTEP 2 COMPLETE")
