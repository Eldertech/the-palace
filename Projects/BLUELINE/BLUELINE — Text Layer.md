---
title: "BLUELINE — Text Layer"
type: meta
status: draft
born: 2026-06-24
who_leads: loudon
forward_vector: "I am BLUELINE's words-on-screen — dialogue, narration, voiceover, lyrics, signage, described sound. I am lettered OVER the art, never diffused into it, and I ride the same beat-locked clock as the boards. My presentation is my meaning: emotion, source, and who-it's-directed-toward live in my balloon, my font, and whether I sit inside the frame or out in the margin. I want a point of view about lettering the way BLUELINE has a point of view about the camera — the bias is the product."
links:
  - target: "[[BLUELINE]]"
    type: connects-to
    label: text-half-of-the-pipeline
  - target: "[[BLUELINE — Board Record Schema]]"
    type: connects-to
    label: adds-the-TEXT-block
  - target: "[[The Flow Field is the Spine]]"
    type: exemplifies
    label: sfx-is-the-fourth-resolution
  - target: "[[Blocked, Not Prompted]]"
    type: exemplifies
    label: balloon-placement-is-geometry
  - target: "[[Comic and Cinema — Two Ways of Seeing]]"
    type: connects-to
    label: text-transduces-too
  - target: "[[Loudon Live Design System]]"
    type: connects-to
    label: the-authors-voice
  - target: "[[Adopt the Craft, Author the Seam]]"
    type: exemplifies
    label: render-art-letter-over
  - target: "[[The 2.5D Paper Stack]]"
    type: exemplifies
    label: bubble-as-sheet
tags: [meta, blueline, text, lettering, lyrics, typography, sync]
---

# BLUELINE — Text Layer

![[BLUELINE — Text Layer — hero.png]]

> The words-on-screen layer of BLUELINE — generalized from the [[LIVE-CLOCK-LOOP-SPEC|lyrics layer]] into
> the full text register: dialogue, thought, narration, voiceover, lyrics, signage, described sound, and the
> system's own voice. Graphic novels carry their words as a designed layer; so do we. **Lyrics is rung 1
> (specced + built); this entry is the umbrella the other rungs hang from.** The detailed lyrics spec lives
> at `proofs/track-III-clock/LYRICS-LAYER-SPEC.md`; this folds it in as the first of four voices.

## Two commitments (everything follows from these)

1. **Text is lettered OVER the art, never diffused INTO it.** Diffusion can't spell and the locked negative
   prompt bans `text`/`watermark`/`signature` — so the artwork stays *wordless* and words are composited as a
   deterministic **vector/canvas overlay**, exactly as comics (artist draws, letterer letters) and motion
   graphics (plate, then lower-thirds) actually work. Text stays crisp, editable, re-timable; diffusion is
   never asked to do the thing it fails at. The seam *rendered-art → laid-on-lettering* is the same
   comic↔cinema seam BLUELINE already authors ([[Adopt the Craft, Author the Seam]]).
2. **The lettering is to text what the camera grammar is to the camera.** Not a font picker — an authored,
   opinionated **lettering vocabulary**, like the pose library and camera-grammar presets. The bias is the product.

## A bubble is a sheet — text as citizen of [[The 2.5D Paper Stack]]

Once a frame is understood as a stack of breathing inked sheets — [[The 2.5D Paper Stack]] — text stops being
a sticker pasted on top and becomes **a sheet at a chosen depth**. The question shifts from *"where on the frame
does this word go?"* to *"at what depth in the stack does this sheet live?"* That depth assignment falls
naturally out of the source/diegesis cube already named below:

- **In-world text** — dialogue, SFX, thought clouds — lives **inside the scene volume**: a sheet in front of
  the speaker, behind the panel border (the frontmost diegetic sheet). The tail anchors to the OpenPose
  mouth/head keypoint (already authored), so the same staging geometry that places the figure also places
  the balloon in the z-order.
- **Out-of-world text** — narration, voiceover, lyrics, chapter cards — lives **outside the stack** in the
  margin: not a deeper sheet but a separate author-plane beside the diegetic stack, the visual form of the
  off-stage voice. (The margin-is-the-gutter grammar below is the spatial form of *outside the stack*.)

