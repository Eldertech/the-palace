#!/usr/bin/env python3
"""
BLUELINE · INSTANTID GAZE RENDER — bake ONE identity into the locked `pen-flow` look across the verified
gaze rig, gaze CONTROLLED by face keypoints (not the prompt), then VERIFY by measurement.

The fix for the two open failures (cv2 paste-swap looked horrible; prompt-only gaze collapses to frontal):
InstantID conditions on a reference identity (the `image`) AND a face-keypoint layout (the `image_kps`),
so identity is baked at generation and gaze is an INPUT. The keypoint references are BLUELINE's own
face-slot set — already a verified-gaze rig (insightface-measured: profile_left yaw -80.6 deg ... 3q_right
+30.3 deg ... front +7.7 deg), which is exactly why this beats the prompt (the prompt-only span collapsed
to -8.5..+22 deg regardless of phrasing — a seed lottery).

Run UNDER THE COMFY VENV PYTHON (needs insightface for the verify step). The orchestrator owns the pod
lifecycle and calls this with sys.executable == that venv python:
  _tools/ComfyUI/venv/bin/python instantid_orchestrator.py --render-args "--ref face-swap/target.png"
Standalone (pod already up):
  _tools/ComfyUI/venv/bin/python instantid_gaze_render.py --pod <id> --ref face-swap/target.png

Reuses the hardened m3_pod_render.Pod transport (curl multipart upload + inline-JSON submit, both retried
against the RunPod proxy WAF). Does NOT create or terminate the pod (the orchestrator owns teardown).
"""
import argparse, json, os, ssl, sys, time
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "m3-warped-noise"))
from m3_pod_render import Pod  # proven transport: upload/submit/wait/fetch, curl-hardened

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
from agent_ns import read_pod_id, SLUG

CKPT = "sd_xl_base_1.0.safetensors"
CN_NAME = "instantid-controlnet.safetensors"
W, H, STEPS, CFG = 832, 1216, 28, 6.0
STYLE = json.load(open(HERE / "locked-style.json"))
STYLE_TXT = STYLE["style"]
NEG = "two heads, deformed face, extra fingers, " + STYLE["neg_extra"]
# the character body/kit (face now comes from the InstantID reference, so no placeholder-face phrase)
KIT = ("a figure in a dark fedora, a long open duster coat over a horizontally striped shirt, baggy "
       "functional japanese workman trousers, normal human hands holding a folding pocketknife and a hand towel")

# the verified-gaze rig: face-slot reference PNGs, used as image_kps (InstantID extracts the 5 kps from each).
# intended_yaw is the headline axis; the actual measured pose of each ref is read from its token at runtime.
GAZE = [
    ("front",        "head facing straight toward the viewer"),
    ("3q_left",      "head turned three-quarters to the left"),
    ("3q_right",     "head turned three-quarters to the right"),
    ("profile_left", "head in full left profile"),
    ("up",           "head tilted upward, looking up"),
    ("down",         "head tilted downward, looking down"),
]

def graph(prompt, ref_name, kps_name, prefix, seed, weight, start_at, end_at):
    return {
      "ckpt":  {"class_type":"CheckpointLoaderSimple","inputs":{"ckpt_name":CKPT}},
      "idload":{"class_type":"InstantIDModelLoader","inputs":{"instantid_file":"ip-adapter.bin"}},
      "faces": {"class_type":"InstantIDFaceAnalysis","inputs":{"provider":"CPU"}},
      "cnet":  {"class_type":"ControlNetLoader","inputs":{"control_net_name":CN_NAME}},
      "ref":   {"class_type":"LoadImage","inputs":{"image":ref_name}},
      "kps":   {"class_type":"LoadImage","inputs":{"image":kps_name}},
      "pos":   {"class_type":"CLIPTextEncode","inputs":{"text":prompt,"clip":["ckpt",1]}},
      "neg":   {"class_type":"CLIPTextEncode","inputs":{"text":NEG,"clip":["ckpt",1]}},
      "apply": {"class_type":"ApplyInstantID","inputs":{
                  "instantid":["idload",0],"insightface":["faces",0],"control_net":["cnet",0],
                  "image":["ref",0],"model":["ckpt",0],"positive":["pos",0],"negative":["neg",0],
                  "weight":weight,"start_at":start_at,"end_at":end_at,"image_kps":["kps",0]}},
      "latent":{"class_type":"EmptyLatentImage","inputs":{"width":W,"height":H,"batch_size":1}},
      "samp":  {"class_type":"KSampler","inputs":{"model":["apply",0],"positive":["apply",1],"negative":["apply",2],
                  "latent_image":["latent",0],"seed":seed,"steps":STEPS,"cfg":CFG,
                  "sampler_name":"dpmpp_2m","scheduler":"karras","denoise":1.0}},
      "dec":   {"class_type":"VAEDecode","inputs":{"samples":["samp",0],"vae":["ckpt",2]}},
      "save":  {"class_type":"SaveImage","inputs":{"filename_prefix":prefix,"images":["dec",0]}},
    }

def detector():
    from insightface.app import FaceAnalysis
    app = FaceAnalysis(name="buffalo_l", providers=["CPUExecutionProvider"])
    app.prepare(ctx_id=-1, det_size=(640, 640)); return app

