---
title: "Generative Audio Devices — handoff"
born: 2026-05-29
links:
  - target: "[[Generative Audio Devices]]"
    type: connects-to
    label: "handoff-for"
forward_vector: "I carry the kickoff design decisions for T7b — the archetype library and seeded resolver — into a Claude Code build session, waiting to be picked up and archived once the move is caught."
session_thread: "Drafted from a Cowork session that closed T7a phase 2 (registry v2.3) and a follow-on SEQ3 reconciliation (v2.4), then audited progress and scoped T7b — 'the most musically consequential single task in the whole project' per the entry."
---

# Handoff: Generative Audio Devices

## Move

This handoff carries the **kickoff design decisions for T7b — archetype library and seeded resolver**: which 8 archetypes to ship in v1, how they're shaped, the PDL pragma syntax for applying one, the resolver's precedence rules, and how the verification + audition + Specialist-first-job fold into a single session. The build itself happens in Claude Code; this handoff exists so that work starts with the decisions already made and only the ones genuinely worth re-debating left open.

## Why this move matters

T7b is **the** musically consequential task in the project — the project entry says so directly: *"probably the most musically consequential single task in the whole project."* Phase 2 ended the "every preset sounds neutral" problem at the vocabulary level (`* VCF: CUTOFF = dark`); T7b ends it at the *whole-instrument* level — `# archetype: kick` should produce a patch that audibly *is* a kick on first load, not a structurally-correct neutral patch the user then has to season by hand. It also unblocks T6: the project file is explicit that once T7b exists, T6's job shrinks from *"description → full PDL"* to *"description → archetype + topology hints,"* which is a tractable prompting problem instead of a synth-design-from-scratch problem.

The mechanical leverage is also real and was set up on purpose. Phase 2 closed with `sampleRegion(spec, regionName, pos)` taking an optional `pos ∈ [0,1]` that phase 2 itself never uses (it passes nothing and gets the deterministic midpoint). That argument exists because T7b is the layer that uses it. The seeded resolver passes a per-archetype-per-instance-per-param `pos` derived from `seed` and the resolver gets within-region variance for free, without touching the emitter seam. *Same pattern as T12→phase 1→phase 2: leave a named seam where the next layer wants to insert.*

This session is also where three loose ends from phase 2 close naturally — see **Calibrations**.

## Tried and rejected

- **The `@@ INSTANCES -> archetype: name` per-line syntax** from the roadmap — rejected for v1. Invents a new sigil for a problem solvable in the existing comment surface, and the role-binding it offers can be expressed inside a simpler top-level pragma. Keep `@@` open as a future option if a real ambiguity-cost case appears.
- **Including `noise_hit` and `hat` in v1** — deferred. Fundamental ships no noise source, so these archetypes would only resolve cleanly on patches that pull in a third-party plugin the registry doesn't yet cover. Better to land 8 archetypes that work on the verified registry than 10 that semi-work. Revisit when the registry gains a noise module (or first via `bell` using FM-as-noise-substitute).
- **Doing T6 before T7b** — rejected. The project entry explicitly reorders: T7b *shrinks* T6's scope, so T6 done first is T6 done twice.
- **Soft-tolerance cross-module constraints** (e.g. "pitch_env.D should be within ±10% of amp_env.D") — cut for v1 in favor of three concrete `kind`s: `copy`, `offset`, `proportional`. `kick`'s pitch-decay/amp-decay coupling is `copy`. Soft tolerances belong to a later iteration once we know which constraints are actually load-bearing by ear.
- **Letting archetypes inject modules into the PDL** — rejected as load-bearing. Archetypes are *param-cloud projection onto existing topology*, not topology modification. If the PDL has no second ADSR, `kick`'s `pitch_env` role goes unfilled, the resolver warns and continues, the patch still loads (without pitch sweep). This preserves the three-layer architecture: topology decisions stay in PDL, archetype decisions stay in params.

## Current state

- Phase 2 is closed cleanly (registry v2.3, `verify_t7a_phase2.js` 21/21). SEQ3 reconciliation followed in v2.4 with a behavior-affecting STEPS-index bug fix. Both committed (`b3188c0`, `180fe2e`).
- The `sampleRegion(spec, regionName, pos)` seam is live in `PDL Renderer.html` at line 623. Phase 2's emit-call (line ~722) passes no `pos` and gets the midpoint. T7b's resolver is the first `pos`-passing caller.
- The active handoff path (`Generative Audio Devices/Generative Audio Devices — handoff.md`) is free; the previous handoff is archived at `Generative Audio Devices/Archive/Generative Audio Devices — handoff 2026-05-26.md`.
- **Two small entry drifts to fix as session warm-up** (also flagged in the last progress check): the entry's `forward_vector` still says *"registry is at v2.3"* but the file is at **v2.4** since the SEQ3 reconciliation. And the "Done recently" list has the v2.3 phase-2 bullet but no separate entry for the v2.4 SEQ3 reconciliation (which deserves its own — the STEPS-index correction is behavior-affecting). One paragraph patch and one new bullet.
- **The VCV Patch Generator Specialist (`Shop/VCV Patch Generator.md`) is still a pure stub** (`last_tested:` empty, no `Artifacts/Shop/VCV Patch Generator/` bundle). The T7b kick audition is its first Piece-tier job; running it that way fills the bundle (recipe + determinism artifact + `test-plan.md` instead of TODO) in the natural flow of the session rather than as a separate cleanup.

