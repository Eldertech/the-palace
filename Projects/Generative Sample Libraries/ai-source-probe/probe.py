"""AI-source probe — render and grade one arm of the comparison.

Rendering and grading are separate steps on purpose: each model renders in
its own venv (SA3's, MusicGen's), and grading runs in the probe venv that
has librosa. run-on-mac.sh strings them together.

    python3 probe.py render --adapter stable_audio [--quick]
    python3 probe.py verify --adapter stable_audio
    python3 probe.py run    --adapter mock            # both, one process

Best-of-N (the prompt A/B found takes, not wording, are the lever):

    python3 probe.py render --adapter musicgen_melody --instrument violin \
        --grid 55:91:3 --takes 5 --as violin_bo5
    python3 probe.py verify --adapter musicgen_melody --as violin_bo5
    python3 build_sfz.py violin_bo5 --check --trim --audition

--grid LO:HI:STEP asks for every STEP-th MIDI note from LO to HI instead of
the matrix's four; --takes N renders seeds 1..N per note; --as NAME writes
renders.NAME.jsonl / results.NAME.jsonl / samples/NAME/ so a run never
overwrites an arm's head-to-head files. build_sfz already keeps the best
steady take per note, so best-of-N is just more seeds.

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

ADAPTERS = ["mock", "mock_flawed", "crystal", "stable_audio", "musicgen_melody", "musicgen_text",
            "mgm_name", "mgm_hz", "mgm_word", "mgm_bare",
            "mgm_harm", "mgm_high", "mgm_cfg6", "mgm_struck"]


NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]


def grid_pitches(spec: str) -> list[dict]:
    lo, hi, step = (int(x) for x in spec.split(":"))
    return [{"name": f"{NOTE_NAMES[m % 12]}{m // 12 - 1}",
             "hz": round(440.0 * 2.0 ** ((m - 69) / 12.0), 2), "midi": m}
            for m in range(lo, hi + 1, step)]


def load_matrix(quick: bool = False, instruments: list[str] | None = None,
                grid: str | None = None, takes: int | None = None) -> dict:
    m = json.loads((HERE / "matrix.json").read_text())
    if quick:
        q = m["quick"]
        m["instruments"] = [i for i in m["instruments"] if i["name"] in q["instruments"]]
        m["seeds"] = q["seeds"]
    if instruments:
        m["instruments"] = [i for i in m["instruments"] if i["name"] in instruments]
    else:   # "extra" rows are follow-up tests, run only when named
        m["instruments"] = [i for i in m["instruments"] if not i.get("extra")]
        if not m["instruments"]:
            sys.exit(f"no matrix instrument named {instruments}")
    if grid:
        m["pitches"] = grid_pitches(grid)
    if takes:
        m["seeds"] = list(range(1, takes + 1))
    return m


def _rel(p: Path) -> str:
    try:
        return str(p.resolve().relative_to(HERE))
    except ValueError:
        return str(p.resolve())


def render(adapter_name: str, quick: bool = False, samples_root: str | None = None,
           run_name: str | None = None, resume: bool = False, **pick) -> Path:
    matrix = load_matrix(quick, **pick)
    adapter = importlib.import_module(f"adapters.{adapter_name}")
    run = run_name or adapter_name
    root = Path(samples_root) if samples_root else HERE / "samples"
    out_dir = root / run
    out_dir.mkdir(parents=True, exist_ok=True)
    log = HERE / f"renders.{run}.jsonl"
    cells = [(i, p, s) for i in matrix["instruments"] for p in matrix["pitches"]
             for s in matrix["seeds"]]
    ok = 0
    # --resume keeps every cell already logged ok with its WAV on disk and
    # renders only the rest — a long sweep that dies at take 66 of 300
    # (the first range sweep did) picks up there instead of starting over.
    kept = []
    if resume and log.exists():
        for l in log.read_text().splitlines():
            r = json.loads(l) if l.strip() else None
            if r and r.get("status") == "ok" and (HERE / r["wav"]).exists():
                kept.append(r)
    done = {(r["instrument"], r["pitch"], r["seed"]) for r in kept}
    with log.open("w") as out:
        for r in kept:
            out.write(json.dumps(r) + "\n")
        ok = len(kept)
        if kept:
            print(f"[{adapter_name}] resuming: {ok} cells already rendered, "
                  f"{len(cells) - ok} to go")
        for n, (inst, pitch, seed) in enumerate(cells, 1):
            if (inst["name"], pitch["name"], seed) in done:
                continue
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
                if ok == 0:   # the first cell failing means the arm is not wired
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


def same_sound(wavs: list[str], max_db: float = 1.5) -> float | None:
    """Largest mean dB gap between any two renders' long-term spectra.

    A model asked for eight different notes on two instruments should not
    return one sound eight times. When it does, the arm is broken (the first
    MusicGen run on MPS did exactly this: a flat 11.2 kHz peak on every
    render), and grading those files as 'texture' would blame the model for
    a wiring fault. Returns the largest gap when every pair of renders sits
    within `max_db` of each other, else None. Measured 2026-09-23: the quick
    Stable Audio run spreads to 23 dB, the crystal to 35 dB; one 11.2 kHz
    tone under eight different noises stays within 0.6 dB.
    """
    import numpy as np
    import soundfile as sf
    if len(wavs) < 4:
        return None
    prints = []
    for w in wavs:
        y, sr = sf.read(w, always_2d=True)
        y = y.mean(axis=1)
        spec = np.abs(np.fft.rfft(y * np.hanning(len(y)))) ** 2
        freqs = np.fft.rfftfreq(len(y), 1 / sr)
        edges = np.geomspace(60, min(sr / 2, 16_000), 49)
        bands = np.array([spec[(freqs >= a) & (freqs < b)].mean()
                          for a, b in zip(edges[:-1], edges[1:])])
        db = 10 * np.log10(bands / bands.sum() + 1e-15)
        prints.append(db)
    worst = max(float(np.mean(np.abs(a - b)))
                for i, a in enumerate(prints) for b in prints[i + 1:])
    return worst if worst <= max_db else None


def verify_all(adapter_name: str, run_name: str | None = None) -> Path:
    from verify import verify
    acc = json.loads((HERE / "matrix.json").read_text())["acceptance"]
    run = run_name or adapter_name
    log = HERE / f"renders.{run}.jsonl"
    res = HERE / f"results.{run}.jsonl"
    rows = [json.loads(l) for l in log.read_text().splitlines() if l.strip()]
    ok_wavs = [str(Path(r["wav"]) if os.path.isabs(r["wav"]) else HERE / r["wav"])
               for r in rows if r.get("status") == "ok"]
    suspect = same_sound(ok_wavs) if adapter_name != "crystal" else None
    if suspect is not None:
        print(f"[{adapter_name}] !! every render is the same sound (no two spectra more "
              f"than {suspect:.2f} dB apart) — the arm is broken, not the model. "
              f"Grades below are not a verdict on the model.")
    with res.open("w") as out:
        for r in rows:
            if r.get("status") == "ok":
                wav = Path(r["wav"]) if os.path.isabs(r["wav"]) else HERE / r["wav"]
                r.update(verify(str(wav), r["target_hz"], acc))
            else:
                r.update(grade="error", reason=r.get("error", "render failed"))
            if suspect is not None and r.get("status") == "ok":
                r["suspect"] = "same_sound_every_render"
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
    ap.add_argument("--instrument", action="append", help="only these matrix rows (repeatable)")
    ap.add_argument("--grid", default=None, metavar="LO:HI:STEP",
                    help="MIDI notes LO..HI every STEP, instead of the matrix's four")
    ap.add_argument("--takes", type=int, default=None, help="render seeds 1..N per note")
    ap.add_argument("--resume", action="store_true",
                    help="keep cells already rendered ok in this run's log; render the rest")
    ap.add_argument("--as", dest="run_name", default=None,
                    help="name the run's files after this instead of the adapter")
    a = ap.parse_args()
    if a.step in ("render", "run"):
        render(a.adapter, a.quick, a.samples_root, a.run_name, a.resume,
               instruments=a.instrument, grid=a.grid, takes=a.takes)
    if a.step in ("verify", "run"):
        verify_all(a.adapter, a.run_name)
