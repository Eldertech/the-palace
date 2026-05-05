# Link proposal — Metric Modulation ↔ Wallpaper Groups

## The unsung path

The Wallpaper Groups entry contains an entire section titled *"Musical Symmetry: Rhythm as Wallpaper Group"* in which it states that *"a repeating musical pattern—an ostinato, a rhythmic cycle—is a wallpaper group in time"* and develops a *rhythmic impossibility theorem* in direct parallel to the crystallographic restriction.

The Metric Modulation entry develops the same territory from the other side — it is the *technique* by which one rhythmic tiling is reframed into another mid-piece, exploiting the same incommensurate-periodicity logic the Wallpaper Groups section calls *"two independent wallpaper groups tiling the timeline simultaneously."*

Neither entry currently links to the other in YAML. Wallpaper Groups talks rhythmically without naming Metric Modulation. Metric Modulation talks tempo-shifts without naming the symmetry-group framework that names what's being shifted *between*. They are reaching for each other in prose and missing each other in the typed-link layer.

This is the kind of unsung path the Weave is supposed to surface; this card surfaces it pre-Weave.

## Proposed bidirectional links

### On `Projects/Metric Modulation.md`

```yaml
  - target: "[[Wallpaper Groups]]"
    type: deepens
    label: temporal-tiling
```

**Reasoning:** Metric modulation is a specific technique inside the wider claim Wallpaper Groups makes about rhythm-as-tiling. *deepens* fits — Metric Modulation is the more nuanced/specific instance of the abstract framework. The label *temporal-tiling* names what the relationship actually is.

### On `Projects/Wallpaper Groups.md`

```yaml
  - target: "[[Metric Modulation]]"
    type: spawned
    label: tiling-becomes-technique
```

**Reasoning:** Wallpaper Groups names the principle (the *rhythmic impossibility theorem*); Metric Modulation is a working compositional move that exploits it. *spawned* names the direction of generation: abstract principle → working technique.

If *spawned* feels too strong because the entries weren't actually written in that order (they emerged independently), the fallback is `couples-with` with the same label *tiling-becomes-technique* — that's the symmetric framing.

## What this changes for a reader

A reader following typed links from Wallpaper Groups can now reach Metric Modulation in one hop and find a working method to *do* the symmetry-as-rhythm idea, not just admire it.

A reader at Metric Modulation gains the upstream framework that names *why* the 3/4 mirror-image transition is possible at all — and lands them next to the open question *"What would a 4D wallpaper group sound like?"* which a metric-modulation practitioner is precisely the right person to attempt.

## Optional follow-on

If Loudon wants prose-level acknowledgement of the link too, the smallest move is adding a single italic line to Metric Modulation's *Philosophy of Perceived Time* section: *"This is what [[Wallpaper Groups]] calls the rhythmic-impossibility theorem — the technique exploits the principle from inside."* — and a parallel single-line acknowledgement on the Wallpaper Groups side. Both small. Both natural.
