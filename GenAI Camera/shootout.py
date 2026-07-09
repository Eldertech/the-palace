#!/usr/bin/env python3
"""
Composite-mask shootout: SEGMENT vs INPAINT, for placing pose-generated (clothed) figures over a
generated environment without clipping the cloth.  Same env base, pose plates, prompts, seed — fair.

  SEGMENT  — generate each figure standalone (pose-conditioned), rembg the figure off its hallucinated
             background so the mask follows the CLOTHING, composite over the env.
  INPAINT  — generate the env, then inpaint each figure INTO it (VAEEncodeForInpaint + pose), so the
             cloth grows within a generous region and blends with the env (no hard mask edge).

Run:  _tools/ComfyUI/venv/bin/python3 shootout.py
Writes renders/render_012 (segment) + render_013 (inpaint) and appends both to the scroll.
"""
import os, io, json, datetime, shutil
import genai_camera as g
from PIL import Image, ImageFilter

DIR = g.DIR; RDIR = os.path.join(DIR, "renders"); SEED = 21

def to_pil(b): return Image.open(io.BytesIO(b)).convert("RGB")
def save_tmp(im, name):
    p = os.path.join(DIR, name); im.save(p); return p

def inpaint_pose_graph(base_fn, mask_fn, pose_fn, prompt, seed):
    return {
      "ckpt": {"class_type":"CheckpointLoaderSimple","inputs":{"ckpt_name":g.CKPT}},
      "lora": {"class_type":"LoraLoader","inputs":{"model":["ckpt",0],"clip":["ckpt",1],"lora_name":g.LORA,"strength_model":1.0,"strength_clip":1.0}},
      "pos":  {"class_type":"CLIPTextEncode","inputs":{"text":f"{prompt}, {g.PENFLOW}","clip":["lora",1]}},
      "neg":  {"class_type":"CLIPTextEncode","inputs":{"text":g.NEG,"clip":["lora",1]}},
      "init": {"class_type":"LoadImage","inputs":{"image":base_fn}},
      "mask": {"class_type":"LoadImageMask","inputs":{"image":mask_fn,"channel":"red"}},
      "enc":  {"class_type":"VAEEncodeForInpaint","inputs":{"pixels":["init",0],"vae":["ckpt",2],"mask":["mask",0],"grow_mask_by":16}},
      "cnl":  {"class_type":"ControlNetLoader","inputs":{"control_net_name":g.CN["pose"]}},
      "pim":  {"class_type":"LoadImage","inputs":{"image":pose_fn}},
      "ap":   {"class_type":"ControlNetApplyAdvanced","inputs":{"positive":["pos",0],"negative":["neg",0],"control_net":["cnl",0],"image":["pim",0],"strength":0.65,"start_percent":0.0,"end_percent":0.8,"vae":["ckpt",2]}},
      "samp": {"class_type":"KSampler","inputs":{"model":["lora",0],"positive":["ap",0],"negative":["ap",1],"latent_image":["enc",0],"seed":seed,"steps":8,"cfg":1.8,"sampler_name":"euler","scheduler":"sgm_uniform","denoise":1.0}},
      "dec":  {"class_type":"VAEDecode","inputs":{"samples":["samp",0],"vae":["ckpt",2]}},
      "save": {"class_type":"SaveImage","inputs":{"filename_prefix":"inp","images":["dec",0]}},
    }

def scroll_append(path_png, n, note):
    dst = os.path.join(RDIR, f"render_{n:03d}.png"); shutil.copyfile(path_png, dst)
    for s in ("env",):
        for tgt, src in (("beauty", f"beauty_{s}.png"), ("depth", f"depth_{s}.png")):
            sp = os.path.join(DIR, src)
            if os.path.exists(sp): shutil.copyfile(sp, os.path.join(RDIR, f"render_{n:03d}_{tgt}.png"))
    g.append_manifest({"n":n, "ts":datetime.datetime.now().strftime("%Y-%m-%d %H:%M"),
                       "prompt":"segment vs inpaint shootout", "denoise":1.0, "seed":SEED, "dt":0, "note":note})

def main():
    layers = json.load(open(os.path.join(DIR,"layers.json")))
    env, figs = layers[0], layers[1:]

    # shared env base
    env_im,_ = g.generate(f"{DIR}/beauty_env.png", f"{DIR}/depth_env.png", None, env["prompt"], 0.9, SEED, False, ["depth","canny"])
    env_im = env_im.convert("RGB")

    # shared standalone figure gens (pose-conditioned)
    fig_gens = {}
    for ly in figs:
        nm = ly["name"]
        im,_ = g.generate(f"{DIR}/beauty_{nm}.png", f"{DIR}/depth_{nm}.png", f"{DIR}/openpose_{nm}.png",
                          ly["prompt"], 0.97, SEED, False, ["pose"])
        fig_gens[nm] = im.convert("RGB")

    # ---------- SEGMENT ----------
    from rembg import remove, new_session
    sess = new_session("u2net")
    seg = env_im.copy().convert("RGBA")
    for ly in figs:
        cut = remove(fig_gens[ly["name"]], session=sess)      # RGBA, bg removed -> follows the cloth
        seg = Image.alpha_composite(seg, cut)
    seg_path = os.path.join(DIR, "seg_composite.png"); seg.convert("RGB").save(seg_path)
    scroll_append(seg_path, 12, "SEGMENT: figure generated standalone (pose) -> rembg cutout follows the cloth -> composited over env")

    # ---------- INPAINT ----------
    inp = env_im.copy()
    for ly in figs:
        nm = ly["name"]
        beauty = Image.open(f"{DIR}/beauty_{nm}.png")
        region = beauty.split()[-1] if beauty.mode == "RGBA" else Image.new("L", beauty.size, 255)
        region = region.filter(ImageFilter.MaxFilter(81)).convert("RGB")   # generous paint region
        bfn = g.upload(save_tmp(inp, "_inp_base.png"))
        mfn = g.upload(save_tmp(region, "_inp_mask.png"))
        pfn = g.upload(f"{DIR}/openpose_{nm}.png")
        b,_ = g.run_graph(inpaint_pose_graph(bfn, mfn, pfn, ly["prompt"], SEED))
        inp = to_pil(b)
    inp_path = os.path.join(DIR, "inpaint_composite.png"); inp.save(inp_path)
    scroll_append(inp_path, 13, "INPAINT: env base, each figure inpainted in (pose-conditioned) so cloth grows in-context and blends, no hard mask")

    print("SHOOTOUT DONE -> render_012 (segment), render_013 (inpaint)")

if __name__ == "__main__":
    main()
