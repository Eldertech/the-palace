"""Graded probe run -> playable SFZ instrument, one per instrument row.

    python3 build_sfz.py stable_audio --check --audition   # every instrument row
    python3 build_sfz.py musicgen_melody --instrument violin
    python3 build_sfz.py crystal --instrument piano --name reference \\
        --loop-mode one_shot --check --audition           # the shipped proof
    python3 build_sfz.py mock_flawed --out /tmp/x         # anywhere, for tests

Reads results.<arm>.jsonl (what probe.py verify wrote). For each
instrument, for each note we asked for:

  1. keep only renders that hold still (grade on_target or retunable) —
     a sampler can fix a wrong note, it cannot fix a wandering one;
  2. pick the best seed: on target before retunable, then the octave
     nearest the one we asked for, then the steadiest (spread, dominance,
     drift), then the closest pitch class;
  3. place it by the pitch it actually sounds at (the grader's
     sfz_keycenter + sfz_tune), not the pitch we asked for — so a render
     that came out an octave high lands an octave high, retuned.

Keys between samples split at the midpoint. The outermost samples stretch
at most --stretch semitones past their own pitch; wider gaps stay silent
and are reported, never papered over.

Output, per instrument, in instruments/<arm>/<instrument>/:
  <arm>_<instrument>.sfz   the instrument (sforzando, sfizz, Surge XT...)
  samples/*.wav            copies of the chosen renders
  picks.json               what was chosen, what was passed over, and why
  keycheck.json            (--check) every key played + graded
  audition.wav             (--audition) a rising line across the keyboard

--check reads the regions back out of the written .sfz and plays every
mapped key through a small numpy sampler that applies
the same pitch arithmetic an SFZ player does,
    cents = (key - pitch_keycenter) * pitch_keytrack + tune
and grades the result with verify.py against that key's own pitch. It is
a check of the mapping arithmetic, not of how a sampler sounds: resampling
is linear interpolation.
"""
from __future__ import annotations
import argparse
import json
import math
import shutil
import sys
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

from verify import load_wav, analysis_window, track, grade, refine_hz  # noqa: E402
from compare import verdict  # noqa: E402
from adapters._common import write_wav  # noqa: E402

KEY_LO, KEY_HI = 21, 108                 # the 88 keys
STABLE = ("on_target", "retunable")
STRUCK = {"piano", "marimba"}            # ring out past key-up by default

# Responsive-onset trim, same idea as phoneme-choir/generate.py and
# crystal-instrument/generate_full.py (third copy; see DESIGN.md).
ONSET_THRESHOLD_DB = -30.0
ONSET_WINDOW_MS = 5.0
CUSHION_MS = 2.0      # start 2 ms before the onset: model sources have soft,
                      # unknown attacks, so back off rather than step in

NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]


def note_name(midi: int) -> str:
    return f"{NOTE_NAMES[midi % 12]}{midi // 12 - 1}"


def key_hz(midi: int) -> float:
    return 440.0 * 2.0 ** ((midi - 69) / 12.0)


# ── choosing ─────────────────────────────────────────────────────────────
def rank(r: dict) -> tuple:
    return (STABLE.index(r["grade"]), abs(r.get("octave_off") or 0),
            r.get("spread_cents") or 0.0, -(r.get("dominance") or 0.0),
            abs(r.get("drift_cents") or 0.0), abs(r.get("pitch_class_err") or 0.0))


def choose(rows: list[dict]) -> tuple[list[dict], list[dict]]:
    """Best stable seed per asked-for note, then one sample per sounding key."""
    picks, passed = [], []
    for pitch in dict.fromkeys(r["pitch"] for r in rows):
        cells = [r for r in rows if r["pitch"] == pitch]
        stable = sorted((r for r in cells if r.get("grade") in STABLE), key=rank)
        for r in cells:
            if r.get("grade") not in STABLE:
                passed.append({**_brief(r), "why": f"{r.get('grade')}: {r.get('reason', '')}"})
        if not stable:
            continue
        picks.append(stable[0])
        for r in stable[1:]:
            passed.append({**_brief(r), "why": f"seed {stable[0]['seed']} ranked higher"})
    # two notes that came out sounding at the same key: keep the better one
    by_key: dict[int, dict] = {}
    for r in sorted(picks, key=rank):
        k = r["sfz_keycenter"]
        if k in by_key:
            passed.append({**_brief(r), "why": f"sounds at {note_name(k)}, same key as "
                                                f"the {by_key[k]['pitch']} pick"})
        else:
            by_key[k] = r
    return [by_key[k] for k in sorted(by_key)], passed


