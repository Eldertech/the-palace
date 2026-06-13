"""Shared reader for THE single source (flow-field.json). Every Python leg uses
this; none of them edits the field — they only sample it and apply their own
per-leg scale. That separation is exactly what the strong-vs-likely-true test
measures."""
import json, os
import numpy as np

_HERE = os.path.dirname(os.path.abspath(__file__))
FIELD_PATH = os.path.join(_HERE, "..", "flow-field.json")

def load_field(path=FIELD_PATH):
    d = json.load(open(path))
    V = np.array(d["vectors"], dtype=np.float32)   # (GH, GW, 2)
    return {"V": V, "w": d["grid"]["w"], "h": d["grid"]["h"],
            "aspect": d["grid"]["aspect"], "mag_max": d["mag_max"]}

def sample(field, x, y):
    """Bilinear sample at domain coords x in [0,aspect], y in [0,1]. Untouched field."""
    V, GW, GH, asp = field["V"], field["w"], field["h"], field["aspect"]
    fx = np.clip(x / asp, 0, 1) * (GW - 1)
    fy = np.clip(y, 0, 1) * (GH - 1)
    x0, y0 = int(fx), int(fy)
    x1, y1 = min(x0 + 1, GW - 1), min(y0 + 1, GH - 1)
    tx, ty = fx - x0, fy - y0
    v00, v10, v01, v11 = V[y0, x0], V[y0, x1], V[y1, x0], V[y1, x1]
    v = (v00 * (1 - tx) * (1 - ty) + v10 * tx * (1 - ty)
         + v01 * (1 - tx) * ty + v11 * tx * ty)
    return float(v[0]), float(v[1])
