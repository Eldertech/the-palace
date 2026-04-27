---
title: "Generative Preset Development"
type: project
pillars:
  - creation
  - tools
  - practice
born: 2026-04
stage: growing
status: active
energy: high
links:
  - target: "[[Generative Audio Devices]]"
    type: couples-with
    label: eventual-convergence
  - target: "[[Generative Sample Libraries]]"
    type: couples-with
    label: parallel-siblings
  - target: "[[Registry Pattern]]"
    type: mirrors
    label: profile-as-registry
  - target: "[[Synthesis Topologies]]"
    type: deepens
    label: topology-made-fixed
  - target: "[[Four Pillars]]"
    type: connects-to
    label: structured-by
  - target: "[[Loudon Live]]"
    type: enables
    label: curriculum-fuel
  - target: "[[Preset Oracle]]"
    type: mirrors
    label: analysis-generation-duality
  - target: "[[Loudon's Toolkit]]"
    type: enables
    label: preset-infrastructure
  - target: "[[Action Potential Oscillator]]"
    type: deepens
    label: oscillator-synthesis-case
forward_vector: "I will become a pipeline capable of reading any synthesizer's preset format, building a deep 'profile' of its parameter space, and then — from a single abstract musical or emotional prompt — generating banks of custom presets, analyzing existing presets in modular synthesis language, and modifying them according to the user's aesthetic direction."
---

# Generative Preset Development

A [[Four Pillars]] project: **AI-generated presets for fixed-architecture synthesizers, from abstract prompts.** Where [[Generative Audio Devices]] generates modular signal-flow graphs (topology first, parameters second), this project targets synthesizers whose topology is fixed at design time — Ableton's Wavetable, Serum2, Vital, and others — and must operate entirely within a parameter space the instrument's designer chose. The challenge inverts: instead of building a graph, we must navigate a multidimensional space of knobs.

The project also runs an **analysis track** that is the exact inverse of generation: read an existing preset, and describe its inner workings in the plain, structural language a skilled synthesist uses — oscillator architecture, filter routing, modulation assignments, envelope character, effect chain purpose. Analysis and generation are mutually reinforcing: every preset we successfully describe teaches us what parameters sound like, and that knowledge tightens generation.

---

## The Core Asymmetry with Modular Synthesis

In [[Generative Audio Devices]], the hardest problem is topology: which modules, in what configuration? Once the graph exists, parameters are a secondary optimization. A VCV Rack patch that is structurally correct but poorly parameterized still makes sound.

In Generative Preset Development, topology is handed to us fixed. Ableton's Wavetable always has two oscillators, a sub, a filter, three envelopes, two LFOs, four effects slots — period. What we must navigate is the **full parameter space within that given architecture**, which for a synthesizer like Wavetable or Serum2 runs to hundreds of continuous parameters, each with perceptual geometry the registry range numbers do not capture.

This is simultaneously easier and harder than the modular case:
- **Easier:** no signal-flow hallucination. Every generated preset is structurally legal by construction. There are no "wrong" cable topologies.
- **Harder:** the space of "musically meaningful" is a tiny irregular island in a vast numerical ocean. Default-value presets sound inert. The constraint is taste, not syntax.

The project's central bet is the same as [[Generative Audio Devices]]'s central bet — **push musical intelligence into a static data layer** so the generation layer stays constrained — but the data layer here is a **Synth Profile** rather than a module registry.

---

## The Profile Concept

A **Synth Profile** is the structured knowledge artifact that makes generation reliable for a given synthesizer. It is the analogue of the [[Registry Pattern]]'s module registry, but for fixed-architecture instruments.

A complete profile contains:

**1. Preset Format Schema** — the technical specification for reading and writing a valid preset file. This includes the file format (gzipped XML, JSON, binary FXP, etc.), the parameter encoding, and any required checksums or version fields. Without this, generation has no target.

**2. Parameter Vocabulary** — every addressable parameter in the synth, organized by section (oscillator, filter, envelope, LFO, modulation matrix, effects), with: name, range, default, units, and critically — **perceptual regions**. These are the named zones of musical meaning within the parameter's range: a filter cutoff's "closed / dark / open / bright" bands, an envelope attack's "punchy / soft / pad" regions, an LFO rate's "imperceptible / subtle / obvious / audio-rate" bands. This is the same move T7a phase 2 in GAD proposes for the VCV registry — extended here to a much larger parameter space.

