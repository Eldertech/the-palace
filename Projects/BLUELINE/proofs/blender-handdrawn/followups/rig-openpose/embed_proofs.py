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

# ---- examples gallery (8 people × 3 styles) -------------------------------------
import sys, json as _json
sys.path.insert(0, HERE)
try:
    import examples_manifest as EM
except Exception:
    EM = None
EX = os.path.join(HERE, "renders", "examples")

GALLERY_CSS = """
<style>
.gx-card{background:var(--bg-elev-1);border:1px solid var(--border);border-radius:var(--r-md);padding:16px 16px 14px;margin-bottom:18px;box-shadow:var(--shadow-2)}
.gx-head{display:flex;align-items:baseline;gap:12px;margin-bottom:12px;border-bottom:1px solid var(--border-soft);padding-bottom:10px}
.gx-label{font-family:var(--display);font-size:22px;color:var(--fg-1);letter-spacing:.01em}
.gx-meta{font-family:var(--mono);font-size:11px;color:var(--fg-3);letter-spacing:.04em}
.gx-row{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}
@media(max-width:760px){.gx-row{grid-template-columns:repeat(2,1fr)}}
.gx-cell{display:flex;flex-direction:column}
.gx-cell img{width:100%;height:auto;display:block;border-radius:var(--r-sm);background:#fff;border:1px solid var(--border-soft)}
.gx-cell.dark img{background:#000}
.gx-cap{font-family:var(--mono);font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--fg-3);margin-top:5px;text-align:center}
.gx-cap.gen{color:var(--accent)}
.gx-prompt{font-family:var(--mono);font-size:10.5px;color:var(--fg-3);line-height:1.55;margin-top:11px;border-top:1px solid var(--border-soft);padding-top:9px}
.gx-prompt b{color:var(--fg-2)}
.gx-pend{padding:38px 8px;text-align:center;font-family:var(--mono);font-size:10px;color:var(--fg-4);background:var(--bg-elev-2);border-radius:var(--r-sm)}
</style>
"""

def cell(path, cap, maxw=340, dark=False, gen=False):
    cls = "gx-cell dark" if dark else "gx-cell"
    capcls = "gx-cap gen" if gen else "gx-cap"
    if path and os.path.isfile(path):
        img = f'<img src="{data_uri(path, maxw)}" alt="{cap}">'
    else:
        img = '<div class="gx-pend">◌ rendering</div>'
    return f'<div class="{cls}">{img}<div class="{capcls}">{cap}</div></div>'

def build_gallery():
    if EM is None:
        return ""
    cards = [GALLERY_CSS]
    for p in EM.PEOPLE:
        key = p["key"]; m = p["macro"]
        pd = os.path.join(V3, "pose_" + key)
        ed = os.path.join(EX, key)
        sex = "female" if m["gender"] < 0.5 else "male"
        meta = f'{sex} · age {m["age"]} · weight {m["weight"]} · muscle {m["muscle"]}'
        cells = [cell(os.path.join(pd, "ink_plate.png"), "Blender ink"),
                 cell(os.path.join(pd, "openpose.png"), "OpenPose", dark=True)]
        prompts = {}
        pj = os.path.join(ed, "prompts.json")
        if os.path.isfile(pj):
            prompts = _json.load(open(pj)).get("prompts", {})
        for s in EM.STYLES:
            cells.append(cell(os.path.join(ed, f"gen_{s['key']}.png"), s["label"], gen=True))
        prompt_html = ""
        if prompts:
            lines = "".join(
                f'<div style="margin-top:4px"><b>{next((s["label"] for s in EM.STYLES if s["key"]==k), k)}:</b> {v}</div>'
                for k, v in prompts.items())
            prompt_html = f'<div class="gx-prompt"><b>Prompts</b> (pose held by OpenPose; only the style words change):{lines}</div>'
        else:
            prompt_html = f'<div class="gx-prompt"><b>Subject:</b> {p["subject"]} · <span style="color:var(--fg-4)">gen prompts land with the renders</span></div>'
        cards.append(
            f'<div class="gx-card"><div class="gx-head"><span class="gx-label">{p["label"]}</span>'
            f'<span class="gx-meta">{meta}</span></div>'
            f'<div class="gx-row">{"".join(cells)}</div>{prompt_html}</div>')
    return "\n".join(cards)

tpl = open(os.path.join(HERE, "_proofs_template.html")).read()
tpl = tpl.replace("__GALLERY__", build_gallery())
for token, (path, maxw) in IMAGES.items():
    tpl = tpl.replace(token, data_uri(path, maxw) if os.path.isfile(path) else "")
    print(("  embedded " if os.path.isfile(path) else "  MISSING  ") + token)
tpl = tpl.replace("__SLOT_REDRAW_MALE__", redraw_slot(640))
tpl = tpl.replace("__SLOT_NEW_REDRAW__", redraw_slot(400))

out = os.path.join(HERE, "figure_rig_proofs.html")
open(out, "w").write(tpl)
kb = os.path.getsize(out) / 1024
print(f"wrote {out} ({kb:.0f} KB) | redraw {'EMBEDDED' if os.path.isfile(os.path.join(V3,'pose_B_male/redraw_D2.png')) else 'PENDING'}")
