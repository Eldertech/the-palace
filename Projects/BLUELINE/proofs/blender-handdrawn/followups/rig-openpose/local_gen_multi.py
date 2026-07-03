"""
Figure Rig — LOCAL multi-figure gen against the running ComfyUI on :8188 (RunPod fallback when
capacity is flaky). Reuses multi_batch_pod's graph + SCENES + NEG unchanged; only the transport
is local. Slower than a pod but dependable.

  _tools/ComfyUI/venv/bin/python3 local_gen_multi.py --scenes B3_reach,B4_cradle --styles ink
Outputs -> renders/multi-gen/<scene>/gen_<style>.png
"""
import argparse, json, os, sys, time, uuid, subprocess, urllib.request, urllib.parse

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.normpath(os.path.join(HERE, "..", "..", "..", "new-story")))
sys.path.insert(0, HERE)
import multi_batch_pod as MB

HOST = "127.0.0.1:8188"
CLIENT = uuid.uuid4().hex
PLATES = os.path.join(HERE, "renders", "multi")
OUT = os.path.join(HERE, "renders", "multi-gen")


def req(method, path, data=None):
    h = {"Content-Type": "application/json"} if data else {}
    r = urllib.request.Request(f"http://{HOST}{path}", data=data, method=method, headers=h)
    with urllib.request.urlopen(r, timeout=1800) as resp:
        return resp.read()


def upload(path):
    name = os.path.basename(path)
    out = subprocess.run(["curl", "-sS", "-F", f"image=@{path};type=image/png;filename={name}",
                          "-F", "overwrite=true", f"http://{HOST}/upload/image"],
                         capture_output=True, text=True, timeout=60)
    return json.loads(out.stdout).get("name", name)


def run(wf, dest):
    t0 = time.time()
    pid = json.loads(req("POST", "/prompt", json.dumps({"prompt": wf, "client_id": CLIENT}).encode()))["prompt_id"]
    while True:
        h = json.loads(req("GET", f"/history/{pid}"))
        if pid in h:
            hist = h[pid]; break
        if time.time() - t0 > 1800:
            raise TimeoutError(pid)
        time.sleep(3)
    if hist.get("status", {}).get("status_str") == "error":
        raise RuntimeError(json.dumps(hist.get("status", {}))[:300])
    for o in hist.get("outputs", {}).values():
        for img in o.get("images", []):
            q = urllib.parse.urlencode({"filename": img["filename"], "subfolder": img.get("subfolder", ""),
                                        "type": img.get("type", "output")})
            open(dest, "wb").write(req("GET", "/view?" + q))
            return time.time() - t0
    raise RuntimeError("no image in outputs")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--scenes", required=True)
    ap.add_argument("--styles", default="ink")
    a = ap.parse_args()
    scenes = a.scenes.split(",")
    styles = [s for s in MB.STYLES if s[0] in a.styles.split(",")]

    print(f"[local] {len(scenes)} scenes x {len(styles)} styles on {HOST}", flush=True)
    for scene in scenes:
        pd = os.path.join(PLATES, scene)
        sh = upload(os.path.join(pd, "shaded_plate.png"))
        dep = upload(os.path.join(pd, "depth_plate.png"))
        pose = upload(os.path.join(pd, "openpose.png"))
        outdir = os.path.join(OUT, scene); os.makedirs(outdir, exist_ok=True)
        for skey, stext in styles:
            prompt = f"{MB.SCENES[scene]}, {MB.styletext(stext)}"
            g = MB.graph(prompt, 9100 + abs(hash(scene)) % 900, f"{scene}_{skey}", sh, dep, pose)
            dest = os.path.join(outdir, f"gen_{skey}.png")
            try:
                dt = run(g, dest)
                print(f"  [{scene}/{skey}] {dt:.0f}s -> {dest}", flush=True)
            except Exception as e:
                print(f"  [{scene}/{skey}] FAILED {repr(e)[:160]}", flush=True)
    print("LOCAL_MULTI_DONE", flush=True)


if __name__ == "__main__":
    main()
