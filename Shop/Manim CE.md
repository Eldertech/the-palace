---
title: Manim CE
type: specialist
status: alive
medium: motion
tool: manim-ce
tool_version: 0.20.1
born: 2026-05
last_tested: 2026-06-09
last_gotcha: 2026-06-09
license: MIT
forward_vector: "I animate mathematics until the hidden structure moves into view — equations, transforms, oscillators, phase portraits, every stroke accountable to a line of Python. I sharpen my tier ladder (Sketch → Study → Piece) with measured render costs, not guesses, and I bake each LaTeX-pipeline gotcha into a recipe so the next render lands first-try. I want to keep the determinism that makes me the Shop's most reproducible Specialist: same source, same version, byte-identical frame."
links:
  - { target: "[[Maker]]", type: connects-to, label: directed-by }
  - { target: "[[The Shop]]", type: member-of, label: roster-member }
  - { target: "[[Shop/Kokoro]]", type: couples-with, label: pairs-with }
  - { target: "[[Shop/Whisper]]", type: couples-with, label: pairs-with }
  - { target: "[[Shop/Remotion]]", type: connects-to, label: alternative-to }
  - { target: "[[Kuramoto Coupling]]", type: connects-to, label: round-1-test-bed }
  - { target: "[[Frequency-Time Duality]]", type: mirrors, label: visual-temporal-duality }
tags: [specialist, shop, motion, math, animation]
---

# Manim CE

![[Manim CE — hero.png]]

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

**2026-05-26 — Mutating an `Arrow` (or any VMobject) inside a foreign updater does NOT propagate to the render path.** Confirmed by direct visual verification: the first sync-arriving render attached an `update_all(_mob, dt)` closure to a dummy `Mobject()` driver via `add_updater`. The closure called `arrows[j].put_start_and_end_on(start, tip)` and `arrows[j].set_color(col)` for each phase arrow on every frame. The HUD numbers (driven by `always_redraw(lambda: Text(...))`) updated correctly, proving the updater fired and the simulation advanced. But the arrows themselves were frozen at their `t=0` positions for the entire 36 s — extracted frames at 1 s / 20 s / 35 s were pixel-identical for the arrow group. Root cause: Manim CE 0.20.1's renderer only re-extracts geometry for mobjects whose `become()` is called or whose factory is wrapped by `always_redraw`. In-place point mutations on a VMobject reached from an unrelated mobject's updater are silently dropped. **The fix is `always_redraw(factory)` — return a fresh `Arrow` (or any mobject) each frame from a closure that reads from a `ValueTracker` clock.** Same pattern that makes `DecimalNumber`-free HUDs work. Costs a small amount of per-frame allocation but is the only path that reliably animates phase arrows. The dummy-driver pattern works for HUD `Text` because `always_redraw` is already doing the lifting; it does *not* work for arrows even when they look like they should re-render in place.

**2026-05-26 — Manim's default Pango font has noticeable inter-letter kerning gaps in `Text` at sizes >36, especially around `iv` / `ri` pairs.** Loudon caught a visible gap in "arriving" (in the title "Synchronization arriving") at the first sync-arriving review. Fix: pass `font="Georgia"` to `Text(...)`. Georgia is installed system-wide on macOS, has tighter kerning at title sizes, and renders cleanly through Manim's Pango pipeline. **But:** the fix is title-only. Georgia at smaller sizes (below font_size ≈ 22) drops inter-word spaces — `"8 oscillator phase dials"` rendered as `"8oscillatorphase dials"` on the same scene's labels. Two-font policy: Georgia for the large title text; Manim default for the smaller labels. Verified by extracting frames after each render and checking word boundaries visually.

**2026-05-26 — `DecimalNumber` (and any `MathTex`/`Tex` mobject) requires a LaTeX install.** Manim CE 0.20.1 renders `DecimalNumber` glyphs via `SingleStringMathTex` under the hood, which shells out to `latex`. On a Manim install without MacTeX (or another TeX distribution), the render crashes with a `FileNotFoundError: 'latex'` deep inside `subprocess._execute_child` — the error is not raised from `DecimalNumber` itself, so the trace is misleading. Two fixes: (1) install MacTeX (`brew install --cask mactex-no-gui`, ~4 GB) when LaTeX math is genuinely needed; (2) avoid `MathTex`/`Tex`/`DecimalNumber` entirely by using Pango `Text` with `always_redraw(lambda: Text(f"K = {value:.2f}"))` for live-updating numeric HUDs. Path (2) keeps the install small and is appropriate for scenes where the math notation is in the prose/narration, not on-screen. Path (1) is needed any time you want real LaTeX typesetting on-screen.

