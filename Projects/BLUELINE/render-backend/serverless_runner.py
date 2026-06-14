#!/usr/bin/env python3
"""
BLUELINE Track I — the Piece→serverless runner.

Drives a board record through a RunPod *serverless* ComfyUI endpoint (the Piece tier of
the routing split). The pod (Study) tier is runner.py + the hardened transport. Same board
contract (board_template.txt), different transport: serverless takes the full workflow in a
/run payload (no WAF, no upload step), so this half needs no browser-UA hardening.

Stdlib only — no pip install. Reads key+endpoint from (in order): env RUNPOD_API_KEY /
RUNPOD_ENDPOINT_ID, then ../../RunPod Images/studio/config.json, then a --config path.
The key is never printed.

  python3 serverless_runner.py --template ../render-backend/board_template.txt --shot 04A
"""
import argparse, base64, json, os, re, ssl, sys, time, urllib.request, urllib.error
from pathlib import Path

HERE = Path(__file__).resolve().parent

def load_cfg(explicit=None):
    key = os.environ.get("RUNPOD_API_KEY"); ep = os.environ.get("RUNPOD_ENDPOINT_ID")
    paths = [Path(explicit)] if explicit else []
    paths.append(HERE.parents[2] / "RunPod Images" / "studio" / "config.json")
    for cf in paths:
        if (not key or not ep) and cf.exists():
            c = json.loads(cf.read_text())
            key = key or c.get("api_key"); ep = ep or c.get("endpoint_id")
    return key, ep

try:
    import certifi; CTX = ssl.create_default_context(cafile=certifi.where())
except Exception:
    CTX = ssl._create_unverified_context()

def rp(root, key, method, path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(f"{root}/{path}", data=data, method=method)
    r.add_header("Authorization", f"Bearer {key}"); r.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(r, timeout=90, context=CTX) as resp:
        return json.loads(resp.read().decode())

# ---- board parse (same contract as runner.py) ----
def parse_template(path):
    raw = Path(path).read_text().splitlines()
    segs, cur, kind = [], [], None
    for line in raw:
        h = re.match(r"^#\s*===\s*(BIBLE|BOARD)\s*===", line)
        if h:
            if kind: segs.append((kind, cur))
            kind, cur = h.group(1), []
        elif kind: cur.append(line)
    if kind: segs.append((kind, cur))
    def fields(lines):
        f, k = {}, None
        for line in lines:
            if not line.strip(): k = None; continue
            m = re.match(r"^([A-Z_]+)\s*:\s?(.*)$", line)
            if m: k, f[m.group(1)] = m.group(1), m.group(2).strip()
            elif k and (line.startswith(" ") or line.startswith("\t")):
                f[k] = (f[k] + " " + line.strip()).strip()
        return f
    bible, boards = {}, []
    for k, seg in segs:
        f = fields([l for l in seg if not l.lstrip().startswith("#")])
        if k == "BIBLE": bible = f
        elif f.get("SHOT_ID"): boards.append(f)
    return bible, boards

# ---- the FLUX txt2img workflow the palace-flux worker image runs ----
def flux_workflow(prompt, w, h, seed, steps, guidance):
    return {
     "30":{"class_type":"CheckpointLoaderSimple","inputs":{"ckpt_name":"flux1-dev-fp8.safetensors"}},
     "27":{"class_type":"EmptySD3LatentImage","inputs":{"width":w,"height":h,"batch_size":1}},
     "6":{"class_type":"CLIPTextEncode","inputs":{"text":prompt,"clip":["30",1]}},
     "33":{"class_type":"CLIPTextEncode","inputs":{"text":"","clip":["30",1]}},
     "35":{"class_type":"FluxGuidance","inputs":{"conditioning":["6",0],"guidance":guidance}},
     "31":{"class_type":"KSampler","inputs":{"seed":seed,"steps":steps,"cfg":1,"sampler_name":"euler","scheduler":"simple","denoise":1,"model":["30",0],"positive":["35",0],"negative":["33",0],"latent_image":["27",0]}},
     "8":{"class_type":"VAEDecode","inputs":{"samples":["31",0],"vae":["30",2]}},
     "9":{"class_type":"SaveImage","inputs":{"filename_prefix":"studio","images":["8",0]}},
    }

def parse_ar(bible_render, default=(1344, 768)):
    m = re.search(r"(\d+)x(\d+)", bible_render or "")
    return (int(m.group(1)), int(m.group(2))) if m else default

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--template", default=str(HERE / "board_template.txt"))
    ap.add_argument("--shot", required=True)
    ap.add_argument("--config", default=None)
    ap.add_argument("--out", default=str(HERE / "out" / "serverless"))
    ap.add_argument("--steps", type=int, default=24)
    ap.add_argument("--timeout", type=int, default=420)
    args = ap.parse_args()

    key, ep = load_cfg(args.config)
    if not (key and ep): sys.exit("No RunPod key/endpoint (env or studio config.json).")
    root = f"https://api.runpod.ai/v2/{ep}"
    print(f"serverless runner | endpoint {ep} | key {'ok' if key else 'MISSING'}")

    bible, boards = parse_template(args.template)
    board = next((b for b in boards if b["SHOT_ID"] == args.shot), None)
    if not board: sys.exit(f"shot {args.shot} not in {args.template}")
    w, h = parse_ar(bible.get("RENDER_PIECE") or bible.get("RENDER_STUDY"))
    seed = int(board.get("FLUX_SEED") or board.get("SEED") or 0)
    guidance = float(re.search(r"guidance\s+([\d.]+)", bible.get("RENDER_PIECE","")).group(1)
                     ) if "guidance" in (bible.get("RENDER_PIECE") or "") else 3.5
    positive = board.get("POSITIVE","")
    print(f"shot {args.shot} | {w}x{h} | seed {seed} | guidance {guidance} | steps {args.steps}")
    print(f"POSITIVE: {positive[:120]}...")

    wf = flux_workflow(positive, w, h, seed, args.steps, guidance)
    print("submitting /run ...")
    sub = rp(root, key, "POST", "run", {"input": {"workflow": wf}})
    jid = sub["id"]; print(f"job {jid} queued; polling (cold start can take a few min)...")
    t0 = time.time()
    while True:
        s = rp(root, key, "GET", f"status/{jid}")
        st = s.get("status"); el = int(time.time()-t0)
        print(f"  [{el:>3}s] {st}")
        if st == "COMPLETED": break
        if st in ("FAILED","CANCELLED","TIMED_OUT"):
            sys.exit(f"job {st}: {json.dumps(s)[:400]}")
        if el > args.timeout: sys.exit("timeout")
        time.sleep(5)
    imgs = (s.get("output") or {}).get("images", [])
    if not imgs: sys.exit(f"no images in output: {json.dumps(s)[:400]}")
    outdir = Path(args.out); outdir.mkdir(parents=True, exist_ok=True)
    fn = outdir / f"{args.shot}_piece_serverless.png"
    fn.write_bytes(base64.b64decode(imgs[0]["data"]))
    report = {"shot":args.shot,"endpoint":ep,"w":w,"h":h,"seed":seed,"guidance":guidance,
              "steps":args.steps,"job_id":jid,"elapsed_sec":int(time.time()-t0),
              "model":"flux1-dev-fp8.safetensors","status":"ok"}
    (outdir / f"{args.shot}_piece_serverless.report.json").write_text(json.dumps(report, indent=2))
    print(f"SAVED {fn}  ({fn.stat().st_size//1024} KB, {report['elapsed_sec']}s total)")
    print("SERVERLESS_RUNNER_DONE")

if __name__ == "__main__":
    main()
