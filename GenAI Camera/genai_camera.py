#!/usr/bin/env python3
"""
GenAI Camera — driver v2.  Headless local ComfyUI (reuses the BLUELINE lib/comfy.py pattern).

Modes
  live  (default)  render -> writes latest.png only. Nothing accumulates. The live rigging
                   workflow. Watch live.html (127.0.0.1:8830/live.html).
  proof            render -> renders/render_NNN.png (+ input streams) AND appends renders.json,
                   so the SCROLL updates. This is for Claude's development proofs, not for
                   Loudon's frame archive.

Conditioning streams (per layer): beauty (img2img init) + depth + optional openpose pose plate.
  --fast     512-ish plates, depth-only, 6 steps  (~quick iteration)
  (quality)  depth + canny + pose, 8 steps        (default)

Multi-camera: --multi reads layers.json = [{name, prompt, pose?}] (ordered BACK->front). Each
  layer has beauty_<name>.png / depth_<name>.png (figure layer rendered on transparent bg so its
  alpha is the composite mask). Layers generate independently and composite together.

Invoke with the ComfyUI venv python (has PIL/numpy):
  _tools/ComfyUI/venv/bin/python3 genai_camera.py --mode live --prompt "..." [--fast] [--pose] [--multi]
"""
import os, sys, io, json, time, uuid, argparse, datetime, shutil, urllib.request, urllib.parse
from PIL import Image, ImageDraw, ImageFilter

HOST = os.environ.get("COMFY_HOST", "127.0.0.1:8188")
DIR  = os.path.dirname(os.path.abspath(__file__))
RDIR = os.path.join(DIR, "renders")
SDIR = os.path.join(DIR, "saved")
MANI = os.path.join(DIR, "renders.json")
os.makedirs(RDIR, exist_ok=True); os.makedirs(SDIR, exist_ok=True)

CKPT = "sd_xl_base_1.0.safetensors"
LORA = "sdxl_lightning_8step_lora.safetensors"
CN = {"depth": "controlnet-depth-sdxl.safetensors",
      "canny": "controlnet-canny-sdxl.safetensors",
      "pose":  "controlnet-openpose-sdxl.safetensors"}
CLIENT = uuid.uuid4().hex

PENFLOW = ("hand-drawn with a black chisel-tip marker on rough white cold-press watercolor paper, "
           "visible paper tooth, broken dry ink edges, monochrome black and white, confident "
           "calligraphic linework, sparse grey dry-brush half-tones, manga and sumi-e ink influence")
NEG = ("color, photograph, photorealistic, 3d render, smooth digital shading, gradient, blurry, "
       "low quality, watermark, text, signature, frame, border")

# ---------------------------------------------------------------- comfy client
def req(path, data=None, headers=None):
    r = urllib.request.Request(f"http://{HOST}{path}", data=data,
                               method="POST" if data else "GET", headers=headers or {})
    with urllib.request.urlopen(r, timeout=600) as resp:
        return resp.read()

def upload(path):
    fn = f"{uuid.uuid4().hex[:8]}_{os.path.basename(path)}"
    b = "----gc" + uuid.uuid4().hex
    body  = f"--{b}\r\nContent-Disposition: form-data; name=\"image\"; filename=\"{fn}\"\r\nContent-Type: image/png\r\n\r\n".encode()
    body += open(path, "rb").read() + b"\r\n"
    body += f"--{b}\r\nContent-Disposition: form-data; name=\"overwrite\"\r\n\r\ntrue\r\n--{b}--\r\n".encode()
    req("/upload/image", body, {"Content-Type": f"multipart/form-data; boundary={b}"})
    return fn

# ---------------------------------------------------------------- openpose draw
# COCO-18 limb sequence + canonical OpenPose colors (0-based joint indices)
_LIMBS = [(1,2),(1,5),(2,3),(3,4),(5,6),(6,7),(1,8),(8,9),(9,10),(1,11),(11,12),(12,13),
          (1,0),(0,14),(14,16),(0,15),(15,17)]
