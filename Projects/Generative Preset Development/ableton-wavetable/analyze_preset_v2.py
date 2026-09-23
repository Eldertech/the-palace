"""
analyze_preset_v2.py — Track B, with the perceptual blanks filled from the corpus.

v1 prints precise structural facts and refuses to name a character word, emitting
[PERCEPTUAL BAND PENDING: filter cutoff @ 714 Hz] instead. That refusal was right
while nothing grounded the word. The 270-preset factory corpus now does: this
layer rewrites each pending marker into the band that value falls in, relative to
how Ableton's designers actually use the parameter.

It is a wrapper, not a fork — v1 stays the structural source of truth and keeps
its honest refusal. If the ear-pass ever lands, only corpus_bands.py changes.

Usage:  python analyze_preset_v2.py [preset.xml ...]
"""
import re, sys

import analyze_preset as v1
import corpus_bands as cb

MARKER = re.compile(r"\[PERCEPTUAL BAND PENDING: ([^\]]+)\]")

FAMILY = [
    (re.compile(r"filter cutoff @ ([\d.]+) Hz"), "cutoff"),
    (re.compile(r"filter resonance @ ([\d.]+)"), "resonance"),
    (re.compile(r"amp attack @ ([\d.]+)"), "attack"),
    (re.compile(r"amp release @ ([\d.]+)"), "release"),
    (re.compile(r"LFO\d rate @ ([\d.]+)"), "lfo_rate"),
]


def resolve(inner):
    for pat, fam in FAMILY:
        m = pat.search(inner)
        if m:
            name, bucket = cb.band_for(fam, float(m.group(1)))
            return "→ %s (corpus band %d/5, not ear-confirmed)" % (name, bucket)
    return "[PERCEPTUAL BAND PENDING: %s]" % inner


def main():
    slot_kinds = v1.load_slot_kinds()
    targets = sys.argv[1:]
    if not targets:
        import os
        sd = os.path.join(v1.HERE, "decompressed-samples")
        targets = [os.path.join(sd, f) for f in (
            "Synth Pad__Aqueous Pad.xml",
            "Bass__Abdominal Bass.xml",
            "Synth Lead__37th Street.xml",
        )]
    still_pending = 0
    for t in targets:
        desc, _ = v1.describe(t, slot_kinds)
        out = MARKER.sub(lambda m: resolve(m.group(1)), desc)
        still_pending += out.count("PERCEPTUAL BAND PENDING")
        print(out)
        print()
    print("=" * 70)
    print("unresolved perceptual markers after the corpus pass: %d" % still_pending)
    print("bands are usage bands from 270 factory presets — the ear-pass refines the")
    print("split points, not the vocabulary.")


if __name__ == "__main__":
    main()
