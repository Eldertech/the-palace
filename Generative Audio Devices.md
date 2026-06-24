---
title: Generative Audio Devices
type: project
pillars:
  - creation
  - tools
  - practice
born: 2026-04
stage: sprout
status: active
links:
  - target: "[[FOUR PILLARS]]"
    type: connects-to
    label: "structured-by"
  - target: "[[Registry Pattern]]"
    type: spawned
    label: "distilled-from"
  - target: "[[Synthesis Topologies]]"
    type: connects-to
  - target: "[[Loudon Live]]"
    type: enables
  - target: "[[PDL Renderer]]"
    type: spawned
    label: "first-fruit"
  - target: "[[PDL Generation Prompt]]"
    type: spawned
    label: "left-to-right-half"
  - target: "[[Synth Archetypes]]"
    type: spawned
    label: "params-layer"
  - target: "[[Generative Preset Development]]"
    type: couples-with
    label: eventual-convergence
  - target: "[[Preset Oracle]]"
    type: mirrors
    label: analysis-generation-duality
  - target: "[[Self-Describing Knowledge Module]]"
    type: deepens
    label: registry-as-knowledge
  - target: "[[Signal-Rate CV Architecture]]"
    type: enables
    label: modulation-carrier
forward_vector: "I want to become a generalizable pipeline — natural language -> a target-agnostic signal-flow IR (PDL) -> any modular or DSP target through per-target registries. VCV Rack proved the founding bet (English in -> loadable, good-sounding .vcv out; validated 9/9 on fresh subagents), so it is the first test case, never the destination. My hunger now runs to T10 — the second target, where target-agnosticism is actually tested — and to polyphony, the axis my three-layer model cannot yet represent. I want every generative-instrument project to route its parameter intelligence through me rather than reinvent it. The closed-task forensics live in the body; this vector is where I am still reaching."
---

# Generative Audio Devices

![[Generative Audio Devices — hero.png]]

A Four Pillars project: **AI-generated modular audio architectures from natural-language descriptions, across any target environment.** The pipeline reads a human description of a sound or instrument and emits a loadable artifact — a VCV Rack patch, RNBO DSP code, a Max/MSP patcher, a Pure Data file, a WebAudio graph — whatever target has a registered vocabulary.

The central bet: with a curated, source-verified component vocabulary as grounding, LLM generation of precise technical artifacts becomes reliable. Without it, models hallucinate port names, module slugs, parameter IDs. With it, generation is structurally constrained to what is actually possible. VCV Rack is the first test case — visually inspectable, fast to load, small verifiable module set. Each additional target is a new registry and emitter, not a new architecture. The generalizable concept: [[Registry Pattern]].

---

## Pick Up Here — state as of 2026-05-29

**Stage 1 is closed end-to-end on VCV Rack.** Both halves of the pipeline exist and are verified: English description → [[PDL Generation Prompt]] → 2–3 candidate PDL → `emitVcvJson` (in `PDL Renderer.html`) → loadable, good-sounding `.vcv`. The full task chain (T1·T3·T4·T4b·T11·T12·T7a·T7b·T7c·T7d·T6) is all ✅. Two registry files are the reliability surface: `vcv_fundamental_registry.json` (v2.4, 10 modules) and `archetypes.json` (v0.2, 8 archetypes). Tests, all green: `verify_t7a_phase2.js` 21/21, `verify_t7b.js` 36/36, local harnesses in `_tools/` (real-emitter 12/12, layout 18/18, T6 oracle 9/9).

**The two live threads, in priority order:**

1. **Human audition loop (Loudon, Mac-side) — the gating check.** Generate a description through [[PDL Generation Prompt]], pick a candidate, emit it, load in Rack, confirm v0.2 sounds usable and the two-row layout matches muscle memory. Fixtures: `Shop/VCV Patch Generator/recipes/` (kick/pluck/warm_pad) and `…/t6-runs/` (9 verified candidates). *This is the next thing to actually do.*
2. **T10 — second-target registry.** The real test of the founding bet. A second target = a new registry + emitter, not a new architecture. Pure Data is lowest-risk; RNBO Codebox~ forces the "is the IR graph- or code-shaped?" question Loudon has vocabulary for.

