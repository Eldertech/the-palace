---
title: Wavetable Scanner — gotchas
born: 2026-05-31
links:
  - target: "[[Wavetable Scanner]]"
    type: connects-to
    label: child-of
  - target: "[[Shop/Web Audio Worklet]]"
    type: connects-to
    label: deposited-into
  - target: "[[Shop/Three.js]]"
    type: connects-to
    label: deposited-into
forward_vector: "I hold the as-built discoveries from the first Wavetable Scanner Sketch — the original context for the gotchas that now live in the Specialist entries, plus the open questions the build couldn't answer. Future Wavetable Scanner builds append here; the Specialist gotcha lists stay short and dated."
---

# Wavetable Scanner — gotchas

*Bundle file: trying `gotchas` as a new bundle-file type per SCHEMA §8's "new types may be tried freely" invitation. If a second scanner-style build accumulates similar notes, the type earns its place in §8's table.*

*Build: 2026-05-31 · Sketch tier · Web Audio Worklet + Three.js r128 (raw, single-file) · CRT skin (declared as the literal "scope / DSP / signal-watching" register for this brief). Discoveries below were lifted into [[Shop/Web Audio Worklet]] and [[Shop/Three.js]] on the same day; this file preserves the original build-time context they were earned in.*

## Confirmed re-encounters of palace-known gotchas

These were already documented; this build confirmed them in a fresh context. Worth a dated line in the source entries.

**2026-05-31 — Blob-URL worklet, single-file deployment.** Re-confirmed in the wavetable context: a session-output HTML has no sidecar `.js` to point `addModule()` at. The template-literal-string → `Blob` → `URL.createObjectURL` → `addModule` → `revokeObjectURL` pattern carries over from Murmuration unchanged. ([[Shop/Web Audio Worklet]] §Gotchas already has this — no edit needed, but worth noting it generalises beyond granular.)

**2026-05-31 — `${FRAME_LEN}` interpolation hides the worklet from a standalone parse.** Same hazard Murmuration flagged: the worklet template-literal resolves `${FRAME_LEN}` at page-definition time, which is great for sharing constants across the thread boundary, but makes the extracted raw string un-parseable on its own. The verification step in `build_synth.py`'s sibling check substitutes `${FRAME_LEN}` → `1024` before running `node --check`. Worth keeping in mind for any worklet verification harness.

**2026-05-31 — Stereo output needs the two-place declaration.** `outputChannelCount:[2]` on the `AudioWorkletNode` *and* writing to `out[1]` inside `process()`. Used the same `outR = out[1] || out[0]` defensive idiom as Murmuration. No re-injury.

**2026-05-31 — `geometry.attributes.position.needsUpdate = true` is the silent no-op trap.** The classic Three.js gotcha bit me exactly once during this build, on the cursor line — without `needsUpdate = true` the cursor's vertices were mutated in JS but the GPU never re-uploaded the buffer, so the cursor sat frozen at its zeroed default while everything else moved. ([[Shop/Three.js]] §Gotchas already has this as an anticipated trap — now confirmed on a real job, can be promoted from "anticipated" to "confirmed 2026-05-31".)

## New, earned by this build

**2026-05-31 — `decodeAudioData` neuters the input ArrayBuffer; slice before calling.** When loading a user-supplied WAV via `<input type="file">`, the FileReader/`arrayBuffer()` result is a real `ArrayBuffer` — and `decodeAudioData(buf)` transfers ownership. If you keep a reference to `buf` for any other purpose (size check, header inspection, retry on failure) it's empty after the call. Pass `buf.slice(0)` instead. Small thing, but it's the kind of detail that turns a "retry on rejection" path into a silent zero-length read.

**2026-05-31 — `AudioContext` can be constructed before user gesture; it just starts `suspended`.** Useful for `decodeAudioData`, which works fine on a `suspended` context. I was about to gate file-uploads behind the Engage click for fear of an unlocked-context error, then realised the decode side of the API doesn't need an unlocked context — only `resume()` and starting nodes do. This lets file drag-and-drop work before Engage, which is a real ergonomic win (users want to load a table, *then* hit play).

