---
title: "Shop/Lettering"
type: specialist
status: alive
medium: image
tool: "ComfyUI SDXL + ControlNet-canny (render_text.py)"
tool_version: "sd_xl_base_1.0 · controlnet-canny-sdxl"
born: 2026-06
forward_vector: "Hand me words plus who-says-them-how-to-whom, and I render the letterform that means it — I author the legible skeleton, let diffusion supply the emotional material, and leave the font black when the void speaks louder. Proven on BLUELINE's seven voices; I want to harden my pipeline into named recipes, grow a vector-letterer for long legible text, and learn placement so I letter into the frame, not just onto black."
links:
  - target: "[[The Shop]]"
    type: member-of
  - target: "[[BLUELINE]]"
    type: emerged-from
    label: proving-ground
  - target: "[[Frame Designer]]"
    type: connects-to
    label: letters-what-it-draws
  - target: "[[Typography as Meaning]]"
    type: exemplifies
  - target: "[[Blocked, Not Prompted]]"
    type: exemplifies
    label: for-text
  - target: "[[BLUELINE — Text Layer]]"
    type: connects-to
    label: the-spec
  - target: "[[Steer the Generator]]"
    type: exemplifies
    label: control-not-prompt
  - target: "[[Graphic Storytelling]]"
    type: enables
    label: letters-the-voices
---

# Shop/Lettering — *the emotional-text renderer*

The [[Shop]] citizen that renders **short, high-impact words as imagery** where the *letterform carries the feeling* — the register a font can't reach. Sibling to [[Frame Designer]]: it letters what the frame draws. Realizes [[Typography as Meaning]]; grown on [[BLUELINE — Text Layer|BLUELINE's text layer]]. (Long, legible text stays the future **vector letterer's** job — see Forward Vectors.)

## Charter

Given a word and its emotional/source metadata, produce a letterform image — on black, in the locked house idiom — whose *substance* (font, material, treatment, negative space) means what the word means. Legible by construction, expressive by diffusion.

## Job Contract

```
in:  (words, type, source, emotion, addressee, diegesis, beat)
out: text image  (on black · locked idiom · optional negative-space variant)
```

## The pipeline (its working wisdom)

1. **Skeleton** — a *hand-drawn* font carries the source before any pixel: Nosifer **bleeds** the dying woman's *too late*; Bangers **shouts** the hero's *NO*; New Rocker is gothic-monumental for a title. A wide font library + sampler makes the choice (`fetch_fonts.py`, `font_sampler.py`).
2. **Canny-lock** — *[[Blocked, Not Prompted]], for text*: the skeleton is the pose, the material is the render. Diffusion fills the letters; it cannot spell them away.
3. **Photoreal → ink (rich-first / stylize-last)** — render rich material (flame/blood/ember), desaturate (its values carry the form), `img2img ~0.85` to the locked pen-flow ink — canny still holding the letters on *every* pass. Same discipline as the boards.
4. **Negative-space knockout** (optional, never forced) — leave the font black; the word becomes the void the energy flows around. Strongest on a light energy field.

## Tiers

- **Sketch** — skeleton + sampler only (CPU, instant): pick the font, see the word.
- **Study** — skeleton+canny photoreal (1 render): the material register.
- **Piece** — full rich-first→ink (+ optional negspace): the house idiom.

## Gotchas (hard-won)

- **Don't feed the photoreal `gesture` into the ink prompt** — it names the photoreal material (fire/blood/embers) and re-injects it; BURNING stayed on fire until dropped.
- **Mechanical fonts dominate** — use *hand-drawn* skeletons and a **loose** canny on the stylize pass (released ~45%) so the letters go organic, not a traced outline.
- **Negative-space sings only on a light energy field**; on a dark field the black word vanishes.
- **SDXL can't spell free-hand** — keep words short; generate-many-select; the skeleton is the legibility floor.

## Resource Footprint

Local ComfyUI SDXL, ~150–200 s/word on MPS (Study/Piece). Skeletons, sampler, and the knockout are CPU-only and instant.

## Bench

`proofs/text-layer/`: `render_text.py` (skeleton · free · stylize modes; `resolve_font`, `knockout`), `text-prompts.json` (the emotion→material structure + per-voice fonts), `fetch_fonts.py` + `font_sampler.py` (the 50-face library + `font-sampler.html`), and the 7-voice proof suite (`out/`, `contact-sheet.html`).

## Forward Vectors

- **Harden the modes into named Shop recipes** so a brief dispatches a tier, not a script.
- **Grow the vector letterer** — the deterministic sibling for long legible captions/narration (where diffusion's spelling can't go).
- **Learn placement** — letter *into the frame* (tail to a mouth keypoint) and *into the margin* (the author's voice), per [[Typography as Meaning]].
- **A visual legibility judge** — so the bench can reject a mangled word without a human eye.
