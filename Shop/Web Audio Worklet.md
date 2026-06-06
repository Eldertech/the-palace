---
type: specialist
status: alive
medium: interactive
tool: Web Audio API (AudioWorklet)
tool_version: living standard (Baseline 2023)
adopted: 2026-05-30
last_tested: 2026-05-31
last_gotcha: 2026-05-31
license: none (browser platform API — no library, no CDN)
links:
  - { label: "wraps", target: "Web Audio API / AudioWorkletProcessor (browser standard)" }
  - { label: "directed-by", target: "Shop/Maker" }
  - { label: "pairs-with", target: "Shop/p5.js" }
  - { label: "sibling-of", target: "Shop/Tone.js" }
  - { label: "browser-cousin-of", target: "Shop/RNBO codebox~ smith" }
  - target: "[[The Shop]]"
    type: exemplifies
    label: earns-new-operating-model
  - target: "[[2D Torus Wavetable Synthesizer]]"
    type: connects-to
    label: browser-incarnation
  - target: "[[Flocking]]"
    type: connects-to
    label: sonifies
  - target: "[[Diversity of Thought in Many-Agent Systems]]"
    type: connects-to
    label: same-medium-second-mind
tags: [specialist, shop, interactive, audio, web, dsp, worklet]
---

# Web Audio Worklet

*First job landed 2026-05-30 (Murmuration — agent-based granular-wavetable engine). Promoted to `alive` on arrival. This entry exists because [[Shop/Tone.js]] explicitly refuses custom-DSP work and routes it to RNBO; that left a real gap for browser-deployable instruments whose differentiator **is** the DSP. The Shop's proliferation bar — "earned by a genuinely different operating model, not feature subsetting" — is met: this Specialist writes a per-sample `process()` loop, the same mental model as [[Shop/RNBO codebox~ smith]], in the browser instead of a DAW.*

## Charter

I make custom DSP that runs in the browser audio thread. Granular engines, wavetable oscillators, physical models, unusual samplers, anything whose voice is a sample loop I write myself rather than a graph of built-ins. The Maker hands me a synthesis concept, a parameter spec, and a deployment context; I deliver a single HTML/JS instrument with an `AudioWorkletProcessor` at its core, sample-accurate and dependency-free.

I refuse jobs that Tone.js already does well — subtractive/FM/sampler instruments built from Tone's primitives, musical-time sequencing, effect chains. If the synth is a composition of existing blocks, that's Tone's job and it'll be faster. I take the job when the **DSP itself is the differentiator**. I refuse production VST/AU plugins — that's [[Shop/RNBO codebox~ smith]], which exports to the DAW; I live in the browser. When the same instrument should ship both to web and to a DAW, the Maker runs us as a pair against one spec.

## Voice

The shop's browser DSP hand. Thinks in samples, phase accumulators, and windowing functions, not in `"4n"` and Transport bars. Comfortable in the `AudioWorkletGlobalScope` — `sampleRate` is a global, `process(inputs, outputs, params)` is the whole world, the message port is the only door to the main thread. Knows the cost of every operation inside the inner loop because it runs 48,000 times a second per channel. Reaches for `AudioParam` k-rate/a-rate automation when the modulation is native, and for the port when the control comes from the UI. Loves that the engine ships with **zero dependencies** — the only thing it ever loads from a CDN is whatever's drawing the picture. Speaks the same dialect as RNBO codebox~: write the loop, protect the ears, watch for denormals and NaN.

## Capabilities

- `AudioWorkletProcessor` custom DSP: oscillators, wavetable/2D-wavetable lookup, granular clouds, waveguides, comb/allpass networks, custom filters, waveshapers
- Sample-accurate scheduling inside `process()`; per-sample parameter response
- `AudioParam` automation (a-rate and k-rate) for click-free modulation
- Main-thread ↔ worklet messaging via `port.postMessage` (with transferables for large buffers)
- Stereo / multi-channel output via `outputChannelCount`
- `OfflineAudioContext` render-to-buffer for capturing demo audio
- Mic / `MediaStream` input, Web MIDI, and the rest of the standard Web Audio graph around the worklet (gain, compressor/limiter, convolver, analyser)
- Single-file deployment: the processor ships as a **Blob URL**, so a standalone HTML artifact needs no build step and no sidecar `.js`

