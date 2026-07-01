"""
BLUELINE — Text Layer: voice/thought balloon catalog + tail geometry.

The comic convention this fixes: a balloon's tail is PART OF ITS SILHOUETTE. The outline
breaks where the tail joins — the two tail edges continue the outline down to the tip and
back — and the balloon BODY sits off the face, with only the tail reaching the mouth. The
naive "line from the balloon center to the mouth" (the first proof) crosses both the
bubble and the face; that is exactly what we do NOT want.

Technique: build a filled MASK = body ∪ tail (supersampled), fill its interior white, then
stroke the mask's OUTER CONTOUR. The contour of the union automatically runs body → down
one tail edge → tip → up the other tail edge → body, so the outline is interrupted at the
tail with no line cutting across. Works for any body shape (oval, rect, spiky, cloud, …).

Pure PIL + cv2 (both in the ComfyUI venv) — no Blender. The tail TARGET (the mouth) comes
from the rig's projected keypoint; the BODY is placed to clear the face.
"""
import math
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFont

S = 3          # supersample factor for crisp antialiased edges
INK = (18, 18, 18)
PAPER = (255, 255, 255)


# ---- fonts ----------------------------------------------------------------------
def font(sz):
    for p in ("/System/Library/Fonts/Supplemental/Chalkduster.ttf",
              "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
              "/System/Library/Fonts/Helvetica.ttc"):
        try: return ImageFont.truetype(p, sz)
        except Exception: pass
    return ImageFont.load_default()


# ---- body-shape mask builders (draw into a supersampled uint8 mask) --------------
def _pt(x, y): return (int(round(x * S)), int(round(y * S)))

def m_oval(mask, cx, cy, rx, ry):
    cv2.ellipse(mask, _pt(cx, cy), (int(rx * S), int(ry * S)), 0, 0, 360, 255, -1)

def m_rrect(mask, cx, cy, rx, ry, rad=26):
    x0, y0, x1, y1 = cx - rx, cy - ry, cx + rx, cy + ry
    r = int(rad * S)
    cv2.rectangle(mask, _pt(x0 + rad, y0), _pt(x1 - rad, y1), 255, -1)
    cv2.rectangle(mask, _pt(x0, y0 + rad), _pt(x1, y1 - rad), 255, -1)
    for px, py in ((x0 + rad, y0 + rad), (x1 - rad, y0 + rad),
                   (x0 + rad, y1 - rad), (x1 - rad, y1 - rad)):
        cv2.circle(mask, _pt(px, py), r, 255, -1)

def m_rect(mask, cx, cy, rx, ry):
    cv2.rectangle(mask, _pt(cx - rx, cy - ry), _pt(cx + rx, cy + ry), 255, -1)

def m_spiky(mask, cx, cy, rx, ry, spikes=15, inner=0.70):
    pts = []
    for i in range(spikes * 2):
        ang = math.pi * i / spikes - math.pi / 2
        rr = 1.0 if i % 2 == 0 else inner
        pts.append(_pt(cx + math.cos(ang) * rx * rr, cy + math.sin(ang) * ry * rr))
    cv2.fillPoly(mask, [np.array(pts, np.int32)], 255)

def m_cloud(mask, cx, cy, rx, ry, bumps=12):
    m_oval(mask, cx, cy, rx * 0.72, ry * 0.72)
    br = (rx + ry) / 2 * 0.30
    for i in range(bumps):
        ang = 2 * math.pi * i / bumps
        cv2.circle(mask, _pt(cx + math.cos(ang) * rx * 0.78, cy + math.sin(ang) * ry * 0.72),
                   int(br * S), 255, -1)

def m_wavy(mask, cx, cy, rx, ry, waves=13, amp=0.11):
    pts = []
    for i in range(160):
        ang = 2 * math.pi * i / 160
        rr = 1 + amp * math.sin(waves * ang)
        pts.append(_pt(cx + math.cos(ang) * rx * rr, cy + math.sin(ang) * ry * rr))
    cv2.fillPoly(mask, [np.array(pts, np.int32)], 255)

