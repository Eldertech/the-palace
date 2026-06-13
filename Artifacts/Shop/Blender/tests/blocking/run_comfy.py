#!/usr/bin/env python3
"""
Session 1 ComfyUI driver — SDXL per-channel multi-ControlNet, two-pass, + control test.

Runs against the ComfyUI server on :8189 (started with a separate DB so it loads the
new comfyui_controlnet_aux node + the xinsir SDXL ControlNets).

Jobs:
  BLOCKED  two-pass: [openpose+depth+canny] -> SDXL fill (832x1216) -> 1.5x img2img refine
  CONTROL  prompt-only, same prompt+seed, NO ControlNet  (the front-on-default probe)
  DWPOSE   estimator (DWPreprocessor) run on the clay RGB — to compare vs the geometric skeleton

One preprocessor + one ControlNet per channel (the toyxyz hard rule). Channels: pose/depth/canny.
SDXL has no strong standalone lineart ControlNet at this date -> canny carries the edge channel.
"""
import json, os, time, urllib.request, urllib.parse, urllib.error

HOST = "http://127.0.0.1:8189"
HERE = os.path.dirname(os.path.abspath(__file__))
RENDERS = os.path.abspath(os.path.join(HERE, "..", "renders"))
WORKFLOWS = os.path.abspath(os.path.join(HERE, "..", "workflows"))
os.makedirs(RENDERS, exist_ok=True); os.makedirs(WORKFLOWS, exist_ok=True)

CKPT = "sd_xl_base_1.0.safetensors"
POS = ("a lone warrior drawing a sword, dynamic lunging action pose, dramatic low angle, "
       "cinematic rim light, weathered leather armor and torn cloak, gritty fantasy concept art, "
       "volumetric haze, intricate detail, artstation")
NEG = ("blurry, lowres, deformed, bad anatomy, extra limbs, watermark, text, signature, "
       "flat even lighting, static stiff pose, centered front-facing portrait")
SEED = 7
W, H = 768, 1024
RW, RH = 1152, 1536  # 1.5x


def post(graph):
    data = json.dumps({"prompt": graph, "client_id": "s1"}).encode()
    req = urllib.request.Request(HOST + "/prompt", data=data,
                                 headers={"Content-Type": "application/json"})
    return json.loads(urllib.request.urlopen(req, timeout=30).read())


def wait(pid, timeout=1800):
    t0 = time.time()
    while time.time() - t0 < timeout:
        try:
            h = json.loads(urllib.request.urlopen(HOST + f"/history/{pid}", timeout=20).read())
        except Exception:
            time.sleep(2); continue
        if pid in h:
            st = h[pid].get("status", {})
            if st.get("completed") or h[pid].get("outputs"):
                return h[pid]
            if st.get("status_str") == "error":
                raise RuntimeError("exec error: " + json.dumps(st.get("messages", []))[:800])
        time.sleep(3)
    raise TimeoutError(f"{pid} timed out after {timeout}s")


def fetch_images(node_out, prefix):
    saved = []
    for nid, out in node_out.get("outputs", {}).items():
        for im in out.get("images", []):
            q = urllib.parse.urlencode({"filename": im["filename"],
                                        "subfolder": im.get("subfolder", ""),
                                        "type": im.get("type", "output")})
            blob = urllib.request.urlopen(HOST + "/view?" + q, timeout=60).read()
            path = os.path.join(RENDERS, f"{prefix}.png")
            if saved:
                path = os.path.join(RENDERS, f"{prefix}_{len(saved)}.png")
            open(path, "wb").write(blob)
            saved.append(path)
    return saved


def run(graph, label, prefix, timeout=1800):
    json.dump(graph, open(os.path.join(WORKFLOWS, f"{label}.json"), "w"), indent=2)
    t0 = time.time()
    pid = post(graph)["prompt_id"]
    print(f"[{label}] queued {pid}", flush=True)
    res = wait(pid, timeout)
    paths = fetch_images(res, prefix)
    print(f"[{label}] done in {time.time()-t0:.0f}s -> {[os.path.basename(p) for p in paths]}", flush=True)
    return paths


def cn(idx, pos, neg, loader, image, strength, start=0.0, end=1.0):
    return {idx: {"class_type": "ControlNetApplyAdvanced", "inputs": {
        "positive": pos, "negative": neg, "control_net": [loader, 0],
        "image": [image, 0], "strength": strength, "start_percent": start, "end_percent": end}}}


def base_nodes():
    g = {
        "4": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": CKPT}},
        "6": {"class_type": "CLIPTextEncode", "inputs": {"text": POS, "clip": ["4", 1]}},
        "7": {"class_type": "CLIPTextEncode", "inputs": {"text": NEG, "clip": ["4", 1]}},
    }
    return g


