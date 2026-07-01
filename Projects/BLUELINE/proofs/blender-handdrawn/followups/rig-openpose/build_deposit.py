"""
Figure Rig — full deposit + continuation handoff (HTML). Every render matrix is shown WITH the
Blender guidance passes (OpenPose, depth, shaded, color) that drove it, so a new Claude can see
exactly what conditioned what. Self-contained (base64). ComfyUI venv python (PIL).
"""
import base64, io, os, sys, json
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import faces_manifest as FM
import hands_manifest as HM
import examples_manifest as EM

R = os.path.join(HERE, "renders")

def uri(path, maxw, bg=(255, 255, 255)):
    if not os.path.isfile(path):
        im = Image.new("RGB", (maxw, int(maxw * 1.25)), (60, 60, 68))
    else:
        im = Image.open(path).convert("RGB")
    if im.width > maxw:
        im = im.resize((maxw, round(im.height * maxw / im.width)), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, "PNG", optimize=True)
    return "data:image/png;base64," + base64.b64encode(b.getvalue()).decode()

def cellimg(path, cap, w=120, dark=False):
    cls = "cell dark" if dark else "cell"
    tag = f'<img src="{uri(path, w)}">' if os.path.isfile(path) else '<div class="miss">—</div>'
    return f'<div class="{cls}">{tag}<div class="cc">{cap}</div></div>'

def guide_gen_row(label, guide_dir, gen_dir, guides, gens, title, meta=""):
    gcells = "".join(cellimg(os.path.join(guide_dir, fn), lab, 108, dark=("depth" in fn or "openpose" in fn))
                     for lab, fn in guides)
    ncells = "".join(cellimg(os.path.join(gen_dir, fn), lab, 150) for lab, fn in gens)
    return (f'<div class="row"><div class="rlab"><b>{title}</b><br><span class="rm">{meta}</span></div>'
            f'<div class="guides"><div class="gh">Blender guidance</div><div class="gset">{gcells}</div></div>'
            f'<div class="results"><div class="gh">gen-AI</div><div class="rset">{ncells}</div></div></div>')

# ---------- FACES ----------
FACE_GUIDES = [("openpose", "openpose.png"), ("depth", "depth_plate.png"),
               ("shaded", "shaded_plate.png"), ("color", "color_plate.png")]
FACE_GENS = [("storyboard", "gen_storyboard.png"), ("watercolor", "gen_watercolor.png"), ("comic", "gen_comic.png")]

def faces_section():
    rows = []
    groups = [("Expression sweep — young woman, closeup",
               [(f"yw_{e}", e) for e in ["neutral", "smile", "laugh", "surprised", "angry", "sad", "fear", "disgust"]]),
              ("Gender / age — smile + angry, closeup",
               [(f"{p}_{e}", f"{FM.PEOPLE[p]['subject']} · {e}") for p in ["young_man", "girl", "boy", "old_woman", "old_man"] for e in ["smile", "angry"]]),
              ("Distance — young woman, surprised",
               [("yw_surprised", "closeup"), ("yw_surprised_medium", "medium"), ("yw_surprised_full", "full")])]
    for gtitle, items in groups:
        rows.append(f'<h3>{gtitle}</h3>')
        for label, meta in items:
            gd = os.path.join(R, "faces-rig", label); nd = os.path.join(R, "faces-gen", label)
            rows.append(guide_gen_row(label, gd, nd, FACE_GUIDES, FACE_GENS, label, meta))
    return "\n".join(rows)

# ---------- HANDS ----------
HAND_GUIDES = [("openpose", "openpose.png"), ("depth", "depth_plate.png"), ("ink", "ink_plate.png")]
HAND_GENS = FACE_GENS

def hands_section():
    rows = []
    for j in HM.plate_jobs():
        if j["shot"] != "closeup":
            continue
        label = j["key"]
        gd = os.path.join(R, "hands", label); nd = os.path.join(R, "hands-gen", label)
        rows.append(guide_gen_row(label, gd, nd, HAND_GUIDES, HAND_GENS, label, j["shot"]))
    return "\n".join(rows)

