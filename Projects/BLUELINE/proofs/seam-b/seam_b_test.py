#!/usr/bin/env python3
"""
BLUELINE · SEAM B smallest test — does AUTHORED BLOCKING survive into the render, in locked pen-flow?

Seam B (layout -> render) is the project's named frontier ([[Blocked, Not Prompted]]). Track IV already
emitted authored conditioning passes (Blender greybox blocking -> geometric OpenPose + Blender depth, exact
by construction). This drives them through SDXL in the locked `pen-flow` style and asks the one question:
does the rendered figure adopt the AUTHORED pose + camera, in-style — i.e. does blocking beat the prompt?

Per render-backend/graph_spec.md (the LOCKED Study recipe): POSE controlnet (openpose-sdxl) + DEPTH
controlnet (depth-sdxl), each <=~0.6 so they don't fight; passes fed DIRECTLY (already clean skeletons/
depth -> no preprocessor, which also dodges the openpose-on-ink detection problem). Local SDXL on :8189 ->
FREE, no pod. Character/identity (InstantID) is a SEPARATE pod step layered on after; pose-survival is the
Seam B unknown and needs no identity.

Run: <comfy venv>/python seam_b_test.py            (local ComfyUI :8189, sd_xl_base + the two SDXL CNs)
Outputs -> proofs/seam-b/out/<shot>.png (+ _overlay) + seam-b-atlas.png (input-pose | greybox | render | overlay).
"""
import os, json, time, subprocess, urllib.request, urllib.parse, uuid
from PIL import Image, ImageChops, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "out"); os.makedirs(OUT, exist_ok=True)
PASSES = os.path.normpath(os.path.join(HERE, "..", "track-IV-bench", "passes"))
STYLE = json.load(open(os.path.normpath(os.path.join(HERE, "..", "style-lock", "locked-style.json"))))
STYLE_TXT = STYLE["style"]
NEG = "extra limbs, deformed, two heads, " + STYLE["neg_extra"]
CKPT = "sd_xl_base_1.0.safetensors"
CN_POSE = "controlnet-openpose-sdxl.safetensors"
CN_DEPTH = "controlnet-depth-sdxl.safetensors"
HOST = "127.0.0.1:8189"; CLIENT = uuid.uuid4().hex
KIT = "a lone figure in a dark fedora and a long open duster coat"

# Track IV authored shots (pose x camera-grammar). The prompt names the action but the POSE comes from the
# openpose pass — the test is whether the render obeys the pass, not the words.
SHOTS = [
    ("IV-A", "lunging forward in a deep dramatic sword-draw stride, seen from a low worm's-eye angle"),
    ("IV-B", "standing defiant, one fist raised, near eye-level heroic framing"),
    ("IV-C", "swinging a powerful overhead strike, seen from behind over the shoulder"),
]
POSE_STR, DEPTH_STR, STEPS, CFG = 0.6, 0.5, 30, 6.5

def req(method, path, data=None):
    h = {"Content-Type": "application/json"} if data else {}
    r = urllib.request.Request(f"http://{HOST}{path}", data=data, method=method, headers=h)
    with urllib.request.urlopen(r, timeout=900) as resp: return resp.read()

def upload(path):
    name = os.path.basename(path)
    out = subprocess.run(["curl", "-sS", "-F", f"image=@{path};type=image/png;filename={name}",
                          "-F", "overwrite=true", f"http://{HOST}/upload/image"],
                         capture_output=True, text=True, timeout=40)
    try: return json.loads(out.stdout).get("name", name)
    except Exception: raise RuntimeError(f"upload failed {name}: {out.stdout[:150]} {out.stderr[:150]}")