def blocked_graph():
    g = base_nodes()
    g.update({
        "10": {"class_type": "LoadImage", "inputs": {"image": "openpose.png"}},
        "11": {"class_type": "LoadImage", "inputs": {"image": "depth.png"}},
        "12": {"class_type": "LoadImage", "inputs": {"image": "canny.png"}},
        "20": {"class_type": "ControlNetLoader", "inputs": {"control_net_name": "controlnet-openpose-sdxl.safetensors"}},
        "21": {"class_type": "ControlNetLoader", "inputs": {"control_net_name": "controlnet-depth-sdxl.safetensors"}},
        "22": {"class_type": "ControlNetLoader", "inputs": {"control_net_name": "controlnet-canny-sdxl.safetensors"}},
        "40": {"class_type": "EmptyLatentImage", "inputs": {"width": W, "height": H, "batch_size": 1}},
    })
    # fill-pass CN chain (pose 0.9, depth 0.7, canny 0.45 early-only)
    g.update(cn("30", ["6", 0], ["7", 0], "20", "10", 0.90, 0.0, 1.0))
    g.update(cn("31", ["30", 0], ["30", 1], "21", "11", 0.70, 0.0, 1.0))
    g.update(cn("32", ["31", 0], ["31", 1], "22", "12", 0.45, 0.0, 0.5))
    g["50"] = {"class_type": "KSampler", "inputs": {
        "model": ["4", 0], "seed": SEED, "steps": 28, "cfg": 7.0,
        "sampler_name": "dpmpp_2m", "scheduler": "karras",
        "positive": ["32", 0], "negative": ["32", 1], "latent_image": ["40", 0], "denoise": 1.0}}
    g["60"] = {"class_type": "VAEDecode", "inputs": {"samples": ["50", 0], "vae": ["4", 2]}}
    g["70"] = {"class_type": "SaveImage", "inputs": {"images": ["60", 0], "filename_prefix": "s1_blocked_fill"}}
    # refine pass: 1.5x img2img, CN re-applied at lower strength
    g["80"] = {"class_type": "ImageScale", "inputs": {"image": ["60", 0], "upscale_method": "lanczos",
                                                      "width": RW, "height": RH, "crop": "disabled"}}
    g["81"] = {"class_type": "VAEEncode", "inputs": {"pixels": ["80", 0], "vae": ["4", 2]}}
    # refine = plain img2img hires pass; composition is already locked by the fill's ControlNets,
    # so re-applying them at 1.5x only adds cost + OOM risk. Low denoise preserves the blocking.
    g["51"] = {"class_type": "KSampler", "inputs": {
        "model": ["4", 0], "seed": SEED, "steps": 15, "cfg": 6.5,
        "sampler_name": "dpmpp_2m", "scheduler": "karras",
        "positive": ["6", 0], "negative": ["7", 0], "latent_image": ["81", 0], "denoise": 0.42}}
    g["61"] = {"class_type": "VAEDecode", "inputs": {"samples": ["51", 0], "vae": ["4", 2]}}
    g["71"] = {"class_type": "SaveImage", "inputs": {"images": ["61", 0], "filename_prefix": "s1_blocked_refined"}}
    return g


def control_graph(seed):
    g = base_nodes()
    g["40"] = {"class_type": "EmptyLatentImage", "inputs": {"width": W, "height": H, "batch_size": 1}}
    g["50"] = {"class_type": "KSampler", "inputs": {
        "model": ["4", 0], "seed": seed, "steps": 28, "cfg": 7.0,
        "sampler_name": "dpmpp_2m", "scheduler": "karras",
        "positive": ["6", 0], "negative": ["7", 0], "latent_image": ["40", 0], "denoise": 1.0}}
    g["60"] = {"class_type": "VAEDecode", "inputs": {"samples": ["50", 0], "vae": ["4", 2]}}
    g["70"] = {"class_type": "SaveImage", "inputs": {"images": ["60", 0], "filename_prefix": "s1_control"}}
    return g


def dwpose_graph():
    g = {"10": {"class_type": "LoadImage", "inputs": {"image": "rgb.png"}},
         "20": {"class_type": "DWPreprocessor", "inputs": {
             "image": ["10", 0], "detect_hand": "enable", "detect_body": "enable",
             "detect_face": "enable", "resolution": 832,
             "bbox_detector": "yolox_l.onnx", "pose_estimator": "dw-ll_ucoco_384.onnx",
             "scale_stick_for_xinsr_cn": "disable"}},
         "30": {"class_type": "SaveImage", "inputs": {"images": ["20", 0], "filename_prefix": "s1_dwpose_est"}}}
    return g


if __name__ == "__main__":
    # 1) the keystone: blocked two-pass multi-ControlNet
    blocked = blocked_graph()
    paths = run(blocked, "blocked-two-pass", "blocked_sdxl_fill")
    # fill + refine both saved; rename the second (refined) explicitly
    res_files = sorted(os.listdir(RENDERS))
    print("renders so far:", res_files, flush=True)
    # 2) control: prompt-only, two seeds
    run(control_graph(SEED), "control-prompt-only-s7", "prompt_only_sdxl_seed7", timeout=900)
    run(control_graph(42), "control-prompt-only-s42", "prompt_only_sdxl_seed42", timeout=900)
    # 3) DWPose estimator on the clay render (best-effort; downloads onnx on first use)
    try:
        run(dwpose_graph(), "dwpose-estimator", "dwpose_estimated", timeout=900)
    except Exception as e:
        print("DWPOSE_FAILED:", repr(e)[:300], flush=True)
    print("ALL_DONE", flush=True)
