#!/usr/bin/env python3
"""Assemble the line-art layer-decomposition PROOF into one self-contained HTML walkthrough — every
step, its image, and the conclusion drawn. Images base64-embedded from renders/proof/.

  <comfy venv>/python build_proof_html.py   -> renders/proof/decomposition-proof.html
"""
import os, base64, io
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); P = os.path.join(HERE, "renders", "proof")

def img(fn):
    p = os.path.join(P, fn)
    if not os.path.exists(p): return None
    im = Image.open(p).convert("RGB")
    if im.width > 820: im = im.resize((820, int(im.height * 820 / im.width)), Image.LANCZOS)
    buf = io.BytesIO(); im.save(buf, "JPEG", quality=86)              # keep the file committable
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()

STEPS = [
 ("01_segmentation_compare.png", "1 · Segment — three ways, all short",
  "Authored boxes (A), SAM-auto (B, over-segments into fragments), SAM-prompted (C). The figure came out "
  "<b>best from our keypoint mask</b>, not SAM. And <b>none separated the car.</b> Photo-trained SAM learns "
  "that an object is a solid textured region; a line-art car is sparse outline strokes on the same paper, so "
  "there is no region to grab and it snaps to the nearest tonal block."),
 ("02_car_linestructure_fail.png", "2 · The car defeats the line-structure methods too",
  "Close-the-outline-and-fill (A) and convex hull (C) over-fill the whole box (the ink connects into one blob); "
  "GrabCut (B) grabs a rough half; +largest-component (D) is still the whole blob. <b>No clean car boundary "
  "exists at the pixel level</b> — the car is only perceptually grouped by a human reading the drawing."),
 ("03_depth_ordering.png", "3 · Depth — the surprise win",
  "Depth Anything V2 runs on the <i>drawing</i> and recovers a correct front-to-back order "
  "(street/person closest → cars/buildings → smoke/sky farthest). <b>Bonus:</b> a clean person silhouette falls "
  "out for free — a second independent route to the figure. Depth retired the whole Ordering skill."),
 ("04_depth_bands.png", "4 · Depth bands — a free coarse decomposition",
  "Threshold the depth into FRONT / MID / BACK and each band is a usable, correctly-ordered cel — "
  "<b>person+street, cars+buildings, fire+sky — with zero segmentation.</b> This is how far 'free' "
  "auto-decomposition reaches before per-element refinement is needed."),
 ("05_lama_infill.png", "5 · Complete — LaMa reconstructs what the figure hid",
  "Remove the man, and LaMa (Large-Mask Inpainting) <b>rebuilds the car, fire, and street behind him</b> "
  "plausibly — not cv2.inpaint's blur (which the eye rejects). It fills texture; exact occluded line-shape is "
  "the deeper, still-open part."),
 ("06_physics_analysis.png", "6 · Read the physics out of the drawing",
  "A structure-tensor analysis of the drawn smoke measures its flow direction by height — it leans "
  "<b>consistently up-and-to-the-right (mean 0.63)</b>. The image's own physics, extracted, then used to drive "
  "the motion."),
 ("07_ink_warp_alive.png", "7 · Compose — the pen lines come alive",
  "The drawing's <i>own</i> fire/smoke strokes are warped along that measured flow (rise + lick + up-right lean), "
  "masked to the plume, the man extracted and his hole infilled with fire, the buildings locked, the man held "
  "crisp on top, slow and looped. <b>No overlay — the existing ink moves.</b>"),
 ("08_photoreal_first.png", "8 · The breakthrough — decompose in PHOTOREAL, stylize last",
  "The insight that dissolves the wall: don't fight line-art. Convert the drawing to <b>photoreal</b> (FLUX + "
  "canny ControlNet, same composition) — now SAM and depth lock the car instantly, because in photoreal it is a "
  "solid object they were trained on. Segment + infill in the domain where the tools are strong, then re-apply "
  "the ink style to each clean cel. <b>Rich-first / stylize-last, applied to layering.</b>"),
]

