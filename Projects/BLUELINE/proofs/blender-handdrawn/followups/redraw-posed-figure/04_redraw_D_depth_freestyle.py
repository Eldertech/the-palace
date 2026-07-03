"""
BLUELINE — Redraw Posed Figure Proof · Step 4: the missing quadrant.
A/B/C established the tension:
  - high canny/depth strength HOLDS pose but suppresses the stark-ink style (grey render);
  - openpose + low canny FREES the ink style but MELTS the body.

Step 4 hunts the sweet spot: keep canny low (let ink emerge) but anchor the body with
DEPTH at a moderate strength that ends early (so late-step ink freedom is preserved).
Also tries depth+openpose together (D2) as the coordinator suggested, and an ink-plate
init variant (D3) since the toon init's grey may be dragging the look toward render.

Jobs (denoise 0.93 throughout — the pen-flow target):
  D1: canny(0.35,end0.5) + depth(0.55,end0.55), toon init
  D2: depth(0.6,end0.6) + openpose(0.7,end0.7), low canny(0.30), toon init
  D3: canny(0.35,end0.5) + depth(0.55,end0.55), INK-plate init (whiter, line-forward)
"""
import json, os, shutil, time, urllib.request, uuid

SERVER = "127.0.0.1:8188"
BASE = "/Users/loudonstearns/Documents/The Palace/Projects/BLUELINE/proofs/blender-handdrawn"
PROOF = os.path.join(BASE, "followups", "redraw-posed-figure")
COMFY = "/Users/loudonstearns/Documents/The Palace/_tools/ComfyUI"
INDIR = os.path.join(COMFY, "input")
OUTDIR = os.path.join(COMFY, "output")

LOCK = json.load(open(os.path.join(BASE, "..", "style-lock", "locked-style.json")))
STYLE = LOCK["style"]
SCENE = ("a crouching hero figure in dynamic landing pose, bent knees, arms spread, "
         "low angle view, dramatic ink illustration")
POS = f"{STYLE}, {SCENE}"
NEG = LOCK["neg_extra"]
SEED = 4242

def stage(src_path, name):
    shutil.copyfile(src_path, os.path.join(INDIR, name)); return name

def queue_and_wait(g):
    cid = str(uuid.uuid4())
    req = urllib.request.Request(f"http://{SERVER}/prompt",
        data=json.dumps({"prompt": g, "client_id": cid}).encode(),
        headers={"Content-Type": "application/json"})
    pid = json.loads(urllib.request.urlopen(req).read())["prompt_id"]
    t0 = time.time()
    while True:
        time.sleep(3)
        h = json.loads(urllib.request.urlopen(f"http://{SERVER}/history/{pid}").read())
        if pid in h:
            for node in h[pid]["outputs"].values():
                for im in node.get("images", []):
                    return os.path.join(OUTDIR, im.get("subfolder", ""), im["filename"]), time.time()-t0
        if time.time()-t0 > 1500: raise TimeoutError()

def base_nodes(init_img, ctrl_img):
    return {
        "ckpt": {"class_type": "CheckpointLoaderSimple",
                 "inputs": {"ckpt_name": "sd_xl_base_1.0.safetensors"}},
        "pos":  {"class_type": "CLIPTextEncode", "inputs": {"text": POS, "clip": ["ckpt", 1]}},
        "neg":  {"class_type": "CLIPTextEncode", "inputs": {"text": NEG, "clip": ["ckpt", 1]}},
        "init": {"class_type": "LoadImage", "inputs": {"image": init_img}},
        "ctrl": {"class_type": "LoadImage", "inputs": {"image": ctrl_img}},
        "canny": {"class_type": "Canny",
                  "inputs": {"image": ["ctrl", 0], "low_threshold": 0.12, "high_threshold": 0.38}},
        "venc": {"class_type": "VAEEncode", "inputs": {"pixels": ["init", 0], "vae": ["ckpt", 2]}},
    }

def add_canny_cn(g, prev_pos, prev_neg, strength, end):
    g["cnet_c"] = {"class_type": "ControlNetLoader",
                   "inputs": {"control_net_name": "controlnet-canny-sdxl.safetensors"}}
    g["cna_c"] = {"class_type": "ControlNetApplyAdvanced",
                  "inputs": {"positive": prev_pos, "negative": prev_neg,
                             "control_net": ["cnet_c", 0], "image": ["canny", 0],
                             "strength": strength, "start_percent": 0.0, "end_percent": end,
                             "vae": ["ckpt", 2]}}
    return ["cna_c", 0], ["cna_c", 1]

