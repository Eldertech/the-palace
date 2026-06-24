#!/usr/bin/env python3
"""
BLUELINE · INSTANTID FACE-INPAINT — Loudon's pipeline: keep the SELECTED action frame (the body/pose is the
asset), and replace ONLY the head with a consistent protagonist identity, generated AT the frame's own face
angle (read from the frame's openpose/face-analysis token). On-demand, per frame.

Why this beats the two dead ends:
  • cv2 paste-swap "looked horrible" — it composited a foreign face onto the ink. Here the face is INPAINTED:
    regenerated in the frame's own ink/lighting, conditioned on the frame's own face keypoints (image_kps),
    so it lands at the right angle and reads as drawn, not pasted.
  • prompt-only gaze collapses — here gaze is NOT prompted; it comes from the frame's keypoints.
Identity stays consistent across frames because every inpaint uses the SAME identity reference (--ref).

Body preservation is exact: the pod regenerates the masked head; this script then feathered-composites that
head back over the UNTOUCHED original frame Mac-side, so every pixel outside the head is bit-identical.

Run UNDER THE COMFY VENV PYTHON (insightface for verify). Orchestrator owns the pod; this does not.
  _tools/ComfyUI/venv/bin/python instantid_orchestrator.py --render-args "--ref <id> --inpaint"   (see note)
  _tools/ComfyUI/venv/bin/python instantid_inpaint_render.py --pod <id> --ref identity-candidates/3_gaunt_man.png
"""
import argparse, json, os, sys, time
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "m3-warped-noise"))
from m3_pod_render import Pod  # proven curl-hardened transport

CKPT = "sd_xl_base_1.0.safetensors"
CN_NAME = "instantid-controlnet.safetensors"
STEPS, CFG = 28, 6.0
STYLE = json.load(open(HERE / "locked-style.json"))
STYLE_TXT = STYLE["style"]
NEG = "two heads, deformed face, extra fingers, pasted face, " + STYLE["neg_extra"]
KIT = ("a figure in a dark fedora, a long open duster coat over a horizontally striped shirt, baggy "
       "functional japanese workman trousers")

# proof bed: the face-slot frames — real pen-flow action frames with VERIFIED head poses + detected bboxes.
FRAMES = [
    ("front",        "head facing straight toward the viewer"),
    ("3q_left",      "head turned three-quarters to the left"),
    ("3q_right",     "head turned three-quarters to the right"),
    ("profile_left", "head in full left profile"),
    ("up",           "head tilted upward, looking up"),
    ("down",         "head tilted downward, looking down"),
]

def make_head_mask(bbox, size, pad_x=0.55, pad_up=0.9, pad_dn=0.55, blur=24):
    """Feathered white ellipse over the head, padded generously from the detected face bbox (hair+jaw)."""
    W, H = size; x0, y0, x1, y1 = bbox; fw, fh = x1 - x0, y1 - y0
    ex0 = max(0, int(x0 - pad_x * fw)); ex1 = min(W, int(x1 + pad_x * fw))
    ey0 = max(0, int(y0 - pad_up * fh)); ey1 = min(H, int(y1 + pad_dn * fh))
    m = Image.new("L", (W, H), 0); ImageDraw.Draw(m).ellipse([ex0, ey0, ex1, ey1], fill=255)
    return m.filter(ImageFilter.GaussianBlur(blur)), (ex0, ey0, ex1, ey1)

