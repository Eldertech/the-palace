"""
Figure Rig — HANDS GUIDE ABLATION (RunPod). Shows WHY all three Blender guides matter.

Same hand pose, same locked ink style, same seed — the ONLY thing that changes is which
guides are fed. A leave-one-out ladder, bracketed by none / all:

  none      prompt only .............. (no controlnet)
  no_pose   depth + shaded ........... (OpenPose removed)      -> gesture/laterality drifts
  no_depth  openpose + shaded ........ (depth removed)         -> fingers/object merge in Z
  no_canny  openpose + depth ......... (shaded render removed) -> hand loses form/detail
  all       openpose + depth + shaded  (the reference)         -> correct hand

Three stress poses, each biased toward a different guide:
  point_closeup  bare pointing hand    -> OpenPose critical (finger extension + laterality)
  glass_closeup  grip on rigid glass   -> depth critical (glass vs fingers in Z)
  snake_closeup  grip on coiling snake -> shaded/canny critical (organic form)

Boot the pod with POD_CANNY=1, no --keep-alive:
  POD_CANNY=1 python3 pose_pod_orchestrator.py --render-script <abs path to this file>
Invoked by the orchestrator as:  this_file.py --pod <id>
"""
import argparse, json, os, ssl, sys, time, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.normpath(os.path.join(HERE, "..", "..", "..", "new-story")))
sys.path.insert(0, HERE)
import hands_manifest as HM
from pod_backend import Backend
import render_shot as RS   # STYLE_TXT (locked pen-flow) + NEG

_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
try:
    import certifi; _CTX = ssl.create_default_context(cafile=certifi.where())
except Exception:
    _CTX = ssl._create_unverified_context()

PLATES = os.path.join(HERE, "renders", "hands")
OUT = os.path.join(HERE, "renders", "hands-ablation")
W, H = 832, 1040
CN_CANNY = "controlnet-canny-sdxl.safetensors"
CN_DEPTH = "controlnet-depth-sdxl.safetensors"
CN_POSE = "controlnet-openpose-sdxl.safetensors"

# proven strengths from batch_hands_pod.py (shaded->canny 0.55 / depth 0.50 / openpose 0.55)
CANNY = dict(strength=0.55, start_percent=0.0, end_percent=0.8)
DEPTH = dict(strength=0.50, start_percent=0.0, end_percent=0.75)
POSE = dict(strength=0.55, start_percent=0.0, end_percent=0.8)

# ordered: floor -> leave-one-out -> ceiling. Each names which guides are ON.
CONDITIONS = [
    ("none",     set()),                     # prompt only
    ("no_pose",  {"canny", "depth"}),        # OpenPose removed
    ("no_depth", {"canny", "pose"}),         # depth removed
    ("no_canny", {"depth", "pose"}),         # shaded->canny removed
    ("all",      {"canny", "depth", "pose"}),
]

# stress poses (closeups), each biased toward a different guide
POSES = ["point_closeup", "glass_closeup", "snake_closeup"]


def graph(prompt, seed, prefix, on, shaded_name, depth_name, pose_name):
    """Build the workflow with only the controlnets named in `on` applied, chained in a fixed order."""
    g = {
        "ckpt": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": "sd_xl_base_1.0.safetensors"}},
        "pos": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt, "clip": ["ckpt", 1]}},
        "neg": {"class_type": "CLIPTextEncode", "inputs": {"text": RS.NEG, "clip": ["ckpt", 1]}},
        "latent": {"class_type": "EmptyLatentImage", "inputs": {"width": W, "height": H, "batch_size": 1}},
    }
    pos_link, neg_link = ["pos", 0], ["neg", 0]

    def apply(tag, cn_name, image_link, params):
        nonlocal pos_link, neg_link
        g[f"cn_{tag}"] = {"class_type": "ControlNetLoader", "inputs": {"control_net_name": cn_name}}
        g[f"ap_{tag}"] = {"class_type": "ControlNetApplyAdvanced", "inputs": {
            "positive": pos_link, "negative": neg_link, "control_net": [f"cn_{tag}", 0],
            "image": image_link, "vae": ["ckpt", 2], **params}}
        pos_link, neg_link = [f"ap_{tag}", 0], [f"ap_{tag}", 1]

    if "canny" in on:
        g["shimg"] = {"class_type": "LoadImage", "inputs": {"image": shaded_name}}
        g["canny"] = {"class_type": "Canny", "inputs": {"image": ["shimg", 0], "low_threshold": 0.12, "high_threshold": 0.35}}
        apply("c", CN_CANNY, ["canny", 0], CANNY)
    if "depth" in on:
        g["depimg"] = {"class_type": "LoadImage", "inputs": {"image": depth_name}}
        apply("d", CN_DEPTH, ["depimg", 0], DEPTH)
    if "pose" in on:
        g["posimg"] = {"class_type": "LoadImage", "inputs": {"image": pose_name}}
        apply("p", CN_POSE, ["posimg", 0], POSE)

    g["ks"] = {"class_type": "KSampler", "inputs": {"model": ["ckpt", 0], "positive": pos_link, "negative": neg_link,
               "latent_image": ["latent", 0], "seed": seed, "steps": 28, "cfg": 6.5,
               "sampler_name": "dpmpp_2m", "scheduler": "karras", "denoise": 1.0}}
    g["vd"] = {"class_type": "VAEDecode", "inputs": {"samples": ["ks", 0], "vae": ["ckpt", 2]}}
    g["sv"] = {"class_type": "SaveImage", "inputs": {"filename_prefix": prefix, "images": ["vd", 0]}}
    return g


