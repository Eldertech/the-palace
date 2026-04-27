"""
Image 1 — T² = S¹ × S¹ : the wavetable space as a torus.

v4 changes (driven by Loudon's feedback):
  - Layout rearranged: torus on TOP (full width), then waterfall (left) and
    heatmap (right) beneath it, sharing row semantics so the sine row at
    top and bottom of the waterfall lines up with the sine rows of the
    heat-map rectangle.
  - Depth-gradient alpha on the θ (frame, red) and φ (phase, blue) guide
    circles so you can read the 3D orientation without the lines feeling
    "cut out" of the scene. Points on the far side of the torus become
    translucent; near-side segments stay bright.
  - "sine / triangle / square / saw" labels are drawn LAST so they sit
    on top of the geometry (fixes the "triangle hidden behind phase
    circle" bug).

Narrative the image should tell in one look:
  1. The donut above collects every waveform+phase combination into
     one surface.
  2. Below left: the familiar waterfall view — a stack of frames.
  3. Below right: the same data as a coloured rectangle. Arrows show how
     gluing its opposite edges makes the donut above.
"""

import numpy as np
import matplotlib.pyplot as plt
from matplotlib import cm, colors
from mpl_toolkits.mplot3d import Axes3D  # noqa: F401
from mpl_toolkits.mplot3d.art3d import Line3DCollection

# =============================================================
# 1. Band-limited keyframe waveforms
# =============================================================
K_HARM = 24

def sine(phi):
    return np.sin(phi)

def triangle(phi, K=K_HARM):
    out = np.zeros_like(phi)
    for k in range(K):
        n = 2 * k + 1
        out += ((-1) ** k) / (n * n) * np.sin(n * phi)
    return (8.0 / (np.pi ** 2)) * out

def square(phi, K=K_HARM):
    out = np.zeros_like(phi)
    for k in range(K):
        n = 2 * k + 1
        out += (1.0 / n) * np.sin(n * phi)
    return (4.0 / np.pi) * out

def saw(phi, K=K_HARM):
    out = np.zeros_like(phi)
    for k in range(1, K + 1):
        out += ((-1) ** (k + 1) / k) * np.sin(k * phi)
    return (2.0 / np.pi) * out

KEYFRAMES = [
    ('sine',     sine),
    ('triangle', triangle),
    ('square',   square),
    ('saw',      saw),
    ('sine',     sine),
]

# =============================================================
# 2. Wavetable: piecewise linear morph through the keyframes.
# =============================================================
KEY_FUNCS = [f for (_, f) in KEYFRAMES[:4]]   # sine, tri, sq, saw

def wavetable(phi, theta):
    seg = (theta / (np.pi / 2.0)) % 4.0
    idx = np.floor(seg).astype(int)
    t   = seg - np.floor(seg)

    out = np.zeros_like(phi)
    for k in range(4):
        mask = (idx == k)
        if not np.any(mask):
            continue
        phi_m = phi[mask]
        t_m   = t[mask]
        w_from = KEY_FUNCS[k](phi_m)
        w_to   = KEY_FUNCS[(k + 1) % 4](phi_m)
        out[mask] = (1.0 - t_m) * w_from + t_m * w_to
    return out


# =============================================================
# 3. Torus geometry
# =============================================================
R = 2.0
r = 1.0

def torus_xyz(theta, phi, R=R, r=r):
    x = (R + r * np.cos(phi)) * np.cos(theta)
    y = (R + r * np.cos(phi)) * np.sin(theta)
    z =  r * np.sin(phi)
    return x, y, z

# =============================================================
# 4. Depth-aware colored curves on the torus surface
#    We compute per-segment alpha from (segment midpoint) · (view direction).
# =============================================================
ELEV_DEG = 38.0
AZIM_DEG = -62.0

def view_direction(elev_deg=ELEV_DEG, azim_deg=AZIM_DEG):
    e = np.radians(elev_deg); a = np.radians(azim_deg)
    # Matplotlib's 3D viewing direction (pointing from object toward viewer)
    vx = np.cos(e) * np.cos(a)
    vy = np.cos(e) * np.sin(a)
    vz = np.sin(e)
    return np.array([vx, vy, vz])

RED_RGB  = np.array([0.722, 0.207, 0.102])  # #b8351a  (θ / frame)
BLUE_RGB = np.array([0.058, 0.309, 0.541])  # #0f4f8a  (φ / phase)

