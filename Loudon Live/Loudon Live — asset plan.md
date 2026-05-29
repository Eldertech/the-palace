---
title: Loudon Live — asset plan
born: 2026-05-09
links:
  - target: "[[Loudon Live]]"
    type: connects-to
    label: child-of
  - target: "[[Loudon Live Design System]]"
    type: spawned
    label: cemented-into
forward_vector: "I am the visual system and variant-rendering plan for Loudon Live. I want to grow into a working pipeline — palette library, generator catalog, render scripts — that produces a fresh stream pack with one command, and that hooks into the maker specialists once they exist."
---

# Loudon Live — Asset Plan & Variant System

How I'll build the images, and how we keep them fresh stream-to-stream without re-doing the work each time. Companion to `loudon-live-launch-kit.md`.

---

## 1. Focused asset list

Cut down from the launch kit MVP to exactly what's needed.

**One-time channel assets** (build once, use forever)

| # | Asset | Dimensions | Format |
|---|---|---|---|
| 1 | Channel banner | 2560×1440 (safe area 1546×423) | PNG |
| 2 | Avatar | 800×800, displayed as 720 circle | PNG |
| 3 | Watermark | 150×150 | PNG, transparent |
| 4 | Cam frame | sized to your cam placement | PNG, transparent |
| 5 | Lower-third name tag | ~600×100 | PNG, transparent |

**Per-stream cards** (regenerated every stream — the variant system applies here)

| # | Asset | Dimensions | Format |
|---|---|---|---|
| 6 | Starting Soon | 1920×1080 | PNG |
| 7 | BRB | 1920×1080 | PNG |
| 8 | Stream Ended | 1920×1080 | PNG |
| 9 | Topic title card | 1920×1080 | PNG |

**Toggle overlays** (built once, reused — text fields swap per stream)

| # | Asset | Dimensions | Format |
|---|---|---|---|
| 10 | Multi-purpose lower-third (Now building / Tool in focus / Topic) | ~600×100 | PNG, transparent |

Ten assets total. Five are one-time. Four regenerate per stream. One reused with text swaps.

---

## 2. The variant system — concept

Every stream gets a fresh visual skin. The skin = palette + generative element + seed. The grammar (typography, layout, wordmark) stays locked.

```
LOCKED (channel grammar)            FRESH (per-stream skin)
─────────────────────────           ─────────────────────────
Typography pair                     Color palette
Layout grids                        Generative element type
Wordmark "Loudon Live"              Random seed
Safe zones / margins                Topic text
Asset dimensions                    Stream number
```

That separation is the whole trick. Locked grammar makes the channel recognizable. Fresh skin keeps it from looking templated.

---

## 3. Channel grammar (locked elements)

**Typography pair (recommendation)**

- Display face: a slightly characterful sans (proposing **GT Sectra Display** or **Recoleta** or **Tiempos Headline**) — used only for the wordmark and top-line headlines.
- Body face: a clean grotesk (proposing **Inter** or **IBM Plex Sans**) — used for everything else.

Two faces, no more. If you'd rather go free-only: Inter + Fraunces is a solid pair that's free for commercial use.

**Layout grid (1920×1080 cards)**

- 96 px outer margin (clear of OBS chat/cam overlays).
- 12-column internal grid, 24 px gutter.
- Headline sits in upper third, baseline at ~360 px from top.
- Generative element occupies lower two-thirds, behind or below text.
- Wordmark anchored bottom-left or bottom-right, small (~24 px cap height).

**Wordmark "Loudon Live"**

One typographic treatment used identically everywhere — banner, watermark, cards, lower-third. Built as a single SVG and referenced.

---

## 4. Per-stream skin (fresh elements)

**Palette library — proposed starter set of six**

Each is a triple: background, primary ink, accent. Names are working titles.

1. **Graphite** — near-black bg / off-white ink / pale amber accent
2. **Amber Lab** — warm cream bg / dark espresso ink / signal-orange accent
3. **Teal Patch** — deep teal bg / pale cyan ink / coral accent
4. **Dusk Tape** — dusty plum bg / off-white ink / mustard accent
5. **Cobalt Grid** — deep cobalt bg / pale blue-white ink / lime accent
6. **Bone Synth** — bone bg / charcoal ink / electric magenta accent

Each stream picks one. Manual choice or auto-rotated by stream number.

**Generative element library — six types to start**

The visual "freshness" lever. One per stream. Each takes a seed.

1. **Waveform stack** — three or four overlaid waveforms (sine, saw, square, noise), seed shifts phase + frequency.
2. **Particle field** — slow drift of small dots; seed shifts density + drift vector.
3. **Lissajous bundle** — overlaid Lissajous curves at related ratios; seed picks the ratio family.
4. **Spectral bands** — vertical-band spectrogram-like field; seed shifts band content.
5. **Modular grid** — sparse-filled grid cells suggesting a step sequencer; seed picks fill pattern.
6. **Phase interference** — two-source wave-interference field; seed picks source positions.

All render in the palette's accent color over the background, at 25–60% opacity depending on the asset.

**Seed**

A single integer. Same seed = identical render. Different seed = different render in the same family.

**Topic text**

One short line per stream. Goes on Starting Soon, Topic title card, and (optionally) channel banner if you want a "this week" tease.

---

## 5. Production approach — SVG-first, Python-driven

**Why SVG**

Vector → crisp at any size. Plain-text → trivial to template. The same template renders the 2560-wide banner and the 150-wide watermark with no quality compromise.

**Why Python**

It's the friction-free path for parameter sweeps. PIL/cairosvg/rsvg-convert handle SVG-to-PNG. No GUI tool needed.

**Toolchain**