def m_icicle(mask, cx, cy, rx, ry, spikes=8, depth=22):
    m_rect(mask, cx, cy, rx, ry)
    w = (2 * rx) / spikes
    for i in range(spikes):
        sx = cx - rx + i * w
        cv2.fillPoly(mask, [np.array([_pt(sx, cy + ry), _pt(sx + w, cy + ry),
                                      _pt(sx + w / 2, cy + ry + depth)], np.int32)], 255)


# ---- tail ------------------------------------------------------------------------
def edge_point(mask, C, M):
    """The point where the segment C→M exits the body mask — the true tail root on the
    perimeter, for ANY body shape."""
    steps, last = 240, C
    for i in range(steps + 1):
        t = i / steps
        x = C[0] + (M[0] - C[0]) * t
        y = C[1] + (M[1] - C[1]) * t
        xi, yi = int(x * S), int(y * S)
        if 0 <= yi < mask.shape[0] and 0 <= xi < mask.shape[1] and mask[yi, xi] > 0:
            last = (x, y)
        elif t > 0.02:
            break
    return last

def add_tail(mask, root, M, base=30, curve=0.0):
    """Add a triangular tail from the body edge (root) to the tip (M) into the mask, so
    the union contour interrupts the body outline. `curve` droops the tip sideways (weak
    voice). Mutates mask."""
    rx, ry = root; mx, my = M
    dx, dy = mx - rx, my - ry
    L = math.hypot(dx, dy) or 1.0
    px, py = -dy / L * base / 2, dx / L * base / 2          # perpendicular half-base
    if curve:
        mx += -dy / L * curve; my += dx / L * curve
    pts = np.array([_pt(rx + px, ry + py), _pt(rx - px, ry - py), _pt(mx, my)], np.int32)
    cv2.fillPoly(mask, [pts], 255)

def thought_puffs(img, root, M, n=3):
    """Detached shrinking bubbles from body toward the head — the thought-balloon 'tail'.
    Drawn straight onto the image (not unioned)."""
    for i in range(1, n + 1):
        t = i / (n + 0.6)
        cx = root[0] + (M[0] - root[0]) * t
        cy = root[1] + (M[1] - root[1]) * t
        r = int(max(4, 15 - i * 4))
        cv2.circle(img, (int(cx), int(cy)), r, PAPER, -1, cv2.LINE_AA)
        cv2.circle(img, (int(cx), int(cy)), r, INK, 3, cv2.LINE_AA)


# ---- fill + stroke ---------------------------------------------------------------
def fill(img, mask, color=PAPER):
    small = cv2.resize(mask, (img.shape[1], img.shape[0]), interpolation=cv2.INTER_AREA)
    a = (small.astype(np.float32) / 255)[..., None]
    img[:] = (img * (1 - a) + np.array(color, np.float32) * a).astype(np.uint8)

