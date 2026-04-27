---
title: "Generative Sample Libraries"
type: project
pillars: [creation, tools, philosophy]
born: 2026-04
last_activated: 2026-04
stage: seed
confidence: proposed
energy: high
links:
  - target: "[[Crystal Synthesizer]]"
    type: emerged-from
    label: crystallized-from
  - target: "[[Generative Audio Devices]]"
    type: couples-with
    label: eventual-convergence
  - target: "[[Generative Preset Development]]"
    type: couples-with
    label: content-meets-configuration
forward_vector: "I will become a pipeline that generates complex multisampled instruments and wavetables from a single prompt, deployable across all major sampler and wavetable destinations."
---

# Generative Sample Libraries

A proposal and development plan for expanding our audio prototyping capability — pioneered in the Crystal Synthesizer — into full multisampled playable instruments and custom wavetables. The goal: a single prompt generates a complete, deployment-ready sample library or wavetable set that works across all major destinations.

This project runs parallel to [[Generative Audio Devices]] and anticipates eventual convergence: the generative devices project builds the instrument shells; this project generates the sonic content that fills them.

---

## Industry Standards Brief

### Part I: Sampled Instrument Formats

Sampled instrument formats divide cleanly into open and proprietary camps, with the open camp being the practical target for generated content.

#### SFZ — The Universal Open Standard

SFZ is a plain-text format that maps WAV (or FLAC, OGG) files to keyboard regions, velocity layers, and articulation round-robins. A `.sfz` file is human-readable — you can open it in any text editor and see exactly what is mapped where. Because it is royalty-free and widely supported, SFZ is the primary target for generated sample libraries.

**What an SFZ file contains:**
- `<group>` and `<region>` blocks defining key ranges (`lokey`/`hikey`), velocity ranges (`lovel`/`hivel`), and the sample file path
- Envelope parameters (attack, decay, sustain, release) as plain opcodes
- Loop points, pitch tuning, filter and amplifier modulation — all as text opcodes
- Round-robin sequencing (`seq_position`, `seq_length`) for realistic articulation

**Key SFZ opcodes for our work:**
```
<region> sample=ruby_C3.wav lokey=C3 hikey=B3 pitch_keycenter=C3
         loop_mode=loop_continuous loop_start=4096 loop_end=44100
         ampeg_attack=0.001 ampeg_decay=1.2 ampeg_sustain=80 ampeg_release=2.0
```

**SFZ players and hosts (all free or built-in):**
- sforzando (free, standalone + VST, by Plogue) — the reference implementation
- ARIA Engine (underlying sforzando)
- Surge XT — built-in SFZ support
- LinuxSampler — open source, high-performance
- sfizz — open source SFZ library (LGPLv2)
- Many DAWs natively: Reaper, Bitwig

**Verdict:** SFZ is our primary format target. It is text-based, meaning we generate it as a string from Python — no binary encoding needed. The audio files are plain WAV.

---

#### DecentSampler — The Best Distribution Format

DecentSampler (`.dspreset` / `.dslibrary`) is the ideal format for distributing instruments to a general audience. The player is free across all platforms (VST, VST3, AU, AAX, CLAP, standalone) and the format is XML — fully human-readable and programmatically generatable.

A `.dslibrary` file is simply a ZIP containing the `.dspreset` XML and the WAV files. The format supports UI skinning, custom controls, and groups — you can ship a complete instrument with a designed interface.

**Key XML structure:**
```xml
<DecentSampler>
  <ui width="812" height="375">
    <tab name="main">
      <labeled-knob label="Attack" type="float" minValue="0" maxValue="4" value="0.01"/>
    </tab>
  </ui>
  <groups>
    <group>
      <sample path="Samples/ruby_C3.wav" rootNote="60" loNote="57" hiNote="62"
              loVel="0" hiVel="127" loopStart="4096" loopEnd="44100"/>
    </group>
  </groups>
</DecentSampler>
```

**Verdict:** DecentSampler is our secondary target and the format for instruments intended for student use. It pairs perfectly with the Four Pillars educational model — generate a crystal synthesizer bank and students can load it immediately in a free plugin.

---

#### SoundFont SF2 — Legacy but Universal

