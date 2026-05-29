---
title: Synth Archetypes
type: concept
pillars:
  - creation
  - tools
born: 2026-05
stage: seed
forward_vector: "I keep pushing musical identity down into the static data layer — naming what a kick, a pad, a pluck *are* as constellations of parameter settings, so the generation layer can stay dumb and still sound like something. I will keep growing the vocabulary as the registry grows (a noise source unlocks hats and noise-hits), keep the constraint kinds honest (add soft tolerances only when the ear demands them), and keep myself target-agnostic so the same `warm_pad` survives the jump to a second synthesis target. My open question: when an archetype is chosen, how far should its cloud propagate *outward* through the signal graph — does `pluck` get to tell a downstream delay to keep its feedback short? That contextual propagation is the layer where musicality actually lives, and I don't reach it yet."
links:
  - target: "[[Generative Audio Devices]]"
    type: couples-with
    label: "params-layer-of"
  - target: "[[Registry Pattern]]"
    type: mirrors
    label: "archetype-as-registry"
  - target: "[[Generative Preset Development]]"
    type: enables
    label: "shared-archetype-vocabulary"
---

# Synth Archetypes

A sibling registry to the module registry, keyed by **musical identity** rather than module identity. Where [[Registry Pattern]]'s module registry answers *what connects to what*, an archetype answers *what does it sound like when it does* — and it answers holistically, because a "kick" is not "VCO + VCA with fast decay" but a co-dependency: the pitch envelope's decay matching the amp envelope's decay, the oscillator set low, no audio-rate FM. These constraint bundles only make sense across modules at once. The data lives in `archetypes.json`; this entry is the *why*.

The load-bearing discipline: **an archetype is a param-cloud projection onto existing topology — it never injects modules.** Topology decisions stay in PDL; archetype decisions stay in params. If the patch has no second envelope, `kick`'s `pitch_env` role simply goes unfilled — the resolver warns and continues, the patch still loads (without the pitch sweep). This is what keeps the three-layer architecture intact: pushing a *params* layer in without letting it rewrite the *signal-flow* layer.

## The schema

Each archetype declares four things:

- **`topology.roles`** — abstract roles mapped to the module *type* expected to fill them (`amp_env: ADSR`, `pitch_env: ADSR`, `vco: VCO`, `vcf: VCF`, `amp: VCA`, `lfo: LFO`). Roles are how an archetype stays instance-name-agnostic.
- **`topology.required`** — the subset of roles that must be present for the archetype to mean anything. Missing optional roles are skipped silently; missing required roles warn.
- **`params`** — per role, a map of param name → **region name** drawn from the [[Generative Audio Devices]] registry's perceptual vocabulary (`A: instant`, `D: snappy`, `FREQ: sub`). Regions, not numbers, so the file reads like synth-design intent instead of a magic-number table.
- **`constraints`** — cross-module couplings that the per-param sampling can't express alone.

A top-level `role_conventions` map lets the resolver infer roles from instance names (`AMP_ENV`/`PITCH_ENV`/`OSC`/`FILT`/`AMP`/`LFO` …) so the common case needs no explicit binding.

## The three constraint kinds

Soft tolerances ("within ±10% of") were cut for v1 in favor of three concrete, testable kinds — they cover the couplings that are actually load-bearing by ear, and each is a single deterministic operation applied *after* the per-param sampling pass, in declaration order:

- **`copy`** — `to` takes `from`'s sampled value verbatim. This is `kick`'s pitch-decay/amp-decay coupling: the punch *is* the two decays landing together, so they can't be sampled independently.
- **`offset`** — `to = from + delta`. For couplings that want a fixed interval (a detuned second oscillator, an envelope deliberately a touch longer).
- **`proportional`** — `to = from * factor`. For couplings that want a ratio rather than a fixed gap.

Constraints run last so they always win over the independent sample, and their result is clamped back into the target param's native range.

## The one-to-many principle, applied to parameters

The signal-flow pipeline embraced one description → many topologies. Archetypes do the same on a different axis: **one archetype → a *distribution* of parameter sets, not a fixed one.** The archetype constrains the region; a seed picks the point inside it. Re-generation becomes a feature (a knob the user *wants* to turn) instead of the "every kick sounds identical" trap.

The seed reaches a concrete value through one deterministic function. In symbols and in words:

$$pos = \frac{\text{hash}(\,seed,\ archetype,\ instance,\ param\,)}{2^{32}}$$

$$\text{position-in-region} = \frac{\text{hash of (seed, archetype name, instance id, param name)}}{\text{maximum 32-bit unsigned integer}}$$

