#!/usr/bin/env python3
"""
BLUELINE · INSTANTID pose/gaze run — VOLUME-FREE pod lifecycle owner.

The named next move from the style-lock baton: bake ONE identity into the locked `pen-flow` look at a
*controlled* gaze, by conditioning each render on (a) a reference identity face and (b) a face-keypoint
layout (the gaze). InstantID does both at once on SDXL — which keeps the hand-drawn ink FLUX smooths away.

Modeled on the PROVEN `sdxl_orchestrator.py` (volume-free worker-comfyui image, create-retry, gated
readiness, ALWAYS terminate). The one structural difference: a ComfyUI **custom node** only loads at
ComfyUI *startup* (unlike checkpoints, which hot-rescan), so the InstantID node + insightface must be
installed BEFORE ComfyUI launches. The big model files still download in the background and hot-appear.

  python3 instantid_orchestrator.py --render-args "--ref face-swap/target.png"
  python3 instantid_orchestrator.py --terminate-only <podId>

MULTI-AGENT (2026-07-02): the pod is per-agent-namespaced — "blueline-instantid-<slug>" (see
_ops/runpod/agent_ns.py). Guard/create/terminate all scope to that name, so this is safe to run
concurrently with other Claudes on the same RunPod account.

Sanity checks behind this script (verified 2026-06-22, not assumed):
  • node spec from cubiq/ComfyUI_InstantID source: ApplyInstantID(instantid, insightface, control_net,
    image, model, positive, negative, weight, start_at, end_at; opt image_kps, mask) -> (MODEL, pos, neg);
    InstantIDModelLoader.instantid_file reads models/instantid/; InstantIDFaceAnalysis.provider.
  • all four download URLs return HTTP 200 (ip-adapter.bin, controlnet safetensors+config, antelopev2.zip).
  • insightface runs on CPU here (provider=CPU in the graph) -> only `onnxruntime` needed, no CUDA match.
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
IMAGE = "runpod/worker-comfyui:5.8.4-flux1-dev-fp8"   # proven to boot ComfyUI; we add SDXL + InstantID below
GPU_IDS = ["NVIDIA GeForce RTX 4090","NVIDIA GeForce RTX 3090","NVIDIA RTX A5000","NVIDIA L40","NVIDIA L40S",
           "NVIDIA RTX A6000","NVIDIA A40"]
CKPT = "sd_xl_base_1.0.safetensors"
CKPT_URL = "https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/resolve/main/sd_xl_base_1.0.safetensors"
CN_NAME = "instantid-controlnet.safetensors"   # what we save the InstantID ControlNet as (folder-listed)
CN_URL = "https://huggingface.co/InstantX/InstantID/resolve/main/ControlNetModel/diffusion_pytorch_model.safetensors"
IPA_URL = "https://huggingface.co/InstantX/InstantID/resolve/main/ip-adapter.bin"
ANTELOPE_URL = "https://huggingface.co/MonsterMMORPG/tools/resolve/main/antelopev2.zip"
NODE_REPO = "https://github.com/cubiq/ComfyUI_InstantID"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
try:
    import certifi; CTX = ssl.create_default_context(cafile=certifi.where())
except Exception:
    CTX = ssl._create_unverified_context()

_PROV = RunpodPodProvider(config_path=CONFIG)   # create/list/cull/terminate, all slug-scoped

def proxy_get(pid, path, timeout=15):
    req = urllib.request.Request(f"https://{pid}-8188.proxy.runpod.net{path}", headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout, context=CTX) as r: return r.read()

# BLOCKING before ComfyUI launch (nodes load at startup; antelopev2 must exist before the node runs):
#   1. clone the InstantID custom node + pip install insightface onnxruntime (CPU)
#   2. download + flatten antelopev2 into models/insightface/models/antelopev2/ (size-guarded)
# BACKGROUND (folder-rescanned / picked at render): the three big model files, atomic .part -> final with a
#   >1GB / >100MB size-guard so a gated/404 HTML stub never masquerades as a model.
# Then launch ComfyUI; the orchestrator gates readiness on the node + all three folder-listed models.
START = r'''set -e
echo "[instantid] === blocking setup (node + insightface + antelopev2) ==="
cd /comfyui/custom_nodes
if [ ! -d ComfyUI_InstantID ]; then git clone --depth 1 ''' + NODE_REPO + r''' ComfyUI_InstantID; fi
python -m pip install --no-cache-dir insightface onnxruntime || { echo "[instantid] PIP FAILED"; exit 1; }

mkdir -p /comfyui/models/instantid /comfyui/models/controlnet /comfyui/models/checkpoints /comfyui/models/insightface/models
ANT=/comfyui/models/insightface/models/antelopev2
if [ ! -e "$ANT/glintr100.onnx" ]; then
  echo "[instantid] download antelopev2"
  wget -q -O /tmp/antelopev2.zip "''' + ANTELOPE_URL + r'''"
  ZS=$(stat -c%s /tmp/antelopev2.zip 2>/dev/null || echo 0)
  if [ "$ZS" -lt 100000000 ]; then echo "[instantid] ANTELOPE DL FAILED ($ZS bytes)"; exit 1; fi
  python -c "import zipfile; zipfile.ZipFile('/tmp/antelopev2.zip').extractall('/tmp/ant_x')"
  # flatten: find the dir actually holding the onnx files (zip nesting varies) and move them into place
  SRC=$(dirname "$(find /tmp/ant_x -name glintr100.onnx | head -1)")
  mkdir -p "$ANT"; mv "$SRC"/*.onnx "$ANT"/
  echo "[instantid] antelopev2 ready: $(ls "$ANT" | tr '\n' ' ')"
fi

# background big-file downloads (atomic, size-guarded)
dl() {  # $1=url $2=dest $3=minbytes
  if [ ! -e "$2" ]; then
    echo "[instantid] bg download $(basename "$2")"
    wget -q -O "$2.part" "$1"
    SZ=$(stat -c%s "$2.part" 2>/dev/null || echo 0)
    if [ "$SZ" -gt "$3" ]; then mv "$2.part" "$2"; echo "[instantid] ready $(basename "$2") ($SZ bytes)";
    else echo "[instantid] DL FAILED $(basename "$2") ($SZ bytes)"; rm -f "$2.part"; fi
  fi
}
( dl "''' + CKPT_URL + r'''" "/comfyui/models/checkpoints/''' + CKPT + r'''" 1000000000
  dl "''' + CN_URL + r'''" "/comfyui/models/controlnet/''' + CN_NAME + r'''" 1000000000
  dl "''' + IPA_URL + r'''" "/comfyui/models/instantid/ip-adapter.bin" 1000000000 ) &

echo "[instantid] launch ComfyUI (big models downloading in background)"
cd /comfyui && exec python -u main.py --disable-auto-launch --disable-metadata --listen --port 8188
'''

BASE = "blueline-instantid"
NAME = pod_name(BASE)          # display only; provider owns naming
POD_ID_FILE = pod_id_file()

def _spec():
    return {"base": BASE, "image": IMAGE, "gpuTypeIds": GPU_IDS, "gpuCount": 1,
            "ports": ["8188/http"], "containerDiskInGb": 60,
            "dockerStartCmd": ["bash", "-c", START]}

def create_pod():
    r = _PROV.create(_spec()); POD_ID_FILE.write_text(r.id); return r.id

def cleanup_named():
    mine = _PROV.list_mine(); print(f"[cleanup] {len(mine)} pod(s): {[r.id for r in mine]}")
    for r in mine: _PROV.terminate(r)
    return len(mine)

def terminate(pid):
    return _PROV.terminate(pid)

def _opts(pid, node, field):
    """folder-listed options for a node input field, via /object_info (empty list on any miss)."""
    try:
        info = json.loads(proxy_get(pid, f"/object_info/{node}", timeout=10))
        req = info.get(node, {}).get("input", {}).get("required", {})
        v = req.get(field, [[]])
        return v[0] if v and isinstance(v[0], list) else []
    except Exception:
        return []

def wait_ready(pid, boot_timeout=1800):
    t0 = time.time(); up = False
    while time.time() - t0 < boot_timeout:
        el = int(time.time()-t0)
        if not up:
            try: proxy_get(pid, "/system_stats", timeout=10); up = True; print(f"[ready] ComfyUI HTTP up at ~{el}s")
            except Exception:
                g,_ = _PROV.api("GET", f"/pods/{pid}"); ds = g.get("desiredStatus") if isinstance(g,dict) else "?"
                print(f"[ready] waiting… {el}s (status={ds})"); time.sleep(10); continue
        # node present? (loads at startup -> if absent, the node/pip install failed)
        try:
            oi = json.loads(proxy_get(pid, "/object_info/ApplyInstantID", timeout=10))
            node_ok = "ApplyInstantID" in oi
        except Exception as e:
            node_ok = False; print(f"[ready] node probe retry ({el}s): {repr(e)[:80]}")
        ck = CKPT in _opts(pid, "CheckpointLoaderSimple", "ckpt_name")
        ipa = "ip-adapter.bin" in _opts(pid, "InstantIDModelLoader", "instantid_file")
        cn = CN_NAME in _opts(pid, "ControlNetLoader", "control_net_name")
        print(f"[ready] {el}s node={node_ok} sdxl={ck} ip-adapter={ipa} controlnet={cn}")
        if node_ok and ck and ipa and cn:
            print(f"[ready] PASS at ~{el}s"); return True
        time.sleep(10)
    return False

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--terminate-only", default=None)
    ap.add_argument("--render-script", default="instantid_gaze_render.py",
                    help="render script the orchestrator runs against the live pod (auto-terminates after)")
    ap.add_argument("--render-args", default="--ref face-swap/target.png")
    a = ap.parse_args()
    print(f"[ns] agent slug={SLUG}  pod name={NAME}")
    if a.terminate_only: terminate(a.terminate_only); return
    mine = _PROV.list_mine()
    if mine:
        print(f"[guard] my pod '{NAME}' already exists {[r.id for r in mine]} — abort. Run --terminate-only to remove it first."); sys.exit(2)
    pid = create_pod(); rc = 1
    try:
        if not wait_ready(pid): raise RuntimeError("pod did not reach ready")
        print(f"[render] starting {a.render_script}")
        rc = subprocess.run([sys.executable, str(HERE/a.render_script), "--pod", pid] + a.render_args.split(),
                            cwd=str(HERE)).returncode
        print(f"[render] {a.render_script} exited {rc}")
    finally:
        print("[finally] tearing down pod (guaranteed)"); terminate(pid)
    sys.exit(rc)

if __name__ == "__main__":
    main()