SF2 is a monolithic binary format (RIFF architecture) that packages audio and synthesis parameters in a single file. It is older (early 1990s, E-mu Systems) but universally supported — every DAW, hardware sampler, and mobile synth app reads SF2.

The format includes loop points, envelopes, LFOs, and MIDI key mapping baked in. It is more complex to generate (binary RIFF structure) but Python libraries exist for reading and writing it. ConvertWithMoss can convert between SFZ and SF2, so generating SFZ first and converting is a viable path.

**Verdict:** SF2 via conversion from SFZ, not direct generation — at least initially.

---

#### Kontakt NKI — Proprietary, Not a Target

Kontakt NKI is Native Instruments' proprietary format. Authoring requires the paid full version of Kontakt. While Kontakt is the industry standard for professional sample libraries, it is not a viable target for programmatic generation without licensing commitments. We note it for completeness but do not target it.

---

#### ConvertWithMoss — The Universal Converter

ConvertWithMoss (open source, Java, free) converts between: WAV folders, SFZ, SoundFont 2, NKI (read-only), Bitwig Multisample, Korg wavestate/modwave, and more. With Maschine support added in 2025. This tool means that generating SFZ correctly gives us a conversion path to nearly every other format.

---

### Part II: Wavetable Formats

Wavetable synthesis stores one full cycle of a waveform at each table "frame" — the synth sweeps through frames to create motion. The key parameters across all formats are frame size (samples per cycle) and frame count (number of positions in the table).

#### Serum/CLM Format — The Universal Wavetable Standard

The de facto standard. A WAV file with a custom `clm ` chunk that identifies it as a wavetable and specifies the frame size. The CLM chunk is a 4-byte identifier + 4-byte size + ASCII metadata string containing:

```
<!-" + cycle_size + " " + interp_mode + " " + vendor + " -">
```

**Specifications:**
- 2048 samples per frame (fixed for Serum compatibility)
- Up to 256 frames per wavetable
- A full 256-frame table: 524,288 samples
- 32-bit float recommended for quality
- The CLM chunk is written after the `fmt ` and `data` chunks in standard WAV RIFF structure

**Reads CLM format:** Serum, Vital, Surge XT, Phase Plant, Arturia Pigments, UVI Falcon, and most modern wavetable synths.

**Verdict:** Primary wavetable target. The CLM chunk is about 30 bytes of binary metadata prepended to a standard WAV — entirely generatable from Python using `struct`.

---

#### Ableton Wavetable Synth — Simple WAV

Ableton's Wavetable synth accepts user wavetables dragged into the oscillator visualization area.

**Specifications:**
- Mono WAV, 16-bit
- 1024 samples per frame
- Reads up to 256 frames (first few seconds of audio)
- No metadata chunk required — frame boundaries are implicit

**Verdict:** The easiest format to generate: a plain WAV with 1024-sample cycles concatenated. No special encoding. Secondary target for any wavetable we generate.

---

#### Surge XT .wt — Open Binary Format

A lightweight binary format used by Surge XT. Frame size must be a power of 2 (64, 128, 256, 512, 1024, 2048). Documented in the Surge GitHub repository (`surgedata/wavetables/wt fileformat.txt`).

**Verdict:** Worth supporting eventually, particularly given our RNBO/Surge XT workflow. Low priority for now since Surge XT also reads CLM WAV files.

---

#### Single-Cycle Waveforms

At the simplest end: a single WAV file containing exactly one cycle of a waveform. Used in many hardware instruments (Korg wavestate, modwave, Ensoniq-style hardware), Eurorack oscillators, and as source material for building full wavetables. Our synthesized crystal modes produce ideal source material for this.

---

## Capability Assessment

### What I Can Generate Now

**Audio:**
- WAV files from Python (numpy + scipy.io.wavfile): ✅ proven in Crystal Synthesizer prototyping
- Any bit depth (16/24/32-bit float), any sample rate
- Stereo or mono
- Mathematical synthesis of any complexity: additive partials, FM, physical models, filtered noise

**Sampled instrument metadata:**
- SFZ: ✅ — it is plain text. I can generate a complete SFZ instrument as a Python string, covering key mapping, velocity layers, loop points, envelopes
- DecentSampler XML: ✅ — standard XML generation, well-documented API
- SF2: via ConvertWithMoss conversion from SFZ (indirect path)

