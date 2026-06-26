"""
BLUELINE — Redraw Posed Figure Proof · Step 2: Three ControlNet anchoring strategies
Runs the high-denoise pen-flow REDRAW (0.92-0.95) three ways:
  A: canny only
  B: canny + depth ControlNet
  C: canny + openpose ControlNet (high strength)

Each at two denoise values (0.92 and 0.95) for a total of 6 outputs.
Also tests a high-strength openpose-only pass (D) to establish what openpose alone can hold.

Outputs saved to: followups/redraw-posed-figure/redraw_*.png
"""
import json, os, shutil, time, urllib.request, uuid

SERVER = "127.0.0.1:8188"
BASE = "/Users/loudonstearns/Documents/The Palace/Projects/BLUELINE/proofs/blender-handdrawn"
PROOF = os.path.join(BASE, "followups", "redraw-posed-figure")
COMFY = "/Users/loudonstearns/Documents/The Palace/_tools/ComfyUI"
INDIR = os.path.join(COMFY, "input")
OUTDIR = os.path.join(COMFY, "output")
os.makedirs(PROOF, exist_ok=True)

LOCK = json.load(open(os.path.join(BASE, "..", "style-lock", "locked-style.json")))

# Ink-forward prompt — same idiom as prior work
STYLE = LOCK["style"]
SCENE = ("a crouching hero figure in dynamic landing pose, bent knees, arms spread, "
         "low angle view, dramatic ink illustration")
POS = f"{STYLE}, {SCENE}"
NEG = LOCK["neg_extra"]

# ---------------------------------------------------------------------------
def stage(src_path, name):
    dst = os.path.join(INDIR, name)
    shutil.copyfile(src_path, dst)
    return name

def queue_and_wait(g):
    cid = str(uuid.uuid4())
    req = urllib.request.Request(
        f"http://{SERVER}/prompt",
        data=json.dumps({"prompt": g, "client_id": cid}).encode(),
        headers={"Content-Type": "application/json"})
    pid = json.loads(urllib.request.urlopen(req).read())["prompt_id"]
    t0 = time.time()
    while True:
        time.sleep(3)
        h = json.loads(urllib.request.urlopen(f"http://{SERVER}/history/{pid}").read())
        if pid in h:
            outputs = h[pid]["outputs"]
            for node in outputs.values():
                for im in node.get("images", []):
                    fp = os.path.join(OUTDIR, im.get("subfolder", ""), im["filename"])
                    return fp, time.time() - t0
        if time.time() - t0 > 1500:
            raise TimeoutError(f"Job {pid} timed out")

# ---------------------------------------------------------------------------
def graph_A_canny_only(init_img, ctrl_img, denoise, seed=4242, steps=28, cfg=7.5):
    """Baseline: canny ControlNet only, no depth/pose anchor."""
    return {
        "ckpt": {"class_type": "CheckpointLoaderSimple",
                 "inputs": {"ckpt_name": "sd_xl_base_1.0.safetensors"}},
        "pos":  {"class_type": "CLIPTextEncode", "inputs": {"text": POS, "clip": ["ckpt", 1]}},
        "neg":  {"class_type": "CLIPTextEncode", "inputs": {"text": NEG, "clip": ["ckpt", 1]}},
        "init": {"class_type": "LoadImage", "inputs": {"image": init_img}},
        "ctrl": {"class_type": "LoadImage", "inputs": {"image": ctrl_img}},
        "canny": {"class_type": "Canny",
                  "inputs": {"image": ["ctrl", 0], "low_threshold": 0.12, "high_threshold": 0.38}},
        "cnet_c": {"class_type": "ControlNetLoader",
                   "inputs": {"control_net_name": "controlnet-canny-sdxl.safetensors"}},
        "cna_c": {"class_type": "ControlNetApplyAdvanced",
                  "inputs": {
                      "positive": ["pos", 0], "negative": ["neg", 0],
                      "control_net": ["cnet_c", 0], "image": ["canny", 0],
                      "strength": 0.55, "start_percent": 0.0, "end_percent": 0.6,
                      "vae": ["ckpt", 2]}},
        "venc": {"class_type": "VAEEncode",
                 "inputs": {"pixels": ["init", 0], "vae": ["ckpt", 2]}},
        "ks":   {"class_type": "KSampler",
                 "inputs": {
                     "model": ["ckpt", 0], "positive": ["cna_c", 0], "negative": ["cna_c", 1],
                     "latent_image": ["venc", 0], "seed": seed, "steps": steps, "cfg": cfg,
                     "sampler_name": "dpmpp_2m", "scheduler": "karras", "denoise": denoise}},
        "vd":   {"class_type": "VAEDecode", "inputs": {"samples": ["ks", 0], "vae": ["ckpt", 2]}},
        "sv":   {"class_type": "SaveImage",
                 "inputs": {"images": ["vd", 0], "filename_prefix": "fig_A"}},
    }

