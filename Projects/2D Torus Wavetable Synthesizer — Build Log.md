---
title: 2D Torus Wavetable Synthesizer — Build Log
type: meta
pillars:
  - tools
  - practice
born: 2026-04
stage: growing
links:
  - target: "[[2D Torus Wavetable Synthesizer]]"
    type: emerged-from
    label: chronicles
  - target: "[[2D Wavetable Catalog]]"
    type: connects-to
    label: documents
  - target: "[[DSP in Looping Dimensions]]"
    type: connects-to
  - target: "[[Kuramoto Coupling]]"
    type: connects-to
  - target: "[[Frequency-Time Duality]]"
    type: connects-to
  - target: "[[Torus Warping Catalog]]"
    type: connects-to
  - target: "[[Categorizing Inharmonicity]]"
    type: connects-to
---
# 2D Torus Wavetable Synthesizer — Build Log

![[2D Torus Wavetable Synthesizer — Build Log — hero.png]]

A handoff-friendly chronological record of the catalog build sessions. The point of this file is the [SCHEMA Self-Description Test](../SCHEMA.md): a fresh Claude with no prior memory should be able to read this and the [[2D Torus Wavetable Synthesizer]] entry and pick up the next move without re-deriving everything.

If you only read one thing here, read **State at handoff** at the bottom.

## Session 1 — 2026-04-26 — Catalog scaffold and diagnostic

**Premise.** Loudon's 2D Torus Wavetable Synthesizer project entry described seven surfaces and five generating logics for a 2D wavetable instrument, but no concrete wavetable files existed on disk. The Max object [`2d.wave~`](https://docs.cycling74.com/reference/2d.wave~/) provides everything we need to test the project's design assumptions with very little Max patching. The session goal: build a catalog of 2D wavetables that proof-of-concepts as many aspects of the project as possible, in stages.

### Stage 1 — Test diagnostic + Stage-1 patch

Goal: a wavetable whose readback verifies the patch is wired correctly. Every row designed so that something specific about the patch becomes audibly true or false.

Output:

- `Wavetables/00_test_diagnostic.wav` (originally 16×1024, later rebuilt — see Session 3) — 16 anchor waveforms (sine, saw, square, triangle, silence, reverse-saw, 25%-pulse, sine 2×, sine 4×, silence, sine 8×, white noise, bandlimited saw, bandlimited square, two-tone, sine wrap) at Y = k/16 for k = 0..15.
- [[00 — Test Diagnostic Wavetable]] — six numbered tests (Y axis discrimination, X-phasor pitch tracking, multi-cycle row math, LFO-rate Y, audio-rate-Y / Kronecker shimmer, scope-based phase polarity) plus a failure-mode diagnostic table.

Key design choices made here that propagate forward:

- **48 kHz, mono, 32-bit float WAV.** Drag-loadable into `buffer~`.
- **1024 samples per row** for the X axis. Established as the project's row resolution.
- **Anchor positions at exact Y = k/16.** All future Tier-1 utility wavetables and the rebuilt diagnostic preserve this.

### Stage 2 — Visualizer

Goal: an image renderer so the catalog index can embed wavetable previews and so we can see what we're building. Originally scoped as a Max patch; on Loudon's redirect, became a Python tool because images can be embedded directly in the index entries.

Output:

- `Tools/visualize_wavetable.py` — single-file Python (numpy + Pillow). Reads any mono WAV (32-bit float by default; 16/24/32-bit int also supported), reshapes into rows × row_len, renders heightmap (default), stacked-rows, or both. Diverging colormap (orange = positive, blue = negative, black = zero) by default.

### Stage 3 — Surfaces-led catalog (initial 16 / 64 row build)

Goal: a catalog that demonstrates the range of the instrument and gives us material for proposing next steps. Loudon picked **Surfaces-led, 10 entries** from a three-option ask:

- 4 utility wavetables (16×1024): sine cycle sweep, partial stack sweep, duty cycle morph, sine + 3rd-harmonic sweep.
- 6 named surfaces (64×1024): Membrane, Chladni Ghost, Theta Surface, Stiff String, Knot Shadow, Penrose Lattice — corresponding to the [[2D Torus Wavetable Synthesizer]] §"Seven Surfaces" minus the unspecified seventh.

Output:

- `Tools/build_catalog.py` — idempotent generator script. Defines surface functions, a metadata table, and bespoke prose bodies for each entry's index markdown.
- 10 (`.wav`, `.png`, `.md`) bundles in `Wavetables/`.
- [[2D Wavetable Catalog]] — master index, organised by tier, with one-line summaries and forward-vector candidates.

## Session 2 — 2026-04-26 — Resolution change to 1024 × 1024

