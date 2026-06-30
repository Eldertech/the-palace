#!/usr/bin/env python3
"""Hero+Avatar BATCH driver — the Maker's render path for many entries at once.

The single-entry tool is `regen_one.py` (the STIGMERGY companion regen door). This
is its batch sibling: it reuses regen_one's exact render logic (FLUX on the RunPod
serverless endpoint, the ANTI_TEXT clause, bundle placement by the entry's real
path, the face.json sidecar) but keeps the endpoint UP across the whole batch and
parks it once at the end — so a 40-face run is one cold start, not forty.

Lives in tracked Shop space (the Maker's own bundle) so the render path ships in
every checkout — NOT in gitignored _ops/scratch/. Working renders land in the
gitignored ./_renders/ scratch dir; only finals are copied into each entry bundle.

  make_faces.py generate [--palace ROOT] [--only SLUG,SLUG] [--mock]   # render to _renders/
  make_faces.py place    [--palace ROOT]                                # copy into bundles + embed + sidecar
  make_faces.py gallery  [--palace ROOT]                                # _renders/gallery.html contact sheet
  make_faces.py plan     [--palace ROOT]                                # tab-sep git-add paths per entry

prompts.json (sibling of this file) — a list of specs:
  [ { "title", "path" (palace-relative .md), "idiom", "hero_prompt", "icon_prompt" }, ... ]
"""
from __future__ import annotations
import argparse, importlib.util, json, os, shutil, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent

def _load_regen():
    spec = importlib.util.spec_from_file_location("regen_one", HERE / "regen_one.py")
    mod = importlib.util.module_from_spec(spec); sys.modules["regen_one"] = mod
    spec.loader.exec_module(mod); return mod
R = _load_regen()

PROMPTS = HERE / "prompts.json"
RENDERS = HERE / "_renders"           # gitignored working dir

def palace_of(argv):
    if "--palace" in argv:
        return Path(argv[argv.index("--palace") + 1]).resolve()
    return HERE.parents[1]            # .../Shop/Hero and Avatar Maker -> palace root

def specs():
    data = json.loads(PROMPTS.read_text())
    return data if isinstance(data, list) else data.get("specs", [])

def only_filter(argv, items):
    if "--only" in argv:
        want = set(argv[argv.index("--only") + 1].split(","))
        return [s for s in items if R.slug(s["title"]) in want]
    return items

def generate(argv):
    palace = palace_of(argv); mock = "--mock" in argv
    RENDERS.mkdir(parents=True, exist_ok=True)
    todo = only_filter(argv, specs())
    key = ep = ep_obj = None
    done = failed = 0
    try:
        if not mock:
            rp = R.load_client(palace); key, ep = R.creds(palace)
            ep_obj = rp.RunPodEndpoint(endpoint_id=ep, api_key=key,
                                       poll=rp.PollPolicy(total_timeout_seconds=900))
            R.set_workers(key, ep, 1)
        for s in todo:
            sl = R.slug(s["title"])
            for side in ("hero", "icon"):
                final = RENDERS / f"{sl}-{side}.png"
                if final.exists():
                    continue
                p = (s.get(f"{side}_prompt") or "").strip()
                if not p:
                    print(f"[batch] SKIP {sl}-{side}: no prompt"); continue
                try:
                    R.render_side(ep_obj, RENDERS, side, p + R.ANTI_TEXT, final, mock)
                    done += 1
                except Exception as ex:
                    failed += 1; print(f"[batch] !! {sl}-{side} FAILED: {ex}")
    finally:
        if not mock and key and ep:
            try: R.set_workers(key, ep, 0)
            except Exception as ex: print(f"[batch] WARN park: {ex}")
        print(f"[batch] generate done. rendered={done} failed={failed}")

def place(argv):
    palace = palace_of(argv); placed = 0
    for s in specs():
        title, rel_md = s["title"], s.get("path", "")
        md = palace / rel_md
        if not md.exists():
            print(f"[place] SKIP {title}: md not found ({rel_md})"); continue
        sl = R.slug(title)
        hero_src, icon_src = RENDERS / f"{sl}-hero.png", RENDERS / f"{sl}-icon.png"
        if not (hero_src.exists() and icon_src.exists()):
            print(f"[place] SKIP {title}: renders missing"); continue
        bundle = md.parent / title; bundle.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(hero_src, bundle / f"{title} — hero.png")
        shutil.copyfile(icon_src, bundle / f"{title} — icon.png")
        R.embed_hero(md, title)
        R.write_face_json(bundle, title, s, {})
        placed += 1; print(f"[place] {title}")
    print(f"[place] placed {placed}")

def gallery(argv):
    RENDERS.mkdir(parents=True, exist_ok=True)
    cards = []
    for s in specs():
        sl = R.slug(s["title"])
        cards.append(f"""<div class=card><h2>{s['title']}</h2><div class=idiom>{s.get('idiom','')}</div>
        <div class=imgs><figure><img src="{sl}-hero.png"><figcaption>hero</figcaption></figure>
        <figure class=ic><img src="{sl}-icon.png"><figcaption>icon</figcaption></figure></div></div>""")
    html = f"""<!DOCTYPE html><html><head><meta charset=utf-8><title>Hero/Icon contact sheet</title>
    <style>body{{margin:0;background:#161719;color:#ece9e3;font-family:Manrope,system-ui,sans-serif;padding:24px 4vw 80px}}
    h1{{font-family:Anton,sans-serif;text-transform:uppercase;letter-spacing:.02em}}
    .card{{border:1px solid #2c2f35;border-radius:8px;padding:16px;margin:16px 0;background:#1e2024}}
    .card h2{{font-size:21px;margin:0}} .idiom{{font-family:monospace;font-size:11px;color:#9aa0a6;margin:2px 0 12px}}
    .imgs{{display:flex;gap:16px;flex-wrap:wrap}} figure{{margin:0}}
    .imgs>figure:first-child img{{height:190px}} figure.ic img{{height:130px;width:130px;object-fit:cover}}
    img{{display:block;border:1px solid #2c2f35;border-radius:6px;background:#000}}
    figcaption{{font-family:monospace;font-size:10px;color:#9aa0a6;text-align:center;margin-top:4px}}
    .sig{{color:#9aa0a6;font-size:10.5px;text-transform:uppercase;letter-spacing:.14em;margin-top:30px}}</style></head>
    <body><h1>Hero / Icon Contact Sheet</h1>
    <p style="color:#9aa0a6;font-family:monospace;font-size:12px">{len(specs())} entries · name any to regenerate</p>
    {''.join(cards)}<div class=sig>Loudon Live · Autodidact Polymaths</div></body></html>"""
    (RENDERS / "gallery.html").write_text(html)
    print(f"[batch] wrote {RENDERS/'gallery.html'}")

def plan(argv):
    for s in specs():
        title = s["title"]; d = str(Path(s.get("path","")).parent)
        base = f"{d}/{title}" if d and d != "." else title
        print("\t".join([s.get("path",""), f"{base}/{title} — hero.png",
                          f"{base}/{title} — icon.png", f"{base}/{title} — face.json"]))

if __name__ == "__main__":
    ap = argparse.ArgumentParser(add_help=True)
    ap.add_argument("cmd", choices=["generate", "place", "gallery", "plan"])
    args, _ = ap.parse_known_args()
    {"generate": generate, "place": place, "gallery": gallery, "plan": plan}[args.cmd](sys.argv)
