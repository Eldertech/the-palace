#!/usr/bin/env python3
"""
BLUELINE Track I — the board-driven POD runner (the baton's merge).

Combines runner.py's board / title-contract front-end with pod-comfyui-client.py's
HARDENED TRANSPORT (browser-UA header + curl multipart upload that beats the RunPod
proxy WAF) and the FLUX-ControlNet-Union (openpose) workflow. Drives the Study tier:
a board's POSITIVE + POSE → a posed render on a self-owned pod.

Stdlib + curl. Reads the pod id from --pod or /tmp/pod_id.

  # board-driven:
  python3 pod_runner.py --pod <id> --template board_template.txt --shot 04A --out out.png
  # direct (Track V's seed-controlled coherence test):
  python3 pod_runner.py --pod <id> --pose IV-A_openpose.png --prompt "..." --seed 777 --out a.png
"""
import argparse, json, re, ssl, subprocess, sys, time, urllib.request, urllib.parse, uuid
from pathlib import Path

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
try:
    import certifi; CTX = ssl.create_default_context(cafile=certifi.where())
except Exception:
    CTX = ssl._create_unverified_context()

class Pod:
    def __init__(self, pid):
        self.B = f"https://{pid}-8188.proxy.runpod.net"; self.cid = uuid.uuid4().hex
    def _req(self, method, path, data=None, headers=None):
        h = {"User-Agent": UA}; h.update(headers or {})
        r = urllib.request.Request(self.B+path, data=data, method=method, headers=h)
        with urllib.request.urlopen(r, timeout=120, context=CTX) as resp:
            return resp.read()
    def upload(self, path):
        name = Path(path).name
        out = subprocess.run(["curl","-s","--max-time","40","-X","POST",
            "-F", f"image=@{path};type=image/png;filename={name}", "-F","overwrite=true",
            f"{self.B}/upload/image"], capture_output=True, text=True, timeout=50)
        if '"name"' not in out.stdout:
            raise RuntimeError("upload failed: "+out.stdout[:200]+out.stderr[:200])
        return json.loads(out.stdout).get("name", name)
    def submit(self, wf):
        data = json.dumps({"prompt": wf, "client_id": self.cid}).encode()
        return json.loads(self._req("POST","/prompt", data=data, headers={"Content-Type":"application/json"}))["prompt_id"]
    def wait(self, pid, timeout=300):
        t0 = time.time()
        while time.time()-t0 < timeout:
            h = json.loads(self._req("GET", f"/history/{pid}"))
            if pid in h: return h[pid]
            time.sleep(2)
        raise TimeoutError(pid)
    def fetch(self, hist, dest):
        for out in hist.get("outputs", {}).values():
            for img in out.get("images", []):
                q = urllib.parse.urlencode({"filename":img["filename"],"subfolder":img.get("subfolder",""),"type":img.get("type","output")})
                Path(dest).write_bytes(self._req("GET","/view?"+q)); return dest
        return None

def flux_cn_workflow(prompt, pose_name, seed, w=832, h=1216, steps=24, guidance=3.5, strength=0.75, end=0.85):
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
        "strength":strength,"start_percent":0.0,"end_percent":end,"vae":["ckpt",2]}},
     "latent":{"class_type":"EmptySD3LatentImage","inputs":{"width":w,"height":h,"batch_size":1}},
     "samp":{"class_type":"KSampler","inputs":{"seed":seed,"steps":steps,"cfg":1,"sampler_name":"euler","scheduler":"simple","denoise":1,
        "model":["ckpt",0],"positive":["apply",0],"negative":["apply",1],"latent_image":["latent",0]}},
     "dec":{"class_type":"VAEDecode","inputs":{"samples":["samp",0],"vae":["ckpt",2]}},
     "save":{"class_type":"SaveImage","inputs":{"filename_prefix":"podframe","images":["dec",0]}},
    }

def parse_board(template, shot):
    raw = Path(template).read_text().splitlines(); segs, cur, kind = [], [], None
    for line in raw:
        m = re.match(r"^#\s*===\s*(BIBLE|BOARD)\s*===", line)
        if m:
            if kind: segs.append(cur)
            kind, cur = m.group(1), []
        elif kind: cur.append(line)
    if kind: segs.append(cur)
    def fields(lines):
        f, k = {}, None
        for line in lines:
            if not line.strip(): k = None; continue
            mm = re.match(r"^([A-Z_]+)\s*:\s?(.*)$", line)
            if mm: k, f[mm.group(1)] = mm.group(1), mm.group(2).strip()
            elif k and line[:1] in " \t": f[k] = (f[k]+" "+line.strip()).strip()
        return f
    for seg in segs:
        f = fields([l for l in seg if not l.lstrip().startswith("#")])
        if f.get("SHOT_ID") == shot: return f
    return None

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pod", default=None)
    ap.add_argument("--template"); ap.add_argument("--shot")
    ap.add_argument("--pose"); ap.add_argument("--prompt"); ap.add_argument("--seed", type=int, default=555)
    ap.add_argument("--assets", default="."); ap.add_argument("--out", required=True)
    a = ap.parse_args()
    pid = a.pod or Path("/tmp/pod_id").read_text().strip()
    pod = Pod(pid)
    if a.shot:
        b = parse_board(a.template, a.shot)
        if not b: sys.exit(f"shot {a.shot} not found")
        prompt = b.get("POSITIVE",""); seed = int(b.get("SEED") or a.seed)
        pose_rel = b.get("POSE","").split("->")[-1].strip()
        pose_path = pose_rel if Path(pose_rel).is_absolute() else str(Path(a.assets)/pose_rel)
    else:
        prompt, seed, pose_path = a.prompt, a.seed, a.pose
    print(f"pod {pid} | seed {seed} | pose {Path(pose_path).name}")
    name = pod.upload(pose_path)
    jid = pod.submit(flux_cn_workflow(prompt, name, seed))
    print(f"submitted {jid} — waiting…")
    hist = pod.wait(jid)
    saved = pod.fetch(hist, a.out)
    print(f"SAVED {saved} | status {hist.get('status',{}).get('status_str')}")

if __name__ == "__main__":
    main()
