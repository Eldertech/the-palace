#!/usr/bin/env python3
"""Single-entry hero/avatar render for the STIGMERGY companion regen door.

This is the Hero and Avatar Maker pipeline narrowed to ONE page, on demand. The
STIGMERGY regen-lane (`_ops/stigmergy/app/server/regen-lane.js`) spawns it with a
spec JSON; it renders the requested target(s) via FLUX on the RunPod serverless
endpoint (the same substrate as the batch path), places them into the entry's
bundle by convention, embeds the hero, records a `<Title> — face.json` sidecar
(so the companion can iterate "make it bolder" from the prior prompt), and prints
a JSON result on stdout for Node to commit. Logs go to STDERR so stdout carries
ONLY the result JSON (the actuator redirects child stdout to the transcript the
reaper parses).

  python3 regen_one.py <spec.json> --palace <root>            # live render (parks after)
  python3 regen_one.py <spec.json> --palace <root> --mock      # offline tiny-PNG render (tests)

`--palace <root>` names the palace to operate on (the lane always passes it);
without it the root is inferred from this script's home (the Hero and Avatar Maker
bundle → palace root). The script LIVES in tracked Shop space (alongside
`Shop/RunPod GPU Backend/serverless-client.py`) so it ships in every checkout —
NOT in gitignored `_ops/scratch/`.

Spec JSON (one entry):
  { "title", "path", "target": "both|hero|icon",
    "idiom", "hero_prompt", "icon_prompt" }

Result JSON (stdout, one line):
  { "ok": bool, "target", "hero_rel"?, "icon_rel"?,
    "stage": [palace-relative paths to git-add],
    "embedded_md": bool, "error"? }
"""
from __future__ import annotations

import base64
import importlib.util
import json
import os
import random
import re
import shutil
import ssl
import sys
import tempfile
import urllib.request
from pathlib import Path

# ── Commons endpoint worker coordinator (multi-agent-safe worker scaling) ─────
# The naive set_workers(0)-in-finally is a wedge when >1 agent shares the endpoint.
# EndpointWorkers reference-counts renderers on the board so workers park to 0 only
# when the LAST agent leaves. Falls back to naive scaling if Commons isn't importable.
def _find_commons_ops():
    d = os.path.dirname(os.path.abspath(__file__))
    for _ in range(10):
        if os.path.isfile(os.path.join(d, "_ops", "commons", "endpoint.py")):
            return os.path.join(d, "_ops")
        nd = os.path.dirname(d)
        if nd == d:
            break
        d = nd
    return None
_ops_dir = _find_commons_ops()
if _ops_dir and _ops_dir not in sys.path:
    sys.path.insert(0, _ops_dir)
try:
    from commons.endpoint import EndpointWorkers
except Exception:
    EndpointWorkers = None

HERO = (1280, 544)                              # ~12:5 banner
ICON = (1024, 1024)                             # square emblem

# A 1x1 transparent PNG — the offline stand-in for a render under --mock.
TINY_PNG = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
)

# Hard rule (never overridable): FLUX letters engraving/manuscript idioms even
# when told "no text", so every prompt carries this clause. Mirrors batch_hubs.
ANTI_TEXT = (" Absolutely no letters, no numerals, no words, no labels, no captions, "
             "no inscriptions, no writing of any kind anywhere in the image — purely pictorial.")

VALID_TARGETS = {"both", "hero", "icon"}


def log(msg: str) -> None:
    print(f"[regen] {msg}", file=sys.stderr, flush=True)


try:
    import certifi  # type: ignore
    ssl._create_default_https_context = lambda *a, **k: ssl.create_default_context(cafile=certifi.where())
except Exception:
    ssl._create_default_https_context = ssl._create_unverified_context


def resolve_palace(argv) -> Path:
    """The palace root: explicit --palace wins (the lane always passes it); else
    inferred from this script's home (Shop/Hero and Avatar Maker → palace root)."""
    if "--palace" in argv:
        i = argv.index("--palace")
        if i + 1 < len(argv):
            return Path(argv[i + 1]).resolve()
    return Path(__file__).resolve().parents[2]   # .../Shop/Hero and Avatar Maker -> palace root


def load_client(palace: Path):
    client = palace / "Shop" / "RunPod GPU Backend" / "serverless-client.py"
    spec = importlib.util.spec_from_file_location("rp_client", client)
    mod = importlib.util.module_from_spec(spec)
    sys.modules["rp_client"] = mod
    spec.loader.exec_module(mod)
    return mod


