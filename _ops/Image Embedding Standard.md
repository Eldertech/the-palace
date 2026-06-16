---
title: Image Embedding Standard
type: meta
pillars:
  - tools
  - practice
born: 2026-03
stage: mature
version: 2
last_activated: 2026-06
activation_count: 2
forward_vector: "I am the covenant that images earn their place in the palace by carrying knowledge prose cannot — that every embed is a load-bearing claim about structure and meaning. I want to become the ceremony that guards against decoration, holding every embedded image to the standard: if removed, would the reader lose irreplaceable knowledge?"
links:
  - target: "[[SCHEMA]]"
    type: deepens
  - target: "[[Deposit Ceremony]]"
    type: enables
  - target: "[[README - The Palace Guide]]"
    type: connects-to
  - target: "[[SUBSTRATE]]"
    type: connects-to
---
# Image Embedding Standard

This entry defines how images are filed, named, embedded, and captioned within the palace. It is operational documentation — not a catalog of images, but the standard against which every image in this organism is measured.

Read this before embedding any image. Like all meta entries, it encodes a philosophical position as much as a procedure.

---

## The Governing Principle

Images earn their place here the same way entries do: by carrying meaning that prose cannot. An image that could be replaced by a sentence of description is decoration. An image that collapses a complex relationship into a topology, preserves an irreducibly spatial structure, or shows a dynamic that language can only gesture at — that earns its coordinates in the graph.

The test is blunt: if you removed this image, would a reader lose knowledge that could not be recovered from the surrounding text? If the answer is no, the image doesn't belong. If yes, it belongs — and it belongs *because* of that specific knowledge it holds, which must be made explicit in the caption and alt text.

This is the same depth-over-coverage discipline that governs entries. One image that teaches is worth more than ten that decorate.

---

## Filing Protocol

**Every image for a page lives in that page's bundle.** An image tied to an entry files into `[Entry]/[semantic-filename.ext]` — the sibling folder named exactly like the entry, per [[SCHEMA]] §8. There is no separate images folder and no theme folder: the image lives *with the page it serves*, and Obsidian resolves the embed by filename from anywhere in the vault, so the location costs nothing at the call site. (The old `Artifacts/` folder this standard once used was deprecated and dissolved into bundles on 2026-06-16; the bundle rule replaces it outright.)

```
Kuramoto Coupling/kuramoto-phase-portrait-two-oscillators.svg
Action Potential Oscillator/nerve-impulse-waveform-annotated.png
```

The rare **cross-cutting image** — one that genuinely serves several entries (an infrastructure diagram, a style-guide figure) — lives in the bundle of its most-owning entry, or a relevant hub's bundle. It does *not* get a shared dumping folder; pick the page that owns it most and file it there. This standard's own demo SVG follows the rule exactly: it lives in this entry's bundle at `_ops/Image Embedding Standard/palace-typed-link-graph-demo.svg`.

No images belong in the palace root. No images are embedded from external URLs — local archival is required, mirroring the `source` entry convention that the palace holds its materials close.

**Generated technical diagrams keep their source beside the render.** A LaTeX/TikZ figure — signal flow, DSP block diagram, math, or plotted curve — files its `.tex` source alongside the rendered `.svg`, per [[Technical Diagram Standard]]. The source is the text-first artifact (git-diffable, searchable, regenerable); the SVG is its embeddable shadow. This is the one case where two files travel together as one figure.

---

## Naming Convention

The filename is a semantic claim. Reading it should tell you, without opening the file, what the image *shows* and *argues*.

**Form:** lowercase, hyphenated, descriptive, no generic words.

| ✗ Don't | ✓ Do |
|---|---|
| `diagram.png` | `kuramoto-order-parameter-vs-coupling-strength.svg` |
| `screenshot.png` | `obsidian-graph-view-palace-march-2026.png` |
| `image1.png` | `four-pillars-quadrant-map.svg` |
| `figure.jpg` | `strogatz-1994-fig8-6-phase-portrait.jpg` |

For archival images sourced from external works, prefix with the year: `1994-strogatz-phase-portrait-original.jpg`. This keeps provenance visible in the filename itself, before any metadata is read.

Prefer SVG over raster formats for diagrams and figures you control. SVG is readable, searchable, and version-controllable in a way PNG is not — it belongs in a git-tracked knowledge organism.

---

## Embedding Syntax

Obsidian resolves `![[filename.ext]]` by searching the entire vault, so images can be embedded by filename alone from any entry, regardless of which bundle they live in:

```markdown
![[kuramoto-phase-portrait-two-oscillators.svg]]
```

