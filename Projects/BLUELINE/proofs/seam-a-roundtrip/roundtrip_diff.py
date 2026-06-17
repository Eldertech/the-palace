#!/usr/bin/env python3
"""
BLUELINE Seam A — the staging-fidelity DIFF (plain python; no Blender).

Reads roundtrip-realized.json (the Blender realization + reprojected keypoints + the authored staging),
derives the staging frame with the shared module, and diffs REALIZED vs AUTHORED on four dimensions:
facing, shot-size, laterality (limb crossing), eyeline. Where they disagree IS what the 2D->3D transition
lost. Re-runnable/tunable without re-rendering.

Run:  python3 roundtrip_diff.py
"""
import json, os, math, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "..", "staging-skeleton"))
import staging_skeleton as S

BANDS = {"WIDE": (0.30, 0.55), "MS": (0.50, 0.80), "CU": (0.70, 1.00)}

def angle_deg(a, b):
    da = math.hypot(*a) or 1.0; db = math.hypot(*b) or 1.0
    d = max(-1.0, min(1.0, (a[0]*b[0] + a[1]*b[1]) / (da*db)))
    return math.degrees(math.acos(d))

def kx(kp, i):
    v = kp.get(str(i), kp.get(i)); return v[0]

def verdict(shot):
    kp = shot["keypoints"]; W = shot["width"]; H = shot["height"]; A = shot["authored"]
    frame = S.staging_frame(kp, A["facing"])          # the AUTHORED frame (authored facing)
    est = S.facing_from_keypoints(kp)                  # what the realization READS BACK

    # 1) facing fidelity — authored vs read-back
    dfac = abs(A["facing"] - est)
    facing_v = "PASS" if dfac < 0.25 else ("WARN" if dfac < 0.5 else "FAIL")

    # 2) shot-size fidelity — figure-fill vs the grammar's intended band
    lo, hi = BANDS[A["shot"]]; fill = shot["realized"]["figure_fill"]
    size_v = "PASS" if lo <= fill <= hi else ("WARN" if (lo-0.10) <= fill <= (hi+0.10) else "FAIL")

    # 3) laterality — do char-R extremities project to the wrong screen side (limbs crossing)?
    #    front-ish (|facing|<0.5): char-R (2,3,4 / 8,9,10) should sit screen-LEFT of char-L (5,6,7 / 11,12,13).
    pairs = [(3,6), (4,7), (9,12), (10,13)]            # elbows, wrists, knees, ankles (R,L)
    crosses = sum(1 for r, l in pairs if kx(kp, r) > kx(kp, l))
    if abs(A["facing"]) > 0.5:                          # turned away/around: crossing is expected, not a fault
        lr_v = "PASS"
    else:
        lr_v = "PASS" if crosses == 0 else ("WARN" if crosses == 1 else "FAIL")

    # 4) eyeline fidelity — head-yaw direction vs head->authored-target direction
    head = frame["head"]; tgt = [A["eyeline"][0]*W, A["eyeline"][1]*H]
    to_tgt = [tgt[0]-head[0], tgt[1]-head[1]]
    eang = angle_deg(frame["head_facing"], to_tgt)
    eye_v = "PASS" if eang < 35 else ("WARN" if eang < 70 else "FAIL")

    return {
        "facing":     {"authored": A["facing"], "read_back": est, "delta": round(dfac,3), "v": facing_v},
        "shot_size":  {"authored": A["shot"], "fill": fill, "band": [lo,hi], "v": size_v},
        "laterality": {"crossings": crosses, "expected_cross": abs(A["facing"])>0.5, "v": lr_v},
        "eyeline":    {"angle_deg": round(eang,1), "v": eye_v},
        "structural": {"offframe": shot["realized"]["offframe"], "behind": shot["realized"]["behind"]},
    }

def main():
    doc = json.load(open(os.path.join(HERE, "roundtrip-realized.json")))
    tally = {"PASS":0, "WARN":0, "FAIL":0}
    for s in doc["shots"]:
        s["verdict"] = verdict(s)
        for dim in ("facing","shot_size","laterality","eyeline"):
            tally[s["verdict"][dim]["v"]] += 1
    doc["summary"] = {"dimensions_scored": sum(tally.values()), **tally,
                      "note": "Seam-A staging fidelity across facing/shot-size/laterality/eyeline. "
                              "WARN/FAIL on facing in profile is the EXPECTED 2D front/back ambiguity, "
                              "not a bug — it names where the authored board must stay authoritative."}
    json.dump(doc, open(os.path.join(HERE, "roundtrip-report.json"), "w"), indent=2)
    print(f"DIFF {tally['PASS']} PASS / {tally['WARN']} WARN / {tally['FAIL']} FAIL")
    for s in doc["shots"]:
        v = s["verdict"]
        print(f"  {s['id']} {s['pose']:13s}x{s['grammar']:12s} "
              f"facing={v['facing']['v']}(Δ{v['facing']['delta']}) "
              f"size={v['shot_size']['v']}(fill {v['shot_size']['fill']}) "
              f"L/R={v['laterality']['v']}(x{v['laterality']['crossings']}) "
              f"eye={v['eyeline']['v']}({v['eyeline']['angle_deg']}°) "
              f"off={v['structural']['offframe']}")

if __name__ == "__main__":
    main()
