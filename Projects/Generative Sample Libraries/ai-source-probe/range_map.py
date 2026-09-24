"""Range map: for each instrument, the note we asked MusicGen for against the
note it played. One panel per instrument; the diagonal is "played what we
asked". Dots off the diagonal by 12 or 24 are right note, wrong octave.

    python3 range_map.py range        # reads results.range.jsonl

Writes range.png (the picture), range.json (per-instrument playable band),
and prints the table. The playable band is the widest run of asked notes
where at least one take held steady in the octave we asked for — the keys
a best-of-N instrument can fill without stretching.
"""
import json
import math
import sys
from collections import defaultdict
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

HERE = Path(__file__).resolve().parent
RUN = sys.argv[1] if len(sys.argv) > 1 else "range"
NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
STEADY = ("on_target", "retunable")


def name(m):
    return f"{NAMES[m % 12]}{m // 12 - 1}"


def midi_of(hz):
    return 69 + 12 * math.log2(hz / 440.0)


rows = [json.loads(l) for l in (HERE / f"results.{RUN}.jsonl").read_text().splitlines() if l.strip()]
by = defaultdict(lambda: defaultdict(list))
for r in rows:
    by[r["instrument"]][r["midi"]].append(r)

order = [i for i in ["piano", "violin", "marimba", "flute", "bass", "choir"] if i in by]
report = {}
for inst in order:
    notes = sorted(by[inst])
    hit = {m: any(x.get("grade") in STEADY and x.get("octave_off") == 0
                  and abs(x.get("pitch_class_err") or 999) <= 50 for x in by[inst][m]) for m in notes}
    best, cur = [], []
    for m in notes:
        cur = cur + [m] if hit[m] else []
        if len(cur) > len(best):
            best = cur
    landed = [midi_of(x["measured_hz"]) for m in notes for x in by[inst][m]
              if x.get("grade") in STEADY and x.get("measured_hz")]
    report[inst] = {
        "asked": [name(notes[0]), name(notes[-1])],
        "playable_band": [name(best[0]), name(best[-1])] if best else None,
        "playable_midi": [best[0], best[-1]] if best else None,
        "right_octave_notes": sum(hit.values()), "notes": len(notes),
        "home": [name(round(min(landed))), name(round(max(landed)))] if landed else None,
        "steady_takes": sum(x.get("grade") in STEADY for m in notes for x in by[inst][m]),
        "takes": sum(len(by[inst][m]) for m in notes),
    }

(HERE / f"{RUN}.json").write_text(json.dumps(report, indent=1) + "\n")
print(f"{'instrument':10s} {'playable band':>16s} {'right-octave':>13s} {'steady':>9s}  lands between")
for inst, r in report.items():
    band = "–".join(r["playable_band"]) if r["playable_band"] else "none"
    print(f"{inst:10s} {band:>16s} {r['right_octave_notes']:>6d}/{r['notes']:<6d} "
          f"{r['steady_takes']:>4d}/{r['takes']:<4d}  {'–'.join(r['home'] or ['?'])}")

cols = 3
fig, axes = plt.subplots(math.ceil(len(order) / cols), cols, figsize=(5.2 * cols, 4.6 * math.ceil(len(order) / cols)),
                         squeeze=False, sharex=True, sharey=True)
lo = min(min(by[i]) for i in order) - 3
hi = max(max(by[i]) for i in order) + 3
for ax, inst in zip(axes.flat, order):
    r = report[inst]
    if r["playable_midi"]:
        ax.axvspan(r["playable_midi"][0] - 1.5, r["playable_midi"][1] + 1.5, color="#5a8f3c", alpha=0.12, lw=0)
    for k, ls in ((0, "-"), (-12, ":"), (-24, ":"), (12, ":")):
        ax.plot([lo, hi], [lo + k, hi + k], ls, color="#999" if k else "#444", lw=0.8)
    for m in sorted(by[inst]):
        for x in by[inst][m]:
            if not x.get("measured_hz"):
                continue
            y = midi_of(x["measured_hz"])
            steady = x.get("grade") in STEADY
            ax.scatter(m, y, s=22, marker="o" if steady else "x",
                       color=("#2e6f8e" if steady else "#c0504d"), alpha=0.85, lw=1)
    band = "–".join(r["playable_band"]) if r["playable_band"] else "none"
    ax.set_title(f"{inst} — plays in the asked octave {band}", fontsize=10)
    ticks = list(range(24, hi + 1, 12))
    ax.set_xticks(ticks, [name(t) for t in ticks])
    ax.set_yticks(ticks, [name(t) for t in ticks])
    ax.set_xlim(lo, hi); ax.set_ylim(lo - 12, hi)
    ax.grid(alpha=0.2)
for ax in axes.flat[len(order):]:
    ax.axis("off")
for ax in axes[-1]:
    ax.set_xlabel("note asked for")
for ax in axes[:, 0]:
    ax.set_ylabel("note it played")
fig.suptitle("MusicGen-melody + sine guide: asked vs played. Solid line = played what we asked; "
             "dotted = an octave off. o steady, x wandering. Green = playable band.", fontsize=10)
fig.tight_layout(rect=(0, 0, 1, 0.96))
fig.savefig(HERE / f"{RUN}.png", dpi=110)
print(f"wrote {RUN}.png, {RUN}.json")