**Two named, deferred gaps** (don't let them block T10): **polyphony** (`MIDI_CV` models one channel; VCV poly lives in the module `data` blob the emitter writes as `{}`) and a **registry param-count re-verification** (Rack's re-saved patches carry 8 VCO / 7 VCF param slots vs. the registry's 6 each — a web-fetch gave contradictory indices and was rejected; re-read the source, trust what Rack's bytes write).

**To resume:** read this entry, then `git log --oneline` for the 2026-05-29 commits (`T7b`→`T6`). The prompt, registries, renderer, and tests are the working set.

---

## The Three-Layer Architecture

This is the structural commitment of the project. Every decision below serves it.

**Layer 1 — Natural language (loose, must stay loose).** Metaphor, archetype, physical-instrument reference, feel. A direction, not a coordinate. The same description legitimately maps to many valid topologies.

**Layer 2 — PDL, Patch Description Language (target-agnostic IR).** Plain-text signal-flow graph: module instances, typed connections, parameters. PDL does not commit to a target.

**Layer 3 — Per-target registry (precise, target-specific).** Verified vocabulary: module identifiers, port indices, parameter ranges — verified against source code. One registry per target; the only piece that changes when a target is added.

**The translation flow:**

```
natural language  ──[prompt + perceptual index]──>  PDL
                                                     │
                                                     ├──[VCV registry]──> .vcv file
                                                     ├──[RNBO registry]──> codebox~ code
                                                     ├──[Max registry]──> .maxpat JSON
                                                     └──[… any target …]
```

The generation prompt produces PDL, not a target artifact. Target emission is a mechanical transform through a registry. This separation is load-bearing: the hard AI problem (description → architecture) is solved once; each new target is a day of schema work, not a re-engineering.

---

## Current State — What Is Built

### PDL Renderer (`PDL Renderer.html`)
A self-contained React-in-browser artifact. Open in any browser, no build step. Parses PDL with `@INSTANCE = ModuleType` declarations, connections, and parameter lines; resolves port signal types from an embedded VCV registry; auto-lays out modules by topological depth; renders cables color-coded by signal type; exports a loadable `.vcv` via `emitVcvJson()`.

### VCV Registry (`vcv_fundamental_registry.json`) — v2.4
Source-verified registry for **10 modules** across two plugins:
- **Fundamental (8):** VCO, VCF, ADSR, VCA, LFO, SEQ3, Mixer, VCMIXER
- **Core (2):** MIDI_CV (slug `MIDIToCVInterface`), AUDIO_8 (slug `AudioInterface`)

Fields per module: `slug`, `hp`, `inputs`/`outputs` with `name`, `type` (`audio`/`cv`/`gate`/`pitch`/`trigger`), `index`, `description`; `params` with `index`, name, range, default, unit; `perceptual_index`; `verification` (source file + date). Per-module `plugin` field lets Fundamental and Core coexist. Top-level `virtual_endpoints` defines the auto-bind rules (`KEYBOARD` → MIDI_CV, `OUT` → AUDIO_8).

**Critical:** the `verification` field is load-bearing. False claims compound into runtime bugs. Only mark verified what was confirmed by reading specific lines of named source files.

### PDL language (current grammar)
```
// comment
@INSTANCE = ModuleType                     // bind instance to registry module
ModuleA -> ModuleB                          // unnamed input (defaults to first input port)
ModuleA -> ModuleB:PortName                 // named input port
ModuleA:PortName -> ModuleB                 // named output port
ModuleA -> ModuleB:PortName [signaltype]    // explicit type override (escape hatch)
* ModuleName: Param = Value | Param = Value // parameters
```
Signal types: `audio` · `cv` · `gate` · `pitch` · `trigger`. Port-type resolution order: explicit bracket → registry input lookup → registry output lookup → `"default"` (gray).

### Closed task log

