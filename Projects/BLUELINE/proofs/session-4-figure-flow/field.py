#!/usr/bin/env python3
"""
BLUELINE Session 4 — THE single flow-field source, now CHARACTER-AWARE.

Session 3 proved the spine: one authored field, three resolutions of reality.
But that field was character-BLIND — vortices placed by hand, nothing knew a
figure was standing in the wind. This is the coupling: the character's silhouette
becomes a SOLID OBSTACLE, and the field is corrected so it flows *around* the body.

Recipe (potential-flow + seeded wake, the deterministic path):
  1. base field   = laminar "wind" drift along +x  + a little ambient swirl
  2. wake         = a counter-rotating vortex PAIR seeded just downwind of the body
                    (curl of gaussians -> divergence-free by construction)
  3. obstacle     = threshold the crouching-hero depth plate -> a solid body mask
  4. projection   = zero velocity inside the solid, then a pressure (Poisson) solve
                    so the fluid is divergence-free AND tangent to the body:
                        laplacian(p) = div(v0)      (Neumann at solid + walls)
                        v = v0 - grad(p)
                    => streamlines bend around the silhouette, compress + speed up
                       past the shoulders/hips, stagnate on the windward chest.

Every leg (drawn / dust-sim / steers) reads THE resulting flow-field.json UNTOUCHED,
exactly as Session 3 — so the comic speed-line and the dust plume are the same arrow
around the same body, at different fidelities. The arrow becomes the wind, and now
the wind knows the body is there.

ARRAY ORIENTATION (session-4 convention, different from session-3 on purpose):
  the field array is in IMAGE orientation — row j=0 is the TOP of the frame, y grows
  DOWNWARD, vx = rightward, vy = downward. Legs map array->pixels with NO flip. This
  keeps the field, the mask, and the plates all in one coordinate frame.

Run:  <comfy venv python> field.py
"""
import json, os
import numpy as np
from PIL import Image
import scipy.sparse as sp
import scipy.sparse.linalg as spla

HERE = os.path.dirname(os.path.abspath(__file__))
# self-contained: the crouching-hero plates were copied into inputs/ from
# ../blender-handdrawn/followups/redraw-posed-figure (they are untracked in git).
PLATE_DIR = os.path.join(HERE, "inputs")
DEPTH_PLATE = os.path.join(PLATE_DIR, "depth_plate.png")
POSE_PLATE = os.path.join(PLATE_DIR, "openpose.png")

# ---- grid: match the crouching-hero plate aspect (832x1040 -> 0.8 portrait) ----
GW, GH = 128, 160                      # field resolution
ASPECT = GW / GH                       # 0.8
xs = np.linspace(0, ASPECT, GW)
ys = np.linspace(0, 1, GH)             # y grows DOWNWARD (image orientation)
X, Y = np.meshgrid(xs, ys)             # shape (GH, GW)

# ---------------------------------------------------------------- body mask ----
def body_mask():
    """Isolate JUST the mannequin as a solid obstacle.

    The depth plate has the TRUE filled limb silhouette, but the figure fuses with a
    bright ground plane (and there are two background pillars) — a plain threshold
    grabs all of it. The OpenPose plate, by contrast, is the skeleton on pure black:
    no floor, no pillars. So we use the pose skeleton as a LOCATOR — dilate it into a
    fat region that covers where the body is — and keep only the depth silhouette that
    falls inside it. True filled body; floor and pillars gone.
    """
    from scipy.ndimage import binary_dilation, binary_closing, binary_fill_holes, label
    # depth silhouette (true filled limbs, but fused with floor + pillars present)
    d = np.asarray(Image.open(DEPTH_PLATE).convert("L").resize((GW, GH), Image.BILINEAR),
                   dtype=np.float32) / 255.0
    depth_sil = d > 0.12
    # pose locator: any non-black skeleton pixel, dilated to cover full limb width
    pose = np.asarray(Image.open(POSE_PLATE).convert("RGB").resize((GW, GH), Image.BILINEAR),
                      dtype=np.float32) / 255.0
    skel = pose.max(axis=-1) > 0.20
    locator = binary_dilation(skel, iterations=7)      # fat enough to span the limbs
    keep = depth_sil & locator                         # true silhouette, floor/pillars removed
    keep = binary_closing(keep, iterations=1)
    keep = binary_fill_holes(keep)
    # keep only the single largest component (drops any stray speckles)
    lab, n = label(keep)
    if n > 1:
        sizes = [(lab == k).sum() for k in range(1, n + 1)]
        keep = lab == (int(np.argmax(sizes)) + 1)
    return keep

