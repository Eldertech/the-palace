#!/usr/bin/env python3
"""
Loudon Live — Starting Soon card (test render, single-file MVP)

Generates a 1920x1080 'Starting Soon' OBS scene card.
Output: ./out/stream-{NNN}-test/starting-soon.svg + .png

Designed to be split into palettes/generators/templates after first review.
For now: one file, one render, fast feedback loop.

Usage:
    python3 render_starting_soon.py
        # uses defaults: graphite palette, waveform generator, seed 42

    python3 render_starting_soon.py --palette amber-lab --seed 7 --topic "phase noise"
"""
import argparse
import math
import random
import subprocess
import sys
from pathlib import Path


# -----------------------------------------------------------------------------
# PALETTES — six starter palettes
# -----------------------------------------------------------------------------
PALETTES = {
    "graphite": {
        "bg":      "#1a1a1d",
        "ink":     "#f0ebe1",
        "accent":  "#e8a04a",
        "muted":   "#3a3a3f",
    },
    "amber-lab": {
        "bg":      "#f4ecdc",
        "ink":     "#2a1d10",
        "accent":  "#e8651b",
        "muted":   "#d6c9b0",
    },
    "teal-patch": {
        "bg":      "#0d3a3d",
        "ink":     "#cfe9eb",
        "accent":  "#ff7f64",
        "muted":   "#1a4d50",
    },
    "dusk-tape": {
        "bg":      "#3a2840",
        "ink":     "#f1e6db",
        "accent":  "#d8b94a",
        "muted":   "#54394f",
    },
    "cobalt-grid": {
        "bg":      "#0e1f4d",
        "ink":     "#e8ecff",
        "accent":  "#a8e040",
        "muted":   "#1c3066",
    },
    "bone-synth": {
        "bg":      "#ece5d5",
        "ink":     "#262422",
        "accent":  "#d83483",
        "muted":   "#cdc5b3",
    },
}


# -----------------------------------------------------------------------------
# GENERATIVE ELEMENT — Waveform stack
# -----------------------------------------------------------------------------
def waveform_stack(seed, width, height, accent_color, alpha=0.55):
    """
    Returns a string of SVG <polyline> elements forming a stack of waveforms.
    Four layers: sine + saw + square + noise. Seeded.
    """
    rng = random.Random(seed)
    n_samples = 600
    cy = height / 2

    # (family, freq_mult range, amp, layer_alpha)
    layers = [
        ("sine",   rng.uniform(1.5, 3.5), 0.85, 0.55),
        ("saw",    rng.uniform(0.8, 1.7), 0.55, 0.35),
        ("square", rng.uniform(2.0, 5.0), 0.35, 0.25),
        ("noise",  rng.uniform(8.0, 14.0), 0.25, 0.18),
    ]

    out = []
    for family, fmult, amp, layer_alpha in layers:
        phase = rng.random() * math.tau
        pts = []
        for i in range(n_samples):
            x = i / (n_samples - 1) * width
            t = i / (n_samples - 1)
            arg = t * math.tau * fmult + phase
            if family == "sine":
                y = math.sin(arg)
            elif family == "saw":
                y = ((arg / math.tau) % 1.0) * 2 - 1
            elif family == "square":
                y = 1.0 if math.sin(arg) >= 0 else -1.0
            else:  # noise
                y = math.sin(arg) * (0.5 + 0.5 * rng.random())
            yp = cy - y * cy * amp * 0.9
            pts.append(f"{x:.1f},{yp:.1f}")
        d = " ".join(pts)
        out.append(
            f'<polyline points="{d}" fill="none" '
            f'stroke="{accent_color}" stroke-width="2" '
            f'stroke-opacity="{layer_alpha * alpha:.3f}" '
            f'stroke-linecap="round" stroke-linejoin="round"/>'
        )
    return "\n    ".join(out)


