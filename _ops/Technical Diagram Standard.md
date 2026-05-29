---
title: "Technical Diagram Standard"
type: meta
pillars: [tools, practice]
born: 2026-05
stage: sprout
version: 1.0
forward_vector: "I am the standard that lets the palace draw what Mermaid cannot — the summing junction, the unit delay, the pole-zero plot, the annotated equation. I want to make technical accuracy and vector-editability the default for any figure that carries DSP, math, or measured behavior, and to keep every such figure text-first so it stays of the same substance as the organism that holds it."
links:
  - target: "[[Mermaid Diagram Standard]]"
    type: couples-with
    label: same-visual-language
  - target: "[[Image Embedding Standard]]"
    type: deepens
  - target: "[[SCHEMA]]"
    type: deepens
  - target: "[[Deposit Ceremony]]"
    type: enables
  - target: "[[README - The Palace Guide]]"
    type: connects-to
---
# Technical Diagram Standard

This entry defines how the palace produces **technical and quantitative diagrams** — signal-flow graphs, DSP block diagrams, mathematical figures, and plotted curves — using LaTeX (TikZ and pgfplots), rendered to editable SVG. It is the third member of the palace's visual language, completing the pair already formed by [[Mermaid Diagram Standard]] and [[Image Embedding Standard]].

The three standards do not compete. They divide the visual world by what each draws best. Read the decision rule first; it tells you which standard you are even in.

---

## The Decision Rule

The palace draws four kinds of things, and each has one right tool:

**Mermaid — relationship and concept graphs.** Typed-link fragments, ceremony flows, schema relationships, process diagrams. Anything whose content is *nodes and named edges*. This is [[Mermaid Diagram Standard]]'s domain and it remains first for these. Use Mermaid whenever the diagram is a graph of relationships.

**LaTeX / TikZ + pgfplots — technical and quantitative diagrams.** Signal-flow graphs, DSP block diagrams, filter topologies, pole-zero plots, magnitude/phase responses, annotated equations, labeled geometric constructions. Anything whose content is *engineering or mathematical structure* — where a summing junction, a `z^{-1}` delay block, a gain triangle, a plotted curve, or a typeset fraction carries the meaning. This is the domain this entry governs.

**Raw SVG — custom visual grammar neither tool covers.** The color-coded, double-ringed typed-link demo graph at `Artifacts/Images/palace-typed-link-graph-demo.svg` is the archetype: a bespoke visual language that is neither a Mermaid graph nor a technical figure. Hand-authored SVG remains the escape hatch, governed by [[Image Embedding Standard]].

**Raster (PNG/JPG) — external and photographic figures only.** A figure from a paper, a whiteboard photo, a screenshot. These are sourced artifacts, never generated diagrams. Governed by [[Image Embedding Standard]].

The test that separates Mermaid from LaTeX: *is the diagram a graph of relationships, or a piece of engineering/math?* A diagram of how three palace concepts connect is Mermaid. A diagram of how a signal flows through a filter is LaTeX. When in doubt, ask what the edges mean — semantic relationships point to Mermaid, signal paths point to TikZ.

---

## Why LaTeX Belongs in a Text-First Organism

[[Mermaid Diagram Standard]] makes a deep argument against SVG: a hand-drawn SVG is "a pointer to a separate artifact," its git diff is "hundreds of lines of XML coordinate noise," it is "opaque to the palace's own search layer." Mermaid wins there because its *source is plain text* — co-located, diffable, greppable. "Of the same substance as the palace itself."

LaTeX passes that same test. **The `.tex` source is plain text.** A git diff of a TikZ diagram is human-readable: you see which node moved, which gain changed, which edge was added. `grep "z^{-1}"` finds every delay block in the palace. The `.tex` is the artifact; the rendered `.svg` is its shadow. This is the crucial distinction from hand-drawn SVG — we are not abandoning text-first authoring, we are extending it to figures Mermaid's grammar cannot express.