## Next move

Open the session by clearing the two entry drifts (one minute each), then build T7b in this order:

**1. Schema (`archetypes.json` at palace root).** Carry these shape decisions intact:

```json
{
  "version": "0.1",
  "archetypes": {
    "kick": {
      "perceptual_index": ["kick", "drum", "punchy", "808", "thump", "boom"],
      "topology": {
        "roles":    { "amp_env": "ADSR", "pitch_env": "ADSR", "vco": "VCO", "amp": "VCA" },
        "required": ["amp_env", "vco", "amp"]
      },
      "params": {
        "amp_env":   { "A": "instant", "D": "snappy",  "S": "plucked", "R": "gated" },
        "pitch_env": { "A": "instant", "D": "snappy",  "S": "plucked", "R": "gated" },
        "vco":       { "FREQ": "sub" }
      },
      "constraints": [
        { "kind": "copy", "from": "pitch_env.D", "to": "amp_env.D",
          "label": "pitch-fall decay matches amp decay (the kick punch)" }
      ]
    }
  }
}
```

**The v1 archetype list (ship all 8):**

| name          | core idea                                                        | requires                |
|---------------|------------------------------------------------------------------|-------------------------|
| `kick`        | sub VCO, snappy amp env, pitch env drops fast (copies amp.D)    | ADSR×2, VCO, VCA        |
| `sub_bass`    | low VCO, dark VCF, medium amp env, low resonance                 | VCO, VCF, ADSR, VCA     |
| `warm_pad`    | pad attack/release, dark→open VCF, slow LFO on cutoff            | VCO, VCF, ADSR, LFO, VCA|
| `pluck`       | instant attack, short decay, plucked sustain, dark VCF           | VCO, VCF, ADSR, VCA     |
| `bright_lead` | fast attack, full sustain, open/bright VCF, present resonance    | VCO, VCF, ADSR, VCA     |
| `acid_lead`   | pluck env, screaming resonance, sweep-friendly VCF               | VCO, VCF, ADSR, VCA     |
| `stab`        | instant attack, short release, held sustain, present VCF         | VCO, VCF, ADSR, VCA     |
| `drone`       | full sustain, slow LFO on FREQ for detune, open VCF              | VCO, LFO, VCA           |

`kick`, `sub_bass`, `warm_pad` are spec'd-out anchors for the file; the other five follow the same shape — use phase 2's region vocabulary directly, don't reach for new names.

**2. PDL pragma — proposed syntax (confirm with Loudon at start of session).** Two recognized forms in v1:

```
# archetype: kick                               (convention-based role inference)
# archetype: kick {amp_env=AMP1, pitch_env=AMP2}   (explicit role binding)
# archetype: warm_pad #seed=42                     (optional seed, either form)
```

Convention-based inference uses instance-name conventions: `AMP_ENV`, `PITCH_ENV`, `FILT_ENV`, `MOD_ENV` → ADSR roles; `AMP`/`VCA` → amp role; `OSC`/`OSC1`/`OSC2`/`SUB` → vco/sub-vco roles; `FILT`/`VCF` → filter role; `LFO`/`LFO1`/`LFO2` → LFO role. When PDL uses unconventional names or has ambiguity the resolver can't break, it warns and asks for the explicit `{role=INST}` form.

**3. Resolver (`resolveArchetype` in `PDL Renderer.html`, next to `sampleRegion`).** Signature: `resolveArchetype(archetype, seed, instanceTypes) → { [instanceId]: { [paramName]: number } }`. Behavior:
- Validate `archetype.topology.required` roles map to present instances; warn-and-skip optional roles.
- For each `(role, param, regionName)` triple: derive `pos = hash(seed, archetypeName, instanceId, paramName) / 2^32` (deterministic PRNG; mulberry32 or xmur3+sfc32 — pick the smaller). Look up the param's spec via `resolveParamSpec(modReg, paramName)` (already exists post-phase-2, so it widens through aliases). Call `sampleRegion(spec, regionName, pos)`.
- Apply constraints AFTER the per-param sampling pass, in declaration order: `copy` overwrites `to` with `from`'s sampled value; `offset` writes `from + delta`; `proportional` writes `from * factor`.
- Returns the same shape phase 1/2 already use (`resolvedParams[instId][paramName] = number`), so the emitter integration is a single merge: archetype output is overlaid into `resolvedParams` *before* explicit PDL `*` lines are processed, so explicit lines always win.

**Precedence (load-bearing — write a test for this):** `explicit * line > archetype param > registry default`.