**Trigger.** Loudon listened to the catalog files and reported they "all sound rough, since we are scanning very fast in both directions." Diagnosis: at audio-rate Y, a 16-row or 64-row Y axis is effectively a 16- or 64-sample-per-cycle lookup, well below the X resolution. Linear interpolation between sparse rows produces stepped artefacts that show up as audible roughness.

**Decision.** Square wavetables: all catalog entries (Tier 1 utilities and Tier 2 named surfaces) bumped to **1024 × 1024**. Y now sampled as densely as X. Patch consequence: send `rows 1024` to `2d.wave~` instead of the prior tier-specific row counts. File-size consequence: each catalog entry ~4 MB; total catalog ~40 MB. Generation time ~21 s on the laptop.

**Tier 1 redesign.** Going from 16 distinct rows to 1024 rows changed the meaning of Tier 1 from "discrete morph between named waveforms" to "continuous interpolation across 1024 rows." Adjacent integer-cycle (sine cycle sweep) and integer-partial (partial stack sweep) waveforms are now crossfaded by the fractional position so each row still starts and ends at zero (no wrap discontinuity). Duty cycle morph and sine + 3rd-harmonic morph were already smooth.

**Stiff String redesign.** With finer Y resolution, the partial-rounding approach used at 64 rows (each partial mapped to nearest integer) would have produced visible step regions. Replaced with a **floor/ceil crossfade**: each partial f_n = n·√(1+B·n²) is realised as `(1−frac)·sin(floor(f)·φ) + frac·sin(ceil(f)·φ)` so the stiffness B sweeps smoothly across rows.

## Session 3 — 2026-04-26 — Diagnostic rebuild + interpolation diagnosis

**Trigger.** Loudon: "I am not getting exactly what I expect, can you create our original test wavetable, but this time with this new size?"

**Decision.** Rebuild the diagnostic at 1024×1024 with the 16 original anchor waveforms preserved at exact Y = k/16 (rows 0, 64, 128, …, 960). The 63 sub-rows between each anchor pair are linearly interpolated between the anchor waveforms. Static (Y held) tests still behave exactly as designed; audio-rate Y now reads as a smooth morph through the 16 anchors instead of stepping.

Output:

- `Tools/rebuild_diagnostic.py` — keeps the diagnostic regenerable independently of the catalog.
- New `Wavetables/00_test_diagnostic.{wav,png}` at 1024×1024.
- Updated [[00 — Test Diagnostic Wavetable]] entry: anchor language, `rows 1024` patch line, failure modes updated for the new file size.

The original 16-row stacked PNG (`00_test_diagnostic_full.png`) was kept on disk as the per-anchor waveform reference image — the new 1024-row table is built from those exact 16 anchors, so the image is still accurate.

### The level-dip discovery

Loudon flagged a level-dip between anchors. Investigation produced two RMS-vs-Y plots (`Wavetables/_rms_diagnostic.png`, `_rms_tier1.png`) which made the issue legible:

- **Diagnostic.** Worst case is the Y = 0 → 0.0625 transition (sine → rising sawtooth). Sine and rising saw have negative inner product ⟨sin, saw⟩ = −1/π, so the midpoint RMS drops from ~0.71 down to ~0.22 — about a 10 dB dip.
- **Tier 1 sine cycle sweep.** Adjacent integer-cycle sines are exactly orthogonal, so every transition between integer cycle counts drops the midpoint RMS by √2 (~3 dB). 15 such dips per Y traversal.
- **Tier 1 partial stack sweep, duty cycle morph, sine + 3rd-harmonic.** Mostly flat. Adjacent rows are highly correlated.
- **Tier 2 surfaces.** Not affected the same way — they are samplings of smooth 2D continuous functions, not crossfades between dissimilar anchors.

**Math note.** RMS² of a linear crossfade is `α²·rms₁² + (1−α)²·rms₂² + 2α(1−α)·⟨W₁, W₂⟩`. The cross-term goes negative when anchors are negatively correlated, which is what produces the worst dip.

**Three candidate fixes were laid out:**

| Approach | Behaviour | Trade-off |
|---|---|---|
| **Equal-power crossfade** (√α, √(1−α) factors) | Constant power for orthogonal anchors | Pumps up (+3 dB) for correlated anchors |
| **Constant-RMS post-normalization** (linear interp, then scale each row to target RMS = (1−α)·rms₁ + α·rms₂) | Robust for any pair, only modifies gain | Slight per-row gain rescaling; spectrum unchanged |
| **Spectral-domain interpolation** (interp magnitude spectra, choose phase) | Most musically correct cross-timbre morph (Serum-style) | More complex; phase choice matters; not a pure linear combination |

**Status.** Decision deferred. Loudon's verdict on the current build: "these wavetables work well" — the level dip is a known imperfection but the catalog is musical enough to move forward. Constant-RMS post-normalization is the recommended cheapest fix when we want it. Spectral-domain interpolation is the recommended tool for future Membrane↔Chladni-style cross-symmetry surface morphs.

