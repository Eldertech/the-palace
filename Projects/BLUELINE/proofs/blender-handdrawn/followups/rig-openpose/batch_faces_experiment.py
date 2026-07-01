"""
Figure Rig — FACE GUIDE EXPERIMENT. Compare 5 ways to feed the Blender render to the gen-AI,
with per-render timing (for the cost/time/quality report Loudon asked for):

  ink_canny         line art  -> Canny controlnet + depth + openpose, full gen (baseline; hollow eyes)
  shaded_canny      shaded    -> Canny + depth + openpose, full gen  (edges on real form)
  color_canny       color     -> Canny + depth + openpose, full gen
  color_img2img     color     -> img2img init (denoise 0.72) + depth + openpose
  shaded_img2img_hi shaded    -> img2img init (denoise 0.82) + depth + openpose (push style)

Pod booted with POD_CANNY=1.
  python3 batch_faces_experiment.py --pod <id> --plates yw_surprised,yw_smile --styles storyboard,comic
"""
import argparse, json, os, sys, time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.normpath(os.path.join(HERE, "..", "..", "..", "new-story")))
sys.path.insert(0, HERE)
import faces_manifest as FM
from pod_backend import Backend
import render_shot as RS

PL = os.path.join(HERE, "renders", "faces-rig")
OUT = os.path.join(HERE, "renders", "faces-exp")
W, H = 832, 1040
CN = {"canny": "controlnet-canny-sdxl.safetensors", "depth": "controlnet-depth-sdxl.safetensors",
      "pose": "controlnet-openpose-sdxl.safetensors"}

APPROACHES = [
    ("ink_canny",         "canny",   "ink_plate.png",    1.0),
    ("shaded_canny",      "canny",   "shaded_plate.png", 1.0),
    ("color_canny",       "canny",   "color_plate.png",  1.0),
    ("color_img2img",     "img2img", "color_plate.png",  0.72),
    ("shaded_img2img_hi", "img2img", "shaded_plate.png", 0.82),
]


def style_text(s):
    return RS.STYLE_TXT if s["style"] == "__LOCKED__" else s["style"]


def _base(prompt, dep, pose):
    return {
        "ckpt": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": "sd_xl_base_1.0.safetensors"}},
        "pos": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt, "clip": ["ckpt", 1]}},
        "neg": {"class_type": "CLIPTextEncode", "inputs": {"text": RS.NEG, "clip": ["ckpt", 1]}},
        "depimg": {"class_type": "LoadImage", "inputs": {"image": dep}},
        "posimg": {"class_type": "LoadImage", "inputs": {"image": pose}},
        "cn_d": {"class_type": "ControlNetLoader", "inputs": {"control_net_name": CN["depth"]}},
        "cn_p": {"class_type": "ControlNetLoader", "inputs": {"control_net_name": CN["pose"]}},
        "vd": {"class_type": "VAEDecode", "inputs": {"samples": ["ks", 0], "vae": ["ckpt", 2]}},
        "sv": {"class_type": "SaveImage", "inputs": {"filename_prefix": "g", "images": ["vd", 0]}},
    }


def _add_depth_pose(g, src_pos, src_neg):
    g["a2"] = {"class_type": "ControlNetApplyAdvanced", "inputs": {"positive": src_pos, "negative": src_neg,
               "control_net": ["cn_d", 0], "image": ["depimg", 0], "strength": 0.45, "start_percent": 0.0, "end_percent": 0.7, "vae": ["ckpt", 2]}}
    g["a3"] = {"class_type": "ControlNetApplyAdvanced", "inputs": {"positive": ["a2", 0], "negative": ["a2", 1],
               "control_net": ["cn_p", 0], "image": ["posimg", 0], "strength": 0.4, "start_percent": 0.0, "end_percent": 0.7, "vae": ["ckpt", 2]}}


