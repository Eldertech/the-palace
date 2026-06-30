"""Embed image assets as base64 data-URIs into the Figure Rig proofs HTML.
Template-driven + idempotent: always reads _proofs_template.html, writes
figure_rig_proofs.html. Re-run after the D2 redraw lands to slot it in.
Run with the ComfyUI venv python (has Pillow)."""
import base64, io, os
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SPIKE = ("/private/tmp/claude-501/-Users-loudonstearns-Documents-The-Palace"
         "/70d64f86-6c6f-4562-b777-f5dac844c62e/scratchpad/mpfb-spike")
V3 = os.path.join(HERE, "renders", "mpfb-v3")
OLD = os.path.join(HERE, "renders", "mpfb-body")

def data_uri(path, maxw):
    im = Image.open(path).convert("RGB")
    if im.width > maxw:
        im = im.resize((maxw, round(im.height * maxw / im.width)), Image.LANCZOS)
    buf = io.BytesIO(); im.save(buf, "PNG", optimize=True)
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()

IMAGES = {
    "__IMG_SILHOUETTE__":     (os.path.join(SPIKE, "stride_silhouette.png"), 640),
    "__IMG_INK_MALE__":       (os.path.join(V3, "pose_B_male/ink_plate.png"), 640),
    "__IMG_INK_MALE2__":      (os.path.join(V3, "pose_B_male/ink_plate.png"), 560),
    "__IMG_DEPTH_MALE__":     (os.path.join(V3, "pose_B_male/depth_plate.png"), 560),
    "__IMG_OPENPOSE_MALE__":  (os.path.join(V3, "pose_B_male/openpose.png"), 560),
    "__IMG_OVERLAY_MALE__":   (os.path.join(V3, "pose_B_male/overlay_check.png"), 640),
    "__IMG_COMPARE__":        (os.path.join(V3, "v3_compare.png"), 1100),
    "__IMG_OLD_INK__":        (os.path.join(OLD, "pose_A/ink_plate.png"), 400),
    "__IMG_OLD_REDRAW__":     (os.path.join(OLD, "pose_A/redraw_D2.png"), 400),
    "__IMG_NEW_INK__":        (os.path.join(V3, "pose_B_male/ink_plate.png"), 400),
}

PENDING = ('<div style="padding:60px 22px;text-align:center;font-family:var(--mono);'
           'font-size:12px;color:var(--fg-3);background:var(--bg-elev-2)">'
           '◌ redraw rendering on MPS — ~20 min<br><span style="color:var(--fg-4)">'
           'this slot fills when pose_B_male/redraw_D2.png lands</span></div>')

def redraw_slot(maxw):
    p = os.path.join(V3, "pose_B_male/redraw_D2.png")
    if os.path.isfile(p):
        return f'<img src="{data_uri(p, maxw)}" alt="D2 redraw — inked figure">'
    return PENDING

tpl = open(os.path.join(HERE, "_proofs_template.html")).read()
for token, (path, maxw) in IMAGES.items():
    tpl = tpl.replace(token, data_uri(path, maxw) if os.path.isfile(path) else "")
    print(("  embedded " if os.path.isfile(path) else "  MISSING  ") + token)
tpl = tpl.replace("__SLOT_REDRAW_MALE__", redraw_slot(640))
tpl = tpl.replace("__SLOT_NEW_REDRAW__", redraw_slot(400))

out = os.path.join(HERE, "figure_rig_proofs.html")
open(out, "w").write(tpl)
kb = os.path.getsize(out) / 1024
print(f"wrote {out} ({kb:.0f} KB) | redraw {'EMBEDDED' if os.path.isfile(os.path.join(V3,'pose_B_male/redraw_D2.png')) else 'PENDING'}")
