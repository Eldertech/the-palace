---
title: "BLUELINE — Production Pipeline"
born: 2026-06-17
forward_vector: "I re-found BLUELINE on the established animation pipeline instead of an invented one — anime as the skeleton, comics as the skin, the animated-feature pipeline as connective tissue, the music video as the clock. I name every stage with the industry's own word so we adopt, not reinvent, and I keep the two seams in plain sight, because they are the only places the work is actually ours."
links:
  - target: "[[BLUELINE]]"
    type: connects-to
    label: production-pipeline-for
  - target: "[[Adopt the Craft, Author the Seam]]"
    type: exemplifies
    label: founding-rationale
  - target: "[[BLUELINE — Production Plan]]"
    type: connects-to
    label: tracks-map-onto-stages
  - target: "[[BLUELINE — Board Record Schema]]"
    type: connects-to
    label: the-spine
  - target: "[[Blocked, Not Prompted]]"
    type: connects-to
    label: seam-2
  - target: "[[Shop/Blender]]"
    type: connects-to
    label: the-layout-DCC
---

# BLUELINE — Production Pipeline

> **The re-founding (2026-06-17).** BLUELINE does not need an invented process — it needs the *established* one with a render-AI dropped in. The founding rationale is [[Adopt the Craft, Author the Seam]]: adopt a century of codified craft, author only the seams. This doc names every stage with the industry's own word, so we stop reinventing. It reframes the substrate-first tracks of [[BLUELINE — Production Plan]] as stages of a real pipeline; the tracks didn't change, their *names* did.

> **This is the conceptual map; [[BLUELINE — Production Plan]] is the status/threads/horizon front door.** Three subsystems
> that grew after this doc map onto its stages: **Text & Lettering** ([[BLUELINE — Text Layer]]) is the
> overlay at stage 7 (words over art, never diffused); **Line-Art Decomposition**
> ([[Line-Art Layer Decomposition]]) serves Seam A / compositing (convert flat-ink → flat-cel → layers);
> and the **elemental-motion tiers** (Track VI: warp the ink · sim + composite) are stage 6, the motion
> spine — all gathered in [[BLUELINE — Motion and Flow]].

## Backbone, skin, tissue, clock

Four traditions, four layers — they don't compete:

- **Anime is the skeleton.** The only tradition architected around the storyboard (*ekonte*) as the master spec that drives a dedicated **layout** stage — camera + pose + perspective authored as a spatial plan the next stage fills. That layout stage *is* "Blocked, Not Prompted." Anime also runs on **held key poses** (limited animation — our *staged, not simulated*) and a **timing sheet that locks frames to sound** — both already our shape.
- **Comics is the skin** — the previs register. The board is a comic page: McCloud's panel transitions, the gutter, motion lines, figure clarity, the inked register. The comic register lives entirely on the front end.
- **The Western animated feature is the connective tissue** — the story-reel/animatic discipline, editorial-in-the-loop, the color script, the shot list, the layout *department*. The most formalized boards→animatic→layout→render management spine.
- **The music video is the clock.** The song is fixed, so the timeline is pre-locked; everything hangs on the beat. (Already built: the Track III clock.)

## The pipeline — previs in comic language, downstream in film/music-video language

| # | Stage | Role | Input | Adopt the term | Register |
|---|---|---|---|---|---|
| 0 | The locked track | — (given) | the song | *fixed-tempo timeline* | — (music video) |
| 1 | Beat map | **Director** | song + concept | *treatment* + *beat board* | concept |
| 2 | The board | **Board artist** | beat map | *storyboard / ekonte 絵コンテ* — a comic page | **comic** |
| 3 | The animatic | **Editor** | board + track | *story reel*, beat-locked | comic stills, cinema time |
| ⟶ | **SEAM A — board → layout (2D → 3D)** | | | | *transition* |
| 4 | Layout / blocking | **DP / layout** ([[Shop/Blender]]) | board panel | *layout レイアウト / previs* → conditioning passes | **cinema** |
| ⟶ | **SEAM B — layout → render (staging → conditioning)** | | | | *the frontier* |
| 5 | The render | **Render-AI** | layout + style | *collapses genga + douga + satsuei / anim + light + comp* | cinema |
| 6 | The motion spine | **FX** | one flow field | *effects animation*, authored once across registers | spans all |
| 7 | The cut | **Editor** | shots + track | *the edit / online*, beat-mux | cinema |