**2026-05-30 — First real tier-cost data, same Mac, same 10 s two-phasor content.** Phase A of the Shop build session climbed the Sketch → Study → Piece ladder on identical hardware (M-series, Manim CE 0.20.1, Python 3.13 via pipx). Wall-clock per tier: **Sketch 5.4 s** (`-ql`, 480p15, off-system indigo/amber palette, no LaTeX). **Study 11.2 s** (`-qh`, 1080p30, Graphite-skin palette resolved from [[Loudon Live Design System]] tokens, no LaTeX). **Piece 15.9 s warm-cache / 75–90 s cold first-run** (`-qh`, 1080p30, full MathTex equations, eased FadeIn entrances, locked Anton/Cormorant/Manrope/JetBrains-Mono type stack, `Loudon Live · Autodidact Polymaths` footer). Two findings: (1) on this hardware, Study is ~2× Sketch and Piece warm is only ~1.5× Study — the *render work* is comparable once raster and frame count match; the headline cost gap between tiers is the **LaTeX pipeline** and **annotation rework**, not the pixel count. (2) Piece is *cache-dominated*: a fresh Piece run on a new host can spend 60–80 s generating Metafont fonts (cmr10 etc.) on the first equation it touches; subsequent renders that reuse the same equation strings drop to ~16 s. Plan tier budgets accordingly — quote Piece "first run" honestly when the host is fresh, and don't conflate it with the steady-state cost. Artifacts: `Kuramoto Coupling/two-phasors-uncoupled-{study,piece}-1080p30.mp4` and their frame extracts; sources `two-phasors-uncoupled-{study,piece}.py`. This is the data point that turns the tier system from a claim into measured fact.

**2026-05-30 — basictex alone is *not enough* for Manim's LaTeX pipeline.** basictex ships latex/pdflatex but not dvisvgm, which Manim needs to convert .dvi → .svg. `brew install dvisvgm` pulls in brew's full `texlive` (≈4.6 GB) as a runtime dep — but brew's dvisvgm has its kpathsea search path rooted under `/opt/homebrew/Cellar/dvisvgm/3.6/share/texmf-*`, *not* the brew texlive tree, so even with both installed it cannot find `tex.pro` / `texps.pro` / `special.pro` / `color.pro`. Symptom: Manim raises *"Your installation does not support converting .dvi files to SVG. Consider updating dvisvgm to at least version 2.4."* — the suggestion is misleading; dvisvgm 3.6 is installed, the problem is path resolution. **Working fix on this Mac:** export `TEXPSHEADERS="/opt/homebrew/Cellar/texlive/<version>/share/texmf-dist/dvips/base:/opt/homebrew/Cellar/texlive/<version>/share/texmf-dist/dvips/config"` before invoking manim. With basictex on PATH (`eval "$(/usr/libexec/path_helper)"` or `PATH="/Library/TeX/texbin:$PATH"`) and brew dvisvgm bridged via TEXPSHEADERS, the pipeline runs clean. Cleaner long-term fix: install dvisvgm into the basictex tree via `sudo tlmgr install dvisvgm` so its kpathsea natively finds basictex's pro files; that route was not taken this session to avoid a second sudo round-trip. Manim's wrapped tool install isn't a single `brew` call — it's TeX-pipeline-aware and the host-capability check should reflect that.