- Python 3.x
- Jinja2 (SVG templating) or plain f-strings
- cairosvg (SVG → PNG conversion) — pure-python, no system deps
- Optional: numpy for the generative-element math
- Output: PNGs at exact OBS-ready dimensions

No paid tools, no Adobe dependency. Runs locally in a few seconds per stream pack.

---

## 6. Project layout (proposed)

This will live in your selected workspace folder when you're ready. Until then, I can scaffold it inside the outputs folder as a working draft.

```
loudon-live-assets/
├── palettes.py                     # named palettes (the six above)
├── generators/                     # one file per generative element
│   ├── waveform.py
│   ├── particles.py
│   ├── lissajous.py
│   ├── spectral.py
│   ├── modular_grid.py
│   └── phase_interference.py
├── templates/                      # SVG templates with placeholders
│   ├── banner.svg.j2
│   ├── avatar.svg.j2
│   ├── watermark.svg.j2
│   ├── cam-frame.svg.j2
│   ├── lower-third.svg.j2
│   ├── starting-soon.svg.j2
│   ├── brb.svg.j2
│   ├── stream-ended.svg.j2
│   └── topic-card.svg.j2
├── build_channel_pack.py           # one-time channel assets
├── build_stream_pack.py            # per-stream cards
├── render.py                       # SVG → PNG conversion
└── out/
    ├── channel/                    # one-time renders
    │   ├── banner.png
    │   ├── avatar.png
    │   ├── watermark.png
    │   └── cam-frame.png
    └── streams/
        ├── 001/                    # stream #1 pack
        │   ├── starting-soon.png
        │   ├── brb.png
        │   ├── stream-ended.png
        │   └── topic-card.png
        ├── 002/
        └── ...
```

---

## 7. Per-stream usage

Once built, generating a fresh stream pack is one command.

```bash
# Manual — full control
python build_stream_pack.py \
    --stream 1 \
    --topic "first principles" \
    --palette amber-lab \
    --generator waveform \
    --seed 42

# Auto — palette/generator/seed picked deterministically from stream number
python build_stream_pack.py --stream 1 --topic "first principles" --auto
```

Output: `out/streams/001/` populated with four PNGs, ready to drop into OBS scenes.

For preview without committing, add `--preview` to also write SVGs you can open in any browser to vet before the PNG conversion.

---

## 8. Per-asset creation plan

For each of the ten assets, here's the specific plan.

**1. Channel banner (one-time)**

- Solid background from chosen palette (suggest Graphite for default).
- Wordmark "Loudon Live" centered in safe area, large (~140 px cap height).
- Tagline below wordmark, small (~36 px).
- Generative element behind, low-contrast (~15% alpha), full bleed but masked away from safe zone.
- Optional schedule line as a third row, smaller still.
- Built once. Re-render only if you change tagline, schedule, or palette mood.

**2. Avatar (one-time)**

- Solid palette background.
- Stylized "LL" monogram or simplified wordmark, centered.
- Subtle generative element behind, very low contrast (~10% alpha).
- Important content inside the 720 px safe circle.

**3. Watermark (one-time)**

- 150×150, transparent.
- Just the "LL" monogram in palette ink color, no background.
- Sized to read at 50% screen size (YouTube shrinks watermarks).

**4. Cam frame (one-time)**

- Transparent PNG sized to your cam placement.
- 6–8 px solid stroke in palette accent color.
- Optional small "live" dot in upper-left corner.

**5. Lower-third name tag (one-time)**

- Transparent.
- Solid palette-ink bar with "Loudon · Loudon Live" set in body face.
- Used persistently throughout streams.

**6. Starting Soon (per stream)**

- Solid palette bg.
- Headline "Starting soon" in display face.
- Subhead: locked subline + topic-of-the-day.
- Generative element fills lower two-thirds at ~40% alpha.
- Wordmark bottom-right, small.

**7. BRB (per stream)**

- Solid palette bg.
- Headline "Back in a minute".
- No topic line — keep it cleaner than Starting Soon.
- Generative element at lower alpha (~25%) — a quieter cousin of the same render.
- Wordmark bottom-right.

**8. Stream Ended (per stream)**

- Solid palette bg.
- Headline "That's the stream".
- Subhead "Thanks for hanging out · VOD stays up".
- Generative element at higher alpha than the others (~55%) — it's earned its place by then.
- Wordmark bottom-right.

**9. Topic title card (per stream)**

- Solid palette bg.
- Big topic line top — the day's focus, set in display face.
- Small footer "Loudon Live · stream [N]".
- Generative element behind at moderate alpha (~35%).
- Used mid-stream as a transition or chapter marker.

**10. Multi-purpose lower-third (one-time, text swaps per stream)**

- Transparent.
- Solid palette-ink bar with two text slots: a small label slot ("Now building" / "Tool in focus" / "Topic") and a value slot.
- Built once as an SVG; the build script substitutes the text strings at render time.

---

## 9. What I need from you to build this

In rough priority order:

1. **Approve the asset list** (any items to drop or add?).
2. **Approve the typography pair** — my picks above, or your override.
3. **Approve the starter palette library** — six is a starting point; we can prune to three if simpler is better for stream #1.
4. **Decide on a working location** — keep this in the outputs folder for now, move it into a permanent project folder later, or put it directly in a folder you'd select today.

Once you approve those, I can scaffold the directory, build the templates, and render a test "stream 0" pack so we can vet the look before stream #1.

---

## 10. Suggested next move

Smallest useful step: build a single test render — `Starting Soon` only, in the **Graphite** palette with the **Waveform Stack** generator at seed 42. One image, fast to make, fast to react to. If it lands, we expand. If it doesn't, we've burned thirty minutes, not three days.
