"""
make_clips.py  --  Tract Mirror demo clips
Three short demo movies demonstrating components of the Tract Mirror synth.
Pipeline: matplotlib Agg frames at 30 fps, 1920x1080, assembled + muxed with
audio via ffmpeg (h264, yuv420p, aac 48k).

Visual style: Graphite skin from the Loudon Live design system.
  bg      = #0a0a0f   near-black
  fg_1    = #e8e8f0   warm off-white
  fg_2    = #c8c8d8
  fg_3    = #8a8aa0
  accent  = #e8b84a   amber (active element)
  border  = #4a4a5e

No emoji, no cyan. Footer: "Loudon Live · Autodidact Polymaths"
"""

import sys, os, json, subprocess, shutil, tempfile
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyArrowPatch
from scipy.io import wavfile

# -- import reference DSP from project --
REF_DIR = os.path.join(os.path.dirname(__file__), "..", "reference")
sys.path.insert(0, REF_DIR)
import kl_reference as kl

VOWELS_PATH  = os.path.join(REF_DIR, "vowels.json")
RENDERS_DIR  = os.path.join(REF_DIR, "renders")
CLIPS_DIR    = os.path.join(os.path.dirname(__file__), "clips")
PYTHON       = sys.executable
FFMPEG       = "ffmpeg"

os.makedirs(CLIPS_DIR, exist_ok=True)

with open(VOWELS_PATH) as f:
    VDATA = json.load(f)

# ── Design tokens (Graphite skin) ────────────────────────────────────────────
BG        = "#0a0a0f"
BG1       = "#12121a"
BG2       = "#1a1a28"
FG1       = "#e8e8f0"
FG2       = "#c8c8d8"
FG3       = "#8a8aa0"
FG4       = "#4a4a5a"
ACCENT    = "#e8b84a"
ACCENT_DIM= "#7a6030"
BORDER    = "#4a4a5e"
INFO      = "#4a8fff"

W, H     = 1920, 1080
DPI      = 96
FW       = W / DPI
FH       = H / DPI
FPS      = 30

FOOTER   = "Loudon Live  ·  Autodidact Polymaths"

# ── Helper utilities ──────────────────────────────────────────────────────────

def make_fig():
    """Return a figure with the Graphite background."""
    fig = plt.figure(figsize=(FW, FH), facecolor=BG, dpi=DPI)
    return fig


def footer_text(fig, y=0.012):
    fig.text(
        0.985, y, FOOTER,
        ha="right", va="bottom",
        color=FG3, fontsize=11, fontfamily="monospace",
        alpha=0.75,
    )


def title_card(fig, title, subtitle=""):
    ax = fig.add_axes([0, 0, 1, 1])
    ax.set_facecolor(BG)
    ax.set_xlim(0, 1); ax.set_ylim(0, 1)
    ax.axis("off")
    ax.text(0.5, 0.55, title,
            ha="center", va="center", color=ACCENT,
            fontsize=64, fontweight="bold", fontfamily="monospace")
    if subtitle:
        ax.text(0.5, 0.42, subtitle,
                ha="center", va="center", color=FG2,
                fontsize=22, fontfamily="monospace")
    footer_text(fig)
    return ax


def caption_text(fig, text, y=0.048):
    fig.text(
        0.5, y, text,
        ha="center", va="center", color=FG2,
        fontsize=18, fontfamily="monospace",
    )


def save_frame(fig, frame_dir, idx):
    path = os.path.join(frame_dir, f"frame_{idx:06d}.png")
    fig.savefig(path, dpi=DPI, facecolor=BG)
    plt.close(fig)