_COLORS = [(255,0,0),(255,85,0),(255,170,0),(255,255,0),(170,255,0),(85,255,0),(0,255,0),
           (0,255,85),(0,255,170),(0,255,255),(0,170,255),(0,85,255),(0,0,255),(85,0,255),
           (170,0,255),(255,0,255),(255,0,170),(255,0,85)]

def draw_openpose(keypoints_json, out_png):
    d = json.load(open(keypoints_json))
    W, H = d["res"]; kp = d["keypoints"]
    img = Image.new("RGB", (W, H), (0, 0, 0)); dr = ImageDraw.Draw(img)
    for i, (a, b) in enumerate(_LIMBS):
        if kp[a][2] and kp[b][2]:
            dr.line([tuple(kp[a][:2]), tuple(kp[b][:2])], fill=_COLORS[i % 18], width=4)
    for i, (x, y, v) in enumerate(kp):
        if v:
            dr.ellipse([x-4, y-4, x+4, y+4], fill=_COLORS[i])
    img.save(out_png)
    return out_png

# ---------------------------------------------------------------- graph
def build_graph(init_fn, prompt, denoise, seed, steps, cns):
    """cns: list of {type, image_fn, strength, end}. Chains ControlNetApplyAdvanced."""
    g = {
      "ckpt": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": CKPT}},
      "lora": {"class_type": "LoraLoader", "inputs": {"model": ["ckpt", 0], "clip": ["ckpt", 1],
               "lora_name": LORA, "strength_model": 1.0, "strength_clip": 1.0}},
      "pos": {"class_type": "CLIPTextEncode", "inputs": {"text": f"{prompt}, {PENFLOW}", "clip": ["lora", 1]}},
      "neg": {"class_type": "CLIPTextEncode", "inputs": {"text": NEG, "clip": ["lora", 1]}},
      "init": {"class_type": "LoadImage", "inputs": {"image": init_fn}},
      "enc": {"class_type": "VAEEncode", "inputs": {"pixels": ["init", 0], "vae": ["ckpt", 2]}},
    }
    pos_ref, neg_ref = ["pos", 0], ["neg", 0]
    for i, cn in enumerate(cns):
        ld, ap = f"cn{i}", f"ap{i}"
        g[ld] = {"class_type": "ControlNetLoader", "inputs": {"control_net_name": CN[cn["type"]]}}
        if cn["type"] == "canny":
            g[f"cy{i}"] = {"class_type": "Canny", "inputs": {"image": ["init", 0],
                           "low_threshold": 0.18, "high_threshold": 0.42}}
            img_ref = [f"cy{i}", 0]
        else:
            g[f"im{i}"] = {"class_type": "LoadImage", "inputs": {"image": cn["image_fn"]}}
            img_ref = [f"im{i}", 0]
        g[ap] = {"class_type": "ControlNetApplyAdvanced",
                 "inputs": {"positive": pos_ref, "negative": neg_ref, "control_net": [ld, 0],
                            "image": img_ref, "strength": cn["strength"], "start_percent": 0.0,
                            "end_percent": cn["end"], "vae": ["ckpt", 2]}}
        pos_ref, neg_ref = [ap, 0], [ap, 1]
    g["samp"] = {"class_type": "KSampler", "inputs": {"model": ["lora", 0], "positive": pos_ref,
                 "negative": neg_ref, "latent_image": ["enc", 0], "seed": seed, "steps": steps,
                 "cfg": 1.8, "sampler_name": "euler", "scheduler": "sgm_uniform", "denoise": denoise}}
    g["dec"] = {"class_type": "VAEDecode", "inputs": {"samples": ["samp", 0], "vae": ["ckpt", 2]}}
    g["save"] = {"class_type": "SaveImage", "inputs": {"filename_prefix": "genai_cam", "images": ["dec", 0]}}
    return g