**T1–T4b, T12:** Emitter written; registry source-verified (catastrophic errors corrected: VCF input order, ADSR gate at index 4 not 0, VCA CV/IN reversed, LFO slug, SEQ3 slug + output order). `default_input`/`default_output` registry fields fix unnamed-port routing (`OSC -> FILT` → `OSC:SAW -> FILT:IN`, not `FILT:FREQ` CV; `KEYBOARD -> ENV` → `ENV:GATE`). Parse-time amber warnings panel surfaces silent regex rejection — always on, never blocks; good lines still render. Known residual edge: `@ = VCO` (empty instance ID) still matches the declaration regex; flagged. *Lesson: the fastest debug is making failures visible in the surface the user already edits.*

**First playable test (2026-04-20):** "house bass" produced end-to-end — PDL written, `.vcv` emitted from v2.2 registry via `build_house_bass.js`, loaded in Rack, confirmed voicing on first keypress. Files: `house_bass.pdl`, `house_bass.vcv`. The test had to bypass `emitVcvJson` and write `.vcv` directly because the emitter then zeroed all params — demonstrating exactly the gap T7a closes.

**T11:** Sound-ready patches. Added `plugin` field, MIDI_CV + AUDIO_8 Core entries (source-verified against `Rack v2/src/core/MIDI_CV.cpp` and `Audio.cpp`), `virtual_endpoints` map, and type-aware default port resolution — makes `KEYBOARD -> ENV:GATE` auto-resolve to `KEYBOARD:GATE` (not the default PITCH) without explicit port syntax. Emitter uses `mod.plugin || PLUGIN_SLUG` per module. Verified: 6 modules, 7 cables, 0 skipped, 0 warnings. *Lesson: put virtual endpoints in the registry, not the parser — T10's second target defines its own without touching the core.*

**SEQ3 reconciliation (v2.3 → v2.4):** STEPS param corrected from index 5 to index 3 in both `vcv_fundamental_registry.json` and the renderer's embedded `<script id="vcv-registry">` block; four post-2.0.0 outputs (STEPS_OUT, CLOCK_OUT, RUN_OUT, RESET_OUT at indices 12–15) synced into the embedded copy. Any prior `* SEQ3: STEPS = N` was silently writing the wrong knob. *Lesson: the embedded-block / on-disk-JSON pair is a standing drift risk — a param-index fix must land in both copies.*

**T7a phase 1 (2026-04-20):** Numeric param emission. `emitVcvJson` reads `*` lines, emits parsed numeric values or registry defaults. Non-finite-value branch left as a warning-emitting seam for phase 2. Registry-default fallback strictly more correct than the old zero stub (bare VCO now emits `PW=0.5, SYNC_MODE=1`). *Lesson: leaving a named seam turned the phase-2 feature into an intercept, not new machinery.*

**T7a phase 2 (2026-05-26):** Perceptual parameter vocabulary. Registry v2.3 adds `regions` (named perceptual sub-ranges), `curve`, and `aliases` to selected params on VCF, ADSR, VCO, LFO. `sampleRegion(spec, rawVal, pos?)` returns the midpoint of the named sub-range, clamped to native range — deterministic, byte-identical output. `pos` reserved for T7b's seeded resolver. Alias `CUTOFF` on VCF.FREQ (`* VCF: CUTOFF = dark` → canonical `FREQ`). Unknown regions warn and list available regions. 21/21 assertions. *Lesson: phase 1's non-finite warning branch paid out — phase 2 was an in-place rewire.*

**T7b (2026-05-29):** Archetype library + seeded resolver. `archetypes.json` (v0.1): 8 archetypes (`kick`, `sub_bass`, `warm_pad`, `pluck`, `bright_lead`, `acid_lead`, `stab`, `drone`). Each declares topology roles, parameter cloud in region names, optional `constraints` (`copy`/`offset`/`proportional`), `perceptual_index`. `# archetype: name {role=INST} #seed=N` PDL pragma drives `resolveArchetype`: samples via `archetypeHash(seed, archetype, instance, param)` — first caller of the reserved `pos` seam. Emit precedence: **`explicit * line > archetype param > registry default`**. Archetypes never inject modules; a missing required role warns and continues. 26/26 + 8/8 real-emitter assertions. *Lesson: the `pos` seam paid out exactly as predicted.*