def assemble_video(frame_dir, audio_path, out_path, duration_s):
    """Assemble PNG frames + audio into mp4 via ffmpeg."""
    cmd = [
        FFMPEG, "-y",
        "-framerate", str(FPS),
        "-i", os.path.join(frame_dir, "frame_%06d.png"),
        "-i", audio_path,
        "-c:v", "libx264",
        "-preset", "medium",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-ar", "48000",
        "-b:a", "192k",
        "-movflags", "+faststart",
        "-t", str(duration_s),
        out_path,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print("ffmpeg stderr:", result.stderr[-2000:])
        raise RuntimeError(f"ffmpeg failed for {out_path}")


def write_wav(path, fs, audio):
    """Write mono float audio to 16-bit wav at given fs."""
    peak = np.max(np.abs(audio))
    if peak > 0:
        audio = audio / peak * 0.89
    audio_i16 = (audio * 32767).astype(np.int16)
    wavfile.write(path, fs, audio_i16)


def blend_areas_log(areas_list, weights):
    """Blend area functions in log domain per INTERFACE.md §2."""
    log_blend = np.zeros(len(areas_list[0]))
    for a, w in zip(areas_list, weights):
        log_blend += w * np.log(np.asarray(a, dtype=float))
    return np.exp(log_blend)


def vowel_blend(name_weights):
    """Return blended 64-pt area from {vowel_name: weight} dict."""
    areas_list = []
    weights    = []
    for name, w in name_weights.items():
        areas_list.append(VDATA["vowels"][name]["area_cm2"])
        weights.append(w)
    ws = np.array(weights, dtype=float)
    ws /= ws.sum()
    return blend_areas_log(areas_list, ws)


def resample_to_N(area64, fs=44100):
    N = kl.n_sections(fs)
    return kl.resample_area(area64, N)


def formants_from_area64(area64, fs=44100):
    areas = resample_to_N(area64, fs)
    return kl.find_formants(areas, fs)


# ── Tube silhouette drawing helper ───────────────────────────────────────────

def draw_tube_silhouette(ax, areas_cm2, color=ACCENT, alpha=0.6,
                          xlim=(0.05, 0.95), y_center=0.5, max_half_h=0.30,
                          label_glottis=True, label_lips=True):
    """Draw a filled vocal-tract silhouette from a 64-pt area array.
    Areas run glottis->lips; we draw as a horizontal tube left->right.
    """
    n = len(areas_cm2)
    areas = np.asarray(areas_cm2, dtype=float)
    max_a = areas.max()
    x = np.linspace(xlim[0], xlim[1], n)
    half_h = (areas / max_a) * max_half_h

    x_poly = np.concatenate([x, x[::-1]])
    y_top  = y_center + half_h
    y_bot  = y_center - half_h
    y_poly = np.concatenate([y_top, y_bot[::-1]])

    ax.fill(x_poly, y_poly, color=color, alpha=alpha)
    ax.plot(x, y_top, color=color, linewidth=1.5, alpha=0.9)
    ax.plot(x, y_bot, color=color, linewidth=1.5, alpha=0.9)

    if label_glottis:
        ax.text(xlim[0] - 0.01, y_center, "glottis",
                ha="right", va="center", color=FG3, fontsize=13, fontfamily="monospace")
    if label_lips:
        ax.text(xlim[1] + 0.01, y_center, "lips",
                ha="left", va="center", color=FG3, fontsize=13, fontfamily="monospace")


# ═════════════════════════════════════════════════════════════════════════════
# CLIP 1 — tube morph  a -> i -> u
# Total: 2s title + 6s morph + 1s hold = ~9s  (extended to ~11s with final hold)
# ═════════════════════════════════════════════════════════════════════════════

def make_clip1():
    print("── Clip 1: tube morph a->i->u ──")
    FS = 44100

    # Load existing morph audio
    audio_path = os.path.join(RENDERS_DIR, "morph_a_i_u.wav")
    morph_fs, morph_data = wavfile.read(audio_path)
    if morph_data.ndim > 1:
        morph_data = morph_data[:, 0]
    morph_data = morph_data.astype(float) / 32768.0

    TITLE_S = 2.0
    MORPH_S = 6.0  # exact duration of morph_a_i_u.wav
    HOLD_S  = 2.0
    TOTAL_S = TITLE_S + MORPH_S + HOLD_S

    # Precompute formants for all 6 anchors and for a,i,u
    anchors = ["a", "i", "u"]
    area64  = {v: np.array(VDATA["vowels"][v]["area_cm2"]) for v in anchors}
    fmts    = {v: formants_from_area64(area64[v]) for v in anchors}

    # Build a morph timeline: a (0..2s) -> i (2..4s) -> u (4..6s), cosine blend
    def get_blend_at(t):
        """t in [0..MORPH_S]. Returns (areas64, label, weight_a, weight_i, weight_u)."""
        if t < 2.0:
            alpha = t / 2.0
            wa = 1.0 - alpha; wi = alpha; wu = 0.0
        elif t < 4.0:
            alpha = (t - 2.0) / 2.0
            wa = 0.0; wi = 1.0 - alpha; wu = alpha
        else:
            alpha = (t - 4.0) / 2.0
            wa = 0.0; wi = max(0, 1.0 - alpha); wu = min(1.0, alpha)
        # cosine ease
        wa2 = 0.5*(1-np.cos(np.pi*wa)) if wa not in (0,1) else wa
        wi2 = 0.5*(1-np.cos(np.pi*wi)) if wi not in (0,1) else wi
        wu2 = 0.5*(1-np.cos(np.pi*wu)) if wu not in (0,1) else wu
        ws = np.array([wa, wi, wu], dtype=float)
        ws /= ws.sum()
        wa, wi, wu = ws

        blended = blend_areas_log([area64["a"], area64["i"], area64["u"]], [wa, wi, wu])
        # label
        dom = np.argmax([wa, wi, wu])
        mid = max(wa, wi, wu)
        if mid > 0.85:
            lbl = ["a", "i", "u"][dom]
        else:
            pair = np.argsort([wa, wi, wu])[::-1][:2]
            lbl = f"{['a','i','u'][pair[0]]}↔{['a','i','u'][pair[1]]}"
        return blended, lbl, wa, wi, wu

    frame_dir = tempfile.mkdtemp(prefix="clip1_")
    n_title   = int(TITLE_S * FPS)
    n_morph   = int(MORPH_S * FPS)
    n_hold    = int(HOLD_S  * FPS)
    total_frames = n_title + n_morph + n_hold

    # Pad audio to total duration
    audio_total_samples = int(TOTAL_S * morph_fs)
    silence = np.zeros(max(0, audio_total_samples - len(morph_data)), dtype=morph_data.dtype)
    # put 2s of silence at front for title, then morph audio, then silence for hold
    lead_silence = np.zeros(int(TITLE_S * morph_fs))
    audio_out = np.concatenate([lead_silence, morph_data, silence])[:audio_total_samples]

    tmp_wav = os.path.join(frame_dir, "audio.wav")
    write_wav(tmp_wav, morph_fs, audio_out)

    # -- Title frames --
    print("  rendering title frames...")
    for fi in range(n_title):
        fig = make_fig()
        title_card(fig, "Kelly-Lochbaum Tract", "Vowel morph: a → i → u")
        footer_text(fig)
        save_frame(fig, frame_dir, fi)

    # -- Morph frames --
    print("  rendering morph frames...")
    for mi in range(n_morph):
        t = mi / FPS
        blended, lbl, wa, wi, wu = get_blend_at(t)
        f_live = formants_from_area64(blended)

        fig = make_fig()
        ax = fig.add_axes([0.05, 0.18, 0.90, 0.62])
        ax.set_facecolor(BG1)
        ax.set_xlim(0, 1); ax.set_ylim(0, 1)
        ax.axis("off")

        draw_tube_silhouette(ax, blended, color=ACCENT, alpha=0.55,
                              xlim=(0.06, 0.94), y_center=0.5, max_half_h=0.35)

        # vowel label top-center
        ax.text(0.5, 0.88, f"/{lbl}/",
                ha="center", va="center", color=ACCENT,
                fontsize=52, fontweight="bold", fontfamily="monospace")

        # F1/F2 readout
        ax.text(0.5, 0.12,
                f"F1 {f_live[0]:.0f} Hz     F2 {f_live[1]:.0f} Hz",
                ha="center", va="center", color=FG2,
                fontsize=18, fontfamily="monospace")

        # blend weight bar
        bar_x = [0.25, 0.50, 0.75]
        bar_labels = ["/a/", "/i/", "/u/"]
        bar_w      = [wa, wi, wu]
        bar_colors = [FG3, ACCENT if wi > 0.5 else FG3, FG3]
        for bx, bl, bv, bc in zip(bar_x, bar_labels, bar_w, bar_colors):
            fig.text(bx, 0.115, bl, ha="center", va="center",
                     color=bc, fontsize=15, fontfamily="monospace")
            rect = plt.Rectangle((bx - 0.03, 0.095), 0.06 * bv, 0.018,
                                   color=ACCENT, alpha=0.7,
                                   transform=fig.transFigure, figure=fig)
            fig.add_artist(rect)
            bg_rect = plt.Rectangle((bx - 0.03, 0.095), 0.06, 0.018,
                                     color=BG2, zorder=-1,
                                     transform=fig.transFigure, figure=fig)
            fig.add_artist(bg_rect)

        fig.text(0.5, 0.84, "vocal tract cross-section  (glottis left, lips right)",
                 ha="center", va="center", color=FG3, fontsize=13, fontfamily="monospace")

        caption_text(fig,
            "The filled silhouette is the vocal tract cross-section. "
            "Narrowing constrictions shift formants.", y=0.055)
        footer_text(fig)
        save_frame(fig, frame_dir, n_title + mi)

    # -- Hold frames (final state = /u/) --
    print("  rendering hold frames...")
    blended_final, lbl_f, wa_f, wi_f, wu_f = get_blend_at(MORPH_S - 0.01)
    f_live_final = formants_from_area64(blended_final)
    for hi in range(n_hold):
        fig = make_fig()
        ax = fig.add_axes([0.05, 0.18, 0.90, 0.62])
        ax.set_facecolor(BG1)
        ax.set_xlim(0, 1); ax.set_ylim(0, 1)
        ax.axis("off")
        draw_tube_silhouette(ax, blended_final, color=ACCENT, alpha=0.55,
                              xlim=(0.06, 0.94), y_center=0.5, max_half_h=0.35)
        ax.text(0.5, 0.88, f"/{lbl_f}/",
                ha="center", va="center", color=ACCENT,
                fontsize=52, fontweight="bold", fontfamily="monospace")
        ax.text(0.5, 0.12,
                f"F1 {f_live_final[0]:.0f} Hz     F2 {f_live_final[1]:.0f} Hz",
                ha="center", va="center", color=FG2,
                fontsize=18, fontfamily="monospace")
        caption_text(fig,
            "The filled silhouette is the vocal tract cross-section. "
            "Narrowing constrictions shift formants.", y=0.055)
        footer_text(fig)
        save_frame(fig, frame_dir, n_title + n_morph + hi)

    out_path = os.path.join(CLIPS_DIR, "clip_tube_morph.mp4")
    print(f"  assembling -> {out_path}")
    assemble_video(frame_dir, tmp_wav, out_path, TOTAL_S)
    shutil.rmtree(frame_dir)
    print("  done.")
    return out_path


# ═════════════════════════════════════════════════════════════════════════════
# CLIP 2 — Kelly-Lochbaum scattering junction anatomy
# Total: 2s title + 10s animation + 2s hold = ~14s
# ═════════════════════════════════════════════════════════════════════════════

def make_clip2():
    print("── Clip 2: scattering junction ──")
    FS = 44100

    TITLE_S = 2.0
    ANIM_S  = 10.0
    HOLD_S  = 2.0
    TOTAL_S = TITLE_S + ANIM_S + HOLD_S

    # Render slow /a/ to /i/ morph audio at 110 Hz
    n_audio = int(TOTAL_S * FS)
    # A -> I morph over TOTAL_S (begin and end with 0.5s of constant vowel)
    area64_a = np.array(VDATA["vowels"]["a"]["area_cm2"])
    area64_i = np.array(VDATA["vowels"]["i"]["area_cm2"])

    # Build a smooth alpha ramp: 0..0, ramp up to 1..1
    alpha_arr = np.zeros(n_audio)
    ramp_start = int(0.5 * FS)
    ramp_end   = int((TOTAL_S - 0.5) * FS)
    ramp_len   = ramp_end - ramp_start
    t_ramp     = np.linspace(0, np.pi, ramp_len)
    alpha_arr[ramp_start:ramp_end] = 0.5 * (1 - np.cos(t_ramp))
    alpha_arr[ramp_end:] = 1.0

    # Synthesize frame-by-frame glottal + tract (chunk by chunk)
    audio_out = np.zeros(n_audio)
    chunk = 256
    f0    = 110.0
    rng   = np.random.default_rng(7)
    # Initialize tract with /a/
    areas_n = resample_to_N(area64_a, FS)
    tract   = kl.KellyLochbaumTract(areas_n, FS,
                                     glottal_reflection=VDATA["glottal_reflection"],
                                     lip_reflection=VDATA["lip_reflection"],
                                     junction_loss=VDATA["junction_loss"])

    print("  synthesizing audio...")
    for start in range(0, n_audio, chunk):
        end = min(start + chunk, n_audio)
        alpha_mid = float(alpha_arr[(start + end) // 2])
        a64 = blend_areas_log([area64_a, area64_i], [1 - alpha_mid, alpha_mid])
        areas_n_c = resample_to_N(a64, FS)
        tract.set_areas(areas_n_c)
        exc = kl.glottal_source(end - start, FS, f0, open_quotient=0.6,
                                 tension=0.5, breath=0.05, rng=rng)
        audio_out[start:end] = tract.process(exc)

    # Normalize
    peak = np.max(np.abs(audio_out))
    if peak > 0:
        audio_out /= peak
    audio_out *= 0.85

    frame_dir = tempfile.mkdtemp(prefix="clip2_")
    tmp_wav   = os.path.join(frame_dir, "audio.wav")
    write_wav(tmp_wav, FS, audio_out)

    n_title  = int(TITLE_S * FPS)
    n_anim   = int(ANIM_S  * FPS)
    n_hold   = int(HOLD_S  * FPS)

    # We'll display junction i=10 (middle of the tube) as representative
    JUNC_IDX = 10

    eq_sym   = "k = (Aᵢ − Aᵢ₊₁) / (Aᵢ + Aᵢ₊₁)"
    eq_word  = ("reflection = (area before − area after)"
                " / (area before + area after)")

    def draw_junction_frame(alpha, fig):
        a64  = blend_areas_log([area64_a, area64_i], [1 - alpha, alpha])
        aN   = resample_to_N(a64, FS)
        Ai   = float(aN[JUNC_IDX])
        Aip1 = float(aN[JUNC_IDX + 1])
        ki   = (Ai - Aip1) / (Ai + Aip1)
        k_sign = ">" if ki > 0 else "<"

        # main axis for the junction diagram
        ax = fig.add_axes([0.08, 0.20, 0.84, 0.60])
        ax.set_facecolor(BG1)
        ax.set_xlim(0, 1); ax.set_ylim(0, 1)
        ax.axis("off")

        yc = 0.50
        max_h = 0.30

        A_max_ref = max(aN.max(), 1.0)

        # Left segment (i)
        hi  = (Ai   / A_max_ref) * max_h
        hip1= (Aip1 / A_max_ref) * max_h
        # draw left segment
        seg_left_x  = [0.08, 0.44]
        ax.fill_betweenx([yc - hi, yc + hi],
                          seg_left_x[0], seg_left_x[1],
                          color=FG4, alpha=0.5)
        ax.plot([seg_left_x[0], seg_left_x[1]], [yc + hi, yc + hi],
                color=FG2, lw=1.5)
        ax.plot([seg_left_x[0], seg_left_x[1]], [yc - hi, yc - hi],
                color=FG2, lw=1.5)
        ax.text((seg_left_x[0]+seg_left_x[1])/2, yc + hi + 0.06,
                f"Aᵢ  =  {Ai:.2f} cm²",
                ha="center", va="bottom", color=ACCENT,
                fontsize=16, fontfamily="monospace", fontweight="bold")
        ax.text((seg_left_x[0]+seg_left_x[1])/2, yc,
                f"section i",
                ha="center", va="center", color=FG3,
                fontsize=13, fontfamily="monospace")

        # Right segment (i+1)
        seg_right_x = [0.56, 0.92]
        ax.fill_betweenx([yc - hip1, yc + hip1],
                          seg_right_x[0], seg_right_x[1],
                          color=FG4, alpha=0.5)
        ax.plot([seg_right_x[0], seg_right_x[1]], [yc + hip1, yc + hip1],
                color=FG2, lw=1.5)
        ax.plot([seg_right_x[0], seg_right_x[1]], [yc - hip1, yc - hip1],
                color=FG2, lw=1.5)
        ax.text((seg_right_x[0]+seg_right_x[1])/2, yc + hip1 + 0.06,
                f"Aᵢ₊₁ =  {Aip1:.2f} cm²",
                ha="center", va="bottom", color=INFO,
                fontsize=16, fontfamily="monospace", fontweight="bold")
        ax.text((seg_right_x[0]+seg_right_x[1])/2, yc,
                f"section i+1",
                ha="center", va="center", color=FG3,
                fontsize=13, fontfamily="monospace")

        # Junction marker
        jx = 0.50
        ax.plot([jx, jx], [yc - max_h - 0.05, yc + max_h + 0.05],
                color=ACCENT, lw=2.5, linestyle="--", alpha=0.8)
        ax.text(jx, yc + max_h + 0.12,
                "scattering junction",
                ha="center", va="bottom", color=ACCENT,
                fontsize=14, fontfamily="monospace")

        # k value display
        k_color = ACCENT if abs(ki) > 0.05 else FG2
        ax.text(jx, 0.14,
                f"k  =  {ki:+.3f}",
                ha="center", va="center", color=k_color,
                fontsize=22, fontweight="bold", fontfamily="monospace")

        # Arrow labels for transmitted and reflected
        t_frac = (1.0 + ki) / 2.0   # fraction transmitted forward
        r_frac = abs(ki)

        # Forward arrow (transmitted portion)
        arr_y = yc + 0.07
        ax.annotate("",
            xy=(seg_right_x[0] + 0.08, arr_y),
            xytext=(jx + 0.02, arr_y),
            arrowprops=dict(arrowstyle=f"->,head_width={0.08+0.1*t_frac}",
                            color=FG2, lw=2.0*max(0.2, t_frac)))
        ax.text(jx + 0.12, arr_y + 0.04,
                f"transmitted {t_frac*100:.0f}%",
                ha="center", va="bottom", color=FG2,
                fontsize=12, fontfamily="monospace")

        # Backward arrow (reflected portion)
        arr_y2 = yc - 0.07
        ax.annotate("",
            xy=(seg_left_x[1] - 0.08, arr_y2),
            xytext=(jx - 0.02, arr_y2),
            arrowprops=dict(arrowstyle=f"->,head_width={0.06+0.1*r_frac}",
                            color=ACCENT_DIM, lw=2.0*max(0.1, r_frac)))
        ax.text(jx - 0.12, arr_y2 - 0.04,
                f"reflected {r_frac*100:.0f}%",
                ha="center", va="top", color=ACCENT_DIM,
                fontsize=12, fontfamily="monospace")

        # Vowel label top left
        vow_lbl = "a" if alpha < 0.5 else "i"
        ax.text(0.04, 0.90,
                f"morph /a/ → /i/   α={alpha:.2f}",
                ha="left", va="top", color=FG3,
                fontsize=13, fontfamily="monospace")

        # Equations — symbolic + worded (house rule: both forms)
        fig.text(0.5, 0.175,
                 eq_sym,
                 ha="center", va="center",
                 color=FG1, fontsize=15, fontfamily="monospace")
        fig.text(0.5, 0.135,
                 eq_word,
                 ha="center", va="center",
                 color=FG3, fontsize=13, fontfamily="monospace",
                 style="italic")

        caption_text(fig,
            "As the tube morphs, area ratio changes k; k sets how much "
            "energy reflects vs. transmits at each junction.",
            y=0.055)
        footer_text(fig)

    print("  rendering title frames...")
    for fi in range(n_title):
        fig = make_fig()
        title_card(fig, "Scattering Junction",
                   "Kelly-Lochbaum  —  reflection coefficient k")
        footer_text(fig)
        save_frame(fig, frame_dir, fi)

    print("  rendering animation frames...")
    for ai in range(n_anim):
        t     = ai / FPS
        # alpha from 0 (a) to 1 (i) over ANIM_S
        alpha = 0.5 * (1 - np.cos(np.pi * t / ANIM_S))
        fig = make_fig()
        draw_junction_frame(alpha, fig)
        save_frame(fig, frame_dir, n_title + ai)

    print("  rendering hold frames...")
    for hi in range(n_hold):
        fig = make_fig()
        draw_junction_frame(1.0, fig)
        save_frame(fig, frame_dir, n_title + n_anim + hi)

    out_path = os.path.join(CLIPS_DIR, "clip_scattering_junction.mp4")
    print(f"  assembling -> {out_path}")
    assemble_video(frame_dir, tmp_wav, out_path, TOTAL_S)
    shutil.rmtree(frame_dir)
    print("  done.")
    return out_path


# ═════════════════════════════════════════════════════════════════════════════
# CLIP 3 — Rosenberg glottal pulse
# Total: 2s title + 10s anim + 2s hold = ~14s
# ═════════════════════════════════════════════════════════════════════════════

def make_clip3():
    print("── Clip 3: glottal source ──")
    FS = 44100

    TITLE_S = 2.0
    ANIM_S  = 10.0
    HOLD_S  = 2.0
    TOTAL_S = TITLE_S + ANIM_S + HOLD_S

    # Render /a/ at 110 Hz sweeping tension 0.2->0.9 then breath 0->0.5
    # Phase 1: 0..5s tension sweep (breath=0.05 constant)
    # Phase 2: 5..10s breath sweep (tension=0.9 constant)
    n_audio  = int(TOTAL_S * FS)
    audio_out = np.zeros(n_audio)
    n_title_s = int(TITLE_S * FS)
    n_anim_s  = int(ANIM_S * FS)

    area64_a = np.array(VDATA["vowels"]["a"]["area_cm2"])
    areaN    = resample_to_N(area64_a, FS)

    f0 = 110.0
    chunk = 256
    rng = np.random.default_rng(42)
    tract = kl.KellyLochbaumTract(areaN, FS,
                                   glottal_reflection=VDATA["glottal_reflection"],
                                   lip_reflection=VDATA["lip_reflection"],
                                   junction_loss=VDATA["junction_loss"])

    HALF_ANIM = n_anim_s // 2

    print("  synthesizing audio...")
    for start in range(n_title_s, n_audio, chunk):
        end = min(start + chunk, n_audio)
        t_local = (start - n_title_s) / FS  # 0..ANIM_S
        t_local = float(np.clip(t_local, 0, ANIM_S))

        if t_local < ANIM_S / 2:
            tension = 0.2 + 0.7 * (t_local / (ANIM_S / 2))
            breath  = 0.05
        else:
            tension = 0.9
            breath  = 0.5 * ((t_local - ANIM_S / 2) / (ANIM_S / 2))

        exc = kl.glottal_source(end - start, FS, f0,
                                 open_quotient=0.6, tension=tension,
                                 breath=breath, rng=rng)
        audio_out[start:end] = tract.process(exc)

    peak = np.max(np.abs(audio_out))
    if peak > 0:
        audio_out /= peak
    audio_out *= 0.85

    frame_dir = tempfile.mkdtemp(prefix="clip3_")
    tmp_wav   = os.path.join(frame_dir, "audio.wav")
    write_wav(tmp_wav, FS, audio_out)

    n_title = int(TITLE_S * FPS)
    n_anim  = int(ANIM_S  * FPS)
    n_hold  = int(HOLD_S  * FPS)

    def get_params(t):
        """Given t in [0, ANIM_S], return (tension, breath)."""
        if t < ANIM_S / 2:
            tension = 0.2 + 0.7 * (t / (ANIM_S / 2))
            breath  = 0.05
        else:
            tension = 0.9
            breath  = 0.5 * ((t - ANIM_S / 2) / (ANIM_S / 2))
        return float(tension), float(breath)

    def make_pulse_and_spectrum(tension, breath, FS=44100, f0=110.0):
        """Return one period of the pulse and its spectrum magnitude."""
        period = int(round(FS / f0))
        pulse  = kl.rosenberg_pulse(period, open_quotient=0.6, tension=tension)

        # spectrum: 4 periods, voiced + noise mix
        rng2 = np.random.default_rng(0)
        n_sp = 4 * period
        exc_sp = kl.glottal_source(n_sp, FS, f0,
                                    open_quotient=0.6, tension=tension,
                                    breath=breath, rng=rng2)
        # windowed
        win = np.hanning(n_sp)
        X   = np.abs(np.fft.rfft(exc_sp * win, n=4096))
        freqs = np.fft.rfftfreq(4096, 1.0 / FS)
        # keep 0..6000 Hz
        mask = freqs <= 6000
        return pulse, freqs[mask], X[mask]

    print("  rendering title frames...")
    for fi in range(n_title):
        fig = make_fig()
        title_card(fig, "Glottal Source",
                   "Rosenberg pulse  —  tension & breath sweep")
        footer_text(fig)
        save_frame(fig, frame_dir, fi)

    print("  rendering animation frames...")
    for ai in range(n_anim):
        t = ai / FPS
        tension, breath = get_params(t)
        pulse, freqs, Xmag = make_pulse_and_spectrum(tension, breath)

        fig = make_fig()

        # Top axis: waveform
        ax_wave = fig.add_axes([0.08, 0.55, 0.84, 0.32])
        ax_wave.set_facecolor(BG1)
        period = len(pulse)
        t_ax   = np.linspace(0, 1000 * period / FS, period)
        ax_wave.plot(t_ax, pulse, color=ACCENT, lw=2.0)
        ax_wave.set_xlim(t_ax[0], t_ax[-1])
        ax_wave.set_ylim(-0.05, 1.15)
        ax_wave.set_ylabel("glottal flow", color=FG2, fontsize=13, fontfamily="monospace")
        ax_wave.set_xlabel("time (ms)", color=FG2, fontsize=13, fontfamily="monospace")
        ax_wave.tick_params(colors=FG3, labelsize=11)
        for sp in ax_wave.spines.values():
            sp.set_color(BORDER)
        ax_wave.set_facecolor(BG1)
        ax_wave.tick_params(axis='x', colors=FG3)
        ax_wave.tick_params(axis='y', colors=FG3)
        ax_wave.xaxis.label.set_color(FG2)
        ax_wave.yaxis.label.set_color(FG2)
        for tick in ax_wave.get_xticklabels() + ax_wave.get_yticklabels():
            tick.set_fontfamily("monospace")
            tick.set_color(FG3)

        # tension annotation
        ax_wave.text(0.97, 0.88,
                     f"tension  {tension:.2f}",
                     ha="right", va="top", transform=ax_wave.transAxes,
                     color=ACCENT, fontsize=15, fontfamily="monospace",
                     fontweight="bold")
        ax_wave.text(0.97, 0.70,
                     f"breath   {breath:.2f}",
                     ha="right", va="top", transform=ax_wave.transAxes,
                     color=INFO, fontsize=15, fontfamily="monospace")
        ax_wave.set_title("one glottal period  (f₀ = 110 Hz)",
                           color=FG2, fontsize=14, fontfamily="monospace", pad=6)

        # Bottom axis: spectrum
        ax_spec = fig.add_axes([0.08, 0.21, 0.84, 0.28])
        ax_spec.set_facecolor(BG1)
        Xdb = 20 * np.log10(Xmag + 1e-9)
        Xdb -= Xdb.max()
        ax_spec.plot(freqs / 1000, Xdb, color=FG2, lw=1.5, alpha=0.9)
        ax_spec.fill_between(freqs / 1000, Xdb, -80, color=FG2, alpha=0.15)
        # noise floor rise
        noise_floor = -60 + 30 * breath
        ax_spec.axhline(noise_floor, color=INFO, lw=1.2, linestyle="--", alpha=0.7)
        ax_spec.text(5.8, noise_floor + 1.5,
                     "breath floor",
                     ha="right", va="bottom", color=INFO,
                     fontsize=11, fontfamily="monospace")
        ax_spec.set_xlim(0, 6)
        ax_spec.set_ylim(-80, 5)
        ax_spec.set_xlabel("frequency (kHz)", color=FG2, fontsize=13, fontfamily="monospace")
        ax_spec.set_ylabel("level (dB)", color=FG2, fontsize=13, fontfamily="monospace")
        for sp in ax_spec.spines.values():
            sp.set_color(BORDER)
        ax_spec.tick_params(colors=FG3, labelsize=11)
        for tick in ax_spec.get_xticklabels() + ax_spec.get_yticklabels():
            tick.set_fontfamily("monospace")
            tick.set_color(FG3)
        ax_spec.set_title("source spectrum   (higher tension = less spectral tilt)",
                           color=FG2, fontsize=14, fontfamily="monospace", pad=6)

        caption_text(fig,
            "Top: glottal pulse shape changes with tension. "
            "Bottom: spectrum tilts; breath raises the noise floor.",
            y=0.055)
        footer_text(fig)
        save_frame(fig, frame_dir, n_title + ai)

    print("  rendering hold frames...")
    tension_f, breath_f = get_params(ANIM_S - 0.01)
    pulse_f, freqs_f, Xmag_f = make_pulse_and_spectrum(tension_f, breath_f)
    for hi in range(n_hold):
        fig = make_fig()
        ax_wave = fig.add_axes([0.08, 0.55, 0.84, 0.32])
        ax_wave.set_facecolor(BG1)
        period_f = len(pulse_f)
        t_ax_f   = np.linspace(0, 1000 * period_f / FS, period_f)
        ax_wave.plot(t_ax_f, pulse_f, color=ACCENT, lw=2.0)
        ax_wave.set_xlim(t_ax_f[0], t_ax_f[-1])
        ax_wave.set_ylim(-0.05, 1.15)
        ax_wave.set_ylabel("glottal flow", color=FG2, fontsize=13, fontfamily="monospace")
        ax_wave.set_xlabel("time (ms)", color=FG2, fontsize=13, fontfamily="monospace")
        for sp in ax_wave.spines.values():
            sp.set_color(BORDER)
        ax_wave.tick_params(colors=FG3, labelsize=11)
        for tick in ax_wave.get_xticklabels() + ax_wave.get_yticklabels():
            tick.set_fontfamily("monospace")
            tick.set_color(FG3)
        ax_wave.text(0.97, 0.88, f"tension  {tension_f:.2f}",
                     ha="right", va="top", transform=ax_wave.transAxes,
                     color=ACCENT, fontsize=15, fontfamily="monospace", fontweight="bold")
        ax_wave.text(0.97, 0.70, f"breath   {breath_f:.2f}",
                     ha="right", va="top", transform=ax_wave.transAxes,
                     color=INFO, fontsize=15, fontfamily="monospace")
        ax_wave.set_title("one glottal period  (f₀ = 110 Hz)",
                           color=FG2, fontsize=14, fontfamily="monospace", pad=6)

        ax_spec = fig.add_axes([0.08, 0.21, 0.84, 0.28])
        ax_spec.set_facecolor(BG1)
        Xdb_f = 20 * np.log10(Xmag_f + 1e-9)
        Xdb_f -= Xdb_f.max()
        ax_spec.plot(freqs_f / 1000, Xdb_f, color=FG2, lw=1.5, alpha=0.9)
        ax_spec.fill_between(freqs_f / 1000, Xdb_f, -80, color=FG2, alpha=0.15)
        noise_floor_f = -60 + 30 * breath_f
        ax_spec.axhline(noise_floor_f, color=INFO, lw=1.2, linestyle="--", alpha=0.7)
        ax_spec.text(5.8, noise_floor_f + 1.5, "breath floor",
                     ha="right", va="bottom", color=INFO,
                     fontsize=11, fontfamily="monospace")
        ax_spec.set_xlim(0, 6)
        ax_spec.set_ylim(-80, 5)
        ax_spec.set_xlabel("frequency (kHz)", color=FG2, fontsize=13, fontfamily="monospace")
        ax_spec.set_ylabel("level (dB)", color=FG2, fontsize=13, fontfamily="monospace")
        for sp in ax_spec.spines.values():
            sp.set_color(BORDER)
        ax_spec.tick_params(colors=FG3, labelsize=11)
        for tick in ax_spec.get_xticklabels() + ax_spec.get_yticklabels():
            tick.set_fontfamily("monospace")
            tick.set_color(FG3)
        ax_spec.set_title("source spectrum   (higher tension = less spectral tilt)",
                           color=FG2, fontsize=14, fontfamily="monospace", pad=6)

        caption_text(fig,
            "Top: glottal pulse shape changes with tension. "
            "Bottom: spectrum tilts; breath raises the noise floor.",
            y=0.055)
        footer_text(fig)
        save_frame(fig, frame_dir, n_title + n_anim + hi)

    out_path = os.path.join(CLIPS_DIR, "clip_glottal_source.mp4")
    print(f"  assembling -> {out_path}")
    assemble_video(frame_dir, tmp_wav, out_path, TOTAL_S)
    shutil.rmtree(frame_dir)
    print("  done.")
    return out_path


# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    paths = []
    paths.append(make_clip1())
    paths.append(make_clip2())
    paths.append(make_clip3())
    print("\nAll clips written:")
    for p in paths:
        print(" ", p)
