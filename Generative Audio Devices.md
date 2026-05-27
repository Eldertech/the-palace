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
forward_vector: "The larger goal is a generalizable pipeline: natural language → a target-agnostic signal-flow IR (PDL) → any modular/DSP target via a per-target registry. VCV Rack is the first test case, not the destination. As of 2026-05-26 the registry is at v2.3: 10 modules — 8 Fundamental (source-verified against v2 .cpp files) plus 2 Core (MIDI_CV and AUDIO_8, source-verified 2026-04-20). Per-module `plugin` field lets Fundamental and Core modules coexist in one patch. A top-level `virtual_endpoints` map auto-binds unbound `KEYBOARD` → MIDI_CV and `OUT` → AUDIO_8 at parse time, and type-aware default port resolution routes `KEYBOARD -> ENV:GATE` to KEYBOARD:GATE (not the default PITCH) because the destination's signal type is used to pick the matching source output. **T11 is closed** — the exported .vcv now contains MIDI_CV + AudioInterface wired through automatically, so patches are sound-ready without manual additions in Rack. **T7a phase 1 (numeric param emission) closed 2026-04-20** — `emitVcvJson` reads PDL `*` lines, resolves each entry per-instance, and writes either the parsed numeric value or the registry default into the .vcv `params` array. **T7a phase 2 (perceptual parameter vocabulary) closed 2026-05-26** — selected params on VCF, ADSR, VCO, and LFO now carry optional `regions` (named sub-ranges), `curve` hints, and `aliases` (e.g. VCF.FREQ accepts `CUTOFF`). `emitVcvJson` intercepts the non-finite-value branch phase 1 already routed through a warning: if `rawVal` is a known region, `sampleRegion(spec, name)` returns the midpoint (deterministic — byte-identical `.vcv` across runs); unknown regions still warn and fall back to default, now listing the regions available for that param. `pos` is reserved on the sampler so T7b's seeded resolver can add within-region variance without rewriting the seam. Verified end-to-end via `verify_t7a_phase2.js` (21/21 assertions). **Critical path now T7b → T6 refactor → T10.** T7b (archetype library, seeded resolver) is the musically consequential piece; archetypes lean on phase 2's region vocabulary to stay readable. See the **Parameter Intelligence** section below."
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

### VCV Registry (`vcv_fundamental_registry.json`) — **v2.2 as of 2026-04-20**
Source-verified registry for **10 modules** across two plugins:
- **Fundamental (8):** VCO, VCF, ADSR, VCA, LFO, SEQ3, Mixer, VCMIXER
- **Core (2):** MIDI_CV (slug `MIDIToCVInterface`), AUDIO_8 (slug `AudioInterface`)