def _brief(r: dict) -> dict:
    return {"pitch": r["pitch"], "seed": r["seed"], "grade": r.get("grade"),
            "cents_err": r.get("cents_err")}


def zones(keys: list[int], stretch: int) -> list[tuple[int, int]]:
    """Midpoint splits between neighbours, each side capped at stretch."""
    out = []
    for i, k in enumerate(keys):
        lo = max(KEY_LO, k - stretch)
        hi = min(KEY_HI, k + stretch)
        if i > 0:
            lo = max(lo, (keys[i - 1] + k) // 2 + 1)
        if i + 1 < len(keys):
            hi = min(hi, (k + keys[i + 1]) // 2)
        out.append((lo, hi))
    return out


def holes(zs: list[tuple[int, int]]) -> list[str]:
    return [f"{note_name(a[1] + 1)}–{note_name(b[0] - 1)}"
            for a, b in zip(zs, zs[1:]) if b[0] > a[1] + 1]


# ── onset ────────────────────────────────────────────────────────────────
def onset_offset(y: np.ndarray, sr: int) -> int:
    win = max(1, int(sr * ONSET_WINDOW_MS / 1000.0))
    c = np.concatenate(([0.0], np.cumsum(y * y)))
    rms = np.sqrt((c[win:] - c[:-win]) / win)
    above = np.flatnonzero(rms > 10 ** (ONSET_THRESHOLD_DB / 20.0))
    onset = int(above[0]) if len(above) else 0
    return max(0, onset - int(sr * CUSHION_MS / 1000.0))


# ── the small sampler used by --check and --audition ─────────────────────
def play(y: np.ndarray, sr: int, region: dict, key: int, seconds: float) -> np.ndarray:
    cents = (key - region["pitch_keycenter"]) * 100.0 + region["tune"]
    step = 2.0 ** (cents / 1200.0)
    pos = region["offset"] + step * np.arange(int(seconds * sr))
    pos = pos[pos < len(y) - 1]
    out = np.interp(pos, np.arange(len(y)), y)
    fade = min(len(out), int(0.003 * sr))          # the SFZ's ampeg_attack
    out[:fade] *= np.linspace(0.0, 1.0, fade)
    return out


def parse_sfz(path: Path) -> list[dict]:
    """Read the regions back out of the written file, so the check covers
    what is on disk rather than what the writer meant to write. Knows only
    the opcodes this builder emits (<global> keytrack is fixed at 100)."""
    regions = []
    for line in path.read_text().splitlines():
        line = line.split("//")[0].strip()
        if not line.startswith("<region>"):
            continue
        ops = dict(tok.split("=", 1) for tok in line[len("<region>"):].split())
        regions.append({"sample": ops["sample"], "lokey": int(ops["lokey"]),
                        "hikey": int(ops["hikey"]),
                        "pitch_keycenter": int(ops["pitch_keycenter"]),
                        "tune": int(ops.get("tune", 0)), "offset": int(ops.get("offset", 0))})
    return regions


def keycheck(sfz: Path, acc: dict) -> dict:
    regions = parse_sfz(sfz)
    keys = []
    for reg in regions:
        y, sr = load_wav(str(sfz.parent / "samples" / reg["sample"]))
        for key in range(reg["lokey"], reg["hikey"] + 1):
            out = play(y, sr, reg, key, 3.0)
            a, b = analysis_window(out, sr)
            f0, _ = track(out[a:b], sr, key_hz(key))
            g = grade(np.asarray(f0, dtype=float), key_hz(key), acc,
                      refine=lambda hz, s=out[a:b]: refine_hz(s, sr, hz))
            keys.append({"key": key, "note": note_name(key), "from": reg["sample"],
                         "shift_semitones": key - reg["pitch_keycenter"],
                         "grade": g["grade"], "cents_err": g["cents_err"]})
    on = [k for k in keys if k["grade"] == "on_target"]
    worst = max((abs(k["cents_err"]) for k in on), default=None)
    return {"sfz": sfz.name, "keys_played": len(keys), "on_target": len(on),
            "worst_abs_cents_on_target": worst,
            "misses": [k for k in keys if k["grade"] != "on_target"], "keys": keys}


def audition(regions: list[dict], audio: dict, every: int = 5,
             gap: float = 0.55, ring: float = 1.6) -> tuple[np.ndarray, int]:
    sr = next(iter(audio.values()))[1]
    lo, hi = regions[0]["lokey"], regions[-1]["hikey"]
    line = list(range(lo, hi + 1, every))
    keys = sorted(set(line) | {r["pitch_keycenter"] for r in regions})
    mix = np.zeros(int((gap * len(keys) + ring + 0.5) * sr))
    rel = np.cos(np.linspace(0.0, math.pi / 2, int(0.25 * sr))) ** 2
    for i, key in enumerate(keys):
        reg = next(r for r in regions if r["lokey"] <= key <= r["hikey"])
        y, _ = audio[reg["sample"]]
        note = play(y, sr, reg, key, ring)
        n = min(len(note), len(rel))
        note[-n:] *= rel[-n:]
        start = int(i * gap * sr)
        mix[start:start + len(note)] += note
    return mix, sr


# ── writing ──────────────────────────────────────────────────────────────
def build_one(arm: str, inst: str, rows: list[dict], out_dir: Path, acc: dict,
              stretch: int, do_check: bool, do_audition: bool,
              loop_mode: str = "no_loop") -> dict:
    v, counts = verdict(rows, acc["min_cells_pct"])
    picks, passed = choose(rows)
    summary = {"arm": arm, "instrument": inst, "probe_verdict": v,
               "cells": counts, "notes_kept": len(picks)}
    if not picks:
        return {**summary, "built": False,
                "why": "no render of any note held a steady pitch"}

    inst_dir = out_dir / inst
    smp_dir = inst_dir / "samples"
    if smp_dir.exists():
        shutil.rmtree(smp_dir)
    smp_dir.mkdir(parents=True)
    zs = zones([p["sfz_keycenter"] for p in picks], stretch)
    regions, audio = [], {}
    for p, (lo, hi) in zip(picks, zs):
        src = Path(p["wav"]) if Path(p["wav"]).is_absolute() else HERE / p["wav"]
        name = src.name
        shutil.copy2(src, smp_dir / name)
        y, sr = load_wav(str(src))
        audio[name] = (y, sr)
        regions.append({"sample": name, "lokey": lo, "hikey": hi,
                        "pitch_keycenter": p["sfz_keycenter"], "tune": p["sfz_tune"],
                        "offset": onset_offset(y, sr),
                        "asked_for": p["pitch"], "seed": p["seed"], "grade": p["grade"],
                        "cents_err": p["cents_err"], "measured_hz": p["measured_hz"]})
    gaps = holes(zs)
    all_pitches = list(dict.fromkeys(r["pitch"] for r in rows))
    missing = [x for x in all_pitches if x not in {p["pitch"] for p in picks}]

    sfz = inst_dir / f"{arm}_{inst}.sfz"
    head = [
        f"// {arm} · {inst} — built from the AI-source probe's graded run",
        f"// source: ai-source-probe/results.{arm}.jsonl  ·  builder: build_sfz.py",
        f"// probe verdict for this instrument: {v}  "
        f"(on target {counts['on_target']}, retunable {counts['retunable']}, "
        f"texture {counts['texture']}, of {counts['n']} cells)",
        f"// kept {len(picks)} of {len(all_pitches)} notes asked for"
        + (f"; no steady render of {', '.join(missing)}" if missing else ""),
        f"// keys {note_name(regions[0]['lokey'])}–{note_name(regions[-1]['hikey'])}; "
        f"outer samples stretch at most {stretch} semitones"
        + (f"; silent gaps: {', '.join(gaps)}" if gaps else "; no silent gaps"),
        "// pitch = the grader's measured pitch (keycenter + tune), not the note asked for.",
        f"// onset trim {ONSET_THRESHOLD_DB:.0f} dBFS, {CUSHION_MS:.0f} ms cushion; 3 ms fade-in.",
        "",
        "<control>",
        "default_path=samples/",
        "",
        "<global>",
        f"loop_mode={loop_mode}",
        "pitch_keytrack=100",
        "ampeg_attack=0.003 ampeg_release=0.4",
        "",
        "<group>",
    ]
    body = []
    for r in regions:
        tag = r["grade"].replace("_", " ")
        note = (f"asked {r['asked_for']}, seed {r['seed']}, {tag}, "
                f"{r['cents_err']:+.1f}c from asked")
        body.append(f"// {note}")
        body.append(f"<region> sample={r['sample']} lokey={r['lokey']} hikey={r['hikey']} "
                    f"pitch_keycenter={r['pitch_keycenter']} tune={r['tune']} "
                    f"offset={r['offset']}")
    sfz.write_text("\n".join(head + body) + "\n")

    result = {**summary, "built": True, "sfz": sfz.name,
              "keys": [note_name(regions[0]["lokey"]), note_name(regions[-1]["hikey"])],
              "silent_gaps": gaps, "notes_missing": missing,
              "regions": regions, "passed_over": passed}
    if do_check:
        kc = keycheck(sfz, acc)
        (inst_dir / "keycheck.json").write_text(json.dumps(kc, indent=1))
        result["keycheck"] = {k: kc[k] for k in ("keys_played", "on_target",
                                                  "worst_abs_cents_on_target")}
        result["keycheck"]["misses"] = [f"{m['note']} {m['grade']} {m['cents_err']}"
                                        for m in kc["misses"]]
    if do_audition:
        mix, sr = audition(regions, audio)
        write_wav(str(inst_dir / "audition.wav"), mix, sr)
        result["audition"] = "audition.wav"
    (inst_dir / "picks.json").write_text(json.dumps(result, indent=1))
    return result


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("arm")
    ap.add_argument("--instrument", action="append",
                    help="build only these rows (repeatable); default every row")
    ap.add_argument("--name", default=None,
                    help="with one --instrument: name the output after this instead")
    ap.add_argument("--out", default=None, help="default instruments/<arm>/")
    ap.add_argument("--stretch", type=int, default=12,
                    help="max semitones an outer sample reaches past its own pitch")
    ap.add_argument("--loop-mode", default=None, choices=["no_loop", "one_shot"],
                    help="no_loop: key-up releases (sustained sources); "
                         "one_shot: the sample rings out (bells, plucks). "
                         f"Default: one_shot for {sorted(STRUCK)}, no_loop otherwise")
    ap.add_argument("--check", action="store_true", help="play + grade every mapped key")
    ap.add_argument("--audition", action="store_true", help="write audition.wav")
    a = ap.parse_args()

    acc = json.loads((HERE / "matrix.json").read_text())["acceptance"]
    res = HERE / f"results.{a.arm}.jsonl"
    rows = [json.loads(l) for l in res.read_text().splitlines() if l.strip()]
    out_dir = Path(a.out) if a.out else HERE / "instruments" / a.arm
    out_dir.mkdir(parents=True, exist_ok=True)
    insts = a.instrument or list(dict.fromkeys(r["instrument"] for r in rows))
    if a.name and len(insts) != 1:
        sys.exit("--name needs exactly one --instrument")
    report = []
    for inst in insts:
        r = build_one(a.arm, a.name or inst, [x for x in rows if x["instrument"] == inst],
                      out_dir, acc, a.stretch, a.check, a.audition,
                      a.loop_mode or ("one_shot" if inst in STRUCK else "no_loop"))
        if a.name:
            r["built_from_row"] = inst
        report.append({k: v for k, v in r.items() if k not in ("regions", "passed_over")})
        line = (f"[{a.arm}] {inst:8s} {r['probe_verdict']:12s} "
                + (f"built {r['sfz']}  {r['keys'][0]}–{r['keys'][1]}  "
                   f"{r['notes_kept']} samples" if r["built"] else f"not built: {r['why']}"))
        if r.get("silent_gaps"):
            line += f"  gaps {r['silent_gaps']}"
        if "keycheck" in r:
            kc = r["keycheck"]
            line += (f"  keycheck {kc['on_target']}/{kc['keys_played']} on target, "
                     f"worst {kc['worst_abs_cents_on_target']}c")
        print(line)
    (out_dir / "build.json").write_text(json.dumps(report, indent=1))


if __name__ == "__main__":
    main()
