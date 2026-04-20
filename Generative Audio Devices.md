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
  - target: "[[Four Pillars]]"
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
forward_vector: "The larger goal is a generalizable pipeline: natural language → a target-agnostic signal-flow IR (PDL) → any modular/DSP target via a per-target registry. VCV Rack is the first test case, not the destination. As of 2026-04-19 the registry is at v2.1: all 8 modules source-verified against Fundamental v2 .cpp files (v2.0), plus optional default_input/default_output fields (v2.1) so unnamed-port resolution prefers the conceptually-right port over the lowest-index one. Topologically, the emitter is confirmed working. The remaining gate to T1 closure is **audible** playback, which requires either manually adding Core MIDI-CV + Audio-8 in Rack, or implementing T11 (registry entries + virtual KEYBOARD/OUT mapping) to make patches sound-ready out of the gate. Still open: T12 (parse-time diagnostics — the renderer should warn when it drops a line, not fail silently), T6 (generation prompt), T7 (parameter emission), T8 (perceptual-index UI), T10 (second target)."
---

# Generative Audio Devices

A Four Pillars project: **AI-generated modular audio architectures from natural-language descriptions, across any target environment.** The pipeline reads a human description of a sound or instrument and emits a loadable artifact — a VCV Rack patch, RNBO DSP code, a Max/MSP patcher, a Pure Data file, a WebAudio graph — whatever target has a registered vocabulary.

The central bet: with a curated, verified component vocabulary per target as grounding, LLM generation of precise technical artifacts becomes reliable enough to use. Without the grounding, the model hallucinates port names, module slugs, parameter IDs. With it, generation is structurally constrained to what is actually possible. VCV Rack is the current test case — visually inspectable, fast to load, small verifiable module set. Once the pipeline closes end-to-end on VCV, each additional target is a new registry and emitter, not a new architecture. The generalizable concept is distilled in [[Registry Pattern]].

---

## The Three-Layer Architecture

This is the structural commitment of the project. Every decision below serves it.

**Layer 1 — Natural language (loose, must stay loose).** Metaphor, archetype, physical-instrument reference, feel description, genre context. A point in a multidimensional latent space — a direction, not a coordinate. The same description legitimately maps to many valid topologies.

**Layer 2 — PDL, Patch Description Language (target-agnostic intermediate representation).** A plain-text signal-flow graph: module instances, typed connections, parameters. PDL does not commit to a target. It is the *lingua franca* that survives the round-trip from left to right.

**Layer 3 — Per-target registry (precise, target-specific).** A verified vocabulary: module identifiers, port indices, parameter ranges, connection rules, verified against source code. One registry per target. The registry is the only piece that changes when a new target is added.

**The translation flow:**

```
natural language  ──[prompt + perceptual index]──>  PDL
                                                     │
                                                     ├──[VCV registry]──> .vcv file
                                                     ├──[RNBO registry]──> codebox~ code
                                                     ├──[Max registry]──> .maxpat JSON
                                                     └──[… any target …]
```

The generation prompt produces PDL, not a target artifact. Target emission is a mechanical transform through a registry. This separation is load-bearing: the hard AI problem (description → architecture) is solved once, and each new target is a day of schema work rather than a re-engineering of the pipeline.

---

## Description Architecture — The Generation-Side Moves

These are the moves the generation prompt (T6) must encode.

**One-to-many mapping.** The AI reads the human description and proposes *multiple* valid PDL topologies — a subtractive answer, an FM answer, a wavetable answer, a granular answer. All coherent. All honoring the description. The human selects based on context. The pipeline never tries to find *the* answer — it proposes *a set* of answers.

**The perceptual index.** Each module in the registry carries a cloud of human language that tends to summon it — the bridge between the loose left side and the precise right side. An LFO entry knows that "slowly evolving," "breathing," "wobble," and "drift" are its latent neighbors. A noise oscillator knows "breath," "texture," "air." Not a lookup table; a semantic proximity map that lets the prompt navigate from description to topology without requiring the human to be technical.

**Constraint propagation.** A synthesizer description naturally moves from high-leverage early decisions (musical role, voicing, envelope architecture, physical-instrument reference) toward lower-leverage aesthetic ones (exact cutoff, LFO shape). "Kick drum" resolves most downstream choices automatically. Not formalized — it is the expert human's internal process.

---

## Current State — What Is Built