Every entry is verified against source — Fundamental v2 `.cpp` files and Rack v2 `src/core/` files (verification dates and source-file references stored in each entry's `verification` field). Per-module `plugin` field lets Fundamental and Core coexist in one emitted patch. Top-level `virtual_endpoints` map defines the auto-bind rules used by the parser.

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
- **T12 (2026-04-20)** — parse-time diagnostics. `parsePDL` now collects `warnings: [{ source, lineNumber, content, reason }]`. Three shapes surface: unknown module types in `@` declarations (e.g. `@VCO1 = VCOO` → `unknown module type: "VCOO" — not in registry`), malformed `@`/`*` lines that start with the sigil but fail their regex, and unrecognized lines that match no known shape. `emitVcvJson` and `downloadVcvPatch` bubble these alongside the existing `skipped` cable list. A new `WarningsPanel` component renders them in an amber sidebar block, recomputed from `parsePDL(pdl)` on every keystroke so silent regex rejection is now loud. Rendering never blocks — good lines still produce a diagram and a patch. Strict-mode toggle was scoped out — the always-on amber panel already provides the loud signal, and a hard-block toggle would have forced threading state through `Diagram`. Known residual edge: `@ = VCO` (empty instance ID) still matches the declaration regex because `[\w\s]+?` consumes the whitespace between `@` and `=`; flagged here so T6 iteration isn't caught off-guard, but out of T12 scope. **Lesson:** the fastest way to debug a pipeline is to make its failures visible in the surface the user is already editing.
- **First playable generation test (2026-04-20)** — a hand-described "house bass" was produced end-to-end: PDL written against the current grammar, `.vcv` emitted directly from the v2.2 registry (via `build_house_bass.js`), loaded in Rack, played on first keypress. Loudon confirmed the voicing works. Files: `house_bass.pdl` (intent), `house_bass.vcv` (playable). **Why this matters for the roadmap:** the test had to bypass `emitVcvJson` and write the `.vcv` directly from the registry, because the current emitter zeroes all params regardless of PDL `*` lines. Structural pipeline is sound; the missing piece is parameter emission. **This is exactly the gap T7a closes** — and the first real test of the pipeline just demonstrated, by necessity, why T7a is now the critical path. Every future audible test needs it. Do T7a next.
- **T7a phase 1 (2026-04-20)** — numeric param emission. `emitVcvJson` no longer writes `value: 0` for every param; it reads the `params` map that `parsePDL` was already returning, resolves each `* Instance: Name = Value | ...` entry against the registry, and emits either the parsed numeric value or the registry `default`. Four failure modes now surface as warnings through the existing amber panel — orphan instances (`* PHANTOM: ...` with no `@` declaration and no virtual-endpoint match), malformed entries missing `=`, param names not in the registry for the instance's module type, and non-finite values (which is also the phase-2 seam: `CUTOFF = dark` warns and falls back to default today, will resolve through a named region once phase 2 lands). Param entries now carry their source line number through `parsePDL` so each warning points the editor at the exact line — mixed-entry lines like `* OSC: FREEQ = -12 | PW = 0.5` correctly flag only the typo on that line, not the valid sibling. Registry-default fallback is also strictly more correct than the old zero stub — a bare VCO now emits with `PW=0.5, SYNC_MODE=1` instead of all zeros (which would have left SYNC_MODE at 0 — soft sync, wrong default). Verified with a Node harness (`verify_t7a.js` in session outputs) that duplicates the pure-JS parser + emitter and diffs against `house_bass.vcv` — clean pass, all seven modules' param arrays match the hand-baked reference. **Lesson:** the phase-2 seam came for free. Because numeric-only parsing warns on anything non-finite, named-region resolution slots in as "intercept the warning path before it fires" rather than as new code in a new place — the same pattern T12 taught (make failure visible in the surface the user is already editing, then extend from there).
- **T7a phase 2 (2026-05-26)** — perceptual parameter vocabulary. Registry bumped to v2.3. Selected params on VCF (FREQ, RES), ADSR (A, D, S, R), VCO (FREQ), and LFO (FREQ) now carry optional `regions` (named perceptual sub-ranges), `curve` hint, and — on VCF.FREQ — an `aliases: ["CUTOFF"]` array so `* VCF: CUTOFF = dark` resolves to the canonical FREQ param. Phase 2 intercepts the non-finite-value branch phase 1 routed to a warning: `emitVcvJson` calls `resolveParamSpec(modReg, name)` (which widens through `aliases`) then `sampleRegion(spec, rawVal)` (midpoint of the named range, clamped to the param's native range). Unknown regions still warn — the warning now lists the available regions for that param. `sampleRegion` takes an optional `pos` ∈ [0,1] argument; phase 2 leaves it `null` (deterministic midpoint), T7b's seeded resolver can pass a per-archetype seed for within-region variance without touching the seam. Verified via `verify_t7a_phase2.js` (21/21 assertions): canonical region (`FREQ = dark` → 0.275 = midpoint of [0.15, 0.4]), alias resolution (`CUTOFF = dark` → same 0.275, stored under canonical `FREQ`), numeric pass-through, unknown-region warn-and-fall-back, byte-identical determinism, ADSR midpoint regions, downstream `.vcv` `params[]` reflects the resolved value. The schema-ceremony question (does this need full SCHEMA.md ceremony?) was resolved to *no*: SCHEMA.md governs the palace type system; this is registry-data schema, so a `version` bump (2.2 → 2.3) + a `notes` rationale line is proportionate. **Lesson:** phase 1's foresight paid out — because the non-finite path was already a separate, named warning branch, phase 2 was an in-place rewire rather than new machinery in a new place. The same pattern that made T12 leverageable made phase 1 leverageable, and will make T7b leverageable (the `pos` arg is the next instance of "leave a seam where the next layer wants to insert"). Also closed in this session: **T5** (stale `PDL Renderer.jsx` deleted; the `.html` is now the unambiguous renderer source).
- **T11 (2026-04-20)** — sound-ready patches. Registry bumped to v2.2. Added per-module `plugin` field (Fundamental vs Core); added MIDI_CV (slug `MIDIToCVInterface`) and AUDIO_8 (slug `AudioInterface`) Core entries, both source-verified against `Rack v2/src/core/MIDI_CV.cpp` and `Audio.cpp`. Added top-level `virtual_endpoints` map; `parsePDL` auto-binds unbound `KEYBOARD` → MIDI_CV and `OUT` → AUDIO_8 so they behave like any declared instance (they appear in the diagram with registry badges and emit to `.vcv`). Added **type-aware default port resolution**: when one side of a connection has a named port with a known signal type, the other side prefers a port of matching type over `default_input`/`default_output`. This is what makes `KEYBOARD -> ENV:GATE` auto-resolve to `KEYBOARD:GATE` (not the default PITCH) without explicit port syntax. Emitter now uses `mod.plugin || PLUGIN_SLUG` per module so Fundamental + Core can coexist. Verified via Node harness (`verify_t11.js` at session root): default PDL emits 6 modules, 7 cables, 0 skipped, 0 warnings; MIDIToCVInterface wired PITCH→OSC and GATE→ENV; AudioInterface wired IN1 + IN2 from AMP:OUT for stereo-centered mono. **Lesson:** a virtual endpoint is an emergent third thing — not parser sugar, not an emitter hack, but a convention that connects loose external-world language (KEYBOARD, OUT) to the precise target vocabulary. Putting it in the registry (alongside modules) rather than hardcoding it in parser/emitter was the right call — it means "second-target" work (T10) can define its own virtual endpoints without touching the core.

### What still does NOT exist
- **T6** — generation prompt (left-to-right half of the pipeline)
- **T7b** — archetype library and seeded resolver (the musically consequential piece — see **Parameter Intelligence** below)
- **T8** — perceptual-index wiring in the renderer UI
- **T10** — any second-target registry (no RNBO, Max, PD, WebAudio registries yet)

---

## Parameter Intelligence — The Next Architectural Layer

Signal flow answers *what connects to what*. Parameter setting answers *what does it sound like when it does*. These are different epistemic projects and deserve different machinery. Conflating them is the trap: it produces patches that are structurally correct and audibly inert, filter cutoffs stranded at center, envelopes stuck at medium-medium-medium-medium, every preset wearing the same neutral face.

**The core asymmetry with signal flow.** Signal flow has a strong syntactic floor — a cable either exists or doesn't, a port is compatible or isn't, and the emitter can verify a patch is legal before it ever hears sound. Parameters have no such floor. Every numeric setting in range is "legal." The constraint is not syntax, it is *perceptual plausibility*, which lives in a domain the registry doesn't currently model. Signal-flow intelligence is a graph problem. Parameter intelligence is a taste problem wearing a graph problem's clothes.

**What the registry already gives for free.** Each param carries `range`, `default`, `unit`. That is the skeleton. What is missing is *perceptual geometry* — the shape of each param's musically meaningful space. A VCF cutoff is not uniform across 0–1; the bottom ~15% reads as "closed," the middle is "character," the top is "open." ADSR attack has a log-perceptual curve; release beyond ~2s reads as "ambient," below ~50ms reads as "pluck." This knowledge already exists in synth-design tradition. The project has not yet invited it into the registry.

**Three layers of parameter knowledge, in order of difficulty.**

The first is *per-module perceptual indexing* — extending the registry so each param carries named perceptual regions alongside its numeric range (`CUTOFF: {closed: [0, 0.15], dark: [0.15, 0.4], open: [0.4, 0.75], bright: [0.75, 1.0]}`). This is the same move the type-aware port resolution made in T11: make the registry richer so the generator can speak in higher-level terms. PDL accepts `* VCF: CUTOFF = dark` and resolves to a sample from that region. This is the *vocabulary* layer — the parametric cousin of the perceptual index that already exists for modules.

The second is *archetype-to-cloud mapping* — a new layer above the registry that knows what a "kick drum," a "pad," a "sparkle lead," a "sub bass" actually *are* as constellations of parameter settings across multiple modules. A kick drum is not "VCO+VCA with fast decay"; it is the specific co-dependency that the pitch envelope's decay matches the amp envelope's decay, the VCO is set low, the LFO is not doing audio-rate FM. These are *constraint bundles across modules*, and they only make sense holistically. An archetype registry is therefore a sibling to the module registry, keyed by musical identity rather than by module identity. It is essentially typed links between modules, weighted by musical co-dependency — the palace's link ontology showing up inside the pipeline itself.

The third is *contextual constraint propagation*. When an archetype is chosen, its parameter cloud propagates outward through the signal graph. Choose "plucky lead," and the envelope's release wants to be short; if the patch then routes VCA into a delay, the delay's feedback wants to complement a pluck, not a pad. This is where parameter intelligence stops being local per-module taste and becomes global patch coherence. This is the hardest layer and the one musicality actually lives in.

**The one-to-many principle, applied again.** The signal-flow pipeline embraced one-to-many: one PDL description, many possible target realizations. Parameter intelligence should do the same on a different axis. One archetype ("warm pad") produces a *distribution* of parameter sets, not a fixed one. Generation is sampling from that distribution, seeded. This avoids the "every kick sounds identical" trap and gives the user a natural knob — variance — that rewards re-generation rather than punishing it. The archetype constrains the region; the seed picks the point.

**The pattern this reveals.** The hard problems in this project keep turning out to be *knowledge-representation* problems, not encoding problems — figuring out what shape of structured knowledge the registry must carry so the generator can stay dumb. Port types (T4), virtual endpoints (T11), and now perceptual regions plus archetypes are all the same move: *push musical intelligence into the static data layer so the generation layer does not have to reinvent it every time.* Parameter intelligence is the largest instance of that pattern the project has hit yet.

**How this reshapes T7 and what comes after.** T7 as originally written ("emit parameter numbers") was the one-line version of this problem. It now splits:

- **T7a — Perceptual parameter vocabulary.** Two phases, both closed. **Phase 1 (closed 2026-04-20)** — numeric value emission: the emitter honors PDL `*` lines and writes parsed numbers or registry defaults into `.vcv`, closing the audible-test automation gap. **Phase 2 (closed 2026-05-26)** — registry extension: selected params on VCF, ADSR, VCO, LFO carry perceptual regions and a `curve` hint; PDL accepts named regions as values (`CUTOFF = dark`) and the canonical→alias map (`CUTOFF` → `FREQ`) lets the human-language surface stay close to the description language while the registry stays source-named. Phase 2 intercepted the non-finite-value branch phase 1 surfaced as a warning — named regions now resolve instead of falling back to default. Closes the "every preset sounds neutral" problem without archetypes, because the generator can say `CUTOFF = bright` instead of leaving the default.
- **T7b — Archetype library and resolver.** New palace entry `Synth Archetypes.md` plus new JSON `archetypes.json`. Start with 8–12 archetypes (kick, sub, pad, pluck, lead, bell, noise-hit, drone). Each archetype declares topology hints (what modules it expects present) and a parameter cloud over those modules. Add a resolver that, given an archetype + seed, samples a concrete parameter set and emits it through the T7a pipeline. This is probably the most musically consequential single task in the whole project.

**How this interacts with the rest of the plan.** T6's job gets meaningfully smaller once T7b exists: the generator maps description → archetype + topology hints, rather than description → full PDL. It no longer has to improvise synth-design expertise from scratch — it selects from a curated palette that encodes it. T10 (second target) is where the value compounds: archetypes are *target-agnostic* by construction, so the same "warm pad" sampled for VCV and for the second target should produce perceptually matched results. Without archetypes, cross-target portability is only "the cables match" — architecturally clean but audibly meaningless.

**Suggested execution order:** T7b → T6 refactor → T10. Both phases of T7a are closed (numeric emission + perceptual region vocabulary). T7b is the big remaining piece — it leans on phase 2's region names to keep the archetype JSON readable, and on `sampleRegion`'s reserved `pos` argument to thread a seed through without rewriting the emitter seam. T6 re-derives once T7b exists; T10 becomes the first real test of cross-target archetype portability.

---

## Roadmap

Each open task is self-contained enough for a fresh Claude instance to execute without this session's context. Tasks are listed in execution order — later tasks depend on earlier ones unless stated.

### T5 — Delete the stale `PDL Renderer.jsx` ✅ closed 2026-05-26

Pre-registry `.jsx` file removed during the T7a phase 2 session. The `.html` is now the unambiguous renderer source on disk.

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

### T6 — Write the generation prompt (close the left-to-right half)
**Priority:** high — the other half of the pipeline.

**Preconditions:** T2, T3, T4b, T12 are all in place — T12 in particular means bad PDL from prompt iteration surfaces as a visible warning instead of a silently-dropped line. Not blocking, but expect to lean on the warnings panel heavily here.

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

### T7a phase 1 — Numeric param emission ✅ closed 2026-04-20

PDL `*` lines resolve against the registry and emit their numeric values into the `.vcv` params array. The non-finite-value branch (named regions) was left as a warning-emitting seam for phase 2 to intercept — see [verify_t7a_phase2.js](verify_t7a_phase2.js) for the consolidated harness covering both phases.

### T7a phase 2 — Perceptual parameter vocabulary (regions + curves) ✅ closed 2026-05-26

Registry v2.3 adds optional `regions`, `curve`, and `aliases` to selected params on VCF, ADSR, VCO, and LFO. `emitVcvJson` widens param-name lookup through `aliases` (so `* VCF: CUTOFF = dark` resolves to canonical `FREQ`), then routes non-finite values through `sampleRegion(spec, rawVal)` — midpoint of the named sub-range, clamped to the param's native range. Unknown regions still warn (the warning lists what *is* known for that param) and fall through to the registry default. `sampleRegion` takes an optional `pos` ∈ [0,1] so T7b's seeded resolver can add within-region variance without touching the seam.

Files of record: [PDL Renderer.html](PDL Renderer.html) (helpers + emitter rewire), [vcv_fundamental_registry.json](vcv_fundamental_registry.json) (regions on VCF.FREQ, VCF.RES, ADSR.A/D/S/R, VCO.FREQ, LFO.FREQ; alias `CUTOFF` on VCF.FREQ), [verify_t7a_phase2.js](verify_t7a_phase2.js) (21/21 assertions: canonical region, alias resolution, numeric pass-through, unknown-region warn+fallback, determinism, downstream emission).

The audible-on-Mac step (load a patch with `FREQ = dark` / `FREQ = bright` in Rack, confirm it opens darker/brighter on load) is the remaining tail of this task and will be settled in a Mac-side session.

---

### T7b — Archetype library and resolver
**Priority:** high — the musically consequential half. Do after T7a.

**Preconditions:** T7a phase 2 complete (phase 1 alone is enough if archetypes emit raw numeric values, but regions make the archetype JSON far more readable). T6 can wait — T7b is usable from hand-written PDL first.

**Files to read first:**
- This file — **Parameter Intelligence** section above
- `vcv_fundamental_registry.json` — module names, their `perceptual_index`, and (post-T7a) their param regions
- Any drafts of `PDL Generation Prompt.md` if T6 has started

**What to build:**
1. New palace entry `Synth Archetypes.md` and sibling JSON `archetypes.json`. Start with 8–12 archetypes: `kick`, `sub_bass`, `warm_pad`, `pluck`, `bright_lead`, `bell`, `noise_hit`, `drone`. Each archetype specifies:
   - Module topology hints (what modules it expects present, with optional roles — e.g. `amp_env: ADSR`, `pitch_env: ADSR`)
   - Parameter cloud over those modules as region names (leaning on T7a vocabulary)
   - Cross-module constraints where they matter (e.g. for `kick`, pitch-env decay co-varies with amp-env decay)
   - A short perceptual-index array so archetypes can be summoned by description
2. A seeded resolver: `resolveArchetype(archetypeName, seed, pdlInstances) → paramMap`. Samples the cloud deterministically per seed; validates that required modules exist in the PDL.
3. PDL directive for archetype application: `@@ AMP_ENV, FILT_ENV, OSC1, OSC2, AMP -> archetype: warm_pad #seed=42` (exact syntax TBD in dialogue). Alternative: `# archetype: warm_pad` as a top-level pragma that applies once PDL is otherwise resolved.

**Success criteria:**
- Hand-written PDL + `# archetype: kick` produces a .vcv that sounds convincingly like a kick drum on load, not a neutral patch.
- Changing the seed produces audibly distinct but family-consistent kicks.
- At least three archetypes are perceptually distinguishable on first load without any manual knob adjustment.

**Out of scope:** learning archetypes from examples; cross-archetype blending; second-target archetype portability (that is T10's job).

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
- **Silent regex rejection is a footgun.** When something "doesn't work" — modules missing, cables wrong — the first hypothesis is *not* "the registry is wrong." The first hypothesis is *"the parser silently dropped a line."* The 2026-04-19 load looked like a registry bug for several minutes; it was a regex bug. T12 (2026-04-20) installed the amber warnings panel that surfaces this class of failure; if the panel is clean and something still looks wrong, *then* suspect the registry.
- **Stage 2+ is target-agnostic.** The second target should be chosen after Stage 1 closes, based on what best tests the three-layer architecture (likely: a code-emitting target).
- **"Topology works" ≠ "patch makes sound."** The emitter can produce a structurally perfect .vcv that is silent in Rack because no MIDI-CV or audio-out is wired in. This is the gap T11 closes. Do not declare T1 done because the patch loaded — declare it done when a key press makes a noise.
- **Depth over coverage.** Name the specific reason for a choice — the actual tradeoff — not a label that stands in for one.