**Wavetable formats:**
- Serum/CLM WAV: ✅ — requires writing a WAV file with a custom `clm ` RIFF chunk using Python `struct`. The math is straightforward; I need to write and test the chunk packing code
- Ableton Wavetable: ✅ — simplest case, plain concatenated WAV
- Single-cycle WAV: ✅ — trivial

**Loop point detection:**
- Automatic zero-crossing loop point detection: ✅ — findable in numpy, requires a small utility function
- Crossfade loop generation: ✅ — math is straightforward, needs implementation

### What Requires Development

**SMPL chunk for WAV loop points:** Most professional samplers expect loop point data in the WAV file's `smpl` chunk, not just in the SFZ/DecentSampler XML. Writing a `smpl` chunk requires binary RIFF packing — doable in Python `struct`, needs implementation and testing.

**Automatic mapping heuristics:** Deciding how many samples across the keyboard (velocity layers, round-robins, key zones) and where to place them requires judgment. We need to build opinionated defaults and make them configurable.

**Quality testing pipeline:** Generating audio is one thing; generating audio that sounds right when stretched across the keyboard by a sampler requires attention to tuning (fundamental frequency accuracy), loop transparency, and timbral consistency across note ranges.

**CLM chunk binary packing:** The Serum CLM chunk format is documented but requires careful binary struct writing. First implementation will need verification against a known-good Serum wavetable.

---

## Development Plan

### Phase 1 — Crystal Synthesizer SFZ Multisample (Proof of Concept)

**Goal:** Generate a playable Crystal Synthesizer instrument in SFZ format from the phonon mode ratios we already have.

**What we build:**
- Python function: `synthesize_crystal(crystal_name, midi_note, duration, sample_rate)` → WAV file
- Loop point detector: finds a clean sustain loop in the synthesized audio
- SFZ generator: maps the WAV files across the keyboard, sets envelopes from crystal decay parameters
- Batch runner: generates samples at 6–8 key points across the keyboard (C1, C2, C3, C4, C5, C6, C7), names files systematically, writes the SFZ

**Output:** A folder containing `crystal_ruby.sfz` and `Samples/ruby_C1.wav` through `ruby_C7.wav`. Opens immediately in sforzando.

**Palace value:** This is also the first live test of the Crystal Synthesizer's timbral hypotheses. Playing a polyphonic chord through the SFZ instrument answers questions we can't answer in a monophonic Gen~ patch.

**Teaching value:** Demonstrate that the same physics that runs in Gen~ can be deployed as a playable instrument — same structure, different material. A natural Stage 1.5 or standalone episode between Crystal Synthesizer stages.

---

### Phase 2 — Crystal Wavetables

**Goal:** Extract the distinctive partial structure of each crystal lattice system as a wavetable — playable in Serum, Vital, Ableton Wavetable, Surge XT.

**What we build:**
- Frame generator: for each crystal lattice direction (we have 7 Bravais systems), synthesize one full cycle of the combined phonon partial spectrum
- Frame interpolation: between crystal directions, interpolate smoothly to create a 64- or 256-frame wavetable that travels through crystal space
- CLM chunk writer: Python `struct` packing to produce valid Serum-format WAV
- Ableton fallback: same frames written as plain 1024-sample WAV (no CLM chunk)

**Output:** `crystal_bravais.wav` (Serum/Vital/Surge XT format) and `crystal_bravais_ableton.wav`. Each synth's wavetable position sweeps through all 7 lattice systems from cubic to triclinic.

**The deep insight made audible:** Sweeping a wavetable position becomes a traversal through crystallographic symmetry space — from the most symmetric (cubic) to the least (triclinic). This is the phonon dispersion parameter space made performable with a single knob.

---

### Phase 3 — DecentSampler Distribution Format + Loop Quality

**Goal:** Wrap the Crystal Synthesizer multisample into a DecentSampler preset with a designed interface, and build robust loop detection.

**What we build:**
- `smpl` chunk writer: embed loop points directly in WAV files so any sampler reads them
- Loop quality checker: verify loop transparency (detect clicks, spectral discontinuities)
- Crossfade loop generator: for tonal sounds that don't loop cleanly
- DecentSampler XML generator: instrument with UI controls mapped to the physics parameters (crystal type selector, spectral stretch α, output span)
- `.dslibrary` packer: ZIP the preset and samples into a deliverable file