def build(mode, src_name, denoise, prompt, seed, dep, pose):
    g = _base(prompt, dep, pose)
    if mode == "canny":
        g["cimg"] = {"class_type": "LoadImage", "inputs": {"image": src_name}}
        g["canny"] = {"class_type": "Canny", "inputs": {"image": ["cimg", 0], "low_threshold": 0.12, "high_threshold": 0.35}}
        g["cn_c"] = {"class_type": "ControlNetLoader", "inputs": {"control_net_name": CN["canny"]}}
        g["latent"] = {"class_type": "EmptyLatentImage", "inputs": {"width": W, "height": H, "batch_size": 1}}
        g["a1"] = {"class_type": "ControlNetApplyAdvanced", "inputs": {"positive": ["pos", 0], "negative": ["neg", 0],
                   "control_net": ["cn_c", 0], "image": ["canny", 0], "strength": 0.6, "start_percent": 0.0, "end_percent": 0.85, "vae": ["ckpt", 2]}}
        _add_depth_pose(g, ["a1", 0], ["a1", 1]); latent = ["latent", 0]
    else:  # img2img
        g["iimg"] = {"class_type": "LoadImage", "inputs": {"image": src_name}}
        g["enc"] = {"class_type": "VAEEncode", "inputs": {"pixels": ["iimg", 0], "vae": ["ckpt", 2]}}
        _add_depth_pose(g, ["pos", 0], ["neg", 0]); latent = ["enc", 0]
    g["ks"] = {"class_type": "KSampler", "inputs": {"model": ["ckpt", 0], "positive": ["a3", 0], "negative": ["a3", 1],
               "latent_image": latent, "seed": seed, "steps": 28, "cfg": 6.5, "sampler_name": "dpmpp_2m", "scheduler": "karras", "denoise": denoise}}
    return g


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pod", required=True)
    ap.add_argument("--plates", required=True)
    ap.add_argument("--styles", default="storyboard,comic")
    a = ap.parse_args()
    bk = Backend(a.pod)
    plates = a.plates.split(",")
    styles = [s for s in FM.STYLES if s["key"] in set(a.styles.split(","))]
    timings = {ap_[0]: [] for ap_ in APPROACHES}
    print(f"[exp] {len(plates)} plates × {len(APPROACHES)} approaches × {len(styles)} styles", flush=True)

    for label in plates:
        pd = os.path.join(PL, label)
        up = {fn: bk.upload(os.path.join(pd, fn)) for fn in
              ("ink_plate.png", "shaded_plate.png", "color_plate.png", "depth_plate.png", "openpose.png")}
        pj = next((j for j in FM.plate_jobs() if j[0] == label), None)
        _, pk, ex, shot = pj
        outdir = os.path.join(OUT, label); os.makedirs(outdir, exist_ok=True)
        for s in styles:
            prompt = FM.prompt_for(FM.PEOPLE[pk]["subject"], ex, shot, style_text(s))
            seed = 5400 + abs(hash(label + s["key"])) % 1000
            for name, mode, srcfn, denoise in APPROACHES:
                g = build(mode, up[srcfn], denoise, prompt, seed, up["depth_plate.png"], up["openpose.png"])
                dest = os.path.join(outdir, f"{name}_{s['key']}.png")
                try:
                    dt = bk.run(g, dest); timings[name].append(dt)
                    print(f"  [{label}/{name}/{s['key']}] {dt:.1f}s", flush=True)
                except Exception as e:
                    print(f"  [{label}/{name}/{s['key']}] FAILED {repr(e)[:130]}", flush=True)
    summary = {k: (round(sum(v)/len(v), 1) if v else None) for k, v in timings.items()}
    json.dump({"avg_seconds_per_render": summary, "n_per_approach": {k: len(v) for k, v in timings.items()}},
              open(os.path.join(OUT, "timings.json"), "w"), indent=1)
    print("TIMINGS", json.dumps(summary), flush=True)
    print("EXP_BATCH_DONE", flush=True)


if __name__ == "__main__":
    main()
