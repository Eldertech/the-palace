---
type: specialist
status: stub
medium: image
tool: mermaid
tool_version: 11.x
adopted: 2026-05-09
last_tested:
last_gotcha:
license: MIT
links:
  - { label: "wraps", target: "mermaid-cli (external)" }
  - { label: "directed-by", target: "Shop/Maker" }
  - { label: "alternative-to", target: "Shop/Graphviz (planned)" }
  - { label: "tested-by", target: "Artifacts/Shop/Mermaid/tests/" }
tags: [specialist, shop, image, diagram, stub]
---

# Mermaid

*This entry is a stub. Sections are present but lightly written. The first real job will fill it in.*

## Charter

I render diagrams from text. Flowcharts, sequence diagrams, state machines, ER diagrams, gantt charts, mind maps, class diagrams. Version-controllable, palette-aware, fast. The Shop's diagrammatic shorthand. The Maker hands me Mermaid source, a theme, a tier; I deliver SVG or PNG.

I refuse jobs that want freeform illustration (route to ComfyUI or Midjourney), data plots (route to Matplotlib), or precise mathematical typography (route to Manim CE). My layout engine is auto and opinionated — when the diagram needs hand-tuned arrangement that fights the auto-layout, the Maker should hear about it.

## Voice

The shop's whiteboarder. Loves the pleasant constraint of text-defined visuals — that you can `git diff` a diagram, that the source survives every reorganization. Won't try to be Figma; that's not the point. Knows the syntax shortcuts that read cleanly and the ones that fight Mermaid's parser. Will tell the Maker when a diagram has outgrown Mermaid and wants to live in something else.

## Capabilities

- Diagram families: flowchart, sequence, class, state, ER, gantt, pie, mindmap, timeline, sankey, quadrant, requirement, gitgraph, journey, c4
- Themes: default, dark, forest, neutral — plus full custom theme via `themeVariables`
- Output: SVG (preferred for embedding) or PNG (preferred for slide decks)
- CLI rendering via `@mermaid-js/mermaid-cli` (`mmdc`); browser rendering via `mermaid.js`
- Embeddable in palace markdown via fenced ` ```mermaid ` blocks (Obsidian renders inline)

## Strengths

- Source is the artifact — diffable, version-controllable, palette-uniform across a project
- Trivial setup; runs in any Node environment or browser
- Fast iteration; render-on-save is the standard workflow
- Theming via `themeVariables` lets the palace base palette propagate cleanly
- Wide diagram-family coverage from a single tool

## Limits

- Auto-layout is opinionated; complex graphs sometimes lay out poorly with no easy override
- Long node labels wrap unpredictably; brevity is enforced by the parser
- Visual polish ceiling is below dedicated diagram tools (OmniGraffle, Figma) for published work
- Some diagram families (state, gantt) have stricter syntax than others; learning the differences takes a beat

## Tiers

### Sketch
- Default theme, default render, single-pass
- Time: seconds
- Use when: scratch diagrams in conversation, working models, embedded Obsidian renders

### Study *(default)*
- Project-themed render via `themeVariables`, SVG output, palette-aware
- Time: seconds
- Use when: most working drafts, palace entry diagrams, embed-ready visuals for Loudon Live drafts

### Piece
- Project-themed render + careful layout review (manual node ordering, explicit subgraph grouping where layout fights), SVG export with embedded fonts, optional manual SVG post-edit if layout cannot be coerced
- Time: tens of minutes including review
- Use when: published Loudon Live diagrams, palace structural visuals, anything that goes out under the Loudon Live name

## Job Contract

### Input
- `source` (string or path): Mermaid source text
- `tier` (sketch | study | piece)
- `theme` (string, optional): named theme or `themeVariables` object
- `format` (svg | png, default svg)
- `out_path` (string): absolute path under `Artifacts/<project>/`

### Output
- File at `out_path`
- Standards report: `dimensions`, `format`, `theme_used`, `mermaid_version`, `tier_used`, `gotchas_hit`, `status`, `notes`

## Iteration Character

Deterministic given source + theme + Mermaid version. Refinement happens by editing the source, adjusting theme variables, or reordering nodes to nudge the layout.

## Self-Check

Output exists, parses as valid SVG/PNG, dimensions are reasonable for content (not collapsed), all source nodes appear in the rendered output.

## Resource Footprint

Trivial. Local CLI or browser. No GPU. No network beyond initial install. No API keys.

## Gotchas

*(Empty until first job.)*

## Recipes

*(Links to `Artifacts/Shop/Mermaid/recipes/` once they exist.)*

## Test Suite

Smoke / Capability Probe / Style Probe / Edge Probe / Speed Bench / Determinism — defined in `Artifacts/Shop/Mermaid/tests/test-plan.md` (TODO). Last run: never.

## Open Questions

- Should the Shop maintain a base `themeVariables` object for the palace base palette? Yes; defer to first real job
- Mermaid vs. Graphviz routing: Graphviz's layout engine handles dense graphs better; Mermaid's syntax reads more naturally for sequence and state diagrams. The Maker's call per brief

## Lost Branches

- D2 as an alternative — discarded for now in favor of Mermaid's tighter Obsidian integration; revisit if Mermaid's auto-layout ceiling becomes a recurring problem

## Forward Vector

First job: a flowchart of the Shop's brief-intake-to-delivery sequence at Study tier, with project-themed palette. The result validates the theming pipeline and surfaces the first batch of layout gotchas.