def run_graph(g):
    pid = json.loads(req("/prompt", json.dumps({"prompt": g, "client_id": CLIENT}).encode(),
                         {"Content-Type": "application/json"}))["prompt_id"]
    t0 = time.time()
    while True:
        h = json.loads(req(f"/history/{pid}"))
        if pid in h:
            st = h[pid].get("status", {})
            if st.get("status_str") != "success":
                raise RuntimeError(json.dumps(st)[:400])
            for o in h[pid].get("outputs", {}).values():
                for img in o.get("images", []):
                    q = urllib.parse.urlencode({"filename": img["filename"],
                        "subfolder": img.get("subfolder", ""), "type": img.get("type", "output")})
                    return req("/view?" + q), time.time() - t0
        if time.time() - t0 > 600:
            raise TimeoutError("comfy timeout")
        time.sleep(0.4)

# ---------------------------------------------------------------- generation
def cns_from(types, depth_fn, pose_fn):
    strengths = {"depth": (0.55, 0.85), "canny": (0.40, 0.80), "pose": (0.55, 0.80)}
    out = []
    for t in types:
        s, e = strengths[t]
        if t == "canny":
            out.append({"type": "canny", "image_fn": None, "strength": s, "end": e})
        elif t == "depth":
            out.append({"type": "depth", "image_fn": upload(depth_fn), "strength": s, "end": e})
        elif t == "pose" and pose_fn and os.path.exists(pose_fn):
            out.append({"type": "pose", "image_fn": upload(pose_fn), "strength": s, "end": e})
    return out

def default_cns(pose_fn, fast):
    if fast: return ["depth"]
    return (["depth", "canny", "pose"] if (pose_fn and os.path.exists(pose_fn)) else ["depth", "canny"])

def generate(beauty_fn, depth_fn, pose_fn, prompt, denoise, seed, fast, cn_types=None):
    steps = 6 if fast else 8
    init = upload(beauty_fn)
    types = cn_types if cn_types is not None else default_cns(pose_fn, fast)
    g = build_graph(init, prompt, denoise, seed, steps, cns_from(types, depth_fn, pose_fn))
    png_bytes, dt = run_graph(g)
    tmp = os.path.join(DIR, f"_tmp_{uuid.uuid4().hex[:6]}.png")
    open(tmp, "wb").write(png_bytes)
    im = Image.open(tmp).convert("RGB"); os.remove(tmp)
    return im, dt

def draw_pose_if_any():
    kj = os.path.join(DIR, "keypoints.json")
    if os.path.exists(kj):
        return draw_openpose(kj, os.path.join(DIR, "openpose.png"))
    return None

# ---------------------------------------------------------------- inpaint (multi-cam default)
def _save_tmp(im, name):
    p = os.path.join(DIR, name); im.save(p); return p

def _to_pil(b):
    return Image.open(io.BytesIO(b)).convert("RGB")