SOLID = body_mask()
FLUID = ~SOLID
print(f"body mask: {SOLID.sum()} solid cells ({100*SOLID.mean():.1f}% of frame)")

# body centroid + extent (for placing the wake just behind it)
sj, si = np.where(SOLID)
cx = float(xs[int(round(si.mean()))])
cy = float(ys[int(round(sj.mean()))])
body_right = float(xs[si.max()])       # downwind edge of the body
body_h = float(ys[sj.max()] - ys[sj.min()])

# ---------------------------------------------------- base field + wake --------
# scalar potential psi; velocity = curl(psi) = (dpsi/dy, -dpsi/dx) -> divergence-free
# NB: with y DOWNWARD, uniform +x drift comes from psi = -k*y  (so vx = dpsi/dy = -k... )
# just build vx/vy directly for the drift and use psi only for the swirl blobs.

# 1) laminar wind blowing left->right across the frame
WIND = 1.0
vx = np.full((GH, GW), WIND, dtype=np.float64)
vy = np.zeros((GH, GW), dtype=np.float64)

# 2) a little ambient atmosphere (gentle large-scale swirl, so it isn't dead-flat)
psi = np.zeros((GH, GW))
ambient = [
    # cx, cy, amp, sigma  (signed amp = spin direction)
    (0.18, 0.25,  0.05, 0.22),
    (0.62, 0.80, -0.04, 0.20),
]
# 3) THE WAKE: counter-rotating pair seeded just downwind (right) of the body,
#    on the wake axis (body centroid height), one above + one below -> a vortex street.
wake_x = min(ASPECT - 0.06, body_right + 0.05)   # just behind the body's lee edge
wsig = max(0.06, 0.16 * body_h)
WAKE_AMP = 0.13
wake = [
    (wake_x, cy - 0.9 * wsig,  +WAKE_AMP, wsig),   # upper vortex
    (wake_x, cy + 0.9 * wsig,  -WAKE_AMP, wsig),   # lower vortex (opposite spin)
]
for cx0, cy0, amp, sig in ambient + wake:
    psi += amp * np.exp(-(((X - cx0) ** 2 + (Y - cy0) ** 2) / (2 * sig ** 2)))
dpsi_dy, dpsi_dx = np.gradient(psi, ys, xs)
vx += dpsi_dy
vy += -dpsi_dx

v0 = np.stack([vx, vy], axis=-1)       # (GH, GW, 2), BEFORE the body knows anything

# ------------------------------------------------ pressure projection ----------
# Everything below is in UNIT GRID SPACING (h=1): the divergence, the Laplacian,
# and the gradient all use index-space central differences, so the units cancel and
# the corrected field stays O(1). (The earlier bug mixed physical spacing into the
# solve and blew the magnitudes up.)
#
# Zero the velocity inside the solid, then project the fluid to divergence-free with
# no-penetration at the body + top/bottom walls (Neumann). Left/right columns are the
# wind's inlet/outlet — pinned p=0 (Dirichlet) so the wind passes through and the
# pure-Neumann null space is anchored.
vx_s = np.where(SOLID, 0.0, vx)
vy_s = np.where(SOLID, 0.0, vy)

def d_dx(a):                            # index-space central difference, edge-safe
    g = np.zeros_like(a)
    g[:, 1:-1] = 0.5 * (a[:, 2:] - a[:, :-2])
    g[:, 0]    = a[:, 1] - a[:, 0]
    g[:, -1]   = a[:, -1] - a[:, -2]
    return g

def d_dy(a):
    g = np.zeros_like(a)
    g[1:-1, :] = 0.5 * (a[2:, :] - a[:-2, :])
    g[0, :]    = a[1, :] - a[0, :]
    g[-1, :]   = a[-1, :] - a[-2, :]
    return g

div = d_dx(vx_s) + d_dy(vy_s)           # unit-grid divergence of the solid-zeroed field

# Laplacian over FLUID cells only; 5-point stencil, Neumann at solid + top/bottom
# (drop the neighbour), Dirichlet p=0 at the inlet/outlet columns.
idx = -np.ones((GH, GW), dtype=np.int64)
fluid_cells = np.argwhere(FLUID)
for n, (j, i) in enumerate(fluid_cells):
    idx[j, i] = n
