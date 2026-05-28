---
title: PDL Renderer
type: project
pillars:
  - tools
  - creation
born: 2026-04
stage: sprout
status: active
last_activated: 2026-05-26
links:
  - target: "[[Generative Audio Devices]]"
    type: emerged-from
    label: first-fruit-of
  - target: "[[Registry Pattern]]"
    type: connects-to
    label: reads-the-registry
  - target: "[[Synthesis Topologies]]"
    type: connects-to
forward_vector: "I turn a paste of patch-description text into a playable VCV Rack patch with no build step. I keep widening what PDL can say — from numeric params to named perceptual regions (`CUTOFF = dark`) — while keeping every failure visible in the surface the user is already editing. The reach: PDL fluent enough that a fresh Claude can author topologies a human would call musical."
---

# PDL Renderer

A self-contained React-in-browser artifact (`PDL Renderer.html`) — open in any browser, no build step. It parses **PDL** (Patch Description Language): `@INSTANCE = ModuleType` declarations, connection lines, and `* INSTANCE: PARAM = value` parameter lines, draws the resulting signal graph, and emits a VCV Rack `.vcv` patch via `emitVcvJson`. Routing and defaults resolve against the VCV Fundamental registry (`vcv_fundamental_registry.json` / the embedded `#vcv-registry` block).

This entry is a **stub** that exists to resolve the `[[PDL Renderer]]` link and give the tool a home. The **canonical development log** — the T-task roadmap, registry version history (currently v2.4), and per-phase verification harnesses — lives in its parent project, [[Generative Audio Devices]], which `spawned` this as its `first-fruit`. Do not duplicate that history here; deepen it there.

**Current state (2026-05-26):** numeric param emission (T7a phase 1) and a perceptual parameter vocabulary with named `regions`, `curve` hints, and `aliases` (T7a phase 2) are shipped and verified. The stale `PDL Renderer.jsx` was deleted; the `.html` is the unambiguous renderer source.
