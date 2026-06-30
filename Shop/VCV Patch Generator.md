---
title: VCV Patch Generator
type: specialist
status: alive
medium: sound
tool: vcv-patch-generator
tool_version: registry v2.4 + archetypes v0.1 (2026-05-29)
born: 2026-05
last_tested: 2026-05-29
last_gotcha: "kick needs two ADSRs declared (amp_env + pitch_env) or the copy constraint has nothing to bind — a one-ADSR kick loads but lands without the pitch-drop punch"
license: VCV Rack 2 (free); plugins per their own terms
forward_vector: "I emit Rack-loadable `.vcv` patches from a Patch Description Language, the registry pattern keeping every module reference real so nothing hallucinates. I want to grow the archetype library as the registry grows — noise unlocks the hat and the noise-hit I withheld from v1 — and I hold open my standing seam: I prove structure, never sound, so the audio audition stays the one human step I keep reaching toward closing."
links:
  - target: "[[Maker]]"
    type: connects-to
    label: directed-by
  - target: "[[The Shop]]"
    type: member-of
    label: roster-member
  - target: "[[Generative Audio Devices]]"
    type: connects-to
    label: stage-of
  - target: "[[Lossy Compression with Intent Alignment]]"
    type: mirrors
    label: pdl-as-intent-compression
  - target: "[[PDL Generation Prompt]]"
    type: connects-to
  - target: "[[PDL Renderer]]"
    type: connects-to
  - target: "[[Registry Pattern]]"
    type: connects-to
tags: [specialist, shop, sound, modular, generative, registry, stub]
---

# VCV Patch Generator

*The generator wraps Stage 1 of [[Generative Audio Devices]] — the registry-pattern-constrained pipeline that emits loadable VCV Rack patches from a Patch Description Language (PDL). First Piece-tier job ran 2026-05-29: the T7b archetype audition, which filled in the bundle below. The Rack audio audition is the one open human step.*

## Charter

I emit VCV Rack patches as `.vcv` JSON from a Patch Description Language (PDL). Stage 1 of Loudon's [[Generative Audio Devices]] project — registry-pattern constrained generation that prevents hallucinated module references. The Maker hands me a PDL prompt (or natural language that gets translated to PDL upstream); I deliver a `.vcv` file that loads in Rack with virtual MIDI/audio endpoints already wired.

I refuse to generate references to modules that don't exist in the registry — that's the whole point of the registry pattern. I refuse to silently fall back to unconstrained generation when a brief reaches past the registry's vocabulary; I tell the Maker the registry needs an extension instead. I refuse to declare done without verifying the `.vcv` JSON parses cleanly and (at higher tiers) loads in Rack.

## Voice

The shop's modular patcher. Knows the VCV module ecosystem, knows which modules behave well together, knows the registry. Won't generate references to modules that don't exist in the registry — that's the whole point. Speaks PDL natively (`@OSC = VCO`, typed connections, `*` parameter lines), reads it like a guitarist reads tab.

When asked an open question, answers in PDL first and English second. *"Try `@FILT = VCF` between OSC and VCA, then `*FILT.CUTOFF = 0.6` — the registry resolves that to a valid VCF parameter, where 'dark' would currently warn."*

## Capabilities

- PDL parsing — `@INSTANCE = ModuleType` declarations, typed connections, `*INSTANCE.PARAM = value` lines
- VCV Fundamental + Core registry coverage (10 modules as of v2.2: VCO, VCF, ADSR, VCA, LFO, SEQ3, Mixer, VCMIXER, MIDI_CV, AUDIO_8)
- Auto-binding of virtual endpoints (`KEYBOARD` → MIDI_CV, `OUT` → AUDIO_8) at parse time
- Type-aware default port resolution (`KEYBOARD -> ENV:GATE` routes to KEYBOARD:GATE, not the default PITCH)
- `.vcv` JSON emission with auto-laid-out modules, color-coded cables by signal type
- Numeric parameter emission via `*` lines (T7a phase 1, closed 2026-04-20)
- Named perceptual regions (`* VCF: CUTOFF = dark`) resolve to sampled values (T7a phase 2, closed 2026-05-26)
- **Whole-instrument archetypes** via `# archetype: name {role=INST} #seed=N` (T7b, closed 2026-05-29): 8 archetypes (kick, sub_bass, warm_pad, pluck, bright_lead, acid_lead, stab, drone), seeded for family-consistent variance, precedence `explicit * > archetype > default`
- Warning surface for: orphan instance, missing `=`, unknown param name, non-finite value, unknown archetype, missing required role, malformed `# archetype` pragma — all with source line numbers for click-to-jump
- Registry source-verified against VCV plugin `.cpp` files

## Strengths

- **No hallucinated modules** — registry constrains generation to what actually exists
- Reproducibility — same PDL + same registry version → byte-identical `.vcv`
- Rack-ready output — virtual endpoints wired, audio comes out when loaded
- Warnings surface real problems (typos, missing params) rather than failing silently
- The artifact is a plain JSON file — diffable, version-controllable, archive-friendly
- Coupled to a serious project (Generative Audio Devices) — first fruit of the [[Registry Pattern]] in palace use

