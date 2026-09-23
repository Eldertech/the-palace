"""AI-source probe — render and grade one arm of the comparison.

Rendering and grading are separate steps on purpose: each model renders in
its own venv (SA3's, MusicGen's), and grading runs in the probe venv that
has librosa. run-on-mac.sh strings them together.

    python3 probe.py render --adapter stable_audio [--quick]
    python3 probe.py verify --adapter stable_audio
    python3 probe.py run    --adapter mock            # both, one process

Adapters: crystal (palace reference), mock + mock_flawed (grader tests),
stable_audio, musicgen_melody,
musicgen_text. Output: renders.<adapter>.jsonl, results.<adapter>.jsonl,
WAVs under samples/<adapter>/ (or --samples-root).
"""
from __future__ import annotations
import argparse
import importlib
import json
import os
import sys
import time
import traceback
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

ADAPTERS = ["mock", "mock_flawed", "crystal", "stable_audio", "musicgen_melody", "musicgen_text"]


def load_matrix(quick: bool = False) -> dict:
    m = json.loads((HERE / "matrix.json").read_text())
    if quick:
        q = m["quick"]
        m["instruments"] = [i for i in m["instruments"] if i["name"] in q["instruments"]]
        m["seeds"] = q["seeds"]
    return m


def _rel(p: Path) -> str:
    try:
        return str(p.resolve().relative_to(HERE))
    except ValueError:
        return str(p.resolve())


def render(adapter_name: str, quick: bool = False, samples_root: str | None = None) -> Path:
    matrix = load_matrix(quick)
    adapter = importlib.import_module(f"adapters.{adapter_name}")
    root = Path(samples_root) if samples_root else HERE / "samples"
    out_dir = root / adapter_name
    out_dir.mkdir(parents=True, exist_ok=True)
    log = HERE / f"renders.{adapter_name}.jsonl"
    cells = [(i, p, s) for i in matrix["instruments"] for p in matrix["pitches"]
             for s in matrix["seeds"]]
    ok = 0
    with log.open("w") as out:
        for n, (inst, pitch, seed) in enumerate(cells, 1):
            wav = out_dir / f"{inst['name']}_{pitch['name']}_s{seed}.wav"
            row = {"adapter": adapter_name, "instrument": inst["name"],
                   "pitch": pitch["name"], "target_hz": pitch["hz"],
                   "midi": pitch["midi"], "seed": seed, "wav": _rel(wav)}
            t0 = time.time()
            try:
                meta = adapter.render(instrument=inst["name"], target_hz=pitch["hz"],
                                      seed=seed, out_path=str(wav),
                                      note_name=pitch["name"],
                                      prompt_hint=inst["prompt_hint"])
                row.update(status="ok", meta=meta)
                ok += 1
            except Exception as e:  # one bad cell should not sink a long run
                row.update(status="error", error=f"{type(e).__name__}: {e}")
                if ok == 0 and n == 1:   # the first cell failing means the arm is not wired
                    out.write(json.dumps(row) + "\n")
                    traceback.print_exc()
                    sys.exit(f"[{adapter_name}] first render failed — arm not wired. See {log.name}.")
            row["render_sec"] = round(time.time() - t0, 3)
            out.write(json.dumps(row) + "\n")
            out.flush()
            print(f"[{adapter_name}] {n:3d}/{len(cells)} {inst['name']:8s} {pitch['name']} "
                  f"s{seed}  {row['status']}  {row['render_sec']:.1f}s")
    print(f"[{adapter_name}] rendered {ok}/{len(cells)} → {log.name}")
    return log


def verify_all(adapter_name: str) -> Path:
    from verify import verify
    acc = json.loads((HERE / "matrix.json").read_text())["acceptance"]
    log = HERE / f"renders.{adapter_name}.jsonl"
    res = HERE / f"results.{adapter_name}.jsonl"
    rows = [json.loads(l) for l in log.read_text().splitlines() if l.strip()]
    with res.open("w") as out:
        for r in rows:
            if r.get("status") == "ok":
                wav = Path(r["wav"]) if os.path.isabs(r["wav"]) else HERE / r["wav"]
                r.update(verify(str(wav), r["target_hz"], acc))
            else:
                r.update(grade="error", reason=r.get("error", "render failed"))
            out.write(json.dumps(r) + "\n")
            print(f"[{adapter_name}] {r['instrument']:8s} {r['pitch']} s{r['seed']}  "
                  f"{r.get('grade'):9s} cents={r.get('cents_err')}  {r.get('reason', '')}")
    return res


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("step", choices=["render", "verify", "run"])
    ap.add_argument("--adapter", required=True, choices=ADAPTERS)
    ap.add_argument("--quick", action="store_true", help="2 instruments × 4 pitches × 1 seed")
    ap.add_argument("--samples-root", default=None)
    a = ap.parse_args()
    if a.step in ("render", "run"):
        render(a.adapter, a.quick, a.samples_root)
    if a.step in ("verify", "run"):
        verify_all(a.adapter)