So the palace keeps **both** files: the `.tex` source (the text-first artifact, version-controlled meaningfully) and the rendered `.svg` (what Obsidian embeds and what opens in a vector editor). The source is the truth; the SVG is generated from it and regenerable at any time.

This is why LaTeX earns a tier of its own rather than living as an exception inside the SVG escape hatch. It is text-first by construction. It is not the XML noise the Mermaid Standard rightly rejects.

---

## The Toolchain

Everything needed is already present in the palace's Claude environment — **no install required**. Any palace Claude can author and render technical diagrams headlessly:

- `pdflatex` / `lualatex` / `xelatex` — TeX engines (TeX Live)
- `tikz`, `pgfplots`, `standalone`, `circuitikz`, `amsmath` — packages
- `dvisvgm` — converts the rendered PDF to clean vector SVG

The pipeline is three steps:

```
.tex  --pdflatex-->  .pdf  --dvisvgm-->  .svg   (editable in Inkscape / Affinity / Figma)
```

A one-command helper, `render.sh`, wraps this:

```bash
./render.sh diagram.tex          # text rendered as vector outlines (portable, no font dependency)
./render.sh diagram.tex --text   # text kept as live, editable text (embeds the font)
```

**The `--no-fonts` vs `--text` choice matters.** Default (`--no-fonts`) converts every glyph to a vector path: the SVG is fully portable and edits anywhere, but text becomes shapes, not words. `--text` (dvisvgm `--font-format=woff`) keeps text selectable and editable in the vector editor at the cost of embedding the font. Choose by intent: archival/portable figures use the default; figures you expect to re-label by hand use `--text`.

Every diagram this standard produces is **true vector** — verified by the absence of any `<image>` or `data:image` element in the SVG. If a base64 blob appears, something rasterized and the figure is wrong.

---

## The Signal-Flow Primitives

DSP block diagrams reduce to five reusable elements. This `\tikzset` block is the standard's core — copy it into any technical diagram:

```latex
\tikzset{
  >={Stealth[length=2.4mm]},
  wire/.style ={line width=0.7pt},
  adder/.style={circle, draw, line width=0.7pt, minimum size=6mm, inner sep=0pt},      % summing junction
  gainf/.style={isosceles triangle, draw, line width=0.7pt,                            % gain, points right (feed-forward)
                isosceles triangle apex angle=55, minimum width=9mm, inner sep=2pt},
  gainb/.style={gainf, shape border rotate=180},                                        % gain, points left (feedback)
  delay/.style={rectangle, draw, line width=0.7pt, minimum size=8mm, inner sep=2pt},    % unit delay z^{-1}
  tap/.style  ={circle, fill, minimum size=3.4pt, inner sep=0pt},                       % branch / junction dot
}
```

The reusable skeleton lives in the bundle as `signal-flow-template.tex`. The convention: feed-forward gains point right, feedback gains point left, delays read top-to-bottom down a central column, summing junctions are plain `+` circles with the sign baked into the coefficient (`-a_1`, `-a_2`) so adders stay pure sums.

---

## Quantitative Figures with pgfplots

For plotted behavior — magnitude responses, transfer curves, envelopes, anything where a *curve over an axis* is the content — use `pgfplots`. Two authoring paths:

- **Function plots:** `pgfplots` evaluates expressions directly. Good for clean analytic curves.
- **Computed data:** compute the data in Python and write a `.dat` table, then `\addplot table {...}`. This is the honest path for filter responses, measured data, or anything whose math is easier in code than in TeX. The magnitude-response example in this standard was computed this way.

Axis labels follow the palace equation convention: **spell the variable out alongside its symbol** — "Magnitude (decibels)", "Normalized frequency ($\omega/\pi$, fraction of Nyquist)" — never a bare symbol.

---

## Math Typesetting

