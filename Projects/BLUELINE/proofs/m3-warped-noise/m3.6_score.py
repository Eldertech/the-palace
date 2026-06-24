#!/usr/bin/env python3
"""
BLUELINE M3.6 — score the DELTA SWEEP and find the crossover. For each delta t, score B_t-seedlock and
B_t-warped against the anchor A with the consistency ruler, then plot consistency vs delta for the two
conditions. The crossover (if any) is where flow-warped noise starts to BEAT seed-lock — the displacement
below which [[The Flow Field is the Spine]] pays for itself.

Run (comfy venv): python3 m3.6_score.py
Outputs: m3.6-sweep.png (embed_cos + color_corr vs delta), m3.6-verdict.json.
"""
import os, sys, json
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "render-backend"))
import consistency_ruler as R

HERE = os.path.dirname(os.path.abspath(__file__))
RD = os.path.join(HERE, "renders-sweep")
man = json.load(open(os.path.join(HERE, "sweep", "sweep-manifest.json")))
A = os.path.join(RD, "A.png")
if not os.path.isfile(A): sys.exit(f"missing anchor {A}")

rows = []
for d in man["deltas"]:
    tag, delta = d["tag"], d["delta_px"]
    bs = os.path.join(RD, f"B_t{tag}_seedlock.png")
    bw = os.path.join(RD, f"B_t{tag}_warped.png")
    es, cs = R.score(A, bs)
    ew, cw = R.score(A, bw)
    rows.append({"t": d["t"], "delta_px": delta, "warp_filled": d.get("warp_filled"),
                 "seedlock": {"embed_cos": es, "color_corr": cs},
                 "warped":   {"embed_cos": ew, "color_corr": cw},
                 "warp_minus_seedlock": {"embed_cos": ew - es, "color_corr": cw - cs}})
    print(f"  delta {delta:6.0f}px | seedlock {es:.3f}/{cs:+.3f} | warped {ew:.3f}/{cw:+.3f} | "
          f"d_embed {ew-es:+.3f} d_color {cw-cs:+.3f}")

rows.sort(key=lambda r: r["delta_px"])
dx = [r["delta_px"] for r in rows]
se = [r["seedlock"]["embed_cos"] for r in rows]; we = [r["warped"]["embed_cos"] for r in rows]
sc = [r["seedlock"]["color_corr"] for r in rows]; wc = [r["warped"]["color_corr"] for r in rows]

# crossover: largest delta where warped >= seedlock on embed_cos
wins = [r["delta_px"] for r in rows if r["warp_minus_seedlock"]["embed_cos"] >= 0]
crossover = max(wins) if wins else None
verdict = (f"warped >= seed-lock up to ~{crossover:.0f}px" if crossover
           else "seed-lock >= warped at every tested delta")
print(f"\nVERDICT: {verdict}")

plt.rcParams.update({"figure.facecolor": "#0c0d10", "axes.facecolor": "#0c0d10",
                     "text.color": "#e6e6e6", "axes.labelcolor": "#e6e6e6",
                     "xtick.color": "#b8b8b8", "ytick.color": "#b8b8b8", "axes.edgecolor": "#3a3a3a"})
fig, ax = plt.subplots(1, 2, figsize=(11, 4.3))
for k, (s, w, ttl) in enumerate([(se, we, "embed_cos (identity / scene — primary)"),
                                  (sc, wc, "color_corr (palette / costume)")]):
    ax[k].plot(dx, s, "-o", color="#5bc8d6", label="seed-lock (N_A reused)")
    ax[k].plot(dx, w, "-o", color="#e0a83a", label="flow-warped (GtF)")
    ax[k].set_title(ttl, fontsize=10); ax[k].set_xlabel("A→B pose delta (px)")
    ax[k].grid(True, color="#23252b"); ax[k].legend(fontsize=8, facecolor="#15171c", edgecolor="#3a3a3a")
    if crossover: ax[k].axvline(crossover, color="#7a7a7a", ls="--", lw=0.8)
fig.suptitle("BLUELINE M3.6 — flow-warped noise vs seed-lock across pose delta", color="#e6e6e6", fontsize=12)
fig.tight_layout(rect=[0, 0, 1, 0.95]); fig.savefig(os.path.join(RD, "m3.6-sweep.png"), dpi=130)

json.dump({"deltas": rows, "crossover_px": crossover, "verdict": verdict},
          open(os.path.join(RD, "m3.6-verdict.json"), "w"), indent=2)
print("WROTE m3.6-sweep.png + m3.6-verdict.json")
print("M36_SCORE_DONE")
