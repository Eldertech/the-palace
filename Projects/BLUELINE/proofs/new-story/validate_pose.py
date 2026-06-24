#!/usr/bin/env python3
"""
BLUELINE · NEW STORY — automated POSE VALIDATOR (the autonomous-loop upgrade).

Blind joint-table authoring is slow because the only check was "render in SDXL and look." This reads the
bench's emitted keypoints.json (projected 2D + confidence) and scores each shot against an INTENT spec —
generic checks (figure in-frame, vertical span, centered) plus per-shot relationships (fist near ground,
knees bent below hips, arm extended, figure high in frame). It gives a numeric PASS/WARN signal on the
CHEAP greybox pass, so the loop can self-correct before any SDXL render.

Run (comfy venv): python validate_pose.py            # validates every NS-*_keypoints.json in passes/
"""
import json, os, glob

HERE = os.path.dirname(os.path.abspath(__file__)); P = os.path.join(HERE, "passes")

def dist(a, b): return ((a[0]-b[0])**2 + (a[1]-b[1])**2) ** 0.5

# per-shot intent: name -> fn(kp, W, H) -> bool. kp[i] = [x_px, y_px, conf]. (y grows DOWN in image.)
INTENTS = {
    "NS-02": {  # standing, one arm extended forward/out, full figure upright
        "upright": lambda kp, W, H: kp[0][1] < kp[8][1] < kp[10][1],                 # head above hip above ankle
        "arm_extended": lambda kp, W, H: dist(kp[4], kp[2]) > 0.18 * H,              # R wrist far from R shoulder
    },
    "NS-03": {  # CLOSE on braced legs -> the lower body should dominate the frame
        "legs_in_frame": lambda kp, W, H: all(kp[i][2] > 0.4 for i in (8, 9, 10, 11, 12, 13)),
        "knees_bent": lambda kp, W, H: kp[9][1] < kp[10][1] and kp[12][1] < kp[13][1],  # knees above ankles
        "legs_dominate": lambda kp, W, H: (max(kp[10][1], kp[13][1]) - min(kp[8][1], kp[11][1])) > 0.45 * H,
    },
    "NS-04": {  # plummeting, low angle -> figure HIGH in frame, body roughly vertical/compact
        "high_in_frame": lambda kp, W, H: kp[1][1] < 0.55 * H,                        # neck in upper half
        "in_frame": lambda kp, W, H: sum(kp[i][2] > 0.4 for i in range(14)) >= 11,
    },
    "NS-05": {  # three-point landing -> a planted hand low+central, wide leg stance, knees bent
        "fist_low": lambda kp, W, H: kp[4][1] > 0.62 * H,                             # R wrist in lower third
        "fist_central": lambda kp, W, H: 0.30 * W < kp[4][0] < 0.70 * W,
        "wide_stance": lambda kp, W, H: abs(kp[10][0] - kp[13][0]) > 0.18 * W,        # ankles spread
        "knees_bent": lambda kp, W, H: kp[9][1] < kp[10][1] and kp[12][1] < kp[13][1],
        "head_up": lambda kp, W, H: kp[0][1] < kp[8][1],                              # head above hips (not face-planted)
    },
    "NS-06": {  # intimate close -> head/hands dominate, leaning (head forward-down), arms forward
        "hands_forward_low": lambda kp, W, H: kp[4][1] > kp[1][1] and kp[7][1] > kp[1][1],  # wrists below neck
        "close_framing": lambda kp, W, H: (kp[8][1] - kp[0][1]) > 0.40 * H,           # head-to-hip spans a lot (close)
    },
}

def validate(kpf):
    d = json.load(open(kpf)); W, H = d["width"], d["height"]
    kp = {int(k): v for k, v in d["keypoints"].items()}
    tag = os.path.basename(kpf).replace("_keypoints.json", "")
    body = list(range(14))
    infrac = sum(1 for i in body if kp[i][2] > 0.4) / len(body)
    ys = [kp[i][1] for i in body if kp[i][2] > 0.4]; xs = [kp[i][0] for i in body if kp[i][2] > 0.4]
    vspan = (max(ys) - min(ys)) / H if ys else 0
    cx = (sum(xs) / len(xs)) / W if xs else 0.5
    rows = [("in_frame", round(infrac, 2), infrac >= 0.85),
            ("vert_span", round(vspan, 2), 0.30 <= vspan <= 0.97),
            ("centered", round(cx, 2), 0.30 <= cx <= 0.70)]
    for name, fn in INTENTS.get(tag, {}).items():
        try: ok = bool(fn(kp, W, H)); rows.append((name, ok, ok))
        except Exception as e: rows.append((name, f"err:{repr(e)[:30]}", False))
    npass = sum(1 for _, _, ok in rows if ok)
    print(f"\n{tag}: {npass}/{len(rows)} checks pass")
    for name, val, ok in rows:
        print(f"   {'PASS' if ok else 'WARN'}  {name:18s} {val}")
    return npass, len(rows)

if __name__ == "__main__":
    files = sorted(glob.glob(os.path.join(P, "NS-*_keypoints.json")))
    if not files: print("no keypoints in passes/ — run the bench first")
    tot_p = tot_n = 0
    for f in files:
        p, n = validate(f); tot_p += p; tot_n += n
    print(f"\nVALIDATE_DONE {tot_p}/{tot_n} checks pass across {len(files)} shots")
