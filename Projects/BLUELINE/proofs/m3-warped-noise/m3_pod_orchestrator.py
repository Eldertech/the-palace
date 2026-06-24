#!/usr/bin/env python3
"""
BLUELINE M3 — the pod LIFECYCLE owner (the spend). Creates a RunPod FLUX-ControlNet pod on the
blueline-models volume, GATES on readiness (ComfyUI up + NoiseFromNPY registered + the FLUX Union CN
present), runs the three M3 renders via m3_pod_render.py, and ALWAYS terminates the pod in finally —
so a boot/render failure costs minutes, not a leaked GPU. Loudon greenlit ~$0.30 for this run.

  python3 m3_pod_orchestrator.py            # full lifecycle: create -> render -> terminate
  python3 m3_pod_orchestrator.py --terminate-only <podId>   # safety: kill a leaked pod
"""
import argparse, base64, json, ssl, subprocess, sys, time
import urllib.request, urllib.error
from pathlib import Path

PALACE = Path("/Users/loudonstearns/Documents/The Palace")
CONFIG = PALACE / "RunPod Images" / "studio" / "config.json"
HERE = Path(__file__).resolve().parent
NODE = HERE / "comfy_inject_node.py"

VOLUME_ID = "aqm8oev4b0"                       # blueline-models (EU-RO-1) — holds FLUX-ControlNet-Union
IMAGE = "runpod/worker-comfyui:5.8.4-flux1-dev-fp8"
GPU_IDS = ["NVIDIA GeForce RTX 4090", "NVIDIA L40S", "NVIDIA L40",
           "NVIDIA RTX A6000", "NVIDIA A40", "NVIDIA RTX A5000"]
CN_NAME = "flux-union-pro.safetensors"
CN_HF = ("https://huggingface.co/Shakker-Labs/FLUX.1-dev-ControlNet-Union-Pro/resolve/main/"
         "diffusion_pytorch_model.safetensors")
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"

KEY = json.load(open(CONFIG))["api_key"]
try:
    import certifi; CTX = ssl.create_default_context(cafile=certifi.where())
except Exception:
    CTX = ssl._create_unverified_context()

