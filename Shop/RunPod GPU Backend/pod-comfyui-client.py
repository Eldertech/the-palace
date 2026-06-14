#!/usr/bin/env python3
"""Drive ComfyUI on the RunPod pod (native API) for FLUX + OpenPose ControlNet."""
import json, sys, time, subprocess, urllib.request, urllib.parse, uuid
from pathlib import Path

PID = Path("/tmp/pod_id").read_text().strip()
B = f"https://{PID}-8188.proxy.runpod.net"
CLIENT = uuid.uuid4().hex

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
def _req(method, path, data=None, headers=None):
    h = {"User-Agent": UA}; h.update(headers or {})
    r = urllib.request.Request(B+path, data=data, method=method, headers=h)
    with urllib.request.urlopen(r, timeout=120) as resp:
        return resp.read()

def upload_image(path, name=None):
    name = name or Path(path).name
    # curl handles multipart reliably through the RunPod proxy
    out = subprocess.run(["curl","-s","--max-time","30","-X","POST",
        "-F", f"image=@{path};type=image/png;filename={name}", "-F","overwrite=true",
        f"{B}/upload/image"], capture_output=True, text=True, timeout=40)
    if '"name"' not in out.stdout:
        raise RuntimeError("upload failed: "+out.stdout[:200]+out.stderr[:200])
    return json.loads(out.stdout).get("name", name)

def submit(workflow):
    data = json.dumps({"prompt":workflow,"client_id":CLIENT}).encode()
    r = json.loads(_req("POST","/prompt", data=data, headers={"Content-Type":"application/json"}))
    return r["prompt_id"]

def wait(prompt_id, timeout=300):
    t0=time.time()
    while time.time()-t0 < timeout:
        h = json.loads(_req("GET", f"/history/{prompt_id}"))
        if prompt_id in h:
            return h[prompt_id]
        time.sleep(2)
    raise TimeoutError(prompt_id)

def fetch_first_image(hist, dest):
    for node_id, out in hist.get("outputs",{}).items():
        for img in out.get("images",[]):
            q = urllib.parse.urlencode({"filename":img["filename"],"subfolder":img.get("subfolder",""),"type":img.get("type","output")})
            Path(dest).write_bytes(_req("GET","/view?"+q))
            return dest
    return None

def workflow(prompt, pose_name, seed, w=832, h=1216, steps=24, guidance=3.5, cn_strength=0.75, cn_end=0.85):
    return {
     "ckpt":{"class_type":"CheckpointLoaderSimple","inputs":{"ckpt_name":"flux1-dev-fp8.safetensors"}},
     "pos":{"class_type":"CLIPTextEncode","inputs":{"text":prompt,"clip":["ckpt",1]}},
     "flux":{"class_type":"FluxGuidance","inputs":{"conditioning":["pos",0],"guidance":guidance}},
     "neg":{"class_type":"CLIPTextEncode","inputs":{"text":"","clip":["ckpt",1]}},
     "cnet":{"class_type":"ControlNetLoader","inputs":{"control_net_name":"flux-union-pro.safetensors"}},
     "union":{"class_type":"SetUnionControlNetType","inputs":{"control_net":["cnet",0],"type":"openpose"}},
     "pose":{"class_type":"LoadImage","inputs":{"image":pose_name}},
     "apply":{"class_type":"ControlNetApplyAdvanced","inputs":{
        "positive":["flux",0],"negative":["neg",0],"control_net":["union",0],"image":["pose",0],
        "strength":cn_strength,"start_percent":0.0,"end_percent":cn_end,"vae":["ckpt",2]}},
     "latent":{"class_type":"EmptySD3LatentImage","inputs":{"width":w,"height":h,"batch_size":1}},
     "samp":{"class_type":"KSampler","inputs":{"seed":seed,"steps":steps,"cfg":1,"sampler_name":"euler","scheduler":"simple","denoise":1,
        "model":["ckpt",0],"positive":["apply",0],"negative":["apply",1],"latent_image":["latent",0]}},
     "dec":{"class_type":"VAEDecode","inputs":{"samples":["samp",0],"vae":["ckpt",2]}},
     "save":{"class_type":"SaveImage","inputs":{"filename_prefix":"walkframe","images":["dec",0]}},
    }

if __name__ == "__main__":
    # test: pod_comfy.py test <pose.png> <out.png> "<prompt>" [seed]
    cmd = sys.argv[1]
    if cmd == "test":
        pose, out, prompt = sys.argv[2], sys.argv[3], sys.argv[4]
        seed = int(sys.argv[5]) if len(sys.argv)>5 else 555
        name = upload_image(pose)
        pid = submit(workflow(prompt, name, seed))
        print("submitted", pid, "— waiting…")
        hist = wait(pid)
        st = hist.get("status",{})
        saved = fetch_first_image(hist, out)
        print("saved:", saved, "| status:", st.get("status_str"))
