---
title: "BLUELINE — The Page"
born: 2026-07-09
forward_vector: "I am BLUELINE's page: the screen reconceived as a comic page where panels arrive in musical time and layers breathe inside them. I hold the decisions the 2026-07-09 re-assessment locked — the comic lexicon, the page that persists through the whole pipeline, the file structure, and the discipline that everything built offline must survive the crossing into live performance. A new agent reads me to learn the shape of the output; the render backend and motion docs tell it how the pixels are made."
links:
  - target: "[[BLUELINE]]"
    type: connects-to
    label: page-subsystem-of
  - target: "[[BLUELINE — Production Plan]]"
    type: connects-to
    label: the-final-stage
  - target: "[[BLUELINE — Production Pipeline]]"
    type: connects-to
    label: reframes-stage-7
  - target: "[[BLUELINE — Board Record Schema]]"
    type: connects-to
    label: a-panel-is-a-record
  - target: "[[BLUELINE — Motion and Flow]]"
    type: connects-to
    label: fields-are-panel-layers
  - target: "[[Graphic Storytelling]]"
    type: exemplifies
    label: closure-across-the-gutter
---

# BLUELINE — The Page

> **Locked 2026-07-09.** This doc states current decisions. Where an older BLUELINE doc still
> reads *single flow field*, *offline only*, or *one shot at a time*, this doc supersedes it —
> flagged for the next Weave to reconcile.

## The reframe: the page persists through the whole pipeline

The screen is a **page**. As the song plays, **panels** arrive on it in musical time and populate it
like a comic page — different sizes, arranged in tiers — and inside each panel, layers (art, motion,
dialogue) come and go in time too. The board was **always** a page of panels; today the animatic
*flattens* it to one full-screen shot at a time. **We stop flattening it.** The page structure is born
at Stage 2 (the board) and kept all the way to output.

The **gutter** — the silence between panels a comic reader crosses with their eye — becomes a
**duration.** Time is externalized: panels arrive on the beat instead of the eye choosing when to move.

## The comic lexicon (adopt the craft's words)

Per [[Adopt the Craft, Author the Seam]], we use comics' own century-old vocabulary. "Frame" is
overloaded — in film it means one image at 1/24s — so it is **reserved** for the image *inside* a panel.

| Term | Meaning here |
|---|---|
| **panel** | one framed image on the page — the addressable unit (a folder, below) |
| **frame** *(reserved)* | one rendered image inside a panel's clip (1/24s) |
| **gutter** | the space between panels — now a musical interval |
| **tier** | one horizontal row of panels |
| **page** | the full screen composition |
| **splash** | a single full-page/full-screen panel (the hero) |
| **inset** | a small panel set inside a larger one |
| **balloon** | dialogue container (the Living Balloon); **caption** = narration box |
| **closure** | the reader completing the action across the gutter — [[Graphic Storytelling]] |

## Three timescales, one transport (think DAW)

Everything is a child of one song transport — Ableton's, already the clock source (Clock & Sync).
Model it as a **DAW session**: the page-score is the arrangement, panels are clips with in-points,
layers inside a panel are automation lanes. You can author the score **in Ableton via M4L** — panels
triggered by clips and locators — closing the loop with the Clock & Sync thread instead of inventing a
new timeline tool.

1. **Page** — panels accumulate; the layout grows.
2. **Panel** — each arrives at its in-point, holds, and transitions (McCloud's taxonomy).
3. **Layer** — inside a panel, art / flow / FX / balloon come and go on independent clocks.

## The compositor is a clock-driven browser app

The page compositor is a **browser app driven by the existing clock** (OSC → WebSocket → browser is
already built, Clock & Sync). That single choice is the translation guarantee: **offline** you render
the browser output to a frame-accurate video; **live** the same app runs on a live transport with
StreamDiffusion feeding the hero slots. The page, the score, the layout, and the compositor are
**identical across the crossing** — only the panel-*content* source differs (pre-rendered files vs a
live stream).

## Live performance is the final stage — and the discipline it forces

Live performance is **the last stage of the production process, not a separate project**. It shares the
spine with everything offline (the record, the audio→parameter map, the field stack, the conditioning,
the style). The single design rule that keeps it reachable:

> **Build every offline stage as a slowed-down live process, not a batch job.**
> Same warm-started sequential render, same OSC-driven parameter surface — only the clock source and the
> model's step-count change across the crossing (many exact steps offline → few StreamDiffusion steps live).

The translation test for any new build: *does it run if I swap the pre-baked timeline for a live
transport and cut the step-count to four?* The parallel batch pose-library work **fails** it (offline-only
tooling, fine as such); the sequential warm-started shot render **passes** it — so that is the spine.
The real gate is hardware: real-time at speed needs a local 4090-class NVIDIA GPU running StreamDiffusion
(a Windows box), which the current Mac + rented-pod [[BLUELINE — toolbox|toolbox]] does not have.

## File structure — the unit is the panel, not the video-frame

Each **panel is a folder** (the bundle pattern): a `record` (the parameter source of truth) plus
separately-timed `layers`. The **frames of a clip inside a panel are not files** — they are generated
from the record (a rendered sequence offline, a stream live). Exploding to one-file-per-frame would be
unmanageable *and* untranslatable, since live has no files at all.

```
<song>/
├─ song.clock.json        tempo · beat grid · the locked track  (Stage 0)
├─ page-score.json        the WHEN — panel in-points, slots, transitions,
│                         per-layer in/out, per-panel render tier
└─ pages/
   └─ p01/
      ├─ layout.json       panel slots (x,y,w,h) + gutter for this page
      └─ panels/
         └─ p01-D/         ← a panel is a FOLDER, not a file
            ├─ record.json    THE SOURCE OF TRUTH — pose·depth·edge·facing·
            │                 flow-handles·beat·tier
            ├─ fields/        the field STACK (plural, each single-source)
            │  ├─ wind.field.json
            │  ├─ wake.field.json    ← from the posed figure
            │  └─ impact.field.json  ← keyed to a beat
            ├─ layers/        separately timed → composited at play
            │  ├─ art.png│.mp4    the render output (tier-tagged)
            │  ├─ fx/…            particle / sim passes
            │  ├─ lettering.svg    vector text — NEVER diffused
            │  └─ balloons.json    living-balloon in/out timings
            └─ renders/
               ├─ study/  ├─ piece/  └─ live/   one record, three render paths
```

- **Record is truth; pixels are derived** — BLUELINE's *render the record, not the pixels* doctrine,
  extended to the panel. A panel re-renders at any tier, in either register, from its record.
- **Layers are separate files** because they come in and out on independent clocks.
- **The page-score is decoupled from the panels** — the WHEN split from the WHAT; the same score reads
  against a playhead (offline) or a live transport (live).
- **Fields live at the panel and are plural** — see the field-stack reframe in
  [[BLUELINE — Motion and Flow]] and [[The Flow Field is the Spine]].

## The GenAI Camera (a lane opening — its own entry once built)

The panel's render is produced by a **GenAI Camera**: a camera whose output is not rasterized pixels
but a gen-AI render *conditioned on what it sees* (its depth/normal/pose/edge passes). Matched-optics
cameras stacked over one scene — each seeing a different subset via layers, each carving its own
conditioning channel — are multi-ControlNet made spatial, and they map one-to-one onto a panel's
`layers/`. The grounding is [[ControlNet as Topology]] (the camera carves canyons from a viewpoint).
First prototype: Blender, on the real [[Shop/Figure Rig]]. Deposit-worthy once proven.
