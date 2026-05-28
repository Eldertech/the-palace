"""
extract_profile.py — Stage 0 reconnaissance for Ableton Wavetable.

Given a directory of decompressed Wavetable preset XMLs, extract:
  - The parameter vocabulary (every Voice_* element name, with observed min/max/default)
  - The modulation matrix dimensions (target rows × source slots)
  - The list of modulation targets with their human display names
  - The architectural enums (filter Type, Lfo Type, etc.) with observed value ranges

Outputs profile-draft/wavetable_profile_v0.1.json — first draft of the Synth Profile.

This is reconnaissance, not generation. It produces a structural map of the parameter
space that future cycles will overlay with perceptual region labels by listening.
"""
import os, re, json, sys
from collections import defaultdict

SAMPLES_DIR = os.path.join(os.path.dirname(__file__), "decompressed-samples")
OUT = os.path.join(os.path.dirname(__file__), "profile-draft", "wavetable_profile_v0.1.json")

PARAM_RE = re.compile(
    r"<(Voice_[A-Za-z0-9_]+)>\s*"
    r"(?:<LomId[^/]*/>\s*)?"
    r"<Manual Value=\"([^\"]+)\""
    r".*?"
    r"<MidiControllerRange>\s*"
    r"<Min Value=\"([^\"]+)\"[^/]*/>\s*"
    r"<Max Value=\"([^\"]+)\"[^/]*/>\s*"
    r"</MidiControllerRange>",
    re.DOTALL,
)

# Single-line parameters like <Voice_Oscillator1_Effects_EffectMode Value="3" />
PARAM_SINGLE_RE = re.compile(
    r"<(Voice_[A-Za-z0-9_]+) Value=\"([^\"]+)\"\s*/>"
)

MOD_TARGET_RE = re.compile(
    r'<ModulationConnectionsForInstrumentVector Id="(\d+)" TargetId="([^"]+)">\s*'
    r'<TargetName Value="([^"]+)"'
)


def section_of(name: str) -> str:
    """Group parameter names into architectural sections."""
    n = name.replace("Voice_", "")
    if n.startswith("Oscillator1"):
        return "oscillator_1"
    if n.startswith("Oscillator2"):
        return "oscillator_2"
    if n.startswith("SubOscillator"):
        return "sub_oscillator"
    if n.startswith("Filter1"):
        return "filter_1"
    if n.startswith("Filter2"):
        return "filter_2"
    if "AmpEnvelope" in n:
        return "envelope_amp"
    if "Envelope2" in n:
        return "envelope_2"
    if "Envelope3" in n:
        return "envelope_3"
    if "Lfo1" in n:
        return "lfo_1"
    if "Lfo2" in n:
        return "lfo_2"
    if n.startswith("Unison"):
        return "unison"
    if n.startswith("Global"):
        return "global"
    if n.startswith("Modulators"):
        return "modulators_global"
    return "other"