def tint_with_stripes(W, T_grid, P_grid, th_blue=np.pi / 3,
                      sigma_phi=0.085, sigma_theta=0.070,
                      strength=0.97):
    """Take a (H, W) wavetable field W plus matching θ and φ grids, return an
    RGBA image that shows the RdBu_r wavetable heatmap with:
      - a RED stripe along the θ-circle  (the set φ = 0, wraps periodically)
      - a BLUE stripe along the φ-circle (the set θ = th_blue)

    Using this as the facecolors on plot_surface bakes the guide lines into
    the surface texture, so matplotlib's own surface rasterizer handles
    occlusion correctly — no Line3DCollection depth-sort hacks needed.
    The same image can go into imshow() for the 2D rectangle panel so the
    two views agree pixel-for-pixel."""
    base = cmap(norm(W))
    rgb = base[..., :3].copy()

    # periodic distance from φ = 0
    d_phi_abs = np.abs(P_grid) % (2 * np.pi)
    d_phi = np.minimum(d_phi_abs, 2 * np.pi - d_phi_abs)
    m_red = np.exp(-(d_phi / sigma_phi) ** 2)

    # periodic distance from θ = th_blue
    d_theta_abs = np.abs(T_grid - th_blue) % (2 * np.pi)
    d_theta = np.minimum(d_theta_abs, 2 * np.pi - d_theta_abs)
    m_blue = np.exp(-(d_theta / sigma_theta) ** 2)

    a_red  = strength * m_red
    a_blue = strength * m_blue

    for c in range(3):
        rgb[..., c] = (1 - a_red) * rgb[..., c] + a_red * RED_RGB[c]
    for c in range(3):
        rgb[..., c] = (1 - a_blue) * rgb[..., c] + a_blue * BLUE_RGB[c]

    rgba = np.concatenate([rgb, np.ones_like(rgb[..., :1])], axis=-1)
    return rgba


# =============================================================
# 5. Figure layout
# =============================================================
fig = plt.figure(figsize=(12.0, 9.5), dpi=170, facecolor='white')
gs = fig.add_gridspec(
    nrows=2, ncols=2,
    width_ratios=[1.0, 1.0],
    height_ratios=[1.25, 1.0],
    hspace=-0.08, wspace=0.18,
    top=0.94, bottom=0.065, left=0.06, right=0.97,
)
ax3d    = fig.add_subplot(gs[0, :], projection='3d')   # torus, full width, top
ax_stk  = fig.add_subplot(gs[1, 0])                     # waterfall (bottom left)
ax_rect = fig.add_subplot(gs[1, 1])                     # heatmap rectangle (bottom right)

# ---- colormap (bipolar: red = positive, blue = negative) ----
cmap = cm.RdBu_r
vmax = 1.15
norm = colors.Normalize(vmin=-vmax, vmax=vmax)

# -------------------------------------------------------------
# (a) Main torus with the wavetable painted on its surface
# -------------------------------------------------------------
n_t, n_p = 280, 170
theta_grid = np.linspace(0, 2 * np.pi, n_t)
phi_grid   = np.linspace(0, 2 * np.pi, n_p)
T, P = np.meshgrid(theta_grid, phi_grid)
X, Y, Z = torus_xyz(T, P)
W = wavetable(P, T)

# θ at which the blue φ-circle sits (shared between torus and rectangle)
TH_BLUE = np.pi / 3

# -------- bake guide stripes into the torus surface texture --------
facecolors = tint_with_stripes(W, T, P, th_blue=TH_BLUE)
ax3d.plot_surface(
    X, Y, Z,
    facecolors=facecolors,
    rstride=1, cstride=1,
    linewidth=0, antialiased=True, shade=False, alpha=1.0,
)

# Proxy artists so we can build the legend
from matplotlib.lines import Line2D
legend_handles = [
    Line2D([0], [0], color='#b8351a', lw=3.4,
           label=r'$\theta$ : frame (around the hole)'),
    Line2D([0], [0], color='#0f4f8a', lw=3.4,
           label=r'$\varphi$ : phase (around the tube = one frame)'),
]

# torus styling
ax3d.set_box_aspect((1, 1, 0.60))
ax3d.view_init(elev=ELEV_DEG, azim=AZIM_DEG)
ax3d.set_xticks([]); ax3d.set_yticks([]); ax3d.set_zticks([])
ax3d.grid(False); ax3d.set_axis_off()
# Tighten axis limits so the torus fills the 3D axes box
ax3d.set_xlim(-3.1, 3.1); ax3d.set_ylim(-3.1, 3.1); ax3d.set_zlim(-1.15, 1.15)
leg = ax3d.legend(handles=legend_handles,
                  loc='upper left', frameon=False, fontsize=10.0,
                  bbox_to_anchor=(-0.01, 0.96), borderpad=0.2)
for text in leg.get_texts():
    text.set_color('#1a1a1a')