def api(method, path, body=None, timeout=60):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request("https://rest.runpod.io/v1" + path, data=data, method=method,
          headers={"Authorization": f"Bearer {KEY}", "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=timeout, context=CTX) as r:
            b = r.read(); return (json.loads(b) if b else {}), r.status
    except urllib.error.HTTPError as e:
        return {"_error": e.read().decode()[:500]}, e.code

def proxy_get(pid, path, timeout=15):
    url = f"https://{pid}-8188.proxy.runpod.net{path}"
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout, context=CTX) as r:
        return r.read()

def start_script():
    node_b64 = base64.b64encode(NODE.read_bytes()).decode()
    return (
        'set -e\n'
        'echo "[m3] write custom node"\n'
        'mkdir -p /comfyui/custom_nodes\n'
        f'echo {node_b64} | base64 -d > /comfyui/custom_nodes/comfy_inject_node.py\n'
        'echo "[m3] ensure controlnet"\n'
        'mkdir -p /comfyui/models/controlnet\n'
        f'CN=/comfyui/models/controlnet/{CN_NAME}\n'
        'if [ ! -e "$CN" ]; then\n'
        f'  F=$(find /workspace -type f \\( -iname "{CN_NAME}" -o -iname "*union*pro*.safetensors" '
        '-o -iname "*controlnet*union*.safetensors" \\) 2>/dev/null | head -1)\n'
        '  if [ -n "$F" ]; then echo "[m3] symlink $F"; ln -sf "$F" "$CN"; '
        f'else echo "[m3] download CN"; wget -q -O "$CN" "{CN_HF}"; fi\n'
        'fi\n'
        'ls -la /comfyui/models/controlnet/ || true\n'
        'echo "[m3] launch ComfyUI"\n'
        'cd /comfyui && exec python -u main.py --disable-auto-launch --disable-metadata --listen --port 8188\n'
    )

def create_pod(max_tries=12, delay=30):
    body = {
        "name": "blueline-m3", "imageName": IMAGE,
        "gpuTypeIds": GPU_IDS, "gpuCount": 1,
        "networkVolumeId": VOLUME_ID, "volumeMountPath": "/workspace",
        "ports": ["8188/http", "22/tcp"], "containerDiskInGb": 25,
        "dockerStartCmd": ["bash", "-c", start_script()],
    }
    for i in range(max_tries):
        r, code = api("POST", "/pods", body)
        if code in (200, 201):
            pid = r.get("id") or r.get("podId")
            if not pid:
                sys.exit(f"create returned no id: {json.dumps(r)[:400]}")
            Path("/tmp/pod_id").write_text(pid)
            print(f"[create] pod {pid} ({r.get('machine',{}).get('gpuTypeId') or r.get('gpuTypeIds')}) — id at /tmp/pod_id")
            return pid
        err = json.dumps(r)[:200]
        # EU-RO-1 (the volume's DC) momentarily out of all listed GPUs — capacity is transient, retry.
        if code == 500 or "no instances" in err.lower() or "no longer any instances" in err.lower():
            print(f"[create] no capacity (try {i+1}/{max_tries} [{code}]): {err} — retry in {delay}s")
            time.sleep(delay); continue
        sys.exit(f"create failed [{code}]: {json.dumps(r)[:600]}")
    sys.exit(f"create failed: no GPU capacity in the volume's datacenter after {max_tries} tries — try later")

def terminate(pid):
    r, code = api("DELETE", f"/pods/{pid}")
    print(f"[terminate] DELETE /pods/{pid} -> {code} {('' if code in (200,204) else json.dumps(r)[:300])}")
    # verify gone
    for _ in range(10):
        g, c = api("GET", f"/pods/{pid}")
        if c == 404 or (isinstance(g, dict) and g.get("desiredStatus") in ("TERMINATED", "EXITED")):
            print(f"[terminate] confirmed pod {pid} gone/terminated"); return True
        time.sleep(3)
    print(f"[terminate] WARNING — could not confirm termination of {pid}; check the RunPod console")
    return False

def wait_ready(pid, boot_timeout=720):
    t0 = time.time()
    comfy_up = False
    while time.time() - t0 < boot_timeout:
        el = int(time.time() - t0)
        if not comfy_up:
            try:
                proxy_get(pid, "/system_stats", timeout=10); comfy_up = True
                print(f"[ready] ComfyUI HTTP up at ~{el}s")
            except Exception:
                g, _ = api("GET", f"/pods/{pid}")
                ds = g.get("desiredStatus") if isinstance(g, dict) else "?"
                print(f"[ready] waiting… {el}s (pod desiredStatus={ds})"); time.sleep(8); continue
        # ComfyUI up — verify node + CN are registered
        try:
            node = json.loads(proxy_get(pid, "/object_info/NoiseFromNPY", timeout=10))
            cnl = json.loads(proxy_get(pid, "/object_info/ControlNetLoader", timeout=10))
            opts = cnl.get("ControlNetLoader", {}).get("input", {}).get("required", {}).get("control_net_name", [[]])
            cn_list = opts[0] if opts and isinstance(opts[0], list) else []
            has_node = bool(node.get("NoiseFromNPY"))
            has_cn = CN_NAME in cn_list
            print(f"[ready] NoiseFromNPY={has_node} | {CN_NAME} in controlnet list={has_cn} (have: {cn_list})")
            if has_node and has_cn:
                print(f"[ready] PASS at ~{el}s"); return True
        except Exception as e:
            print(f"[ready] node/CN probe retry ({el}s): {repr(e)[:120]}")
        time.sleep(8)
    return False

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--terminate-only", default=None)
    ap.add_argument("--render-script", default="m3.6_pod_render.py")   # current move: the delta sweep
    ap.add_argument("--render-args", default="")                       # extra argv for the render script
    a = ap.parse_args()
    if a.terminate_only:
        terminate(a.terminate_only); return

    # guard: don't stack pods
    pods, _ = api("GET", "/pods")
    existing = [p for p in (pods if isinstance(pods, list) else [])]
    if existing:
        print(f"[guard] {len(existing)} pod(s) already exist: {[p.get('id') for p in existing]} — aborting to avoid double spend")
        sys.exit(2)

    pid = create_pod()
    rc = 1
    try:
        if not wait_ready(pid):
            raise RuntimeError("pod did not reach render-ready state within timeout")
        print(f"[render] starting {a.render_script}")
        cmd = [sys.executable, str(HERE / a.render_script), "--pod", pid] + a.render_args.split()
        p = subprocess.run(cmd, cwd=str(HERE))
        rc = p.returncode
        print(f"[render] m3_pod_render exited {rc}")
    finally:
        print("[finally] tearing down pod (guaranteed)")
        terminate(pid)
    sys.exit(rc)

if __name__ == "__main__":
    main()