def graph_B_canny_depth(init_img, ctrl_img, depth_img, denoise, seed=4242, steps=28, cfg=7.5,
                        cn_strength=0.55, depth_strength=0.65):
    """Canny + Depth chained: canny loosely guides style, depth anchors body volume."""
    return {
        "ckpt": {"class_type": "CheckpointLoaderSimple",
                 "inputs": {"ckpt_name": "sd_xl_base_1.0.safetensors"}},
        "pos":  {"class_type": "CLIPTextEncode", "inputs": {"text": POS, "clip": ["ckpt", 1]}},
        "neg":  {"class_type": "CLIPTextEncode", "inputs": {"text": NEG, "clip": ["ckpt", 1]}},
        "init": {"class_type": "LoadImage", "inputs": {"image": init_img}},
        "ctrl": {"class_type": "LoadImage", "inputs": {"image": ctrl_img}},
        "depth_img": {"class_type": "LoadImage", "inputs": {"image": depth_img}},
        "canny": {"class_type": "Canny",
                  "inputs": {"image": ["ctrl", 0], "low_threshold": 0.12, "high_threshold": 0.38}},
        # Canny ControlNet
        "cnet_c": {"class_type": "ControlNetLoader",
                   "inputs": {"control_net_name": "controlnet-canny-sdxl.safetensors"}},
        "cna_c": {"class_type": "ControlNetApplyAdvanced",
                  "inputs": {
                      "positive": ["pos", 0], "negative": ["neg", 0],
                      "control_net": ["cnet_c", 0], "image": ["canny", 0],
                      "strength": cn_strength, "start_percent": 0.0, "end_percent": 0.6,
                      "vae": ["ckpt", 2]}},
        # Depth ControlNet — feeds from canny's output conditioning
        "cnet_d": {"class_type": "ControlNetLoader",
                   "inputs": {"control_net_name": "controlnet-depth-sdxl.safetensors"}},
        "cna_d": {"class_type": "ControlNetApplyAdvanced",
                  "inputs": {
                      "positive": ["cna_c", 0], "negative": ["cna_c", 1],
                      "control_net": ["cnet_d", 0], "image": ["depth_img", 0],
                      "strength": depth_strength, "start_percent": 0.0, "end_percent": 0.7,
                      "vae": ["ckpt", 2]}},
        "venc": {"class_type": "VAEEncode",
                 "inputs": {"pixels": ["init", 0], "vae": ["ckpt", 2]}},
        "ks":   {"class_type": "KSampler",
                 "inputs": {
                     "model": ["ckpt", 0], "positive": ["cna_d", 0], "negative": ["cna_d", 1],
                     "latent_image": ["venc", 0], "seed": seed, "steps": steps, "cfg": cfg,
                     "sampler_name": "dpmpp_2m", "scheduler": "karras", "denoise": denoise}},
        "vd":   {"class_type": "VAEDecode", "inputs": {"samples": ["ks", 0], "vae": ["ckpt", 2]}},
        "sv":   {"class_type": "SaveImage",
                 "inputs": {"images": ["vd", 0], "filename_prefix": "fig_B"}},
    }

