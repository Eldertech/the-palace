"""Fix the attacks the model gets wrong — Loudon's ear notes on gsl-steward-047.

    python3 shape_attacks.py instruments/violin_bo5/violin_cap5 --mode bow
    python3 shape_attacks.py instruments/marimba_bo5/marimba --mode strike

He heard two things. The violin "has an odd attack, but the sustain portion
is violin like." The marimba "sounds like a marimba with a bunch of audio
delays, like there are lots of different attacks instead of a single attack."

Measured before building (cycle 26), both have one cause: MusicGen writes
music, not notes. Asked for a sustained tone it still hands back a clip cut
from the middle of a performance.

  bow     The violin render starts mid-stroke — the first 100 ms is already
          within 5-8 dB of full level, so the sample opens on a cut, not a
          bow. Fix: skip into the steady sustain he liked, and let the
          sampler draw the bow on (ampeg_attack, faster when played harder).
  strike  The marimba render is a phrase: strikes every ~0.5 s. Fix: find
          every strike, keep the one that rings longest before the next
          one lands, cut there with a short fade. One mallet, one note.
  ring    strike, then let it ring. Most marimba strikes only get 0.15-0.3 s
          before the model hits again, too short to sound like a bar. So
          keep the model's mallet attack and hand the ring to a resonator:
          fit the strike's own partials (frequency, level, phase) just
          before the next hit, and let each decay on its own, the lowest
          slowest, the way a bar does. AI strike, palace ring.

Why not fix it in the render: MusicGen's melody guide reaches the model as
one pitch class per frame, one-hot (transformers' MusicgenMelody feature
extractor argmaxes the chroma). Loudness never gets through, so a guide
cannot say "strike once, then fade" — it can only say "this pitch, every
frame", and for a marimba that is a roll. The prompt can't overrule it
either: a one-hit prompt (adapter mgm_struck) found 1 clean strike in 12.

Writes a sibling folder <dir>_shaped/ with the reshaped samples, an SFZ
(same zones and tuning as the source), keycheck.json, shaping.json (what
was cut, per sample), audition.wav, and ab.wav — each kept note played
before-then-after, so the difference is one listen.
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
from build_sfz import (parse_sfz, keycheck, play, note_name, key_hz,  # noqa: E402
                       load_results, sample_name)
from adapters._common import write_wav  # noqa: E402

# bow: the sampler draws the bow on. attack = BOW_ATTACK + BOW_VEL2ATTACK*vel/127
BOW_ATTACK, BOW_VEL2ATTACK = 0.14, -0.10     # soft 140 ms · vel 100 ~61 ms · full 40 ms
BOW_SKIP_MIN = 0.15      # never keep the model's first 150 ms
BOW_WITHIN_DB = 3.0      # start once the level is within 3 dB of the sustain
TAIL_FADE = 0.25         # the model's clip also ends on a cut
# strike: a kept strike must ring at least this long before the next lands
MIN_RING, MAX_PEAK_DROP_DB = 0.30, 9.0


def env_db(y: np.ndarray, sr: int, win: float = 0.02, hop: float = 0.01):
    w, h = int(win * sr), int(hop * sr)
    n = max(1, 1 + (len(y) - w) // h)
    r = np.array([np.sqrt(np.mean(y[i * h:i * h + w] ** 2) + 1e-20) for i in range(n)])
    return 20 * np.log10(r / r.max()), h


def zero_cross_after(y: np.ndarray, i: int, look: int = 400) -> int:
    seg = y[i:i + look]
    z = np.flatnonzero(np.signbit(seg[:-1]) != np.signbit(seg[1:]))
    return i + int(z[0]) + 1 if len(z) else i


def fade(y: np.ndarray, sr: int, fin: float, fout: float) -> np.ndarray:
    y = y.copy()
    a, b = min(len(y), int(fin * sr)), min(len(y), int(fout * sr))
    if a:
        y[:a] *= np.sin(np.linspace(0, math.pi / 2, a)) ** 2
    if b:
        y[-b:] *= np.cos(np.linspace(0, math.pi / 2, b)) ** 2
    return y


def shape_bow(y: np.ndarray, sr: int) -> tuple[np.ndarray, dict]:
    db, h = env_db(y, sr)
    t = np.arange(len(db)) * h / sr
    body = db[(t > 0.5) & (t < t[-1] - 0.3)]
    ref = float(np.median(body)) if len(body) else float(np.median(db))
    ok = np.flatnonzero((t >= BOW_SKIP_MIN) & (db >= ref - BOW_WITHIN_DB))
    start = zero_cross_after(y, int(ok[0] * h) if len(ok) else int(BOW_SKIP_MIN * sr))
    out = fade(y[start:], sr, 0.004, TAIL_FADE)
    return out, {"cut_start_sec": round(start / sr, 3),
                 "first_100ms_db": round(float(db[:10].mean()), 1),
                 "sustain_db": round(ref, 1), "kept_sec": round(len(out) / sr, 2)}


def strikes(y: np.ndarray, sr: int) -> list[int]:
    import librosa
    on = librosa.onset.onset_detect(y=y.astype(np.float32), sr=sr, units="samples",
                                    backtrack=True, delta=0.2)
    on = [int(o) for o in on]
    db, h = env_db(y, sr)
    if db[:3].max() > -6 and (not on or on[0] > int(0.05 * sr)):
        on = [0] + on             # the clip opens mid-ring: that counts as a strike
    return sorted(set(on))


def shape_strike(y: np.ndarray, sr: int) -> tuple[np.ndarray, dict]:
    on = strikes(y, sr)
    ends = on[1:] + [len(y)]
    db, h = env_db(y, sr)
    cands = []
    for s, e in zip(on, ends):
        seg = db[s // h:max(s // h + 1, e // h)]
        peak = float(seg[:6].max())
        tail = float(seg[-10:].mean()) if len(seg) > 12 else peak
        cands.append({"at_sec": round(s / sr, 3), "ring_sec": round((e - s) / sr, 3),
                      "peak_db": round(peak, 1), "decays_db": round(peak - tail, 1),
                      "opens_clip": s == 0})
    # a real strike: loud enough, rings long enough, and actually decays.
    # prefer one the model struck itself over one the clip opened in the middle of
    good = [c for c in cands if c["peak_db"] > -MAX_PEAK_DROP_DB
            and c["ring_sec"] >= MIN_RING and c["decays_db"] >= 4]
    pool = good or cands
    best = max(pool, key=lambda c: (not c["opens_clip"], c["ring_sec"]))
    s = int(best["at_sec"] * sr)
    e = s + int(best["ring_sec"] * sr) - int(0.015 * sr)
    s = max(0, s - int(0.003 * sr))
    seg = y[s:e]
    # onset detection is relative to the whole clip, so a quieter strike can
    # hide inside the kept stretch; look again at the stretch on its own
    # — but only a real hit: the level must jump 4 dB, not just wobble
    sdb, sh = env_db(seg, sr)
    def jumps(o):
        i = min(o // sh, len(sdb) - 1)      # an onset in the last frame
        return sdb[i:i + 6].max() - sdb[max(0, i - 5):i + 1].min() >= 4.0
    later = [o for o in strikes(seg, sr) if o > int(0.05 * sr) and jumps(o)]
    if later:
        seg = seg[:max(int(MIN_RING * sr) // 2, later[0] - int(0.015 * sr))]
    # stop where it has rung out, if it does before the next strike
    sdb, sh = env_db(seg, sr)
    quiet = np.flatnonzero(sdb[5:] < -45)
    if len(quiet):
        seg = seg[:(quiet[0] + 5) * sh]
    out = fade(seg, sr, 0.001, min(0.12, 0.25 * len(seg) / sr))
    shape_strike.last_raw = fade(seg, sr, 0.001, 0.0)
    return out, {"strikes_found": len(on), "kept_strike": best, "clean_pick": bool(good),
                 "kept_sec": round(len(out) / sr, 2)}


RING_PARTIALS, RING_FIT_SEC, RING_XFADE, RING_CENTS = 6, 0.06, 0.02, 40
RING_ONLY_BELOW = 1.2     # s: a strike that already rang this long keeps its own tail
RING_MAX_RESIDUAL = 0.30  # fit worse than this: the tail would be a guess


def ring_tau(f: float, f1: float) -> float:
    """Decay time constant (s) for a partial. A marimba bar's fundamental
    rings about 1.5 s low on the instrument and 0.5 s at the top; higher
    partials die faster (the tuned overtones are damped by the resonator
    tubes being tuned only to the fundamental)."""
    t1 = float(np.clip(1.2 * (262.0 / f1) ** 0.5, 0.35, 2.0))
    return t1 / max(1.0, f / f1) ** 0.8


def ring_out(seg: np.ndarray, sr: int, f1_hint: float | None = None) -> tuple[np.ndarray, dict]:
    """Continue a short strike as a sum of decaying partials fitted to its end."""
    n_fit = int(RING_FIT_SEC * sr)
    splice = len(seg) - int(0.005 * sr)
    if splice - n_fit < int(0.02 * sr):
        return seg, {"ring": "strike too short to fit"}
    w = seg[splice - n_fit:splice]
    spec = np.abs(np.fft.rfft(w * np.hanning(len(w)), 1 << 16))
    freqs = np.fft.rfftfreq(1 << 16, 1 / sr)
    db = 20 * np.log10(spec / spec.max() + 1e-12)
    pk = [i for i in range(2, len(spec) - 1)
          if spec[i] > spec[i - 1] and spec[i] >= spec[i + 1] and db[i] > -40 and freqs[i] > 40]
    fs_all = []
    for i in pk:                                   # parabolic peak interpolation
        a, b, c = db[i - 1], db[i], db[i + 1]
        fs_all.append((freqs[i] + 0.5 * (a - c) / (a - 2 * b + c) * (freqs[1] - freqs[0]), spec[i]))
    # ring only what belongs to the note. The roll leaves other strikes and
    # neighbouring notes in the mix; continuing those would ring a cluster.
    # Keep peaks within RING_CENTS of a whole multiple of the note (n <= 12).
    f1 = f1_hint or max(fs_all, key=lambda x: x[1])[0]
    def on_series(f):
        n = max(1, round(f / f1))
        return n <= 12 and abs(1200 * np.log2(f / (n * f1))) < RING_CENTS
    kept = sorted((x for x in fs_all if on_series(x[0])), key=lambda x: -x[1])[:RING_PARTIALS]
    if not kept:
        return seg, {"ring": "no partial on the note's own series"}
    fs = sorted(f for f, _ in kept)
    dropped = len(fs_all) - len(kept)
    t = np.arange(n_fit) / sr
    M = np.concatenate([np.stack([np.cos(2 * np.pi * f * t), np.sin(2 * np.pi * f * t)], 1)
                        for f in fs], 1)
    coef, *_ = np.linalg.lstsq(M, w, rcond=None)
    fit_err = float(np.sqrt(np.mean((M @ coef - w) ** 2)) / (np.sqrt(np.mean(w ** 2)) + 1e-12))
    taus = [ring_tau(f, f1) for f in fs]
    total = int(sr * min(3.0, 7.0 * max(taus)))    # to about -60 dB
    tt = np.arange(total) / sr                     # time from the start of the fit window
    tail = np.zeros(total)
    splice_t = n_fit / sr
    for k, (f, tau) in enumerate(zip(fs, taus)):
        a, b = coef[2 * k], coef[2 * k + 1]
        env = np.exp(-np.clip(tt - splice_t, 0, None) / tau)
        tail += (a * np.cos(2 * np.pi * f * tt) + b * np.sin(2 * np.pi * f * tt)) * env
    x = int(RING_XFADE * sr)
    start = splice - n_fit
    out = np.concatenate([seg[:start], tail])
    ramp = np.sin(np.linspace(0, np.pi / 2, x)) ** 2   # hand over inside the fit window
    j = n_fit - x
    out[start + j:start + n_fit] = seg[start + j:splice] * (1 - ramp) + tail[j:n_fit] * ramp
    return out, {"partials_hz": [round(f, 1) for f in fs], "peaks_left_to_die": dropped, "tau_sec": [round(x_, 2) for x_ in taus],
                 "fit_residual": round(fit_err, 3), "struck_sec": round(splice / sr, 3),
                 "rung_sec": round(len(out) / sr, 2)}


def retune(z: np.ndarray, sr: int, r: dict) -> dict | None:
    """Measure what the reshaped sample actually sounds, and set the
    region's tune to it. The source tune was measured over the whole 5 s
    take; a kept strike, or a ring fitted to it, can sit 20-30 c away from
    that average (the model drifts across a clip)."""
    want = key_hz(r["pitch_keycenter"]) * 2 ** (-r["tune"] / 1200)
    a, b = analysis_window(z, sr)
    f0, _ = track(z[a:b], sr, want)
    v = np.asarray(f0, dtype=float)
    v = v[np.isfinite(v)]
    if len(v) < 5:
        return None
    hz = refine_hz(z[a:b], sr, float(np.median(v)))
    if not hz or abs(1200 * np.log2(hz / want)) > 60:
        return None
    return {"measured_hz": round(float(hz), 2),
            "tune": int(round(1200 * np.log2(key_hz(r["pitch_keycenter"]) / hz)))}


def holds_pitch(z: np.ndarray, sr: int, hz: float, acc: dict) -> bool:
    """Does the kept strike hold one pitch? A long strike that glides, or
    catches a neighbouring note, rings longest and still plays wrong
    (A#3 in the mid fill: kept 2.18 s, graded texture). Retunable passes:
    retune() moves it onto the key afterwards — but only within 60 c, so a
    strike an octave off fails here (by-played marimba E4: the roll read E4,
    its single strike sounds E3)."""
    a, b = analysis_window(z, sr)
    f0, _ = track(z[a:b], sr, hz)
    g = grade(np.asarray(f0, dtype=float), hz, acc, refine=lambda h, s=z[a:b]: refine_hz(s, sr, h))
    return g["grade"] in ("on_target", "retunable") and not g.get("octave_off")


def write_sfz(path: Path, src_sfz: Path, regions: list[dict], mode: str, notes: dict) -> None:
    env = (f"ampeg_attack={BOW_ATTACK} ampeg_vel2attack={BOW_VEL2ATTACK} ampeg_release=0.35"
           if mode == "bow" else "ampeg_attack=0.001 ampeg_release=0.3")
    lines = [f"// {path.stem} — attacks reshaped from {src_sfz.name} by shape_attacks.py --mode {mode}",
             "// " + ("model's first stroke cut away; the sampler bows the note on "
                      f"({BOW_ATTACK*1000:.0f} ms soft, {(BOW_ATTACK+BOW_VEL2ATTACK)*1000:.0f} ms full velocity)"
                      if mode == "bow" else
                      "one strike kept per sample: the one that rang longest before the model struck again"),
             *(["// then rung out: the strike's own partials fitted just before the model's next hit, "
                "each left to decay (lowest slowest)"] if mode == "ring" else []),
             "// zones and keycenters are the source's; tune is re-measured on each reshaped sample.", "",
             "<control>", "default_path=samples/", "", "<global>",
             f"loop_mode={'no_loop' if mode == 'bow' else 'one_shot'}", "pitch_keytrack=100", env, "",
             "<group>"]
    for r in regions:
        lines.append(f"// {notes[r['sample']]}")
        lines.append(f"<region> sample={r['sample']} lokey={r['lokey']} hikey={r['hikey']} "
                     f"pitch_keycenter={r['pitch_keycenter']} tune={r['tune']} offset=0")
    path.write_text("\n".join(lines) + "\n")


def voice(y, sr, reg, key, secs, mode, vel=100):
    """play() plus the envelope the SFZ asks for, so the audition is honest."""
    out = play(y, sr, reg, key, secs)
    if mode == "bow":
        a = min(len(out), int((BOW_ATTACK + BOW_VEL2ATTACK * vel / 127) * sr))
        out[:a] *= np.linspace(0, 1, a)
    rel = min(len(out), int(0.25 * sr))
    out[-rel:] *= np.cos(np.linspace(0, math.pi / 2, rel)) ** 2
    return out


def render_line(items, sr, gap, ring):
    mix = np.zeros(int((gap * len(items) + ring + 0.5) * sr))
    for i, (y, reg, key, mode) in enumerate(items):
        n = voice(y, sr, reg, key, ring, mode)
        s = int(i * gap * sr)
        mix[s:s + len(n)] += n
    return mix


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("src", help="an instrument folder build_sfz.py wrote")
    ap.add_argument("--mode", choices=["bow", "strike", "ring"], required=True)
    ap.add_argument("--takes", metavar="RUN",
                    help="strike/ring: re-pick each note among every steady take in "
                         "results.RUN.jsonl, by longest clean single strike")
    a = ap.parse_args()
    src = (HERE / a.src).resolve() if not Path(a.src).is_absolute() else Path(a.src)
    src_sfz = next(src.glob("*.sfz"))
    out = src.parent / (src.name + ("_rung" if a.mode == "ring" else "_shaped"))
    if (out / "samples").exists():
        shutil.rmtree(out / "samples")
    (out / "samples").mkdir(parents=True)
    regions = parse_sfz(src_sfz)
    built = json.loads((src / "picks.json").read_text())
    asked = {p["sample"]: p for p in built["regions"]}
    # filed by played key: any take that sounds at this key may compete,
    # whatever note it was asked for
    by_played = built.get("filed_by") == "played"
    acc = json.loads((HERE / "matrix.json").read_text())["acceptance"]
    rows = load_results(a.takes) if a.takes else []
    report, notes, before, after, cut, dropped = {}, {}, {}, {}, {}, {}
    for r in regions:
        holds = True
        y, sr = load_wav(str(src / "samples" / r["sample"]))
        raw = y[r["offset"]:]
        z, info = (shape_bow if a.mode == "bow" else shape_strike)(y, sr)
        if a.mode != "bow":
            raw_cut = shape_strike.last_raw
        if a.mode != "bow" and rows:
            pick = asked[r["sample"]]
            want = lambda rr: key_hz(rr["pitch_keycenter"]) * 2 ** (-rr["tune"] / 1200)
            holds = holds_pitch(z, sr, want(r), acc)
            for row in rows:
                if ((not by_played and row["pitch"] != pick["asked_for"]) or row.get("grade") not in ("on_target", "retunable")
                        or row.get("sfz_keycenter") != r["pitch_keycenter"]):
                    continue
                yy, _ = load_wav(str(HERE / row["wav"]))
                zz, ii = shape_strike(yy, sr)
                hh = holds_pitch(zz, sr, want({**r, "tune": row["sfz_tune"]}), acc)
                if (hh, ii["clean_pick"], ii["kept_sec"]) > (holds, info["clean_pick"], info["kept_sec"]):
                    z, info, holds = zz, {**ii, "from_take": f"{row['pitch']} s{row['seed']}"}, hh
                    r["tune"], raw = row["sfz_tune"], yy
                    r["sample"] = sample_name(row, "+" in a.takes)
                    raw_cut = shape_strike.last_raw
            if by_played and not holds:
                # cut to one strike, no take holds this key (a roll can read an
                # octave above its own strike). Leave the key to the neighbours.
                dropped[r["sample"]] = (f"{note_name(r['pitch_keycenter'])}: no take's single "
                                        "strike holds this key; neighbours cover it")
                continue
        if a.mode == "ring":
            cut[r["sample"]] = z
            if info["kept_sec"] >= RING_ONLY_BELOW:
                ri = {"ring": f"left alone: the model's own strike rang {info['kept_sec']} s"}
            else:
                zz, ri = ring_out(raw_cut, sr, 440.0 * 2 ** ((r["pitch_keycenter"] - 69 - r["tune"] / 100) / 12))
                if ri.get("fit_residual", 1.0) <= RING_MAX_RESIDUAL:
                    z = zz
                else:
                    ri = {**ri, "ring": "fit too loose; kept the plain cut"}
            info = {**info, "ring": ri}
        rt = retune(z, sr, r)
        if rt:
            info = {**info, "retuned": {"from": r["tune"], "to": rt["tune"], "hz": rt["measured_hz"]}}
            r["tune"] = rt["tune"]
        before[r["sample"]] = (raw, sr)
        write_wav(str(out / "samples" / r["sample"]), z, sr)
        after[r["sample"]] = (z, sr)
        report[r["sample"]] = info
        notes[r["sample"]] = (f"cut in at {info['cut_start_sec']} s (model opened at "
                              f"{info['first_100ms_db']} dB, sustain {info['sustain_db']} dB)"
                              if a.mode == "bow" else
                              f"{info['strikes_found']} strikes found; kept the one at "
                              f"{info['kept_strike']['at_sec']} s, rang {info['kept_strike']['ring_sec']} s, "
                              f"kept {info['kept_sec']} s"
                              + (f" (re-picked: take {info['from_take']})" if "from_take" in info else "")
                              + ((f"; {info['ring']['ring']}" if "ring" in info["ring"] else
                                  f"; rung out {info['ring'].get('rung_sec')} s on "
                                  f"{len(info['ring'].get('partials_hz', []))} fitted partials, "
                                  f"fit residual {info['ring'].get('fit_residual')}") if "ring" in info else ""))
    if dropped:
        lo, hi = regions[0]["lokey"], regions[-1]["hikey"]
        regions = [r for r in regions if r["sample"] in after]
        for i, r in enumerate(regions):
            r["lokey"] = lo if i == 0 else (regions[i - 1]["pitch_keycenter"] + r["pitch_keycenter"]) // 2 + 1
            r["hikey"] = hi if i == len(regions) - 1 else (r["pitch_keycenter"] + regions[i + 1]["pitch_keycenter"]) // 2
            r["lokey"], r["hikey"] = min(r["lokey"], r["pitch_keycenter"]), max(r["hikey"], r["pitch_keycenter"])
        for s_, why in dropped.items():
            notes[s_] = f"dropped — {why}"
    sfz = out / f"{src_sfz.stem}{'_rung' if a.mode == 'ring' else '_shaped'}.sfz"
    write_sfz(sfz, src_sfz, regions, a.mode, {k: v for k, v in notes.items() if k in after})
    kc = keycheck(sfz, acc)
    (out / "keycheck.json").write_text(json.dumps(kc, indent=1))
    sr = next(iter(after.values()))[1]
    ring = {"bow": 2.4, "strike": 1.4, "ring": 2.0}[a.mode]
    # the rising line, every 3rd key plus every sample's own key
    keys = sorted(set(range(regions[0]["lokey"], regions[-1]["hikey"] + 1, 3))
                  | {r["pitch_keycenter"] for r in regions})
    items = []
    for k in keys:
        reg = next((r for r in regions if r["lokey"] <= k <= r["hikey"]), None)
        if reg:
            items.append((after[reg["sample"]][0], {**reg, "offset": 0}, k, a.mode))
    write_wav(str(out / "audition.wav"), render_line(items, sr, 0.9 if a.mode == "bow" else 0.5, ring), sr)
    # before → after, each sample at its own key
    ab = []
    for r in regions:
        k = r["pitch_keycenter"]
        ab.append((before[r["sample"]][0], {**r, "offset": 0}, k, "raw"))
        if r["sample"] in cut:
            ab.append((cut[r["sample"]], {**r, "offset": 0}, k, "strike"))
        ab.append((after[r["sample"]][0], {**r, "offset": 0}, k, a.mode))
    write_wav(str(out / "ab.wav"), render_line(ab, sr, ring + 0.4, ring), sr)
    (out / "shaping.json").write_text(json.dumps(
        {"mode": a.mode, "source": str(src_sfz.relative_to(HERE)), "samples": report,
         "dropped": dropped,
         "keycheck": {"on_target": kc["on_target"], "keys_played": kc["keys_played"],
                      "worst_abs_cents_on_target": kc["worst_abs_cents_on_target"]}}, indent=1))
    print(f"{out.relative_to(HERE)}: {kc['on_target']}/{kc['keys_played']} keys on target, "
          f"worst {kc['worst_abs_cents_on_target']}c")
    for s, i in report.items():
        print(f"  {s:24s} {notes[s]}")
    for s, why in dropped.items():
        print(f"  {s:24s} dropped — {why}")


if __name__ == "__main__":
    main()