N = len(fluid_cells)

rows, cols, data, rhs = [], [], [], np.zeros(N)
for n, (j, i) in enumerate(fluid_cells):
    if i == 0 or i == GW - 1:           # inlet / outlet: Dirichlet p = 0
        rows.append(n); cols.append(n); data.append(1.0)
        continue
    diag = 0.0
    for dj, di in ((-1, 0), (1, 0), (0, -1), (0, 1)):
        nj, ni = j + dj, i + di
        if nj < 0 or nj >= GH:          # top/bottom wall -> Neumann: skip neighbour
            continue
        if SOLID[nj, ni]:               # body wall -> Neumann: skip neighbour
            continue
        rows.append(n); cols.append(idx[nj, ni]); data.append(1.0)
        diag -= 1.0
    rows.append(n); cols.append(n); data.append(diag)
    rhs[n] = div[j, i]

A = sp.csr_matrix((data, (rows, cols)), shape=(N, N))
p_flat = spla.spsolve(A.tocsc(), rhs)
p = np.zeros((GH, GW)); p[FLUID] = p_flat

# corrected velocity: v = v0 - grad(p)   (only meaningful in fluid)
vx_c = np.where(SOLID, 0.0, vx_s - d_dx(p))
vy_c = np.where(SOLID, 0.0, vy_s - d_dy(p))

res = d_dx(vx_c) + d_dy(vy_c)
print(f"divergence  before: {np.abs(div[FLUID]).mean():.4f}   "
      f"after: {np.abs(res[FLUID]).mean():.4f}")

mag = np.sqrt(vx_c ** 2 + vy_c ** 2)
mag_max = float(mag[FLUID].max())

# ------------------------------------------------------------ export -----------
field = {
    "grid": {"w": GW, "h": GH, "aspect": ASPECT},
    "orientation": "image: row 0 = top, y grows DOWNWARD, vx=right, vy=down",
    "domain": {"x": [0, ASPECT], "y": [0, 1]},
    "mag_max": mag_max,
    "mag_mean": float(mag[FLUID].mean()),
    "body": {"note": "solid mask; True = inside the figure (do not seed/advect here)",
             "centroid": [cx, cy], "right_edge": body_right},
    "note": "character-aware curl+projection field; divergence-free in fluid; "
            "tangent to the body. row-major [h][w], each cell [vx,vy].",
    "solid": [[bool(SOLID[j, i]) for i in range(GW)] for j in range(GH)],
    "vectors": [[[round(float(vx_c[j, i]), 5), round(float(vy_c[j, i]), 5)]
                 for i in range(GW)] for j in range(GH)],
}
out = os.path.join(HERE, "flow-field.json")
json.dump(field, open(out, "w"))
print("WROTE", out, f"({GW}x{GH}, mag_max={mag_max:.3f})")

# ------------------------------------------------ streamline preview -----------
try:
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    fig, ax = plt.subplots(figsize=(GW / 20, GH / 20), dpi=150)
    ax.set_facecolor("#15161a")
    # streamlines (masked over the body so they visibly part around it)
    speed = np.ma.array(mag / mag_max, mask=SOLID)
    ax.streamplot(X, Y, np.ma.array(vx_c, mask=SOLID), np.ma.array(vy_c, mask=SOLID),
                  color=speed, cmap="magma", density=2.0, linewidth=0.9, arrowsize=0.7)
    # body silhouette
    ax.contourf(X, Y, SOLID.astype(float), levels=[0.5, 1.5], colors=["#2b6cff"], alpha=0.35)
    ax.contour(X, Y, SOLID.astype(float), levels=[0.5], colors=["#2b6cff"], linewidths=1.0)
    ax.set_xlim(0, ASPECT); ax.set_ylim(1, 0); ax.axis("off")   # y flipped -> image up
    ax.set_aspect("equal")
    fig.patch.set_facecolor("#15161a")
    p_png = os.path.join(HERE, "renders", "00-field-around-body.png")
    fig.savefig(p_png, bbox_inches="tight", pad_inches=0, facecolor="#15161a")
    print("WROTE", p_png)
except Exception as e:
    print("preview skipped:", repr(e))
print("FIELD_DONE")
