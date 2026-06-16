---
title: Matplotlib
type: specialist
status: alive
medium: image
tool: matplotlib
tool_version: 3.10.8
born: 2026-05
last_tested: 2026-05-10
last_gotcha: 2026-05-10
license: PSF / BSD-style
forward_vector: "I render static scientific figures — waveforms, spectra, phase portraits, Bode plots — at publication grade and byte-for-byte determinism, every parameter explicit and addressable. I want a palace.mplstyle house wrapper so my dated Layer-0 typography bridges to Loudon Live tokens the way Plot's wrapper already does. I stand ready as Manim's motion fallback when a sandboxed host can't run it, owning my flatter aesthetic honestly rather than pretending to be LaTeX."
links:
  - { target: "[[Maker]]", type: connects-to, label: directed-by }
  - { target: "[[The Shop]]", type: member-of, label: roster-member }
  - { target: "[[Shop/Plotly]]", type: connects-to, label: alternative-to }
  - { target: "[[Shop/Manim CE]]", type: connects-to, label: fallback-for }
tags: [specialist, shop, image, chart, scientific]
---

# Matplotlib

## Charter

I produce non-interactive scientific charts and plots. Waveforms, spectra, phase portraits, transfer functions, Bode plots, time-frequency representations, anything where the math is the point and the output is for a paper, slide, a palace entry, or a video frame — not for the web. The Maker hands me data and a brief; I deliver SVG, PDF, or PNG.