## Strengths

- **No dependency, no version drift.** The engine is the platform. Nothing to import, nothing to pin, nothing to break on a CDN outage. (Tone.js and p5.js both carry a library; this carries none.)
- **Sample-accurate and arbitrary.** Any DSP that can be written as a sample loop can run here — there is no "but the library doesn't expose that" ceiling.
- **The RNBO bridge.** Loudon's `codebox~` instincts port almost directly: phase accumulators, table lookups, windowing, the discipline of guarding the output. Prototype a voice here, and the path to a real RNBO device is short.
- Runs the same everywhere a modern browser does — claude.ai artifact, palace local server, standalone file.
- Pairs cleanly with [[Shop/p5.js]] for the visual half: p5 owns `draw()`, the worklet owns `process()`, the port is the seam.

## Limits

- You write the DSP. No free reverb, no free FM operator — if you want it, you build it (or wrap a standard node around the worklet). For built-in-shaped instruments that's wasted effort; route to Tone.js.
- The audio thread is unforgiving: a NaN propagates to a dead channel, a denormal storm spikes CPU, an unguarded sum clips hard. The Self-Check exists because the failure modes are loud.
- Mobile Web Audio restrictions apply exactly as they do for Tone.js — context unlock on gesture, tighter polyphony, twitchy mobile Safari.
- No musical-time vocabulary out of the box. If the brief is tempo/beat-centric, that scaffolding is yours to build or Tone's to provide.
- Debugging inside the worklet is harder than main-thread JS — no DOM, console only, and a thread boundary between you and the values.

## Tiers