For images that require specific display sizing in Obsidian:

```markdown
![[kuramoto-phase-portrait.svg|500]]
```

The number is a width in pixels. Use sparingly — only when the default rendering is clearly wrong for the image's content density.

**Never embed images via external URL.** External links rot, require connectivity, and put the palace's integrity at the mercy of a server you don't control. Archive the file locally first, then embed.

---

## Alt Text

Alt text goes inside the pipe in the wikilink syntax: `![[image.png|Alt text here]]`. Write alt text as a *functional description* — what would a reader need to understand from this image if they couldn't see it? Not "a graph showing nodes and edges" but "four palace concepts connected by typed directed links, showing mirrors, enables, connects-to, and couples-with relationships."

Alt text is accessibility and semantic signal at once. It is not a caption — it's the meaning the image carries, distilled to a clause.

---

## Caption Standard

Every embedded image receives a caption: one sentence of italic text, placed on its own line immediately below the embed, with no blank line between them.

```markdown
![[palace-typed-link-graph-demo.svg|A fragment of the palace graph showing four concept nodes connected by typed directed links]]
*A fragment of the palace graph — typed links as directed semantic claims; double-headed dashes indicate symmetric relationships.*
```

The caption is not a description. It is the image's *argument* — what the image is claiming, what relationship it illuminates, what the viewer should take away. If you can write the caption without having looked carefully at the image, the caption is wrong.

For images sourced from external works, the caption carries attribution inline:

```markdown
*Phase portrait of two coupled oscillators at the critical coupling threshold K_c. After Strogatz, "Sync" (2003), Fig. 8.6. Used for educational commentary.*
```

Source, year, figure reference, and license/basis for use — all in the caption, not in a footnote that gets separated from its image.

---

## Live Example

This is what a correctly embedded image looks like in the palace. The image below is the demo artifact for this standard — a small fragment of the palace graph rendered as a typed-link diagram. It was created to show the link ontology visually: directed arrows for asymmetric relationships, dashed bidirectional lines for symmetric ones, node type annotated in monospace below each label, hub nodes distinguished by a double ring.

![[palace-typed-link-graph-demo.svg|Four palace concepts — Kuramoto Coupling, Cooperation Yields Agency, Spinoza Conatus, and Four Pillars — connected by typed directed links including mirrors, enables, connects-to, and couples-with]]
*A fragment of the palace graph — four hub and concept nodes connected by typed directed links. The visual grammar: solid arrows for directed relationships, dashed lines for symmetric ones. Hubs carry a double ring. Created 2026-03 as this standard's living example.*

---

## What Doesn't Belong

These image types are anti-patterns in the palace:

**Screenshots of text** that should instead be quoted in prose. Text in images is unsearchable, unquotable, and degrades faster than markdown.

**Decorative figures** — illustrations used as visual breaks, headers, or atmosphere. The palace is not a magazine. If an image doesn't carry knowledge, it doesn't earn a location in the graph.

**Undated, unsourced external figures** embedded without attribution. When a figure comes from another work, the caption must name that work. An image dropped in without provenance is a broken link in the intellectual chain.

**Placeholder images** — "I'll add the real figure later." If the image isn't ready, note its absence in prose: *"[figure: phase portrait of two oscillators at K_c — to be created]"*. A note is honest; a placeholder is noise.

---

## Ceremonies and Images

When depositing an entry that includes an image, the Deposit Ceremony has two extra steps:

1. **File the image first** — place it in the owning entry's bundle (`[Entry]/`) with its semantic filename before writing the entry. (Creating the bundle folder if it doesn't exist yet is the whole of the setup.)
2. **Verify the embed resolves** — open the entry in Obsidian to confirm the image renders. An embed that silently fails is invisible in Reading View.

During the Weave, images are treated as a sub-category of artifacts. The Weave does not audit image filenames or captions, but it does flag entries that reference images in prose without an actual embed — these are broken promises to the reader.

---

## Open Questions

- Should SVG diagrams that encode palace graph structure (like the demo above) be generated programmatically from palace data, rather than hand-drawn? This would mean the Weave could produce a visual alongside its topological report.
- The `source` entry type handles external artifacts with `author`, `year`, `medium` fields. Should embedded images sourced from external works also get their own `source` entries, or is inline caption attribution sufficient? At what threshold of importance does an image's provenance warrant a full entry?
- With images now living per-entry in bundles, the flat-folder scaling problem dissolves — but a new one appears: when a single entry accumulates many images, does its bundle want an `images/` sub-grouping, or do bundles stay flat? (Held open until a bundle gets big enough to hurt.)