## Session 4 — 2026-04-27 — Warp catalog folded in; RNBO prototype scoped

**Trigger.** Loudon arrived with a `torus_warping_catalog.md` developed in a separate conversation — fifteen warps from per-axis phase bend through Hopf-fibration parameterization, organised in four tiers, with the architectural framing of *three places a warp can live* (phase-space, coefficient-space, surface-space) and the dominant implementation pattern (lookup-table-and-crossfade). His ask: incorporate it into the project, then plan an RNBO prototype that can run alongside Max's built-in `2d.wave~` for direct comparison, before the warps get implemented.

**Decision.**

- The catalog landed as [[Torus Warping Catalog]] in the project subdirectory — sibling to [[2D Wavetable Catalog]]. Type `hub`, stage `growing`. Body is the full fifteen-entry catalog with palace frontmatter, typed links to the project hub, the wavetable catalog, [[DSP in Looping Dimensions]], [[Kuramoto Coupling]], [[Categorizing Inharmonicity]], and [[Frequency-Time Duality]].
- The project hub gained a *Warps — A Second Surface Library* section sitting just above *Hopf Fibration as Control Surface*, plus a `spawned/warps` link to the new catalog. Forward vectors rewritten so the RNBO prototype is the explicit immediate next step, followed by per-sample Tier-1 warps, then the lookup-and-crossfade infrastructure, then the rest. The "exotic frontier" line now explicitly names T³ and surface-morphing as the next directions after the 2D instrument is alive.
- Status block dated 2026-04-27 and rewritten to capture Loudon's read that *each surface feels like a family of sounds*, which is the architectural promise paying out.

**RNBO prototype — scoped, written, ready to test.**

Loudon picked: surface = [[15 — Penrose Lattice]] (the most demanding surface in the catalog — dense quasi-crystalline lookup, the toughest test of the bilinear math); target = `rnbo~` subpatcher inside Max (fastest iteration, `2d.wave~` next door for direct A/B); param topology = base Hz + ratio (1 freq knob + 1 ratio knob, the rational/irrational gate as the primary expressive control).

Files written to `Projects/2D Torus Wavetable Synthesizer/RNBO/`:

- `torus_2d_lookup.codebox` — the codebox~ source. ~80 lines: bilinear lookup into a flat 1,048,576-sample buffer indexed as `row * 1024 + col`, two free-running phase accumulators driven by `baseHz` and `baseHz * ratio`, mono output. Heavy comments at top documenting the patcher wiring requirements and a five-step verification protocol (static row, static column, closed-orbit at 3:2, Kronecker shimmer at 1.500625, difference monitor). Falls back to `wave()` if `peek()` doesn't resolve.
- `README — RNBO Prototype.md` — the build & test walkthrough. Tells Loudon how to assemble the parent Max patch (buffer~, two phasors, the rnbo~ with its internal `[buffer tablebuf @file ...]` reference, parallel `2d.wave~` for the A/B), and walks through the verification protocol with debug heuristics if the difference monitor isn't silent (axis convention swap, channel index, phase init mismatch, sample-rate mismatch).

**Codebox math (compact form):**

```
phi1 += baseHz / samplerate;          // wraps into [0, 1)
phi2 += baseHz * ratio / samplerate;  // wraps into [0, 1)
xf = phi1 * 1024;  yf = phi2 * 1024;
x0 = floor(xf); y0 = floor(yf); xfrac = xf - x0; yfrac = yf - y0;
x1 = (x0 + 1) % 1024; y1 = (y0 + 1) % 1024;
s00 = peek("tablebuf", y0*1024 + x0, 0);  // four corner peeks
s10 = peek("tablebuf", y0*1024 + x1, 0);
s01 = peek("tablebuf", y1*1024 + x0, 0);
s11 = peek("tablebuf", y1*1024 + x1, 0);
row0 = s00 + xfrac*(s10-s00);  row1 = s01 + xfrac*(s11-s01);
out  = (row0 + yfrac*(row1-row0)) * gain;
```

The convention chosen: X = phi1 = position-along-row, Y = phi2 = row-select. Documented in the codebox so the A/B swap-detection step has something to compare against.

**Acid test still ahead.** Loudon assembles the patch, runs the five-step verification, reports back. If the difference monitor is silent at all five tests, the codebox is validated and the project is unblocked for the warp catalog. If not, the README has a triage list and we debug from a screenshot of the subpatcher.

## State at handoff (2026-04-27)

This is the canonical pickup point. A fresh Claude pointed at this project should be able to read this section, the project hub, and `RNBO/README — RNBO Prototype.md` and pick up the next move without re-deriving anything.

**On disk in `Projects/2D Torus Wavetable Synthesizer/`:**