def add_depth_cn(g, depth_img, prev_pos, prev_neg, strength, end):
    g["depth_img"] = {"class_type": "LoadImage", "inputs": {"image": depth_img}}
    g["cnet_d"] = {"class_type": "ControlNetLoader",
                   "inputs": {"control_net_name": "controlnet-depth-sdxl.safetensors"}}
    g["cna_d"] = {"class_type": "ControlNetApplyAdvanced",
                  "inputs": {"positive": prev_pos, "negative": prev_neg,
                             "control_net": ["cnet_d", 0], "image": ["depth_img", 0],
                             "strength": strength, "start_percent": 0.0, "end_percent": end,
                             "vae": ["ckpt", 2]}}
    return ["cna_d", 0], ["cna_d", 1]

def add_pose_cn(g, pose_img, prev_pos, prev_neg, strength, end):
    g["pose_img"] = {"class_type": "LoadImage", "inputs": {"image": pose_img}}
    g["cnet_p"] = {"class_type": "ControlNetLoader",
                   "inputs": {"control_net_name": "controlnet-openpose-sdxl.safetensors"}}
    g["cna_p"] = {"class_type": "ControlNetApplyAdvanced",
                  "inputs": {"positive": prev_pos, "negative": prev_neg,
                             "control_net": ["cnet_p", 0], "image": ["pose_img", 0],
                             "strength": strength, "start_percent": 0.0, "end_percent": end,
                             "vae": ["ckpt", 2]}}
    return ["cna_p", 0], ["cna_p", 1]

def finish(g, pos_out, neg_out, denoise, prefix):
    g["ks"] = {"class_type": "KSampler",
               "inputs": {"model": ["ckpt", 0], "positive": pos_out, "negative": neg_out,
                          "latent_image": ["venc", 0], "seed": SEED, "steps": 28, "cfg": 7.5,
                          "sampler_name": "dpmpp_2m", "scheduler": "karras", "denoise": denoise}}
    g["vd"] = {"class_type": "VAEDecode", "inputs": {"samples": ["ks", 0], "vae": ["ckpt", 2]}}
    g["sv"] = {"class_type": "SaveImage", "inputs": {"images": ["vd", 0], "filename_prefix": prefix}}
    return g

# stage inputs
toon = stage(os.path.join(PROOF, "toon_plate.png"),  "fig_init2.png")
ink  = stage(os.path.join(PROOF, "ink_plate.png"),   "fig_ctrl2.png")
dep  = stage(os.path.join(PROOF, "depth_plate.png"), "fig_depth2.png")
pose = stage(os.path.join(PROOF, "openpose.png"),    "fig_pose2.png")

def build_D1():
    g = base_nodes(toon, ink)
    p, n = add_canny_cn(g, ["pos", 0], ["neg", 0], 0.35, 0.5)
    p, n = add_depth_cn(g, dep, p, n, 0.55, 0.55)
    return finish(g, p, n, 0.93, "fig_D1")

def build_D2():
    g = base_nodes(toon, ink)
    p, n = add_canny_cn(g, ["pos", 0], ["neg", 0], 0.30, 0.45)
    p, n = add_depth_cn(g, dep, p, n, 0.60, 0.60)
    p, n = add_pose_cn(g, pose, p, n, 0.70, 0.70)
    return finish(g, p, n, 0.93, "fig_D2")

def build_D3():
    g = base_nodes(ink, ink)  # INK plate as init (whiter, line-forward)
    p, n = add_canny_cn(g, ["pos", 0], ["neg", 0], 0.35, 0.5)
    p, n = add_depth_cn(g, dep, p, n, 0.55, 0.55)
    return finish(g, p, n, 0.93, "fig_D3")

JOBS = [
    ("D1_canny035_depth055_toon",  build_D1()),
    ("D2_canny030_depth060_pose070", build_D2()),
    ("D3_canny035_depth055_inkinit", build_D3()),
]

results = []
for label, g in JOBS:
    print(f"\n[{label}] queuing ...", flush=True)
    try:
        out, dt = queue_and_wait(g)
        dst = os.path.join(PROOF, f"redraw_{label}.png")
        shutil.copyfile(out, dst)
        results.append((label, "OK", dt))
        print(f"[{label}] done in {dt:.0f}s", flush=True)
    except Exception as e:
        results.append((label, f"FAIL {e}", 0))
        print(f"[{label}] FAILED: {e}", flush=True)

print("\n=== SUMMARY ===")
for label, status, dt in results:
    print(f"  {label}: {status} ({dt:.0f}s)")
print("STEP 4 DONE")