That `pos ∈ [0,1)` is fed to `sampleRegion(spec, region, pos)` — the seam [[Generative Audio Devices]]'s T7a phase 2 reserved on purpose, one layer ahead, so the archetype resolver could insert without rewriting the emitter. Hashing all four coordinates (not a running counter) makes each param's position independent of what else was resolved, so the same seed always produces a byte-identical patch — the determinism the Specialist's audition leans on.

Emit precedence is the one semantic rule worth restating: **`explicit * line > archetype param > registry default`.** Archetype params are overlaid *before* the PDL `*` lines are processed, so a hand-written value always overrides the archetype. Without that rule the archetype stops being a *starting position* and becomes a cage.

## What the first audition taught (v0.1 → v0.2)

Loudon loaded the three v0.1 audition patches (kick, warm_pad, pluck) in Rack, found them *good starting points* but not yet usable, and saved hand-refined versions. Diffing his refinements against the emitted patches surfaced one root cause behind most of the symptoms, and it reshaped the schema:

- **Static knobs without modulation depth are silent motion.** v0.1 set destination knobs (`VCF.FREQ = open`, `LFO.FREQ = subtle`) but left the *attenuverter* params (`VCF.FREQ_CV`, `VCO.FM_DEPTH`) at their zero defaults. So the pad's LFO was cabled to the cutoff and moved nothing; the pluck's envelope had nowhere to push. Loudon raised `FREQ_CV` to ≈0.38 (pluck) and ≈0.03 (pad). **An archetype must set how much its modulation sources are allowed through, not just where they point.** This is the v0.2 headline: param clouds now include depth params, calibrated from his values.
- **An archetype's identity can depend on a cable it cannot supply.** The "pluck" *is* the per-note filter sweep — but archetypes are param-cloud-only by design (they never modify topology), and the v0.1 pluck topology had no envelope→cutoff path, so `# archetype: pluck` was a no-op on the thing that makes it a pluck. v0.2 answer: archetypes declare **`recommended_cables`** and the emitter *warns* (the T12 "make failure loud" move) when an identity cable is absent — without crossing the line into injecting it. The cable stays a topology (PDL/T6) decision; the archetype just refuses to be silent about needing it.
- **Region values must distinguish *tuning* from *played pitch*.** `FREQ = sub` emitted a −35-semitone static offset that fought the keyboard — a MIDI-tracked voice wants to sound where you play. Loudon reset base FREQ to 0 on kick and pad. v0.2 pins base oscillator FREQ to keyboard-tracking (0) and expresses "sub"/"low" through octave context and envelope, not a fixed multi-octave offset stacked on incoming pitch.
- **Some params should be pinned, not sampled.** Percussive sustain should be exactly 0 (he zeroed both kick and pluck); identity-critical values shouldn't wander with the seed. v0.2 lets a param-cloud value be **either** a region name (seed-sampled — the expressive axis) **or** a numeric literal (pinned — the identity axis). The seed now varies what *should* vary and leaves the rest fixed.

**Deferred, captured here so the next builder doesn't re-discover them:**
- **Polyphony is an unrepresented axis.** His warm_pad was renamed "should be polyphonic!". `MIDI_CV` models one channel; VCV's poly lives in the patch `data` blob the emitter writes as `{}`. Pads force the question — does polyphony live in the registry, in PDL, or in the archetype? Left open for a dedicated move.
- **Curve-aware sampling is *not* the fix for fast envelopes.** Tempting to blame the kick's near-zero decay on linear sampling ignoring the params' `curve` hint — but VCV's ADSR time knobs are already log-mapped internally, so a linear position in the knob's [0,1] space is already perceptually spaced. The v0.1 click came from region *choice* (`snappy` = [0, 0.2] is genuinely near-instant), not from the sampler. v0.2 fixes it by giving the kick decay actual body, not by touching `sampleRegion`.
- **Registry param-count gap.** VCV re-saved the patches with 8 VCO param slots and 7 VCF slots; the registry models 6 each. The trailing slots default to ~0 and none are modulation params the archetypes touch, so v0.2 is unblocked — but the registry's `verification` claim is now known-incomplete and wants a careful source re-read (a summarizing web-fetch gave contradictory indices and was rejected; the bytes Loudon's Rack wrote are the trustworthy witness).

## Why this is a knowledge-representation move, not an encoding move

The recurring shape of the parent project: the hard problems keep turning out to be questions of *what structured knowledge the data layer must carry so the generator can stay dumb* — port types, virtual endpoints, perceptual regions, and now archetypes are all the same move. Archetypes are the largest instance of it: essentially typed links between modules weighted by musical co-dependency — the palace's own link ontology showing up inside the synthesis pipeline. That is why this is a `concept` and not just a config file.