**Output:** `Crystal Synthesizer.dslibrary` — a complete instrument ready for distribution. Students can load it in the free DecentSampler plugin with no other software required.

---

### Phase 4 — The Single-Prompt Generator

**Goal:** A single call generates a fully-specified, multi-format sample library or wavetable set.

**The interface:**
```python
generate_sample_library(
    synthesis_fn=crystal_phonon_synthesis,
    library_name="Crystal Synthesizer — Ruby",
    note_range=(24, 96),           # MIDI range
    sample_points=[36,48,60,72,84],# where to actually record
    velocity_layers=2,             # pp and ff
    round_robins=3,                # for realism
    formats=["sfz", "decentsampler", "sf2"],
    loop_mode="crossfade",
    duration=4.0,                  # seconds per sample
    sample_rate=48000,
    bit_depth=24
)

generate_wavetable(
    frame_fn=crystal_wavetable_frame,
    name="Crystal Bravais Systems",
    frame_count=256,
    frame_size=2048,
    formats=["serum_clm", "ableton", "surge_wt"]
)
```

**What this enables:** From a single conversation — "generate a wavetable of all 7 crystal lattice systems" — to a set of deployment-ready files for 5+ synths and samplers, all mathematically derived from the phonon physics.

**The compounding value:** Every synthesizer project in the palace now has a parallel delivery path. The Neural Granular Synthesizer becomes a granular sample library. The Shepard Tone becomes a wavetable. The Retrospective Delay's timbral signature becomes a convolution impulse response set. The prototyping we do in code becomes the distribution we make available to students and users.

---

### Phase 5 — Convergence with Generative Audio Devices (Future)

This phase is acknowledged but not planned. The Generative Audio Devices project will eventually build the plugin shells — the instruments that play back sample banks and wavetable sets. The current project generates the content those shells will use.

The convergence point: a generated instrument where everything — the shell, the samples, the wavetable content, the preset parameters — is produced by a single generative act. The instrument emerges whole.

**Keep separate until:** Phase 4 of this project is complete and the single-prompt generator is working. At that point, revisit both projects for formal convergence planning.

---

## Format Priority Matrix

| Format | Type | Generation Effort | Destinations |
|---|---|---|---|
| SFZ | Sampled | Low (plain text) | sforzando, Surge XT, Reaper, Bitwig, sfizz |
| DecentSampler | Sampled | Low (XML) | Free DS plugin (all DAWs) |
| SF2 | Sampled | Medium (via ConvertWithMoss) | Universal — every DAW and hardware |
| Kontakt NKI | Sampled | Not feasible | — |
| Serum/CLM WAV | Wavetable | Medium (binary CLM chunk) | Serum, Vital, Phase Plant, Pigments, Falcon |
| Ableton WT | Wavetable | Low (plain WAV) | Ableton Wavetable synth |
| Single-cycle WAV | Wavetable | Lowest | Hardware, Eurorack, any synth |
| Surge XT .wt | Wavetable | Medium (binary) | Surge XT, VCV Rack |

---

## Palace Connections

- **[[Crystal Synthesizer]]** — first implementation target; phonon mode synthesis becomes the sample source
- **[[Shepard Tone Synthesizer]]** — Shepard tones are ideal wavetable source material; frame position sweeps become perpetual-motion oscillators  
- **[[Neural Granular Synthesis]]** — neural synthesis audio becomes a granular sample bank
- **[[Retrospective Delay]]** — timbral signatures of the delay become impulse response sets (an adjacent format category)
- **[[Generative Audio Devices]]** — eventual convergence: this project generates the content; that project generates the shells

---

## Open Questions

- What is the minimum number of samples across the keyboard before a multisample instrument sounds natural? (6 points? 12 points? Depends on timbre consistency.)
- For crystal phonon synthesis specifically: how much does the timbre shift with transposition? If it shifts a lot, we need more sample points and shorter intervals.
- Do wavetable frames synthesized from crystal partial ratios produce musically interesting motion when swept? Or does the spectral structure need additional processing (windowing, phase coherence) to read as intentional?
- When we generate sample libraries for student use, what is the right licensing model? (Our synthesis is original — we own the output.)
