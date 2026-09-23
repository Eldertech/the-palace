"""
corpus_stats.py — mine the 270 factory Wavetable presets for how the range is
*actually used*, per category.

Why this exists: the profile's `perceptual_regions` have been null since Stage 0,
waiting on a by-ear labelling sitting that has not happened. The factory library
is already a labelled dataset — 270 presets sorted into 12 musical categories by
Ableton's own sound designers. Mining it gives provisional, data-grounded bands
(and per-category parameter clouds) today; the ear-pass refines them later.

Outputs (profile-draft/):
  wavetable_corpus_stats_v0.1.json  — per-parameter global + per-category stats
  wavetable_archetypes_v0.1.json    — per-category parameter clouds (median/IQR)

Nothing here is ear-confirmed. Every band is a usage band, not a perception band.
"""
import gzip, json, os, re, statistics as st
from collections import defaultdict

FACTORY = ("/Applications/Ableton Live 12 Suite.app/Contents/App-Resources/"
           "Core Library/Devices/Instruments/Wavetable")
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "profile-draft")

MANUAL = re.compile(r'<(Voice_[A-Za-z0-9_]+)>\s*(?:<LomId[^/]*/>\s*)?<Manual Value="([^"]+)"')
SHORT  = re.compile(r'<(Voice_[A-Za-z0-9_]+) Value="([^"]+)"\s*/>')


def read(path):
    with gzip.open(path, "rb") as f:
        return f.read().decode("utf-8", "replace")


def params(xml):
    d = {}
    for m in MANUAL.finditer(xml):
        d[m.group(1)] = m.group(2)
    for m in SHORT.finditer(xml):
        d.setdefault(m.group(1), m.group(2))
    return d


def num(v):
    if v in ("true", "false"):
        return 1.0 if v == "true" else 0.0
    try:
        return float(v)
    except ValueError:
        return None


def scan():
    rows = []
    for root, _, files in os.walk(FACTORY):
        cat = os.path.basename(root)
        for fn in sorted(files):
            if fn.endswith(".adv"):
                rows.append((cat, fn[:-4], params(read(os.path.join(root, fn)))))
    return rows


def q(vals, p):
    vals = sorted(vals)
    if not vals:
        return None
    i = p * (len(vals) - 1)
    lo, hi = int(i), min(int(i) + 1, len(vals) - 1)
    return vals[lo] + (vals[hi] - vals[lo]) * (i - lo)


def main():
    rows = scan()
    by_param = defaultdict(list)
    by_cat = defaultdict(lambda: defaultdict(list))
    for cat, name, p in rows:
        for k, v in p.items():
            f = num(v)
            if f is None:
                continue
            by_param[k].append(f)
            by_cat[cat][k].append(f)

    stats = {}
    for k, vals in sorted(by_param.items()):
        uniq = sorted(set(vals))
        entry = {
            "n": len(vals),
            "distinct": len(uniq),
            "min": min(vals), "max": max(vals),
            "median": st.median(vals),
            "quintiles": [q(vals, p) for p in (0.2, 0.4, 0.6, 0.8)],
            "deciles": [q(vals, p) for p in (0.1, 0.9)],
        }
        if len(uniq) <= 8:
            entry["kind"] = "discrete"
            entry["value_histogram"] = {str(u): vals.count(u) for u in uniq}
        else:
            entry["kind"] = "continuous"
        stats[k] = entry

    arche = {}
    for cat, pm in sorted(by_cat.items()):
        n = sum(1 for c, _, _ in rows if c == cat)
        cloud = {}
        for k, vals in sorted(pm.items()):
            if len(vals) < 3:
                continue
            cloud[k] = {
                "median": st.median(vals),
                "p25": q(vals, 0.25), "p75": q(vals, 0.75),
                "n": len(vals),
            }
        arche[cat] = {"preset_count": n, "cloud": cloud}

    os.makedirs(OUT, exist_ok=True)
    with open(os.path.join(OUT, "wavetable_corpus_stats_v0.1.json"), "w") as f:
        json.dump({"source": FACTORY, "presets_scanned": len(rows),
                   "categories": sorted({c for c, _, _ in rows}),
                   "ear_confirmed": False,
                   "note": "usage bands mined from factory presets; NOT perceptual bands confirmed by ear",
                   "parameters": stats}, f, indent=1)
    with open(os.path.join(OUT, "wavetable_archetypes_v0.1.json"), "w") as f:
        json.dump({"source": FACTORY, "ear_confirmed": False,
                   "archetypes": arche}, f, indent=1)
    print(f"scanned {len(rows)} presets · {len(stats)} parameters · {len(arche)} categories")
    for k in ("Voice_Filter1_Frequency", "Voice_Filter1_Resonance",
              "Voice_Modulators_AmpEnvelope_Times_Attack", "Voice_Modulators_Lfo1_Time_Rate"):
        if k in stats:
            s = stats[k]
            print(f"  {k}: median {s['median']:.4g} quintiles {[round(x,4) for x in s['quintiles']]}")


if __name__ == "__main__":
    main()