def inpaint_graph(base_fn, mask_fn, pose_fn, prompt, seed, steps):
    """Paint a pose-conditioned figure INTO a base image within the masked region (blends, no hard edge)."""
    g = {
      "ckpt": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": CKPT}},
      "lora": {"class_type": "LoraLoader", "inputs": {"model": ["ckpt", 0], "clip": ["ckpt", 1],
               "lora_name": LORA, "strength_model": 1.0, "strength_clip": 1.0}},
      "pos":  {"class_type": "CLIPTextEncode", "inputs": {"text": f"{prompt}, {PENFLOW}", "clip": ["lora", 1]}},
      "neg":  {"class_type": "CLIPTextEncode", "inputs": {"text": NEG, "clip": ["lora", 1]}},
      "init": {"class_type": "LoadImage", "inputs": {"image": base_fn}},
      "mask": {"class_type": "LoadImageMask", "inputs": {"image": mask_fn, "channel": "red"}},
      "enc":  {"class_type": "VAEEncodeForInpaint", "inputs": {"pixels": ["init", 0], "vae": ["ckpt", 2],
               "mask": ["mask", 0], "grow_mask_by": 16}},
      "cnl":  {"class_type": "ControlNetLoader", "inputs": {"control_net_name": CN["pose"]}},
      "pim":  {"class_type": "LoadImage", "inputs": {"image": pose_fn}},
      "ap":   {"class_type": "ControlNetApplyAdvanced", "inputs": {"positive": ["pos", 0], "negative": ["neg", 0],
               "control_net": ["cnl", 0], "image": ["pim", 0], "strength": 0.65, "start_percent": 0.0,
               "end_percent": 0.8, "vae": ["ckpt", 2]}},
      "samp": {"class_type": "KSampler", "inputs": {"model": ["lora", 0], "positive": ["ap", 0],
               "negative": ["ap", 1], "latent_image": ["enc", 0], "seed": seed, "steps": steps,
               "cfg": 1.8, "sampler_name": "euler", "scheduler": "sgm_uniform", "denoise": 1.0}},
      "dec":  {"class_type": "VAEDecode", "inputs": {"samples": ["samp", 0], "vae": ["ckpt", 2]}},
      "save": {"class_type": "SaveImage", "inputs": {"filename_prefix": "genai_inp", "images": ["dec", 0]}},
    }
    return g

def inpaint_into(base_im, region_im, pose_fn, prompt, seed, fast):
    steps = 6 if fast else 8
    bfn = upload(_save_tmp(base_im, "_mb_base.png"))
    mfn = upload(_save_tmp(region_im.convert("RGB"), "_mb_mask.png"))
    pfn = upload(pose_fn)
    b, dt = run_graph(inpaint_graph(bfn, mfn, pfn, prompt, seed, steps))
    return _to_pil(b), dt

def region_from_beauty(beauty_path, dilate):
    im = Image.open(beauty_path)
    a = im.split()[-1] if im.mode == "RGBA" else Image.new("L", im.size, 255)
    return a.filter(ImageFilter.MaxFilter(int(dilate) | 1)).convert("RGB")

def layer_pose(nm):
    """Ensure openpose_<nm>.png exists (draw from keypoints_<nm>.json if needed); return path or None."""
    op = os.path.join(DIR, f"openpose_{nm}.png"); kp = os.path.join(DIR, f"keypoints_{nm}.json")
    if not os.path.exists(op) and os.path.exists(kp):
        draw_openpose(kp, op)
    return op if os.path.exists(op) else None

# ---------------------------------------------------------------- modes
def next_n():
    if os.path.exists(MANI):
        try: return (json.load(open(MANI)) or [{}])[-1].get("n", 0) + 1
        except Exception: pass
    return 1

def append_manifest(rec):
    data = json.load(open(MANI)) if os.path.exists(MANI) else []
    data.append(rec); tmp = MANI + ".tmp"
    json.dump(data, open(tmp, "w"), indent=1); os.replace(tmp, MANI)

def emit(im, mode, meta, streams=None):
    """live -> latest.png only.  proof -> renders/ + manifest append (the scroll).
    streams: list of (label, abs_src_path) — every conditioning image sent to ComfyUI, so the
    scroll's left column shows the WHOLE input stack (beauty · depth · the multicolored pose plate …)."""
    im.save(os.path.join(DIR, "latest.png"))
    if mode == "proof":
        n = next_n(); base = os.path.join(RDIR, f"render_{n:03d}")
        im.save(base + ".png")
        if streams is None:
            streams = [("beauty", os.path.join(DIR, "beauty.png")), ("depth", os.path.join(DIR, "depth.png"))]
        recs = []
        for label, src in streams:
            if os.path.exists(src):
                dst = f"render_{n:03d}_{label.replace(':','-').replace(' ','_')}.png"
                shutil.copyfile(src, os.path.join(RDIR, dst))
                recs.append({"label": label, "f": dst})
        rec = {"n": n, "ts": datetime.datetime.now().strftime("%Y-%m-%d %H:%M"), "streams": recs, **meta}
        append_manifest(rec)
        return n
    return None