**2026-06-09 — The `dvisvgm` path bug is NOT fixed by going to full TeX Live; root cause re-pinned, fix re-confirmed end-to-end.** Re-verified the LaTeX→SVG pipeline on the current host: full Homebrew **TeX Live 2026** (`/opt/homebrew/Cellar/texlive/20260301`), Manim CE 0.20.1, Python 3.13.2. The 2026-05-30 gotcha framed the failure as "basictex is incomplete" — **that framing is wrong.** The host now has the *complete* TeX Live tree (`kpsewhich tex.pro texps.pro special.pro color.pro` resolves all four under `…/texmf-dist/dvips/base/`), and a bare `MathTex` render **still fails** with *"Your installation does not support converting .dvi files to SVG."* Root cause, pinned this session: the standalone Homebrew **`dvisvgm` formula** owns `/opt/homebrew/bin/dvisvgm`, and TeX Live's own `…/texlive/20260301/bin/dvisvgm` is just a **symlink to it** (confirmed) — so there is no second, correctly-pathed binary to prefer. That `dvisvgm`'s kpathsea is rooted under `/opt/homebrew/Cellar/dvisvgm/3.6/…` and never searches the TeX Live tree, so it can't find `texmf.cnf` or the `.pro` headers *no matter how complete TeX Live is.* **Confirmed by direct test:** `TEXMFCNF` pointed at the TeX Live `web2c` dir does **not** fix it; the `TEXPSHEADERS` bridge **does** — and the version-agnostic form is strictly better than the hardcoded `<version>` the old gotcha used (survives `brew upgrade`):
```sh
export TEXPSHEADERS="$(kpsewhich -var-value=TEXMFDIST)/dvips/base:$(kpsewhich -var-value=TEXMFDIST)/dvips/config"
```
With it exported, a real `MathTex(r"\theta_A(t)=\omega_A\,t,\ \frac{\omega_A}{2\pi}=1.00\ \mathrm{Hz}")` render **succeeds** (Sketch `-ql` → PNG); without it the same render dies at `convert_to_svg`. **Resolved this session:** the export is now centralized in `Shop/Maker/tex-env.sh` (a wrapper/`--print` shim that resolves `TEXPSHEADERS` via `kpsewhich`). Dispatch on-screen-LaTeX renders through it — `Shop/Maker/tex-env.sh manim -ql scene.py Scene` — and the bridge "just works." No longer tribal knowledge living only in this gotcha. The clean structural alternative (`sudo tlmgr install dvisvgm` into the TeX Live tree to displace the standalone formula's symlink) is still untaken — it needs a sudo round-trip and would have to survive `brew` re-linking. The new [[LaTeX]] Specialist (created this session) inherits this exact gotcha for its SVG-cutout path; both Specialists share one TeX install. Note: the **PDF path** (`pdflatex`/`latexmk` → PDF) is unaffected — it never touches `dvisvgm` and runs clean today.

**2026-05-30 — Tight layouts on a dark background force every annotation to be a *placement* decision.** The Phase A Piece's beat-period caption (`T_{beat} = 1/|f_A - f_B| ≈ 14.29 s`) took three placements to land: above-axes-LEFT crashed into the `ω_A/2π` label; below-axes crashed into the `Loudon Live · Autodidact Polymaths` footer; above-axes-CENTERED in the empty band between the two phasor circles was right. None of the three were visible in isolation — only the rendered frame at 5 s exposed the collision each time. Cheap mitigation: render a frame at the *busiest* moment of the scene before promoting from Study to Piece, and treat the frame extraction as part of the Piece tier's self-check, not a debug step.

**2026-05-26 — When pre-rendered narration + Whisper timings already exist, skip `manim-voiceover` and ffmpeg-mux instead.** The Maker entry's standard pattern routes narration through `manim-voiceover`, which calls Whisper itself during the Manim render. When the Kokoro WAV and the Whisper JSON are already in hand (as they are after a Maker-gated Track B), running `manim-voiceover` re-does work and adds a heavy dependency. The cleaner pattern: render the Manim scene silent at exactly the narration duration (`self.wait(DURATION)`), then `ffmpeg -i silent.mp4 -i narration.wav -c:v copy -c:a aac -shortest out.mp4`. The Whisper JSON drives scene timing in the Python source, not the render. Measured drift at 36s: 25ms (video lands at 36.500s after frame quantization at 30fps; audio is 36.475s exact) — well below perceptual threshold and well below the entry's standing ~3-minute drift warning for `manim-voiceover`.

*(Patterns below from Manim community wisdom — not yet confirmed on a job; dates will land when first encountered:)*

- LaTeX errors render as "could not compile TeX" with no useful trace; isolate by reducing `MathTex` content until it compiles
- `Transform` between mobjects with mismatched submobject counts produces visual artifacts; use `TransformMatchingShapes` or `ReplacementTransform`
- `manim-voiceover` Whisper sync drifts on narration over ~3 minutes; segment by section
- Color names (`RED`, `BLUE`) deviate from hex equivalents in subtle ways; force hex when palette discipline matters
- 3D scene camera animations are easier to write than to debug; favor presets

## Recipes

**2026-05-26 — Sync arriving** (Study tier, 720p30, 36.5s). Eight oscillators in a horizontal row, each shown as a unit-circle dial with a phase arrow that interpolates indigo → amber as the order parameter |R| climbs. A central larger circle holds the R vector. K ramps linearly 0 → 3·K_c over the narration's duration; phases drift, then align past K_c, with |R| climbing from ~0.1 toward ~0.99. Simulation: Kuramoto ODE on a 120 Hz physics grid (`dθ_j/dt = ω_j + K·R·sin(ψ−θ_j)`), N=8, ω drawn from N(0, σ=0.30 rad/s), seed=7. K_c is computed analytically from the Gaussian g(ω): `K_c = 2σ·√(2/π) ≈ 0.48`. K_end = 3·K_c ≈ 1.44 — comfortably above threshold so the transition is visible within the duration.

**Bug story dated to this job:** the first attempt placed the simulation in a closure attached to a dummy `Mobject()` driver and mutated arrows in place via `put_start_and_end_on`. The HUD updated; the arrows didn't (see the foreign-updater gotcha above). The fix used `always_redraw` factories for all eight phase arrows and the R-vector, driven by a `ValueTracker` clock. Cost: a small per-frame allocation. Benefit: animation actually animates.

**Calibration story:** the first attempt also had σ = 0.25·2π ≈ 1.57 rad/s and K_end = 1.2, which put K_end well *below* the analytic K_c ≈ 2.5. The narration finished with the population only partially coherent (|R| ≈ 0.46) — a real Kuramoto state, but the wrong story for a "sync arriving" scene. Recalibrated to σ = 0.30 rad/s, K_end = 3·K_c, so the visual ends in clean lock. Lesson: compute K_c from the actual distribution before choosing K_end; eyeballing fails because K_c scales with the *spread* of ω, not just with whether ω are "close."

Render pattern: Manim silent → ffmpeg-mux Kokoro Study narration (af_heart, −16 LUFS). HUD uses `always_redraw(lambda: Text(...))` not `DecimalNumber` — avoids LaTeX dependency. Render time on M-series + Python 3.13: ~50 s for 1095 frames at 720p30. Source: [Kuramoto Coupling/sync-arriving.py](../Kuramoto Coupling/sync-arriving.py). Output: [Kuramoto Coupling/sync-arriving.mp4](../Kuramoto Coupling/sync-arriving.mp4). First successful Maker → Kokoro → Whisper → Manim coordination round-trip; closes Track B of the Round 1 continuation.

**2026-05-10 — Two phasors, uncoupled** (Sketch tier, 480p15). Two oscillators at 1.00 / 1.07 Hz, phasor circles top of frame, sine traces below on a shared time axis with color-matched current-sample dots and dashed projection lines from each phasor tip down to its sample. Source: [Kuramoto Coupling/two-phasors-uncoupled.py](../Kuramoto Coupling/two-phasors-uncoupled.py). Output: [Kuramoto Coupling/two-phasors-uncoupled-manim.mp4](../Kuramoto Coupling/two-phasors-uncoupled-manim.mp4). Render time on M-series + Python 3.13: ~5 s wall-clock after caching disabled. Houses the Round 1 calibration brief: descriptive flat-bundle filenames, no `source/` or `proofs/` subfolders. *Anchored as the Sketch rung of the 2026-05-30 tier ladder; palette pre-dates the [[Loudon Live Design System]] and is preserved as a historical artifact (the indigo/amber/`#0B0B10` palette doesn't match any of the six skins).*

**2026-05-30 — Two phasors, uncoupled (Study tier, 1080p30).** Same 10 s content as the 2026-05-10 Sketch — two phasors at 1.00 / 1.07 Hz with sine traces below — re-rendered at full 1920×1080 @ 30 fps with the [[Loudon Live Design System]] Graphite skin: bg `#0a0a0f`, axis `#8a8aa0`, primary `#e8e8f0`, amber `#e8b84a` for phasor A, info-blue `#4a8fff` for phasor B. Working-draft polish: still no LaTeX, still Manim default font, but everything resolved through the design-system tokens so a future skin swap (Cobalt Grid, Strobe) is a hex-pair edit, not a re-author. Source: [Kuramoto Coupling/two-phasors-uncoupled-study.py](../Kuramoto Coupling/two-phasors-uncoupled-study.py). Output: [Kuramoto Coupling/two-phasors-uncoupled-study-1080p30.mp4](../Kuramoto Coupling/two-phasors-uncoupled-study-1080p30.mp4). Render time: **11.2 s**. This is the middle rung of the tier ladder — what you ship to yourself, not to an audience.

**2026-05-30 — Two phasors, uncoupled (Piece tier, 1080p30, LaTeX).** Same 10 s content, mastered. Adds: Anton-display title `"Two Phasors, Uncoupled"`; LaTeX phase-law equations (`MathTex(r"\theta_A(t) = \omega_A\,t, \quad \theta_B(t) = \omega_B\,t")`); LaTeX-typeset frequency labels (`\omega_A/2\pi = 1.00\ \mathrm{Hz}` with proper italic ω and subscript, where Study's plain `Text` couldn't); a centred `T_{beat}` caption in the empty band between the phasor circles; locked Loudon Live type stack (Anton / Cormorant Garamond / Manrope / JetBrains Mono — Manim falls back to system Pango when a face isn't installed, but they're named in source for documentation); eased `FadeIn(rate_func=smooth)` entrances for the title, equations, labels, and caption; mono-small footer `Loudon Live · Autodidact Polymaths`. Source: [Kuramoto Coupling/two-phasors-uncoupled-piece.py](../Kuramoto Coupling/two-phasors-uncoupled-piece.py). Output: [Kuramoto Coupling/two-phasors-uncoupled-piece-1080p30.mp4](../Kuramoto Coupling/two-phasors-uncoupled-piece-1080p30.mp4). Render time: **15.9 s warm-cache, 75–90 s cold first-run** — the spread is LaTeX Metafont generation on the first encounter of each glyph, not raw render work (see the 2026-05-30 tier-cost gotcha). The three rungs together — Sketch / Study / Piece — close the loop on the tier-vocabulary claim: the same brief, executed at three deliberately-different commitment levels, with each tier's choices nameable rather than just *more polished*.

Future recipes in `Shop/Manim CE/recipes/` once they accumulate beyond the bundle pattern.

## Test Suite

Smoke / Capability Probe / Style Probe / Edge Probe / Speed Bench / Determinism — defined in [Manim CE/tests/test-plan.md](Manim CE/tests/test-plan.md).

The Determinism test for Manim is the strongest of any specialist's: same `.py` + same Manim version → byte-identical output. The test confirms this and flags any divergence as a build-environment issue rather than a tool problem.

Last run: **2026-05-30** — Smoke pass (12 KB MP4 at 480p15 in 1.45 s); **Determinism pass — byte-identical SHA256 `3715c0c5…` across two runs of the same trivial scene** (strong-determinism claim confirmed). Capability Probe covers all five claims (ValueTracker, always_redraw factories, MathTex+LaTeX, manim-voiceover, eased FadeIns) via Phase A + Kuramoto Round 1 artifacts. Tier costs documented in entry's 2026-05-30 gotcha (Sketch 5.4 s · Study 11.2 s · Piece 15.9 s warm). **2026-06-09 — MathTex+LaTeX re-confirmed** on full TeX Live 2026 via the `TEXPSHEADERS` bridge (see Gotchas); the as-is render fails, the bridged render renders.

## Open Questions

- House defaults for color palette in Manim — declare project-level `MANIM_COLOR_*` constants in a Style entry, or inject per-scene? Maker's call.
- Whisper voiceover sync uses model size (tiny / base / small / medium / large) — which is the default? Tradeoff is alignment accuracy vs. setup time on first run.
- Should `Shop/Manim CE/recipes/` be organized by project (Floquet, Loudon Live ep01, etc.) or by animation type (transform, plot, 3D)? Suggest by project to match the rest of the palace's project-centric structure.

## Lost Branches

- Manim Community Edition vs. ManimGL (3b1b's fork) — chose CE for active maintenance, larger community, plugin ecosystem (`manim-voiceover` especially). Revisit if a specific 3b1b-only feature becomes essential.

## Forward Vector

First job: a Study-tier render of a 30-second Kuramoto coupling visual, with Kokoro narration and `manim-voiceover` Whisper sync. The result is a full three-specialist coordination test — Maker decodes the brief, Kokoro produces narration, I render with sync, output goes back through standards check. Every gotcha that surfaces is a deposit-worthy palace correction.