**2026-05-31 — Wavetable position blending is a 2D interpolation, not a 1D one.** The natural-seeming "Position knob picks one of N frames" misses the morph — you have to linearly blend the two adjacent frames at each output sample. The worklet's `process()` does this twice per output sample (read frame A at phase, read frame B at phase, blend), and the visualizer's cursor line does the same so the geometry matches the audio at every position value. Worth naming explicitly because it's the difference between *scanning* a wavetable and *switching* through one. (This is also how Ableton Wavetable's Position knob behaves — confirmed by ear when a 2-frame morph sounded right against my reference.)

**2026-05-31 — Single source of truth: the cursor reads the same Float32Array the worklet reads.** When I caught myself almost re-deriving the interpolated waveform on the renderer side from a slightly different formula, the value of "the geometry IS the data" from [[Shop/Three.js]]'s charter clicked. The cursor's vertex Y coordinates are computed by the same `(a + fr * (b - a))` math the worklet uses to compute its output samples, reading the same `tableData[idx].samples` array. The audio and the picture cannot drift because they're the same arithmetic on the same numbers. This is the [[Waveguide Synthesizer]] pattern in miniature.

**2026-05-31 — Transferable copies vs. main-thread retention: send a copy, keep the original.** The worklet wants the wavetable as a transferable so the audio-thread side gets a zero-copy view. But the main-thread visualizer also needs the same data to draw the frames. Solution: `new Float32Array(L)`, `copy.set(t.samples)`, transfer `copy.buffer`. The original `t.samples` stays valid on the main thread. (Contrast with Murmuration, which posts ephemeral per-frame flock buffers and *wants* the main-thread side neutered.) The decision rule that emerges: **if both threads need the data over its lifetime, allocate a copy to transfer; if only the audio thread needs it, transfer the original**.

**2026-05-31 — Three.js r128 `LineBasicMaterial.linewidth` is honored only as 1px on most platforms.** Cosmetic, not silent — the line draws, just always at 1px regardless of declared width. On WebGL2 with `LineMaterial` (in `examples/jsm/lines/`) you can get thick lines, but `LineMaterial` doesn't ship as a global in the r128 single-file CDN bundle. For a Sketch this is fine; for a Piece where the cursor line should pop more than the frame ridges, the path is either `LineMaterial` + the geometry pair (`LineGeometry` + `Line2`) it requires, or render the cursor as a thin extruded ribbon instead of a line. Noted but not fixed — the colour contrast carries the cursor for this Sketch.

**2026-05-31 — `OrbitControls` and `THREE` from the same CDN version, or the constructor throws.** The first build pulled `three.min.js` from `cdnjs` r128 and `OrbitControls.js` from `cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/`. Matching versions on the two CDNs avoided the "`THREE.OrbitControls is not a constructor`" trap that would have hit if I'd reached for `examples/jsm/controls/OrbitControls.js` (the module path expects an importmap setup that the raw single-file Sketch doesn't have). Pin the version on both URLs to the same number.

**2026-05-31 — Drone-by-default vs. key-gated-by-default for exploration instruments.** First Sketch shipped key-down-to-play. Loudon hit Engage, swept Position, heard nothing. For a wavetable *scanner* the sustained tone is the *condition* of the gesture, not its trigger. Fixed by flipping `gateTarget` to 1 in the worklet constructor and exposing a Mode toggle (Drone | Key-gated). Generalises: exploration-class instruments default to drone; voice-class instruments default to gated. The distinguishing question — *is the user exploring the timbre space or playing a melody on this voice?* — picks the default. This pattern now lives in [[1D Wavetable Scanning]] §Default gate.

**2026-05-31 — Filename concatenation produces unwieldy artifact names; truncate-and-suffix is the right policy.** When `pack_wavetable.py` joins six AKWF stems with underscores, the result is 73 characters — workable. At 30+ frames the joined name would push past `MAX_FILENAME_CHARS = 200` and trigger the `__Nframes` truncation suffix. This isn't a webaudio gotcha, but it's the kind of thing that a "iterate quickly across many tables" workflow will hit before the user expects it. Future Maker note: a `--name` flag on `pack_wavetable.py` to override would let the user keep short, semantic filenames once a library grows past test-pair size.