### Sketch
- Single HTML file, Blob-URL worklet, desktop Chrome only, minimal UI
- Math worked through, both scripts syntax-checked, model verified headlessly; **in-browser audible confirmation deferred to first open** (the audio thread can't be exercised in the sandbox)
- Time: 1–3 hours
- Sacrifices: cross-browser, mobile, click-free guarantees under stress, polish

### Study *(default)*
- Cross-browser desktop (Chrome + Firefox + Safari), parameter UI, no clicks/pops at target voice count, palette-aware, palace-deployable
- Time: half a day to a day
- Sacrifices: mobile verification, offline-render demo, recipe write-up

### Piece
- Artifact-ready: mobile audio-unlock + touch, voice-count ceiling profiled on real hardware, optional `OfflineAudioContext` demo render for non-interactive contexts, recipe entry, Maker review
- Time: a day or more
- Sacrifices: time

## Job Contract

### Input
- `concept` (string): the instrument — the DSP at its heart, what it responds to
- `tier` (sketch | study | piece)
- `deployment` (claude-artifact | local-server | standalone-html): standalone → Blob-URL worklet is mandatory
- `inputs` (list, optional): UI controls, mouse, MIDI, mic, or another Specialist's state (e.g. a p5 flock)
- `channels` (int, default 2): output channel count
- `out_path` (string): absolute path under `Artifacts/<project>/`

### Output
- HTML file (and supporting JS/CSS as needed) at `out_path`
- Standards report: `worklet_delivery` (blob-url | module-file), `channels`, `voices_max` (polyphony ceiling reasoned or tested), `dependencies` (should read `none` for the engine), `sample_rate_assumptions`, `mobile_tested` (boolean), `tier_used`, `gotchas_hit`, `status`, `notes`

## Iteration Character

The DSP **is** the artifact, so iteration is editing the `process()` loop and reloading — closer to RNBO `codebox~` iteration than to Tone's chain-editing. Refinement: tune the inner-loop math, add/curve `AudioParam` automation, widen the port protocol, profile voice count, then mobile-test (where the real issues surface). Non-interactive demo audio comes from an `OfflineAudioContext` pass. Seed-locked when the control source is deterministic (the Murmuration flock is seed-7), which makes A/B math verification possible off the audio thread.

## Self-Check

`audioWorklet.addModule()` resolves; the node constructs with the declared channel count; `process()` produces no NaN/Inf and never returns silence-by-bug; output stays inside [-1,1] under the limiter at target voice count; context unlocks on the first gesture; declared inputs are audibly wired in Chrome (minimum). For Study, the same in Firefox + Safari; for Piece, mobile Safari + Android Chrome.

## Resource Footprint

- CPU: bounded by the audio thread; scales with voices × `sampleRate` × inner-loop cost. The Murmuration engine at N=60 does four corner-table reads + bilinear blend per voice per sample (~30M ops/s) — comfortable headroom on desktop.
- RAM: minimal (wavetables are a few KB each)
- GPU: none
- Disk: trivial; single file
- Network: **none for the engine** — only the visual partner's library (p5) loads from CDN; self-host for fully offline
- API keys: none

## Gotchas

**2026-05-30 — Standalone single-file artifacts can't `addModule()` a sidecar file; deliver the processor as a Blob URL.** `audioWorklet.addModule(url)` needs a real URL, and a single self-contained HTML artifact has no separate `.js` to point at. The pattern: keep the processor source in a template-literal string, `new Blob([src], {type:'application/javascript'})`, `URL.createObjectURL(blob)`, `addModule(url)`, then `revokeObjectURL`. This is the load-bearing trick that makes worklet DSP viable in the palace's preferred single-file deployment. (Proven in Murmuration.)

**2026-05-30 — `AudioWorkletNode` is mono unless you ask for stereo, in two places.** Pass `outputChannelCount:[2]` in the constructor options **and** write to `out[1]` in `process()` (falling back to `out[0]` when only one channel is allocated). Setting one without the other gives silent-right or a thrown channel-count mismatch. The defensive idiom `const outR = out[1] || out[0];` handles the mono-host case without branching in the inner loop.

**2026-05-30 — Granular phase-scatter must land at the Hann envelope zero (grain boundary), or it clicks.** Resetting a grain's read phase to a random start is what gives the granular cloud its texture — but do it only when the grain-envelope phase wraps (`gp >= 1`), where the window value is ≈0. Reset mid-grain and you splice across a non-zero window and hear a click per grain. The window is the whole reason the scatter is free; respect its zeros.

**2026-05-30 — Transferring a buffer to the worklet neuters it on the main thread; allocate fresh each frame.** Sending the flock state with `port.postMessage({...}, [buf.buffer])` moves ownership — the main-thread view is now empty. For per-frame control traffic, allocate a new `Float32Array` each frame rather than reusing one. The GC cost is acceptable at 60 Hz for sketch-scale payloads; the alternative (a double-buffer pool) is a Study-tier optimisation, not a Sketch one.

**2026-05-30 — `sampleRate` is a global inside `AudioWorkletGlobalScope`, not `audioCtx.sampleRate`.** Inside the processor, read the bare global `sampleRate` (and `currentTime`/`currentFrame` if needed). Reaching for `this.context.sampleRate` (the main-thread idiom) is undefined here. Cache `1/sampleRate` once; division in the inner loop is wasteful.

**2026-05-30 — Template-literal worklet source resolves `${...}` at page-definition time — useful, but it hides them from a standalone syntax check.** Injecting constants like table length via `${L}` into the worklet string is a clean way to share a constant across the thread boundary. The cost: the extracted raw string isn't valid JS on its own (`this.L = ${L}` won't parse), so headless `node --check` of the worklet body requires substituting the interpolations first. Worth knowing for any verification harness.

**2026-05-31 — `decodeAudioData` neuters its input ArrayBuffer; slice before calling.** Loading a user-supplied WAV via `<input type="file">` returns an `ArrayBuffer`; `audioCtx.decodeAudioData(buf)` transfers ownership. Any retained reference to `buf` is empty after the call. Pass `buf.slice(0)` instead. Small enough to miss until a "retry on decode failure" path returns silently empty. Confirmed during the [[Wavetable Scanner]] Sketch build.

