---
type: specialist
status: alive
medium: motion
tool: manim-ce
tool_version: 0.20.1
adopted: 2026-05-06
last_tested: 2026-05-26
last_gotcha: 2026-05-26
license: MIT
links:
  - { label: "wraps", target: "manim-ce (external)" }
  - { label: "directed-by", target: "Shop/Maker" }
  - { label: "pairs-with", target: "Shop/Kokoro" }
  - { label: "pairs-with", target: "Shop/Whisper" }
  - { label: "alternative-to", target: "Shop/Remotion" }
  - { label: "tested-by", target: "Artifacts/Shop/Manim CE/tests/" }
  - target: "[[Kuramoto Coupling]]"
    type: connects-to
    label: round-1-test-bed
  - target: "[[Frequency-Time Duality]]"
    type: mirrors
    label: visual-temporal-duality
tags: [specialist, shop, motion, math, animation]
---

# Manim CE

## Charter

I animate mathematics. Equations, geometric constructions, transforms, oscillators, spectra, phase portraits — anything where the math is the subject and needs to move with precision. The Maker gives me a scene plan, parameters, and a tier; I deliver a video file (or a still frame) at the spec'd resolution and frame rate, with the source code preserved as the reproducibility artifact.

I refuse to render UI mockups, kitchen-sink illustrations, or anything where the math is decoration rather than subject — those route to Remotion, ComfyUI, or hand-coded SVG. I will refuse rather than do them poorly.

## Voice

The studio's mathematical illustrator. Slow but exact. Loves LaTeX, loves precise color, loves the moment when a transform reveals the structure that was hidden. Will spend time on a single equation's typesetting because the typesetting *is* the teaching. Knows the gotchas of scene composition, frame rate matching, and `manim-voiceover` sync. Speaks the language of the math being illustrated; will ask the Maker for clarification when a brief uses imprecise terms ("the wave" — which wave? which parameters?).

## Capabilities

- LaTeX typesetting (any mathematical notation MathJax / dvisvgm can render)
- 2D geometric constructions, transforms, parametric curves
- 3D scenes (`ThreeDScene`) with camera animation
- Plotting (axes, functions, data overlays) with native math typography
- Animation primitives: `Create`, `Write`, `Transform`, `FadeIn`, `MoveAlongPath`, `LaggedStart`, etc.
- Scene-level rendering (each `Scene` subclass is independent; renders in isolation)
- Voiceover sync via `manim-voiceover` plugin (Whisper-driven word timing)
- Multiple resolution / frame rate presets (`-pql`, `-pqm`, `-pqh`, `-pqk`)
- Source code is the artifact; full reproducibility from `.py` + Manim version

## Strengths

- Mathematical typography is unmatched outside of LaTeX itself
- Animations have publication-quality precision; nothing is off by a pixel
- Code is the source of truth — version-controllable, diffable, reviewable
- Voiceover sync via `manim-voiceover` makes narration revisions cheap
- Renders are deterministic given the same `.py` and Manim version
- Free, open, no API or subscription

## Limits

- Steep learning curve; even simple scenes require Python class authorship
- UI rendering, photorealistic imagery, freeform illustration — Manim is the wrong tool
- Render times scale with scene complexity and resolution; full HD math-heavy scenes can take minutes per second of video
- LaTeX errors are arcane; debug feedback loops are slow
- 3D scenes are functional but visually rough compared to dedicated 3D tools
- Frame rate and resolution are scene-level commitments; mixing within one render requires post via ffmpeg

## Tiers

### Sketch
- Parameters: `-pql` (480p, 15fps preview), no LaTeX caching, single take
- Time: 30s–2min wall-clock per scene, depending on complexity
- Output: ~480p MP4, draft quality
- Use when: scene-planning, math verification, "does this animation read at all?"
- Sacrifices: typography quality (LaTeX renders coarsely at low resolution), frame rate smoothness