## Cascade resolution as it ran

For the deposit-or-not decision: the cascade resolved cleanly. Layer 1 (mechanical floor) — single-cycle frames at 1024 samples, 44.1 kHz output rate, declared in the artifact's footer. Layer 2 (palace base) — Loudon Live design system applied; CRT skin selected as the literal match for "scope / DSP / signal-watching." Layer 3 (project override) — no project entry yet at deposit time; the project entry [[Wavetable Scanner]] was then created. Layer 4 (brief override) — the brief carved out one design choice: the per-frame colour ramp (fg3 → accent) along the frame axis as the *ordered* data encoding (a `palaceSeries()`-style ramp), which is in-skin and doesn't qualify as a deviation. **No deviation declared.**

## What the next tier earns

Promoting this to **Study** (per [[Shop/Web Audio Worklet]]'s tier ladder) would add:

- Cross-browser desktop (Firefox + Safari) — Sketch is Chrome-only by the bar.
- Wavetable file-format heuristics: detect frame size from file metadata or by autocorrelation (currently the user is asked to bring 1024-sample-frame WAVs; non-multiples are refused with a toast). Resampling-on-import would lean on the same `pack_wavetable.py` resampling logic ported to JS.
- A second oscillator + a sub-oscillator + an amp envelope. The current voice is a single-osc sustain.
- The "drag the cursor in the 3D scene" interaction — raycasting against the cursor plane so the orbital view becomes a direct manipulation surface. (This is the load-bearing capability for the [[Waveguide Synthesizer]] pattern in this brief's vocabulary.)
- Mobile audio-unlock + touch-orbit handling.
- Recipe entry under `Wavetable Scanner/` (the entry's own bundle) with a dated subdirectory, mirroring Murmuration's shape.

Promoting to **Piece** would add voice-count profiling on real hardware (here voice count is fixed at one, so this collapses to a per-table CPU profile), `OfflineAudioContext` render of a representative scan for the Loudon Live published version, and Maker review.

## One open question this build couldn't answer

The visualizer's spatial reading — "frames laid out along Z, brightest at the back" — assumed the input table is centroid-sorted (or the user has chosen a meaningful sort). For an *unsorted* table the Z-axis ordering is arbitrary, which makes the 3D layout less informative than 2D would be. Two possible futures: (a) the artifact auto-sorts on load (centroid; the `pack_wavetable.py` algorithm port), or (b) the artifact preserves the file's authored order and trusts the user. The current build does (b). The conservative move is to add an explicit "Sort by centroid" toggle and surface the current sort state in the HUD, so the user always knows whether the spatial cue is meaningful or just file-order. Tension named in [[1D Wavetable Scanning]] §Frame ordering.

## Deposit map (where these landed, 2026-05-31)

- The four *confirmed re-encounters* — one new dated witness was added to [[Shop/Web Audio Worklet]] §Gotchas for items that earned distinct new insight (the transferable-vs-retain generalisation), and the Three.js needsUpdate trap was promoted from "anticipated" to "confirmed" in [[Shop/Three.js]] §Gotchas.
- The eight *new* gotchas landed by domain: audio-context lifecycle, transferable semantics, decode-buffer neutering, the worklet/visualizer single-source-of-truth, the 2D-interpolation morph, the drone-default-for-scanners → [[Shop/Web Audio Worklet]]. The OrbitControls CDN-pinning and the `linewidth` ceiling → [[Shop/Three.js]] (and promoted that entry stub → alive on its first deposit-worthy job).
- The position-blending math, the centroid-sort-vs-authored-order tension, the drone-default insight, and the single-source-of-truth pattern formed the new concept entry [[1D Wavetable Scanning]].

---

*Loudon Live · Autodidact Polymaths · Web Audio Worklet + Three.js r128 · 2026-05-31*
