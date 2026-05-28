---
title: "Ableton Wavetable — Stage 0 Reconnaissance"
type: practice
pillars:
  - tools
born: 2026-05-27
stage: sprout
status: active
parent: "[[Generative Preset Development]]"
---

# Ableton Wavetable — Stage 0 Reconnaissance

Cycle 2 of the Generative Preset Development steward. Loudon granted WAVETABLE-FIRST in cycle 1; this cycle opened the format and produced the first parameter-vocabulary draft.

## What I did this cycle

1. **Located 270 factory Wavetable presets** in `/Applications/Ableton Live 12 Suite.app/Contents/App-Resources/Core Library/Devices/Instruments/Wavetable/`, organized across 12 musical categories (Synth Pad 31, Synth Lead 44, Synth Keys 44, Bass 45, Ambient & Evolving 17, Synth Rhythmic 29, Brass 9, Mallets 12, Percussive 8, Guitar & Plucked 7, Effects 21, Piano & Keys 3).
2. **Decompressed 14 representative presets** — one per category plus the factory default and a second Synth Pad — saved to `decompressed-samples/` as XML. Each `.adv` is gzipped XML, ~72KB inflated. The default is 71585 bytes.
3. **Wrote `extract_profile.py`** that walks the XML and emits a structured profile JSON.
4. **Confirmed the Voice_* parameter set is identical across all 14 presets** — 96 unique parameter names, no schema drift. The architecture really is fixed; this is exactly what the profile concept depends on.
5. **Produced `profile-draft/wavetable_profile_v0.1.json`** — 84 continuous parameters, 5 single-value enums, 52 modulation target rows, 13 modulation source slots, 13 architectural sections (oscillator_1, oscillator_2, sub_oscillator, filter_1, filter_2, envelope_amp, envelope_2, envelope_3, lfo_1, lfo_2, unison, global, modulators_global).

## What the profile knows now

- **Format**: `.adv` is gzipped XML, root `<Ableton MajorVersion="5" MinorVersion="12.0_12402">`, instrument root `<InstrumentVector>`. SchemaChangeCount=1.
- **Topology**: 2 wavetable oscillators (each with its own 2-slot Effects with EffectMode selector), 1 sub-oscillator (with Tone parameter), 2 filters (with serial/parallel/split routing via `Voice_Global_FilterRouting`), 3 envelopes (Amp + Env2 + Env3, each with full ADSR + Initial/Peak/Sustain/Final values for Env2/Env3), 2 LFOs (with Type/Amount/Shaping/PhaseOffset/Rate/SyncedRate/AttackTime), unison (Amount/Mode/VoiceCount), global Glide + Transpose.
- **No post-FX chain** in the instrument itself — confirmed absence of any `FxSlot` elements. Any FX live in the surrounding rack, not in the synth.
- **Parameter shape**: every full-form parameter has `<Manual Value="…">`, `<MidiControllerRange><Min/><Max/></MidiControllerRange>`, plus `AutomationTarget` and optionally `ModulationTarget` ids. This is the regular surface for both reading and writing.
- **Modulation matrix**: a target-major matrix. Each `ModulationConnectionsForInstrumentVector` block names one target parameter and carries 13 `ModulationAmounts.0`..`.12` slots — the source columns. 52 targets × 13 sources = 676 mod-amount cells per preset.

## What the profile does NOT know yet

- **Source slot identities**. I have a candidate mapping (Env2, Env3, LFO1, LFO2, MIDI-Note, Velocity, Aftertouch, PitchBend, ModWheel, Random ×2, Constant ×2) inferred from the Ableton manual and Aqueous Pad's usage pattern (slots 0–5 heavily used, 6/10/12 empty), but it is not ear-confirmed. The 13-slot count is exact; the 1:1 mapping needs verification.
- **Enum semantics**. `Voice_Filter1_Type` has range 0–4 (five filter types); `Voice_Oscillator1_Effects_EffectMode` has discrete integer modes; `Voice_Modulators_Lfo1_Shape_Type` is 0–4. The Ableton manual names each value but I have not yet cross-referenced.
- **Perceptual regions**. Every parameter's `perceptual_regions` field is `null`. That is the core Stage 0→Stage 1 work: take each high-leverage parameter and label its perceptual bands by ear. The profile is structurally complete but musically empty.
- **Write-path validation**. I have a reader, not a writer. The round-trip — decompress, mutate one parameter, recompress, load in Live, confirm — has not been run.

## Files produced this cycle

- `decompressed-samples/*.xml` — 14 XML preset files
- `extract_profile.py` — the reconnaissance script (re-runnable; idempotent)
- `profile-draft/wavetable_profile_v0.1.json` — the first-draft Synth Profile (~52KB)
- `RECONNAISSANCE.md` — this file

## Forward vector for next cycle

The profile is structurally there. What it lacks is the musical layer. Three concrete options for what to open next, in roughly the order I think they'd cash out the forward vector:

1. **PERCEPTUAL-BY-EAR** — pick the four highest-leverage parameters (filter cutoff, filter resonance, amp envelope attack, LFO 1 rate) and audition each at a half-dozen settings. Hand-label the perceptual bands. This is the move that makes generation actually sound intentional rather than neutral.
2. **WRITE-PATH-PROOF** — implement the writer side: read a preset, change one parameter, recompress, drop into the Ableton User Library, load it, confirm audibly. Smallest end-to-end pipeline. Without this, generation is theoretical.
3. **SOURCE-SLOT-AUDIT** — confirm the 13 modulation source slot identities by crafting a preset that routes only one source to one target and observing which slot index lights up. Settles the modulation-matrix vocabulary so the profile's `source_slot_meaning` field can move from candidates to confirmed.

Each is a coherent ~one-cycle move. The trickster ask in this cycle proposes choosing one (or naming a different fourth).