**4. Parser hook.** `parsePDL` extracts `# archetype: name {bindings} #seed=N` directives into a returned `archetypes: [{ name, bindings, seed, lineNumber }]` list. Multiple `# archetype:` lines are allowed and applied in order (later wins on conflict — same precedence pattern as `*` lines). `emitVcvJson` resolves archetypes after `parsePDL` returns, merges into `resolvedParams` per precedence, then continues exactly as today.

**5. Verification (`verify_t7b.js` at palace root, mirroring `verify_t7a_phase2.js` shape).** Targets:
- All 8 archetypes resolve on a happy-path PDL for each, zero warnings.
- `# archetype: kick` produces a `.vcv` whose VCO.FREQ is in `sub` region and whose ADSR.{A,D,S,R} sample from their declared regions.
- `copy` constraint actually copies: `pitch_env.D` numeric == `amp_env.D` numeric byte-identical.
- Same seed → byte-identical `.vcv` across two runs (determinism).
- Different seed → different numeric values, all still within their declared regions (variance bounded).
- Explicit `* AMP_ENV: D = 0.9` overrides archetype's `snappy` (precedence).
- Missing required role (PDL with no `AMP_ENV`) warns and falls back to defaults for the missing role's params, doesn't crash.
- Unknown archetype name (`# archetype: foo`) warns through the amber panel with the line number, same channel as phase 2 warnings.

**6. Mac-side Rack audition — the Specialist's first Piece-tier job.** Generate three patches with `# archetype: kick #seed=1`, `# archetype: warm_pad #seed=1`, `# archetype: pluck #seed=1`. Load in Rack, audition. Success criterion from the roadmap: *"at least three archetypes are perceptually distinguishable on first load without any manual knob adjustment."* This session creates `Artifacts/Shop/VCV Patch Generator/` with `recipes/kick-seed-1.{pdl,vcv,wav}`, `tests/test-plan.md` (no longer TODO), and `tests/determinism.txt` (the byte-identical proof from the harness). Update `Shop/VCV Patch Generator.md` with `last_tested: 2026-MM-DD`, the first real gotcha (whatever the audition surfaces), and a Recipes link.

**7. Palace entry — `Synth Archetypes.md`.** New `concept`-typed entry at palace root. Typed links: `couples-with: [[Generative Audio Devices]]` (label *"params-layer-of"*), `mirrors: [[Registry Pattern]]` (label *"archetype-as-registry"*), `enables: [[Generative Preset Development]]` (label *"shared-archetype-vocabulary"*). The entry documents the schema, the 8 archetypes' core ideas in plain language, and the design rationale for the three constraint kinds. Short — the JSON file is the data, this entry is the *why*.

**8. Roadmap closure.** Mark T7b ✅ in the Roadmap, add a "Done recently" bullet, advance the `forward_vector`'s critical path to `T6 refactor → T10`.

## Calibrations from this session

- **Bundle the loose ends.** The Rack audition isn't a separate Mac-side errand from T7b — it's T7b's success-criterion check. Same for the Specialist scaffold and the two entry drifts. Three loose ends close inside this session, not as follow-ups.
- **Precedence is the only semantic decision worth re-stating in tests.** `explicit > archetype > default`. Without this rule the user can't override the archetype, which kills the whole "archetype as starting position" use pattern.
- **Don't extend the registry to support archetypes.** The registry stays a pure component vocabulary; archetypes are a sibling JSON. Conflating them rebreaks the abstraction the project worked hard to establish.
- **The `pos` seam was reserved on purpose.** Don't rebuild `sampleRegion`; pass `pos` through. If you find yourself wanting a second sampler function, stop and re-read phase 2's lesson note in the entry.
- **Schema-ceremony weight remains light** for `archetypes.json` — same rationale that closed phase 2's ceremony question. `archetypes.json` is project data with its own `version`; not palace ontology.
- **The roadmap example `noise_hit` is absent on purpose** (Fundamental has no noise source). If anyone asks why the v1 list is 8 rather than the roadmap's 8-with-noise_hit-and-drone, this is the answer.

## Load these files first

1. `Generative Audio Devices.md` — the **Parameter Intelligence** section (the *why* for archetypes-as-knowledge-representation) and the **T7b** roadmap entry.
2. This handoff.
3. `vcv_fundamental_registry.json` — module names + region vocabulary on VCF.FREQ, VCF.RES, ADSR.{A,D,S,R}, VCO.FREQ, LFO.FREQ. The archetype `params` clouds reference these names exactly.
4. `PDL Renderer.html` — `sampleRegion` (line 623, the seam to reuse), `resolveParamSpec` (the alias-widening helper), `parsePDL`, `emitVcvJson`.
5. `verify_t7a_phase2.js` — pattern for `verify_t7b.js` (pure-JS parser+emitter mirror, assertion shape, warning-channel checks).
6. `Shop/VCV Patch Generator.md` — Specialist stub the kick-audition fills (Forward Vector → first job).
7. `house_bass.pdl` — example PDL shape for the test fixtures.
