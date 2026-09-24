"""How many strikes does each struck render hold? One number per take.

    python3 strike_census.py samples/marimba_bo5 samples/marimba_hit_bo3

A marimba asked for one note should strike once and ring. This counts the
strikes shape_attacks.py would find, and the longest clean ring among them,
so two prompts can be compared by the thing Loudon heard, not by pitch.
"""
import glob
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from verify import load_wav  # noqa: E402
from shape_attacks import strikes, shape_strike  # noqa: E402

for d in sys.argv[1:]:
    rows = []
    for f in sorted(glob.glob(f"{d}/*.wav")):
        y, sr = load_wav(f)
        n = len(strikes(y, sr))
        _, info = shape_strike(y, sr)
        rows.append((Path(f).stem, n, info["kept_sec"], info["clean_pick"]))
        print(f"  {Path(f).stem:22s} strikes {n:3d}   longest clean ring {info['kept_sec']:.2f} s"
              f"{'' if info['clean_pick'] else '   (no clean strike)'}")
    s = np.array([r[1] for r in rows]); k = np.array([r[2] for r in rows])
    print(f"{d}: {len(rows)} takes · median strikes {np.median(s):.0f} · single-strike takes "
          f"{int((s <= 2).sum())} · median ring {np.median(k):.2f} s · ring ≥ 0.8 s {int((k >= 0.8).sum())}")