# ---------- BODY ----------
BODY_GUIDES = [("openpose", "openpose.png"), ("depth", "depth_plate.png"), ("ink", "ink_plate.png")]

def body_section():
    rows = []
    for p in EM.PEOPLE:
        gd = os.path.join(R, "mpfb-v3", "pose_" + p["key"]); nd = os.path.join(R, "examples", p["key"])
        m = p["macro"]; meta = f'{"female" if m["gender"] < 0.5 else "male"} · age {m["age"]}'
        rows.append(guide_gen_row(p["key"], gd, nd, BODY_GUIDES, FACE_GENS, p["label"], meta))
    return "\n".join(rows)

# ---------- experiment + timings ----------
def experiment_block():
    grid = os.path.join(R, "faces-exp", "experiment_grid.png")
    tj = os.path.join(R, "faces-exp", "timings.json")
    t = json.load(open(tj)) if os.path.isfile(tj) else {}
    img = f'<img src="{uri(grid, 980)}">' if os.path.isfile(grid) else ""
    return img, t.get("avg_seconds_per_render", {})

HTML = None
def main():
    exp_img, timings = experiment_block()
    tim_rows = "".join(f"<tr><td>{k}</td><td>{v}s</td></tr>" for k, v in timings.items())
    doc = TEMPLATE
    doc = doc.replace("__FACES__", faces_section())
    doc = doc.replace("__HANDS__", hands_section())
    doc = doc.replace("__BODY__", body_section())
    doc = doc.replace("__EXP_IMG__", exp_img)
    doc = doc.replace("__TIMINGS__", tim_rows)
    out = os.path.join(HERE, "figure_rig_deposit.html")
    open(out, "w").write(doc)
    print("wrote", out, f"({os.path.getsize(out)//1024} KB)")


