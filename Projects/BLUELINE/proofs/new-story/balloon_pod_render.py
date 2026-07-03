#!/usr/bin/env python3
"""
BLUELINE — living-balloon render batch, run against a RunPod SDXL+canny POD.

Invoked by pose_pod_orchestrator.py as: balloon_pod_render.py --pod <id>
Drives the pod's native ComfyUI (proxy URL + browser UA + curl upload, per the RunPod
playbook), reuses render_text.py's SDXL+canny graph and balloon_lib's balloon masks.

The batch (membrane-first, per Loudon):
  1. MEMBRANE — a THICK/rough rim in the guide so the bubble MEMBRANE itself renders as
     living material (the finding from the local sweep: canny strength alone keeps the rim
     a clean line; the membrane needs room). toolate-bleed, thick rim, cn {0.4,0.5,0.6}.
  2. BACKFILL — the higher-strength sweep cells the local run didn't reach (thin rim,
     toolate, cn {0.65,0.8,1.0} at end 0.4).
  3. RANGE — the sweet spot (cn0.5, thin rim) across materials: burning + thoom.

Out: text-layer/balloons-genai/pod/<tag>.png
"""
import os, sys, json, time, ssl, uuid, subprocess, urllib.request, urllib.parse
import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
TEXTLAYER = os.path.abspath(os.path.join(HERE, "..", "text-layer"))
RIG = os.path.abspath(os.path.join(HERE, "..", "blender-handdrawn", "followups", "rig-openpose"))
sys.path.insert(0, TEXTLAYER); sys.path.insert(0, RIG)
import balloon_lib as B
import render_text as RT
import balloon_material as BM          # sets RT.NEG (no frame/border ban), provides EX

OUT = os.path.join(TEXTLAYER, "balloons-genai", "pod"); os.makedirs(OUT, exist_ok=True)
W, H = RT.R["size"]; S = B.S

POD = sys.argv[sys.argv.index("--pod")+1] if "--pod" in sys.argv else open("/tmp/pod_id").read().strip()
BASE = f"https://{POD}-8188.proxy.runpod.net"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
CLIENT = uuid.uuid4().hex
try:
    import certifi; CTX = ssl.create_default_context(cafile=certifi.where())
except Exception:
    CTX = ssl._create_unverified_context()

def req(method, path, data=None, ctype=None):
    h = {"User-Agent": UA}
    if ctype: h["Content-Type"] = ctype
    r = urllib.request.Request(BASE+path, data=data, method=method, headers=h)
    with urllib.request.urlopen(r, timeout=180, context=CTX) as resp: return resp.read()

def upload(path):
    name = os.path.basename(path)
    out = subprocess.run(["curl","-s","--max-time","40","-X","POST",
        "-F", f"image=@{path};type=image/png;filename={name}", "-F","overwrite=true",
        f"{BASE}/upload/image"], capture_output=True, text=True, timeout=50)
    if '"name"' not in out.stdout:
        raise RuntimeError("upload failed: "+out.stdout[:160]+out.stderr[:160])
    return json.loads(out.stdout).get("name", name)

def run(wf, dest, timeout=300):
    pid = json.loads(req("POST","/prompt", json.dumps({"prompt":wf,"client_id":CLIENT}).encode(),
                         "application/json"))["prompt_id"]
    t0=time.time()
    while time.time()-t0 < timeout:
        h = json.loads(req("GET", f"/history/{pid}"))
        if pid in h:
            st = h[pid].get("status",{})
            if st.get("status_str") != "success": raise RuntimeError(json.dumps(st)[:200])
            for _,o in h[pid].get("outputs",{}).items():
                for img in o.get("images",[]):
                    q=urllib.parse.urlencode({"filename":img["filename"],"subfolder":img.get("subfolder",""),"type":img.get("type","output")})
                    open(dest,"wb").write(req("GET","/view?"+q)); return time.time()-t0
            raise RuntimeError("no image")
        time.sleep(2)
    raise TimeoutError(pid)


