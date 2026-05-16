---
type: specialist
status: stub
medium: sound
tool: vcv-patch-generator
tool_version: registry v2.2 (2026-04-20)
adopted: 2026-05-09
last_tested:
last_gotcha:
license: VCV Rack 2 (free); plugins per their own terms
links:
  - { label: "wraps", target: "VCV Rack (external)" }
  - { label: "stage-of", target: "Generative Audio Devices" }
  - { label: "directed-by", target: "Shop/Maker" }
  - { label: "tested-by", target: "Artifacts/Shop/VCV Patch Generator/tests/" }
  - target: "[[Lossy Compression with Intent Alignment]]"
    type: mirrors
    label: pdl-as-intent-compression
tags: [specialist, shop, sound, modular, generative, registry, stub]
---

# VCV Patch Generator

*This entry is a stub. Sections are present but lightly written. The first real job will fill it in. The generator wraps Stage 1 of [[Generative Audio Devices]] — the registry-pattern-constrained pipeline that emits loadable VCV Rack patches from a Patch Description Language (PDL).*

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
- Warning surface for: orphan instance, missing `=`, unknown param name, non-finite value — all with source line numbers for click-to-jump
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
- Parameter Intelligence (T7a phase 2: regions + curves on each param) is not yet implemented — `CUTOFF = dark` warns and falls back; tomorrow it resolves through a named perceptual region
- VCV Rack required for testing/audition — the Specialist generates files, but auditioning them needs the Rack app

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

When perceptual regions land (T7a phase 2), `*FILT.CUTOFF = dark` will resolve through a named region rather than warning. Until then, that sentence is a forward-vector statement, not a current capability.

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

*(Empty until first job. Patterns to watch for, surfaced from the Generative Audio Devices project work — confirmed and dated only on first encounter through the Specialist:)*

- Custom VCV plugins drift; a registry pinned to a specific plugin version may break when the plugin updates. Pin plugin versions when archiving Piece-tier work
- Parameter values outside registry-declared ranges currently warn and fall back to default; this is conservative behavior worth keeping but the Maker should verify the warning was intended

## Recipes

*(Links to `Artifacts/Shop/VCV Patch Generator/recipes/` once they exist. The PDL source files at the palace root — `house_bass.pdl`, `house_bass.vcv` — are reference pairs from the project's verification work.)*

## Test Suite

Smoke / Capability Probe / Style Probe / Edge Probe / Speed Bench / Determinism — defined in `Artifacts/Shop/VCV Patch Generator/tests/test-plan.md` (TODO). Last run: never.

The Determinism test is straightforward and load-bearing: same PDL + same registry version → byte-identical `.vcv`. The test confirms this; any divergence is a registry-versioning issue, not a tool issue.

## Open Questions

- Registry expansion priorities — which VCV plugins after Fundamental + Core? Audible Instruments, Bogaudio, Befaco are likely candidates. The Maker's call per brief
- Coupling between this Specialist and the natural-language → PDL prompt (T6) — the Specialist takes PDL; the upstream prompt produces PDL. Where does the prompt live? Currently in the Generative Audio Devices project; the Specialist receives PDL from the Maker who runs the prompt
- Audition automation — currently audition requires loading in Rack manually. A headless Rack render path would close the loop on Piece-tier audio capture; threshold for building it: when audition becomes the bottleneck

## Lost Branches

- Direct natural-language-to-`.vcv` generation without the PDL intermediate — discarded by the project; the registry pattern requires PDL as the typed bridge between loose language and precise target. The Specialist holds that boundary
- A custom layout engine for the `.vcv` output — discarded for now; topological-depth auto-layout is good enough, and Rack itself is the right place for hand layout when it's needed

## Forward Vector

First job: a Sketch-tier patch from a one-line PDL prompt — a simple subtractive voice (VCO → VCF → VCA, with ADSR on VCA) — exported and loaded in Rack to verify the round-trip. After that, second job is the same brief expressed in natural language and routed through the upstream prompt, producing PDL that flows into me. The result calibrates the prompt-to-PDL boundary and surfaces the first batch of registry-coverage gaps.
