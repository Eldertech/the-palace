---
type: specialist
status: stub
medium: image
tool: matplotlib
tool_version: 3.9.x
adopted: 2026-05-09
last_tested:
last_gotcha:
license: PSF / BSD-style
links:
  - { label: "wraps", target: "matplotlib (external)" }
  - { label: "directed-by", target: "Shop/Maker" }
  - { label: "alternative-to", target: "Shop/Plotly (planned)" }
  - { label: "tested-by", target: "Artifacts/Shop/Matplotlib/tests/" }
tags: [specialist, shop, image, chart, scientific, stub]
---

# Matplotlib

*This entry is a stub. Sections are present but lightly written. The first real job will fill it in.*

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

*(Empty until first job.)*

## Recipes

*(Links to `Artifacts/Shop/Matplotlib/recipes/` once they exist.)*

## Test Suite

Smoke / Capability Probe / Style Probe / Edge Probe / Speed Bench / Determinism — defined in `Artifacts/Shop/Matplotlib/tests/test-plan.md` (TODO). Last run: never.

## Open Questions

- Default style sheet for the palace — declare a `palace.mplstyle` file with the base palette, font choices, and grid defaults? Yes; defer to first real job
- `text.usetex=True` requires a working LaTeX installation — same one Manim CE uses. Worth declaring the dependency once and assuming it
- Matplotlib vs. Plotly routing: Plotly when interactivity is on the table; Matplotlib otherwise. The Maker's call per brief

## Lost Branches

- Seaborn as a higher-level wrapper — discarded for the Specialist layer; the Maker may pull in Seaborn within a script when its API is the right ergonomic, but the Specialist holds matplotlib

## Forward Vector

First job: a Bode plot of a wavetable filter response at Study tier with the palace base palette. The result validates the palette-injection pipeline and surfaces the first batch of typography gotchas.
