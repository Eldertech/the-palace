# Waveguide Synthesizer — Sketch Brief (Karplus-Strong, see-it-hear-it)

> The Maker's resolved Job Contract for the first build. This is what the Maker produces *after* intake: the brief decoded, the cascade resolved, the host checked, the segment plan written, success criteria named. A build session (Claude Code, Mac-side) executes against it directly — no further decoding needed. Authored 2026-05-30.
>
> **First, clear the stale lock:** `rm -f ".git/index.lock"` at the palace root before any git op. Nothing is damaged; this is the known Cowork→Mac handoff residue.

---

## 1. Brief, as received

> "A Sketch-tier proof that the waveguide's physics can be both heard and seen at once: a plucked string you hear (Karplus-Strong in an AudioWorklet) and see (a 3D line whose shape is the delay-line state), in one self-contained browser file."

This is the standup job for [[Three.js]] (stub → alive) and the seed-tier first move for [[Waveguide Synthesizer]]. It is deliberately the *simplest thing that proves the core bet* — that rendering the delay-line state IS rendering the synthesis, not decorating it.

## 2. Intake decode (Maker → resolved parameters)

| Intake question | Resolved |
|---|---|
| Medium | Interactive (3D sub-medium) + sound, coupled in one artifact |
| What the 3D renders | The waveguide physics, visible — the string's displacement read from the live delay line (per the project's "physics, visible" decision) |
| Audio engine | In-browser **AudioWorklet** at 48 kHz (per project intake 2026-05-30) |
| 3D stack | **Raw Three.js r128**, single-file (Sketch tier → single self-contained file; R3F deferred to Study, per the Three.js stack ruling) |
| Tier | **Sketch** — scratch quality, desktop Chrome only, no skin polish required beyond palette tokens, no mobile, no perf tuning |
| Deployment | Standalone HTML, opened from `file://` or a local static server |
| Driver | The AudioWorklet's delay-line buffer, downsampled and shipped to the main thread |

## 3. Cascade resolved (Specialists receive concrete values, never the cascade)

- **Mechanical floor (Maker):** sample rate 48 kHz; the visual targets 60 fps but Sketch accepts whatever the GPU gives.
- **Palace base ([[Loudon Live Design System]]):** Graphite skin (channel default). Background `--bg`, the string in `--accent` (signal-amber), grid/terminations in `--fg-3`/`--border`. **Read every colour at runtime via `palaceTokens()` from the linked `colors_and_type.css` — never paste a hex.** Type: Manrope UI labels, JetBrains Mono for the numeric read-outs. Footer `Loudon Live · Autodidact Polymaths`.
- **Project override:** none yet (project is at seed; no skin or tier-vocabulary declared, so defaults apply).
- **Brief override:** none.

> Note for the builder: `palaceTokens()` needs `colors_and_type.css` linked in the document. For a `file://` single-file artifact you may need to inline the token CSS rather than `<link>` it — if so, inline the `:root`/`.skin-graphite` custom properties block verbatim from the canonical file and keep calling `palaceTokens()`; do not hardcode the resolved hexes. That preserves the update-safe substrate discipline.

## 4. Host Capability Check

Run before dispatch (per the Maker's new step). Both Specialists in this job:

- **Three.js** — requires `browser` + `webgl-gpu`; reachable on **mac** (full GPU). Authoring is host-agnostic; the frame-rate read is a human step on the real target. ✓
- **AudioWorklet engine** (not a wrapped Specialist — it's the project's own DSP, hand-written) — requires a browser with `AudioWorklet` support (all current desktop browsers). The audio confirmation (you actually hear the pluck decay) is a **human step**, same class as the Tone.js in-browser-audio rule. ✓

No fallback needed; build proceeds on mac.

## 5. Segment plan (the gated order)

The Maker writes the segment plan before either piece runs. Two segments, one gate:

**Segment A — the engine (`waveguide-processor.js`, an `AudioWorkletProcessor`):**
- A single delay line, length `L = round(sampleRate / frequency)` samples, as a `Float32Array` ring buffer.
- **Excitation:** on a `pluck` message, fill the delay line with a burst — white noise is the canonical Karplus-Strong excitation; optionally one-pole-lowpass the burst so the attack isn't harsh. Excitation *position* is out of scope for Sketch (it's a full-string fill); position-dependent pluck arrives at Study with the bidirectional model.
- **The loop, per output sample:** read `y = buf[i]`; compute the loop filter `out = 0.5*(y + prev) ` (one-pole averaging lowpass — the brightness/decay control); write `buf[i] = out * damping` (feedback gain `< 1`); advance `i = (i+1) % L`; emit `y`. This is the whole synth.
- **Parameters** (via `AudioWorkletNode.parameters` or `port.postMessage`): `frequency` (recompute `L`), `damping` (feedback gain, 0.90–0.999), `brightness` (loop-filter mix). Changing `L` on the fly: for Sketch, rebuild the buffer on frequency change between plucks — gliding pitch is a Study concern.
- **The visualization tap:** every N process-blocks (~ every 16 ms → ~60 Hz), copy a **downsampled** snapshot of the delay line (say 128 points across `L`) and `port.postMessage` it to the main thread. **Do not** post the full audio-rate buffer; do not post every block. Downsample in the worklet.

