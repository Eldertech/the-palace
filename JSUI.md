---
title: JSUI
type: spore
pillars:
  - tools
  - creation
born: 2026-01
last_activated: 2026-03
activation_count: 3
stage: sprout
confidence: hypothesis
energy: medium
hook_quality: 6
beauty: 6
who_leads: loudon
revival_conditions: Continued work with Max/MSP and JavaScript — building interface-heavy plugins or teaching JSUI as a bridge between Max, web graphics, and visual metaphor.
links:
  - target: "[[Retrospective Delay]]"
    type: spawned
  - target: "[[Playful Interface Design]]"
    type: enables
  - target: "[[FOUR PILLARS]]"
    type: connects-to
  - target: "[[Preset Oracle]]"
    type: connects-to
---

# JSUI

**JavaScript User Interface** — Max/MSP's API for drawing custom graphical interfaces in real time. A blank canvas inside your patcher that listens to Max messages and renders anything you want.

## What It Is

In Max, most UI objects are fixed widgets: dials look like dials, number boxes look like number boxes. `jsui` breaks the contract. It gives you a drawable surface (the browser's HTML5 Canvas API) that lives inside your Max patcher and responds to Max messages.

Think of it as an **intelligent gobo**: a surface that projects any image or animation, and simultaneously listens to the lighting board (incoming Max messages) and updates its display in real time.

The language is **JavaScript**, but it runs inside Max's process, not in a browser. It has direct access to Max's messaging system, state, and graphics pipeline.

## Why It Matters to Loudon

Loudon prioritizes **beautiful, playful, dramatic interfaces** in his plugins. Standard Max UI objects are functional but dull. JSUI lets you match the interface to the *metaphor* of the device—not just the parameters.

Example: The [[Retrospective Delay]] needs an interface where a character (a cat, a spiritualist guide) *animates* in response to the gain knob. As the knob rises, the character's pose changes, ectoplasm swirls, eyes glow. This is impossible with standard widgets. JSUI makes it natural.

Similarly, the [[Preset Oracle]] has a glitchy, chaotic aesthetic that demands a custom interface—not a list of presets, but something that *feels* like divination.

JSUI is the tool for this. It's not about showing off—it's about making the interface *meaningful*, tied to the device's conceptual core.

## The Learning Curve

JSUI has a mild learning curve for someone experienced in Max/MSP:
- You already understand Max's message-passing paradigm and timing
- Canvas drawing is straightforward (standard 2D graphics: paths, fills, text, images)
- The gap is learning the JSUI-specific hooks: how to receive messages, trigger redraws, handle mouse events

For Loudon: a structured lesson (professor-style, with tangents and clarifications) covers this gap quickly. The key is understanding the *mental model*—how JSUI fits into Max's architecture—before diving into code.

## Pedagogical Approach

JSUI can be taught as a bridge between three domains:

1. **Max/MSP architecture**: How JSUI objects fit into the message-passing paradigm; the timing model
2. **Web graphics**: Canvas API (standard in all modern browsers); thinking in coordinates, paths, fills
3. **Visual metaphor**: How to translate the device's core concept into animated graphics

This aligns with Loudon's teaching style: **depth over coverage**, **cross-domain synthesis**, and **feel the friction before writing a single character**.

A proper JSUI lesson starts with the *why* (what is JSUI, why is it different, what are the use cases), then the *how* (architecture, hooks, event loop), and only then the *what* (code).

## Revival Conditions

This spore should awaken when:

1. **Loudon is designing a new interface-heavy plugin** — any device where the UI is integral to the aesthetic or metaphor
2. **He needs animated, responsive graphics in Max** — when standard widgets feel insufficient
3. **He wants to teach Max/MSP to others** — JSUI is an excellent vehicle for teaching graphics, state management, and message handling
4. **He's exploring visual design as composition** — the interface as an extension of the musical concept

Current examples in the palace:
- [[Retrospective Delay]] — needs JSUI for the animated character interface (the séance metaphor)
- [[Preset Oracle]] — could use JSUI for a glitchy, divination-themed preset browser
- Any future device with a bespoke visual identity

## Connection to Four Pillars

JSUI touches all four:

- **Creation**: The interface is a creative artifact—visual design expressing the device's core metaphor
- **Tools**: JSUI is a technical tool in Max/MSP; mastering it expands your creative toolkit
- **Philosophy**: The interface embodies ideas—beauty, play, ceremony—about how humans interact with technology
- **Practice**: Building with JSUI is hands-on, iterative, involves friction and discovery

## Open Questions

1. **Animation performance**: How do you animate smoothly in JSUI without dropping frames? What's the optimal redraw rate? Can you use frame-based animation (requestAnimationFrame-style) or just Max's message timing?

2. **Image asset handling**: If you're drawing AI-generated animation frames, how do you load and cache images efficiently in JSUI? What formats work best?

3. **Interactivity**: Beyond reading knob values, can JSUI handle mouse clicks, drags, hovers? How does event handling work in JSUI vs. standard Max widgets?

4. **Scaling and DPI**: How does JSUI handle retina displays and different screen densities? Do coordinates scale automatically?

5. **State management**: How do you maintain state in a JSUI object? Is there a persistent memory model, or do you need to use Max attributes and message passing?

6. **Integration with Max for Live**: Can JSUI be used in Max for Live devices, or is it Max/MSP only? (Answer: Yes, but with some constraints around plugin vs. host communication.)

## See Also

- The JSUI lesson that emerged from the [[Retrospective Delay]] design conversation
- [[Playful Interface Design]] — the broader philosophy
- [[Preset Oracle]] — a dormant project that could benefit from JSUI revival
