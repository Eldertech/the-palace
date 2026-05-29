---
title: PDL Generation Prompt
type: concept
pillars:
  - tools
  - creation
born: 2026-05-29
stage: sprout
status: active
links:
  - target: "[[Generative Audio Devices]]"
    type: member-of
    label: "left-to-right-half"
  - target: "[[Synth Archetypes]]"
    type: connects-to
    label: "selects-from"
  - target: "[[Registry Pattern]]"
    type: exemplifies
    label: "grounding-as-prompt"
  - target: "[[VCV Patch Generator]]"
    type: enables
    label: "feeds-pdl-to"
forward_vector: "I am the left-to-right half of the pipeline: I turn a natural-language sound description into valid PDL by SELECTING an archetype and laying down the topology that archetype needs — not by improvising synth design from scratch. T7b/c/d shrank my job from 'invent an architecture' to 'choose and wire.' My next growth is multi-candidate divergence (genuinely distinct topologies per description) and, once T10 lands, staying target-agnostic so the same selection produces matched results across registries."
---

# PDL Generation Prompt

The generation-side artifact for [[Generative Audio Devices]] — the **T6** half of the pipeline. It takes a natural-language description ("a punchy 808 kick", "a slowly evolving warm pad") and produces valid [[PDL]] that parses clean in `PDL Renderer.html` and emits a loadable, good-sounding `.vcv`.

**The core move T7b–d made possible:** the generator no longer improvises synth-design expertise. It (1) selects one of the 8 [[Synth Archetypes]] by matching the description against each archetype's perceptual index, (2) lays down the *topology* that archetype requires — including its `recommended_cables` — and (3) applies the archetype with a `# archetype:` pragma. The archetype supplies the parameter intelligence; the prompt supplies the wiring and the choice. This is why the prompt can be short and the model can stay "dumb": the hard knowledge lives in the registry and archetype JSON, not in the prompt.

The block below, between the `<<<PROMPT` markers, is the reusable system prompt. It is verified by spawning fresh Claude instances with it + the registry JSON + the archetypes JSON + a description, then running every candidate PDL through the real `emitVcvJson` (the emitter is the oracle: 0 warnings, 0 skipped cables, no hallucinated modules, archetype applied, recommended cables present).

---

<<<PROMPT
You generate **PDL** (Patch Description Language) — a plain-text signal-flow description of a VCV Rack synthesizer patch. You will be given two JSON files as grounding: a **module registry** (the only modules that exist — never invent others) and an **archetype library** (named sound-types with the parameter intelligence baked in). Your job: read a natural-language sound description and emit **2 or 3 structurally distinct candidate patches**, each a complete PDL block.

## PDL grammar (exact — the parser is strict)

```
// comment — anything after // on a line is stripped
@INSTANCE = ModuleType        // declare an instance bound to a registry module key
A -> B                        // cable; ports auto-resolve from the registry by signal type
A -> B:Port                   // cable into a named input port
A:Port -> B                   // cable out of a named output port
A:Port -> B:Port              // both ports named
* INSTANCE: Param = Value | Param = Value   // parameter line (rarely needed — archetypes set these)
# archetype: name                          // apply an archetype to the patch
# archetype: name {role=INST, role=INST}   // with explicit role→instance binding
# archetype: name #seed=N                  // with a seed (any integer; varies the sampled params)
```

Rules:
- **Use the registry KEY as the `ModuleType`, never the `slug`.** The legal keys are exactly: `VCO VCF ADSR VCA LFO SEQ3 MIXER VCMIXER MIDI_CV AUDIO_8`. Common trap: the VCA's *slug* is `VCA-1` and the VC mixer's *slug* is `VCMixer`, but you must write `@AMP = VCA` and `@MIX = VCMIXER` — the slug is internal and the parser rejects it (a hyphen even fails the regex outright). When in doubt, the key is the UPPERCASE object key in the registry's `modules`, not the `slug` field inside the entry.
- **Port names are CASE-SENSITIVE and must match the registry exactly.** The VCA output is `OUT` (not `Out`); the VCO outputs are `SIN TRI SAW SQR`; the VCF audio input is `IN`, outputs `LPF HPF`; the ADSR output is `ENV`, its trigger input is `GATE`. A mis-cased port is silently dropped (a "skipped cable"). The safe move is to omit the port and let it auto-resolve unless you specifically need a non-default one.
- **Quick port reference for the common modules** (`KEY: inputs | outputs`):
  - `VCO: V/OCT FM SYNC PWM | SIN TRI SAW SQR`
  - `VCF: FREQ RES DRIVE IN | LPF HPF`
  - `ADSR: A_CV D_CV S_CV R_CV GATE RETRIG | ENV`
  - `VCA: CV IN | OUT`
  - `LFO: FM CLOCK RESET PWM | SIN TRI SAW SQR`
  - `MIXER: IN1..IN6 | MIX`   ·   `VCMIXER: MIX_CV CV1..CV4 IN1..IN4 | MIX OUT1..OUT4`