def graph(prompt, ref_name, frame_name, mask_name, prefix, seed, weight, start_at, end_at, denoise):
    return {
      "ckpt":  {"class_type":"CheckpointLoaderSimple","inputs":{"ckpt_name":CKPT}},
      "idload":{"class_type":"InstantIDModelLoader","inputs":{"instantid_file":"ip-adapter.bin"}},
      "faces": {"class_type":"InstantIDFaceAnalysis","inputs":{"provider":"CPU"}},
      "cnet":  {"class_type":"ControlNetLoader","inputs":{"control_net_name":CN_NAME}},
      "ref":   {"class_type":"LoadImage","inputs":{"image":ref_name}},
      "frame": {"class_type":"LoadImage","inputs":{"image":frame_name}},
      "maskimg":{"class_type":"LoadImage","inputs":{"image":mask_name}},
      "mask":  {"class_type":"ImageToMask","inputs":{"image":["maskimg",0],"channel":"red"}},
      "pos":   {"class_type":"CLIPTextEncode","inputs":{"text":prompt,"clip":["ckpt",1]}},
      "neg":   {"class_type":"CLIPTextEncode","inputs":{"text":NEG,"clip":["ckpt",1]}},
      "apply": {"class_type":"ApplyInstantID","inputs":{
                  "instantid":["idload",0],"insightface":["faces",0],"control_net":["cnet",0],
                  "image":["ref",0],"model":["ckpt",0],"positive":["pos",0],"negative":["neg",0],
                  "weight":weight,"start_at":start_at,"end_at":end_at,
                  "image_kps":["frame",0],"mask":["mask",0]}},
      "enc":   {"class_type":"VAEEncode","inputs":{"pixels":["frame",0],"vae":["ckpt",2]}},
      "setm":  {"class_type":"SetLatentNoiseMask","inputs":{"samples":["enc",0],"mask":["mask",0]}},
      "samp":  {"class_type":"KSampler","inputs":{"model":["apply",0],"positive":["apply",1],"negative":["apply",2],
                  "latent_image":["setm",0],"seed":seed,"steps":STEPS,"cfg":CFG,
                  "sampler_name":"dpmpp_2m","scheduler":"karras","denoise":denoise}},
      "dec":   {"class_type":"VAEDecode","inputs":{"samples":["samp",0],"vae":["ckpt",2]}},
      "save":  {"class_type":"SaveImage","inputs":{"filename_prefix":prefix,"images":["dec",0]}},
    }

def detector():
    from insightface.app import FaceAnalysis
    app = FaceAnalysis(name="buffalo_l", providers=["CPUExecutionProvider"]); app.prepare(ctx_id=-1, det_size=(640,640)); return app

