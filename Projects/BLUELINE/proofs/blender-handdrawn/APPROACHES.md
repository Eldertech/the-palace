---
title: BLUELINE — approach catalog & decision matrix
born: 2026-06-25
links:
  - target: "[[Frame Designer]]"
    type: connects-to
    label: method-catalogue
  - target: "[[BLUELINE]]"
    type: connects-to
    label: style-range
forward_vector: "I am the menu the frame maker reads before it stages a shot: every proven visual approach, what emotion it serves, where it fails, and what it costs — so a frame is chosen for its meaning, not improvised. I want to grow a 'fails at' column for every row, and to be the thing Loudon compares against when he picks a register."
---

# BLUELINE — approach catalog & decision matrix

The frame maker's job isn't one look — it's **choosing** the look that carries the scene's
emotion, trying a few, comparing, and presenting them to Loudon. This is that menu: every
approach proven in `blender-handdrawn/`, what it's **best for**, where it's **poor**, and cost.
It extends the [[Frame Designer]] method catalogue (the honest "fails at" column is the point).

## The matrix

| Approach | What it is | Best for (emotion / scene) | Poor for | Cost |
|---|---|---|---|---|
| **Confident calligraphic ink** (`cat_stills_lines #9`) | PLAIN single strokes + Bezier smooth + angle-driven thick/thin pen, minimal wobble | decisive, composed, classic — a held moment, a clean establishing frame | frenzy, grit, chaos (too composed) | Blender ~2s/frame |
| **Brush-heavy noir** (`#5`) | thick weight, wide calligraphy range, heavy spotted blacks | dread, weight, menace — deep-shadow noir, a looming threat | light/airy/tender beats; can crush small detail | Blender ~2s |
| **Sketchy / searching line** (`#1`) | SKETCHY chaining + heavy noise (the old "tentative") | anxiety, instability, a mind not yet sure — dream/flashback | anything that must feel resolved or heroic | Blender ~2s |
| **EEVEE toon value** (`*_toon`) | Shader-to-RGB 2-band, flat ink-wash + ink lines | volume & depth, a lit stage, stormy sky — needs mass not just line | pure line-poetry frames (adds weight you may not want) | Blender ~2s |
| **Gen-AI redraw** (`city_push_d95`) | Blender plate → img2img d0.95 / loose canny → gestural ink + splatter | the *texture* of real ink — splatter, flow, organic mark a renderer can't invent | when you need exact control / repeatable identity (it reinterprets) | SDXL ~2 min/frame (RunPod for the tuned model) |
| **Generate-many-select** (`seam_variation`, 8 seeds) | one plate, N seeds → wide range of inkings | finding the right *register* for a beat; giving Loudon a board to pick from | deadlines (N renders); shots needing frame-to-frame match | N × redraw cost |
| **Ink in 3D — blob field** (`blobspace.mp4`) | character-matched splatter as camera-facing billboards at depth + appear/vanish life | extreme-3D moments, energy bursts, ink that moves *with the camera* — impact frames | calm/still beats (the parallax wants motion) | Blender ~18s/30f |
| **Motion atmosphere** (`cat_motion`) | water / clouds / smoke / fire as toon+ink layers behind figures | setting, weather, mood — a sea, a storm, a burning street | being the subject (they're background); fire/low-angle still rough | Blender ~3–8s/clip |

## The emotion → approach shortlist (starting heuristics, not laws)

- **Dread / threat** → brush-heavy noir + thunderhead + billow smoke.
- **Heroic / decisive** → confident calligraphic ink, low canted angle, sparse white space.
- **Chaos / impact** → ink-in-3D blob field (parallax) + storm water + gen-AI splatter redraw.
- **Unstable / dream** → sketchy searching line + wispy cloud.
- **Quiet / held** → confident line, minimal motion, no blob field.

## The workflow this implies (for [[Frame Designer]])

1. **Stage once** — build the plate in Blender (camera, figures, depth).
2. **Render the cheap treatments** — toon / confident ink / brush — side by side (~seconds each).
3. **If it needs ink texture** — send the chosen plate through the gen-AI redraw; for register-finding, fire **N seeds** and lay them out.
4. **Add motion/atmosphere** as layers (blob field, weather) where the beat wants energy.
5. **Compare + present to Loudon** — a small board per frame, each labelled with the emotion it's reaching for. Loudon picks; the pick becomes the shot.

The catalogue is **open** — every new frame adds a row or a "fails at" note. The goal is that the
frame maker never improvises a look: it *chooses* one, shows the alternatives, and can say why.

## Open edges (honest)
- Low-angle cloud framing missed; fire-tongues reads seismograph-like — both need a pass.
- Gen-AI redraw on **local SDXL-base** is inconsistent; the tuned RunPod ink model is the reliable press.
- Temporal seam (stylizing a moving camera frame-by-frame) — in progress; flicker vs. coherence TBD.
- A real **visual judge** (does this frame carry the intended emotion?) is still a human call.