def subj_of(job_key):
    best = None
    for s in HM.SUBJECTS:
        if job_key.startswith(s["key"] + "_") and (best is None or len(s["key"]) > len(best["key"])):
            best = s
    return best


def wait_all_cn(pid, timeout=900):
    """Gate on all three controlnets present. The orchestrator only waits on openpose, but the
    download order is SDXL -> openpose -> canny -> depth, so canny/depth can still be mid-download
    at ready — and the first canny/depth job then fails validation (the race that dropped one cell)."""
    need = [CN_POSE, CN_CANNY, CN_DEPTH]
    url = f"https://{pid}-8188.proxy.runpod.net/object_info/ControlNetLoader"
    t0 = time.time()
    while time.time() - t0 < timeout:
        try:
            req = urllib.request.Request(url, headers={"User-Agent": _UA})
            info = json.loads(urllib.request.urlopen(req, timeout=10, context=_CTX).read())
            v = info.get("ControlNetLoader", {}).get("input", {}).get("required", {}).get("control_net_name", [[]])
            have = set(v[0] if v and isinstance(v[0], list) else [])
        except Exception as e:
            print(f"[cn-gate] retry: {repr(e)[:100]}", flush=True); time.sleep(8); continue
        missing = [c for c in need if c not in have]
        print(f"[cn-gate] {int(time.time()-t0)}s missing={missing}", flush=True)
        if not missing:
            return True
        time.sleep(10)
    return False


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pod", required=True)
    ap.add_argument("--only", default=None, help="comma poses, e.g. point_closeup")
    a = ap.parse_args()
    poses = a.only.split(",") if a.only else POSES

    if not wait_all_cn(a.pod):
        sys.exit("[cn-gate] canny/depth never arrived — aborting before wasting the pod")

    bk = Backend(a.pod)
    print(f"[ablation] {len(poses)} poses × {len(CONDITIONS)} guide-sets = {len(poses)*len(CONDITIONS)} renders "
          f"(locked ink style)", flush=True)

    for pose_key in poses:
        subj = subj_of(pose_key); shot = "closeup"
        pd = os.path.join(PLATES, pose_key)
        sh = bk.upload(os.path.join(pd, "shaded_plate.png"))
        dep = bk.upload(os.path.join(pd, "depth_plate.png"))
        op = bk.upload(os.path.join(pd, "openpose.png"))
        outdir = os.path.join(OUT, pose_key); os.makedirs(outdir, exist_ok=True)
        prompt = HM.prompt_for(subj, shot, RS.STYLE_TXT)
        seed = 7777 + abs(hash(pose_key)) % 1000  # fixed per pose -> only guides vary
        for cond, on in CONDITIONS:
            g = graph(prompt, seed, f"{pose_key}_{cond}", on, sh, dep, op)
            dest = os.path.join(outdir, f"gen_{cond}.png")
            try:
                dt = bk.run(g, dest)
                print(f"  [{pose_key}/{cond}] guides={sorted(on) or 'none'} {dt:.0f}s", flush=True)
            except Exception as e:
                print(f"  [{pose_key}/{cond}] FAILED {repr(e)[:150]}", flush=True)
        json.dump({"pose": pose_key, "seed": seed, "style": "locked-pen-flow", "prompt": prompt,
                   "conditions": [c for c, _ in CONDITIONS]},
                  open(os.path.join(outdir, "meta.json"), "w"), indent=1)
    print("ABLATION_BATCH_DONE", flush=True)


if __name__ == "__main__":
    main()