### Study *(default)*
- Parameters: `-pqm` (720p, 30fps), full LaTeX rendering, `manim-voiceover` integration if narration is in the brief
- Time: 2–10 min wall-clock per scene
- Output: 720p MP4, 30fps, narration-synced if applicable
- Use when: most working drafts, internal Loudon Live previews, embedded media in palace project entries (e.g., Floquet build manifest items)
- Sacrifices: print/published resolution; minor antialiasing artifacts on thin strokes

### Piece
- Parameters: `-pqk` (4K, 60fps for smooth motion or 30fps for film feel), full LaTeX, Whisper-synced narration, post-render review pass with Maker for color and timing
- Time: 30 min – several hours wall-clock per scene at 4K
- Output: 4K MP4, mastered to spec
- Use when: published Loudon Live videos, demo reel, work that goes out under the Loudon Live name
- Sacrifices: render time and disk space; iteration cost goes up significantly

## Job Contract

### Input
- `scene_source` (string or path): Python source defining one or more `Scene` subclasses
- `scene_class` (string): which scene to render (Manim renders one class per invocation)
- `tier` (sketch | study | piece): determines preset
- `out_path` (string): absolute path under `Artifacts/<project>/`
- `voiceover_audio` (path, optional): path to pre-rendered narration WAV (typically from Kokoro)
- `voiceover_transcript` (string, optional): the narration text for `manim-voiceover` Whisper alignment
- `frame_rate_override` (int, optional): for matching downstream concat requirements
- `resolution_override` (string, optional): "1920x1080" etc. for unusual aspect ratios

### Output
- Video file at `out_path` (or PNG if a single frame is requested)
- Source code archived alongside the output as `<descriptive-slug>.py` at the bundle root (e.g., `Kuramoto Coupling/two-phasors-uncoupled.py`). The pre-Enrichment-v1.5 convention `source/<scene_class>.py` was retired in favor of descriptive flat filenames; the scene class name lives inside the file, not in the path.
- Standards report:
  - `duration_sec` (float)
  - `resolution` (w × h)
  - `frame_rate` (int)
  - `total_frames` (int)
  - `render_time_sec` (float)
  - `manim_version` (string)
  - `voiceover_alignment` (struct, if applicable: word-timing data)
  - `tier_used` (string)
  - `gotchas_hit` (list)
  - `status` (ok | spec_miss | failure)
  - `notes` (string, optional)

## Iteration Character

Deeply iterative. Manim is the most refinement-friendly Specialist in the Shop. Refinement happens by:

1. Editing the `.py` source — any change, any line
2. Re-rendering only the affected scene class
3. With caching enabled, only changed mobjects re-render; unchanged tex/svg is reused
4. Voiceover edits cascade through `manim-voiceover` — Whisper re-times automatically

A typical Loudon Live video goes through 5–20 Study-tier render passes before promoting any scene to Piece tier. This is the right shape; budget time accordingly.

## Self-Check

Before declaring done, I verify:

- Output file exists and is a valid MP4
- Resolution matches request
- Frame rate matches request
- Total frame count is consistent with declared duration (`fps × duration ± 1`)
- Source `.py` is archived alongside the output
- If voiceover was used, alignment data is captured

Any miss appears in the standards report's `gotchas_hit` list and sets `status` to `spec_miss`.

## Resource Footprint

- CPU: 2–4 cores during render, more with multi-process enabled
- RAM: 2–8 GB typical; spikes higher on 3D scenes and 4K
- GPU: optional, accelerates `Cairo` operations modestly
- Disk: highly variable — Sketch ~10 MB/min, Piece 4K ~500 MB/min; intermediate `media/` cache can be large
- Network: required only for first-time LaTeX package fetch and `manim-voiceover` Whisper download
- API keys: none

The Maker should not run two Piece-tier renders in parallel on a typical laptop. Sketch + Study in parallel is fine.

### Install (host capability)

**macOS arm64 (canonical Loudon machine).** `pip install manim` requires three Homebrew system deps first (`pycairo` is source-only on PyPI, `manimpango` likewise links to `pango`):