# ---- guide builder with a rim-thickness knob (the membrane lever) ----------------
def build_guide(word, fontname, style, dest, rim=8, rough=False):
    center, half, tip = (W/2, H*0.46), (W*0.33, H*0.27), (W/2 - 90, H*0.92)
    mask = np.zeros((H*S, W*S), np.uint8)
    B.STYLES[style]["body"](mask, center[0], center[1], half[0], half[1])
    union = mask.copy(); root = B.edge_point(union, center, tip); t = B.STYLES[style]["tail"]
    if t == "tri": B.add_tail(union, root, tip, 34)
    elif t == "jag":
        B.add_tail(union, root, tip, 40); mid=((root[0]+tip[0])/2,(root[1]+tip[1])/2); B.add_tail(union, root, mid, 22)
    elif t == "droop": B.add_tail(union, root, tip, 28, 30)
    canvas = np.zeros((H, W, 3), np.uint8)
    B.stroke(canvas, union, thick=rim, color=(255,255,255))
    if rough:                          # a second, offset thinner stroke -> a rough double edge with room to bleed
        B.stroke(canvas, union, thick=max(2, rim//3), color=(255,255,255))
    pim = Image.fromarray(canvas); d = ImageDraw.Draw(pim)
    fp, fi = RT.resolve_font(fontname)
    avail_w, avail_h = 2*half[0]*0.72, 2*half[1]*0.60
    sz = 360
    while sz > 30:
        f = ImageFont.truetype(fp, sz, index=fi)
        l,t2,r,b = d.textbbox((0,0), word, font=f)
        if (r-l)<=avail_w and (b-t2)<=avail_h: break
        sz -= 8
    l,t2,r,b = d.textbbox((0,0), word, font=f)
    d.text((center[0]-(r-l)/2-l, center[1]-(b-t2)/2-t2), word, font=f, fill=(255,255,255))
    pim.save(dest); return dest

def full_prompt(ex):
    return (f'{ex["prompt"]}, on a pure solid black background, generous black negative space, '
            f'hand-lettered expressive illustration, the forms themselves carrying the emotion, '
            f'NOT a clean typeface')

def do(tag, ex, guide_path, cn, cne, seed=2222):
    dest = os.path.join(OUT, f"{tag}.png")
    try:
        gname = upload(guide_path)
        wf = RT.graph(full_prompt(ex), seed, f"pod_{tag}", skel_name=gname, cn=cn, cn_end=cne)
        dt = run(wf, dest)
        print(f"  [{tag}] cn={cn} end={cne} ({dt:.0f}s) -> {os.path.basename(dest)}", flush=True)
    except Exception as e:
        print(f"  [{tag}] FAILED: {str(e)[:160]}", flush=True)


def main():
    tl = BM.EX["toolate-bleed"]
    # guides
    g_thin  = build_guide(tl["word"], tl["font"], tl["style"], os.path.join(OUT,"guide_thin.png"),  rim=8)
    g_thick = build_guide(tl["word"], tl["font"], tl["style"], os.path.join(OUT,"guide_thick.png"), rim=30, rough=True)
    print(f"driving pod {POD}", flush=True)

    # 1. MEMBRANE — thick rough rim, see if the membrane bleeds
    for cn in (0.4, 0.5, 0.6):
        do(f"membrane_thick_cn{cn}", tl, g_thick, cn, 0.4)
    # 2. BACKFILL — higher-strength sweep cells (thin rim)
    for cn in (0.65, 0.8, 1.0):
        do(f"sweep_thin_cn{cn}", tl, g_thin, cn, 0.4)
    # 3. RANGE — sweet spot across materials
    for key in ("burning-flame", "thoom-shatter"):
        ex = BM.EX[key]
        g = build_guide(ex["word"], ex["font"], ex["style"], os.path.join(OUT,f"guide_{key}.png"), rim=10)
        do(f"range_{key}_cn0.5", ex, g, 0.5, 0.4)
    print("BALLOON_POD_DONE -> balloons-genai/pod/", flush=True)


if __name__ == "__main__":
    main()
