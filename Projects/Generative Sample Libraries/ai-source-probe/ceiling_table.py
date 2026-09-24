"""Ceiling table: per arm, on the violin's top four notes (A#5 C#6 E6 G6),
how many of five takes held steady, and how many of those landed in the
octave we asked for. Baseline = the top four rows of results.violin_bo5."""
import json
from pathlib import Path
HERE = Path(__file__).resolve().parent
TOP = ["A#5", "C#6", "E6", "G6"]
ARMS = [("baseline (sine, cfg 3)", "violin_bo5"), ("harmonic guide", "ceil_mgm_harm"),
        ("'highest register' prompt", "ceil_mgm_high"), ("guidance 6", "ceil_mgm_cfg6")]
print(f"{'arm':28s} " + " ".join(f"{n:>9s}" for n in TOP) + "   right-octave total")
for label, run in ARMS:
    p = HERE / f"results.{run}.jsonl"
    if not p.exists():
        continue
    rows = [json.loads(l) for l in p.read_text().splitlines() if l.strip()]
    cells, tot = [], 0
    for n in TOP:
        r = [x for x in rows if x["pitch"] == n]
        st = [x for x in r if x.get("grade") in ("on_target", "retunable")]
        ok = [x for x in st if not x.get("octave_off") and abs(x.get("pitch_class_err") or 999) <= 50]
        tot += len(ok)
        cells.append(f"{len(ok)}/{len(st)}/{len(r)}")
    print(f"{label:28s} " + " ".join(f"{c:>9s}" for c in cells) + f"   {tot}")
print("\ncells read right-octave / steady / takes")