def stroke(img, mask, thick=5, style="solid", color=INK):
    cnts, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    for c in cnts:
        pts = (c.reshape(-1, 2).astype(np.float32) / S).astype(np.int32)
        if style == "dashed":
            _dashed(img, pts, color, thick)
        else:
            cv2.polylines(img, [pts], True, color, thick, cv2.LINE_AA)
    if style == "double":                    # inner concentric line, clearly separated
        inner = cv2.erode(mask, np.ones((3, 3), np.uint8), iterations=9 * S)
        ci, _ = cv2.findContours(inner, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        for c in ci:
            pts = (c.reshape(-1, 2).astype(np.float32) / S).astype(np.int32)
            cv2.polylines(img, [pts], True, color, max(2, thick - 2), cv2.LINE_AA)

def _dashed(img, pts, color, thick, dash=22, gap=16):
    acc = 0.0; on = True
    for i in range(len(pts)):
        a = pts[i]; b = pts[(i + 1) % len(pts)]
        seg = math.hypot(b[0] - a[0], b[1] - a[1])
        if seg < 1: continue
        d = 0.0
        while d < seg:
            step = (dash if on else gap) - acc
            step = min(step, seg - d)
            if on:
                p0 = (int(a[0] + (b[0]-a[0]) * (d/seg)), int(a[1] + (b[1]-a[1]) * (d/seg)))
                p1 = (int(a[0] + (b[0]-a[0]) * ((d+step)/seg)), int(a[1] + (b[1]-a[1]) * ((d+step)/seg)))
                cv2.line(img, p0, p1, color, thick, cv2.LINE_AA)
            d += step; acc += step
            if acc >= (dash if on else gap): on = not on; acc = 0.0


# ---- the catalog -----------------------------------------------------------------
STYLES = {
    "speech-oval":    dict(body=m_oval,   tail="tri",   stroke="solid",  meaning="neutral speech"),
    "speech-rrect":   dict(body=m_rrect,  tail="tri",   stroke="solid",  meaning="neutral speech (rect)"),
    "shout-spiky":    dict(body=m_spiky,  tail="jag",   stroke="solid",  meaning="shout / electronic"),
    "thought-cloud":  dict(body=m_cloud,  tail="puffs", stroke="solid",  meaning="thought / interior"),
    "weak-wavy":      dict(body=m_wavy,   tail="droop", stroke="solid",  meaning="weak / dying / sick"),
    "narration-rect": dict(body=m_rect,   tail="none",  stroke="solid",  meaning="narration / formal"),
    "cold-icicle":    dict(body=m_icicle, tail="tri",   stroke="solid",  meaning="cold / menace"),
    "whisper-dashed": dict(body=m_oval,   tail="tri",   stroke="dashed", meaning="whisper"),
    "loud-double":    dict(body=m_rrect,  tail="tri",   stroke="double", meaning="loud"),
}


def draw_balloon(img, style, center, half, mouth, text="", fsz=38):
    """Draw one balloon onto `img` (numpy RGB, mutated). center=(cx,cy) body center,
    half=(rx,ry) body half-extent, mouth=(mx,my) tail tip. Returns a PIL image with the
    text drawn (letters kept LOCKED and readable — Commitment 1)."""
    spec = STYLES[style]
    H, W = img.shape[:2]
    mask = np.zeros((H * S, W * S), np.uint8)
    cx, cy = center; rx, ry = half
    spec["body"](mask, cx, cy, rx, ry)

    root = edge_point(mask, center, mouth)
    tail = spec["tail"]
    if tail == "tri":
        add_tail(mask, root, mouth, base=30)
    elif tail == "jag":                       # jagged shout tail: overlapping spikes
        add_tail(mask, root, mouth, base=34)
        mid = ((root[0] + mouth[0]) / 2, (root[1] + mouth[1]) / 2)
        add_tail(mask, root, mid, base=18)
    elif tail == "droop":
        add_tail(mask, root, mouth, base=24, curve=26)
    # "puffs" and "none" add nothing to the union mask

    fill(img, mask)
    stroke(img, mask, thick=5, style=spec["stroke"])
    if tail == "puffs":
        thought_puffs(img, root, mouth)

    pim = Image.fromarray(img)
    if text:
        d = ImageDraw.Draw(pim)
        avail = 2 * rx - 30                    # keep letters inside the body — auto-fit
        sz = fsz
        while sz > 12:
            f = font(sz)
            l, t, r, b = d.textbbox((0, 0), text, font=f)
            if (r - l) <= avail:
                break
            sz -= 2
        l, t, r, b = d.textbbox((0, 0), text, font=f)
        d.text((cx - (r - l) / 2 - l, cy - (b - t) / 2 - t), text, font=f, fill=INK)
    return pim
