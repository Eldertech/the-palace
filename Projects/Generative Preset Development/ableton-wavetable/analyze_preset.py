"""
analyze_preset.py — Track B (Analysis), first runnable pass.

The project's forward vector names three tracks: generation (prompt -> preset),
analysis (preset -> plain-language description), and modification. Cycles 1-3
built the read path, the corpus profile, the modulation-slot census, and the
write-path proof. This is the first implementation of Track B: read a factory
.adv (decompressed to XML) and emit the description a skilled synthesist would
give it — oscillator architecture, filter approach, envelope character, LFO
behaviour, unison, and the live modulation routings named by source KIND.

Honesty rule baked in: the profile's perceptual_regions are still null (that is
the by-ear work gated behind the Trickster audition). So wherever a perceptual
band label belongs ("dark / open / bright" for cutoff, "punchy / pad" for
attack) the analyzer prints the precise structural fact AND a [PERCEPTUAL BAND
PENDING] marker instead of inventing a word. The set of markers a run emits is
exactly the list of regions the next by-ear pass needs to label — analysis
teaching generation, as the home entry says.

Source identities are reported as KINDS from the corpus census
(profile-draft/mod_slot_census.json), never as ear-confirmed 1:1 labels.

Run from ableton-wavetable/ :  python3 analyze_preset.py "decompressed-samples/Synth Pad__Aqueous Pad.xml"
                              python3 analyze_preset.py            # describes a default trio
"""
import xml.etree.ElementTree as ET
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
CENSUS_PATH = os.path.join(HERE, "profile-draft", "mod_slot_census.json")

# Source-slot KIND inferred from the corpus census, not ear-confirmed. Loaded
# from the census file so the two artifacts can never drift.
def load_slot_kinds():
    try:
        c = json.load(open(CENSUS_PATH))
    except FileNotFoundError:
        return {}
    kinds = {}
    for row in c["census"]:
        kinds[row["slot"]] = (row["candidate_label"], row["inferred_kind"])
    return kinds


def manual(root, tag):
    """Value of <Manual> under the first element named `tag`, else the element's own Value."""
    for el in root.iter(tag):
        m = el.find("Manual")
        if m is not None:
            return m.attrib.get("Value")
        return el.attrib.get("Value")
    return None


def fnum(v, default=None):
    try:
        return float(v)
    except (TypeError, ValueError):
        return default


def on(root, tag):
    return str(manual(root, tag)).lower() == "true"