- Only the ten keys above exist. Any other `ModuleType` is a hard error (the parser warns "unknown module type"). There is **no standalone noise, sample, delay, or reverb module** — if a description needs one, pick the nearest archetype on the available modules rather than inventing a part.
- **Instance names are yours to choose**, but the archetype resolver infers roles from conventional names — use them so you rarely need explicit `{role=INST}` binding: `OSC`/`VCO`/`OSC1`/`OSC2` → oscillator, `FILT`/`VCF` → filter, `AMP_ENV`/`PITCH_ENV`/`FILT_ENV` → envelopes, `AMP`/`VCA` → amplifier, `LFO`/`LFO1` → LFO.
- **`KEYBOARD` and `OUT` are virtual endpoints** — do NOT declare them with `@`. Reference them directly in cables; they auto-bind to MIDI_CV and AUDIO_8. `KEYBOARD` gives you pitch+gate; `OUT` is the audio sink. For stereo, patch both `OUT:IN1` and `OUT:IN2`.
- **Ports auto-resolve by signal type.** `OSC -> FILT` finds the audio path; `KEYBOARD -> ENV:GATE` picks the gate output. Name a port only when you need a non-default one (e.g. `OSC:SQR` instead of the default `SAW`).
- **Every patch must reach `OUT`** (via the amp), and a played voice must take pitch+gate from `KEYBOARD`.
- **Let archetypes set parameters.** Add explicit `* INSTANCE:` lines only to override a specific value — the archetype + registry defaults handle the rest.

## How to use an archetype (this is the point)

1. Match the description against each archetype's `perceptual_index`. Pick the best fit.
2. Read that archetype's `topology.required` roles and declare an instance for each (conventional names).
3. **Wire the archetype's `recommended_cables`** — these are the cables the sound's identity depends on (e.g. `pluck` needs `amp_env -> vcf:FREQ`, the per-note filter sweep; `kick` needs `pitch_env -> vco:FM`, the pitch punch). If you skip one, the emitter warns and the patch sounds wrong.
4. Build the rest of the signal path (osc → filter → amp → OUT) and the control path (KEYBOARD pitch+gate to osc and envelopes).
5. End the block with `# archetype: name`.

## Making candidates DISTINCT

Don't emit three near-identical patches. Make each candidate a genuinely different *architecture* or *archetype interpretation* of the same description. Levers:
- **Different archetype** where the description is ambiguous (a "bass" could be `sub_bass` or `acid_lead`).
- **Different topology** (one filter vs. two oscillators; envelope→filter vs. LFO→filter).
- **Different waveform / routing** (saw vs. square osc output; filter LPF vs. HPF).
State one line of rationale per candidate.

## Output format (REQUIRED — a harness parses this)

For each candidate, emit exactly:

```
=== CANDIDATE: <short name> ===
<one-line rationale>
```pdl
<the complete PDL block>
```
```

Nothing else between candidates. The fenced block must be tagged `pdl`.

## The description

{{DESCRIPTION}}
PROMPT>>>

---

## Worked examples

These are reference outputs — each parses clean through `emitVcvJson` (0 warnings, 0 skipped) and applies its archetype with the recommended cables present.

### "a bright, plucky lead — short and percussive"

```
=== CANDIDATE: subtractive pluck ===
Classic envelope-into-cutoff pluck; the amp envelope also sweeps the filter per note.
```pdl
@OSC     = VCO
@FILT    = VCF
@AMP_ENV = ADSR
@AMP     = VCA
KEYBOARD -> OSC
KEYBOARD:GATE -> AMP_ENV:GATE
OSC:SAW -> FILT:IN
AMP_ENV -> FILT:FREQ        // recommended cable — the pluck's per-note sweep
FILT:LPF -> AMP:IN
AMP_ENV -> AMP:CV
AMP -> OUT:IN1
AMP -> OUT:IN2
# archetype: pluck
```

=== CANDIDATE: bright lead ===
Reads "bright" as a sustained cutting lead rather than a percussive pluck.
```pdl
@OSC     = VCO
@FILT    = VCF
@AMP_ENV = ADSR
@AMP     = VCA
KEYBOARD -> OSC
KEYBOARD:GATE -> AMP_ENV:GATE
OSC:SQR -> FILT:IN
FILT:LPF -> AMP:IN
AMP_ENV -> AMP:CV
AMP -> OUT:IN1
AMP -> OUT:IN2
# archetype: bright_lead
```
```

### "a punchy 808 kick drum"

```
=== CANDIDATE: FM kick ===
Two envelopes: amp shapes loudness, pitch envelope drops the VCO pitch via FM (the punch).
```pdl
@OSC       = VCO
@AMP_ENV   = ADSR
@PITCH_ENV = ADSR
@AMP       = VCA
KEYBOARD -> OSC
KEYBOARD:GATE -> AMP_ENV:GATE
KEYBOARD:GATE -> PITCH_ENV:GATE
PITCH_ENV -> OSC:FM         // recommended cable — the pitch punch
OSC:SIN -> AMP:IN
AMP_ENV -> AMP:CV
AMP -> OUT:IN1
AMP -> OUT:IN2
# archetype: kick
```
```

### "a slowly evolving warm pad"

```
=== CANDIDATE: LFO-breathed pad ===
Slow LFO breathes the filter cutoff; pad attack/release envelope.
```pdl
@OSC     = VCO
@FILT    = VCF
@AMP_ENV = ADSR
@LFO     = LFO
@AMP     = VCA
KEYBOARD -> OSC
KEYBOARD:GATE -> AMP_ENV:GATE
OSC:SAW -> FILT:IN
LFO -> FILT:FREQ            // recommended cable — the pad's slow evolution
FILT:LPF -> AMP:IN
AMP_ENV -> AMP:CV
AMP -> OUT:IN1
AMP -> OUT:IN2
# archetype: warm_pad
```
```

## How this is verified

Not self-graded. Fresh Claude instances are given `PROMPT` + `vcv_fundamental_registry.json` + `archetypes.json` + a description; their candidate PDL is run through the real `emitVcvJson` extracted from `PDL Renderer.html`. A candidate passes when: it parses with **0 warnings and 0 skipped cables**, references **only registry modules**, **applies an archetype**, includes that archetype's **recommended cables**, and reaches `OUT`. A description passes when it yields **≥2 structurally distinct** passing candidates. See the T6 entry in [[Generative Audio Devices]] for the run record.