def measure(app, png):
    import numpy as np
    from PIL import Image
    img = np.asarray(Image.open(png).convert("RGB"))[:, :, ::-1].copy()
    faces = app.get(img)
    if not faces: return None
    f = max(faces, key=lambda x: x.det_score)
    return {"det_score": float(f.det_score),
            "pose": [round(float(v), 1) for v in (f.pose.tolist() if getattr(f, "pose", None) is not None else [])],
            "embed": f.normed_embedding}

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pod", default=None)
    ap.add_argument("--ref", default="face-swap/target.png", help="reference identity face (relative to here)")
    ap.add_argument("--out", default="instantid")
    ap.add_argument("--weight", type=float, default=0.65, help="InstantID strength (lower lets the ink style breathe)")
    ap.add_argument("--start-at", type=float, default=0.0)
    ap.add_argument("--end-at", type=float, default=0.70, help="<1.0 hands late steps back to the style")
    ap.add_argument("--seed", type=int, default=6600)
    a = ap.parse_args()

    ref_path = (HERE / a.ref).resolve()
    if not ref_path.exists(): sys.exit(f"reference identity not found: {ref_path}")
    out = (HERE / a.out); out.mkdir(parents=True, exist_ok=True)
    pid = read_pod_id(a.pod)
    pod = Pod(pid)
    print(f"pod {pid} | base {pod.B} | ref {a.ref} | weight {a.weight} end_at {a.end_at}")
    if not pod.alive(): sys.exit(f"pod {pid} not reachable at {pod.B}/system_stats")
    time.sleep(10)  # settle: /upload/image lags /object_info on a fresh boot

    ref_up = pod.upload(str(ref_path)); print(f"  uploaded ref -> {ref_up}")
    app = detector()
    ref_m = measure(app, str(ref_path))
    if ref_m is None: sys.exit("insightface found NO face in the reference identity — InstantID cannot run")
    ref_embed = ref_m["embed"]

    rows = []
    for i, (tag, intended) in enumerate(GAZE):
        kps_path = HERE / "face-slot" / f"{tag}.png"
        if not kps_path.exists(): print(f"  [skip] missing pose ref {kps_path}"); continue
        kps_up = pod.upload(str(kps_path))
        ref_tok = {}
        tokf = HERE / "face-slot" / f"{tag}.token.json"
        if tokf.exists(): ref_tok = json.load(open(tokf))
        prompt = f"{KIT}, {intended}, medium shot from the waist up, the face clearly visible, {STYLE_TXT}"
        wf = graph(prompt, ref_up, kps_up, f"iid_{tag}", a.seed + i, a.weight, a.start_at, a.end_at)
        t0 = time.time(); jid = pod.submit(wf)
        print(f"  [{tag}] submitted {jid} (kps={tag}, ref_yaw={ref_tok.get('pose',['?','?'])[1] if ref_tok.get('pose') else '?'})")
        hist = pod.wait(jid, timeout=600)
        st = hist.get("status", {}).get("status_str")
        if st != "success":
            print(f"  [{tag}] RENDER FAILED: {json.dumps(hist.get('status',{}))[:300]}"); rows.append((tag, None, None, intended, ref_tok)); continue
        dest = pod.fetch(hist, str(out / f"{tag}.png"))
        res_m = measure(app, dest)
        cos = None
        if res_m is not None:
            import numpy as np
            cos = round(float(np.dot(ref_embed, res_m["embed"])), 3)
        json.dump({"tag": tag, "intended": intended, "ref_pose": ref_tok.get("pose"),
                   "result_detected": res_m is not None,
                   "result_pose": (res_m or {}).get("pose"), "identity_cos": cos,
                   "weight": a.weight, "end_at": a.end_at},
                  open(out / f"{tag}.token.json", "w"), indent=2)
        rows.append((tag, dest, res_m, intended, ref_tok))
        ry = (res_m or {}).get("pose", ["?", "?", "?"])
        print(f"  [{tag}] SAVED {os.path.basename(dest)} ({time.time()-t0:.0f}s) "
              f"result_pose(p,y,r)={ry if res_m else 'NO-DETECT'} identity_cos={cos}")

    # contact-sheet atlas: ref + each gaze result, labelled with measured yaw + identity cosine
    try:
        from PIL import Image, ImageDraw
        cols = 4; tw = 230; th = int(tw * H / W); pad = 34
        cells = [("REF", str(ref_path), ref_m, "reference", {})] + rows
        n = len(cells); rows_n = (n + cols - 1) // cols
        sheet = Image.new("RGB", (cols * tw, rows_n * (th + pad) + pad), (12, 13, 16)); dr = ImageDraw.Draw(sheet)
        for k, (tag, png, m, intended, reftok) in enumerate(cells):
            c, r = k % cols, k // cols; x, y = c * tw, r * (th + pad) + pad
            if png and Path(png).exists():
                sheet.paste(Image.open(png).convert("RGB").resize((tw, th)), (x, y))
            yaw = m["pose"][1] if (m and m.get("pose")) else None
            cos = ""
            if tag not in ("REF",) and m is not None:
                import numpy as np
                cos = f"  id={round(float(np.dot(ref_embed, m['embed'])),3)}"
            dr.text((x + 4, y - 28), tag, fill=(232, 184, 74))
            lab = (f"meas-yaw={yaw}{cos}" if m else "NO-DETECT")
            dr.text((x + 4, y - 15), lab, fill=(0, 255, 102) if m else (255, 80, 80))
        sheet.save(HERE / "instantid-atlas.png")
        print(f"  atlas -> instantid-atlas.png")
    except Exception as e:
        print(f"  [atlas] skipped: {repr(e)[:120]}")

    det = sum(1 for _, _, m, _, _ in rows if m is not None)
    coss = [round(float(__import__('numpy').dot(ref_embed, m['embed'])), 3) for _, _, m, _, _ in rows if m is not None]
    print(f"INSTANTID_GAZE_DONE rendered {len([r for r in rows if r[1]])}/{len(rows)}  "
          f"face-detected {det}  identity_cos={coss}")

if __name__ == "__main__":
    main()
