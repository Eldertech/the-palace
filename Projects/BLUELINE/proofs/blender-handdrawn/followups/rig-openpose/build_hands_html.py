"""Compact hands proof page (Loudon Live design system). ComfyUI venv python (PIL)."""
import base64, io, os, json
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
GN = os.path.join(HERE, "renders", "hands-gen")
import hands_manifest as HM

def uri(path, maxw):
    im = Image.open(path).convert("RGB")
    if im.width > maxw:
        im = im.resize((maxw, round(im.height*maxw/im.width)), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, "PNG", optimize=True)
    return "data:image/png;base64," + base64.b64encode(b.getvalue()).decode()

# sample prompts (one per subject, storyboard variant, minus the style suffix for readability)
rows = ""
for s in HM.SUBJECTS:
    key = f"{s['key']}_{s['shots'][0]}"
    pj = os.path.join(GN, key, "prompts.json")
    if not os.path.isfile(pj):
        continue
    full = json.load(open(pj))["prompts"].get("storyboard", "")
    core = full.split(", stark")[0].split(", modern pen")[0]  # trim the locked-style tail
    rows += f'<tr><td class="k">{s["key"]}</td><td>{core}</td></tr>'

closeups = uri(os.path.join(GN, "closeups_grid.png"), 900)
shots = uri(os.path.join(GN, "shots_grid.png"), 1100)

html = f"""<!DOCTYPE html><html lang="en" class="skin-graphite"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>Figure Rig — hands</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Anton&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=Manrope:wght@300;400;500;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
:root{{--serif:'Cormorant Garamond',Georgia,serif;--sans:'Manrope',system-ui,sans-serif;--display:'Anton',sans-serif;--mono:'JetBrains Mono',monospace;
--bg:#0a0a0f;--bg1:#12121a;--border:#4a4a5e;--bs:rgba(255,255,255,0.06);--fg1:#e8e8f0;--fg2:#c8c8d8;--fg3:#8a8aa0;--accent:#e8b84a;}}
*{{box-sizing:border-box;margin:0;padding:0}}body{{background:var(--bg);color:var(--fg1);font-family:var(--sans);font-weight:300;line-height:1.6;padding:56px 24px 96px;max-width:1180px;margin:0 auto}}
.wm{{font-family:var(--display);font-size:30px}}.wm em{{font-family:var(--serif);font-style:italic;font-weight:300;color:var(--accent)}}
.ey{{font-family:var(--mono);font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:var(--accent);margin:28px 0 10px}}
h1{{font-family:var(--display);font-size:50px;font-weight:400;line-height:1.03;margin-bottom:8px}}
h1 .s{{display:block;font-family:var(--serif);font-style:italic;font-size:23px;color:var(--fg2);margin-top:8px}}
.lead{{font-family:var(--serif);font-size:19px;color:var(--fg2);max-width:760px;margin:18px 0}}
h2{{font-family:var(--mono);font-size:13px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;margin:56px 0 6px;display:flex;gap:10px}}h2 .g{{color:var(--accent)}}
.note{{font-family:var(--serif);font-size:17px;color:var(--fg3);max-width:820px;margin-bottom:20px}}
.fig{{background:var(--bg1);border:1px solid var(--border);border-radius:4px;overflow:hidden;box-shadow:inset 0 1px 0 rgba(255,255,255,0.06),0 6px 16px rgba(0,0,0,.5)}}
.fig img{{display:block;width:100%;height:auto;background:#fff}}.cap{{font-family:var(--mono);font-size:11.5px;color:var(--fg3);padding:10px 14px;border-top:1px solid var(--bs)}}
table{{width:100%;border-collapse:collapse;margin-top:8px;font-family:var(--mono);font-size:11.5px}}
td{{border-bottom:1px solid var(--bs);padding:8px 10px;color:var(--fg2);vertical-align:top;line-height:1.5}}td.k{{color:var(--accent);white-space:nowrap;width:120px}}
footer{{margin-top:80px;padding-top:22px;border-top:1px solid var(--border);display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px}}
.sig{{font-family:var(--mono);font-size:12px;letter-spacing:.14em;color:var(--fg3);text-transform:uppercase}}.ll{{font-family:var(--display);font-size:18px;color:var(--fg2)}}.ll em{{font-family:var(--serif);font-style:italic;color:var(--accent)}}
</style></head><body>
<div class="wm">Loudon <em>Live</em></div>
<div class="ey">Figure Rig · Hands · BLUELINE</div>
<h1>Hands, guided by OpenPose<span class="s">21 keypoints from the rig's own finger bones → gestures, held objects, three shots, three styles</span></h1>
<p class="lead">The hand OpenPose is projected from the MPFB rig's 38 finger bones and drawn with the real <span style="font-family:var(--mono)">draw_handpose</span> — so the model renders anatomically correct fingers. The pose (fist, point, grip, pinch) is held; the prompt adds the object (glass of water, fabric, snake, flower). 60 renders on RunPod, ~8s each.</p>
<h2><span class="g">●</span> Closeups — gesture / object × style</h2>
<p class="note">Each row: the hand OpenPose that conditioned it, then the three gen-AI skins. Fingers stay correct because the 21-keypoint hand holds them; the object appears from the prompt.</p>
<div class="fig"><img src="{closeups}" alt="hand closeups grid"><div class="cap"><b>8 hand closeups × 3 styles.</b> fist · fist (side) · point · point (side) · glass of water · fabric · snake · flower.</div></div>
<h2><span class="g">◐</span> Shot range — closeup → medium → full body</h2>
<p class="note">The same hand pose scales from a tight hand to a whole figure; the scene context grows with the frame.</p>
<div class="fig"><img src="{shots}" alt="shot range grid"><div class="cap"><b>point · glass · flower</b> at closeup / medium / full, storyboard + comic.</div></div>
<h2><span class="g">◇</span> The prompts</h2>
<p class="note">The OpenPose holds the hand; only these words change. (Storyboard shown; the locked pen-flow style suffix is trimmed.)</p>
<table>{rows}</table>
<footer><div class="sig">Figure Rig · hands_rig.py · hands_manifest.py · batch_hands_pod.py</div><div class="ll">Loudon <em>Live</em> · Autodidact Polymaths</div></footer>
</body></html>"""
out = os.path.join(HERE, "figure_rig_hands.html")
open(out, "w").write(html)
print("wrote", out, f"({os.path.getsize(out)//1024} KB)")