def slug(t: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", t.lower()).strip("-") or "entry"


def creds(palace: Path):
    cfg = palace / "RunPod Images" / "studio" / "config.json"
    c = json.loads(cfg.read_text())
    return c["api_key"], c["endpoint_id"]


def set_workers(key: str, ep: str, n: int) -> None:
    r = urllib.request.Request(
        f"https://rest.runpod.io/v1/endpoints/{ep}",
        data=json.dumps({"workersMin": 0, "workersMax": n}).encode(), method="PATCH")
    r.add_header("Authorization", f"Bearer {key}")
    r.add_header("Content-Type", "application/json")
    urllib.request.urlopen(r, timeout=30).read()
    log(f"workersMax={n}")


def flux(prompt: str, w: int, h: int, seed: int, steps: int = 28, guidance: float = 3.5) -> dict:
    return {
        "30": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": "flux1-dev-fp8.safetensors"}},
        "27": {"class_type": "EmptySD3LatentImage", "inputs": {"width": w, "height": h, "batch_size": 1}},
        "6": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt, "clip": ["30", 1]}},
        "33": {"class_type": "CLIPTextEncode", "inputs": {"text": "", "clip": ["30", 1]}},
        "35": {"class_type": "FluxGuidance", "inputs": {"conditioning": ["6", 0], "guidance": guidance}},
        "31": {"class_type": "KSampler", "inputs": {"seed": seed, "steps": steps, "cfg": 1, "sampler_name": "euler",
                "scheduler": "simple", "denoise": 1, "model": ["30", 0], "positive": ["35", 0],
                "negative": ["33", 0], "latent_image": ["27", 0]}},
        "8": {"class_type": "VAEDecode", "inputs": {"samples": ["31", 0], "vae": ["30", 2]}},
        "9": {"class_type": "SaveImage", "inputs": {"filename_prefix": "p", "images": ["8", 0]}},
    }


def render_side(ep_obj, out_dir: Path, side: str, prompt: str, out_png: Path, mock: bool) -> int:
    """Render one side (hero|icon) to out_png. Returns the seed used."""
    w, h = HERO if side == "hero" else ICON
    seed = random.randrange(1_000_000)          # fresh each regen so a re-ask differs
    if mock:
        out_png.write_bytes(TINY_PNG)
        log(f"mock {side} -> {out_png.name} (seed {seed})")
        return seed
    log(f"render {side} ({w}x{h}, seed {seed})")
    output = ep_obj.run({"workflow": flux(prompt, w, h, seed)})
    saved = ep_obj.save_outputs(output, str(out_dir / f"{side}-tmp"))
    png = next((p for p in saved if p.lower().endswith(".png")), None)
    if not png:
        raise RuntimeError(f"no png returned for {side}")
    os.replace(png, out_png)
    log(f"render {side} -> {out_png.name}")
    return seed


def embed_hero(md: Path, title: str) -> bool:
    """Embed the hero after the H1 if not already present. Returns True if changed."""
    text = md.read_text()
    embed = f"![[{title} — hero.png]]"
    if embed in text:
        return False
    lines = text.split("\n")
    for i, line in enumerate(lines):
        if line.startswith("# "):              # the H1 (leading-tab H1s are skipped by design)
            lines[i + 1:i + 1] = ["", embed]
            md.write_text("\n".join(lines))
            return True
    return False


def write_face_json(bundle: Path, title: str, spec: dict, seeds: dict) -> Path:
    """Record the art direction so the companion can iterate from the prior prompt."""
    face = bundle / f"{title} — face.json"
    prior = {}
    if face.exists():
        try:
            prior = json.loads(face.read_text())
        except Exception:
            prior = {}
    history = prior.get("history", []) if isinstance(prior, dict) else []
    if prior.get("idiom") or prior.get("hero_prompt") or prior.get("icon_prompt"):
        history.append({k: prior.get(k) for k in ("idiom", "hero_prompt", "icon_prompt", "rendered_at")})
    record = {
        "title": title,
        "idiom": spec.get("idiom", ""),
        "hero_prompt": spec.get("hero_prompt", "") or prior.get("hero_prompt", ""),
        "icon_prompt": spec.get("icon_prompt", "") or prior.get("icon_prompt", ""),
        "seeds": seeds,
        "rendered_at": _now_iso(),
        "history": history[-12:],               # keep the tail bounded
    }
    face.write_text(json.dumps(record, indent=2) + "\n")
    return face