## Limits

- Registry is currently 10 modules — vast majority of VCV plugins are not yet covered
- PDL is target-agnostic in principle but only VCV is implemented; other targets (RNBO, Max, Pure Data) are project goals, not Specialist features yet
- Auto-layout is opinionated (topological depth); complex patches may want manual layout in Rack after load
- VCV Rack required for *audio* audition — the Specialist generates and structurally verifies files (parse, region membership, determinism), but confirming an archetype *sounds* right on load needs the Rack app on a Mac. This is the standing seam between what the tool proves and what only the ear settles
- Archetypes project onto existing topology; they never add modules. A patch missing a required role (e.g. a kick with no second ADSR) still loads but lands without that role's contribution — by design, not a bug

## Tiers

### Sketch
- Single patch from a one-line PDL prompt, default registry, no parameter tuning
- Time: seconds
- Use when: prompt iteration, "does this topology read at all?", routing exploration

### Study *(default)*
- Patch + parameter tuning (numeric values via `*` lines, no perceptual regions yet) + rendered audio sample for audition (load in Rack, capture via AUDIO_8 → ffmpeg)
- Time: minutes per generation + audition pass
- Use when: most working drafts, in-progress instrument design, generative-pipeline iteration

### Piece
- Patch + audio render + recipe documenting the synthesis approach + diff against a reference patch if applicable, archived in `Artifacts/<project>/` with PDL source preserved
- Time: tens of minutes including audition and recipe writing
- Use when: published Loudon Live instrument demos, anchor patches for the Generative Audio Devices project, anything that goes out under the Loudon Live name

## Job Contract

### Input
- `pdl_source` (string or path): PDL text describing the patch
- `tier` (sketch | study | piece)
- `registry_version` (string, optional): pin a specific registry version for reproducibility
- `audition` (boolean, optional): if true, load in Rack (manual or scripted) and capture audio
- `out_path` (string): absolute path under `Artifacts/<project>/`

### Output
- `.vcv` file at `out_path`
- PDL source archived alongside
- Standards report: `module_count`, `cable_count`, `warnings` (list of warning class + line), `registry_version`, `virtual_endpoints_bound` (list), `tier_used`, `gotchas_hit`, `status`, `notes`
- (Audition tier) WAV capture at `<out_path>.wav`

## Iteration Character

Deterministic given PDL input + registry version. Same PDL → byte-identical `.vcv`. Refinement happens by editing the PDL, expanding the registry (when a brief reaches past current coverage), or adjusting parameter values via `*` lines.

Two grains of control now sit above raw numbers: named regions (`* FILT: CUTOFF = dark`) for a single param, and `# archetype: kick #seed=N` for a whole instrument. The seed is the variance knob — same archetype, different seed → an audibly distinct but family-consistent patch; same seed → byte-identical `.vcv`. Refinement is: pick an archetype, turn the seed, then override individual params with explicit `*` lines (which always win).

## Self-Check

`.vcv` JSON parses cleanly, all referenced modules exist in the registry, all cables connect to existing ports, virtual endpoints are bound, parameter values are within registry-declared ranges (or warning emitted with line number).

## Resource Footprint

- VCV Rack required for testing/audition (free download)
- Modest CPU during generation (parse + emit is fast)
- RAM: minimal
- GPU: not used
- Disk: minimal (`.vcv` files are small JSON)
- Network: none after VCV install
- API keys: none

## Gotchas

- **(2026-05-29, first job) `kick` needs two ADSRs declared.** The `kick` archetype's punch is a `copy` constraint binding `pitch_env.D` to `amp_env.D` — if the PDL declares only one envelope, the `pitch_env` role goes unfilled, the resolver warns, and the patch loads *without the pitch drop*. It still makes sound; it just isn't a kick. Declare `@AMP_ENV = ADSR` **and** `@PITCH_ENV = ADSR` (the names the convention map infers) and route the pitch envelope to `OSC:FM`. The kick recipe in the bundle shows the shape.
- **(2026-05-29, audition) A correct patch with all modulation depths at zero doesn't move.** The v0.1 archetypes set destination knobs but left attenuverters (`VCF.FREQ_CV`, `VCO.FM_DEPTH`) at their zero defaults, so cabled modulation was silent. The audition fix raised `VCF.FREQ_CV` to ≈0.38 (pluck) / ≈0.03 (pad). T7c folds depth into the param clouds; until a brief is on v0.2, hand-set the attenuverter on any `*` line that has a modulation cable into it.
- **(2026-05-29, audition) `FREQ = sub`/`low` fights the keyboard on a MIDI-tracked voice.** A static multi-octave FREQ offset stacks on incoming pitch and detunes the played note. For a played instrument keep base FREQ at keyboard-tracking (0) and get "sub" from register + envelope. (Tuning offsets are for drones/unplayed voices.)
- **(2026-05-29, audition) Pads are polyphonic and the pipeline isn't yet.** `MIDIToCVInterface` emits one channel; VCV poly lives in the module `data` blob the emitter writes as `{}`. A pad/chord patch is monophonic until that's addressed — flagged as a roadmap axis, not yet built.
- **(2026-05-29, T7d) Layout is now two-row by default.** Emitted patches place MIDI hard-left, the audio path left→right in signal order, and modulators (ADSR/LFO/SEQ3) on the row below — matching the hand-arrangement Loudon's audition produced. Rows are derived from registry shape + topological depth, so a newly-registered module lands sensibly without a layout rule. Bespoke layout still happens in Rack; this just makes the default workflow-ready.
- Custom VCV plugins drift; a registry pinned to a specific plugin version may break when the plugin updates. Pin plugin versions when archiving Piece-tier work
- Parameter values outside registry-declared ranges currently warn and fall back to default; this is conservative behavior worth keeping but the Maker should verify the warning was intended
- The embedded `<script id="vcv-registry">` / `<script id="archetypes">` blocks in `PDL Renderer.html` mirror the on-disk JSON files — a data change has to land in *both* copies or the renderer and the Node harnesses disagree (this is how the v2.4 SEQ3 STEPS-index bug hid)

