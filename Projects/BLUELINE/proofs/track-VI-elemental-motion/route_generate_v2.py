"""ROUTE B v2 — GENERATE AS LAYERS under SHARED CONDITIONING (proven FLUX-union pod).
Both the clouds pass and the ridge pass condition on the SAME authored DEPTH map + the SAME
seed, so the sheets register as one coherent scene (naive B's fix). Then re-ink each layer
locally with SDXL (FLUX coherence + pen-flow ink) and stack. Needs a ready pod (lib/pod.py --up)."""
import os, sys, numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, os.path.join(HERE, "lib"))
import podcomfy as PC, fluxcn as FX, comfy, layers as LZ, stack as ST
from PIL import Image

PL = os.path.join(HERE, "plates"); RA = os.path.join(HERE, "report-assets")
SEED = 8400; W, H = 832, 1216

clouds_p = ("dramatic billowing storm clouds filling the sky, the lower hill area left empty, "
            "ink illustration, stark high contrast black and white, rough white paper, lots of white space")
ridge_p = ("a solid black silhouette of a bare windswept hill ridge with a tiny lone figure on the "
           "crest, solid filled black ink shape, the sky above empty white, high contrast, no clouds")

# --- POD: two FLUX passes sharing one depth map + seed -----------------------
depth_n = PC.upload(os.path.join(PL, "structure_depth.png"))
print("[B2] FLUX clouds pass (depth-shared)...", flush=True)
PC.run(FX.flux_cn(clouds_p, SEED, W, H, prefix="b2clouds",
        controls=[{"type": "depth", "image": depth_n, "strength": 0.40, "end": 0.8}]),
       os.path.join(PL, "gen_v2_clouds_flux.png"))
print("[B2] FLUX ridge pass (depth-shared)...", flush=True)
PC.run(FX.flux_cn(ridge_p, SEED, W, H, prefix="b2ridge",
        controls=[{"type": "depth", "image": depth_n, "strength": 0.65, "end": 0.85}]),
       os.path.join(PL, "gen_v2_ridge_flux.png"))

# --- LOCAL: re-ink each layer to pen-flow (SDXL img2img) ----------------------
print("[B2] re-ink layers locally (SDXL)...", flush=True)
comfy.img2img(os.path.join(PL, "gen_v2_clouds_flux.png"),
              "dramatic billowing storm clouds, " + comfy.SUBSTRATE,
              os.path.join(PL, "gen_v2_clouds.png"), seed=SEED, denoise=0.6)
comfy.img2img(os.path.join(PL, "gen_v2_ridge_flux.png"),
              "a solid black hill ridge silhouette with a tiny figure on the crest, " + comfy.SUBSTRATE,
              os.path.join(PL, "gen_v2_ridge.png"), seed=SEED, denoise=0.55)


def build(clouds_path, ridge_path, name):
    ridge_rgb = LZ.load_rgb(ridge_path); clouds_rgb = LZ.load_rgb(clouds_path)
    ridge_mask = LZ.solid_silhouette(ridge_rgb, dark=0.5, touch="bottom", dilate=2)
    front = LZ.rgba(ridge_rgb, LZ.sharpen_alpha(ridge_mask, 0.8))
    back = LZ.rgba(clouds_rgb, np.ones((H, W), np.float32))
    specs = [{"rgba": back, "field": "sky", "amp": 1.6, "label": f"back · clouds ({name})"},
             {"rgba": front, "field": None, "label": f"front · ridge ({name})"}]
    out = os.path.join(HERE, "renders", f"sky_generate_v2_{name}"); os.makedirs(out, exist_ok=True)
    frames = ST.render_stack(specs, frames=60)
    ST.write_loop(frames, out, f"sky_generate_v2_{name}")
    ST.matte_board(specs, os.path.join(RA, f"sky_generate_v2_{name}_mattes.png"),
                   labels=[s["label"] for s in specs])
    Image.fromarray((np.clip(frames[0], 0, 1) * 255).astype(np.uint8)).save(os.path.join(out, "still.png"))
    print(f"  built {name}: ridge_cover={100*ridge_mask.mean():.1f}% -> {out}", flush=True)


build(os.path.join(PL, "gen_v2_clouds_flux.png"), os.path.join(PL, "gen_v2_ridge_flux.png"), "flux")
build(os.path.join(PL, "gen_v2_clouds.png"), os.path.join(PL, "gen_v2_ridge.png"), "ink")
print("ROUTE_B2_DONE", flush=True)