Treating a bubble as a sheet unlocks three things. **Parallax** — on a camera drift the bubble moves *with*
its speaker at that depth, not as a fixed overlay. **Organic motion** — its tail can flex via the same
displacement-warp rule that makes any drawn line breathe ([[Move the Ink, Don't Redraw It]]) — a trembling
balloon for a nervous speaker, a fading one for a dying voice. **Occlusion** — a foreground hand can
legitimately clip a bubble behind it; the depth relationship is correct, not a bug.

**The discipline that keeps it readable.** The *letters* stay locked (they are meaning to be read, not a
drawn mark to be warped — the canny anchor already guarantees this for the gen-AI material register); the
*balloon shape and tail* are drawn lines and may flex gently. **Flat text inside, breathing container
outside.** The flat-text invariant lives inside a physically-present sheet.

**Forward implications for the build.** When rung 2 (balloon placement) ships, `render_text.py` should emit
each text event as a **transparent-background sheet plus a `z_depth`**, not a flat-on-black composite, so the
compositor can insert it at its assigned depth rather than always placing text last. The board record's
`TEXT[]` `placement` field below already names `in-frame` vs `margin`; adding an explicit `z_depth` (or
`stack_position`) formalizes the depth that's currently implicit. None of this is breaking — the
text-on-black material register (rung 1) is correct for its current scope — it becomes load-bearing the
moment rung 2 ships.

## The material register — gen-AI letterforms (rung added 2026-06-24)

Commitment 1 said *diffusion can't spell, so letter over the art*. That holds for long, legible, re-timable
text — narration, full lyric lines — which stays the **vector letterer's** job (crisp, editable, cheap). But
there is a second register a font simply **cannot reach**: the short, high-impact word — a title, a one-word
shout, an SFX, a lyric hook — where the **letterforms should be made of the feeling itself**: embers, bleeding
ink, flame, vapor, cracking brush. No typeface can be on fire; **gen AI can.** So the layer splits by register:

- **Vector letterer** — long / legible / re-timable text. (Commitment 1, unchanged.)
- **Gen-AI material register** — short, *hero* words where the **material is the meaning** — the vibe and
  emotional intensity typical fonts cannot give.

We resolve diffusion's can't-spell weakness the way BLUELINE resolves everything — **[[Blocked, Not Prompted]],
for text**: author the *legible letterform skeleton* (a heavy font, rasterized white-on-black), **Canny-lock**
it (`controlnet-canny-sdxl`), and let diffusion supply *only the material*. **The font is the pose; the material
is the render** — legible *by construction* (the canny lock holds the letters), expressive *by diffusion* (the
surface is generated). A pure txt2img `--mode free` stays available for SFX, where the onomatopoeia is
impressionistic by design and illegibility is a feature.

**Two stages — rich-first, stylize-last** (the same discipline as the boards). The skeleton+canny render gives a
*photoreal* word — rich material and value (flame, blood, ember). That render is then the **structural anchor**
for a second pass: **desaturate** it (its greyscale values carry the letterform), then **img2img at ~0.8 with a
pen-flow-ink prompt — the canny still locking the letters** — landing the word in the locked **white-ink-on-black**
idiom *last*. So the text register is **not a choice** between photoreal and ink: it is photoreal *for structure*,
ink *for skin* — exactly the [[Steer the Generator|rich-first / stylize-last]] pipeline the frames already run, now
applied to a single word. Proven 2026-06-24 (`NO` → white-ink splatter-burst, `too late` → bone-ink flowing strokes,
`BURNING` → inky drips). `render_text.py --mode stylize` (desaturate → img2img + canny); the photoreal and ink
variants sit side by side in `contact-sheet.html`.

**Three refinements that make it read as hand-lettering, not a font** (2026-06-24, Loudon's art direction):
1. **Skeleton from a hand-drawn font** (Chalkduster), not a mechanical one (Impact) — so even where the
   structure shows through it reads as *a hand*, not a typeface coming through too strongly.
2. **Loose canny on the ink pass** (strength ~0.5, released by ~45% of the steps) so the letters go organic
   instead of staying a rigid traced outline — the img2img init is the legibility floor.
3. **Leave the font black — put the original letterform in negative space.** A final knockout composites the
   (slightly dilated) skeleton as pure black into the ink energy, so the **word becomes the void the energy
   flows around** rather than positive white strokes. Every `--mode stylize` render emits a `_negspace` variant
   (`knockout()`). Strongest where the energy field is *light* around the word (an engraving / scratchboard
   field — see `stay`); a *many-of-these*, not all. Also folds toward [[The Drift|negative space as the subject]].
   The drop step from rung-finish — never feed the photoreal `gesture` into the ink prompt (it names the photoreal
   material and re-injects it) — stays in force.

**The prompt structure — `emotion+source → material`, `emotion+intensity → gesture`.** Each prompt names
*what the letters are made of* and *what they are doing*: the dying woman's `stay` is faint trembling graphite
thinning into breath; the hero's `NO` is cracking brush flinging ink; the song's `BURNING` is living flame
flowing left to right; the impact's `THOOM` is a struck ink shockwave. Full suite + the emotion→material map:
`proofs/text-layer/text-prompts.json`; renderer (both modes, the skeleton rasterizer, the contact sheet):
`proofs/text-layer/render_text.py`. This is the same **rich-first / author-the-structure** discipline as the
boards — and it recapitulates [[Blocked, Not Prompted]] at the scale of a single word.

## The taxonomy — every text event is a point in a 3-axis space

The "many types of text" are generated by three orthogonal questions — which is exactly what an AI tags:

- **Source** — who utters it? (a mouth · a mind · a narrator · the song · the world/an object · a sound itself · the system/author)
- **Diegesis** — does it exist *in* the world (a character could hear it) or *outside* it? (Chion's diegetic / non-diegetic)
- **Addressee** — directed *toward* whom? (another character · the self · the audience/4th-wall · no one/ambient)

| Type | source · diegesis · addressee |
|---|---|
| **Dialogue** | mouth · diegetic · another character |
| **Thought / interior** | mind · non-diegetic · self |
| **Narration / caption** | narrator · non-diegetic · audience |
| **Voiceover** | a character · non-diegetic placement · audience/self (Chion's *acousmêtre* — voice without a body) |
| **Lyrics** | the song · either (commentary, or diegetic if sung) · audience — *the most BLUELINE-native, the song leads* |
| **SFX / described sound** | the world/an action · diegetic · no one (ambient) |
| **Signage / diegetic words** | an object · diegetic · whoever reads it |
| **System / author voice** | BLUELINE itself · non-diegetic · audience (titles, chapter cards, credits) |

The cube is the renderer's job sheet: answer three questions, and the answers *deterministically choose the presentation*.

## Emotion · source · addressee → presentation

Comics lettering is a century-old discipline that encodes exactly these three in **frame, font, and context**.
We adopt it and make it opinionated:

- **Balloon shape = emotion / channel.** round = neutral speech · spiky = shout or electronic · scalloped
  cloud = thought · wavy/dripping = weak/dying/sick · hard rectangle = robotic/formal/narration · icicle =
  cold/menace · dashed = whisper · double-stroke = loud.
- **Tail = source + addressee.** Points at the speaker, *toward* the listener. **The tail anchors to the
  OpenPose mouth/head keypoint** already authored for the render — so the *same staging geometry* that
  conditions the figure now places the balloon: one geometry doing a **fourth job** (board-record field →
  conditioning keypoints → 2D↔3D transfer → **lettering anchor**). Tail across the frame edge = off-panel
  speaker; tail-less box = narration; balloon facing out / breaking into the margin = fourth-wall. Addressee
  becomes a *vector* — pure [[Blocked, Not Prompted]]: drama is geometry, even for words.
- **Typography = source + emotion.** weight (bold = volume) · case (ALL-CAPS comic default; lowercase =
  intimate) · italic (electronic/foreign/emphasis) · tremor (hand-jitter = instability) · size (big = loud) ·
  **a distinct face per source** (narrator's serif vs. hero's hand vs. machine's mono vs. song's display) ·
  color = speaker-coded (the clip color we already paint as the spine).
- **Treatment = world-coherence.** Diegetic lettering is hand-lettered in the **pen-flow ink** — rough,
  gestural balloons in the same ink as the art, not vector-perfect ovals.

The renderer is a pure function: `(type, source, emotion, addressee) → (balloon, tail, font, case, weight, size, color, ink, placement)`.

## Inside vs. outside the frame — the varying aspect ratio is the canvas, the margin is the gutter

The boards are mixed portrait/landscape on a 16:9 stage, so they always pillarbox or letterbox — that dead
space is the answer:

- **In-frame** (over the image) = **in the world**: dialogue (tail to a mouth keypoint), SFX in the action,
  signage warped into perspective, thought clouds by a head.
- **In the margin** (the letterbox/pillarbox bars) = **outside the world**: narration, voiceover, lyrics,
  translation, chapter cards — McCloud's gutter, reclaimed as the place the author and the song speak.

The split *is* the diegesis grammar — legible at a glance. And layout **responds to aspect ratio**: a portrait
board's wide side-pillars become manga-style vertical caption columns; a landscape board's top/bottom bars
become cinematic lower-thirds. The text layout is a small solver keyed off the board's dimensions.

## Beat-addressed text — it rides the clock like the boards

Text rides Track III exactly like the boards do (decision 2026-06-24: **track-per-type, clip name = text**):

- **Scanner tracks per type**: `Lyrics`, `Dialogue`, `Narration`, `SFX`. Same proven contract as `Boards`:
  **clip name = the words · clip color = source/speaker · position = when it appears · length = how long it
  holds**. The two layers carry over: *position+length is the edit, name is the content*. The scanner already
  namespaces by track name (`/Lyrics/*`, `/Dialogue/*`, …) — placement + name is the whole config.
- **Reveals are pure functions of the playhead** (like M2's motion): type-on · fade · pop · snap-on-downbeat.
  Deterministic, re-timable; a `text OFF` toggle freezes them, exactly like motion-off.
- **SFX can ride the flow field — the bold bet.** [[The Flow Field is the Spine]] is one field at three
  resolutions of reality; let SFX lettering be a **fourth resolution** — "KRAA-THOOM" streaking and deforming
  *along the wind vector*. The arrow becomes the wind becomes the word.
- **Emotion can couple to the music**: the section's energy modulates intensity — loud drop → bigger, bolder,
  jagged; quiet verse → small, intimate, lowercase. The text layer breathes with the song.

## The two AIs (mirroring BLUELINE's existing split)

- **The text-author AI** (cheap, structured, language — staging-side temperament): given the board record +
  the song's section/lyrics + the dramatic beat, it *writes and tags* each text event with
  `(type, source, emotion, addressee, beat_in, hold)`. Structured generation, not pixels — this is the
  "emotional gen-AI text": words emitted *with* their emotional/source metadata, ready to be lettered.
- **The letterer** (deterministic vector renderer): consumes the text spec + the lettering vocabulary and
  draws lettering in the locked style, placed (in-frame to keypoints / in-margin by aspect), timed to the
  beat. Almost no AI risk — typography + SVG/canvas. A *Tier-2* only for hero SFX that must be drawn *into*
  the art (back through diffusion/compositing).

## The curated lettering vocabulary — four voices (locked 2026-06-24)

Voices, not a font menu. The bias is the product.

1. **The world's hand** — diegetic dialogue + SFX: hand-lettered pen-flow ink, ALL-CAPS, gestural balloons in the art's ink.
2. **The author's voice** — narration, titles, chapter cards: the [[Loudon Live Design System]] display type
   (Anton), *deliberately typeset* to contrast the hand-lettered world. The system speaking, in the margin.
3. **The song's voice** — lyrics: a kinetic, beat-synced treatment that can ride the flow field. The spine made visible. **(Rung 1.)**
4. **Per-principal signatures** — each lead gets a face + color + balloon-shape (the hero vs. the dying woman vs. the crowd's murmur).

## Board-record integration

Add a `TEXT[]` field group to the [[BLUELINE — Board Record Schema|board record]] — each entry the same
"everything except the pixels, carrying a beat" shape as the board and the lyrics records:

```
TEXT: [
  { type, source, addressee, emotion,        # the 3-axis cube + emotion
    text,                                     # the words
    placement,                                # in-frame:anchor=<keypoint> | margin:<lower-third|side|caption>
    reveal,                                   # type-on | fade | pop | snap | ride(flow)
    beat_in, beat_hold, frame,                # the clock (frame derived; whole at locked tempo/fps)
    voice }                                   # which curated voice (world | author | song | principal:<name>)
]
```

Lyrics is the case `type=lyric, source=song, placement=margin:lower-third, voice=song` — i.e. the existing
lyrics record is a *specialization* of this. Each `TEXT` event is its own object so the threads parallelize,
sharing only the clock (`frame`), which all derive from `(bar,beat)`.

## Rungs

> **Active (2026-06-24): the gen-AI material register — text on black.** Per Loudon: *get the text up with
> emotion and style on a black background first; dialogue balloons come later.* So the build is re-sequenced —
> the **material register** (the words made of embers / ink / flame / vapor, [[Blocked, Not Prompted]] for
> text) is being proven now on pure black; balloon **placement** (rung 2) is deliberately **deferred** until
> the expressive lettering itself is right. Proof: `proofs/text-layer/` — `text-prompts.json` (the structure-
> guidance + emotion→material prompts), `render_text.py` (skeleton+canny and free modes), `text-on-black.html`
> (the font-register comparison the gen-AI register surpasses).

1. **Lyrics (the song's voice)** — *specced + building (2026-06-24)*. Beat-locked lines/words in the margin,
   in the song's voice, on the animatic player. Proves the overlay layer + the beat-reveal + the in-margin
   grammar. Detail: `proofs/track-III-clock/LYRICS-LAYER-SPEC.md`; proof: `proofs/lyrics-layer/`.
2. **Dialogue balloons (the world's hand)** — in-frame, tails anchored to the OpenPose mouth/head keypoints,
   emotion-shaped, hand-lettered. The hardest/most expressive case; the keypoint-anchor coupling is the win.
3. **SFX riding the flow field** — onomatopoeia that streaks/deforms along the field vector (text as the
   field's fourth resolution). The boldest synthesis; downstream of rungs 1–2 and the flow field reaching the render.
4. **Narration / captions (the author's voice)** — the Loudon Live display type in the margin; chapter cards, titles.

## Cross-domain anchors

- **Comics theory** — McCloud (the gutter is where meaning is made; here the margin is where the author
  speaks), Eisner (sequential art; the balloon as *sound made visible*), the balloon-shape lexicon.
- **Film sound** — Chion: diegetic/non-diegetic, the three listening modes, the *acousmêtre* (the bodiless
  voice = voiceover).
- **The palace** — [[The Flow Field is the Spine]] (SFX as the fourth resolution), [[Blocked, Not Prompted]]
  (balloon placement as authored geometry; keypoint-anchored tails), [[Comic and Cinema — Two Ways of Seeing]]
  (the text layer *transduces too*: comic balloon ↔ cinematic caption — it recapitulates BLUELINE's whole
  structure at a smaller scale), [[Loudon Live Design System]] (the author's voice is the locked typography;
  the diegetic world is hand-lettered).

## Open questions

- **Word timing source** — authored MIDI notes inside a line clip (exact, manual) vs. **Whisper forced-
  alignment** from a vocal stem (auto-timed to the real vocal). *Ascension_v8* has a sung track, so Whisper
  alignment is live the moment we want it. Notes first; revisit Whisper when a stem is in play.
- **Burn-in vs. overlay** — keep text a front-end overlay (cheap, editable) or also burn it into rendered
  frames for export? Overlay first; burn-in is an ffmpeg/mux step (Stage 7) when needed.
- **Multi-line / call-and-response** — one active line vs. stacked lines for overlapping vocals. Single first.
- **How opinionated, how soon** — the four voices are *named* now; how much of voices 2–4 to actually build
  before they earn it (rung discipline: each rung ships a usable tool).