> **Stage 7 reframed (2026-07-09) — the page persists.** The cut is no longer one shot at a time: the
> screen is a **comic page**, panels arriving in musical time, layers breathing inside them. The page
> structure born at Stage 2 is *kept* to output instead of flattened, and this is where **live
> performance** enters as the final register. Full spec + the comic lexicon: [[BLUELINE — The Page]].

## The two seams — opposite kinds of problem

A conditioned pipeline has seams exactly where the downstream stops being a human.

- **Seam A · board → layout (2-3 → 4): a handoff, solved by design.** There is no "3D version" kept in sync with the "2D version" — there is **one [[BLUELINE — Board Record Schema|board record]] rendered at two fidelities** (comic = cheap, Blender grey-box = exact). You tune *parameters, not pixels*; the one thing 2D can't pin down — **depth** — round-trips back to the record. No re-tuning, because there is no second artifact. A discipline, not a research risk.
- **Seam B · layout → render (4 → 5): the frontier.** Turning exact blocking into exact OpenPose/ControlNet keypoints — which no human pipeline had to solve, because its renderer read loosely. This is [[Blocked, Not Prompted]]. The real R&D lives here.

**One staging vocabulary, three jobs.** Facing · eyeline · L/R laterality · the shoulder–shoulder–pelvis torso frame · shot size · camera grammar — it is at once the **schema** of the board record, the **conditioning keypoints** the AI consumes (Seam B), and the **lossless 2D→3D transfer format** (Seam A). Build it once; all three pay off.

## Where Blender sits (and where it stops)

Blender is the **layout DCC** at Stage 4 only: author camera + pose as geometry → emit OpenPose / depth / edge / camera. It **stops at the grey-box** — it never paints pixels (Stage 5 is the AI) and never authors the idea (Stage 2 is the 2D board). Its only cameo elsewhere is the offline **flow-field sim** at Stage 6. This is the modern anime move — *3D layout → 2D/AI finish*: you get 3D's exact control without 3D's cost.

## Adopt vs. invent

- **Adopt wholesale** (stop coining our own): storyboard/ekonte, the animatic, shot grammar (ECU/CU/MS/WS, the 180° rule, eyeline match, the line of action), the layout stage, editorial/beat-cut, the 12 Principles, McCloud's transitions, the timing sheet, the treatment, the color script. The board record's fields should become *the industry's* fields.
- **Invent** (the only genuinely new parts): (1) the **layout→conditioning seam** (B); (2) the **single-source flow-field** authored once across three registers (6); (3) making the **comic↔cinema transduction an explicit stage** (4) instead of picking one register; (4) the **render-AI collapsing 4–5 departments** into one conditioned step (5).

## The tracks already *are* the pipeline

The substrate-first tracks of [[BLUELINE — Production Plan]] weren't lost — they're these stages without the industry's names:

| Track / proof | = stage |
|---|---|
| Track III clock | 0 / 3 / 7 — the locked track, beat-locked animatic, the mux |
| M0 / M1 animatic | 2 / 3 — the board + animatic (the comic register) |
| Track IV Bench · "Blocked, Not Prompted" | 4 — Layout ([[Shop/Blender]]) |
| Track I / V render | 5 — the Render |
| Flow-field spine | 6 — the motion spine |
| Track II LoRA | the color-script / character design (style lock) |

So the re-founding is mostly **renaming to the industry's words + adopting the roles**, then pouring energy into the one seam (B) that's actually ours.

## Forward Vectors

I want each stage to grow its own role-Specialist (Director / Board artist / DP-layout / Render-AI / Editor) under a BLUELINE [[Maker]]-style foreman, so the team is real and not a metaphor. I carry the **3D-assisted-boarding lane** as an open branch — camera-heavy shots that can't be cheaply drawn, born in grey-box Blender and drawn over (the anime 3D-layout move) from Stage 2. And the open question from [[Adopt the Craft, Author the Seam]]: is there a *third* seam where the render feeds *back* into a re-board?