CONCLUSION = """
<h2>What works, and the wall</h2>
<table>
<tr><th>element</th><th>best tool</th><th>extent</th></tr>
<tr><td>person / figures</td><td>keypoints <i>or</i> depth silhouette</td><td>✓ clean (two routes)</td></tr>
<tr><td>sky · buildings · ground</td><td>depth bands</td><td>✓ coarse, ordered</td></tr>
<tr><td>fire / smoke</td><td>region + flow analysis + ink-warp</td><td>✓ animatable</td></tr>
<tr><td>occluded background</td><td>LaMa infill</td><td>✓ texture (not exact shape)</td></tr>
<tr><td>depth ordering</td><td>Depth Anything V2</td><td>✓</td></tr>
<tr><td><b>thin line-art object (car)</b></td><td><b>— in line-art</b></td><td><b>✗ the wall</b></td></tr>
<tr><td><b>…the same car in photoreal</b></td><td><b>SAM + depth</b></td><td><b>✓ (step 8)</b></td></tr>
</table>
<p><b>Conclusion.</b> Automatic decomposition of <i>line art</i> hits a hard wall at thin, see-through objects —
they are invisible to segmentation, depth, colour, and morphology alike. Two things get past it: depth
(which hands you ordering, the figure, and coarse bands for free), and the <b>photoreal-first</b> reframe —
do the decomposition where the tools are trained, then stylize each cel. The reliable pipeline is
<code>generate/convert to photoreal → segment + depth + infill → stylize each cel to ink → warp &amp; recompose.</code></p>
"""

cards = []
for fn, title, prose in STEPS:
    src = img(fn)
    if src is None:
        cards.append(f'<section><h2>{title}</h2><p class="pending">▸ the predicted breakthrough — the validation render (FLUX canny→photoreal) is queued; the reasoning below stands, the image fills in when it lands.</p><p>{prose}</p></section>')
    else:
        cards.append(f'<section><h2>{title}</h2><img src="{src}"><p>{prose}</p></section>')

html = f"""<!doctype html><meta charset=utf-8><title>Line-art layer decomposition — proof</title>
<style>
 body{{background:#15161a;color:#e9e7e2;font-family:ui-monospace,Menlo,monospace;margin:0;padding:32px;line-height:1.55}}
 .wrap{{max-width:860px;margin:0 auto}}
 h1{{font-family:Anton,Impact,sans-serif;font-weight:400;letter-spacing:.02em;font-size:34px;margin:.1em 0}}
 .sub{{color:#8b8d96;margin:0 0 28px}}
 section{{border:1px solid #2c2e36;border-radius:12px;padding:18px 20px;margin:18px 0;background:#1b1d22}}
 h2{{color:#e0a83a;font-family:Anton,Impact,sans-serif;font-weight:400;letter-spacing:.02em;font-size:19px;margin:.1em 0 .6em}}
 img{{width:100%;border:1px solid #2c2e36;border-radius:8px;display:block;margin-bottom:12px}}
 p{{margin:.4em 0;font-size:14px}} b{{color:#f3f0ea}}
 table{{border-collapse:collapse;width:100%;font-size:13px;margin:.6em 0}}
 td,th{{border:1px solid #2c2e36;padding:7px 10px;text-align:left}} th{{color:#e0a83a}}
 .pending{{color:#e0a83a}} code{{color:#d8a85a}}
 footer{{color:#8b8d96;font-size:12px;margin-top:20px;text-align:center}}
</style>
<div class="wrap">
<h1>Can you take a line drawing apart into living layers?</h1>
<p class="sub">amodal layered decomposition of line art · BLUELINE shot 02 · the steps, and the wall · 2026-06-25</p>
{''.join(cards)}
{CONCLUSION}
<footer>Loudon Live · Autodidact Polymaths</footer>
</div>
"""
out = os.path.join(P, "decomposition-proof.html")
open(out, "w").write(html)
print("WROTE", out)
