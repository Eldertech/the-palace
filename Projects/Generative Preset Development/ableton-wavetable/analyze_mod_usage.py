"""
analyze_mod_usage.py — corpus-wide modulation-slot usage census.

Stage 0 left the modulation source-slot identities as *inferred from a single
preset* (Aqueous Pad): slots 0-5 looked used, 6/10/12 looked empty, and the
13 labels (Env2, Env3, LFO1, LFO2, MIDI-Note, Velocity, Aftertouch, PitchBend,
ModWheel, Random, Note-On-Random, two internal flags) were guessed from that one
usage pattern plus the Ableton manual's documented source list.

This script does the move that needs no Ableton and no ears: it reads ALL 14
decompressed factory presets and tallies, per slot index 0-12, how often that
slot carries a non-zero ModulationAmount and which targets it drives. A slot that
is non-zero across many presets and many targets behaves like an always-available
modulator (LFO/Env); a slot that is empty across the whole corpus behaves like an
internal/constant flag. This turns the slot mapping from one-preset inference into
corpus evidence — without committing the audition gate.

It does NOT confirm the 1:1 label-to-index mapping by ear; only the by-ear
SOURCE-SLOT-AUDIT (route one source to one target in Live, see which index lights)
can do that. What this narrows is *which slots are even plausibly which kind of
source*, so that audit is aimed instead of blind.

Run from the ableton-wavetable/ directory:  python3 analyze_mod_usage.py
"""
import xml.etree.ElementTree as ET
import glob
import json
import os
from collections import defaultdict

N_SLOTS = 13
SAMPLE_DIR = "decompressed-samples"

# The current *candidate* labels carried in wavetable_profile_v0.1.json, so the
# census prints the guess next to the evidence for each slot.
CANDIDATE = {
    0: "Envelope 2",
    1: "Envelope 3",
    2: "LFO 1",
    3: "LFO 2",
    4: "MIDI Note (key tracking)",
    5: "Velocity",
    6: "Aftertouch",
    7: "Pitch Bend",
    8: "Mod Wheel",
    9: "Random (per note)",
    10: "Random (S&H continuous)",
    11: "Constant / internal",
    12: "Constant / internal",
}


def slot_usage_for_file(path):
    """Return {slot_index: set(target_names)} for the non-zero amounts in one preset."""
    tree = ET.parse(path)
    root = tree.getroot()
    used = defaultdict(set)
    for block in root.iter("ModulationConnectionsForInstrumentVector"):
        target_el = block.find("TargetName")
        target = target_el.attrib.get("Value", "?") if target_el is not None else "?"
        for i in range(N_SLOTS):
            amt_el = block.find(f"ModulationAmounts.{i}")
            if amt_el is None:
                continue
            try:
                v = float(amt_el.attrib.get("Value", "0"))
            except ValueError:
                v = 0.0
            if abs(v) > 1e-9:
                used[i].add(target)
    return used


def main():
    files = sorted(glob.glob(os.path.join(SAMPLE_DIR, "*.xml")))
    # presets_with_slot[i] = number of presets that drive slot i at all
    presets_with_slot = defaultdict(int)
    # targets_per_slot[i] = union of all targets ever driven via slot i
    targets_per_slot = defaultdict(set)
    per_file = {}

    for f in files:
        name = os.path.basename(f).replace(".xml", "")
        used = slot_usage_for_file(f)
        per_file[name] = {i: sorted(used[i]) for i in used}
        for i, targets in used.items():
            presets_with_slot[i] += 1
            targets_per_slot[i] |= targets

    n = len(files)
    print(f"Modulation source-slot census across {n} factory presets\n")
    print(f"{'slot':>4}  {'presets_using':>13}  {'distinct_targets':>16}  candidate_label")
    print("-" * 78)
    census = []
    for i in range(N_SLOTS):
        row = {
            "slot": i,
            "candidate_label": CANDIDATE[i],
            "presets_using": presets_with_slot[i],
            "presets_using_pct": round(100 * presets_with_slot[i] / n, 1),
            "distinct_targets": len(targets_per_slot[i]),
            "example_targets": sorted(targets_per_slot[i])[:6],
            "inferred_kind": classify(presets_with_slot[i], n, len(targets_per_slot[i])),
        }
        census.append(row)
        print(f"{i:>4}  {presets_with_slot[i]:>13}  {len(targets_per_slot[i]):>16}  {CANDIDATE[i]}")

    out = {
        "presets_analyzed": [os.path.basename(f) for f in files],
        "n_presets": n,
        "note": (
            "Corpus-wide non-zero ModulationAmount census. A slot driven in many "
            "presets across many targets behaves like an always-on modulator "
            "(Env/LFO); a slot empty across the whole corpus behaves like an "
            "internal/constant flag never user-routed. This narrows the source-slot "
            "identities to KINDS; the 1:1 label-to-index mapping still needs the "
            "by-ear SOURCE-SLOT-AUDIT in Live."
        ),
        "census": census,
        "per_file": per_file,
    }
    with open("profile-draft/mod_slot_census.json", "w") as fh:
        json.dump(out, fh, indent=2)
    print("\nWrote profile-draft/mod_slot_census.json")


def classify(presets_using, n, distinct_targets):
    """Heuristic kind from usage shape — evidence, not ground truth."""
    if presets_using == 0:
        return "never user-routed in corpus -> likely internal/constant flag"
    if presets_using >= max(2, n // 3) and distinct_targets >= 3:
        return "broadly routed -> behaves like an always-available modulator (Env/LFO)"
    return "rarely routed -> performance source (wheel/AT/PB) or a less-used modulator"


if __name__ == "__main__":
    main()