### PDL Renderer (`PDL Renderer.html`)
A self-contained React-in-browser artifact. Open in any browser, no build step. It:
- Parses PDL with `@INSTANCE = ModuleType` declarations, connections, and parameter lines
- Resolves port signal types from an embedded VCV Fundamental registry
- Auto-lays out modules by topological depth
- Derives input ports from connections (ports are never declared separately)
- Visually distinguishes registered modules (brighter header + `ModuleType · Nhp` badge)
- Renders cables color-coded by signal type
- Exports a loadable `.vcv` file via `emitVcvJson()` + "Export .vcv" button

### VCV Registry (`vcv_fundamental_registry.json`) — **v2.0 as of 2026-04-19**
Source-verified registry for **8 modules** from VCV Fundamental: VCO, VCF, ADSR, VCA, LFO, SEQ3, Mixer, VCMIXER. Every entry is verified against the corresponding `.cpp` file in the Fundamental v2 plugin (verification dates and source-file references stored in each entry's `verification` field).

Fields per module: `slug`, `hp`, `inputs` / `outputs` with `name`, `type` (`audio` / `cv` / `gate` / `pitch` / `trigger`), `index`, `description`; `params` with `index`, name, range, default, unit, description; `perceptual_index` — the human-language cloud that summons this module; `verification` — source file and date.

**Lesson (from the v2.0 audit):** the `verification` field is load-bearing. False claims of verification compound into runtime bugs. Only mark verified what was confirmed by reading specific lines of named source files.

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

### Done recently
- **T1** — `.vcv` JSON emitter written and structurally confirmed (topology correct, cables land on correct ports). **Audible playback still pending** — patches currently require manual addition of Core MIDI-CV + Audio-8 inside Rack. T11 closes this gate.
- **T2** — unified registry. The inline JS `REGISTRY` object is gone; a single `<script type="application/json" id="vcv-registry">` block is the embedded source. `vcv_fundamental_registry.json` is the canonical file on disk; keep in sync with the inline block until a build step replaces it.
- **T3** — unnamed-port default resolution. `A -> VCO` resolves to the first input port of the bound module type. Port names normalized so parser, renderer, and emitter agree.
- **T4** — registry source-verification. All 8 modules verified against Fundamental v2 `.cpp` files. Corrected catastrophic errors: VCF input order, ADSR gate at index 4 (not 0), VCA CV/IN reversed, LFO slug + missing inputs, SEQ3 slug + output order, Mixer vs VCMIXER distinction.
- **T4b (2026-04-19)** — registry v2.1 adds optional `default_input` / `default_output` fields per module. `parsePDL` prefers these over "first port" when filling in null ports on registered instances. Unnamed connections now route to the conceptually correct port even when the first port is a CV modulation input:
  - `OSC -> FILT` → `OSC:SAW -> FILT:IN` (was `FILT:FREQ` CV)
  - `KEYBOARD -> ENV` → `ENV:GATE` (was `ENV:A_CV`)
  - `OSC -> VCMIXER` → `VCMIXER:IN1` at index 5 (was `VCMIXER:MIX_CV` at index 0)
  - `SEQ -> OSC` → `SEQ:CV1 -> OSC:V/OCT` (was `SEQ:TRIG` master trigger)
  Explicit `:Port` syntax continues to win over defaults. Default spec emits identical cables to pre-T4b (no regression). VCA default_input = "IN" (audio); modulation targets like `ENV -> AMP:CV` remain explicit — per-source signal-type-aware routing is out of T4b scope.
- **Parser comment-strip fix** (no task number, 2026-04-19). `@INSTANCE = ADSR  // comment` lines were silently rejected. Trailing `// comment` is now stripped before per-line parsing. **Lesson — see T12.**

### What still does NOT exist
- **Empirical confirmation of audible playback** (gated on manual wiring in Rack or T11)
- **T11** — Core MIDI-CV + Audio-8 registry entries + virtual KEYBOARD/OUT mapping
- **T12** — parse-time diagnostics (warn on dropped lines instead of failing silently)
- **T6** — generation prompt (left-to-right half of the pipeline)
- **T7** — parameter values in exported patches
- **T8** — perceptual-index wiring in the renderer UI
- **T10** — any second-target registry (no RNBO, Max, PD, WebAudio registries yet)

---

## Roadmap

Each open task is self-contained enough for a fresh Claude instance to execute without this session's context. Tasks are listed in execution order — later tasks depend on earlier ones unless stated.

### T5 — Delete the stale `PDL Renderer.jsx`
**Priority:** trivial cleanup.

Delete `PDL Renderer.jsx`. It is the pre-registry version and has drifted from the HTML (no `@instance` binding, no registry integration, can't parse `/` in port names). Technical debt that misleads readers.

**Success criteria:** file deleted, no palace references remain.

---

### T11 — Make exported patches sound-ready (Core MIDI-CV + Audio-8)
**Priority:** high — closes T1's audible-playback gate. Without it, every test load requires manual wiring inside Rack to hear anything.

**Preconditions:** T1 (emitter works) and T4 (registry source-verified) are complete.

**Files to read first:**
- VCV Rack Core modules documentation or source for `MIDI_CV` and `Audio_8` (these are in the **Core** plugin, not Fundamental — the registry will need a `plugin` field)
- `vcv_fundamental_registry.json` — current entries all live under the implicit Fundamental plugin
- `PDL Renderer.html` — `emitVcvJson` and the unregistered-endpoint skip logic

**What to build:**
1. Add a `plugin` field to each registry entry (default `"Fundamental"`).
2. Add `MIDI_CV` and `AUDIO_8` (or `AUDIO_2`) entries under `plugin: "Core"`. Source-verify their port indices.
3. Map virtual PDL endpoints `KEYBOARD` → `MIDI_CV` and `OUT` → `AUDIO_*`. Options:
   - **A (implicit):** auto-inject these modules when PDL references `KEYBOARD` or `OUT`; rewrite cables to the injected instances. Recommended.
   - **B (explicit):** require `@MIDI = MIDI_CV` and `@DAC = AUDIO_8` in PDL. More honest but more verbose.
4. The emitter's "skipped endpoints" UI should report zero in the common case.

**Success criteria:**
- Exported .vcv loads in Rack and **plays sound when notes are sent in via MIDI**, no manual module additions.
- Round-trip: paste default PDL → export → load → press a key → hear it.

**Out of scope:** other Core modules (Notes, Blank, etc.).

---

### T12 — Parse-time diagnostics: warn on dropped lines
**Priority:** medium — small task, large debuggability win. Do **before** T6, because prompt iteration will produce malformed PDL constantly and silent dropouts will waste hours.

**Background.** The 2026-04-19 comment-strip bug bit because the `@INSTANCE` regex silently rejected three of eight declarations; no on-screen indication. Silent regex rejection is a footgun the pipeline must outgrow.

**Files to read first:**
- `PDL Renderer.html` — the per-line parsing loop in `parsePDL`
- The sidebar `RegistryPanel` component

**What to build:**
1. In `parsePDL`, every non-empty, non-comment line that does not match any recognized shape records `{ lineNumber, content, reason }` into a `warnings` array on the parsed result.
2. Render warnings in the sidebar in a yellow/amber panel: "3 lines were not recognized" with each line's number and content. Do not block rendering.
3. Same warnings in `emitVcvJson`: list unregistered module types referenced or cables dropped for port-resolution failure.
4. Optional: "strict mode" toggle that turns warnings into hard errors.

**Success criteria:**
- `@FENV = ADSR  // a comment` + usage of FENV produces no warnings (comment-strip is upstream).
- Typo `@VCO1 = VCOO` produces a visible warning naming the line with `"unknown module type: VCOO"`.
- The default PDL spec produces zero warnings.

**Out of scope:** auto-fix suggestions, fuzzy matching.

---

### T6 — Write the generation prompt (close the left-to-right half)
**Priority:** high — the other half of the pipeline.

**Preconditions:** T2, T3, T4b, T12 help. Not blocking.

**Files to read first:**
- This file — three-layer architecture and perceptual index sections
- `vcv_fundamental_registry.json` — full vocabulary including `perceptual_index` per module
- `PDL Renderer.html` — PDL grammar (default spec and syntax reference panel)

**What to build:** new palace entry `PDL Generation Prompt.md`, containing:
- System-prompt template that injects the registry and perceptual index, teaches the model the PDL grammar, and instructs it to produce 3 valid PDL candidates per description (subtractive, FM, wavetable — or whatever 3 the model judges most fitting)
- User-prompt template taking a natural-language description
- 3 worked examples: "bright pluck", "kick drum", "slowly evolving pad" — each showing a description and a plausible PDL output

**Success criteria:**
- Pasted into a fresh Claude instance alongside the registry JSON, produces PDL that parses in `PDL Renderer.html` without errors
- Each example produces at least 2 structurally distinct topologies
- No hallucinated module types (only registry modules appear)

---

### T7 — Extend the `.vcv` emitter to write parameter values
**Priority:** medium — completes patch expressivity.

**Preconditions:** T1 complete.

**Files to read first:**
- `PDL Renderer.html` — `parsePDL` returns a `params` map
- `vcv_fundamental_registry.json` — `params` arrays with `range` and `unit`
- Sample `.vcv` file — how parameter values are stored per module

**What to change:**
- In the emitter from T1, include per-module parameter arrays
- For each `*` line (e.g. `* FILT: Cutoff = 2000Hz | Resonance = 20%`), look up the param name in the registry, map the human-readable value to the normalized range using `unit`, emit the numeric value VCV expects

**Success criteria:** exported .vcv loads with the described parameter values (filter cutoff audibly at 2kHz, etc.)

**Out of scope:** modulation, automation lanes.

---

### T8 — Wire the perceptual index into the renderer
**Priority:** medium — makes the bridge visible and debuggable.

**Preconditions:** T2.

**Files to read first:**
- `vcv_fundamental_registry.json` — `perceptual_index` arrays per module
- `PDL Renderer.html` — sidebar `RegistryPanel` component

**What to build:**
- Search input in the sidebar: "describe it"
- As the user types, highlight registry modules whose `perceptual_index` contains any of the typed words (case-insensitive). No ranking — binary highlight.

**Success criteria:**
- "bright" highlights VCO and VCF
- "breathing" highlights LFO and ADSR
- "kick" highlights nothing (diagnostic — tells Loudon the index needs more coverage for percussive archetypes)

**Out of scope:** semantic similarity, embeddings.

---

### T9 — Split the PDL language into its own palace entry
**Priority:** low — project hygiene.

Create `PDL Spec.md` as a dedicated entry. Move PDL grammar, signal-type list, resolution order, syntax examples out of this file into that one. Link from here via `spawned: "[[PDL Spec]]"`. Keep a short pointer paragraph here.

**Success criteria:** PDL-the-language has its own palace entry; this entry stays focused on *the project*, not the language spec.

---

### T10 — Second-target pilot (deferred until Stage 1 is fully closed)
**Priority:** future. Do not start until T1 (audibly closed via T11), T3, T4, T4b, T6, T7 are complete.

With Stage 1 working end-to-end and the three-layer architecture validated on one target, pick a second target. Candidates in rough order of leverage:
- **RNBO Codebox~** — Loudon already has deep vocabulary; export multiplies to Ableton/VST/AU/web. Open structural question: does the registry abstraction (graph-topological) generalize to targets where output is *code* rather than a graph? Or does a functional IR (input → process → output) appear sibling to PDL?
- **Pure Data** — closest structural cousin to VCV; lowest-risk second target
- **Max/MSP** — JSON-based patcher format; similar shape to `.vcv`
- **WebAudio API** — code-generation target; forces the RNBO structural question early

**Success criteria for Stage 2:** the same PDL spec that produces a VCV patch also produces a working artifact in the second target, demonstrating target-agnostic PDL.

Discipline: do not split attention across targets before one is proven.

---

## Notes for Future Claude Instances Working on This Project

- **Read `CLAUDE.md` in the palace root first.** The palace has strong conventions (typed links, ceremonies, no schema-change without discussion).
- **Dialogue before writing schema changes.** Adding a new link type, entry type, or ceremony requires discussion with Loudon, not a solo commit.
- **PDL is target-agnostic on purpose.** If tempted to add VCV-specific syntax to the language, stop. Target specifics live in registries and emitters.
- **The registry is the reliability surface.** An unverified entry is a liability, not a caveat. When adding modules, verify against source before committing. The v2.0 audit found entries previously claiming `"verified"` had actually been guessed — and that one lie cascaded into a screen of mis-routed cables on the first real test load. If you mark something verified, name the source file and date, and have actually read the lines.
- **Silent regex rejection is a footgun.** When something "doesn't work" — modules missing, cables wrong — the first hypothesis is *not* "the registry is wrong." The first hypothesis is *"the parser silently dropped a line."* The 2026-04-19 load looked like a registry bug for several minutes; it was a regex bug. Build diagnostics (T12) so this kind of failure is loud, not silent.
- **Stage 2+ is target-agnostic.** The second target should be chosen after Stage 1 closes, based on what best tests the three-layer architecture (likely: a code-emitting target).
- **"Topology works" ≠ "patch makes sound."** The emitter can produce a structurally perfect .vcv that is silent in Rack because no MIDI-CV or audio-out is wired in. This is the gap T11 closes. Do not declare T1 done because the patch loaded — declare it done when a key press makes a noise.
- **Depth over coverage.** Name the specific reason for a choice — the actual tradeoff — not a label that stands in for one.
