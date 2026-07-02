#!/usr/bin/env python3
"""
BLUELINE · COMPOSITE-THEN-REGEN (Tier 2 face render) — Loudon's pipeline, proven.

The shot that needs detail: design the protagonist's face with the intended EMOTION at the frame's gaze,
drop it into the action frame, then REGEN THE ENTIRE SCENE from that composite so the seam dissolves and
the whole frame reads as one coherent ink drawing — pose, identity, and expression all surviving.

Realized as two pod passes per frame, so the atlas shows the cascade side by side:
  • STAGE A (= Tier 1, the plain inpaint): InstantID-inpaint the identity head (+ emotion prompt) into the
    frame at the frame's own keypoints; Mac-side feathered composite over the original. Keeps the body
    exactly, but can show a seam at the neck/hat.  -> this IS Path B.
  • STAGE B (= Tier 2, the integrate): img2img the WHOLE composite at moderate denoise with InstantID still
    on (re-anchors identity), so the seam is redrawn away and the body is re-inked coherently. Does NOT
    bit-preserve the body — it regenerates the scene (Loudon's "regen the entire scene"). The denoise is the
    dial: too low keeps the seam, too high loses the designed face. InstantID-on widens the usable window.

Why the rough composite is safe here (unlike the cv2 paste that "looked horrible"): that paste was the final
output; here the composite is only an init image — stage B redraws over it.

Cheap proof: 1 identity x 2 frames (front, 3q_left) x a small denoise set. Reports identity-cosine for the
inpaint (A) and each integrate (B), plus the atlas original|A|B. Profile (-80) is deferred to the next run
once the denoise dial is set. Run UNDER THE COMFY VENV PYTHON (insightface). Orchestrator owns the pod.
"""
import argparse, json, sys, time
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "m3-warped-noise"))
from m3_pod_render import Pod

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
STEPS, CFG = 28, 6.0
STYLE = json.load(open(HERE / "locked-style.json"))
STYLE_TXT = STYLE["style"]
NEG = "two heads, deformed face, extra fingers, pasted face, seam, cutout, " + STYLE["neg_extra"]
KIT = ("a figure in a dark fedora, a long open duster coat over a horizontally striped shirt, baggy "
       "functional japanese workman trousers")

def make_head_mask(bbox, size, pad_x=0.55, pad_up=0.9, pad_dn=0.55, blur=24):
    W, H = size; x0, y0, x1, y1 = bbox; fw, fh = x1 - x0, y1 - y0
    ex0 = max(0, int(x0 - pad_x*fw)); ex1 = min(W, int(x1 + pad_x*fw))
    ey0 = max(0, int(y0 - pad_up*fh)); ey1 = min(H, int(y1 + pad_dn*fh))
    m = Image.new("L", (W, H), 0); ImageDraw.Draw(m).ellipse([ex0, ey0, ex1, ey1], fill=255)
    return m.filter(ImageFilter.GaussianBlur(blur))

def g_inpaint(prompt, ref, frame, mask, prefix, seed, weight, end_at, denoise):
    return {
      "ckpt":{"class_type":"CheckpointLoaderSimple","inputs":{"ckpt_name":CKPT}},
      "idload":{"class_type":"InstantIDModelLoader","inputs":{"instantid_file":"ip-adapter.bin"}},
      "faces":{"class_type":"InstantIDFaceAnalysis","inputs":{"provider":"CPU"}},
      "cnet":{"class_type":"ControlNetLoader","inputs":{"control_net_name":CN_NAME}},
      "ref":{"class_type":"LoadImage","inputs":{"image":ref}},
      "frm":{"class_type":"LoadImage","inputs":{"image":frame}},
      "mimg":{"class_type":"LoadImage","inputs":{"image":mask}},
      "mask":{"class_type":"ImageToMask","inputs":{"image":["mimg",0],"channel":"red"}},
      "pos":{"class_type":"CLIPTextEncode","inputs":{"text":prompt,"clip":["ckpt",1]}},
      "neg":{"class_type":"CLIPTextEncode","inputs":{"text":NEG,"clip":["ckpt",1]}},
      "apply":{"class_type":"ApplyInstantID","inputs":{"instantid":["idload",0],"insightface":["faces",0],
              "control_net":["cnet",0],"image":["ref",0],"model":["ckpt",0],"positive":["pos",0],
              "negative":["neg",0],"weight":weight,"start_at":0.0,"end_at":end_at,"image_kps":["frm",0],"mask":["mask",0]}},
      "enc":{"class_type":"VAEEncode","inputs":{"pixels":["frm",0],"vae":["ckpt",2]}},
      "setm":{"class_type":"SetLatentNoiseMask","inputs":{"samples":["enc",0],"mask":["mask",0]}},
      "samp":{"class_type":"KSampler","inputs":{"model":["apply",0],"positive":["apply",1],"negative":["apply",2],
              "latent_image":["setm",0],"seed":seed,"steps":STEPS,"cfg":CFG,"sampler_name":"dpmpp_2m","scheduler":"karras","denoise":denoise}},
      "dec":{"class_type":"VAEDecode","inputs":{"samples":["samp",0],"vae":["ckpt",2]}},
      "save":{"class_type":"SaveImage","inputs":{"filename_prefix":prefix,"images":["dec",0]}},
    }