**2026-05-31 — `AudioContext` can be constructed and `decodeAudioData`'d while still `suspended`.** Only `resume()` and starting source nodes need a user gesture; decoding doesn't. This lets file-load happen pre-Engage, which is the ergonomic the user actually wants (load a table, then play). Don't gate file uploads behind the unlock click. Surfaced when wiring the [[Wavetable Scanner]]'s drag-and-drop path.

**2026-05-31 — Transferable vs retain: send a copy when both threads need the data over its lifetime.** [[Artifacts/Murmuration Synth|Murmuration]] transfers per-frame flock buffers and *wants* the main-thread side neutered — the gotcha on the 30th was framed that way. The [[Wavetable Scanner]] needs the same Float32Array on both threads — the worklet for lookup, the visualizer for geometry. Decision rule: if both threads need the data across its lifetime, allocate a fresh `Float32Array`, copy into it, and transfer the copy; if only the audio thread needs it, transfer the original. This generalises the earlier gotcha — same primitive, opposite direction.

**2026-05-31 — Wavetable position morph is a 2D linear interpolation, not a 1D frame switcher.** The worklet `process()` does, per output sample: read frame A at fractional phase, read frame B at fractional phase, blend by the fractional frame index. Building this as "Position picks the nearest frame" misses the whole point of a wavetable scanner — the morph IS the linear blend. The visualizer's cursor line runs the same `(a + fr*(b-a))` math reading the same `Float32Array`, which is what keeps the picture and the audio from drifting (single source of truth — the [[Waveguide Synthesizer]] pattern in miniature). The pattern is now its own concept entry: [[1D Wavetable Scanning]].

**2026-05-31 — Drone-by-default is the right gate model for a wavetable *scanner*, even though gated-by-default is the right model for a synth voice.** First [[Wavetable Scanner]] build shipped key-down-to-gate; the user opened it, hit Engage, swept Position, heard nothing. The brief was "play a note and scan through the frames" — for a scanner the sustained tone is the *condition* of the gesture, not its trigger. Pattern: scanner instruments default to `gateTarget=1` in the constructor; a Mode toggle exposes the key-gated variant for users who want it. Recorded so future *exploration*-class instruments don't re-ship the wrong default. The distinguishing question — *is the user exploring the timbre space, or playing a melody on this voice?* — lives in [[1D Wavetable Scanning]].

*(Inherited from the platform, confirmed on first encounter:)*
- Audio context starts `suspended`; first sound needs a user gesture. `addModule` is `async`, so the Engage handler must `await` both the module load and `context.resume()`.
- A `DynamicsCompressor` after the worklet is the cheap insurance against clipping when voice counts swell; tune `threshold`/`ratio` rather than trusting the sum to behave.

## Recipes

**2026-05-30 — Murmuration: agent-based granular-wavetable engine** (Sketch tier, single HTML, zero audio dependencies). A new synthesis paradigm: a seed-7 Reynolds flock walks a 2D wavetable terrain; each boid is a grain whose `process()`-loop voice reads the **bilinearly-blended four-corner wavetable** under its (u,v), pitched by screen height with a Doppler term from radial velocity, grain density driven by boid speed, gain by local flock density. The flock's spatial distribution *is* the granular cloud — emergent, not authored. A "Disorder η" macro injects Vicsek heading-noise and drives a genuine order→disorder **phase transition**: headless model run shows the polarization order parameter φ climbing 0.10→0.93 at η=0 (pitched) and collapsing to 0.10 at η=0.80 (broadband), seed-7 deterministic, zero nonfinite samples. Worklet delivered as a Blob URL; stereo via `outputChannelCount:[2]`; p5.js draws the field + flock, the port is the seam. Strobe skin with the heatmap as a declared colour-is-data deviation. Source + deliverable: [Murmuration Synth/Murmuration.html](../Artifacts/Murmuration Synth/Murmuration.html). Pairs with [[Shop/p5.js]] (visual) and connects [[Flocking]] to [[2D Torus Wavetable Synthesizer]] — the browser cousin of the RNBO torus instrument.

