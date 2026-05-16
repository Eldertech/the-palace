---
title: Loudon Live
type: project
pillars:
  - creation
  - tools
  - practice
  - philosophy
born: 2026-04
stage: sprout
status: active
confidence: working
energy: high
forward_vector: "I will be Loudon's primary public teaching space, where sound and music techniques are explored alongside the building of instruments, and where the channel itself models a way of working in public that is rigorous about craft, unpretentious about progress, and is honestly presenting Loudon as an autodidact polymath."
links:
  - target: "[[Progressive Staging]]"
    type: couples-with
    label: stages-into-streams
  - target: "[[Curriculum Map]]"
    type: couples-with
    label: makes-performable
  - target: "[[FOUR PILLARS]]"
    type: connects-to
    label: public-face
  - target: "[[Autodidact Polymaths]]"
    type: couples-with
    label: audience
  - target: "[[Hyperdimensional Prism]]"
    type: spawned
    label: visual-identity
  - target: "[[Confucianism]]"
    type: deepens
    label: teaching-as-ren-and-li
  - target: "[[Toolkit — Synthesizers]]"
    type: connects-to
    label: rtm-source
  - target: "[[Toolkit — Audio Plugins]]"
    type: connects-to
    label: rtm-source
  - target: "[[2D Torus Wavetable Synthesizer]]"
    type: couples-with
    label: signature-instrument-candidate
---

# Loudon Live

Loudon's primary public teaching space. A live YouTube channel where sound and music techniques are explored alongside the building of instruments, effects, and music-making tools.

The channel is a membrane between the palace's project work and the world. Projects staged through [[Progressive Staging]] become streams; the [[Curriculum Map]] becomes a performable cross-section; the [[FOUR PILLARS]] become legible to viewers because the work explicitly moves between them. Sound design and DSP fundamentals get taught next to real music technique, theory, and listening — not as separate concerns, because the palace doesn't treat them as separate concerns.

## Editorial posture

**Subject is sound and music; tools are the medium.** The channel is not a tools-brand identity. Specific software, hardware, and code appear only when the project requires them. The lasting questions — how a sound is shaped, why a phrase works, what your ears are doing — outlive any particular tool.

**Honesty is a light touch, not a confession.** The work-in-progress nature of the channel is named once in the channel trailer; otherwise the work speaks. This is a stance about how authority and humility coexist in public teaching: rigor about craft, no pretense about progress.

**The channel is itself a teaching artifact.** It models a way of working — choosing a project, naming a loose goal, working through the wall, talking through the thinking — that demonstrates the autodidact polymath posture more efficiently than any one piece of content can.

## Format

Each stream picks one project and pushes it forward. Some streams are deep dives into the foundations of sound. Some are hands-on builds. Some are music-technique sessions. Some are detours into theory or debugging. No outcome promises per stream — the working is the deliverable.

The operational kit — channel copy, stream-card templates, asset variant system — lives in this entry's bundle as launch kit and asset plan. Stream-pack rendering follows the variant system spec there.

## The form: a session is the unit

Every Loudon Live release is a **session** — roughly 60–90 minutes, one stage of one project. Sessions are not divided by topic but by **what gets built**. A session begins with a clear pedagogical target (the illusion of an infinite staircase, a polyphonic crystal, a Stage 4 theatrical interface) and ends with a working instrument that demonstrates it. The Stage 1 *Shepard Tone Synthesizer* artifact (`Artifacts/Shepard Tone Synthesizer/session-1-interactive.html`) is the existing reference for what a finished session looks like — interactive HTML framing, ~60–75 minutes, no Max required, footer reading *Loudon Live · Autodidact Polymaths*.

## The curriculum: project-fueled, stage-shaped, pillar-organized

Loudon Live does not have a topic curriculum. It has a **project curriculum**. Each project in the palace's `Projects/` directory is staged into 5 sessions via [[Progressive Staging]], and those staged sessions become the channel's content. Projects currently feeding the curriculum (or named as future feeders): [[Crystal Synthesizer]], [[Shepard Tone Synthesizer]], [[Retrospective Delay]], [[2D Torus Wavetable Synthesizer]], [[Generative Audio Devices]], [[Generative Preset Development]], [[Compressor Design]]. Cross-project prerequisites and entry-point recommendations live in [[Curriculum Map]] (`Projects/Curriculum Map.md`).

The [[Four Pillars]] — creation, tools, philosophy, practice — are the curriculum's structural spine. A well-staged project activates all four; the [[2D Torus Wavetable Synthesizer]] is the canonical example, explicitly framed as *the right project to anchor a Loudon Live cycle around*. The pillar tagging makes the channel legible at the meta-level: across many sessions, viewers can trace any single pillar through the catalog.

### The RTM series

Within the channel, a planned content series sits alongside the project staging: ***Read The Manual*** — deep-dive sessions exposing unusual, underused, or beautiful capabilities of specific synthesizers and plugins, in Loudon's *always-positive, always-supportive-of-makers* voice. Software-first (screenable, cheaper for students, accessible), with hardware appearances reserved for manufacturer-sponsored work. The current shortlist (per [[Toolkit — Audio Plugins]]) includes Eventide H3000 Factory, u-he Diva + Zebra2, Reaktor 6, Newfangled Pendulate, MeldaProduction full suite, Surge XT, Vital, Soundtoys, Polyverse, Klevgrand Tomofon.

