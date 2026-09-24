"""The prompt-shape A/B table: per arm, how many renders held a note, how many
of those were the note asked for (any octave, within 50 cents), how many in the right octave.
Same columns as DESIGN.md's first-run table.  python3 ab_table.py [arms...]"""
import json, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
arms = sys.argv[1:] or ["musicgen_melody", "mgm_name", "mgm_hz", "mgm_word", "mgm_bare"]
print(f"{'arm':16s} {'on':>3s} {'ret':>4s} {'tex':>4s} {'stable':>7s} {'right note':>11s} {'right oct':>10s}  passing (75%)")
for a in arms:
    p = HERE / f"results.{a}.jsonl"
    if not p.exists():
        continue
    rows = [json.loads(l) for l in p.read_text().splitlines() if l.strip()]
    st = [r for r in rows if r.get("grade") in ("on_target", "retunable")]
    note = [r for r in st if abs(r.get("pitch_class_err") or 999) <= 50]
    octv = [r for r in note if not r.get("octave_off")]
    g = lambda k: sum(r.get("grade") == k for r in rows)
    passing = []
    for i in dict.fromkeys(r["instrument"] for r in rows):
        ir = [r for r in rows if r["instrument"] == i]
        ok = [r for r in ir if r.get("grade") in ("on_target", "retunable")
              and abs(r.get("pitch_class_err") or 999) <= 50]
        if len(ok) / len(ir) >= 0.75:
            passing.append(i)
    print(f"{a:16s} {g('on_target'):3d} {g('retunable'):4d} {g('texture'):4d} {len(st):7d} "
          f"{len(note):>5d} of {len(st):<3d} {len(octv):10d}  {' '.join(passing) or '—'}")
