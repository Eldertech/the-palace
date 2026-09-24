"""Head-to-head report across arms of the AI-source probe.

    python3 compare.py stable_audio musicgen_melody musicgen_text
    python3 compare.py crystal mock_flawed --out compare.dry-run  # the dry run

Reads results.<arm>.jsonl, writes <out>.html (Loud'n Live Graphite, one
page, inline audio where the WAV lives in this bundle) and <out>.json (the
same verdicts, for the next steward cycle to read without parsing HTML).
"""
from __future__ import annotations
import argparse
import datetime as dt
import html
import json
import os
import statistics as st
from pathlib import Path

HERE = Path(__file__).resolve().parent
GRADES = ["on_target", "retunable", "texture"]
ARM_NOTES = {
    "stable_audio": "Stable Audio 3 small-music · pitch in the prompt only",
    "musicgen_melody": "MusicGen-melody · prompt + sine guide at the target",
    "musicgen_text": "MusicGen-melody · prompt only (the control)",
    "mgm_name": "MusicGen-melody + guide · pitch as a note name (C4)",
    "mgm_hz": "MusicGen-melody + guide · pitch as a frequency (261.63 Hz)",
    "mgm_word": "MusicGen-melody + guide · pitch in plain words (middle C)",
    "mgm_bare": "MusicGen-melody + guide · no pitch words, the guide alone",
    "crystal": "palace reference · the shipped Crystal instrument, exact pitch",
    "mock": "SIMULATED · a perfect harmonic tone",
    "mock_flawed": "SIMULATED · seeded flaws, not a model",
}


def load(arm: str) -> list[dict]:
    p = HERE / f"results.{arm}.jsonl"
    return [json.loads(l) for l in p.read_text().splitlines() if l.strip()]


def verdict(rows: list[dict], need: float) -> tuple[str, dict]:
    n = len(rows)
    c = {g: sum(r.get("grade") == g for r in rows) for g in GRADES}
    c["error"] = n - sum(c.values())
    c["n"] = n
    if n and c["on_target"] / n >= need:
        return "ON TARGET", c
    if n and (c["on_target"] + c["retunable"]) / n >= need:
        return "RETUNABLE", c
    return "TEXTURE ONLY", c


def med(xs):
    xs = [x for x in xs if x is not None]
    return round(st.median(xs), 1) if xs else None


def summarise(arm: str, rows: list[dict], acc: dict) -> dict:
    stable = [r for r in rows if r.get("grade") in ("on_target", "retunable")]
    insts = list(dict.fromkeys(r["instrument"] for r in rows))
    pitches = list(dict.fromkeys(r["pitch"] for r in rows))
    per_inst = {}
    for i in insts:
        v, c = verdict([r for r in rows if r["instrument"] == i], acc["min_cells_pct"])
        per_inst[i] = {"verdict": v, **c}
    v_all, c_all = verdict(rows, acc["min_cells_pct"])
    return {
        "arm": arm, "note": ARM_NOTES.get(arm, ""),
        "simulated": any((r.get("meta") or {}).get("simulated") for r in rows),
        "verdict": v_all, **c_all,
        "median_abs_cents_stable": med([abs(r["cents_err"]) for r in stable]),
        "median_abs_pitch_class_err_stable": med([abs(r["pitch_class_err"]) for r in stable]),
        "octave_slips": sum(1 for r in stable if r.get("octave_off")),
        "median_spread_cents": med([r.get("spread_cents") for r in rows]),
        "median_render_sec": med([r.get("render_sec") for r in rows]),
        "tracker": next((r.get("method") for r in rows if r.get("method")), None),
        "per_instrument": per_inst,
        "per_pitch_median_cents": {p: med([r["cents_err"] for r in stable if r["pitch"] == p])
                                   for p in pitches},
    }