# ---------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--mode", default="live", choices=["live", "proof"])
    ap.add_argument("--prompt", default="a lone warrior standing ready, dramatic action manga")
    ap.add_argument("--denoise", type=float, default=0.90)
    ap.add_argument("--seed", type=int, default=7)
    ap.add_argument("--fast", action="store_true")
    ap.add_argument("--pose", action="store_true")
    ap.add_argument("--multi", action="store_true")
    ap.add_argument("--note", default="")
    a = ap.parse_args()

    if a.multi:
        # Default multi-cam: the FIRST layer is the base (generated); each later layer is INPAINTED
        # into it (pose-conditioned), so figures are placed/scaled by their region and blend with no
        # hard edge (shootout winner). A layer with "composite": true falls back to legacy alpha-over.
        layers = json.load(open(os.path.join(DIR, "layers.json")))   # back -> front
        base = None; dt_total = 0.0
        for ly in layers:
            nm = ly["name"]
            beauty = os.path.join(DIR, f"beauty_{nm}.png")
            depth  = os.path.join(DIR, f"depth_{nm}.png")
            pose   = layer_pose(nm) if ly.get("pose") else None
            if base is None:                                     # base layer (env) — generate
                im, dt = generate(beauty, depth, pose, ly["prompt"], ly.get("denoise", a.denoise),
                                  a.seed, a.fast, ly.get("cn"))
                base = im.convert("RGB")
            elif ly.get("composite"):                            # legacy alpha-over
                im, dt = generate(beauty, depth, pose, ly["prompt"], ly.get("denoise", a.denoise),
                                  a.seed, a.fast, ly.get("cn"))
                mask = region_from_beauty(beauty, ly.get("dilate", 25)).convert("L")
                base = Image.composite(im.convert("RGB"), base, mask)
            else:                                                # DEFAULT — inpaint the figure into base
                region = region_from_beauty(beauty, ly.get("dilate", 81))
                base, dt = inpaint_into(base, region, pose, ly["prompt"], a.seed, a.fast)
                base = base.convert("RGB")
            dt_total += dt
        meta = {"prompt": " + ".join(l["prompt"][:24] for l in layers), "denoise": a.denoise,
                "seed": a.seed, "dt": round(dt_total, 1),
                "note": a.note or f"multi-cam inpaint ({len(layers)} layers)"}
        streams = []
        for i, ly in enumerate(layers):
            nm = ly["name"]
            if i == 0:
                streams += [(f"{nm} beauty", os.path.join(DIR, f"beauty_{nm}.png")),
                            (f"{nm} depth", os.path.join(DIR, f"depth_{nm}.png"))]
            if ly.get("pose"):
                streams.append((f"{nm} pose", os.path.join(DIR, f"openpose_{nm}.png")))
        n = emit(base, a.mode, meta, streams)
        print(f"OK multi {dt_total:.1f}s{'' if n is None else f' -> render_{n:03d}'}")
        return

    pose_fn = draw_pose_if_any() if a.pose else None
    im, dt = generate(os.path.join(DIR, "beauty.png"), os.path.join(DIR, "depth.png"),
                      pose_fn, a.prompt, a.denoise, a.seed, a.fast)
    meta = {"prompt": a.prompt, "denoise": a.denoise, "seed": a.seed, "dt": round(dt, 1),
            "note": a.note or ("fast preview" if a.fast else ("depth+canny+pose" if a.pose else "depth+canny"))}
    streams = [("beauty", os.path.join(DIR, "beauty.png")), ("depth", os.path.join(DIR, "depth.png"))]
    if pose_fn: streams.append(("pose", pose_fn))
    n = emit(im, a.mode, meta, streams)
    print(f"OK {dt:.1f}s{'' if n is None else f' -> render_{n:03d}'}  | {a.prompt[:46]}")

if __name__ == "__main__":
    main()