# -----------------------------------------------------------------------------
# STARTING SOON TEMPLATE
# -----------------------------------------------------------------------------
def render_starting_soon_svg(palette_name, seed, topic, stream_n):
    p = PALETTES[palette_name]
    W, H = 1920, 1080

    gen_y = 320
    gen_h = 700

    svg = f'''<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 {W} {H}"
     width="{W}" height="{H}">

  <!-- background -->
  <rect width="{W}" height="{H}" fill="{p['bg']}"/>

  <!-- thin frame line, 64px inset -->
  <rect x="64" y="64" width="{W-128}" height="{H-128}"
        fill="none" stroke="{p['muted']}" stroke-width="1" opacity="0.4"/>

  <!-- generative element (waveform stack), behind everything below -->
  <g transform="translate(0,{gen_y})">
    {waveform_stack(seed, W, gen_h, p['accent'], alpha=0.6)}
  </g>

  <!-- headline -->
  <text x="120" y="270"
        font-family="Georgia, 'Times New Roman', serif"
        font-size="156" font-weight="700"
        fill="{p['ink']}"
        letter-spacing="-3">Starting soon</text>

  <!-- subhead -->
  <text x="124" y="335"
        font-family="Helvetica, Arial, sans-serif"
        font-size="32" font-weight="400"
        fill="{p['ink']}" opacity="0.75"
        letter-spacing="0.5">Loudon Live · sound from the ground up</text>

  <!-- topic line (eyebrow) -->
  <text x="124" y="395"
        font-family="Helvetica, Arial, sans-serif"
        font-size="26" font-weight="600"
        fill="{p['accent']}"
        letter-spacing="2">TODAY · {topic.upper()}</text>

  <!-- bottom-left: stream number -->
  <text x="120" y="{H - 90}"
        font-family="Helvetica, Arial, sans-serif"
        font-size="22" font-weight="400"
        fill="{p['ink']}" opacity="0.5"
        letter-spacing="3">STREAM {stream_n:03d}</text>

  <!-- bottom-right: wordmark -->
  <text x="{W - 120}" y="{H - 90}"
        font-family="Georgia, 'Times New Roman', serif"
        font-size="36" font-weight="700"
        fill="{p['ink']}"
        text-anchor="end"
        letter-spacing="-0.5">Loudon Live</text>

</svg>
'''
    return svg


# -----------------------------------------------------------------------------
# MAIN
# -----------------------------------------------------------------------------
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--palette", default="graphite", choices=list(PALETTES))
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--topic", default="first principles")
    ap.add_argument("--stream", type=int, default=0)
    ap.add_argument("--out-dir", default=None,
                    help="output directory (default: ./out/stream-NNN-test)")
    args = ap.parse_args()

    base = Path(__file__).parent
    if args.out_dir:
        out_dir = Path(args.out_dir)
    else:
        out_dir = base / "out" / f"stream-{args.stream:03d}-test"
    out_dir.mkdir(parents=True, exist_ok=True)

    svg_path = out_dir / "starting-soon.svg"
    png_path = out_dir / "starting-soon.png"

    svg = render_starting_soon_svg(args.palette, args.seed, args.topic, args.stream)
    svg_path.write_text(svg)
    print(f"wrote {svg_path}")

    # Convert SVG → PNG via cairosvg (better text rendering than ImageMagick)
    try:
        import cairosvg
        cairosvg.svg2png(
            bytestring=svg.encode("utf-8"),
            write_to=str(png_path),
            output_width=1920,
            output_height=1080,
        )
        print(f"wrote {png_path}")
    except ImportError:
        # Fallback: ImageMagick (text rendering may be poor)
        try:
            subprocess.run(
                ["convert", "-density", "144", "-background", "none",
                 str(svg_path), str(png_path)],
                check=True, capture_output=True, text=True
            )
            print(f"wrote {png_path} (via ImageMagick)")
        except (FileNotFoundError, subprocess.CalledProcessError):
            print("warning: no SVG→PNG converter available — SVG written only.")


if __name__ == "__main__":
    main()