# ── html ─────────────────────────────────────────────────────────────────
CSS = """
:root{--bg:#0a0a0f;--e1:#12121a;--e2:#1a1a28;--bd:#4a4a5e;--soft:rgba(255,255,255,.06);
--f1:#e8e8f0;--f2:#c8c8d8;--f3:#8a8aa0;--acc:#e8b84a;--accs:rgba(232,184,74,.10);
--ok:#00ff66;--oks:rgba(0,255,102,.08);--bad:#ff2a2a;--bads:rgba(255,42,42,.08);
--serif:'Cormorant Garamond',Georgia,serif;--sans:'Manrope',system-ui,-apple-system,sans-serif;
--mono:'JetBrains Mono',ui-monospace,Menlo,monospace;--display:'Anton','Bebas Neue',sans-serif}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--f1);font:17px/1.6 var(--serif)}
main{max-width:1080px;margin:0 auto;padding:40px 24px 64px}
.eyebrow{font:11px var(--mono);letter-spacing:.18em;text-transform:uppercase;color:var(--f3)}
h1{font:52px/1.05 var(--display);letter-spacing:.005em;margin:.2em 0 .1em;text-transform:uppercase}
h2{font:500 28px/1.2 var(--sans);margin:2em 0 .5em}
p{max-width:70ch;color:var(--f2)}
.banner{border:1px solid var(--acc);background:var(--accs);padding:12px 16px;font:14px/1.5 var(--sans);color:var(--f1);margin:20px 0}
table{border-collapse:collapse;width:100%;font:13px/1.4 var(--sans)}
th,td{border:1px solid var(--soft);padding:7px 9px;text-align:left;vertical-align:top}
th{font:11px var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--f3);background:var(--e1)}
td.num{font-family:var(--mono);font-size:12px}
.v{font:11px var(--mono);letter-spacing:.14em;display:block;margin-bottom:2px}
.on_target,.ON-TARGET{background:var(--oks)}.on_target .v,.ON-TARGET .v{color:var(--ok)}
.retunable,.RETUNABLE{background:var(--accs)}.retunable .v,.RETUNABLE .v{color:var(--acc)}
.texture,.TEXTURE-ONLY,.error{background:var(--bads)}.texture .v,.TEXTURE-ONLY .v,.error .v{color:var(--bad)}
.eq{background:var(--e1);border-left:2px solid var(--acc);padding:10px 14px;margin:10px 0;font:13px/1.7 var(--mono);color:var(--f1)}
.eq .w{color:var(--f3)}
details{margin:12px 0;border:1px solid var(--soft);background:var(--e1)}
summary{cursor:pointer;padding:10px 14px;font:500 15px var(--sans)}
audio{width:170px;height:28px}
footer{margin-top:56px;padding-top:16px;border-top:1px solid var(--soft);font:13px var(--sans);color:var(--f3)}
footer b{font-weight:500;color:var(--f2)}footer i{font-weight:300}
"""


def e(x) -> str:
    return html.escape("" if x is None else str(x))


def audio_cell(r: dict) -> str:
    w = r.get("wav") or ""
    if w and not os.path.isabs(w) and (HERE / w).exists():
        return f"<audio controls preload='none' src='{e(w)}'></audio>"
    return "<span class='eyebrow'>not in bundle</span>"