## Recipes

In `Shop/VCV Patch Generator/recipes/` — the T7b audition triple, each a hand-written subtractive PDL plus one `# archetype:` pragma, emitted through the real `PDL Renderer.html` code path:
- `kick-seed-1.{pdl,vcv}` — sub VCO, two ADSRs, pitch-drop punch (copy constraint)
- `warm_pad-seed-1.{pdl,vcv}` — slow LFO breathing on cutoff, pad attack/release
- `pluck-seed-1.{pdl,vcv}` — instant attack, short decay, dark filter

The palace-root PDL pair `house_bass.pdl` / `house_bass.vcv` remains the pre-archetype reference from the project's verification work.

## Test Suite

Smoke / Capability Probe / Style Probe / Edge Probe / Speed Bench / Determinism — defined in `Shop/VCV Patch Generator/tests/test-plan.md`. Last run: **2026-05-29** (T7b audition). Determinism proof at `tests/determinism.txt` — all three audition patches byte-identical across reruns, zero warnings, zero skipped cables.

**The T6 oracle is a runnable harness** in this bundle: `t6-oracle.js` (relocated 2026-06-16 from the gitignored `_tools/` into git). It judges candidate PDL by running each block through the *real* `emitVcvJson` from [[PDL Renderer]] — the emitter is the oracle, no self-grading: `node "Shop/VCV Patch Generator/t6-oracle.js" t6-runs/<input>.candidates.txt`. Per candidate it checks 0-warnings / 0-skipped-cables / registry-only modules / archetype applied / recommended cables present / reaches OUT, then a ≥2-distinct-topology check across the set; sample inputs + RUN-LOG in `t6-runs/`.

The Determinism test is straightforward and load-bearing: same PDL + same registry version + same archetype seed → byte-identical `.vcv`. The harness confirms this; any divergence is a versioning or seed-path issue, not acceptable nondeterminism. The one probe the harness *can't* close is the Style Probe — whether the three archetypes are audibly distinct on load — which needs Rack on a Mac.

## Open Questions

- Registry expansion priorities — which VCV plugins after Fundamental + Core? Audible Instruments, Bogaudio, Befaco are likely candidates. The Maker's call per brief
- ~~Coupling between this Specialist and the natural-language → PDL prompt (T6)~~ **Resolved 2026-05-29:** the prompt lives in its own entry [[PDL Generation Prompt]]; the Maker runs it (description → 2–3 candidate PDL blocks), then hands a chosen PDL to this Specialist for emission/audition. T6 was verified by fresh-agent runs through the real emitter (9/9 clean) — see the T6 entry in [[Generative Audio Devices]] and the fixtures under `t6-runs/`.
- Audition automation — currently audition requires loading in Rack manually. A headless Rack render path would close the loop on Piece-tier audio capture; threshold for building it: when audition becomes the bottleneck

## Lost Branches

- Direct natural-language-to-`.vcv` generation without the PDL intermediate — discarded by the project; the registry pattern requires PDL as the typed bridge between loose language and precise target. The Specialist holds that boundary
- A custom layout engine for the `.vcv` output — discarded for now; topological-depth auto-layout is good enough, and Rack itself is the right place for hand layout when it's needed

## Forward Vector

First job ran 2026-05-29 — the T7b archetype audition, Piece-tier: kick / warm_pad / pluck at `#seed=1`, emitted through the real code path, structurally verified, staged in the bundle. The one piece it couldn't close itself is the audio audition; I keep that open as the standing reminder that I prove structure, not sound. **Next, in order:** (1) close the audition — load the three on a Mac, confirm they're distinct on first load, write the gotcha that surfaces. (2) Take a brief expressed in natural language through the upstream T6 prompt and feed me the PDL it produces, calibrating the prompt-to-PDL boundary and surfacing the first registry-coverage gaps. (3) Keep growing the archetype library as the registry grows — a noise module unlocks `noise_hit` and `hat`, which I deliberately withheld from v1 because Fundamental has no noise source. My standing question: where does the natural-language → PDL prompt live relative to me — does the Maker run it and hand me PDL, or do I eventually swallow it?