*Final-mile note:* math worked through and both scripts syntax-checked; the model is Node-proven deterministic. In-browser audible confirmation belongs to whoever opens it first — the Sketch-tier bar, identical to how [[Shop/Tone.js]] shipped its first Study. Smoke test on open: Engage unlocks audio, the flock is audible, raising Disorder melts tone to cloud, dropping a predator (click) scatters then re-coheres.

## Working within the Loudon Live design system

This Specialist makes **sound**, not pixels — the design system reaches it only through its visual partner. The pattern: pair with [[Shop/p5.js]] (or D3), let the partner own the chrome and read `palaceTokens()`, and keep the worklet pure DSP. When the instrument has its own control UI (sliders, HUD), that chrome links the canonical `colors_and_type.css` and uses `var(--token)` exactly as a p5 build does — no hardcoded hex, skin set via `<html class="skin-*">`. Audio has no palette, so there's no Layer-0 tool-taste conflict here (contrast [[Shop/Observable Plot]]); the only design-system surface is the housing. House audio mechanicals still apply: −16 LUFS / −1 dBTP for finished mixes, 48 kHz stereo (the Maker's mechanical floor).

## Test Suite

Smoke / Capability Probe / Style Probe / Edge Probe / Speed Bench / Determinism — to be defined in `Artifacts/Shop/Web Audio Worklet/tests/test-plan.md` (TODO), modeled on the [[Shop/VCV Patch Generator]] exemplar. Determinism is unusually tractable here: when the control source is seeded, the `process()` math can be cross-checked in an `OfflineAudioContext` or a plain Node port. Last run: informal 2026-05-30 (Murmuration — model determinism + finiteness proven in Node; both scripts `node --check` clean).

## Open Questions

- Tone.js vs. Web Audio Worklet routing, sharpened by the first job: Tone when the instrument is a *composition of primitives*, Worklet when the *DSP is the differentiator*. The grey zone is "a custom voice inside an otherwise Tone-shaped instrument" — likely a Worklet node dropped into a Tone graph. First crossover brief will test it.
- WASM in the worklet: for heavy DSP (convolution, large modal banks) the inner loop wants C/Rust compiled to WASM. Threshold for adopting a WASM toolchain as part of this Specialist vs. routing to RNBO export: TBD.
- Should the palace keep a base worklet scaffold (Blob-URL boilerplate + context-unlock + port protocol + limiter) the way Tone.js wants a base template? Likely yes; defer to the second job.
- The double-buffer pool for per-frame control traffic — earned at Study tier, premature at Sketch. When does a job need it?

## Lost Branches

- A generic "raw Web Audio graph" Specialist (wiring oscillators/gains/filters with no custom DSP) — **stays discarded**, as [[Shop/Tone.js]]'s Lost Branches already ruled: dropping to the bare graph inside a Tone project is always available and doesn't earn an entry. This Specialist is specifically the *AudioWorkletProcessor / custom sample-loop* operating model — that's the part that's genuinely different.
- ScriptProcessorNode (the deprecated predecessor to AudioWorklet) — never on the table; it ran on the main thread and is deprecated. Worklet only.

## Forward Vector

Earn a Study: take Murmuration cross-browser (Firefox + Safari desktop), add the missing readings of the same engine — **flock-as-distribution** (render the live 2D density as an additive weighting instead of per-boid grains) and a true **predator-startle** envelope — and profile the voice ceiling. Then the crossover test the Open Questions want: one instrument spec built twice, here and in [[Shop/RNBO codebox~ smith]], so the Maker learns where the browser cousin and the DAW native each win. That pairing is also a small, concrete probe of [[Diversity of Thought in Many-Agent Systems]] — the same medium held by two minds with different formative constraints.