def graph_C_canny_openpose(init_img, ctrl_img, pose_img, denoise, seed=4242, steps=28, cfg=7.5,
                            cn_strength=0.50, pose_strength=0.80):
    """Canny + OpenPose chained: canny for surface, openpose locks the skeleton layout."""
    return {
        "ckpt": {"class_type": "CheckpointLoaderSimple",
                 "inputs": {"ckpt_name": "sd_xl_base_1.0.safetensors"}},
        "pos":  {"class_type": "CLIPTextEncode", "inputs": {"text": POS, "clip": ["ckpt", 1]}},
        "neg":  {"class_type": "CLIPTextEncode", "inputs": {"text": NEG, "clip": ["ckpt", 1]}},
        "init": {"class_type": "LoadImage", "inputs": {"image": init_img}},
        "ctrl": {"class_type": "LoadImage", "inputs": {"image": ctrl_img}},
        "pose_img": {"class_type": "LoadImage", "inputs": {"image": pose_img}},
        "canny": {"class_type": "Canny",
                  "inputs": {"image": ["ctrl", 0], "low_threshold": 0.12, "high_threshold": 0.38}},
        # Canny ControlNet
        "cnet_c": {"class_type": "ControlNetLoader",
                   "inputs": {"control_net_name": "controlnet-canny-sdxl.safetensors"}},
        "cna_c": {"class_type": "ControlNetApplyAdvanced",
                  "inputs": {
                      "positive": ["pos", 0], "negative": ["neg", 0],
                      "control_net": ["cnet_c", 0], "image": ["canny", 0],
                      "strength": cn_strength, "start_percent": 0.0, "end_percent": 0.55,
                      "vae": ["ckpt", 2]}},
        # OpenPose ControlNet — high strength to lock the skeleton layout
        "cnet_p": {"class_type": "ControlNetLoader",
                   "inputs": {"control_net_name": "controlnet-openpose-sdxl.safetensors"}},
        "cna_p": {"class_type": "ControlNetApplyAdvanced",
                  "inputs": {
                      "positive": ["cna_c", 0], "negative": ["cna_c", 1],
                      "control_net": ["cnet_p", 0], "image": ["pose_img", 0],
                      "strength": pose_strength, "start_percent": 0.0, "end_percent": 0.75,
                      "vae": ["ckpt", 2]}},
        "venc": {"class_type": "VAEEncode",
                 "inputs": {"pixels": ["init", 0], "vae": ["ckpt", 2]}},
        "ks":   {"class_type": "KSampler",
                 "inputs": {
                     "model": ["ckpt", 0], "positive": ["cna_p", 0], "negative": ["cna_p", 1],
                     "latent_image": ["venc", 0], "seed": seed, "steps": steps, "cfg": cfg,
                     "sampler_name": "dpmpp_2m", "scheduler": "karras", "denoise": denoise}},
        "vd":   {"class_type": "VAEDecode", "inputs": {"samples": ["ks", 0], "vae": ["ckpt", 2]}},
        "sv":   {"class_type": "SaveImage",
                 "inputs": {"images": ["vd", 0], "filename_prefix": "fig_C"}},
    }

# ---------------------------------------------------------------------------
# Stage input images
# ---------------------------------------------------------------------------
init_n  = stage(os.path.join(PROOF, "toon_plate.png"),  "fig_init.png")
ctrl_n  = stage(os.path.join(PROOF, "ink_plate.png"),   "fig_ctrl.png")
depth_n = stage(os.path.join(PROOF, "depth_plate.png"), "fig_depth.png")
pose_n  = stage(os.path.join(PROOF, "openpose.png"),    "fig_pose.png")

SEED = 4242

JOBS = [
    # (label, graph_fn, denoise)
    ("A_canny_d092", graph_A_canny_only(init_n, ctrl_n, 0.92, SEED)),
    ("A_canny_d095", graph_A_canny_only(init_n, ctrl_n, 0.95, SEED)),

    ("B_canny_depth_d092", graph_B_canny_depth(init_n, ctrl_n, depth_n, 0.92, SEED,
                                                cn_strength=0.55, depth_strength=0.68)),
    ("B_canny_depth_d095", graph_B_canny_depth(init_n, ctrl_n, depth_n, 0.95, SEED,
                                                cn_strength=0.50, depth_strength=0.72)),

    ("C_canny_pose_d092",  graph_C_canny_openpose(init_n, ctrl_n, pose_n, 0.92, SEED,
                                                   cn_strength=0.50, pose_strength=0.80)),
    ("C_canny_pose_d095",  graph_C_canny_openpose(init_n, ctrl_n, pose_n, 0.95, SEED,
                                                   cn_strength=0.45, pose_strength=0.85)),
]

results = []
for label, g in JOBS:
    print(f"\n[{label}] queuing ...", flush=True)
    try:
        out_path, dt = queue_and_wait(g)
        dst = os.path.join(PROOF, f"redraw_{label}.png")
        shutil.copyfile(out_path, dst)
        results.append((label, dst, dt, "OK"))
        print(f"[{label}] done in {dt:.0f}s → {dst}", flush=True)
    except Exception as e:
        results.append((label, None, 0, str(e)))
        print(f"[{label}] FAILED: {e}", flush=True)

print("\n=== SUMMARY ===")
for label, dst, dt, status in results:
    print(f"  {label}: {status}  ({dt:.0f}s)" if dst else f"  {label}: FAILED — {status}")
print("REDRAW DONE")
