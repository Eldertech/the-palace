#!/usr/bin/env python3
"""
Animatic pipeline batch runner.

Parses board_template.txt, and for each board:
  1. uploads its control / identity images to the ComfyUI pod
  2. patches an API-format workflow by node _meta.title (NOT by node id)
  3. queues it, polls /history, downloads the results

The same runner drives both tiers. Titled nodes a board doesn't supply data
for are left untouched, so a study graph and a piece graph both work.

Setup:
  export COMFY_URL="https://<podId>-8188.proxy.runpod.net"
  pip install -r requirements.txt

Examples:
  python runner.py --ping
  python runner.py --workflow graphs/sdxl_study.api.json --profile study
  python runner.py --workflow graphs/flux_piece.api.json --profile piece --shots 04A,04B
"""
import argparse, copy, json, os, re, sys, time, uuid
from pathlib import Path

try:
    import requests
except ImportError:
    sys.exit("Missing dependency: pip install requests")

COMFY_URL = os.environ.get("COMFY_URL", "").rstrip("/")
CLIENT_ID = uuid.uuid4().hex

# Per-tier wiring: which template field holds the seed, and which input key
# on the node titled SAMPLER receives it. The runner patches whichever of
# these keys actually exists on that node, so KSampler (seed) and FLUX
# RandomNoise (noise_seed) both work.
PROFILES = {
    "study": {"seed_field": "SEED",      "seed_keys": ["seed", "noise_seed"]},
    "piece": {"seed_field": "FLUX_SEED", "seed_keys": ["noise_seed", "seed"]},
}

# ---------------------------------------------------------------- template parse
def parse_fields(lines):
    fields, key = {}, None
    for line in lines:
        if not line.strip():
            key = None
            continue
        m = re.match(r"^([A-Z_]+)\s*:\s?(.*)$", line)
        if m:
            key, val = m.group(1), m.group(2).rstrip()
            fields[key] = val.strip()
        elif key and (line.startswith(" ") or line.startswith("\t")):
            fields[key] = (fields[key] + " " + line.strip()).strip()
    return fields

def parse_template(path):
    raw = Path(path).read_text().splitlines()
    # split into segments at "# === BIBLE ===" / "# === BOARD ==="
    segments, cur, kind = [], [], None
    for line in raw:
        h = re.match(r"^#\s*===\s*(BIBLE|BOARD)\s*===", line)
        if h:
            if kind:
                segments.append((kind, cur))
            kind, cur = h.group(1), []
        elif kind:
            cur.append(line)
    if kind:
        segments.append((kind, cur))
    bible, boards = {}, []
    for k, seg in segments:
        f = parse_fields([l for l in seg if not l.lstrip().startswith("#")])
        if k == "BIBLE":
            bible = f
        elif f.get("SHOT_ID"):
            boards.append(f)
    return bible, boards

# ---------------------------------------------------------------- comfy api
def api(method, path, **kw):
    if not COMFY_URL:
        sys.exit("Set COMFY_URL to your pod endpoint (https://<podId>-8188.proxy.runpod.net)")
    r = requests.request(method, f"{COMFY_URL}{path}", timeout=kw.pop("timeout", 60), **kw)
    r.raise_for_status()
    return r

def ping():
    s = api("GET", "/system_stats").json()
    devs = s.get("devices", [])
    name = devs[0].get("name") if devs else "unknown"
    print(f"OK  ComfyUI reachable  | GPU: {name}")
    return True

def upload_image(local_path):
    p = Path(local_path)
    if not p.exists():
        print(f"   ! missing asset: {local_path}  (skipping that wire)")
        return None
    with open(p, "rb") as fh:
        r = api("POST", "/upload/image",
                files={"image": (p.name, fh, "image/png")},
                data={"overwrite": "true"})
    return r.json().get("name", p.name)

def find_by_title(wf):
    out = {}
    for nid, node in wf.items():
        t = node.get("_meta", {}).get("title")
        if t:
            out.setdefault(t, nid)
    return out

def patch(wf, title_map, title, key, value):
    nid = title_map.get(title)
    if nid is None or value is None:
        return
    wf[nid].setdefault("inputs", {})[key] = value

def queue_and_collect(wf, out_dir, shot_id):
    pid = api("POST", "/prompt",
              json={"prompt": wf, "client_id": CLIENT_ID}).json()["prompt_id"]
    # poll history
    t0 = time.time()
    while True:
        hist = api("GET", f"/history/{pid}").json()
        if pid in hist and hist[pid].get("outputs"):
            break
        if time.time() - t0 > 900:
            print(f"   ! timeout on {shot_id}")
            return []
        time.sleep(2)
    saved = []
    outputs = hist[pid]["outputs"]
    for node_out in outputs.values():
        for img in node_out.get("images", []):
            params = {"filename": img["filename"],
                      "subfolder": img.get("subfolder", ""),
                      "type": img.get("type", "output")}
            data = api("GET", "/view", params=params).content
            dest = Path(out_dir) / img["filename"]
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(data)
            saved.append(str(dest))
    return saved

# ---------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--template", default="board_template.txt")
    ap.add_argument("--workflow", help="API-format workflow JSON")
    ap.add_argument("--profile", choices=PROFILES.keys(), default="study")
    ap.add_argument("--assets", default="./assets")
    ap.add_argument("--out", default=None, help="default: out/<profile>")
    ap.add_argument("--shots", default=None, help="comma list, e.g. 04A,04B")
    ap.add_argument("--ping", action="store_true")
    args = ap.parse_args()

    if args.ping:
        ping(); return
    if not args.workflow:
        sys.exit("--workflow is required (unless --ping)")

    ping()
    prof = PROFILES[args.profile]
    out_dir = args.out or f"out/{args.profile}"
    bible, boards = parse_template(args.template)
    if args.shots:
        want = {s.strip() for s in args.shots.split(",")}
        boards = [b for b in boards if b["SHOT_ID"] in want]
    if not boards:
        sys.exit("No boards matched.")

    base_wf = json.loads(Path(args.workflow).read_text())
    assets = Path(args.assets)
    print(f"\n{len(boards)} board(s) | profile={args.profile} | out={out_dir}\n")

    for b in boards:
        sid = b["SHOT_ID"]
        wf = copy.deepcopy(base_wf)
        tmap = find_by_title(wf)

        # text axes
        patch(wf, tmap, "POSITIVE", "text", b.get("POSITIVE"))
        patch(wf, tmap, "NEG", "text", bible.get("GLOBAL_NEG"))

        # control / identity wires (upload first, patch with returned name)
        for title, field in (("POSE", "POSE"), ("DEPTH", "DEPTH"), ("IDREF", "IDREF")):
            rel = b.get(field)
            if rel and title in tmap:
                name = upload_image(assets / rel if not os.path.isabs(rel) else rel)
                patch(wf, tmap, title, "image", name)

        # seed (try each candidate key that exists on the SAMPLER node)
        seed_val = b.get(prof["seed_field"])
        if seed_val and "SAMPLER" in tmap:
            inp = wf[tmap["SAMPLER"]].get("inputs", {})
            for k in prof["seed_keys"]:
                if k in inp:
                    inp[k] = int(seed_val)
                    break

        # output naming
        patch(wf, tmap, "SAVE", "filename_prefix", f"{sid}_{args.profile}")

        print(f"-> {sid}")
        files = queue_and_collect(wf, out_dir, sid)
        for f in files:
            print(f"   saved {f}")

    print("\nDone.")

if __name__ == "__main__":
    main()
