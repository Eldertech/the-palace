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
forward_vector: "The larger goal is a generalizable pipeline: natural language → a target-agnostic signal-flow IR (PDL) → any modular/DSP target via a per-target registry. VCV Rack is the first test case, not the destination. As of 2026-04-19 the registry is at v2.0: all 8 modules (the original 7 plus VCMIXER) are source-verified against Fundamental v2 .cpp files. The first empirical .vcv load exposed catastrophic port-routing errors that v2.0 corrects (cables that landed on cutoff CV instead of audio inputs). A second load surfaced a parser bug — the @declaration regex silently rejected lines with trailing `// comments`, dropping modules from the patch. That parser is now patched. Topologically, the emitter is confirmed working. The remaining gate to T1 closure is **audible** playback, which requires either manually adding Core MIDI-CV + Audio-8 in Rack, or implementing T11 (registry entries + virtual KEYBOARD/OUT mapping) to make patches sound-ready out of the gate. New work surfaced: T4b (default_input/default_output fields so unnamed-port resolution doesn't land on CV inputs of modules whose first port is now CV), T12 (parse-time diagnostics — the renderer should warn when it drops a line, not fail silently). After audible playback is confirmed: T6 (generation prompt) and T7 (parameter emission) close the end-to-end loop."
---

# Generative Audio Devices

A Four Pillars project: **AI-generated modular audio architectures from natural-language descriptions, across any target environment.** The pipeline reads a human description of a sound or instrument and emits a loadable artifact — a VCV Rack patch, RNBO DSP code, a Max/MSP patcher, a Pure Data file, a WebAudio graph — whatever target has a registered vocabulary.

The central bet: with a curated, verified component vocabulary per target as grounding, LLM generation of precise technical artifacts becomes reliable enough to use. Without the grounding, the model hallucinates port names, module slugs, parameter IDs. With it, generation is structurally constrained to what is actually possible.

VCV Rack is the current test case because it is visually inspectable, loads fast, and has a small, well-defined module set we can verify against source. Once the pipeline closes end-to-end on VCV, each additional target is an incremental extension — a new registry, a new emitter — not a new architecture.

---

## The Three-Layer Architecture

This is the structural commitment of the project. Every decision below serves it.

**Layer 1 — Natural language (loose, must stay loose).** Metaphor, archetype, physical-instrument reference, feel description, genre context. A point in a multidimensional latent space — a direction, not a coordinate. The same description legitimately maps to many valid topologies.

**Layer 2 — PDL, Patch Description Language (target-agnostic intermediate representation).** A plain-text signal-flow graph: module instances, typed connections, parameters. PDL does not commit to a target. It is the *lingua franca* that survives the round-trip from left to right. The same PDL spec should produce a VCV patch, an RNBO graph, or any other target that has a registered vocabulary covering its modules.

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

The generation prompt produces PDL, not a target artifact. Target emission is a mechanical transform through a registry. This separation is load-bearing: it means the hard AI problem (description → architecture) is solved once, and each new target is a day of schema work rather than a re-engineering of the pipeline.

---

## Why This Matters — The Deeper Project

The prize is not VCV patches. The prize is demonstrating that **LLMs can generate precise technical artifacts across arbitrary structured domains, provided the domain vocabulary is made first-class.** The Registry Pattern (see [[Registry Pattern]]) is the distilled concept. This project is its first proving ground in the audio/modular domain.

If the pattern holds here — natural language → target-agnostic IR → multiple concrete targets — the same shape applies to UI component generation, scene graphs, music notation, any structured creative domain where a verified schema governs legal outputs.

The Four Pillars framing:

- **Creation (Music):** each stage produces a playable, listenable instrument
- **Tools (Technology):** the pipeline, registries, and PDL are the tool-building layer
- **Philosophy:** what does it mean to describe an instrument precisely enough for another mind to build it? The registry is an ontology — a formal vocabulary for a creative domain
- **Practice:** each stage is a repeatable, teachable workflow

---

## Description Architecture — The Loose/Precise Split

**The translation move:** the AI reads the human description and proposes *multiple* valid PDL topologies — a subtractive answer, an FM answer, a wavetable answer, a granular answer. All coherent. All honoring the description. The human selects based on context: target environment, desired complexity, synthesis paradigm preference, what they want to learn.

This one-to-many mapping is the key move. The description does not need to be more specific because the selection step is where contextual judgment enters. The generation pipeline never tries to find *the* answer — it proposes *a set* of answers.