def _now_iso() -> str:
    # A normal script (not a Workflow) — wall-clock is allowed here.
    import datetime
    return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def main(argv) -> int:
    mock = "--mock" in argv
    palace = resolve_palace(argv)
    positionals = []
    skip = False
    for i, a in enumerate(argv):
        if skip:
            skip = False
            continue
        if a == "--palace":
            skip = True
            continue
        if a.startswith("--"):
            continue
        positionals.append(a)
    if not positionals:
        print(json.dumps({"ok": False, "error": "usage: regen_one.py <spec.json> --palace <root> [--mock]"}))
        return 2
    spec = json.loads(Path(positionals[0]).read_text())

    title = spec.get("title", "").strip()
    rel_md = spec.get("path", "").strip()
    target = spec.get("target", "both").strip().lower()
    if not title or not rel_md:
        print(json.dumps({"ok": False, "error": "spec needs title and path"}))
        return 1
    if target not in VALID_TARGETS:
        print(json.dumps({"ok": False, "error": f"target must be one of {sorted(VALID_TARGETS)}"}))
        return 1

    md = palace / rel_md
    if not md.exists():
        print(json.dumps({"ok": False, "error": f"entry md not found: {rel_md}"}))
        return 1
    bundle = md.parent / title
    sides = ["hero", "icon"] if target == "both" else [target]

    # Each requested side needs its prompt.
    for side in sides:
        if not (spec.get(f"{side}_prompt") or "").strip():
            print(json.dumps({"ok": False, "error": f"missing {side}_prompt for target {target}"}))
            return 1

    out_dir = Path(tempfile.mkdtemp(prefix="regen-"))    # intermediate renders (never in git)
    seeds: dict = {}
    ep_obj = None
    key = ep = None
    workers = None
    try:
        if not mock:
            rp = load_client(palace)
            key, ep = creds(palace)
            ep_obj = rp.RunPodEndpoint(endpoint_id=ep, api_key=key,
                                       poll=rp.PollPolicy(total_timeout_seconds=900))
            if EndpointWorkers is not None:
                workers = EndpointWorkers(ep, key); workers.enter()   # ref-counted, multi-agent-safe
            else:
                set_workers(key, ep, 1)                                # fallback: single-tenant scaling
        for side in sides:
            prompt = spec[f"{side}_prompt"].strip() + ANTI_TEXT
            seeds[side] = render_side(ep_obj, out_dir, side, prompt, out_dir / f"{slug(title)}-{side}.png", mock)
    except Exception as ex:
        log(f"render FAILED: {ex}")
        print(json.dumps({"ok": False, "error": f"render failed: {ex}"}))
        return 1
    finally:
        if not mock and key and ep:
            try:
                if workers is not None:
                    workers.exit()              # park to 0 only if I'm the LAST renderer (board ref-count)
                else:
                    set_workers(key, ep, 0)     # fallback: naive park (single-tenant wedge)
            except Exception as ex:
                log(f"WARN: could not park endpoint: {ex}")

    # Place into the bundle, embed the hero, record the sidecar.
    bundle.mkdir(parents=True, exist_ok=True)
    stage: list[str] = []
    hero_rel = icon_rel = None

    def rel(p: Path) -> str:
        return str(p.relative_to(palace))

    for side in sides:
        src = out_dir / f"{slug(title)}-{side}.png"
        dst = bundle / f"{title} — {side}.png"
        shutil.copyfile(src, dst)
        stage.append(rel(dst))
        if side == "hero":
            hero_rel = rel(dst)
        else:
            icon_rel = rel(dst)

    embedded_md = False
    if "hero" in sides:
        embedded_md = embed_hero(md, title)
        if embedded_md:
            stage.append(rel(md))

    face = write_face_json(bundle, title, spec, seeds)
    stage.append(rel(face))

    # Carry forward the non-regenerated side's path (for the UI receipt), if present.
    if hero_rel is None:
        existing = bundle / f"{title} — hero.png"
        if existing.exists():
            hero_rel = rel(existing)
    if icon_rel is None:
        existing = bundle / f"{title} — icon.png"
        if existing.exists():
            icon_rel = rel(existing)

    shutil.rmtree(out_dir, ignore_errors=True)

    result = {
        "ok": True,
        "target": target,
        "hero_rel": hero_rel,
        "icon_rel": icon_rel,
        "stage": stage,
        "embedded_md": embedded_md,
    }
    print(json.dumps(result))                    # the ONLY stdout line
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
