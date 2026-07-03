#!/usr/bin/env python3
"""
BLUELINE cloud-I2V — the verdict. Measure each SVD clip's DRIFT DIRECTION (Farnebäck optical flow,
averaged over every frame pair) and compare it to the wind already drawn into the init frame.

PASS = the generated cloud motion follows the frame's own drawn wind (motion-direction comes free
from the image) → we don't need noise-warp steering for clouds.
FAIL = drift is random / unrelated to the streaks → explicit steering (Go-with-the-Flow) is the
next test.

  <comfy venv>/python measure_drift.py     # (needs opencv-python + numpy)
"""
import os, glob, json, math
import numpy as np
import cv2

HERE = os.path.dirname(os.path.abspath(__file__))
REND = os.path.join(HERE, "renders")

def load_seq(label):
    fs = sorted(glob.glob(os.path.join(REND, f"{label}_*.png")))
    return [cv2.cvtColor(cv2.imread(f), cv2.COLOR_BGR2GRAY) for f in fs]

def mean_flow(frames):
    """Average optical flow over all consecutive pairs → one net drift vector (screen px, y-down)."""
    acc = np.zeros(2); n = 0
    for a, b in zip(frames[:-1], frames[1:]):
        flow = cv2.calcOpticalFlowFarneback(a, b, None, 0.5, 3, 21, 3, 5, 1.2, 0)
        mag = np.linalg.norm(flow, axis=2); m = mag > 0.2          # ignore near-static pixels
        if m.sum() > 50:
            acc += np.array([flow[..., 0][m].mean(), flow[..., 1][m].mean()]); n += 1
    return acc / max(1, n)

def init_streak_orientation():
    """Undirected dominant orientation of the drawn cloud streaks (structure tensor)."""
    g = cv2.cvtColor(cv2.imread(os.path.join(HERE, "cloud_init.png")), cv2.COLOR_BGR2GRAY).astype(np.float32)
    gx = cv2.Sobel(g, cv2.CV_32F, 1, 0, ksize=5); gy = cv2.Sobel(g, cv2.CV_32F, 0, 1, ksize=5)
    Jxx = cv2.GaussianBlur(gx * gx, (0, 0), 9); Jyy = cv2.GaussianBlur(gy * gy, (0, 0), 9); Jxy = cv2.GaussianBlur(gx * gy, (0, 0), 9)
    coh = np.sqrt((Jxx - Jyy) ** 2 + 4 * Jxy ** 2) / (Jxx + Jyy + 1e-6)
    sd = 0.5 * np.arctan2(2 * Jxy, Jxx - Jyy) + math.pi / 2        # streak dir = perpendicular to gradient
    w = coh.flatten(); a2 = (2 * sd).flatten()                     # undirected → double-angle circular mean
    ori = 0.5 * math.atan2((w * np.sin(a2)).sum(), (w * np.cos(a2)).sum())
    return math.degrees(ori)

def ang(v):  # report in a y-up frame (screen y is down)
    return math.degrees(math.atan2(-v[1], v[0]))

def align(drift_deg, streak_deg):
    """Undirected alignment: 0° = drift along the streaks, 90° = across them."""
    d = abs((drift_deg - streak_deg + 90) % 180 - 90)
    return round(d, 1)

def main():
    out = {}
    streak = init_streak_orientation()
    out["init_streak_orientation_deg"] = round(streak, 1)
    for label in ("svd_m60", "svd_m160"):
        frames = load_seq(label)
        if len(frames) < 2: out[label] = {"error": "missing frames"}; continue
        d = mean_flow(frames)
        out[label] = {"n_frames": len(frames), "mean_drift_px": [round(float(d[0]), 3), round(float(d[1]), 3)],
                      "drift_angle_deg": round(ang(d), 1), "drift_mag_px": round(float(np.linalg.norm(d)), 3),
                      "misalign_to_streaks_deg": align(ang(d), streak)}
    out["verdict_note"] = ("PASS if drift_mag is non-trivial AND misalign_to_streaks_deg is small "
                           "(<~30°) → SVD follows the drawn wind for free.")
    print(json.dumps(out, indent=2))
    json.dump(out, open(os.path.join(REND, "drift-measure.json"), "w"), indent=2)

if __name__ == "__main__":
    main()