## The visual identity

The channel's visual signature is the Lissajous trace inside a sphere, generated in Max/MSP/Jitter — see [[Hyperdimensional Prism]] for the full identity essay. The image works at multiple interpretive depths simultaneously: an oscilloscope trace to a music producer, a path through knowledge space to a learner, a methodology made visible to a collaborator, a point tracing hyperdimensional space to a peer. Critically, the patch that *generates* the logo is itself a pedagogical artifact — students can download, modify, and run it. The visual identity is not decoration; it is a teaching object.

## The audience

Loudon Live addresses [[Autodidact Polymaths]] — the audience the channel is being built for and named in conversation with. See the linked entry for the full articulation; this entry treats it as a given.

## The teaching philosophy

A composite drawn from references across the palace:

- **Each stage is a complete pedagogical moment, not just a step toward the next.** From [[Progressive Staging]]'s forward vector: every stage of every project must be a thing in itself.
- **Always-positive, always-supportive-of-makers.** From the RTM concept in [[Toolkit — Synthesizers]] — the channel's stance toward the tools and the people who build them.
- **Software-preferred for reach, hardware reserved for sponsored contexts.** Deliberate teaching philosophy, not a limitation.
- **The instrument teaches while it sounds.** Specific-to-general pedagogy: the [[2D Torus Wavetable Synthesizer]] is articulated as *a concrete entry point to 2D Fourier analysis, torus geometry, quasi-periodicity, bifurcation theory, and quasicrystal mathematics. It teaches while it sounds.*
- **Teaching as a Confucian act.** [[Confucianism]]'s forward vector explicitly names *the teacher-student relationship in Loudon Live* as a worked reading of *ren* and *li* — the channel's relational ethic.
- **Theatrical / dub-lineage interface mythology where appropriate.** Some instruments will carry deliberate mythological framing (the séance-medium-as-dub-engineer in [[Retrospective Delay]]) — pedagogy doesn't require sober affect.

## The reputation architecture

Loudon Live is also a reputation engine for two downstream paths timed deliberately *after* the channel establishes audience and credibility (see [[Toolkit — Synthesizers]]):

1. **An original synth/effects hardware product line.** The aspiration to build and sell hardware is *long-term, timed after establishing a strong Loudon Live reputation. Everything learned about hardware synthesis feeds this.*
2. **Manufacturer-sponsored hardware teaching hire.** Working with synth manufacturers on commissioned educational content — *Loudon Live reputation enabling this.*

The channel itself is not the monetization plan; it is the platform that makes the monetization possible.

## Lost branches

Paths visible at the moment of this deposit, deliberately not taken:

- **Schedule cadence (day/time):** undecided. Streaming starts on demand until a rhythm emerges.
- **Front-and-center confessional framing:** rejected as the primary register; archived as a position someone else might take.
- **Tools-first identity:** rejected. The channel could have been a tools-brand show; it is not.

## Cross-Domain Resonances

- **[[Four Pillars]]** — Loudon Live is the curriculum-shaped manifestation of the Four Pillars; every well-staged session activates more than one pillar.
- **[[Progressive Staging]]** — the project-shaping discipline that makes session-by-session release coherent.
- **[[Hyperdimensional Prism]]** — the visual identity entry; the Lissajous-in-sphere is the channel's logo and a working pedagogical artifact.
- **[[Confucianism]]** — the relational ethic of the teaching itself.
- **[[Autodidact Polymaths]]** — the audience.
- **[[2D Torus Wavetable Synthesizer]]** — the candidate signature instrument for the channel's launch / first signature device.
- **[[Curriculum Map]]** — the cross-project scaffolding used by the `project-stage-builder` skill to surface prerequisite chains.

## Open Questions

- **Cadence.** Per stage as soon as built? Weekly? In project-batches (release a full 5-stage arc together)? Currently undecided.
- **Pre-launch threshold.** What inventory is enough to launch — one full project's 5 stages? Three projects' Stage 1s? The first complete RTM episode? The launch trigger has not been named.
- **Monetization.** Channel ad revenue alone? + Patreon / membership? + Paid courses on the same projects? Hardware/manufacturer revenue is downstream; what funds the channel itself before reputation is established? Not yet decided.
- **Signature instrument.** [[2D Torus Wavetable Synthesizer]]'s forward vector explicitly raises whether it ships as Loudon's signature device for the channel's launch. Open.
- **Live moments.** All recorded long-form, or also occasional live streams (build-alongs, Q&As, jam sessions)? Not yet decided.
- **Anthropic / palace work as topic.** Is the construction of the palace and the work-with-AI itself a session-worthy topic, or is that a different audience and channel?
- **Autodidact polymath as own entry.** Does the autodidact polymath posture want its own palace entry, separate from this one? It is gestured at here; it does not contain itself here.
- **Stream artifacts vs. project entries.** What is the relationship between live-stream output (streams as artifacts) and the underlying `Projects/` entries? Does each stream want a typed link from this page, or do they aggregate up through [[Curriculum Map]]?
- **Public-facing palace surface.** Where does the audience enter the palace, if at all? Is there a public-facing read-only surface, or does the channel stay separate from the palace's interior?

## Forward Vectors

*See YAML `forward_vector` field above.*
