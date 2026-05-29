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

## Why this is a knowledge-representation move, not an encoding move

The recurring shape of the parent project: the hard problems keep turning out to be questions of *what structured knowledge the data layer must carry so the generator can stay dumb* — port types, virtual endpoints, perceptual regions, and now archetypes are all the same move. Archetypes are the largest instance of it: essentially typed links between modules weighted by musical co-dependency — the palace's own link ontology showing up inside the synthesis pipeline. That is why this is a `concept` and not just a config file.