# ------- shape labels pushed toward the camera, drawn LAST --------
# We bring each label forward along the view direction so it sits
# visually above the torus surface.
vd = view_direction()
shape_labels = [('sine',     0.0),
                ('triangle', np.pi / 2.0),
                ('square',   np.pi),
                ('saw',      3.0 * np.pi / 2.0)]
label_push_radial = 1.22     # push outward from the torus hole
label_push_camera = 0.35     # then push toward the camera

for name, th in shape_labels:
    lx, ly, lz = torus_xyz(th, 0.0)
    # outward radial push
    lx_o = lx * label_push_radial
    ly_o = ly * label_push_radial
    # then toward camera
    lx_o += label_push_camera * vd[0]
    ly_o += label_push_camera * vd[1]
    lz_o = lz + 0.10 + label_push_camera * vd[2]
    t_obj = ax3d.text(lx_o, ly_o, lz_o, name, color='#111111',
                      fontsize=10.5, ha='center', va='center',
                      weight='bold', zorder=20)
    # light "halo" so they stay readable over any colour
    import matplotlib.patheffects as pe
    t_obj.set_path_effects([pe.withStroke(linewidth=3.0, foreground='white')])


# -------------------------------------------------------------
# (b) Waveform stack (waterfall) — BOTTOM LEFT
#     Stacked vertically: θ = 0 (sine) at bottom, θ = 2π (sine) at top.
#     This Y orientation matches the rectangle heatmap on its right.
# -------------------------------------------------------------
phi_dense = np.linspace(0, 2 * np.pi, 1000)

# We want the waveforms to sit in rows aligned with the rectangle, so use
# the SAME Y range (0 ... 2π in θ), and locally add the amplitude on top
# of that row position. Amplitude scaled so curves don't overlap rows.
row_positions = [0.0, np.pi / 2.0, np.pi, 3 * np.pi / 2.0, 2 * np.pi]
row_names     = ['sine', 'triangle', 'square', 'saw', 'sine']
amp_scale = 0.78  # fits comfortably inside 1 row (rows are π/2 ≈ 1.57 apart)

for y0, (name, func) in zip(row_positions, KEYFRAMES):
    y = y0 + amp_scale * func(phi_dense)
    ax_stk.plot(phi_dense, y, color='#1a1a1a', linewidth=1.7)
    # faint zero-line for the row
    ax_stk.axhline(y0, color='#dcdcdc', linewidth=0.7, zorder=0)

# ----- BLUE "one frame" trace at θ = TH_BLUE (= π/3) -----
# This is the interpolated waveform at the same θ used for the blue meridian
# on the torus and the blue stripe on the rectangle. Drawing it in the
# waterfall too makes all three views explicitly agree.
theta_one = np.full_like(phi_dense, TH_BLUE)
y_one = TH_BLUE + amp_scale * wavetable(phi_dense, theta_one)
ax_stk.axhline(TH_BLUE, color='#0f4f8a', linewidth=1.1, alpha=0.55,
               linestyle=(0, (3, 2)), zorder=1)
ax_stk.plot(phi_dense, y_one, color='#0f4f8a', linewidth=2.1, zorder=3)
ax_stk.text(2 * np.pi + 0.1, TH_BLUE,
            'one frame\n(θ=π/3)',
            fontsize=8.5, va='center', color='#0f4f8a', weight='bold')

# label each row on the right (just the waveform name — θ is shown on the left ticks)
for y0, name in zip(row_positions, row_names):
    ax_stk.text(2 * np.pi + 0.1, y0, name,
                fontsize=9.5, va='center', color='#333333', weight='bold')

ax_stk.set_xlim(0, 2 * np.pi + 1.4)
ax_stk.set_ylim(-amp_scale - 0.15, 2 * np.pi + amp_scale + 0.15)
ax_stk.set_xticks([0, np.pi, 2 * np.pi])
ax_stk.set_xticklabels(['0', r'$\pi$', r'$2\pi$'])
ax_stk.set_xlabel(r'$\varphi$ (phase within one cycle)', fontsize=10, color='#0f4f8a',
                  labelpad=2)
ax_stk.set_yticks(row_positions)
ax_stk.set_yticklabels(['0', r'$\pi/2$', r'$\pi$', r'$3\pi/2$', r'$2\pi$'])
ax_stk.tick_params(labelsize=8.5)
ax_stk.set_ylabel(r'$\theta$ (frame position)', fontsize=10, color='#b8351a', labelpad=2)
for side in ('top', 'right'): ax_stk.spines[side].set_visible(False)
ax_stk.spines['bottom'].set_color('#bcbcbc')
ax_stk.spines['left'].set_color('#bcbcbc')
ax_stk.set_title('the wavetable as a waterfall\n(each row = one frame)',
                 fontsize=11.0, color='#222222', pad=6)