**The perceptual index:** each module in the registry carries a cloud of human language that tends to summon it — the bridge between the loose left side and the precise right side. An LFO entry knows that "slowly evolving," "breathing," "wobble," and "drift" are its latent neighbors. A noise oscillator knows "breath," "texture," "air." This is not a lookup table; it is a semantic proximity map that lets the prompt navigate from description to topology without requiring the human to be technical.

**Constraint propagation in description:** a synthesizer description naturally moves from high-leverage early decisions (musical role, voicing, envelope architecture, physical-instrument reference, attack character) toward lower-leverage aesthetic ones (exact filter cutoff, LFO shape, envelope curve feel). Early decisions carry enormous constraint force — "kick drum" resolves most downstream choices automatically. The system does not formalize this funnel; it is the expert human's internal process, not a schema to be filled out.

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

Resolver-chain bug fixed: resolvers return `null` on miss, `"default"` only appears at the final fallback position, so the chain no longer short-circuits on truthy `"default"`.

### VCV Registry (`vcv_fundamental_registry.json`) — **v2.0 as of 2026-04-19**
A structured JSON registry for **8 modules** from VCV Fundamental: VCO, VCF, ADSR, VCA, LFO, SEQ3, Mixer, **VCMIXER** (added in v2.0 because Mixer has only one master Level — VCMIXER is the right module for per-channel level control). Every entry is now **source-verified** against the corresponding `.cpp` file in the Fundamental v2 plugin (verification dates and source-file references are stored in each entry's `verification` field).

Fields per module:
- `slug` (exact VCV Rack module identifier — note: registry keys are PDL-friendly names like `VCA` and `MIXER`; the inner `slug` field carries the actual VCV identifier like `VCA-1` and `Mixer`)
- `hp` (panel width)
- `inputs` / `outputs` with `name`, `type` (one of `audio`, `cv`, `gate`, `pitch`, `trigger`), `index`, `description`
- `params` with `index`, name, range, default, unit, description
- `perceptual_index` — the human-language cloud that summons this module
- `verification` — names the source file and verification date (e.g. `"verified against src/VCO.cpp (2026-04-19)"`)

**The v2.0 audit corrected a substantial number of incorrect indices in v1.0** — see T4 below for the damage report. Lesson: the `verification` field is now load-bearing, and false claims of verification compound into runtime bugs.

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

### Recently completed (code written; topology verified; audible playback still pending)
- **T1 — `.vcv` JSON emitter** (in `PDL Renderer.html`). The `emitVcvJson()` function transforms a parsed PDL spec + registry into a VCV Rack patch JSON object with modules and cables. An "Export .vcv" button in the editor sidebar triggers a browser download. Unregistered endpoints (KEYBOARD, OUT) are skipped with an on-screen list. **Status:** the file loads in VCV Rack 2.x and the topology is structurally correct after T4. The remaining gate is **audible playback** — patches require manual addition of Core MIDI-CV + Audio-8 modules in Rack to make sound, until T11 ships.
- **T2 — unified registry.** The inline JS `REGISTRY` object in the HTML is gone. A single inline `<script type="application/json" id="vcv-registry">` block at the top of the body is the source; the babel script bootstraps `REGISTRY` from it. `vcv_fundamental_registry.json` remains the canonical file on disk and must be kept in sync with the inline block (future improvement: a build step, or switch to `fetch()` once the file is served).
- **T3 — unnamed-port default fix.** Connections like `A -> VCO` now resolve to the first input port of the registered module type instead of looking up a nonexistent "IN". Port names are normalized and written back into the connection object so parser, renderer, and emitter all see the same resolved names. **Note:** after the T4 v2.0 audit, "first input port" sometimes lands on a CV input (e.g. VCF:FREQ, VCA:CV), which is technically correct but rarely what the human meant. T4b addresses this.
- **T4 — registry source-verification.** All 8 modules in v2.0 are verified against the Fundamental v2 `.cpp` source. See full damage report under T4 below.
- **Parser comment-strip fix (no task number — surfaced and fixed during the second test load on 2026-04-19).** The `@INSTANCE = ModuleType` regex required the line to end immediately after the type, so any `@FENV = ADSR  // filter envelope` line was silently rejected. Three modules were dropped from the test patch this way. Fix: strip trailing `// comment` from every line before per-line parsing. Verified with a Node smoke test that all 8 instances in the two-osc patch now register. **Lesson — see T12.**

### What still does NOT exist
- **Empirical confirmation of audible playback.** The .vcv loads with the correct topology, but no patch has yet been heard play notes through the speakers. This is the real T1 success criterion and is gated on either manually adding Core MIDI-CV + Audio-8 in Rack or shipping T11.
- **T4b** — `default_input` / `default_output` fields in the registry so unnamed-port resolution doesn't blindly land on the first port (which is now a CV input on several modules).
- **T11** — Core MIDI-CV + Audio-8 registry entries plus a virtual KEYBOARD/OUT mapping, so emitted patches are sound-ready out of the gate.
- **T12** — parse-time diagnostics. The renderer should warn (visibly) when it drops a line during parsing rather than failing silently. The comment-strip bug bit precisely because the parser silently dropped three of eight modules with no UI indication.
- A generation prompt (the right-to-left half is implemented; the left-to-right half is not yet a palace artifact) — T6
- Parameter values in exported patches — T7
- Perceptual-index wiring in the renderer UI — T8
- Any second-target registry (no RNBO, Max, PD, WebAudio registries yet) — T10

---

## Roadmap

This roadmap is structured so each task is **self-contained enough for a fresh Claude instance to execute without this session's context.** Each task names its preconditions, the files to read first, the change to make, and the success criteria. Tasks are listed in execution order — later tasks depend on earlier ones unless stated otherwise.

### T1 — Close Stage 1: build the `.vcv` JSON emitter  [TOPOLOGY CONFIRMED — AUDIBLE PLAYBACK PENDING]
**Priority:** the single highest-leverage task. Completes Stage 1.

**Status (2026-04-19):** The emitter is written (`emitVcvJson` in `PDL Renderer.html`) and the Export button works. Two empirical test loads have happened:
1. **First load** — exposed catastrophic port-routing errors (cables landed on CV inputs instead of audio inputs because the registry indices were guessed). Fixed by T4 (registry rewrite to v2.0 with all 8 modules source-verified).
2. **Second load** — the file loaded but only 5 of 8 modules appeared. Root cause was a parser bug: any `@INSTANCE = ModuleType` line with a trailing `// comment` was silently rejected. Fixed by stripping `//` comments before per-line parsing.

**The structural emitter is now confirmed working** — cables route to the correct ports of the correct modules. The remaining gate is **audible** playback. The emitter intentionally skips cables to/from virtual endpoints (`KEYBOARD`, `OUT`); to hear sound today the human must manually add Core MIDI-CV and Audio-8 modules in Rack and patch them in. T11 below would automate that.

**Preconditions:** PDL Renderer parses specs and resolves types correctly (already true).

**Files to read first:**
- `PDL Renderer.html` — understand `parsePDL`, `instanceTypes`, and the resolved `connections` array
- `vcv_fundamental_registry.json` — slugs and port indices are here
- A real `.vcv` file exported from VCV Rack 2.x for schema reference (the implementer must obtain one; the CLAUDE doing this task should ask Loudon for a sample or read the VCV Rack documentation)

**What to build:**
1. A function `emitVcvJson(pdl, registry)` that:
   - Parses the PDL spec (reuse the existing parser)
   - Assigns each instance a stable integer `id` (sequential)
   - For each instance, looks up `registry[instanceType]` to get `slug` and `hp`
   - Computes `pos[0]` (x in HP units, packed left-to-right by HP width with row wrapping at some max width, e.g. 120 HP) and `pos[1]` (row index)
   - For each connection, looks up source output `index` and destination input `index` in the registry and emits a cable entry
   - Produces a JSON object matching VCV Rack's patch file schema (plugin = "Fundamental", module list, cable list)
2. An "Export .vcv" button in the renderer sidebar that triggers the emitter and downloads the result as `patch.vcv`.

**Success criteria:**
- A PDL spec of the classic subtractive voice (see the default spec in `PDL Renderer.html`) exports a `.vcv` file
- That file opens in VCV Rack 2.x
- The patch has the correct modules with correct cables and is audible when played

**Out of scope:** parameter values inside `.vcv` (defer to T7), patch cable colors, module customizations. Minimum viable emitter only — topology and positions, nothing else.

---

### T2 — Unify the registry (single source of truth)  [DONE]
**Priority:** small cleanup, unblocks several later tasks.

**Status:** The inline JS `REGISTRY` object has been removed from `PDL Renderer.html`. A `<script type="application/json" id="vcv-registry">` block is now the single embedded source; the babel script bootstraps `REGISTRY` from it. `vcv_fundamental_registry.json` remains the canonical file on disk. Keep the two in sync until a build step or `fetch()` mechanism replaces the inline block.

**Preconditions:** none. Can be done in parallel with T1.

**Files to read first:**
- `PDL Renderer.html` — see the inline `REGISTRY` object (lines ~27–123) and `buildRegistryLookup`
- `vcv_fundamental_registry.json` — the full registry

**What to change:**
- Remove the duplicated inline `REGISTRY` object in `PDL Renderer.html`
- Replace it with either: (a) an inline `<script type="application/json" id="vcv-registry">…</script>` block that contains the full JSON file pasted in, and a small JS bootstrap that reads and parses it into `window.REGISTRY`; or (b) an HTTP `fetch` if the file will be served alongside. Prefer (a) — the HTML must continue to work as a file:// open with no server.
- Adapt `buildRegistryLookup` to read from the new source. Keep all existing behavior identical.

**Success criteria:**
- The renderer opens and behaves identically to before
- The default patch still renders with correct colors and registry badges
- The HTML no longer contains a hardcoded copy of module definitions — only the JSON block

**Out of scope:** changing the JSON schema, adding new modules.

---

### T3 — Fix the unnamed-input default and port-name casing  [DONE]
**Priority:** small correctness fix. Do before T6.

**Status:** Fixed in `parsePDL`'s resolved-connections pass. `A -> VCO` now defaults `c.toPort` to the first input port of the bound module type (V/OCT for VCO) instead of looking up a nonexistent "IN". Source ports get the same treatment (`VCO -> X` defaults the fromPort to SIN). Canonical port names are written back into the connection object so renderer, port-map builder, and emitter all see consistent names.

**Preconditions:** T2 is helpful but not required.

**Files to read first:**
- `PDL Renderer.html` — `resolveInputType`, `resolveOutputType`, `buildPortMap`
- `vcv_fundamental_registry.json` — look at VCO input 0 (`V/OCT`) and the port names across modules

**The bug:** when a PDL line is `A -> VCO` (no destination port named), `resolveInputType` looks up the port name `"IN"` against the registry. VCO has no port called `"IN"` — its first input is `"V/OCT"`. The lookup fails silently; the connection falls through to `"default"` (gray) instead of resolving as pitch (blue).

**What to change:**
- In `parsePDL` (or immediately after), when `c.toPort` is null AND the destination instance is registered, set `c.toPort` to the **first input port name** of the bound module type in the registry.
- Same logic for `c.fromPort`: when null AND the source instance is registered, set it to the **first output port name** of the bound module type. (Current default `"OUT"` works for VCA, ADSR, Mixer, but not for VCO where the first output is `"SIN"`.)
- Keep the existing default behavior (`"In"` / `"Out"`) only for **unregistered** instances like `KEYBOARD` and `OUT`.
- Normalize casing: registry port names are uppercase; display/UI can render them as-is. No casing mismatch between lookup and display.

**Success criteria:**
- `KEYBOARD -> VCO` renders as a blue (pitch) cable targeting the `V/OCT` port
- `VCO -> VCF` renders as a coral (audio) cable from `SIN` (or whatever the first output is) to `IN`
- No regression in the default classic subtractive voice patch

**Out of scope:** changing PDL syntax, adding implicit-connection shortcuts.

---

### T4 — Verify the derived modules against Fundamental source ✅ **DONE 2026-04-19**

**What happened:** First test load of an emitted .vcv exposed catastrophic port-routing errors — cables landed on cutoff CV instead of audio inputs because indices were guessed from documentation rather than read from source. T4 was promoted from "medium" to "blocker" and executed in full.

**Findings (severity sorted):**
- **VCF** — input order was completely wrong. Real order: `FREQ`=0, `RES`=1, **`DRIVE`=2** (was missing entirely from registry), `IN`=3. Old registry had `IN`=0. The fictional `V/OCT` input was removed.
- **ADSR** — `GATE`/`RETRIG` are at indices **4 and 5**, after four CV modulation inputs (A_CV, D_CV, S_CV, R_CV). Old registry had `GATE`=0. This had been incorrectly tagged "verified against source" — it wasn't.
- **VCA-1** — `CV` and `IN` were **reversed**. Real: `CV`=0, `IN`=1. Old registry: `IN`=0, `CV`=1.
- **LFO** — slug was `LFO-1` (real: `LFO`). Missing `CLOCK`, `RESET`, `PWM` inputs at 1–3. The fictional `UNI` output was removed (unipolar mode is the `OFFSET` param).
- **SEQ3** — slug was `SEQ-3` (real: `SEQ3`). Inputs: real order Tempo=0, Clock=1, Reset=2, Steps=3, Run=4 (was Clock=0, Reset=1). Outputs: index 0 is `TRIG`, CV1 is at index 1; the fictional `GATE1-3` outputs were removed (real module has 8 per-step trigger outputs at 4–11).
- **Mixer** — has 6 inputs not 4, AND only ONE master `Level` param (no per-channel knobs). Added **`VCMIXER`** as a separate registry entry for users who actually want per-channel level control.
- **VCO** — inputs/outputs were correct (genuinely verified earlier). Param ranges and identities were wrong; `FINE` doesn't exist; `SYNC_MODE` is index 5, not 4. Added `PWM_DEPTH`, `FM_MODE`.

**What was changed:**
- `vcv_fundamental_registry.json` rewritten to v2.0. All 7 original modules verified against their `.cpp` source via WebFetch, plus `VCMIXER` added (8 total). Every entry now carries `verification: "verified against src/<file>.cpp (2026-04-19)"`. Slugs corrected. Indices corrected. Param indices and defaults added (previously missing).
- Inline registry block in `PDL Renderer.html` synced byte-for-byte with the JSON file.
- Smoke test confirmed: with the updated registry, the default PDL emits cables with `outputId=2` (SAW) → `inputId=3` (VCF:IN), `outputId=0` (LPF) → `inputId=1` (VCA:IN), `outputId=0` (ENV) → `inputId=0` (VCA:CV) — all correct.

**Lesson for future work:** "verified against source" is a load-bearing claim. If an entry is marked verified but the verification was actually a guess, that lie compounds. v2.0 only marks verified what was confirmed by reading specific lines of named source files in a named commit/branch.

**Success criteria — met:**
- All 8 modules in `vcv_fundamental_registry.json` have `verification` values that name a source file, with verification date.
- Loaded in VCV Rack and confirmed: cables now land on the correct ports.

---

### T4b — Add `default_input` / `default_output` fields to the registry
**Priority:** medium — small but important correctness fix that surfaced from the v2.0 audit.

**Preconditions:** T4 is complete (it is).

**Background.** In v1.0, "first input port" of a module was usually the audio/signal input by happy accident. In v2.0, source-verified ordering reveals that the first input is often a CV modulation input — VCF:FREQ (CV), VCA:CV, ADSR:A_CV, LFO:CLOCK. So a PDL line like `OSC -> FILT` (where the user clearly means "audio into the filter") now resolves to `OSC -> FILT:FREQ`, which is wrong. The renderer is being technically correct in a way that contradicts user intent.

**Files to read first:**
- `vcv_fundamental_registry.json` — see how `inputs` / `outputs` are ordered
- `PDL Renderer.html` — the resolved-connections pass in `parsePDL` that fills in null `toPort` / `fromPort`

**What to change:**
1. Add two new optional fields to each registry entry: `default_input` (port name) and `default_output` (port name). Examples:
   - VCF: `default_input: "IN"`, `default_output: "LPF"`
   - VCA: `default_input: "IN"`, `default_output: "OUT"`
   - VCO: `default_input: "V/OCT"`, `default_output: "SIN"` (or whatever waveform makes sense as the default)
   - ADSR: `default_input: "GATE"`, `default_output: "ENV"`
   - LFO: `default_output: "SIN"` (no meaningful default input — leave undefined or pick CLOCK)
2. In `parsePDL`'s resolved-connections pass, prefer `default_input` / `default_output` over "first input/output" when filling in null ports on registered instances. Fall back to the first port only if the field is missing.
3. Sync the inline `<script type="application/json" id="vcv-registry">` block in `PDL Renderer.html` with the JSON file.

**Success criteria:**
- `OSC -> FILT` resolves to `OSC:SIN -> FILT:IN` (audio → audio), not `OSC:V/OCT -> FILT:FREQ`.
- `ENV -> AMP` resolves to `ENV:ENV -> AMP:CV` (the conceptually "right" routing for an envelope into a VCA).
- The default subtractive PDL spec still emits a working .vcv.

**Out of scope:** changing the PDL grammar to require explicit ports. Defaults are a convenience layer; explicit `:Port` syntax always wins.

---

### T5 — Delete the stale `PDL Renderer.jsx`
**Priority:** trivial cleanup.

**Preconditions:** none.

**What to do:** Delete `PDL Renderer.jsx`. It is the old pre-registry version of the renderer and has drifted from `PDL Renderer.html` (no `@instance` binding, no registry integration, can't parse `/` in port names). Keeping it is technical debt that misleads readers.

**Success criteria:** the file no longer exists. No references to it remain in palace entries.

---

### T6 — Write the generation prompt (close the left-to-right half)
**Priority:** high — this is the other half of the pipeline.

**Preconditions:** T2 (unified registry) and T3 (casing fixes) make this much cleaner. Not blocking, but recommended.

**Files to read first:**
- `Generative Audio Devices.md` (this file) — the three-layer architecture and the perceptual index sections
- `vcv_fundamental_registry.json` — the full vocabulary including the `perceptual_index` cloud on each module
- `PDL Renderer.html` — the PDL grammar (look at the default spec and the syntax reference panel)

**What to build:** a new palace entry, `PDL Generation Prompt.md`, containing:
- A system-prompt template that injects the registry and perceptual index, teaches the model the PDL grammar, and instructs it to produce 3 valid PDL spec candidates per description (subtractive, FM, wavetable — or whatever 3 the model judges most fitting)
- A user-prompt template that takes a natural-language description
- 3 worked examples: "bright pluck", "kick drum", "slowly evolving pad" — each showing a description and a plausible PDL output

**Success criteria:**
- The prompt, when pasted into a fresh Claude instance alongside the registry JSON, produces PDL that parses in `PDL Renderer.html` without errors
- Each example produces at least 2 structurally distinct topologies
- No hallucinated module types (only the 7 in the registry appear)

**Out of scope:** automation, CLI tooling, integration with the renderer UI. The prompt is first a document.

---

### T7 — Extend the `.vcv` emitter to write parameter values
**Priority:** medium — completes patch expressivity.

**Preconditions:** T1 is complete.

**Files to read first:**
- `PDL Renderer.html` — `parsePDL` returns a `params` map
- `vcv_fundamental_registry.json` — look at `params` arrays with `range` and `unit`
- Sample `.vcv` file from VCV Rack — confirm how parameter values are stored per module

**What to change:**
- In the emitter from T1, include per-module parameter arrays
- For each `*` line in the PDL (e.g. `* FILT: Cutoff = 2000Hz | Resonance = 20%`), look up the param name in the registry, map the human-readable value (`2000Hz`, `20%`, `5ms`) to the registry's normalized range using the `unit` field, and emit the numeric value VCV Rack expects

**Success criteria:**
- Exported `.vcv` file loads with the described parameter values (filter cutoff audibly at 2kHz, resonance at 20%, etc.)

**Out of scope:** parameter modulation, LFO-driven knob sweeps, automation lanes.

---

### T8 — Wire the perceptual index into the renderer
**Priority:** medium — makes the bridge visible and debuggable.

**Preconditions:** T2.

**Files to read first:**
- `vcv_fundamental_registry.json` — see `perceptual_index` arrays per module
- `PDL Renderer.html` — the sidebar `RegistryPanel` component

**What to build:**
- A search input in the sidebar: "describe it"
- As the user types, highlight registry modules whose `perceptual_index` contains any of the typed words (case-insensitive, whitespace-tolerant)
- No ranking needed yet — just binary highlight

**Success criteria:**
- Typing "bright" highlights VCO and VCF
- Typing "breathing" highlights LFO and ADSR
- Typing "kick" highlights nothing (this is a diagnostic — tells Loudon the index needs more coverage for percussive archetypes)

**Out of scope:** semantic similarity, embedding lookups, prompt integration. String-match only.

---

### T9 — Split the PDL language into its own palace entry
**Priority:** low — project hygiene.

**Preconditions:** none.

**What to do:** create `PDL Spec.md` as a dedicated entry. Move the PDL grammar, signal-type list, resolution order, and syntax examples out of this file and into that one. Link from here via a typed link (e.g. `spawned: "[[PDL Spec]]"`). Keep a short pointer paragraph in this file.

**Success criteria:** PDL-the-language has its own palace entry with frontmatter, proper links, and lives independently of this project entry. This entry stays focused on *the project*, not the language spec.

---

### T11 — Make exported patches sound-ready (Core MIDI-CV + Audio-8)
**Priority:** high — this is what closes T1's audible-playback gate. Without it, every test load requires manual wiring inside Rack to hear anything.

**Preconditions:** T1 (emitter works) and T4 (registry source-verified) are complete.

**Files to read first:**
- VCV Rack Core modules documentation or source for `MIDI_CV` and `Audio_8` (these are in the **Core** plugin, not Fundamental — the registry will need to declare `plugin: "Core"` per entry, or grow a plugin field)
- `vcv_fundamental_registry.json` — note current entries all live under the implicit Fundamental plugin
- `PDL Renderer.html` — `emitVcvJson` and the unregistered-endpoint skip logic

**What to build:**
1. Add a `plugin` field to each registry entry (default `"Fundamental"`). Existing entries keep current behavior.
2. Add `MIDI_CV` and `AUDIO_8` (or `AUDIO_2` — pick the simplest stereo-out option) entries to the registry under `plugin: "Core"`. Source-verify their port indices.
3. Map the virtual PDL endpoints `KEYBOARD` → `MIDI_CV` and `OUT` → `AUDIO_*`. Either:
   - **Option A (implicit):** when emitting, automatically inject these modules whenever the PDL references `KEYBOARD` or `OUT`. Cables to/from the virtual names get rewritten to the injected instances.
   - **Option B (explicit):** require the human to write `@MIDI = MIDI_CV` and `@DAC = AUDIO_8` in the PDL, and treat `KEYBOARD` / `OUT` as plain unregistered endpoints. More verbose but more honest.
   
   Recommend Option A for ergonomics, with a renderer toggle to disable the auto-injection.
4. The emitter's "skipped endpoints" UI should now report zero in the common case.

**Success criteria:**
- Exported .vcv loads in Rack and **plays sound when notes are sent in via MIDI**, with no manual module additions.
- A round-trip: paste default PDL → export → load → press a key on a MIDI controller → hear it.

**Out of scope:** scope creep into other Core modules (Notes, Blank, etc.). Just MIDI-CV in and audio out.

---

### T12 — Parse-time diagnostics: warn on dropped lines
**Priority:** medium — small task, large debuggability win. Do this **before** T6 (generation prompt), because prompt iteration will produce malformed PDL constantly and silent dropouts will waste hours.

**Preconditions:** none.

**Background.** The 2026-04-19 comment-strip bug bit precisely because the `@INSTANCE` regex silently rejected three lines and the renderer happily continued with a 5-module patch. There was no on-screen indication that anything had been dropped. The first sign was a screenshot showing missing modules, hours later. Silent regex rejection is a footgun the entire pipeline must outgrow.

**Files to read first:**
- `PDL Renderer.html` — the per-line parsing loop in `parsePDL` (around the comment-strip fix from 2026-04-19)
- The sidebar `RegistryPanel` component — diagnostics likely live in a sibling panel

**What to build:**
1. In `parsePDL`, for every non-empty, non-comment line that does not match any of the recognized line shapes (`@INSTANCE = Type`, connection, parameter, signal-type override), record a `{ lineNumber, content, reason }` entry into a `warnings` array on the parsed result.
2. Render warnings in the sidebar in a yellow/amber panel: "3 lines were not recognized" with each line's number and content. Do not block rendering — warnings are informational, not fatal.
3. Add the same warnings to the `emitVcvJson` output: if any unregistered module types are referenced or any cables were dropped because their endpoint had no port, list them.
4. Optional: a "strict mode" toggle that turns warnings into hard errors and refuses to render until clean. Useful when iterating on a generation prompt.

**Success criteria:**
- Pasting `@FENV = ADSR  // a comment that breaks the old regex` followed by usage of FENV produces no warnings (because the comment-strip is upstream).
- Pasting a typo like `@VCO1 = VCOO` produces a clearly visible warning naming line N with `"unknown module type: VCOO"`.
- The default PDL spec produces zero warnings.

**Out of scope:** auto-fix suggestions, fuzzy matching of typos to known module names. Diagnostics only — no second-guessing the human.

---

### T10 — Second-target pilot (deferred until Stage 1 is fully closed)
**Priority:** future. Do not start until T1 (audibly closed via T11), T3, T4, T4b, T6, T7 are complete.

**What to investigate:** with Stage 1 working end-to-end and the three-layer architecture validated on one target, pick a second target and build its registry + emitter. Candidates (in rough order of leverage):
- **RNBO Codebox~** — Loudon already has deep vocabulary here; export multiplies to Ableton/VST/AU/web. Open structural question: does the registry abstraction (graph-topological) generalize to targets where the output is *code* rather than a graph? Or does a functional IR (input → process → output) appear one level up, sibling to PDL?
- **Pure Data** — closest structural cousin to VCV; lowest-risk second target
- **Max/MSP** — JSON-based patcher format; similar shape to `.vcv`
- **WebAudio API** — code-generation target; forces the RNBO structural question early

**Success criteria for Stage 2:** the same PDL spec that produces a VCV patch also produces a working artifact in the second target, demonstrating target-agnostic PDL.

**Not in scope until Stage 1 is fully closed.** Discipline: do not split attention across targets before one is proven.

---

## Prior Art — Patchbook

Before building the PDL renderer, existing approaches were surveyed. The most relevant prior art is **[Patchbook](https://github.com/SpektroAudio/Patchbook)** (Spektro Audio, 2017) — an open-source markup language for documenting modular synthesizer patches.

**What Patchbook gets right:** human-readable plain-text format; typed signal connections (`->` audio, `p>` pitch, `g>` gate, `t>` trigger, `>>` CV); parameter annotation; Python parser that emits JSON and GraphViz flow charts.

**Where it stops short for this project:** GraphViz rendering only (no live interactive browser renderer); no registry concept (purely documentation); no path to generating target patch files from the same spec; designed to document existing patches, not to be a source-of-truth for generation.

**Decision:** PDL adopts Patchbook's signal-type awareness in spirit but tightens the format into `Module -> Module:Port [type]` and treats the spec as a *unified source of truth* for diagram rendering, downstream target emission, and LLM-facing grammar. The key distinction: Patchbook documents patches. PDL *is* the patch.

---

## Diagramming Journey — Why PDL Exists

A condensed record of the path that led here; preserved because the reasoning may inform future IR decisions for other domains.

**Mermaid (abandoned):** flowcharts have no port geometry — labels live on cables, not on module inputs. `\n` renders literally; correct syntax is `<br/>`. Too limited for synth diagrams.

**Direct SVG (working but expensive):** produces correct, color-coded diagrams with port labels, but every modification requires re-deriving coordinates. No shared representation between description, diagram, and patch file. Iteration is slow.

**PDL (chosen):** the diagram and the patch are the same data viewed differently. The plain-text spec drives the renderer, and is one transform away from any target artifact. Diagram and patch share a single source of truth. This is the architecture going forward.

**SVG lessons preserved for when SVG is needed:** viewBox must match intended pixel dimensions for 1:1 rendering; color encodes signal type, not sequence; `<br/>` for multi-line labels; connector `<path>` needs `fill="none"`; two-section module panels read more clearly than single-section ones.

---

## Notes for Future Claude Instances Working on This Project

- **Read `CLAUDE.md` in the palace root first.** The palace has strong conventions (typed links, ceremonies, no schema-change without discussion). This project entry does not override them.
- **Dialogue before writing schema changes.** Adding a new link type, entry type, or ceremony requires discussion with Loudon, not a solo commit.
- **PDL is target-agnostic on purpose.** If you are tempted to add VCV-specific syntax to the language, stop. Target specifics live in registries and emitters, not in the IR.
- **The registry is the reliability surface.** An unverified entry is a liability, not a caveat. When adding modules, verify against source before committing. The 2026-04-19 v2.0 audit found that several entries previously claiming `"verified"` had actually been guessed — and that one lie cascaded into a screen full of mis-routed cables on the first real test load. If you mark something verified, name the source file and the date, and have actually read the lines you're claiming to have read.
- **Silent regex rejection is a footgun.** When something a user pastes "doesn't work" — modules missing, cables wrong — the first hypothesis is *not* "the registry is wrong." The first hypothesis is *"the parser silently dropped a line."* The 2026-04-19 second test load looked like a registry bug for several minutes; it was a regex bug that had quietly dropped three of eight `@INSTANCE` declarations because of trailing `// comments`. Build diagnostics (T12) so this kind of failure is loud, not silent.
- **Stage 2+ is RNBO-agnostic now.** The old version of this document locked Stage 2 to RNBO Codebox~. That was premature; the second target should be chosen after Stage 1 closes, based on what best tests the three-layer architecture (likely: a code-emitting target, because the graph-to-code shape question is the hardest structural bet).
- **"Topology works" ≠ "patch makes sound."** The emitter can produce a structurally perfect .vcv that is silent in Rack because no MIDI-CV or audio-out module is wired in. This is the gap T11 closes. Do not declare T1 done because the patch loaded — declare it done when a key press makes a noise.
- **Depth over coverage.** Name the specific reason for a choice — the actual tradeoff — not a label that stands in for one. This is a palace value and applies here.