def measure(app, png):
    img = np.asarray(Image.open(png).convert("RGB"))[:, :, ::-1].copy()
    faces = app.get(img)
    if not faces: return None
    f = max(faces, key=lambda x: x.det_score)
    return {"det_score": float(f.det_score),
            "pose": [round(float(v),1) for v in (f.pose.tolist() if getattr(f,"pose",None) is not None else [])],
            "embed": f.normed_embedding}

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pod", default=None)
    ap.add_argument("--ref", default="identity-candidates/3_gaunt_man.png", help="locked protagonist identity (relative to here)")
    ap.add_argument("--frames-dir", default="face-slot", help="action frames + .token.json (with detected bbox)")
    ap.add_argument("--out", default="instantid-inpaint")
    ap.add_argument("--weight", type=float, default=0.8)
    ap.add_argument("--start-at", type=float, default=0.0)
    ap.add_argument("--end-at", type=float, default=0.85)
    ap.add_argument("--denoise", type=float, default=0.85)
    ap.add_argument("--seed", type=int, default=8800)
    a = ap.parse_args()

    ref_path = (HERE / a.ref).resolve()
    if not ref_path.exists(): sys.exit(f"identity reference not found: {ref_path}")
    fdir = (HERE / a.frames_dir)
    out = (HERE / a.out); out.mkdir(parents=True, exist_ok=True)
    pid = a.pod or Path("/tmp/pod_id").read_text().strip()
    pod = Pod(pid)
    print(f"pod {pid} | base {pod.B} | ref {a.ref} | frames {a.frames_dir} | weight {a.weight} denoise {a.denoise}")
    if not pod.alive(): sys.exit(f"pod {pid} not reachable")
    time.sleep(10)

    ref_up = pod.upload(str(ref_path)); print(f"  uploaded ref -> {ref_up}")
    app = detector()
    ref_m = measure(app, str(ref_path))
    if ref_m is None:
        print("  WARNING: buffalo_l found no face in the reference (heavy ink?) — antelopev2 on the pod is stronger; continuing")
        ref_embed = None
    else:
        ref_embed = ref_m["embed"]; print(f"  ref face det_score={round(ref_m['det_score'],3)}")

    rows = []
    for i, (tag, intended) in enumerate(FRAMES):
        frame_path = fdir / f"{tag}.png"
        tokf = fdir / f"{tag}.token.json"
        if not frame_path.exists() or not tokf.exists():
            print(f"  [skip] missing {tag}"); continue
        tok = json.load(open(tokf))
        if not tok.get("bbox"):
            print(f"  [skip] {tag} has no detected bbox (can't mask the head)"); continue
        orig = Image.open(frame_path).convert("RGB"); size = orig.size
        mask_l, mbox = make_head_mask(tok["bbox"], size)
        mask_path = out / f"{tag}_mask.png"; mask_l.convert("RGB").save(mask_path)
        frame_up = pod.upload(str(frame_path)); mask_up = pod.upload(str(mask_path))
        prompt = f"{KIT}, {intended}, the face clearly visible, {STYLE_TXT}"
        wf = graph(prompt, ref_up, frame_up, mask_up, f"iidp_{tag}", a.seed+i, a.weight, a.start_at, a.end_at, a.denoise)
        t0 = time.time(); jid = pod.submit(wf)
        print(f"  [{tag}] submitted {jid} (ref_yaw={tok['pose'][1] if tok.get('pose') else '?'})")
        hist = pod.wait(jid, timeout=600)
        if hist.get("status",{}).get("status_str") != "success":
            print(f"  [{tag}] RENDER FAILED: {json.dumps(hist.get('status',{}))[:300]}"); rows.append((tag,None,None,intended,tok)); continue
        raw = pod.fetch(hist, str(out / f"{tag}_raw.png"))
        # feathered composite: new head over the UNTOUCHED original -> body bit-preserved outside the head
        res = Image.open(raw).convert("RGB").resize(size)
        m = mask_l  # 'L', feathered
        final = Image.composite(res, orig, m)
        dest = str(out / f"{tag}.png"); final.save(dest)
        # preservation check: mean abs pixel diff OUTSIDE the head (should be ~0 by construction)
        outside = (np.asarray(m) < 8)
        d_out = float(np.abs(np.asarray(final).astype(int) - np.asarray(orig).astype(int)).mean(axis=2)[outside].mean()) if outside.any() else 0.0
        res_m = measure(app, dest); cos = None
        if res_m is not None and ref_embed is not None:
            cos = round(float(np.dot(ref_embed, res_m["embed"])), 3)
        json.dump({"tag":tag,"intended":intended,"ref_pose":tok.get("pose"),"mask_box":mbox,
                   "result_detected":res_m is not None,"result_pose":(res_m or {}).get("pose"),
                   "identity_cos":cos,"outside_head_meandiff":round(d_out,2),
                   "weight":a.weight,"denoise":a.denoise}, open(out/f"{tag}.token.json","w"), indent=2)
        rows.append((tag, dest, res_m, intended, tok))
        print(f"  [{tag}] SAVED ({time.time()-t0:.0f}s) result_yaw={(res_m or {}).get('pose',['?','?','?'])[1] if res_m else 'NO-DET'} "
              f"identity_cos={cos} outside_head_diff={round(d_out,2)}")

    # atlas: original | inpainted, per frame, with identity cosine + preservation
    try:
        cols = 4; tw = 220; th = int(tw * 1216 / 832); pad = 34
        cells = []
        for tag, dest, m, intended, tok in rows:
            cells.append(("orig:"+tag, str(fdir / f"{tag}.png"), None))
            cells.append(("iid:"+tag, dest, m))
        n = len(cells); rows_n = (n + cols - 1)//cols
        sheet = Image.new("RGB",(cols*tw, rows_n*(th+pad)+pad),(12,13,16)); dr = ImageDraw.Draw(sheet)
        for k,(lab,png,m) in enumerate(cells):
            c,r = k%cols, k//cols; x,y = c*tw, r*(th+pad)+pad
            if png and Path(png).exists(): sheet.paste(Image.open(png).convert("RGB").resize((tw,th)),(x,y))
            dr.text((x+4,y-26), lab, fill=(232,184,74))
            if m is not None and ref_embed is not None:
                dr.text((x+4,y-13), f"id={round(float(np.dot(ref_embed,m['embed'])),3)}", fill=(0,255,102))
        sheet.save(HERE/"instantid-inpaint-atlas.png"); print("  atlas -> instantid-inpaint-atlas.png")
    except Exception as e:
        print(f"  [atlas] skipped: {repr(e)[:120]}")

    coss = [r[2] and ref_embed is not None and round(float(np.dot(ref_embed,r[2]['embed'])),3) for r in rows if r[2] is not None]
    print(f"INSTANTID_INPAINT_DONE rendered {len([r for r in rows if r[1]])}/{len(rows)}  identity_cos={coss}")

if __name__ == "__main__":
    main()
