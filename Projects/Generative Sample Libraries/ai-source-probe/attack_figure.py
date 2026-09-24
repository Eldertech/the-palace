"""Before/after picture for shape_attacks.py: each sample's waveform as the
model rendered it (grey) over the reshaped one (colour), on one time axis.

    python3 attack_figure.py instruments/violin_bo5/violin_cap5_shaped \
        instruments/marimba_hit_bo3/marimba_hit_shaped instruments/marimba_hit_bo3/marimba_hit_rung

Each argument is an output folder of shape_attacks.py; the source folder is
the same path without the _shaped / _rung suffix.
"""
import json
import sys
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from verify import load_wav  # noqa: E402

outs = [HERE / d for d in sys.argv[1:]]
rows = max(len(json.loads((o / "shaping.json").read_text())["samples"]) for o in outs)
COLOUR = {"bow": "#b5651d", "strike": "#2e6f8e", "ring": "#5a8f3c"}
TITLE = {"bow": "violin — bow: model's first stroke cut, sampler bows it on",
         "strike": "marimba — strike: one hit kept, the roll cut away",
         "ring": "marimba — ring: that hit, rung out by its own partials"}
fig, axes = plt.subplots(rows, len(outs), figsize=(6.5 * len(outs), 1.1 * rows),
                         squeeze=False, sharex="col")
for j, sh in enumerate(outs):
    c = sh.parent / sh.name.rsplit("_", 1)[0]
    info = json.loads((sh / "shaping.json").read_text())
    colour = COLOUR[info["mode"]]
    for ax in axes[len(info["samples"]):, j]:
        ax.set_visible(False)
    for i, (name, s) in enumerate(info["samples"].items()):
        ax = axes[i][j]
        src = c / "samples" / name
        if not src.exists():                      # a re-picked take
            src = next(HERE.glob(f"samples/*/{name}"))
        y, sr = load_wav(str(src))
        z, _ = load_wav(str(sh / "samples" / name))
        start = s.get("cut_start_sec", s.get("kept_strike", {}).get("at_sec", 0))
        t = np.arange(len(y)) / sr
        ax.plot(t, y, color="#bbbbbb", lw=0.4)
        ax.plot(start + np.arange(len(z)) / sr, z, color=colour, lw=0.4)
        ax.set_yticks([]); ax.set_ylim(-1, 1)
        ax.text(0.005, 0.8, name.replace(".wav", ""), transform=ax.transAxes, fontsize=7)
        for sp in ("top", "right", "left"):
            ax.spines[sp].set_visible(False)
    axes[0][j].set_title(TITLE[info["mode"]] + "\ngrey: as MusicGen rendered it · colour: the sample",
                         fontsize=9, loc="left")
    axes[len(info["samples"]) - 1][j].set_xlabel("seconds")
    axes[len(info["samples"]) - 1][j].xaxis.set_tick_params(labelbottom=True)
fig.tight_layout()
out = HERE / "attack-shaping.png"
fig.savefig(out, dpi=130)
print(out.relative_to(HERE))
