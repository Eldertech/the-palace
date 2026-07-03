"""Shared reader for THE single character-aware source (flow-field.json).

Session-4 orientation: the field array is in IMAGE orientation — row j=0 is the TOP
of the frame, y grows DOWNWARD, vx=right, vy=down. Domain: x in [0,aspect], y in [0,1].
Legs map array->pixels with NO vertical flip (unlike session-3). Every leg reads THIS
file untouched and also gets the solid body mask so it never seeds/advects inside the
character.
"""
import json, os
import numpy as np

_HERE = os.path.dirname(os.path.abspath(__file__))
FIELD_PATH = os.path.join(_HERE, "..", "flow-field.json")


def load_field(path=FIELD_PATH):
    d = json.load(open(path))
    V = np.array(d["vectors"], dtype=np.float32)      # (GH, GW, 2)
    S = np.array(d["solid"], dtype=bool)              # (GH, GW) True = body
    return {"V": V, "S": S, "w": d["grid"]["w"], "h": d["grid"]["h"],
            "aspect": d["grid"]["aspect"], "mag_max": d["mag_max"],
            "body": d.get("body", {})}


def sample(field, x, y):
    """Bilinear sample at domain coords x in [0,aspect], y in [0,1] (y DOWNWARD)."""
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


def in_body(field, x, y):
    """True if domain point (x,y) is inside the solid character."""
    S, GW, GH, asp = field["S"], field["w"], field["h"], field["aspect"]
    i = int(np.clip(x / asp, 0, 1) * (GW - 1))
    j = int(np.clip(y, 0, 1) * (GH - 1))
    return bool(S[j, i])