- `2D Wavetable Catalog.md` — master catalog index for the surfaces, organised by tier.
- `Torus Warping Catalog.md` — sister catalog of fifteen warps (per-axis phase bend through Hopf-fibration parameterization), four tiers, with the architectural lessons that fall out (linear phase-space warps are scan-rate-absorbed; lookup-table-and-crossfade is the dominant pattern). Planning document for what comes after the prototype.
- `Wavetables/` — 11 entries (00 diagnostic + 01–04 Tier 1 utilities + 10–15 Tier 2 named surfaces). Each entry = `.wav` + `.png` + `.md`.
- `Wavetables/00_test_diagnostic_full.png`, `_stacked.png` — original 16-anchor waveform reference images, still accurate.
- `Wavetables/_rms_diagnostic.png`, `_rms_tier1.png` — per-row RMS plots from the level-dip diagnosis.
- `Tools/visualize_wavetable.py` — image renderer.
- `Tools/build_catalog.py` — idempotent catalog generator.
- `Tools/rebuild_diagnostic.py` — diagnostic regenerator.
- `RNBO/torus_2d_lookup.codebox` — the codebox~ source for the smallest playable instance (~80 lines, written 2026-04-27). Bilinear lookup into a flat 1,048,576-sample mono buffer, two free-running phase accumulators, base + ratio params. **Not yet validated in Max** — Loudon needs to assemble the parent patch and run the five-step verification protocol. See README below.
- `RNBO/README — RNBO Prototype.md` — step-by-step build & test walkthrough. Reading this is the fastest way for a fresh Claude (or fresh session) to know exactly what state the prototype is in and what comes next.

**Patch convention.** All catalog entries are 1024×1024; send `rows 1024` to `2d.wave~`. The diagnostic also takes `rows 1024` (rebuilt — the original `rows 16` design is gone). The Stage-1 test protocol in [[00 — Test Diagnostic Wavetable]] is the canonical patch verification for the surfaces themselves; the RNBO README has the parallel five-step protocol for validating the codebox version against `2d.wave~`.

**RNBO build decisions (locked 2026-04-27).** Surface = [[15 — Penrose Lattice]] (densest quasi-crystalline lookup, hardest test of the bilinear math). Target = `rnbo~` subpatcher inside Max (fastest iteration; `2d.wave~` lives next door for direct A/B). Param topology = `baseHz` + `ratio` (one frequency knob, one ratio knob — the rational/irrational gate is the primary expressive control). Buffer-access operator = `peek("tablebuf", index, 0)` with `wave()` as the documented fallback if `peek` doesn't resolve in Loudon's RNBO version.

**Verified.** Diagnostic plays as designed; catalog plays as designed (Loudon's evaluation: "these wavetables work well"). Tier 2 surfaces respond to X:Y ratio detuning in the way the project's central design fact predicts. Each surface reads as a *family* of sounds, not a single voice — the architectural promise paying out.

**Open.**

1. **RNBO prototype validation.** The codebox source is written but the patch hasn't been assembled or tested yet. The five-step verification protocol in `RNBO/README — RNBO Prototype.md` (static row → static column → closed orbit at 3:2 → Kronecker shimmer at 1.500625 → A−B difference monitor) is the next concrete move. Acceptance criterion: difference monitor at numerical-noise floor (under -100 dB) at all five tests.
2. **Interpolation strategy** for Y-axis morphs between dissimilar anchors — see "level-dip discovery" in Session 3 above. Recommended next move: constant-RMS post-normalization on the diagnostic and 01_sine_cycle_sweep when the dip becomes annoying. Spectral-domain interpolation is the tool to reach for when we get to surfaces that interpolate between symmetry classes.
3. **Seventh surface** in the project's [[2D Torus Wavetable Synthesizer]] §"Seven Surfaces" — slot remains open. Candidates floated: a real Kuramoto-bake (Logic 3), a Matérn random-field (Logic 4), a log-likelihood-of-statistical-model surface (Logic 5), a (5,2) or (5,3) Knot Shadow variant.

**The cleanest single next step** for a fresh session: read `RNBO/README — RNBO Prototype.md`, ask Loudon whether he's assembled the patch yet, and proceed from there. If yes and verification passed → first warp is **per-axis phase bend** from [[Torus Warping Catalog]] §1 (three lines of codebox to add a `tanh` curve on each phasor before lookup, exposing two new params). If yes and verification failed → debug from a screenshot using the README's triage list. If no → walk Loudon through the assembly steps in the README. Use the [[rnbo-codebox]] skill if available.

**The frontier beyond the prototype** (Loudon flagged this explicitly): T³ (3D wavetables — surfaces become volumes, the scan a 3-vector), and morphing 2D wavetables (surface-to-surface interpolation, where the symmetry-class problem becomes its own research direction). Both are downstream of the lookup-and-crossfade infrastructure that Tier-1/Tier-2 warps will require — same machinery, different application.
