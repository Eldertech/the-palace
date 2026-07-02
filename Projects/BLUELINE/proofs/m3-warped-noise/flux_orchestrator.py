#!/usr/bin/env python3
"""
BLUELINE · FLUX pose run — VOLUME-FREE pod lifecycle owner. FLUX txt2img needs no ControlNet and no network
volume (the FLUX model is baked into the worker-comfyui image), so this runs in ANY datacenter — dodging the
EU-RO-1 capacity shortage the volume-pinned orchestrator hits. Create-retry + GATE on (ComfyUI up + FLUX
checkpoint present) + ALWAYS terminate in finally.

  python3 flux_orchestrator.py --render-args "--n 100 --vary-cast"
  python3 flux_orchestrator.py --terminate-only <podId>

MULTI-AGENT (2026-07-02): the pod is per-agent-namespaced — "blueline-flux-pose-<slug>" (see
_ops/runpod/agent_ns.py). Guard/create/terminate all scope to that name, so this is safe to
run concurrently with other Claudes on the same RunPod account.
"""
import argparse, json, ssl, subprocess, sys, time
import urllib.request, urllib.error
from pathlib import Path

# ── per-agent namespace (multi-agent safety) ─────────────────────────────────
import os as _bootstrap_os
def _find_runpod_ns():
    d = _bootstrap_os.path.dirname(_bootstrap_os.path.abspath(__file__))
    for _ in range(10):
        cand = _bootstrap_os.path.join(d, "_ops", "runpod")
        if _bootstrap_os.path.isfile(_bootstrap_os.path.join(cand, "agent_ns.py")):
            return cand
        nd = _bootstrap_os.path.dirname(d)
        if nd == d:
            break
        d = nd
    return None
_ns_dir = _find_runpod_ns()
if _ns_dir and _ns_dir not in sys.path:
    sys.path.insert(0, _ns_dir)
from agent_ns import SLUG, pod_name, pod_id_file
from commons.providers.runpod_pod import RunpodPodProvider   # pod lifecycle lives in the Commons provider

PALACE = Path("/Users/loudonstearns/Documents/The Palace")
CONFIG = PALACE / "RunPod Images" / "studio" / "config.json"
HERE = Path(__file__).resolve().parent
IMAGE = "runpod/worker-comfyui:5.8.4-flux1-dev-fp8"
# proven RunPod gpuTypeIds (from M3) + 3090 -> more datacenters with capacity, no risk of a bad-id reject
GPU_IDS = ["NVIDIA GeForce RTX 4090","NVIDIA GeForce RTX 3090","NVIDIA RTX A5000","NVIDIA L40","NVIDIA L40S",
           "NVIDIA RTX A6000","NVIDIA A40"]
CKPT = "flux1-dev-fp8.safetensors"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
try:
    import certifi; CTX = ssl.create_default_context(cafile=certifi.where())
except Exception:
    CTX = ssl._create_unverified_context()

_PROV = RunpodPodProvider(config_path=CONFIG)   # create/list/cull/terminate, all slug-scoped

def proxy_get(pid, path, timeout=15):
    req = urllib.request.Request(f"https://{pid}-8188.proxy.runpod.net{path}", headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout, context=CTX) as r: return r.read()

START = ('set -e\necho "[flux] launch ComfyUI (model in image; no volume, no controlnet)"\n'
         'cd /comfyui && exec python -u main.py --disable-auto-launch --disable-metadata --listen --port 8188\n')

BASE = "blueline-flux-pose"
NAME = pod_name(BASE)          # display only; provider owns naming
POD_ID_FILE = pod_id_file()

def _spec():
    return {"base": BASE, "image": IMAGE, "gpuTypeIds": GPU_IDS, "gpuCount": 1,
            "ports": ["8188/http"], "containerDiskInGb": 30,
            "dockerStartCmd": ["bash", "-c", START]}

def create_pod():
    r = _PROV.create(_spec()); POD_ID_FILE.write_text(r.id); return r.id

def cleanup_named():
    mine = _PROV.list_mine(); print(f"[cleanup] {len(mine)} pod(s): {[r.id for r in mine]}")
    for r in mine: _PROV.terminate(r)
    return len(mine)

def terminate(pid):
    return _PROV.terminate(pid)

def wait_ready(pid, boot_timeout=900):
    t0 = time.time(); up = False
    while time.time() - t0 < boot_timeout:
        el = int(time.time()-t0)
        if not up:
            try: proxy_get(pid, "/system_stats", timeout=10); up = True; print(f"[ready] ComfyUI HTTP up at ~{el}s")
            except Exception:
                g,_ = _PROV.api("GET", f"/pods/{pid}"); ds = g.get("desiredStatus") if isinstance(g,dict) else "?"
                print(f"[ready] waiting… {el}s (status={ds})"); time.sleep(8); continue
        try:
            ck = json.loads(proxy_get(pid, "/object_info/CheckpointLoaderSimple", timeout=10))
            opts = ck.get("CheckpointLoaderSimple",{}).get("input",{}).get("required",{}).get("ckpt_name",[[]])
            lst = opts[0] if opts and isinstance(opts[0],list) else []
            has = CKPT in lst
            print(f"[ready] {CKPT} present={has} (have {len(lst)} ckpts)")
            if has: print(f"[ready] PASS at ~{el}s"); return True
        except Exception as e:
            print(f"[ready] ckpt probe retry ({el}s): {repr(e)[:100]}")
        time.sleep(8)
    return False

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--terminate-only", default=None)
    ap.add_argument("--render-args", default="--n 100 --vary-cast")
    a = ap.parse_args()
    print(f"[ns] agent slug={SLUG}  pod name={NAME}")
    if a.terminate_only: terminate(a.terminate_only); return
    mine = _PROV.list_mine()
    if mine:
        print(f"[guard] my pod '{NAME}' already exists {[r.id for r in mine]} — abort. Run --terminate-only to remove it first."); sys.exit(2)
    pid = create_pod(); rc = 1
    try:
        if not wait_ready(pid): raise RuntimeError("pod did not reach ready")
        print("[render] starting flux_pose_render.py")
        rc = subprocess.run([sys.executable, str(HERE/"flux_pose_render.py"), "--pod", pid] + a.render_args.split(), cwd=str(HERE)).returncode
        print(f"[render] flux_pose_render exited {rc}")
    finally:
        print("[finally] tearing down pod (guaranteed)"); terminate(pid)
    sys.exit(rc)

if __name__ == "__main__":
    main()