def g_integrate(prompt, ref, init, prefix, seed, weight, end_at, denoise):
    # img2img over the WHOLE composite (no mask) with InstantID still anchoring identity
    return {
      "ckpt":{"class_type":"CheckpointLoaderSimple","inputs":{"ckpt_name":CKPT}},
      "idload":{"class_type":"InstantIDModelLoader","inputs":{"instantid_file":"ip-adapter.bin"}},
      "faces":{"class_type":"InstantIDFaceAnalysis","inputs":{"provider":"CPU"}},
      "cnet":{"class_type":"ControlNetLoader","inputs":{"control_net_name":CN_NAME}},
      "ref":{"class_type":"LoadImage","inputs":{"image":ref}},
      "init":{"class_type":"LoadImage","inputs":{"image":init}},
      "pos":{"class_type":"CLIPTextEncode","inputs":{"text":prompt,"clip":["ckpt",1]}},
      "neg":{"class_type":"CLIPTextEncode","inputs":{"text":NEG,"clip":["ckpt",1]}},
      "apply":{"class_type":"ApplyInstantID","inputs":{"instantid":["idload",0],"insightface":["faces",0],
              "control_net":["cnet",0],"image":["ref",0],"model":["ckpt",0],"positive":["pos",0],
              "negative":["neg",0],"weight":weight,"start_at":0.0,"end_at":end_at,"image_kps":["init",0]}},
      "enc":{"class_type":"VAEEncode","inputs":{"pixels":["init",0],"vae":["ckpt",2]}},
      "samp":{"class_type":"KSampler","inputs":{"model":["apply",0],"positive":["apply",1],"negative":["apply",2],
              "latent_image":["enc",0],"seed":seed,"steps":STEPS,"cfg":CFG,"sampler_name":"dpmpp_2m","scheduler":"karras","denoise":denoise}},
      "dec":{"class_type":"VAEDecode","inputs":{"samples":["samp",0],"vae":["ckpt",2]}},
      "save":{"class_type":"SaveImage","inputs":{"filename_prefix":prefix,"images":["dec",0]}},
    }

def detector():
    from insightface.app import FaceAnalysis
    app = FaceAnalysis(name="buffalo_l", providers=["CPUExecutionProvider"]); app.prepare(ctx_id=-1, det_size=(640,640)); return app