**3. Modulation Map** — which parameters can be modulation *sources*, which can be *targets*, at what depths, and what the modulation routing options are. Fixed-architecture synths have modulation matrices of varying complexity; documenting the possible connections is the equivalent of documenting port types in the modular case.

**4. Architectural Options** — even within a fixed topology, most synths offer routing variants: unison mode, oscillator blending modes, filter routing (serial/parallel/split), effects chain order. These are higher-level "topology" choices the profile must document.

**5. Synth-Specific Archetypes** — the archetypal sounds this instrument is particularly suited for, expressed as constrained parameter clouds. A Wavetable "evolving pad" archetype and a Serum2 "evolving pad" archetype are related but distinct — they share musical intent but diverge in which parameters carry the motion.

Profile-building is the **ceremony at the heart of this project.** The first profile for each synth is built by Loudon and Claude working together: decompress preset files, read parameters, hand-label existing presets in modular synthesis language, identify the perceptual geometry by ear, converge on the vocabulary. Once a profile exists, generation and analysis can run without human supervision.

---

## Two Tracks: Generation and Analysis

### Track A — Generation (prompt → preset file)

```
abstract prompt
     │
     ▼
archetype selection (from Synth-Specific Archetypes)
     │
     ▼
parameter cloud sampling (seeded, from Profile)
     │
     ▼
preset file emission (via Preset Format Schema)
     │
     ▼
loadable preset file
```

The generation side benefits enormously from any prior profile work. A well-specified perceptual vocabulary means the LLM can say "cutoff = dark, attack = soft, lfo_rate = subtle" and the emitter resolves these region-names into concrete parameter values — not neutral defaults, but musically intentional settings. The profile is what prevents every generated preset from wearing the same blank face.

Generation also produces **multiple candidates per prompt** — the same "warm evolving pad" might realize as a slow wavetable morph, a filter-swept single oscillator, or a dual-oscillator unison with subtle detuning. The human chooses. The project never tries to find *the* answer — it proposes a *set* of answers.

### Track B — Analysis (preset file → plain-language description)

```
preset file
     │
     ▼
parameter extraction (via Preset Format Schema)
     │
     ▼
perceptual region mapping (via Profile vocabulary)
     │
     ▼
modulation structure parsing (via Modulation Map)
     │
     ▼
natural-language synthesis description
```

The output of analysis is a description in the language a skilled synthesist uses — not "Osc1 fine = 0.37" but "a single wavetable oscillator with slow morphing, filtered through a resonant low-pass sitting dark with a long slow sweep." This is immediately useful for understanding a preset collection, for teaching synthesis, and for the modification track.

### Track C — Modification (preset + prompt → modified preset)

Given an existing preset and an abstract musical direction ("make this darker and more menacing," "push this toward something that breathes," "strip everything except the core body"), the modification track:
1. Analyzes the preset (Track B)
2. Interprets the abstract direction as parameter-space movements, guided by the profile's perceptual vocabulary
3. Emits a modified preset

This is musically the most powerful track. It treats an existing preset as a starting position and abstract language as a direction vector through the profile's parameter space.

---

## Synth Progression and Rationale

Each synth is a self-contained deliverable. The order is chosen by format accessibility and research foundation, moving from easiest to hardest:

### Tier 1 — Open Formats (ideal starting conditions)

**Vital** — `.vital` files are plain JSON, human-readable, no decompression required. Vital is open source (GPLv3) and the parameter structure is directly inspectable from source. Prior art for AI generation already exists: community-built preset generators, MicroMusic's audio-to-preset tool, academic research. Vital's preset format embeds wavetable data inline, making presets self-contained. **Recommended first target.** The easiest profile to build, the clearest feedback loop.

**Surge XT** — free, fully open source, comprehensive Python bindings (`surge-python`) that expose all parameters programmatically. The Python API means profile-building can be automated: query all parameters by name, range, default, and type directly from the binary rather than by parsing preset files. This makes Surge XT uniquely well-suited for profile validation and automated preset testing. Recommended as a second Tier 1 target.

### Tier 2 — Accessible Proprietary (practical but not fully open)

**Ableton Wavetable** — `.adv` / `.adg` files are gzipped XML, decompressible with standard tools. The XML is "mostly self-evident" per the Ableton developer community, and while no official schema documentation exists, the format is practically readable. Wavetable is already in Loudon's workflow and shares its wavetable content format with the [[Generative Sample Libraries]] project. Strong integration reasons. The modulation matrix is among the most transparent in the tier — modulation targets are named in the XML.

