#!/usr/bin/env python3
"""
Palace verbatim prompt sender — passthrough to a RunPod FLUX endpoint.

Your prompts go to the GPU EXACTLY as written in queue.txt. This script never
rewrites, "improves", or trims them. It also never prints the prompt text, so
the wording stays out of any assistant's context.

Edit queue.txt, then run:
    python3 palace_send.py submit     # send every prompt in queue.txt
    python3 palace_send.py poll       # download finished images into out/

queue.txt format — one image per line; blank lines and #comments ignored:
    your prompt text
    your prompt text | 1216x832            # custom size
    your prompt text | 832x1216 | 42       # custom size + seed

Config:
  - In a Cowork session it auto-reads /tmp/.rp_key and /tmp/flux_ep.
  - Standalone (your Mac): set env RUNPOD_API_KEY and RUNPOD_ENDPOINT_ID.
"""
import json, base64, os, sys, time, urllib.request
from pathlib import Path

HERE = Path(__file__).parent
QUEUE = HERE / "queue.txt"
OUT = HERE / "out"
STATE = HERE / ".state.json"

def cfg():
    key = os.environ.get("RUNPOD_API_KEY")
    ep  = os.environ.get("RUNPOD_ENDPOINT_ID")
    if not key and Path("/tmp/.rp_key").exists(): key = Path("/tmp/.rp_key").read_text().strip()
    if not ep  and Path("/tmp/flux_ep").exists(): ep  = Path("/tmp/flux_ep").read_text().strip()
    if not key or not ep:
        sys.exit("Need RUNPOD_API_KEY and RUNPOD_ENDPOINT_ID (env), or the Cowork /tmp files.")
    return key, ep

KEY, EP = cfg()
ROOT = f"https://api.runpod.ai/v2/{EP}"

def req(method, url, body=None):
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(url, data=data, method=method)
    r.add_header("Authorization", f"Bearer {KEY}"); r.add_header("Content-Type","application/json")
    with urllib.request.urlopen(r, timeout=60) as resp:
        return json.loads(resp.read().decode())

def flux_workflow(prompt, w, h, seed):
    return {
     "30":{"class_type":"CheckpointLoaderSimple","inputs":{"ckpt_name":"flux1-dev-fp8.safetensors"}},
     "27":{"class_type":"EmptySD3LatentImage","inputs":{"width":w,"height":h,"batch_size":1}},
     "6":{"class_type":"CLIPTextEncode","inputs":{"text":prompt,"clip":["30",1]}},
     "33":{"class_type":"CLIPTextEncode","inputs":{"text":"","clip":["30",1]}},
     "35":{"class_type":"FluxGuidance","inputs":{"conditioning":["6",0],"guidance":3.5}},
     "31":{"class_type":"KSampler","inputs":{"seed":seed,"steps":28,"cfg":1,"sampler_name":"euler","scheduler":"simple","denoise":1,"model":["30",0],"positive":["35",0],"negative":["33",0],"latent_image":["27",0]}},
     "8":{"class_type":"VAEDecode","inputs":{"samples":["31",0],"vae":["30",2]}},
     "9":{"class_type":"SaveImage","inputs":{"filename_prefix":"palace","images":["8",0]}},
    }

def parse_queue():
    items = []
    for raw in QUEUE.read_text().splitlines():
        line = raw.rstrip("\n")
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        parts = [p.strip() for p in line.split("|")]
        prompt = parts[0]                      # verbatim, untouched
        w, h, seed = 1024, 1024, 0
        if len(parts) > 1 and "x" in parts[1].lower():
            try: w, h = (int(x) for x in parts[1].lower().split("x"))
            except: pass
        if len(parts) > 2:
            try: seed = int(parts[2])
            except: pass
        if seed == 0:
            seed = int.from_bytes(os.urandom(3), "big")
        items.append((prompt, w, h, seed))
    return items

def submit():
    items = parse_queue()
    st = {}
    for idx, (prompt, w, h, seed) in enumerate(items):
        wf = flux_workflow(prompt, w, h, seed)
        resp = req("POST", f"{ROOT}/run", {"input": {"workflow": wf}})
        st[resp["id"]] = {"idx": idx, "dims": f"{w}x{h}", "seed": seed, "status": resp.get("status"), "saved": None}
        print(f"submitted #{idx:02d}  job {resp['id']}  ({w}x{h}, seed {seed})")
    STATE.write_text(json.dumps(st, indent=2))
    print(f"sent {len(items)} prompt(s). Now: python3 palace_send.py poll")

def poll():
    OUT.mkdir(exist_ok=True)
    st = json.loads(STATE.read_text()); done=bad=pend=0
    for jid, info in st.items():
        if info.get("saved"): done+=1; continue
        try: s = req("GET", f"{ROOT}/status/{jid}")
        except Exception as e: print(f" #{info['idx']:02d} error {e}"); pend+=1; continue
        info["status"] = s.get("status")
        if s.get("status") == "COMPLETED":
            for img in (s.get("output") or {}).get("images", []):
                p = OUT / f"img_{info['idx']:02d}.png"; p.write_bytes(base64.b64decode(img["data"])); info["saved"]=str(p)
            done+=1; print(f" #{info['idx']:02d} COMPLETED -> {OUT.name}/img_{info['idx']:02d}.png")
        elif s.get("status") in ("FAILED","CANCELLED","TIMED_OUT"):
            bad+=1; print(f" #{info['idx']:02d} {s.get('status')}: {str(s.get('error'))[:120]}")
        else: pend+=1
    STATE.write_text(json.dumps(st, indent=2))
    print(f"done={done} bad={bad} pending={pend}")

if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "poll"
    (submit if cmd == "submit" else poll)()
