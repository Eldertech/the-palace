"""Matrix runner: (instrument × pitch × adapter × seed) -> results.jsonl.

Usage:
    python3 probe.py --adapter mock          # smoke-test the pipeline
    python3 probe.py --adapter stable_audio  # real SA3 sweep (needs wire-up)

Emits results.jsonl (one row per render) and report.html (inline audio
players + cents-error table) into the bundle root.
"""
from __future__ import annotations
import argparse
import importlib
import json
import os
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from verify import verify  # noqa: E402


def load_matrix() -> dict:
    return json.loads((HERE / "matrix.json").read_text())


def load_adapter(name: str):
    return importlib.import_module(f"adapters.{name}")


def run(adapter_name: str, dry_run: bool = False) -> Path:
    matrix = load_matrix()
    adapter = load_adapter(adapter_name)
    out_root = HERE / "samples" / adapter_name
    out_root.mkdir(parents=True, exist_ok=True)
    results_path = HERE / f"results.{adapter_name}.jsonl"

    with results_path.open("w") as out:
        for inst in matrix["instruments"]:
            for pitch in matrix["pitches"]:
                for seed in matrix["seeds"]:
                    fn = f"{inst['name']}_{pitch['name']}_s{seed}.wav"
                    wav_path = str(out_root / fn)
                    t0 = time.time()
                    try:
                        meta = adapter.render(
                            instrument=inst["name"],
                            target_hz=pitch["hz"],
                            seed=seed,
                            out_path=wav_path,
                            **({"note_name": pitch["name"],
                                "prompt_hint": inst["prompt_hint"]}
                               if adapter_name != "mock" else {}),
                        )
                    except NotImplementedError as e:
                        row = {"instrument": inst["name"], "pitch": pitch["name"],
                               "target_hz": pitch["hz"], "seed": seed,
                               "adapter": adapter_name, "status": "not_wired",
                               "note": str(e)}
                        out.write(json.dumps(row) + "\n"); continue
                    render_sec = time.time() - t0
                    v = verify(wav_path, pitch["hz"]) if not dry_run else {}
                    row = {"instrument": inst["name"], "pitch": pitch["name"],
                           "target_hz": pitch["hz"], "seed": seed,
                           "adapter": adapter_name, "wav": wav_path,
                           "render_sec": render_sec, "meta": meta, **v}
                    out.write(json.dumps(row) + "\n")
                    print(f"[{adapter_name}] {inst['name']:8s} {pitch['name']} s{seed}  "
                          f"target={pitch['hz']:.1f}Hz  "
                          f"cents_err={v.get('cents_err')}  voiced={v.get('voiced_pct')}")
    write_report(adapter_name, results_path, matrix)
    return results_path


def write_report(adapter_name: str, results_path: Path, matrix: dict) -> None:
    rows = [json.loads(l) for l in results_path.read_text().splitlines() if l.strip()]
    acc = matrix["acceptance"]
    usable_pct = (sum(1 for r in rows if r.get("usable")) / max(1, len(rows)))
    verdict = ("PASS" if usable_pct >= acc["min_cells_pct"] else "FAIL")
    html = [f"<!doctype html><meta charset='utf-8'>",
            f"<title>AI-source probe · {adapter_name}</title>",
            "<style>body{font:14px/1.4 -apple-system,sans-serif;max-width:1000px;margin:2em auto;padding:0 1em}",
            "table{border-collapse:collapse;width:100%}td,th{border:1px solid #ddd;padding:.4em .6em;text-align:left}",
            ".ok{background:#e8f5e9}.bad{background:#ffebee}.warn{background:#fff8e1}audio{width:180px}</style>",
            f"<h1>AI-source probe — {adapter_name}</h1>",
            f"<p>Cells usable: <b>{usable_pct*100:.0f}%</b> · gate {acc['min_cells_pct']*100:.0f}% · <b>{verdict}</b></p>",
            "<table><tr><th>instrument</th><th>pitch</th><th>seed</th>",
            "<th>target Hz</th><th>measured Hz</th><th>cents err</th>",
            "<th>voiced %</th><th>audio</th></tr>"]
    for r in rows:
        cls = "ok" if r.get("usable") else ("warn" if r.get("voiced_pct", 0) > 0.3 else "bad")
        wav_rel = os.path.relpath(r.get("wav", ""), HERE) if r.get("wav") else ""
        html.append(
            f"<tr class='{cls}'><td>{r['instrument']}</td><td>{r['pitch']}</td>"
            f"<td>{r['seed']}</td><td>{r['target_hz']:.1f}</td>"
            f"<td>{(r.get('measured_hz') or 0):.1f}</td>"
            f"<td>{r.get('cents_err')}</td><td>{r.get('voiced_pct')}</td>"
            f"<td><audio controls src='{wav_rel}'></audio></td></tr>")
    html.append("</table>")
    (HERE / f"report.{adapter_name}.html").write_text("\n".join(html))


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--adapter", default="mock",
                    choices=["mock", "stable_audio", "musicgen", "audioldm2"])
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    p = run(args.adapter, dry_run=args.dry_run)
    print(f"results → {p}")