TEMPLATE = r"""<!DOCTYPE html><html lang="en" class="skin-graphite"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>Figure Rig — Deposit</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Anton&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=Manrope:wght@300;400;500;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
:root{--serif:'Cormorant Garamond',Georgia,serif;--sans:'Manrope',system-ui,sans-serif;--display:'Anton',sans-serif;--mono:'JetBrains Mono',monospace;
--bg:#0a0a0f;--b1:#12121a;--b2:#1a1a28;--bd:#4a4a5e;--bs:rgba(255,255,255,0.06);--f1:#e8e8f0;--f2:#c8c8d8;--f3:#8a8aa0;--f4:#4a4a5a;--ac:#e8b84a;--ok:#00ff66;--dg:#ff2a2a;--in:#4a8fff;}
*{box-sizing:border-box;margin:0;padding:0}body{background:var(--bg);color:var(--f1);font-family:var(--sans);font-weight:300;line-height:1.6;padding:48px 22px 90px;max-width:1280px;margin:0 auto}
.wm{font-family:var(--display);font-size:30px}.wm em{font-family:var(--serif);font-style:italic;font-weight:300;color:var(--ac)}
.ey{font-family:var(--mono);font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:var(--ac);margin:26px 0 8px}
h1{font-family:var(--display);font-size:52px;font-weight:400;line-height:1.02;margin-bottom:8px}
h1 .s{display:block;font-family:var(--serif);font-style:italic;font-size:22px;color:var(--f2);margin-top:8px}
h2{font-family:var(--mono);font-size:14px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;margin:60px 0 8px;padding-bottom:8px;border-bottom:1px solid var(--bd);color:var(--f1)}
h3{font-family:var(--mono);font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:var(--ac);margin:34px 0 12px}
h4{font-family:var(--sans);font-weight:600;font-size:16px;color:var(--f1);margin:22px 0 6px}
p{font-family:var(--serif);font-size:17px;color:var(--f2);max-width:900px;margin:10px 0}
.lead{font-size:20px;color:var(--f2);max-width:860px;margin:16px 0}
code,.mono{font-family:var(--mono);font-size:12.5px;color:var(--f2)}
pre{background:var(--b1);border:1px solid var(--bd);border-radius:4px;padding:14px 16px;overflow-x:auto;font-family:var(--mono);font-size:12px;color:var(--f2);line-height:1.55;margin:12px 0}
ul{margin:10px 0 10px 22px}li{font-family:var(--serif);font-size:16.5px;color:var(--f2);margin:5px 0}
b{color:var(--f1)}a{color:var(--ac)}
.card{background:var(--b1);border:1px solid var(--bd);border-radius:4px;padding:18px 20px;margin:16px 0}
.card.hand{border-color:var(--ac)}
table{border-collapse:collapse;margin:12px 0;font-family:var(--mono);font-size:12.5px}td,th{border:1px solid var(--bd);padding:6px 12px;text-align:left;color:var(--f2)}th{color:var(--f1)}
/* gallery rows */
.row{display:flex;gap:14px;align-items:flex-start;padding:12px 0;border-bottom:1px solid var(--bs);flex-wrap:wrap}
.rlab{width:130px;flex:0 0 130px;font-family:var(--mono);font-size:11px;color:var(--f2);padding-top:18px}
.rlab .rm{color:var(--f3);font-size:10px}
.gh{font-family:var(--mono);font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--f4);margin-bottom:4px}
.guides,.results{display:flex;flex-direction:column}
.gset,.rset{display:flex;gap:5px}
.cell{display:flex;flex-direction:column;align-items:center}
.cell img{display:block;border-radius:2px;background:#fff;border:1px solid var(--bs)}
.cell.dark img{background:#000}
.cc{font-family:var(--mono);font-size:8.5px;color:var(--f3);margin-top:3px;text-transform:uppercase;letter-spacing:.06em}
.miss{width:108px;height:135px;background:var(--b2);border-radius:2px;color:var(--f4);display:flex;align-items:center;justify-content:center;font-family:var(--mono)}
.kick{display:inline-block;font-family:var(--mono);font-size:11px;letter-spacing:.1em;text-transform:uppercase;padding:4px 10px;border-radius:2px;border:1px solid;margin:2px 6px 2px 0}
.k-ok{color:var(--ok);border-color:var(--ok)}.k-bad{color:var(--dg);border-color:var(--dg)}.k-in{color:var(--in);border-color:var(--in)}
footer{margin-top:70px;padding-top:20px;border-top:1px solid var(--bd);display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px}
.sig{font-family:var(--mono);font-size:12px;letter-spacing:.14em;color:var(--f3);text-transform:uppercase}.ll{font-family:var(--display);font-size:18px;color:var(--f2)}.ll em{font-family:var(--serif);font-style:italic;color:var(--ac)}
</style></head><body>
<div class="wm">Loudon <em>Live</em></div>
<div class="ey">Figure Rig · full deposit + continuation handoff · 2026-06-30</div>
<h1>Staging figures for the gen-AI<span class="s">pose · expression · hands · the conditioning stack — and how to carry it into BLUELINE scenes</span></h1>
<p class="lead">This is the record of one long session and a handoff: a fresh Claude should be able to read it and keep building. It carries the working pipeline, the galleries (every render matrix shown <b>with the Blender passes that guided it</b> — OpenPose, depth, shaded, color), the guide experiment that fixed front/back, and the answers to Loudon's questions written as next-step plans.</p>

<h2>▸ For a new Claude — how to continue</h2>
<div class="card hand">
<h4>Where everything is</h4>
<p class="mono">All tooling: <code>Projects/BLUELINE/proofs/blender-handdrawn/followups/rig-openpose/</code>. Entry: <code>Shop/Figure Rig.md</code> + its bundle (this deposit's markdown twin is <code>Shop/Figure Rig/Figure Rig — conditioning stack and scene expansion.md</code>). Pod machinery: <code>Projects/BLUELINE/proofs/new-story/</code> (<code>pose_pod_orchestrator.py</code>, <code>pod_backend.py</code>, <code>render_shot.py</code>).</p>
<h4>The scripts</h4>
<ul>
<li><code>pose_rig_mpfb_v3.py</code> — bodies (MPFB2 human + weighted rig, macro = gender/age/build), autoframe.</li>
<li><code>figure_rig_pose_studio.py → figure_rig_studio.blend</code> — hand-posable Rigify IK figure.</li>
<li><code>hands_rig.py</code> — 21-pt hand OpenPose from finger bones; palm-normal closeup camera; fist/point/open/grip/pinch.</li>
<li><code>faces_rig.py</code> — expression via raw FACS units; mesh-based face landmarks; renders <b>four guides: line-art / shaded / color / depth</b>; adds proxy eyeballs (base mesh has none).</li>
<li><code>draw_openpose.py</code> — draws body+hands+face with the real controlnet_aux (pixel-identical to the preprocessor).</li>
<li>Batches: <code>batch_faces_pod.py</code> (shaded→canny+depth+openpose), <code>batch_hands_pod.py</code>, body <code>batch_pod.py</code>, <code>batch_faces_experiment.py</code> (guide comparison).</li>
</ul>
<h4>Running the pod (and the gotchas that bit us)</h4>
<pre>cd new-story
POD_CANNY=1 python3 pose_pod_orchestrator.py \
  --render-script &lt;abs path to batch_*.py&gt; --render-args "..."   # auto-teardown, NO --keep-alive</pre>
<ul>
<li><b>Never leave a keep-alive pod idle</b> — the volume-free image keeps models on ephemeral disk; ~20 min idle and ComfyUI crashes → uploads 404. Boot → run the whole batch → auto-teardown.</li>
<li><b>Always sweep after any interrupted run</b> (<code>GET /v1/pods</code>, terminate stragglers). The <code>finally</code> teardown does not run if the orchestrator is killed.</li>
<li>Cost: ~$0.001/render; the <b>cold boot (~$0.08–0.10) dominates</b> — batch many jobs per boot.</li>
<li>Gender: <b>0.0 = female, 1.0 = male</b> (MPFB macro.json). Expressions offline via raw FACS units.</li>
</ul>
<h4>What's next (details in §Next steps)</h4>
<ul><li>Hands + objects with Blender <b>proxy shapes</b> (greybox the glass/snake/flower, feed shaded+depth, tag by color).</li>
<li>Multi-figure scenes (talking) and interactions (kiss / wrestle / handshake) — author the contact as geometry, separate by color-ID.</li>
<li>Tighter face landmarks + proper eye assets; identity per figure (InstantID) bound to color regions.</li></ul>
</div>

<h2>▸ The conditioning stack (Loudon's questions, answered)</h2>
<h4>Q: Are we using OpenPose + depth + color, and can we follow them at different strengths?</h4>
<p>Yes. Each Blender pass is its own ControlNet, and each has a <b>strength</b> (how hard it binds) and <b>start/end percent</b> (when in the denoise it acts). "Lock hard to OpenPose, let the shade render vary" is literally:</p>
<pre>openpose:       strength 0.9,  end_percent 0.9    # skeleton is law
canny(shaded):  strength 0.4,  end_percent 0.5    # form guides early, then the model is free
depth:          strength 0.45, end_percent 0.7    # near/far kept loosely</pre>
<p>The mix is four sliders, not a rebuild. <span class="kick k-ok">finding</span> feed canny the <b>shaded</b> render, not the flat line art — flat ink loses front/back and fills eyes hollow; shaded edges sit on real form → bold style <b>and</b> correct anatomy.</p>
<h4>Q: Color isn't really necessary — use it strategically to separate objects?</h4>
<p>Exactly. For one figure, shaded greyscale is enough. Spend color as an <b>ID / segmentation channel</b>: give each object or person a distinct flat color in a dedicated pass, then bind "a man in a coat" to the red region and "a woman" to the blue region via <b>regional conditioning</b> (or use the flat colors as compositing masks). The color pass tells the model the spatial truth the prompt can't — this is what stops intertwined figures from melting into one.</p>
<h4>Q: The ComfyUI node structure + the variables that matter</h4>
<pre>CheckpointLoader ─┬─ CLIPTextEncode(+/−)         KSampler ─ VAEDecode ─ SaveImage
                  └─ VAE                            ▲ latent:
  LoadImage(shaded) ─ Canny ─ CN.canny ─┐          │  EmptyLatentImage (txt2img, denoise 1.0)  ← we use this
  LoadImage(depth) ────────── CN.depth ─┼─(chain)  │  OR VAEEncode(render) (img2img, denoise &lt;1)
  LoadImage(openpose) ─────── CN.pose ──┘          │</pre>
<p>Levers, by impact: <b>(1)</b> which Blender pass feeds canny (shaded, not ink); <b>(2)</b> per-ControlNet strength + end_percent; <b>(3)</b> txt2img+canny (bold) vs img2img over a render (form-locked, muted, ~25% faster); <b>(4)</b> canny thresholds; <b>(5)</b> KSampler seed/steps/cfg. It is never the node <i>types</i> — it is which pass feeds which node and how hard.</p>
<h4>Cost / time / quality (the guide experiment)</h4>
__EXP_IMG__
<table><tr><th>approach</th><th>avg s/render</th></tr>__TIMINGS__</table>
<p><span class="kick k-bad">ink→canny</span> hollow eyes · <span class="kick k-ok">shaded→canny</span> best (bold + correct) · <span class="kick k-ok">color→canny</span> equal, slight color bias · <span class="kick k-in">img2img</span> correct form but muted style. All ~equal cost; the pod boot dominates.</p>

<h2>▸ Faces — expression × gender/age × distance</h2>
<p>Each row: the four <b>Blender guidance passes</b> (OpenPose · depth · shaded · color) then the three gen-AI styles (shaded→canny + depth + openpose). Expressions come from FACS units on the mesh; eyeballs were added because the base mesh sockets are empty.</p>
__FACES__

<h2>▸ Hands — gestures + held objects</h2>
<p>Guidance: OpenPose (21-pt hand from finger bones) · depth · ink. The pose holds the hand; the prompt adds the object.</p>
__HANDS__

<h2>▸ Bodies — parametric people × poses</h2>
<p>Guidance: OpenPose · depth · ink. One macro dict → any body; the OpenPose holds the pose, the prompt drives the style.</p>
__BODY__

<h2>▸ Next steps (the plans, ready to execute)</h2>
<h4>Hands + objects with Blender proxy geometry</h4>
<p>Stop leaning on the prompt for held objects. Model a <b>simple proxy</b> (cylinder = glass, bent tube = snake, stem+disk = flower, draped plane = fabric), pose the hand gripping it (contact is real geometry), and render the proxy into the <b>shaded + depth</b> passes so the model sees the object's form and where the hand wraps it. Tag it for replacement two ways: <b>(a) color-ID region</b> → bind "a glass of water" to the proxy's color via regional conditioning; <b>(b) separate render pass + composite</b> → render figure and object separately, composite (the proxy fixes position/occlusion), then a low-denoise <b>integrate pass</b> fuses them. The proxy is a greybox that carries the hard spatial facts; the gen-AI supplies the surface.</p>
<h4>Many people — talking, and interacting (kiss / wrestle / handshake)</h4>
<p>Pose 2+ rigs in one scene, each with its own OpenPose and a distinct <b>color-ID</b>. Regional conditioning binds each person's description (and later identity) to their color region; depth keeps who's in front. For <b>interaction</b> — the case prompt-only can't do (intertwined figures blend to one face) — <b>author the contact as geometry</b>: two hand rigs gripping for a handshake, two heads posed touching for a kiss, two bodies interlocked for a grapple. Feed multi-figure OpenPose + depth + color-ID and the model renders two distinct people in genuine contact. The strength dials let the contact be firm (high pose+depth) while the ink stays loose.</p>
<h4>Open</h4>
<ul>
<li>Which ComfyUI regional node (Attention Couple / regional prompt / GLIGEN) best binds a prompt to a color-ID region.</li>
<li>Identity per figure across a scene (InstantID/PuLID) bound to color regions — a next Shop Specialist.</li>
<li>Tighter face landmarks (still a rough point-cloud) + proper MPFB eye assets (we added proxy eyeball spheres; the joint-eye sits ~5 cm high, seat with an offset).</li>
</ul>

<footer><div class="sig">Figure Rig · deposit · branch feature/figure-rig-mpfb</div><div class="ll">Loudon <em>Live</em> · Autodidact Polymaths</div></footer>
</body></html>"""

main()