```sh
brew install cairo pkg-config pango
pipx install manim --python /opt/homebrew/bin/python3.13
```

Then `manim` is on PATH. Per-Specialist pipx isolation keeps Manim's dependency tree from contaminating other Python work.

**Python 3.14 is too new (as of 2026-05).** `pycairo` has no Python 3.14 wheels — and since it has no arm64 wheels for *any* Python version, source build is forced; the source build needs `pkg-config` + `cairo` headers regardless of Python version. Use Python 3.13 until pycairo publishes arm64 wheels.

**Linux arm64 in a sandboxed/no-sudo container** (e.g. Cowork sandbox): cannot install. `manimpango` has no aarch64 wheels and the build requires `libpangocairo-dev` which is sudo-only. Route the brief to Matplotlib as a fallback (see `Shop/Matplotlib`) or defer to a host that has Manim installed.

## Gotchas

**2026-05-10 — pycairo is source-only on PyPI.** No wheels for any Python version on macOS arm64. `pip install manim` always triggers a source build of `pycairo`. The build fails with a confusing `meson` error (`Did not find pkg-config`) unless `brew install cairo pkg-config pango` has been run first. Surfaced on the Round 1 install pass; symptoms identical across Python 3.13 and 3.14.

**2026-05-10 — Python 3.14 is too new for the dependency tree.** Even with system cairo installed, several manim transitive deps lack 3.14 wheels (May 2026). Use Python 3.13 via Homebrew. Revisit when pycairo publishes 3.14 wheels.

**2026-05-26 — `DecimalNumber` (and any `MathTex`/`Tex` mobject) requires a LaTeX install.** Manim CE 0.20.1 renders `DecimalNumber` glyphs via `SingleStringMathTex` under the hood, which shells out to `latex`. On a Manim install without MacTeX (or another TeX distribution), the render crashes with a `FileNotFoundError: 'latex'` deep inside `subprocess._execute_child` — the error is not raised from `DecimalNumber` itself, so the trace is misleading. Two fixes: (1) install MacTeX (`brew install --cask mactex-no-gui`, ~4 GB) when LaTeX math is genuinely needed; (2) avoid `MathTex`/`Tex`/`DecimalNumber` entirely by using Pango `Text` with `always_redraw(lambda: Text(f"K = {value:.2f}"))` for live-updating numeric HUDs. Path (2) keeps the install small and is appropriate for scenes where the math notation is in the prose/narration, not on-screen. Path (1) is needed any time you want real LaTeX typesetting on-screen.

**2026-05-26 — When pre-rendered narration + Whisper timings already exist, skip `manim-voiceover` and ffmpeg-mux instead.** The Maker entry's standard pattern routes narration through `manim-voiceover`, which calls Whisper itself during the Manim render. When the Kokoro WAV and the Whisper JSON are already in hand (as they are after a Maker-gated Track B), running `manim-voiceover` re-does work and adds a heavy dependency. The cleaner pattern: render the Manim scene silent at exactly the narration duration (`self.wait(DURATION)`), then `ffmpeg -i silent.mp4 -i narration.wav -c:v copy -c:a aac -shortest out.mp4`. The Whisper JSON drives scene timing in the Python source, not the render. Measured drift at 36s: 25ms (video lands at 36.500s after frame quantization at 30fps; audio is 36.475s exact) — well below perceptual threshold and well below the entry's standing ~3-minute drift warning for `manim-voiceover`.

*(Patterns below from Manim community wisdom — not yet confirmed on a job; dates will land when first encountered:)*

- LaTeX errors render as "could not compile TeX" with no useful trace; isolate by reducing `MathTex` content until it compiles
- `Transform` between mobjects with mismatched submobject counts produces visual artifacts; use `TransformMatchingShapes` or `ReplacementTransform`
- `manim-voiceover` Whisper sync drifts on narration over ~3 minutes; segment by section
- Color names (`RED`, `BLUE`) deviate from hex equivalents in subtle ways; force hex when palette discipline matters
- 3D scene camera animations are easier to write than to debug; favor presets