# -------------------------------------------------------------
# (c) Flattened rectangle — BOTTOM RIGHT
#     phase (φ) on X, frame (θ) on Y — same Y as the waterfall.
# -------------------------------------------------------------
PH, TH = np.meshgrid(phi_dense, theta_grid)
W_rect = wavetable(PH, TH)
rect_rgba = tint_with_stripes(W_rect, TH, PH, th_blue=TH_BLUE)

ax_rect.imshow(
    rect_rgba, origin='lower', aspect='auto',
    extent=[0, 2 * np.pi, 0, 2 * np.pi],
    interpolation='bilinear',
)
ax_rect.set_xlabel(r'$\varphi$ (phase)',          fontsize=10, color='#0f4f8a', labelpad=2)
ax_rect.set_ylabel(r'$\theta$ (frame position)',  fontsize=10, color='#b8351a', labelpad=2)
ax_rect.set_xticks([0, np.pi, 2 * np.pi]); ax_rect.set_xticklabels(['0', r'$\pi$', r'$2\pi$'])
ax_rect.set_yticks(row_positions)
ax_rect.set_yticklabels(['0  sine', r'$\pi/2$  tri', r'$\pi$  sq',
                         r'$3\pi/2$  saw', r'$2\pi$  sine'])
ax_rect.tick_params(labelsize=8.5)
ax_rect.set_title('the same wavetable as a coloured rectangle\n(glue opposite edges → donut)',
                  fontsize=11.0, pad=6, color='#222222')

# ----- identification arrows showing how edges glue -----
phi_arrow_kwargs   = dict(arrowstyle='->', mutation_scale=14, linewidth=1.8, color='#0f4f8a')
theta_arrow_kwargs = dict(arrowstyle='->', mutation_scale=14, linewidth=1.8, color='#b8351a')

# left edge (φ = 0) and right edge (φ = 2π):
#   glue along the φ circle → two little vertical arrows (φ identification, blue)
for x_edge in (0.0, 2 * np.pi):
    ax_rect.annotate('', xy=(x_edge, np.pi + 0.9),
                     xytext=(x_edge, np.pi + 0.3),
                     arrowprops=phi_arrow_kwargs)
    ax_rect.annotate('', xy=(x_edge, np.pi - 0.3),
                     xytext=(x_edge, np.pi - 0.9),
                     arrowprops=phi_arrow_kwargs)

# top edge (θ = 2π) and bottom edge (θ = 0):
#   glue along the θ circle → single horizontal arrow (θ identification, red)
for y_edge in (0.0, 2 * np.pi):
    ax_rect.annotate('', xy=(np.pi + 0.9, y_edge),
                     xytext=(np.pi - 0.9, y_edge),
                     arrowprops=theta_arrow_kwargs)

# annotate the baked-in blue stripe as "one frame at θ = π/3"
ax_rect.text(np.pi, TH_BLUE + 0.18,
             'one frame  (θ = π/3)',
             color='#0f4f8a', fontsize=8.5, weight='bold', ha='center',
             path_effects=[__import__('matplotlib').patheffects.withStroke(
                 linewidth=2.6, foreground='white')])
# annotate the red stripe on the left edge (the θ-circle lives at φ = 0 = 2π)
ax_rect.text(0.35, np.pi, 'θ-loop  (= outer equator of the donut)',
             color='#b8351a', fontsize=8.5, weight='bold', ha='left',
             rotation=90, va='center',
             path_effects=[__import__('matplotlib').patheffects.withStroke(
                 linewidth=2.6, foreground='white')])


# -------------------------------------------------------------
# Global titling
# -------------------------------------------------------------
fig.suptitle(
    r'Wavetable space $= S^1 \times S^1 = T^2$',
    fontsize=18, y=0.985, color='#1a1a1a',
)
fig.text(
    0.5, 0.012,
    r'$\theta$ (frame, red) goes around the hole of the donut, cycling '
    r'sine → triangle → square → saw → sine.   '
    r'$\varphi$ (phase, blue) goes around the tube — one traversal = one cycle of whatever '
    r'waveform that frame currently is.',
    ha='center', fontsize=10.3, color='#333333',
)

out_dir = '/sessions/admiring-wizardly-planck/mnt/The Palace/Artifacts/Wavetable Torus'
plt.savefig(f'{out_dir}/image1_t2_product_of_circles.png',
            dpi=210, bbox_inches='tight', facecolor='white')
plt.savefig(f'{out_dir}/image1_t2_product_of_circles.svg',
            bbox_inches='tight', facecolor='white')
print('Wrote image1_t2_product_of_circles.png / .svg')