def emb(app, png):
    img = np.asarray(Image.open(png).convert("RGB"))[:,:,::-1].copy(); fs = app.get(img)
    if not fs: return None
    return max(fs, key=lambda x:x.det_score).normed_embedding

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pod", default=None)
    ap.add_argument("--ref", default="identity-candidates/3_gaunt_man.png")
    ap.add_argument("--frames-dir", default="face-slot")
    ap.add_argument("--frames", default="front,3q_left")
    ap.add_argument("--emotion", default="a hard wary intense expression, brow tight, eyes narrowed")
    ap.add_argument("--denoise", default="0.45,0.6", help="comma list of integrate-stage denoise values to compare")
    ap.add_argument("--inpaint-denoise", type=float, default=0.85)
    ap.add_argument("--weight", type=float, default=0.8)
    ap.add_argument("--end-at", type=float, default=0.85)
    ap.add_argument("--out", default="composite-regen")
    ap.add_argument("--seed", type=int, default=9100)
    a = ap.parse_args()

    ref_path = (HERE / a.ref).resolve()
    if not ref_path.exists(): sys.exit(f"identity reference not found: {ref_path}")
    fdir = HERE / a.frames_dir; out = HERE / a.out; out.mkdir(parents=True, exist_ok=True)
    denoises = [float(x) for x in a.denoise.split(",")]
    frames = a.frames.split(",")
    pid = read_pod_id(a.pod)
    pod = Pod(pid)
    print(f"pod {pid} | ref {a.ref} | frames {frames} | emotion '{a.emotion}' | integrate-denoise {denoises}")
    if not pod.alive(): sys.exit(f"pod {pid} not reachable")
    time.sleep(10)

    app = detector()
    ref_up = pod.upload(str(ref_path)); ref_emb = emb(app, str(ref_path))
    print(f"  ref uploaded; ref face {'detected' if ref_emb is not None else 'NOT detected by buffalo_l (antelopev2 stronger)'}")
    def cos(png):
        e = emb(app, png); return None if (e is None or ref_emb is None) else round(float(np.dot(ref_emb, e)), 3)

    atlas_cells = []  # (label, png, cosine)
    for fi, tag in enumerate(frames):
        frame_path = fdir / f"{tag}.png"; tokf = fdir / f"{tag}.token.json"
        if not frame_path.exists() or not tokf.exists(): print(f"  [skip] {tag}"); continue
        tok = json.load(open(tokf))
        if not tok.get("bbox"): print(f"  [skip] {tag}: no bbox"); continue
        orig = Image.open(frame_path).convert("RGB"); size = orig.size
        mask_l = make_head_mask(tok["bbox"], size)
        mpath = out / f"{tag}_mask.png"; mask_l.convert("RGB").save(mpath)
        frame_up = pod.upload(str(frame_path)); mask_up = pod.upload(str(mpath))
        face_prompt = f"{KIT}, the face clearly visible, {a.emotion}, {STYLE_TXT}"

        # STAGE A — inpaint identity head (+emotion) -> Mac composite over original  (= Path B output)
        wfa = g_inpaint(face_prompt, ref_up, frame_up, mask_up, f"crA_{tag}", a.seed+fi, a.weight, a.end_at, a.inpaint_denoise)
        ja = pod.submit(wfa); ha = pod.wait(ja, timeout=600)
        if ha.get("status",{}).get("status_str") != "success":
            print(f"  [{tag}] STAGE A failed: {json.dumps(ha.get('status',{}))[:200]}"); continue
        rawA = pod.fetch(ha, str(out / f"{tag}_A_raw.png"))
        compA = Image.composite(Image.open(rawA).convert("RGB").resize(size), orig, mask_l)
        pA = out / f"{tag}_A_inpaint.png"; compA.save(pA)
        cA = cos(str(pA)); print(f"  [{tag}] A inpaint done  identity_cos={cA}")
        atlas_cells += [(f"orig:{tag}", str(frame_path), None), (f"A/inpaint:{tag}", str(pA), cA)]

        # STAGE B — integrate: img2img the whole composite at each denoise, InstantID anchoring identity
        compA_up = pod.upload(str(pA))
        for dn in denoises:
            wfb = g_integrate(face_prompt, ref_up, compA_up, f"crB_{tag}_{int(dn*100)}", a.seed+fi+700, a.weight, a.end_at, dn)
            jb = pod.submit(wfb); hb = pod.wait(jb, timeout=600)
            if hb.get("status",{}).get("status_str") != "success":
                print(f"  [{tag}] STAGE B dn={dn} failed: {json.dumps(hb.get('status',{}))[:200]}"); continue
            pB = out / f"{tag}_B_integrate_dn{int(dn*100)}.png"
            pod.fetch(hb, str(pB)); cB = cos(str(pB))
            print(f"  [{tag}] B integrate dn={dn} done  identity_cos={cB}")
            atlas_cells.append((f"B/dn{dn}:{tag}", str(pB), cB))

    # atlas
    try:
        cols = 4; tw = 220; th = int(tw*1216/832); pad = 34
        n = len(atlas_cells); rows_n = (n+cols-1)//cols
        sheet = Image.new("RGB",(cols*tw, rows_n*(th+pad)+pad),(12,13,16)); dr = ImageDraw.Draw(sheet)
        for k,(lab,png,c) in enumerate(atlas_cells):
            cc,rr = k%cols, k//cols; x,y = cc*tw, rr*(th+pad)+pad
            if png and Path(png).exists(): sheet.paste(Image.open(png).convert("RGB").resize((tw,th)),(x,y))
            dr.text((x+4,y-26), lab, fill=(232,184,74))
            if c is not None: dr.text((x+4,y-13), f"id={c}", fill=(0,255,102))
        sheet.save(HERE/"composite-regen-atlas.png"); print("  atlas -> composite-regen-atlas.png")
    except Exception as e:
        print(f"  [atlas] skipped: {repr(e)[:120]}")
    print("COMPOSITE_REGEN_DONE", json.dumps([(l,c) for l,_,c in atlas_cells]))

if __name__ == "__main__":
    main()