def graph(prompt, pose_name, depth_name, W, H, seed, prefix):
    return {
      "ckpt": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": CKPT}},
      "pos": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt, "clip": ["ckpt", 1]}},
      "neg": {"class_type": "CLIPTextEncode", "inputs": {"text": NEG, "clip": ["ckpt", 1]}},
      "pose_img": {"class_type": "LoadImage", "inputs": {"image": pose_name}},
      "depth_img": {"class_type": "LoadImage", "inputs": {"image": depth_name}},
      "cn_pose": {"class_type": "ControlNetLoader", "inputs": {"control_net_name": CN_POSE}},
      "cn_depth": {"class_type": "ControlNetLoader", "inputs": {"control_net_name": CN_DEPTH}},
      "ap1": {"class_type": "ControlNetApplyAdvanced", "inputs": {"positive": ["pos", 0], "negative": ["neg", 0],
              "control_net": ["cn_pose", 0], "image": ["pose_img", 0], "strength": POSE_STR, "start_percent": 0.0, "end_percent": 0.7}},
      "ap2": {"class_type": "ControlNetApplyAdvanced", "inputs": {"positive": ["ap1", 0], "negative": ["ap1", 1],
              "control_net": ["cn_depth", 0], "image": ["depth_img", 0], "strength": DEPTH_STR, "start_percent": 0.0, "end_percent": 0.7}},
      "latent": {"class_type": "EmptyLatentImage", "inputs": {"width": W, "height": H, "batch_size": 1}},
      "samp": {"class_type": "KSampler", "inputs": {"model": ["ckpt", 0], "positive": ["ap2", 0], "negative": ["ap2", 1],
              "latent_image": ["latent", 0], "seed": seed, "steps": STEPS, "cfg": CFG, "sampler_name": "dpmpp_2m", "scheduler": "karras", "denoise": 1.0}},
      "dec": {"class_type": "VAEDecode", "inputs": {"samples": ["samp", 0], "vae": ["ckpt", 2]}},
      "save": {"class_type": "SaveImage", "inputs": {"filename_prefix": prefix, "images": ["dec", 0]}},
    }

def run(wf, dest):
    pid = json.loads(req("POST", "/prompt", json.dumps({"prompt": wf, "client_id": CLIENT}).encode()))["prompt_id"]
    t0 = time.time()
    while True:
        h = json.loads(req("GET", f"/history/{pid}"))
        if pid in h: hist = h[pid]; break
        if time.time() - t0 > 900: raise TimeoutError(pid)
        time.sleep(2)
    if hist.get("status", {}).get("status_str") != "success":
        raise RuntimeError(json.dumps(hist.get("status", {}))[:400])
    for _, o in hist.get("outputs", {}).items():
        for img in o.get("images", []):
            q = urllib.parse.urlencode({"filename": img["filename"], "subfolder": img.get("subfolder", ""), "type": img.get("type", "output")})
            open(dest, "wb").write(req("GET", "/view?" + q)); return time.time() - t0
    raise RuntimeError("no image")

def main():
    rows = []
    for i, (tag, action) in enumerate(SHOTS):
        pose_p = os.path.join(PASSES, f"{tag}_openpose.png")
        depth_p = os.path.join(PASSES, f"{tag}_depth.png")
        rgb_p = os.path.join(PASSES, f"{tag}_rgb.png")
        if not (os.path.exists(pose_p) and os.path.exists(depth_p)):
            print(f"  [skip] {tag} missing passes"); continue
        W, H = Image.open(pose_p).size
        pu, du = upload(pose_p), upload(depth_p)
        prompt = f"{KIT}, {action}, dynamic dramatic motion, {STYLE_TXT}"
        dest = os.path.join(OUT, f"{tag}.png")
        dt = run(graph(prompt, pu, du, W, H, 7000 + i, f"seamb_{tag}"), dest)
        # adherence overlay: screen the input skeleton onto the render -> joints should land on the figure
        res = Image.open(dest).convert("RGB"); pose = Image.open(pose_p).convert("RGB").resize(res.size)
        ov = ImageChops.screen(res, pose); ov_p = os.path.join(OUT, f"{tag}_overlay.png"); ov.save(ov_p)
        rows.append((tag, pose_p, rgb_p, dest, ov_p))
        print(f"  [{i+1}/{len(SHOTS)}] {tag} ({dt:.0f}s) {W}x{H} -> {os.path.basename(dest)}", flush=True)

    # atlas: per shot — input pose | greybox rgb | rendered | rendered+pose overlay
    if rows:
        fw, fh = Image.open(rows[0][3]).size
        cols = 4; tw = 200; th = int(tw * fh / fw); pad = 30
        sheet = Image.new("RGB", (cols * tw, len(rows) * (th + pad) + pad), (12, 13, 16)); dr = ImageDraw.Draw(sheet)
        labs = ["input openpose", "greybox (authored)", "pen-flow render", "render + pose overlay"]
        for r, (tag, pose_p, rgb_p, dest, ov_p) in enumerate(rows):
            for c, p in enumerate([pose_p, rgb_p, dest, ov_p]):
                x, y = c * tw, r * (th + pad) + pad
                if p and os.path.exists(p): sheet.paste(Image.open(p).convert("RGB").resize((tw, th)), (x, y))
                dr.text((x + 4, y - 26), f"{tag}", fill=(232, 184, 74))
                dr.text((x + 4, y - 13), labs[c], fill=(120, 200, 255))
        sheet.save(os.path.join(HERE, "seam-b-atlas.png"))
        print("  atlas -> seam-b-atlas.png")
    print(f"SEAM_B_DONE rendered {len(rows)}/{len(SHOTS)}")

if __name__ == "__main__":
    main()