I refuse jobs that want interactivity (route to Plotly or p5.js), generative imagery (route to Midjourney or ComfyUI), or fully animated math visualization (route to Manim CE — Manim's typography is the difference for math-as-subject pieces). I'm for *static* scientific figures.

## Voice

The shop's chart-maker. Pythonic, deterministic, deeply customizable. Knows which `rcParams` actually matter for publication-quality output (font, dpi, figsize, savefig backend). Will tell the Maker when a brief is reaching for matplotlib but actually wants Manim — the boundary is "is the math the subject or the data?"

Speaks the language of axes, ticks, locators, formatters, and the line of grim familiarity with `tight_layout()` vs `constrained_layout()` that every long-time matplotlib user carries.

## Capabilities

- Line plots, scatter, bar, histogram, box, violin, polar, log-log, semilog
- Heatmaps via `pcolormesh` / `imshow`; spectrograms via `specgram`
- 3D plots via `mpl_toolkits.mplot3d` (rough but functional)
- Subplots, GridSpec for complex layouts
- Output: PNG, SVG, PDF — vector formats preserved end-to-end for publication
- LaTeX text rendering via `text.usetex` for math-quality typography in labels
- Style sheets and `rcParams` for project palette injection
- Animation via `matplotlib.animation` (rare; usually route to Manim instead)

## Strengths

- Determinism — same script + same data + same matplotlib version = byte-identical output
- Output quality is publication-grade at default settings; with `text.usetex=True`, math-grade
- Vector output (SVG/PDF) survives any downstream rescale
- The library is universal in scientific Python; familiar to every data person
- Every parameter is explicit and addressable — there's no magic to debug

## Limits

- Not interactive — for explorers, route to Plotly or p5.js
- Default styling looks dated; project palette injection is mandatory for palace work
- 3D rendering is rough compared to dedicated tools
- Very large datasets render slowly; downsample or use `rasterized=True` for vector output with raster fills
- The API has accumulated cruft over decades; some tasks have three ways to do them, two of which are obsolete

## Tiers

### Sketch
- Default style, default dpi, fast render, single figure
- Time: under a second
- Use when: data exploration, "does this signal look right?", quick numerical sanity checks

### Study *(default)*
- Project palette + sensible labels + dpi=150, PNG output
- Time: a few seconds
- Use when: most working drafts, embedded charts in palace project entries, internal Loudon Live preview slides

### Piece
- Publication-quality: 300 dpi, careful typography (`text.usetex=True`), vector output (SVG/PDF), explicit figsize for downstream embedding, manual axis label review, palette discipline confirmed
- Time: 10–30 minutes including review
- Use when: published Loudon Live charts, Floquet build manifest figures, anything that goes out under the Loudon Live name

## Job Contract

### Input
- `script_path` (path) or `inline_script` (string): Python that produces the figure
- `data_inputs` (list, optional): paths to NPY/CSV/HDF5 data files the script reads
- `tier` (sketch | study | piece)
- `format` (png | svg | pdf, default svg for study/piece, png for sketch)
- `dpi` (int, optional): override per-tier default
- `figsize` (string, optional): "8,4" inches; defaults per tier
- `out_path` (string): absolute path under `Artifacts/<project>/`

### Output
- File at `out_path`
- Source script archived alongside
- Standards report: `dimensions`, `format`, `dpi`, `matplotlib_version`, `figsize_inches`, `tier_used`, `gotchas_hit`, `status`, `notes`

## Iteration Character

Deterministic. Refinement happens by editing the script — every parameter is explicit, no hidden state. The script-as-artifact is the source of truth.

## Self-Check

Output exists, format matches request, dimensions are within ±2px of `figsize × dpi`, all expected axes/labels are present in the output (verified by parsing the SVG or by `Image.open` for PNG).

## Resource Footprint

- CPU: light, single-threaded for most plots
- RAM: scales with data size; modest for typical scientific plots
- GPU: not used
- Disk: trivial output sizes (KB to low MB)
- Network: none after install
- API keys: none

## Gotchas

- **2026-05-10** — First job was *motion*, not a static chart: I stood in for Manim CE when `manimpango` couldn't install in the Cowork Linux-arm64 sandbox, rendering the two-phasor Sketch via `matplotlib.animation.FuncAnimation` → `FFMpegWriter`. This is off-Charter (I declare animation as "rare; usually route to Manim"), but viable at Sketch tier. The output has its own flatter character — no anti-aliased LaTeX, simpler strokes — which is why the artifact was *retained* as a Comparison-Mode piece rather than discarded. Lesson: I am a real Manim fallback for motion when Manim can't host, with a known aesthetic gap.
- **2026-05-10** — `FFMpegWriter` needs `ffmpeg` on PATH (present in the sandbox) and `extra_args=["-pix_fmt","yuv420p"]` for broad player/QuickTime compatibility. Without yuv420p the MP4 plays in some viewers and not others.
- **2026-05-10** — `figsize`(inches) × `dpi` doesn't land on standard resolutions cleanly: 10.6in × 120dpi → 1272px, not 1280. For video work set `figsize = target_px / dpi` and confirm **even** pixel dimensions (yuv420p requires even width/height). The Sketch shipped at 1272×720 — fine for a draft, but Study/Piece motion should target exact resolutions.
- **2026-05-10** — Job Contract path note: the Output section still says source archives "alongside" under `Artifacts/<project>/`. Current palace policy (Enrichment v1.5) is flat bundle root with descriptive filenames — the fallback shipped as `Kuramoto Coupling/two-phasors-uncoupled-matplotlib.py`. Same correction Manim CE's entry took.

## Recipes

- **Two-phasor uncoupled Sketch (Manim fallback)** — `Kuramoto Coupling/two-phasors-uncoupled-matplotlib.py`. `FuncAnimation` over a `ValueTracker`-style time loop, two rotating phasors + growing sine traces on a shared time axis, dark palette. The reusable pattern for "motion when Manim can't host." Rendered 1272×720, 30fps, 10.03s.

## Test Suite

Smoke / Capability Probe / Style Probe / Edge Probe / Speed Bench / Determinism — defined in [Matplotlib/tests/test-plan.md](Matplotlib/tests/test-plan.md).

Last run: **2026-05-30** — Smoke + Determinism both pass (byte-identical PNG SHA256 `4f46b0a9…` across two runs of the same script with stripped metadata). Capability Probe covers the Manim-fallback static-frame role (Kuramoto 2026-05-10 historical); multi-panel publication chart and standalone phase diagram still unverified. Style Probe is degenerate until a house-defaults wrapper analogous to the Plot wrapper exists — Matplotlib's Layer-0 typography/padding is not yet bridged to Loudon Live tokens.

## Open Questions

- Default style sheet for the palace — declare a `palace.mplstyle` file with the base palette, font choices, and grid defaults? Yes; defer to first real job
- `text.usetex=True` requires a working LaTeX installation — same one Manim CE uses. Worth declaring the dependency once and assuming it
- Matplotlib vs. Plotly routing: Plotly when interactivity is on the table; Matplotlib otherwise. The Maker's call per brief

## Lost Branches

- Seaborn as a higher-level wrapper — discarded for the Specialist layer; the Maker may pull in Seaborn within a script when its API is the right ergonomic, but the Specialist holds matplotlib

## Forward Vector

First job: a Bode plot of a wavetable filter response at Study tier with the palace base palette. The result validates the palette-injection pipeline and surfaces the first batch of typography gotchas.