**GATE:** Segment B's render loop must not assume a state array exists until the first `postMessage` snapshot has arrived. Render an empty/flat string until the first frame of real data. (This is the worklet→render-loop handoff that becomes the Specialist's first dated gotcha.)

**Segment B — the interface (`index.html`, raw Three.js r128):**
- Scene: a `BufferGeometry` line (or thin `TubeGeometry`) of 128 vertices laid along the x-axis; y-positions driven from the latest worklet snapshot each frame. `OrbitControls` (r128-compatible build, sourced explicitly — not assumed as `THREE.OrbitControls`).
- Render loop (`requestAnimationFrame`): read the latest snapshot (a plain module-scope variable updated by the `port.onmessage` handler — no React here, raw path), write it into `geometry.attributes.position.array` (the y components), set `needsUpdate = true`. **This in-place buffer mutation is the load-bearing capability the job exists to exercise.**
- Interaction: click anywhere → start/resume the `AudioContext` (first gesture unlock — the audio-context-suspended gotcha), then `postMessage({type:'pluck'})`. Three sliders (Manrope-labelled): frequency, damping, brightness, each posting param updates. A JetBrains-Mono HUD reading the current frequency and a derived note name.
- Palette via `palaceTokens()`; footer present.

## 6. Success criteria (what "done" means for this Sketch)

1. **See-it-hear-it loop closes:** click → you *hear* a plucked-string tone that decays bright-to-dark, and you *see* the 3D string displace, ring, and settle in time with the sound. The visible decay and the audible decay are the same event.
2. The string shape on screen is demonstrably the delay-line contents (not a sine approximation) — a noisy pluck shows visible high-frequency structure that smooths as it decays.
3. Frequency / damping / brightness sliders each audibly *and* visibly change the result.
4. Runs as a single self-contained file in desktop Chrome with no console errors.
5. Palette comes from tokens; no hardcoded hex; footer present.

Out of scope for Sketch (do not gold-plate): bidirectional waveguide, excitation position, dispersion/inharmonicity, R3F, mobile, polyphony, SharedArrayBuffer (use `postMessage`), design-system skin beyond Graphite tokens.

## 7. Self-checks before declaring done

- **Engine:** `node --check waveguide-processor.js` parses. The loop math is verified by reasoning/offline test (a unit harness that runs the loop on a known excitation and confirms the output decays and its dominant period ≈ `L`). Audio confirmation is the human step — say so in the standards report rather than claiming it.
- **Interface:** scene renders without console errors; the `needsUpdate` flag is set each frame (the silent-no-op gotcha); OrbitControls responds; first-gesture audio unlock works.
- **Honest-comparison / reproducibility:** capture a standards JSON — `frequency`, `damping`, `brightness`, `L`, `snapshot_points`, `three_version: r128`, `stack: raw`, `audio_bridge: postmessage`, `fps` (measured), `tier: sketch`, `status`, `notes`, and explicitly which checks were machine-verified vs. human-pending.

## 8. What this job is designed to teach (the gotchas it will mint)

Each of these is currently *reasoned* in the [[Three.js]] entry; this job converts them to *dated*:
- The worklet→render-loop handoff shape (postMessage snapshot cadence, downsample-in-worklet, the "flat until first frame" gate).
- `geometry.attributes.position.needsUpdate = true` as the per-frame requirement (the silent no-op).
- r128 `OrbitControls` sourcing (not `THREE.OrbitControls`).
- AudioContext-suspended-until-gesture (shared with the [[Tone.js]] lineage).
- And it settles the open question: **for the physics-visible sub-genre, did the raw single-file path feel right at Sketch, or did the control wiring already want R3F?** Record the answer in the Three.js entry's Open Questions.

## 9. Delivery

Bundle target: `Projects/Waveguide Synthesizer/` (project bundle) for the artifact, with the recipe landing in `Artifacts/Shop/Three.js/recipes/` and the test-plan instantiated from `Artifacts/Shop/_TEMPLATE/test-plan.md` at `Artifacts/Shop/Three.js/tests/test-plan.md`. On landing: flip Three.js `status: stub → alive` in both the entry frontmatter and the Maker Roster, advance the Waveguide project `stage: seed → sprout`, and log the dated gotchas. Consider a `Let's weave` afterward to formalize the new typed links.
