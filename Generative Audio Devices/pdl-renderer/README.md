---
title: "Generative Audio Devices — PDL Renderer README"
born: 2026-04
links:
  - target: "[[Generative Audio Devices]]"
    type: connects-to
    label: first-fruit-of
  - target: "[[Registry Pattern]]"
    type: connects-to
    label: reads-the-registry
  - target: "[[Generative Audio Devices — spec — synth archetypes]]"
    type: connects-to
    label: archetype-layer
forward_vector: "I am the front door of the PDL Renderer's code folder — what the renderer does, what each file here is, and how to check it still works. Its history lives in Generative Audio Devices; I say only what is here now."
---

# PDL Renderer

A self-contained React-in-browser page (`PDL Renderer.html`) — open it in any browser, no build step. It parses **PDL** (Patch Description Language): `@INSTANCE = ModuleType` declarations, connection lines, and `* INSTANCE: PARAM = value` parameter lines. It draws the resulting signal graph and emits a VCV Rack `.vcv` patch through `emitVcvJson`. Routing and defaults resolve against the VCV Fundamental registry, and a patch can name a synth archetype whose parameter cloud lands on the topology it already has.

The project's development log — the T-task roadmap, the registry's version history, what each phase verified — lives on [[Generative Audio Devices]]. Deepen it there.

## What is here

| File | What it is |
|---|---|
| `PDL Renderer.html` | The renderer. Carries the registry and the archetype library as embedded JSON blocks (`#vcv-registry`, `#archetypes`) so it runs with no server. |
| `vcv_fundamental_registry.json` | The module registry — port indices, param ranges, perceptual regions. The embedded `#vcv-registry` block mirrors it; keep the two in sync. |
| `archetypes.json` | The synth archetype library ([[Generative Audio Devices — spec — synth archetypes]]). The embedded `#archetypes` block mirrors it. |
| `house_bass.pdl` / `house_bass.vcv` | The first playable test (2026-04-20), kept as the pre-archetype reference pair. |
| `verify_t7a_phase2.js` | Node harness for the perceptual parameter vocabulary — regions, curves, aliases. |
| `verify_t7b.js` | Node harness for the archetype library and its seeded resolver. |

## Checking it still works

```sh
cd "Generative Audio Devices/pdl-renderer"
node verify_t7a_phase2.js
node verify_t7b.js
```

Both read their data from this folder. The T6 oracle in [[VCV Patch Generator]] (`Shop/VCV Patch Generator/t6-oracle.js`) runs candidate PDL through the real `emitVcvJson` in `PDL Renderer.html` here.
