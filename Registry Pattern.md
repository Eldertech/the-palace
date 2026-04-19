---
title: Registry Pattern
type: concept
pillars:
  - tools
  - philosophy
  - practice
born: 2026-04
stage: seed
links:
  - target: "[[Generative Audio Devices]]"
    type: emerged-from
    label: "first-instance"
  - target: "[[BBS Blackboard]]"
    type: connects-to
    label: "structural-rhyme"
  - target: "[[Actor Model]]"
    type: connects-to
    label: "governs-messages"
  - target: "[[Lossy Compression with Intent Alignment]]"
    type: connects-to
  - target: "[[Four Pillars]]"
    type: connects-to
  - target: "[[Lateral Access]]"
    type: contradicts
    label: "generative-tension"
---

# Registry Pattern

A method for making LLM generation of structured technical artifacts reliable. The core move: before asking the model to generate anything, inject a curated, verified component vocabulary that defines the complete space of legal outputs. The model is constrained to this vocabulary. Hallucination of names, indices, and parameters is structurally prevented rather than hoped against.

Without a registry, a language model generating a VCV Rack patch will invent port names, module slugs, and parameter IDs that don't exist. The patch loads — but cables point nowhere. The registry collapses the output space to only what is actually possible.

---

## Origin

Emerged from [[Generative Audio Devices]] Stage 1 (VCV Rack). The first registry documented 7 modules from the VCV Fundamental plugin: exact slugs, port indices verified against source code, parameter ranges, HP widths, voltage conventions, and common use patterns. The registry was injected wholesale into a generation prompt, becoming the model's entire vocabulary for module-to-module connections.

The positioning problem surfaced a second dimension of the same principle: spatial layout in VCV Rack is not cosmetic — it is part of the instrument's readability. A patch with correct modules and cables but scattered positions is present but not usable. The registry pattern extended to include HP widths and layout rules, constraining the spatial grammar as well as the signal graph.

---

## Structure of a Registry

A minimal registry entry needs:

- **Exact identifier** — the slug, class name, or ID as the target environment requires it
- **Inputs/outputs with integer indices** — not names alone; the integer IDs cables use
- **Parameter names, ranges, and defaults** — so generated patches open with intentional states
- **Common use patterns** — idiomatic connections that give the model behavioral vocabulary
- **Verification status** — which entries are confirmed against source vs. derived. Unverified entries are liabilities.

The registry is only as reliable as its verification depth. A registry derived from documentation is weaker than one cross-checked against source code. A registry with a mechanical validator is stronger still.

---

## Cross-Domain Resonance

**[[BBS Blackboard]]** — The BBS is a shared substrate constraining what agents can write and read. The registry constrains what a generative agent can output. Both are grounding vocabularies — shared semantic surfaces that make coordination possible. The structural rhyme: an agent that can only speak in registered terms is an agent that can be understood.

**[[Actor Model]]** — The registry defines what messages (port connections, cable endpoints) are legal between actors (modules). It is the type system for the message-passing network.

**[[Lateral Access]]** — Productive tension. The palace favors lateral, rhizomatic access — many entry points, no fixed vocabulary. The Registry Pattern enforces a closed vocabulary as a precondition for reliable generation. Both are right in their domains: the palace is an organism that grows by association; a generative pipeline is a machine that must be constrained to function. The tension is between openness-as-epistemology and closure-as-reliability. Neither cancels the other.

---

## Forward Vectors

- Does this pattern generalize beyond audio tools? Code generation, UI component generation, music notation, scene graphs — anywhere a precise schema governs legal outputs.
- What is the minimum viable registry for a given domain? The 7-module VCV set is small enough to verify carefully. How does reliability degrade as the registry grows?
- Can the registry be auto-generated from source? Closing the loop: extract port enums directly from module code, build the registry mechanically, run a validation pass. Human verification becomes auditing rather than authoring.
- The registry as ontology: naming the things in a domain precisely enough that a mind outside that domain can build within it. This is what a technical specification does. What's different when the "mind" is an LLM rather than a human engineer?
