"""
corpus_bands.py — provisional perceptual bands mined from the 270-preset factory corpus.

The honest framing: these are **usage bands**, not perception bands. The split
points are the 20/40/60/80th percentiles of how Ableton's own sound designers set
that parameter across 270 shipping presets. The band *names* come from the
by-ear worksheet (closed/dark/open/bright, punchy/natural/soft/swell, …), so when
Loudon's ear-pass happens the splits get replaced in place and the vocabulary
does not move.

Why percentiles and not the numeric midpoint: the raw range is misleading.
Filter cutoff runs 20 Hz – 20.5 kHz, but the factory median is 954 Hz — the
musically used region is the bottom sixth of the knob. Splitting the *range*
evenly would call almost everything "closed"; splitting the *corpus* puts the
boundaries where designers actually hear a change of character.
"""
import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
STATS = os.path.join(HERE, "profile-draft", "wavetable_corpus_stats_v0.1.json")

# band vocabulary per parameter family, low→high (from perceptual-bands-worksheet.md)
VOCAB = {
    "cutoff":     ["closed", "dark", "warm", "open", "bright"],
    "resonance":  ["flat", "coloured", "singing", "screaming", "self-osc-edge"],
    "attack":     ["clicky", "punchy", "natural", "soft", "swell"],
    "release":    ["gated", "short", "natural", "long", "tail"],
    "lfo_rate":   ["imperceptible", "drifting", "subtle", "obvious", "fast"],
}

PARAM_FOR = {
    "cutoff": "Voice_Filter1_Frequency",
    "resonance": "Voice_Filter1_Resonance",
    "attack": "Voice_Modulators_AmpEnvelope_Times_Attack",
    "release": "Voice_Modulators_AmpEnvelope_Times_Release",
    "lfo_rate": "Voice_Modulators_Lfo1_Time_Rate",
}

_stats = None


def stats():
    global _stats
    if _stats is None:
        with open(STATS) as f:
            _stats = json.load(f)["parameters"]
    return _stats


def splits(family):
    return stats()[PARAM_FOR[family]]["quintiles"]


def band_for(family, value):
    """Return (band_name, percentile_bucket 1..5) for a raw parameter value."""
    s = splits(family)
    names = VOCAB[family]
    i = 0
    for i, sp in enumerate(s):
        if value < sp:
            return names[i], i + 1
    return names[len(s)], len(s) + 1


def label(family, value):
    name, bucket = band_for(family, value)
    return "%s [corpus band %d/5, from 270 factory presets — not ear-confirmed]" % (name, bucket)


def table():
    """Rows for display: family, the four split points, the five band names."""
    rows = []
    for fam in ("cutoff", "resonance", "attack", "release", "lfo_rate"):
        s = splits(fam)
        rows.append({
            "family": fam,
            "parameter": PARAM_FOR[fam],
            "splits": s,
            "bands": VOCAB[fam],
            "median": stats()[PARAM_FOR[fam]]["median"],
        })
    return rows


if __name__ == "__main__":
    for r in table():
        edges = " | ".join("%.4g" % x for x in r["splits"])
        print("%-10s %-46s splits: %s" % (r["family"], r["parameter"], edges))
        print("           bands: " + " < ".join(r["bands"]))
