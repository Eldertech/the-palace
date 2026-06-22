#!/usr/bin/env python3
"""
BLUELINE · NEW STORY (working title: the powered-noir tragedy) — shot renderer.

Loudon's fresh 6-shot opening sequence (2026-06-22). A powered figure in a burning city; a superhuman
leap-and-land that cracks the ground; ending on a tragic kiss. Noir + pen-flow + music-video action.

This renders a shot in the locked pen-flow style on local SDXL (:8189). Environment shots need no pose;
character shots condition on an authored OpenPose (+depth) pass via the Seam-B-proven path
(openpose-sdxl 0.6 / depth-sdxl 0.5, fed direct). Shots 2-6 are stubbed with their prompts but flagged
`pose: needs` until their blocking is authored (Track IV).

  <comfy venv>/python render_shot.py --shot 01
  <comfy venv>/python render_shot.py --shot 02 --pose ../track-IV-bench/passes/IV-B_openpose.png
Outputs -> proofs/new-story/out/<shot>.png
"""
import os, json, time, argparse, subprocess, urllib.request, urllib.parse, uuid

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "out"); os.makedirs(OUT, exist_ok=True)
STYLE = json.load(open(os.path.normpath(os.path.join(HERE, "..", "style-lock", "locked-style.json"))))
STYLE_TXT = STYLE["style"]
NEG = "extra limbs, deformed, two heads, color, " + STYLE["neg_extra"]
CKPT = "sd_xl_base_1.0.safetensors"
CN_POSE = "controlnet-openpose-sdxl.safetensors"
CN_DEPTH = "controlnet-depth-sdxl.safetensors"
HOST = "127.0.0.1:8189"; CLIENT = uuid.uuid4().hex

# the 6-shot opening sequence. `pose: needs` = blocking not yet authored (Track IV) -> still prompt-only for now.
SHOTS = {
  "01": {"name": "wide-burning-city", "size": (1216, 832), "pose": None,
         "prompt": "a vast sprawling noir city at night seen from a high wide angle, many separate fires burning across distant rooftops, thick billowing smoke rising, a brooding skyline, desolate, cinematic high-contrast"},
  "02": {"name": "hero-on-sedan-pointing", "size": (832, 1216), "pose": "needs",
         "prompt": "a lone powerful figure standing on the crushed dented roof of a burning sedan, one arm thrust out pointing a finger at a sparse frightened crowd, commanding, smoke and embers"},
  "03": {"name": "leap-legs-denting-roof", "size": (832, 1216), "pose": "needs",
         "prompt": "tight close-up on a figure's braced legs and boots exploding upward into a jump, the steel car roof buckling and denting downward under the impossible force, debris flying"},
  "04": {"name": "plummeting-from-below", "size": (832, 1216), "pose": "needs",
         "prompt": "extreme low angle from the ground looking straight up, a figure plummeting downward fast toward the viewer, long coat flaring violently, against a smoke-and-fire sky"},
  "05": {"name": "impact-landing-shockwave", "size": (1216, 832), "pose": "needs",
         "prompt": "a figure landing hard in a low crouch on cracked asphalt, the pavement shattering in a radial ring around him, smoke and dust blasting outward from the impact, a woman's limp body on the ground nearby, a crowd recoiling in the back"},
  "06": {"name": "the-kiss-blood-sweat", "size": (832, 1216), "pose": "needs",
         "prompt": "intimate extreme close-up, a grieving figure cradling a woman's head in both hands, kissing her lips, drops of blood and sweat falling from his face onto hers, anguish"},
}

def req(method, path, data=None):
    h = {"Content-Type": "application/json"} if data else {}
    r = urllib.request.Request(f"http://{HOST}{path}", data=data, method=method, headers=h)
    with urllib.request.urlopen(r, timeout=900) as resp: return resp.read()

def upload(path):
    name = os.path.basename(path)
    out = subprocess.run(["curl", "-sS", "-F", f"image=@{path};type=image/png;filename={name}",
                          "-F", "overwrite=true", f"http://{HOST}/upload/image"], capture_output=True, text=True, timeout=40)
    return json.loads(out.stdout).get("name", name)

def graph(prompt, W, H, seed, prefix, pose_name=None, depth_name=None):
    g = {
      "ckpt": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": CKPT}},
      "pos": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt, "clip": ["ckpt", 1]}},
      "neg": {"class_type": "CLIPTextEncode", "inputs": {"text": NEG, "clip": ["ckpt", 1]}},
      "latent": {"class_type": "EmptyLatentImage", "inputs": {"width": W, "height": H, "batch_size": 1}},
      "dec": {"class_type": "VAEDecode", "inputs": {"samples": ["samp", 0], "vae": ["ckpt", 2]}},
      "save": {"class_type": "SaveImage", "inputs": {"filename_prefix": prefix, "images": ["dec", 0]}},
    }
    pos_link, neg_link = ["pos", 0], ["neg", 0]
    if pose_name:
        g["pose_img"] = {"class_type": "LoadImage", "inputs": {"image": pose_name}}
        g["cn_pose"] = {"class_type": "ControlNetLoader", "inputs": {"control_net_name": CN_POSE}}
        g["ap_pose"] = {"class_type": "ControlNetApplyAdvanced", "inputs": {"positive": pos_link, "negative": neg_link,
                        "control_net": ["cn_pose", 0], "image": ["pose_img", 0], "strength": 0.6, "start_percent": 0.0, "end_percent": 0.7}}
        pos_link, neg_link = ["ap_pose", 0], ["ap_pose", 1]
    if depth_name:
        g["depth_img"] = {"class_type": "LoadImage", "inputs": {"image": depth_name}}
        g["cn_depth"] = {"class_type": "ControlNetLoader", "inputs": {"control_net_name": CN_DEPTH}}
        g["ap_depth"] = {"class_type": "ControlNetApplyAdvanced", "inputs": {"positive": pos_link, "negative": neg_link,
                         "control_net": ["cn_depth", 0], "image": ["depth_img", 0], "strength": 0.5, "start_percent": 0.0, "end_percent": 0.7}}
        pos_link, neg_link = ["ap_depth", 0], ["ap_depth", 1]
    g["samp"] = {"class_type": "KSampler", "inputs": {"model": ["ckpt", 0], "positive": pos_link, "negative": neg_link,
                 "latent_image": ["latent", 0], "seed": seed, "steps": 30, "cfg": 6.5, "sampler_name": "dpmpp_2m", "scheduler": "karras", "denoise": 1.0}}
    return g

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
    ap = argparse.ArgumentParser()
    ap.add_argument("--shot", default="01")
    ap.add_argument("--pose", default=None, help="openpose pass (overrides for character shots)")
    ap.add_argument("--depth", default=None)
    ap.add_argument("--seed", type=int, default=4242)
    a = ap.parse_args()
    s = SHOTS[a.shot]
    W, H = s["size"]
    pose_name = upload(a.pose) if a.pose else None
    depth_name = upload(a.depth) if a.depth else None
    if s["pose"] == "needs" and not a.pose:
        print(f"  NOTE shot {a.shot} wants authored blocking (pose) — rendering prompt-only for now (will drift; author the pose next)")
    dest = os.path.join(OUT, f"{a.shot}_{s['name']}.png")
    prompt = f"{s['prompt']}, {STYLE_TXT}"
    dt = run(graph(prompt, W, H, a.seed, f"shot_{a.shot}", pose_name, depth_name), dest)
    print(f"SHOT_{a.shot}_DONE ({dt:.0f}s) {W}x{H} -> {os.path.basename(dest)}")

if __name__ == "__main__":
    main()