**T7c (2026-05-29):** Archetype schema v0.2, driven by Loudon's first Rack audition. The v0.1 gap: structurally correct, audibly inert. Three moves: (1) **mixed param values** — region name (seed-sampled, expressive axis) or numeric literal (pinned, identity axis); (2) **modulation depth** — clouds now set attenuverter params (`VCF.FREQ_CV` ≈0.38 pluck / ≈0.03 pad); v0.1 set destination knobs but left depths at zero, so cabled modulation moved nothing; (3) **`recommended_cables`** — the emitter warns when an identity cable is absent, never injects it. Base oscillator FREQ pins to keyboard-tracking (0). `drone` keeps a FREQ region (unplayed exception); `sub_bass` pins −12. 36/36 + 12/12 + 21/21 (phase-2 regression). *Lesson: the audition was worth more than any in-sandbox test — "structurally correct + audibly inert" is invisible to the harness and obvious to the ear.*

Deferred from T7c (named for the next builder): **polyphony** (`MIDI_CV` models one channel; VCV poly lives in the `data` blob — does it live in registry, PDL, or archetype?); **registry param-count gap** (VCO/VCF have 8/7 slots in re-saved Rack patches vs. 6 in the registry; web-fetch rejected, re-read source); **curve-aware sampling explicitly NOT pursued** (VCV's time knobs are already log-mapped; the v0.1 "click" was region choice, not `sampleRegion`).

**T7d (2026-05-29):** Layout intelligence. `positions` block replaced by two-row placement from registry structure: row class from module shape (controller / audio / modulator), column from topological depth along registered cables. VCO→VCF→VCA→OUT falls out of the depth sort; ADSR/LFO/SEQ3 fall to row 1. No hardcoded module list. 18/18 layout harness; byte-deterministic. *Lesson: layout is a sibling to parameter intelligence — same knowledge-representation move: read the answer off registry structure so a new module lands in the right row for free.*

**T6 (2026-05-29):** [[PDL Generation Prompt]] — the left-to-right half. Self-contained system prompt: teaches a fresh model the PDL grammar, registry vocabulary (exact module keys and port names, not slugs), 8 archetypes (required roles + recommended cables), and virtual endpoints. Asks for 2–3 structurally distinct candidates. Verified with three real fresh-context Claude subagents (zero session memory); every candidate ran through the real `emitVcvJson` as oracle. A candidate passes at 0 warnings + 0 skipped + only-registry-modules + archetype-applied + recommended-cables-present + reaches-OUT. Round 1 caught two prompt gaps (slug-as-key: `VCA-1`/`VCMixer`; mis-cased port `Out`). Round 2: **9/9 clean candidates across 3 descriptions**. Fixtures: `Shop/VCV Patch Generator/t6-runs/`. *Lesson: grounding makes fresh agents emit precise artifacts — but only once the prompt names the exact tokens; "obey the registry JSON" wasn't enough. The emitter-as-oracle test caught it; self-grading would have shipped the slug bug.*

### What still does NOT exist
- **T8** — perceptual-index wiring in the renderer UI
- **T10** — any second-target registry (no RNBO, Max, PD, WebAudio registries yet)
- **Polyphony** — unrepresented axis; scope before building

---

## Parameter Intelligence — The Recurring Pattern

Signal flow answers *what connects to what*. Parameter setting answers *what does it sound like*. Conflating them produces patches that are structurally correct and audibly inert — filter cutoffs at center, every preset wearing the same neutral face.

The hard asymmetry: signal flow has a syntactic floor (a cable either exists or doesn't; the emitter can verify legality before sound). Parameters have no such floor — every in-range number is legal. The constraint is *perceptual plausibility*, which lives in a domain the registry doesn't model by default.

**The recurring pattern.** The hard problems in this project keep turning out to be knowledge-representation problems, not encoding problems — figuring out what shape of structured knowledge the registry must carry so the generator can stay dumb. Port types (T4), virtual endpoints (T11), perceptual regions (T7a), archetypes (T7b) — all the same move: *push musical intelligence into the static data layer so the generation layer doesn't reinvent it each call.*

**Three layers of parameter knowledge, in increasing difficulty:**

1. *Per-module perceptual regions* — named sub-ranges alongside numeric range (`CUTOFF: {closed: [0, 0.15], dark: [0.15, 0.4], open: [0.4, 0.75], bright: [0.75, 1.0]}`). The same move as type-aware port resolution: make the registry richer so the generator speaks in higher-level terms. **Done** in T7a phase 2.
2. *Archetype-to-cloud mapping* — constraint bundles across modules, keyed by musical identity. A kick drum is not "VCO+VCA with fast decay"; it is the specific co-dependency that pitch-decay matches amp-decay, VCO set low, no audio-rate FM. An archetype registry is essentially typed links between modules weighted by musical co-dependency — the palace's link ontology showing up inside the pipeline. **Done** in T7b/c.
3. *Contextual constraint propagation* — when an archetype is chosen, its cloud propagates outward through the signal graph (a delay's feedback wants to complement a pluck, not a pad). This is where musicality actually lives; the hardest layer. **Not yet built.**

**One-to-many on parameters.** One archetype ("warm pad") produces a *distribution* of parameter sets, not a fixed one. Generation samples from that distribution, seeded. The archetype constrains the region; the seed picks the point. Without archetypes, cross-target portability is only "the cables match" — architecturally clean, audibly meaningless. **Done** in T7b.

**Execution order:** human audition loop → T10. With T7b done, T6 re-derives as *description → archetype + topology hints*, not *description → full PDL*. T10 becomes the first real test of cross-target archetype portability.

---

## Roadmap

### T8 — Wire the perceptual index into the renderer
**Priority:** medium.

Search input in the `RegistryPanel` sidebar. As the user types, binary-highlight registry modules whose `perceptual_index` contains any of the typed words (case-insensitive). No ranking, no embeddings.

**Success criteria:** "bright" highlights VCO and VCF; "breathing" highlights LFO and ADSR; "kick" highlights nothing (diagnostic — index needs percussive coverage).

---

### T9 — Split PDL into its own palace entry
**Priority:** low. Create `PDL Spec.md`; move the grammar, signal-type list, resolution order, and syntax examples there. Link from here via `spawned: "[[PDL Spec]]"`.

---

### T10 — Second-target pilot
**Priority:** future. Do not start until Stage 1 (T1·T3·T4·T4b·T6·T7·T11) is fully audibly closed.

Candidates in leverage order:
- **RNBO Codebox~** — Loudon has deep vocabulary; export multiplies to Ableton/VST/AU/web. Open structural question: does the registry abstraction (graph-topological) generalize to a code-emitting target, or does a functional IR appear as a sibling to PDL?
- **Pure Data** — closest structural cousin to VCV; lowest-risk second target
- **Max/MSP** — JSON-based patcher; similar shape to `.vcv`
- **WebAudio API** — forces the RNBO structural question early

**Success criteria for Stage 2:** the same PDL spec that produces a VCV patch also produces a working artifact in the second target. Discipline: do not split attention across targets before one is proven.

---

## Notes for Future Claude Instances

- **PDL is target-agnostic on purpose.** Target specifics live in registries and emitters — never in the PDL grammar.
- **The registry is the reliability surface.** An unverified entry is a liability. Mark nothing verified without naming the source file, the date, and having actually read the lines. The v2.0 audit found guessed entries — and one lie cascaded into a screen of mis-routed cables on first load.
- **Silent regex rejection is the first hypothesis.** When something "doesn't work" — modules missing, cables wrong — check the amber warnings panel before suspecting the registry. The 2026-04-19 load looked like a registry bug for several minutes; it was a regex bug.
- **"Topology works" ≠ "patch makes sound."** The emitter can produce a structurally perfect `.vcv` that is silent because no MIDI-CV or audio-out is wired in. Declare a patch done when a key press makes noise.
- **The embedded-block / on-disk-JSON pair drifts.** Any param-index fix must land in both `vcv_fundamental_registry.json` and the `<script id="vcv-registry">` block inside `PDL Renderer.html`.
- **Dialogue before palace schema changes.** Adding a new link type, entry type, or ceremony requires discussion with Loudon — never a solo commit.
- **Read `CLAUDE.md` in the palace root first.** Strong conventions apply: typed links, ceremonies, no schema-change without discussion.