**Dexed (DX7 FM clone)** — free, open source, and built around the fully documented Yamaha DX7 sysex format (32 parameters per operator, 6 operators, fixed FM topology). The FM parameter space is unlike subtractive/wavetable synthesis — generating FM presets requires a different perceptual vocabulary — but the prior AI research is the richest of any synth: Sound2Synth, SPINVAE, SPINVAE-2, and "Neural Proxies for Sound Synthesizers" (arXiv 2025) all target Dexed. Including Dexed creates a bridge between this project and academic ML literature, useful for cross-domain synthesis learning.

### Tier 3 — Partially Reverse-Engineered

**Serum2** — `.SerumPreset` files use XferJson format: human-readable JSON header + zlib-compressed body. Not officially documented, but community tools exist (`serum-preset-packager` CLI, Python and TypeScript implementations) for round-trip JSON conversion. The original Serum (`.fxp` format) is even more thoroughly reverse-engineered, with a C# library for clean-room implementation. Serum2 is commercially the most relevant format in electronic music production, making a working preset generator highly valuable. Harder to profile-build due to the undocumented parameter schema, but the community tooling makes it tractable.

### Tier 4 — Profile Generalizer (the endgame)

Once three or more synth profiles exist, a pattern emerges: the profile-building process itself can be partially automated. Given a collection of presets for an unknown synth and access to the instrument, Claude can:
1. Decompress and parse the preset files (identifying format)
2. Extract all unique parameter names and value ranges across the preset collection
3. Generate a preliminary profile schema
4. Ask targeted clarifying questions about perceptual regions (what does parameter X sound like at min/mid/max?)
5. Refine by ear through generated test presets

This is the **Profile Generalizer** — the capability that makes the project applicable to any VST with a parseable preset format.

---

## Multi-Stage Plan

### Stage 0 — Reconnaissance: Wavetable and Vital Profile Build
**Who leads:** Loudon and Claude working together.

Load 20–30 existing presets per synth. Decompress and read the raw files. Map every parameter. Hand-label each preset in modular synthesis language — oscillator architecture, filter approach, modulation assignments, envelope character, effect chain role. Converge on the perceptual vocabulary by listening. Output: first draft of two synth profiles (Vital first, then Wavetable), ready for Stage 1.

**Vital profile-build entry point:**
```python
import json
with open("a_vital_preset.vital") as f:
    preset = json.load(f)
print(list(preset.keys()))  # reveals top-level parameter namespace
```

**Wavetable profile-build entry point:**
```python
import gzip, xml.etree.ElementTree as ET
with gzip.open("a_wavetable_preset.adv", "rb") as f:
    tree = ET.parse(f)
# Walk the tree, collect all element names and attribute ranges
```

### Stage 1A — Vital Preset Creator
- Profile: full parameter vocabulary with perceptual regions
- Format reader/writer: JSON → param map → JSON (trivial, no encoding)
- Generation track: prompt → preset file (using profile archetypes + seeded sampling)
- Analysis track: preset file → plain-language description
- Modification track: preset + abstract direction → modified preset

**Success criteria:** Given the prompt "a pad that sounds like light through deep water," produce 3 Vital presets that are audibly distinct from each other and from factory defaults, each recognizably matching the description.

### Stage 1B — Wavetable Preset Creator
- Profile: full parameter vocabulary with perceptual regions
- Format reader/writer: gzip → XML → param map → XML → gzip
- Same generation/analysis/modification pipeline as Stage 1A
- Synth-specific archetypes tuned to Wavetable's two-oscillator + sub + filter topology

**Success criteria:** Same prompt test as 1A. Bonus: analysis of a known factory preset matches the description a skilled synthesist would give it.

### Stage 2 — Serum2 Preset Creator
- Acquire and audit community `serum-preset-packager` tooling
- Build Serum2 profile from preset collection
- Extend pipeline to Serum2 format
- Map Serum2's modulation matrix (complex: 8 LFOs, 3 envelopes, macro routing, chaos operators in Serum2)

**Key challenge:** Serum2 extended the modulation system significantly relative to original Serum. The profile must capture the new modulation sources (chaos generators, additional LFO types, new wavetable morphing modes) introduced in Serum2.

