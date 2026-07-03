---
title: "Graphic Storytelling — source — console-vocabulary"
born: 2026-07-02
links:
  - target: "[[Graphic Storytelling]]"
    type: connects-to
    label: child-of
forward_vector: "I am the Phase-1 working spec for the Visual Language Console — the prompt token, curated exemplar, and known pitfall for each fader pole. I exist to feed the hybrid atlas (curated plates + generated calibration strips) and the tool's prompt-assembly, until the built tool absorbs me."
---

# Visual Language Console — Phase 1 vocabulary

For each locked fader, per pole: the **prompt token(s)** (what to write for BLUELINE's SDXL pen-flow setup), a **curated exemplar** (the plate that *defines* the pole for the hybrid atlas), and the **pitfall** (what the model does wrong, and the fix). Intermediate slider positions blend the poles.

## The seven faders

**1 · Line weight** — hairline ↔ heavy brush
- *hairline:* `fine crowquill line, delicate thin ink linework`. Exemplar: Geof Darrow, classic crowquill. Pitfall: SDXL thickens thin lines — reinforce `thin delicate linework` + negative `thick lines`.
- *heavy brush:* `heavy brush inking, thick bold confident brushstrokes`. Exemplar: Mignola, Toth. Pitfall: goes blobby — add `confident brush, controlled`.

**2 · Line character** — clean ligne-claire ↔ dry/scratchy
- *ligne claire:* `ligne claire, clear even line, clean confident contour, no hatching`. Exemplars: Hergé, Chris Ware, Geof Darrow, Jason, Moebius (*Le Monde d'Edena*). Pitfall: SDXL sneaks in hatching — **negative** `hatching, sketchy, scratchy, crosshatch`.
- *scratchy:* `scratchy dry-nib ink line, searching sketchy ink line`. Exemplars: Ralph Steadman, early Bill Sienkiewicz. Pitfall: reads as pencil — specify `ink, high contrast`.

**3 · Black density (spotting)** — open ↔ near-solid noir
- *open:* `open airy linework, minimal blacks, lots of white space, flat white ground`. Exemplar: ligne claire / open manga. Pitfall: model fills grey — add negative `grey shading, gradient`.
- *near-solid noir:* `heavy spotted blacks, bold black shapes, chiaroscuro, film-noir shadow`. Exemplars: Miller *Sin City*, Mignola, Toth. Pitfall: renders *soft grey* shadow instead of hard black shape — add `pure black shapes, high contrast, no gradient`.

**4 · Mark technique** — solid → hatch → cross-hatch → feather
- *solid:* `solid flat black fills`. Exemplar: Mignola / *Sin City*.
- *hatch:* `parallel-line hatching shading`. Exemplar: classic pen shading.
- *cross-hatch:* `cross-hatching, intersecting line shading`. Exemplar: Bernie Wrightson, engraving. (Verified craft: cross-hatch = *intersecting* layers, tonal by spacing/layer count.)
- *feather:* `ink feathering, tapered barb-lines off a heavy line`. Exemplar: Toth / Kirby inkers. (Verified craft: feathering = barbs off a heavy line — softens an edge while staying high-contrast.) Pitfall: model reads "feather" as a bird — write `ink feathering shading`.

**5 · Detail density** — minimal (Toth) ↔ dense (Moebius)
- *minimal:* `minimal detail, essential shapes only, spare economical drawing`. Exemplar: Alex Toth. Pitfall: model adds clutter — strong negative `busy, cluttered, detailed background`.
- *dense:* `intricate dense linework, richly detailed`. Exemplars: Moebius / *Métal Hurlant*, Geof Darrow. Pitfall: dense + heavy blacks muddies — keep one high, not both.

**6 · Abstraction** — naturalistic ↔ iconic
- *naturalistic:* `naturalistic proportions, observational, realistic anatomy`.
- *iconic:* `simplified iconic cartooning, flat graphic shapes, reduced features`. Exemplars: Chris Ware, mid-century UPA. Pitfall: iconic + dense detail fight — pair iconic with low detail.

**7 · Contrast & light** — high-key flat ↔ low-key single-source noir
- *flat:* `flat even high-key lighting, daylight`.
- *noir:* `low-key lighting, single hard light source, deep shadows, film noir, raking light`. Exemplars: *Sin City*, Toth. Pitfall: model lights the whole scene — add `single light source, most of frame in shadow`.

## Medium picker (categorical)

- `pen` → `pen and ink, crowquill nib drawing`
- `brush` → `brush and ink, sable-brush inking, expressive brushstrokes` (Windsor & Newton Series 7 look)
- `dry-brush / scratchboard` → `dry-brush texture` / `scratchboard, white lines carved on black, engraving texture`
- `woodcut` → `black-and-white woodcut print, relief print, bold carved lines` — Exemplars: Lynd Ward, Frans Masereel. Pitfall: model adds wood-grain/color — negative `wood texture, color`.
- `pencil` → `graphite pencil drawing on toned paper, loose gestural graphite` (departs from ink; reads grey).

## Color panel (the featured thread)

- **mode B&W** → `black and white, monochrome ink`.
- **mode spot accent** → `black and white with a single [hue] spot color, selective color`. Exemplars: *Sin City* (red); film ref *Schindler's List* red coat. `carries`: object / light / field decides what wears the hue.
- **mode duotone** → `duotone two-color print, black plus [hue], risograph`. Exemplars: riso zines; *SuperButch* (sepia = 1940s, blue = 1980s — color as narrative signal).
- **mode flat limited** → `flat limited palette keyed to [hue], restrained flat color`. Exemplars: *300* (Miller / Lynn Varley — washed dull-yellow + Spartan red); Mignola / Dave Stewart flat fields.
- **hues:** crimson · amber · teal · cobalt · acid green · violet (→ literal color words in the prompt).

## Global SDXL notes (BLUELINE pen-flow)

- **Lead the prompt with the style:** `ink art of…` / `pen-and-ink comic panel of…` — SDXL weights early tokens and the style must win.
- **House constant (always append):** `on rough textured paper, ink on paper, hand-drawn`.
- **No-CGI negative (always):** `3d render, cgi, photorealistic, smooth gradient, octane, glossy, digital painting`. (Matches the BLUELINE finding that SDXL beats FLUX for pen-flow — FLUX renders "too perfect/vector".)
- **Base candidate:** the `Ink Art XL` SDXL LoRA (strong black linework + intricate cross-hatching) is worth testing as the pen-flow base.
- **Artist reference tokens** that reliably pull the register: `Moebius, Métal Hurlant, Heavy Metal` (dense/BD), `Mignola` (flat-black noir), `Alex Toth` (economy).
- **Consistency rule:** lock the whole style clause + seed + LoRA; vary only the subject/pose. That fixed clause is exactly what the console exports to the board record.

## Sources

Ink Art XL LoRA (Civitai); COMICPAD inking-techniques guide; Comic Book Glossary (cross-hatching); Iosua Illustrations (spotting blacks / feathering); Wikipedia *Ligne claire* and *300 (comics)*; PromptHero comic-book prompts; Stable Diffusion Art SDXL styles. Plus the verified craft already in [[Graphic Storytelling]] (Toth, Klein, Blambot, Mignola/Stewart, Sin City, Masereel/Ward).

## Tool state — V0 shipped, Phase 2 parked (2026-07-03)

The **Visual Language Console** is the interactive tool this vocabulary feeds: decompose the hand-drawn comic style into named sliders so a style can be *spoken* and exported as a consistent prompt + style-spec (a field on BLUELINE's board record → same prompt every frame). It extends the Taste Breeder (*which* frames Loudon likes) into articulation (*why* / the variables); an instance of [[Steer the Generator]], staging kept upstream in [[Blocked, Not Prompted]].

- **Locked v1 variables:** 6 sliders — line weight · line character (ligne-claire↔scratchy) · black density · detail density · abstraction (naturalistic↔iconic) · contrast & light — plus **Mark technique** (solid/hatch/cross-hatch/feather), a **Medium** picker (pen/brush/dry-brush/woodcut/pencil), and a **Color panel** (B&W / spot accent / duotone / flat-limited · hue · accent-carries object/light/field). Paper grain = house constant, not a knob. v2 backlog: motion · tonal range · ink grit · perspective depth/distortion.
- **V0 shipped** (2026-07-02, no spend) as a curated-only claude.ai artifact (`https://claude.ai/code/artifact/ec21cd61-a5e1-44fd-abd8-7aa061a58c44`); source HTML is in a session scratchpad, **not yet copied into the palace** (open item: save it here + commit).
- **Phase 2 atlas (parked):** rendered on **local `_tools/ComfyUI` SDXL** (not RunPod — the FLUX endpoint is wrong for pen-flow) via `Projects/BLUELINE/proofs/style-atlas/style_atlas.py` → 47 frames + 10 contact strips + manifest in `proofs/style-atlas/frames/`, **untracked on disk**. ~57s/frame on MPS.
- **Key finding:** the **colour axis** (a crimson spot) and the **4 presets** read clearly and are useful; but the **subtle single-fader sweeps don't isolate** — in txt2img, changing a style word reshuffles the whole composition even at fixed seed, so each strip reads as 5 variations, not one variable ramping (and the strong base style swamps subtle mark-technique tokens).
- **V1.1 resume (the on-thesis fix):** re-render with a **ControlNet** (canny/depth from one reference frame) to lock composition so only surface style varies — [[Blocked, Not Prompted]] applied to the atlas (SDXL ControlNets are staged locally). Then embed the strips into the V0 artifact as data-URIs (its CSP blocks external images) = **V1**. Also open: a reciprocal BLUELINE → [[Graphic Storytelling]] `exemplifies` link.