def render_html(summ: list[dict], rows_by_arm: dict, acc: dict, title: str,
                missing: list[str] | None = None) -> str:
    arms = [s["arm"] for s in summ]
    insts = list(dict.fromkeys(i for s in summ for i in s["per_instrument"]))
    simulated = any(s["simulated"] for s in summ)
    out = [f"<!doctype html><html><head><meta charset='utf-8'><title>{e(title)}</title>",
           f"<style>{CSS}</style></head><body><main>",
           "<div class='eyebrow'>Generative Sample Libraries · Phase 3 · AI-source probe</div>",
           f"<h1>{e(title)}</h1>",
           f"<div class='eyebrow'>generated {dt.datetime.now().strftime('%Y-%m-%d %H:%M')} · "
           f"tracker {e(summ[0]['tracker'])}</div>"]
    if simulated:
        sims = ", ".join(s["arm"] for s in summ if s["simulated"])
        out.append(f"<div class='banner'><b>Simulated arms: {e(sims)}.</b> These are mocks, "
                   "not models. Their numbers say nothing about Stable Audio or MusicGen; they "
                   "show that the grader and this page tell the three grades apart. The model "
                   "comparison is compare.html, written on the Mac by run-on-mac.sh.</div>")
    if missing:
        out.append(f"<div class='banner'><b>No results for: {e(', '.join(missing))}.</b> "
                   "Those arms did not render on this run — renders.&lt;arm&gt;.jsonl and "
                   "run-on-mac.log say why.</div>")
    out += ["<p>Each render is asked for one note on one instrument. The grader tracks its "
            "pitch frame by frame and asks two things: <i>did it land where we asked</i>, and "
            "<i>does it hold still</i>. A sampler can fix a wrong note with "
            "<code>pitch_keycenter</code> and <code>tune</code>. It cannot fix a wandering one.</p>",
            "<div class='eq'>stable = voiced ≥ %d%% ∧ spread ≤ %d¢ ∧ dominance ≥ %d%%<br>"
            "<span class='w'>stable = (share of frames that have a pitch) ≥ %d%% ∧ (width of "
            "the middle half of the pitch readings) ≤ %d¢ ∧ (share of frames within ±%d¢ of "
            "their median) ≥ %d%%</span></div>" % (
                acc["min_voiced_pct"] * 100, acc["max_spread_cents"], acc["min_dominance"] * 100,
                acc["min_voiced_pct"] * 100, acc["max_spread_cents"], acc["dominance_band_cents"],
                acc["min_dominance"] * 100),
            "<div class='eq'>on_target = stable ∧ |cents_err| ≤ %d¢ &nbsp;·&nbsp; retunable = "
            "stable ∧ |cents_err| &gt; %d¢ &nbsp;·&nbsp; texture = ¬stable<br><span class='w'>"
            "on_target = stable ∧ |distance from the note we asked for| ≤ %d¢ &nbsp;·&nbsp; "
            "retunable = stable ∧ |distance from the note we asked for| &gt; %d¢, any octave "
            "&nbsp;·&nbsp; texture = ¬stable, not stable</span></div>"
            % (acc["max_cents_err"], acc["max_cents_err"], acc["max_cents_err"], acc["max_cents_err"]),
            "<p>An instrument passes on an arm when %d%% of its cells are on target "
            "(<b>ON TARGET</b>) or at least retunable (<b>RETUNABLE</b>). Below that it is "
            "<b>TEXTURE ONLY</b>: fine for beds, not for a keyboard.</p>" % (acc["min_cells_pct"] * 100)]

    # verdict grid
    out.append("<h2>Verdict by instrument</h2><table><tr><th>instrument</th>")
    out += [f"<th>{e(a)}</th>" for a in arms]
    out.append("</tr>")
    for i in insts:
        out.append(f"<tr><td>{e(i)}</td>")
        for s in summ:
            c = s["per_instrument"].get(i)
            if not c:
                out.append("<td>—</td>")
                continue
            cls = c["verdict"].replace(" ", "-")
            out.append(f"<td class='{cls}'><span class='v'>{e(c['verdict'])}</span>"
                       f"{c['on_target']}/{c['n']} on target · "
                       f"{c['on_target'] + c['retunable']}/{c['n']} steady</td>")
        out.append("</tr>")
    out.append("</table>")

    # arm summary
    out.append("<h2>Arms side by side</h2><table><tr><th></th>")
    out += [f"<th>{e(a)}</th>" for a in arms]
    out.append("</tr>")
    lines = [("what it is", lambda s: s["note"]),
             ("verdict, all cells", lambda s: s["verdict"]),
             ("on target", lambda s: f"{s['on_target']}/{s['n']}"),
             ("retunable", lambda s: f"{s['retunable']}/{s['n']}"),
             ("texture", lambda s: f"{s['texture']}/{s['n']}"),
             ("render errors", lambda s: s["error"]),
             ("median |cents| (steady cells)", lambda s: s["median_abs_cents_stable"]),
             ("median |cents| ignoring octave", lambda s: s["median_abs_pitch_class_err_stable"]),
             ("octave slips", lambda s: s["octave_slips"]),
             ("median spread ¢", lambda s: s["median_spread_cents"]),
             ("median render s", lambda s: s["median_render_sec"])]
    for label, f in lines:
        out.append(f"<tr><th>{e(label)}</th>" + "".join(
            f"<td class='num'>{e(f(s))}</td>" for s in summ) + "</tr>")
    out.append("</table>")

    # per pitch
    pitches = list(dict.fromkeys(p for s in summ for p in s["per_pitch_median_cents"]))
    out.append("<h2>Median cents from target, by pitch (steady cells)</h2>"
               "<table><tr><th>arm</th>" + "".join(f"<th>{e(p)}</th>" for p in pitches) + "</tr>")
    for s in summ:
        out.append(f"<tr><td>{e(s['arm'])}</td>" + "".join(
            f"<td class='num'>{e(s['per_pitch_median_cents'].get(p))}</td>" for p in pitches) + "</tr>")
    out.append("</table>")

    # detail
    out.append("<h2>Every cell</h2><p>Open an arm to hear each render next to its grade. "
               "The last column is the SFZ line a steady render would get.</p>")
    for a in arms:
        out.append(f"<details><summary>{e(a)} · {len(rows_by_arm[a])} cells</summary><table>"
                   "<tr><th>cell</th><th>grade</th><th>measured Hz</th><th>cents</th>"
                   "<th>spread</th><th>voiced</th><th>listen</th><th>sfz</th></tr>")
        for r in rows_by_arm[a]:
            g = r.get("grade", "error")
            sfz = (f"pitch_keycenter={r['sfz_keycenter']} tune={r['sfz_tune']}"
                   if g in ("on_target", "retunable") else "—")
            out.append(
                f"<tr class='{e(g)}'><td>{e(r['instrument'])} {e(r['pitch'])} s{e(r['seed'])}</td>"
                f"<td><span class='v'>{e(g.replace('_', ' '))}</span>{e(r.get('reason'))}</td>"
                f"<td class='num'>{e(r.get('measured_hz'))}</td><td class='num'>{e(r.get('cents_err'))}</td>"
                f"<td class='num'>{e(r.get('spread_cents'))}</td><td class='num'>{e(r.get('voiced_pct'))}</td>"
                f"<td>{audio_cell(r)}</td><td class='num'>{e(sfz)}</td></tr>")
        out.append("</table></details>")

    out.append("<footer><b>Loud’n <i>Live</i></b></footer></main></body></html>")
    return "\n".join(out)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("arms", nargs="+")
    ap.add_argument("--out", default="compare")
    ap.add_argument("--title", default="Head to head")
    a = ap.parse_args()
    acc = json.loads((HERE / "matrix.json").read_text())["acceptance"]
    arms = [x for x in a.arms if (HERE / f"results.{x}.jsonl").exists()]
    missing = sorted(set(a.arms) - set(arms))
    if missing:
        print(f"skipping arms with no results yet: {', '.join(missing)}")
    if not arms:
        raise SystemExit("no results to compare")
    rows_by_arm = {x: load(x) for x in arms}
    summ = [summarise(x, rows_by_arm[x], acc) for x in arms]
    (HERE / f"{a.out}.json").write_text(json.dumps(
        {"generated": dt.datetime.now().isoformat(timespec="seconds"),
         "acceptance": acc, "arms": summ, "missing_arms": missing}, indent=2) + "\n")
    (HERE / f"{a.out}.html").write_text(render_html(summ, rows_by_arm, acc, a.title, missing))
    for s in summ:
        print(f"{s['arm']:16s} {s['verdict']:12s} on-target {s['on_target']}/{s['n']}  "
              f"retunable {s['retunable']}  texture {s['texture']}  errors {s['error']}")
    print(f"→ {a.out}.html, {a.out}.json")


if __name__ == "__main__":
    main()