### Stage 3 — Surge XT and Dexed
- Surge XT: leverage Python bindings for automated profile-building
- Dexed: study prior academic work (SPINVAE, Sound2Synth) and build on their parameter vocabularies
- FM-specific perceptual vocabulary: operator ratio relationships, feedback amounts, algorithm selection as architectural choice

### Stage 4 — Profile Generalizer
- Semi-automated profile-building from a preset collection + the synth itself
- Human-in-the-loop for perceptual region labeling (requires ears)
- Profile schema stabilizes as a format — exportable, shareable

### Stage 5 — Convergence with Generative Audio Devices
The convergence point is when [[Generative Audio Devices]] has a stable PDL and the profile system is mature enough that a synth profile can function as a PDL-to-preset emitter target. At that point, the three-layer architecture extends:

```
natural language
       │
       ▼
      PDL (target-agnostic)
       │
       ├──[VCV registry]──────> .vcv file
       ├──[Vital profile]─────> .vital preset
       ├──[Wavetable profile]─> .adv preset
       └──[Serum2 profile]────> .SerumPreset
```

The profile *is* the registry. The preset emitter is the translator. The three-layer architecture's power compounds: one PDL description, multiple synth-specific realizations.

**Keep separate until:** Stage 3 of this project is complete. Both projects need to prove their core pipelines before convergence planning. The convergence point is a synthesis of two mature sibling projects, not a shortcut.

---

## Relationship to Generative Sample Libraries

[[Generative Sample Libraries]] generates audio content — samples and wavetables. This project generates *instrument configurations* — the parameter settings that shape how a synth plays. The two projects intersect at the wavetable level: GSL generates wavetable content (CLM WAV files), and the Wavetable/Serum2 preset creators can reference and load those wavetables. A preset generated by this project can be paired with a wavetable generated by GSL — the complete instrument, top to bottom, from a single session.

---

## Prior Art and Research Landscape

The academic ML community has concentrated heavily on Dexed (fully open DX7 format, discrete parameter set, dense prior literature). The applied community has moved toward Vital (open JSON format, thriving third-party tools). Commercial formats like Serum2 remain understudied due to the reverse-engineering barrier.

Notable work:
- **Sound2Synth** — multi-modal deep learning pipeline for Dexed, state-of-the-art audio-to-preset matching
- **SPINVAE / SPINVAE-2** — transformer-based VAE for Dexed preset interpolation; SPINVAE-2 enables gradient backpropagation through the synth
- **Neural Proxies for Sound Synthesizers** (arXiv 2025) — perceptually informed preset representations; directly relevant to the perceptual region vocabulary in our profiles
- **MicroMusic** — audio sample → Vital preset using ML parameter optimization
- **Vital AI preset generators** (community, 2024–2025) — text-to-preset tools for Vital, demonstrating LLM viability for this task
- **serum-preset-packager** — open source CLI for Serum2 ↔ JSON round-trip (Python + TypeScript)
- **SerumPresetGenerator** (C#) — clean-room implementation of the original Serum `.fxp` format

The gap this project fills: a **profile-based, perceptually grounded, multi-synth pipeline** that covers generation, analysis, and modification — and that ultimately converges with the modular synthesis work in GAD into a unified natural-language-to-synthesis pipeline.

---

## Notes for Future Claude Instances

- **Read the Synth Profile before generating anything.** Without the profile, generation produces neutral, uninspired presets. The profile is the project's reliability surface — the same role the module registry plays in GAD.
- **Preset analysis is the fastest path to a better profile.** Analyze 10–20 existing presets before writing perceptual regions. The vocabulary should emerge from listening, not be imposed from theory.
- **The modulation matrix is the hardest part.** For every synth. Modulation routing is where personality lives. A preset with correct tonal parameters but flat modulation is a sketch, not a sound. The modulation map in the profile is load-bearing.
- **Keep the synth targets separate.** A Vital preset creator and a Wavetable preset creator are independently valuable. Don't conflate them into a single abstraction until Stage 4's Profile Generalizer concept is mature enough to justify it.
- **Depth over coverage.** Three synths with complete profiles are more useful than eight synths with skeletal ones.
- **The analysis track teaches generation.** When something generates badly, analyze the failure by asking: what did the profile say this parameter sounds like? If the profile said nothing, that's where to add perceptual regions.