def analyze():
    presets = []
    for fn in sorted(os.listdir(SAMPLES_DIR)):
        if fn.endswith(".xml"):
            presets.append(fn)
    print(f"Analyzing {len(presets)} presets in {SAMPLES_DIR}")

    # param_data[name] = {"values": [...], "min": [...], "max": [...]}
    param_data = defaultdict(lambda: {"values": [], "min": [], "max": [], "presets_seen_in": []})
    targets_seen = {}  # id -> (target_id, display_name)
    enum_observed = defaultdict(set)  # for single-value params (enum-like)

    for pn in presets:
        with open(os.path.join(SAMPLES_DIR, pn)) as f:
            c = f.read()

        # Full-form params with Manual + Range
        for name, manual, mn, mx in PARAM_RE.findall(c):
            def _coerce(v):
                if v == "true":
                    return 1.0
                if v == "false":
                    return 0.0
                try:
                    return float(v)
                except ValueError:
                    return None
            mv = _coerce(manual)
            mnv = _coerce(mn)
            mxv = _coerce(mx)
            if mv is not None:
                param_data[name]["values"].append(mv)
            if mnv is not None:
                param_data[name]["min"].append(mnv)
            if mxv is not None:
                param_data[name]["max"].append(mxv)
            param_data[name]["presets_seen_in"].append(pn)

        # Single-line params (enum-like, no min/max declared)
        for name, val in PARAM_SINGLE_RE.findall(c):
            if name not in param_data:  # only if not already in full form
                try:
                    enum_observed[name].add(float(val))
                except ValueError:
                    enum_observed[name].add(val)

        # Modulation targets
        for tid, target_id, tname in MOD_TARGET_RE.findall(c):
            targets_seen[int(tid)] = (target_id, tname)

    # Build parameter vocabulary
    vocab = {}
    for name, data in param_data.items():
        vals = data["values"]
        mins = data["min"]
        maxs = data["max"]
        vocab[name] = {
            "section": section_of(name),
            "range_min": min(mins) if mins else None,
            "range_max": max(maxs) if maxs else None,
            "default_observed_in_factory_default": vals[0] if vals else None,
            "observed_value_min": min(vals) if vals else None,
            "observed_value_max": max(vals) if vals else None,
            "observed_value_mean": sum(vals) / len(vals) if vals else None,
            "perceptual_regions": None,  # TO BE FILLED BY EAR
            "appears_in_presets": len(data["presets_seen_in"]),
        }

    # Single-value (enum-like) params
    for name, vals in enum_observed.items():
        vocab[name] = {
            "section": section_of(name),
            "observed_values": sorted(list(vals)),
            "value_kind": "enum_or_flag",
            "perceptual_regions": None,
            "appears_in_presets": None,
        }

    # By-section summary
    by_section = defaultdict(list)
    for name, info in vocab.items():
        by_section[info["section"]].append(name)

    # Modulation matrix
    mod_targets_sorted = [
        {"slot_id": tid, "target_param": tup[0], "display_name": tup[1]}
        for tid, tup in sorted(targets_seen.items())
    ]

    profile = {
        "schema_version": "0.1",
        "synth": "Ableton Wavetable",
        "live_version_observed": "12.4d1",
        "preset_format": {
            "extensions": [".adv"],
            "wrapper_extensions": [".adg"],
            "compression": "gzip",
            "inner_format": "XML (Ableton instrument tree)",
            "root_element": "Ableton",
            "instrument_root": "InstrumentVector",
            "schema_change_count": 1,
        },
        "architecture": {
            "topology": "fixed",
            "oscillators": {
                "wavetable": 2,
                "sub": 1,
                "noise": "via Voice_Modulators_TimeScale / Lfo shape Noise type",
            },
            "filters": 2,
            "envelopes": 3,  # AmpEnvelope, Envelope2, Envelope3
            "lfos": 2,
            "fx_per_oscillator": 2,  # Effect1, Effect2 with EffectMode selector
            "post_fx_chain": False,  # confirmed: no FxSlot elements in default
            "unison_modes": True,
            "filter_routings": "Voice_Global_FilterRouting (serial/parallel/split)",
        },
        "parameter_count_full_form": sum(1 for n in vocab if "value_kind" not in vocab[n]),
        "parameter_count_enum_form": sum(1 for n in vocab if "value_kind" in vocab[n]),
        "parameter_count_total": len(vocab),
        "sections": {s: sorted(names) for s, names in sorted(by_section.items())},
        "parameter_vocabulary": dict(sorted(vocab.items())),
        "modulation_matrix": {
            "shape": "target_rows x source_slots",
            "target_rows": len(mod_targets_sorted),
            "source_slots": 13,
            "source_slot_meaning": {
                "_note": (
                    "Source slot identity is inferred from usage patterns and Ableton's "
                    "documented Wavetable mod-source list — needs ear-confirmation. "
                    "Wavetable's mod sources per Ableton manual are: Env2, Env3, LFO1, "
                    "LFO2, MIDI Note, Velocity, Aftertouch, Pitch Bend, ModWheel, "
                    "Random, Note-On Random, plus internal flag sources."
                ),
                "0_candidate": "Envelope 2",
                "1_candidate": "Envelope 3",
                "2_candidate": "LFO 1",
                "3_candidate": "LFO 2",
                "4_candidate": "MIDI Note (key tracking)",
                "5_candidate": "Velocity",
                "6_candidate": "Aftertouch",
                "7_candidate": "Pitch Bend",
                "8_candidate": "Mod Wheel",
                "9_candidate": "Random (per note)",
                "10_candidate": "Random (S&H continuous)",
                "11_candidate": "Constant / internal",
                "12_candidate": "Constant / internal",
                "confirmation_method": "Compare slot usage against a preset known to use only one mod source.",
            },
            "targets": mod_targets_sorted,
        },
        "presets_analyzed": presets,
        "perceptual_regions_status": "EMPTY — needs by-ear pass in next cycle",
        "next_cycle_actions": [
            "Confirm the 13 source slot identities by auditioning a slot-isolated preset.",
            "Hand-label perceptual regions for the highest-leverage params first: "
            "Voice_Filter1_Frequency (cutoff: closed/dark/open/bright/full-open), "
            "Voice_Modulators_AmpEnvelope_Times_Attack (punchy/soft/pad), "
            "Voice_Modulators_Lfo1_Time_Rate (imperceptible/subtle/obvious/audio-rate), "
            "Voice_Filter1_Resonance (clean/colored/edge/screaming).",
            "Identify architectural enum values for Voice_Filter1_Type, Voice_Oscillator1_Effects_EffectMode, "
            "Voice_Modulators_Lfo1_Shape_Type, Voice_Global_FilterRouting (cross-reference Ableton manual).",
            "Build a tiny writer-side proof: round-trip a preset (decompress → mutate one known parameter "
            "→ recompress → load in Live → confirm change audible) to validate the format-write path.",
        ],
    }

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w") as f:
        json.dump(profile, f, indent=2)

    print(f"\nWrote profile draft: {OUT}")
    print(f"  - {profile['parameter_count_full_form']} full-form params (Manual+Range)")
    print(f"  - {profile['parameter_count_enum_form']} single-value/enum params")
    print(f"  - {len(mod_targets_sorted)} modulation target rows × 13 source slots")
    print(f"  - {len(by_section)} architectural sections: {sorted(by_section.keys())}")


if __name__ == "__main__":
    analyze()