def describe(path, slot_kinds):
    root = ET.parse(path).getroot()
    name = os.path.basename(path).replace(".xml", "")
    lines = []
    pending = []

    def band(label):
        pending.append(label)
        return "[PERCEPTUAL BAND PENDING: %s]" % label

    lines.append("PRESET: %s" % name)

    # --- Oscillators ---
    osc_bits = []
    for n in (1, 2):
        if on(root, "Voice_Oscillator%d_On" % n):
            det = fnum(manual(root, "Voice_Oscillator%d_Pitch_Detune" % n), 0) or 0
            trn = fnum(manual(root, "Voice_Oscillator%d_Pitch_Transpose" % n), 0) or 0
            pos = fnum(manual(root, "Voice_Oscillator%d_Wavetables_WavePosition" % n))
            piece = "Osc%d on (wave position %s, transpose %+g st, detune %+g)" % (
                n, ("%.3f" % pos if pos is not None else "?"), trn, det)
            osc_bits.append(piece)
    if on(root, "Voice_SubOscillator_On"):
        sub_t = fnum(manual(root, "Voice_SubOscillator_Transpose"), 0)
        osc_bits.append("sub osc on (transpose %+g st)" % (sub_t or 0))
    if not osc_bits:
        osc_bits.append("no oscillators enabled (unusual)")
    lines.append("  SOURCE: " + "; ".join(osc_bits))

    # --- Filters ---
    for n in (1, 2):
        if not on(root, "Voice_Filter%d_On" % n):
            continue
        freq = fnum(manual(root, "Voice_Filter%d_Frequency" % n))
        res = fnum(manual(root, "Voice_Filter%d_Resonance" % n))
        drive = fnum(manual(root, "Voice_Filter%d_Drive" % n))
        circuit_lphp = manual(root, "Voice_Filter%d_CircuitLpHp" % n)
        ftype = manual(root, "Voice_Filter%d_Type" % n)
        # Structural facts are precise; the "dark/open/bright" word is gated by-ear.
        freq_txt = ("%.0f Hz %s" % (freq, band("filter cutoff @ %.0f Hz" % freq))) if freq is not None else "?"
        res_txt = ("%.3f %s" % (res, band("filter resonance @ %.3f" % res))) if res is not None else "?"
        lines.append(
            "  FILTER %d: type idx %s / circuit-LpHp idx %s [enum semantics not yet cross-referenced]; "
            "cutoff %s; resonance %s; drive %s"
            % (n, ftype, circuit_lphp, freq_txt, res_txt,
               ("%.3f" % drive if drive is not None else "?")))
    routing = manual(root, "Voice_Global_FilterRouting")
    if routing is not None:
        rmap = {"0": "serial", "1": "parallel", "2": "split"}
        lines.append("  FILTER ROUTING: idx %s (%s) [documented option, not ear-confirmed]"
                     % (routing, rmap.get(str(routing), "?")))

    # --- Amp envelope (shape, the part we can read precisely) ---
    a = fnum(manual(root, "Voice_Modulators_AmpEnvelope_Times_Attack"))
    d = fnum(manual(root, "Voice_Modulators_AmpEnvelope_Times_Decay"))
    s = fnum(manual(root, "Voice_Modulators_AmpEnvelope_Sustain"))
    rel = fnum(manual(root, "Voice_Modulators_AmpEnvelope_Times_Release"))
    lines.append(
        "  AMP ENV: attack %s %s, decay %s, sustain %s, release %s %s"
        % (fmt(a), band("amp attack @ %s" % fmt(a)), fmt(d), fmt(s), fmt(rel),
           band("amp release @ %s" % fmt(rel))))

    # --- LFOs ---
    for n in (1, 2):
        ltype = manual(root, "Voice_Modulators_Lfo%d_Shape_Type" % n)
        sync = manual(root, "Voice_Modulators_Lfo%d_Time_Sync" % n)
        rate = fnum(manual(root, "Voice_Modulators_Lfo%d_Time_Rate" % n))
        amt = fnum(manual(root, "Voice_Modulators_Lfo%d_Shape_Amount" % n))
        if ltype is None:
            continue
        synced = str(sync) in ("1", "true", "True")
        lines.append(
            "  LFO %d: shape idx %s [enum not cross-referenced], %s, rate %s %s, depth %s"
            % (n, ltype, ("tempo-synced" if synced else "free-running"),
               ("%.4f" % rate if rate is not None else "?"),
               band("LFO%d rate @ %s" % (n, ("%.4f" % rate if rate is not None else "?"))),
               ("%.3f" % amt if amt is not None else "?")))

    # --- Unison ---
    umode = manual(root, "Voice_Unison_Mode")
    uvoices = manual(root, "Voice_Unison_VoiceCount")
    if umode is not None:
        lines.append("  UNISON: mode idx %s, voice count %s [mode enum not cross-referenced]"
                     % (umode, uvoices))

    # --- Live modulation routings (source KIND, never ear-confirmed identity) ---
    routes = []
    for block in root.iter("ModulationConnectionsForInstrumentVector"):
        tn = block.find("TargetName")
        target = tn.attrib.get("Value", "?") if tn is not None else "?"
        for i in range(13):
            amt_el = block.find("ModulationAmounts.%d" % i)
            if amt_el is None:
                continue
            v = fnum(amt_el.attrib.get("Value", "0"), 0)
            if abs(v) > 1e-9:
                cand = slot_kinds.get(i, ("slot %d" % i, ""))[0]
                routes.append("%s <- %s (depth %+.3f)" % (target, cand, v))
    if routes:
        lines.append("  MODULATION (%d live routings; source = census KIND, not ear-confirmed):" % len(routes))
        for rstr in routes[:14]:
            lines.append("      " + rstr)
        if len(routes) > 14:
            lines.append("      ... +%d more" % (len(routes) - 14))
    else:
        lines.append("  MODULATION: no live routings.")

    return "\n".join(lines), pending


def fmt(x):
    if x is None:
        return "?"
    return "%.4f" % x


def main():
    slot_kinds = load_slot_kinds()
    if len(sys.argv) > 1:
        targets = sys.argv[1:]
    else:
        sd = os.path.join(HERE, "decompressed-samples")
        targets = [os.path.join(sd, f) for f in (
            "Synth Pad__Aqueous Pad.xml",
            "Bass__Abdominal Bass.xml",
            "Synth Lead__37th Street.xml",
        )]
    all_pending = []
    for t in targets:
        desc, pending = describe(t, slot_kinds)
        print(desc)
        print()
        all_pending.extend(pending)
    # The pending list IS the by-ear work order for the next perceptual pass.
    uniq = sorted(set(all_pending))
    print("=" * 70)
    print("PERCEPTUAL LABELS THIS RUN COULD NOT WRITE (the by-ear work order):")
    for p in uniq:
        print("  -", p)
    print("\n%d structural facts described; %d distinct perceptual labels still owed by ear."
          % (sum(1 for _ in targets), len(uniq)))


if __name__ == "__main__":
    main()