## Recipes

**2026-05-26 — Sync arriving** (Study tier, 720p30, 36.5s). Eight oscillators in a horizontal row, each shown as a unit-circle dial with an indigo→amber phase arrow that interpolates color toward amber as the order parameter |R| climbs. A central larger circle holds the R vector. K ramps linearly 0 → 1.2 over the narration's duration; phases drift, then begin to align past K_c ≈ 0.22, with |R| visible in the HUD climbing from ~0.1 toward ~0.95. Simulation: Kuramoto ODE on 120 Hz physics grid (`dθ_j/dt = ω_j + K·R·sin(ψ−θ_j)`), N=8, ω drawn from N(0, 0.25)·2π, seed=7. Render pattern: Manim silent → ffmpeg-mux Kokoro Study narration (af_heart, −16 LUFS). HUD uses `always_redraw(lambda: Text(...))` not `DecimalNumber` — avoids LaTeX dependency. Render time on M-series + Python 3.13: ~36 s for 1080 frames. Source: [Kuramoto Coupling/sync-arriving.py](../Kuramoto Coupling/sync-arriving.py). Output: [Kuramoto Coupling/sync-arriving.mp4](../Kuramoto Coupling/sync-arriving.mp4). First successful Maker → Kokoro → Whisper → Manim coordination round-trip; closes Track B of the Round 1 continuation.

**2026-05-10 — Two phasors, uncoupled** (Sketch tier, 480p15). Two oscillators at 1.00 / 1.07 Hz, phasor circles top of frame, sine traces below on a shared time axis with color-matched current-sample dots and dashed projection lines from each phasor tip down to its sample. Source: [Kuramoto Coupling/two-phasors-uncoupled.py](../Kuramoto Coupling/two-phasors-uncoupled.py). Output: [Kuramoto Coupling/two-phasors-uncoupled-manim.mp4](../Kuramoto Coupling/two-phasors-uncoupled-manim.mp4). Render time on M-series + Python 3.13: ~5 s wall-clock after caching disabled. Houses the Round 1 calibration brief: descriptive flat-bundle filenames, no `source/` or `proofs/` subfolders.

Future recipes in `Artifacts/Shop/Manim CE/recipes/` once they accumulate beyond the bundle pattern.

## Test Suite

Smoke / Capability Probe / Style Probe / Edge Probe / Speed Bench / Determinism — defined in `Artifacts/Shop/Manim CE/tests/test-plan.md` (TODO).

The Determinism test for Manim is the strongest of any specialist's: same `.py` + same Manim version → byte-identical output. The test confirms this and flags any divergence as a build-environment issue rather than a tool problem.

Last run: never.

## Open Questions

- House defaults for color palette in Manim — declare project-level `MANIM_COLOR_*` constants in a Style entry, or inject per-scene? Maker's call.
- Whisper voiceover sync uses model size (tiny / base / small / medium / large) — which is the default? Tradeoff is alignment accuracy vs. setup time on first run.
- Should `Artifacts/Shop/Manim CE/recipes/` be organized by project (Floquet, Loudon Live ep01, etc.) or by animation type (transform, plot, 3D)? Suggest by project to match the rest of the palace's project-centric structure.

## Lost Branches

- Manim Community Edition vs. ManimGL (3b1b's fork) — chose CE for active maintenance, larger community, plugin ecosystem (`manim-voiceover` especially). Revisit if a specific 3b1b-only feature becomes essential.

## Forward Vector

First job: a Study-tier render of a 30-second Kuramoto coupling visual, with Kokoro narration and `manim-voiceover` Whisper sync. The result is a full three-specialist coordination test — Maker decodes the brief, Kokoro produces narration, I render with sync, output goes back through standards check. Every gotcha that surfaces is a deposit-worthy palace correction.