LaTeX's oldest strength is the one Mermaid and draw.io entirely lack: **typeset mathematics**. Use it for annotated equations — `\overbrace`/`\underbrace` to name the parts of an expression, TikZ callouts to interpret them, color to separate concerns. The annotated biquad transfer function below is the model: numerator and denominator braced and named, zeros and poles called out, every symbol spelled out in a legend. An annotated equation is a diagram; treat it as one.

---

## Filing Protocol

Technical diagrams follow [[Image Embedding Standard]]'s filing logic, with one addition: **the `.tex` source is filed alongside the rendered `.svg`.** Both live together, named descriptively:

```
Artifacts/[Theme]/biquad-df2-signal-flow.tex      <- source (the text-first artifact)
Artifacts/[Theme]/biquad-df2-signal-flow.svg      <- rendered output (what gets embedded)
```

Filenames are semantic claims, per [[Image Embedding Standard]]: `biquad-lowpass-magnitude-response.svg`, not `plot.svg`. Computed-data figures keep their `.dat` beside the source so the figure is regenerable. Embedding, alt text, and captions are exactly as [[Image Embedding Standard]] specifies — embed the `.svg` by filename, caption as an argument not a description.

---

## Discoverability — How Palace AIs Reach This

A standard no agent knows about is dead tissue. This standard becomes load-bearing only when the palace's other surfaces point into it:

- [[Mermaid Diagram Standard]] § "When SVG Still Wins" gains a clause: *for technical/quantitative diagrams (signal flow, DSP, math, plots), do not reach for raw SVG — use [[Technical Diagram Standard]].*
- [[Image Embedding Standard]] § Filing Protocol notes that generated technical figures keep their `.tex` source beside the `.svg`, per this standard.
- The [[Deposit Ceremony]] visual-check step learns a third branch: Mermaid block, embedded image, or technical `.tex`+`.svg` pair.
- A line in [[README - The Palace Guide]]'s visual-language section names all three standards as one system.

These hooks are the difference between a tool that exists and a tool that gets used.

---

## Live Examples

A teaching triptych — three views of one Direct Form II biquad, each drawn by the tier this standard governs.

![[biquad-df2-signal-flow.svg|Direct Form II biquad signal-flow graph: input adder, central z-inverse delay chain, feed-forward gains b0 b1 b2 to the output, feedback gains minus-a1 minus-a2 to the input]]
*The structure: a Direct Form II biquad. One shared delay line, feedback before feed-forward — the canonical signal-flow graph Mermaid has no vocabulary for.*

![[biquad-transfer-function-annotated.svg|Annotated biquad transfer function H of z, numerator braced as feed-forward giving zeros, denominator braced as feedback giving poles, with a symbol legend]]
*The equation: the same filter as $H(z)$. Numerator is the feed-forward path (the zeros); denominator is the feedback path (the poles). Math typeset, not drawn.*

![[biquad-lowpass-magnitude-response.svg|Magnitude response in decibels versus normalized frequency, resonant low-pass peak near the cutoff at omega over pi equals 0.2, rolling off above it]]
*The behavior: the same filter's magnitude response. The feedback poles produce the resonant peak at the cutoff; the curve is computed in Python and typeset by pgfplots.*

---

## Open Questions

- Should the three example sources live in this standard's bundle (`_ops/Technical Diagram Standard/`) or in a shared `Artifacts/DSP/` theme that future filter entries also draw from? The bundle keeps them owned; a theme folder makes them reusable across entries.
- Mermaid is rendered live by Obsidian with zero build step. LaTeX requires a render pass. Is there value in a lightweight ceremony step — or a git pre-commit hook — that re-renders any changed `.tex` so the `.svg` never drifts from its source?
- `circuitikz` is installed and can draw actual electronic schematics (filters, op-amp circuits). Does the hardware-synth and modular work want a fourth example, or is that a separate standard when the need is real?
- At what point does a recurring figure type (pole-zero plots, ADSR envelopes) deserve its own reusable template in the bundle, the way `signal-flow-template.tex` already serves block diagrams?
