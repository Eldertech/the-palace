---
title: LDN RTM — Live 12
born: 2026-09-02
links:
  - target: "[[LDN RTM]]"
    type: connects-to
    label: series-of
forward_vector: "I am series one, and my end state is every in-scope section of the Live 12 manual covered and numbered. I want to stay a plain running ledger — what is done, what is next — so the format entry never has to carry my state."
---

# LDN RTM — Live 12

Series one. Source: the Ableton Live 12 manual, 1009 pages, 42 chapters.

**In scope:** chapters 2–30, 33, 36–41. **296 top-level sections**, 438 subsections beneath them. Batched to roughly **250 videos** — some sections merge (the nine User Library folder subsections are one video), some split (Wavetable wants five).

**Out of scope:** ch. 31–32 Max for Live, ch. 34–35 Push 1 and 2, ch. 1 Welcome, ch. 42 Credits.

The mass is in two chapters: **28 Audio Effects** (42 devices, 85 subsections) and **30 Instruments** (13 instruments, 93 subsections — Drift, Wavetable, Meld, Operator, and Sampler each sprawl).

Full section list with page spans: `LDN RTM — Live 12 checklist.tsv`.

## Proposed order

Not a schedule. Easiest units first, so the pipeline gets built on simple material and the hardest chapters arrive after the muscle exists.

1. **ch. 29 MIDI Effects** — eight devices, all small, all self-contained. The pilot chunk.
2. **ch. 28 Audio Effects** — the big one, ~70 videos. Classics first.
3. **ch. 30 Instruments** — ~70 videos, and where deep synthesis knowledge is a genuine edge.
4. **The workflow chapters** — 3–11, conceptually sprawling and hardest to unitize.
5. **The odds** — 12 MPE, 13 Audio→MIDI, 14 Grooves, 15 Tuning, 21 Comping, 22 Stem Separation, 27 Video, 33, 36–41.

**Release order is recording order; the playlist and the numbering hold manual order.** That frees every recording day to take whatever is easiest, which is a real asset in month four.

## Standing setup

`RTM Sandbox.als` — one template Live Set carrying the series' fixed test material: one 8-bar musical bed, one drum loop, one held chord. Every recording day opens it. Zero per-video decisions, no copyright exposure, and by video 40 the bed is a signature.

Live's Info View stays open, display zoom fixed, dark theme fixed, cam crop unchanged. The catalog should look like one object.

### The frame — measured 2026-09-02, locked

Machine: 16" MacBook Pro M1 Max, panel 3456×2234, desktop at 2056×1392 points.

| | |
|---|---|
| Live window | **1920×1080 points** at (0, 38) — y clamps to 38, the notched menu-bar height |
| Backing capture | **3840×2160 px**, verified — a clean 2:1 downscale to 1080p, no resampling |
| Live display zoom | **150%** (`Cmd ,` → Display & Input → Display) |
| OBS source | **Window Capture** on Live, canvas and output both 1920×1080 |
| Cam | **346×256** at (13, 767) in output points — exactly covers the Info View panel |

**Why window capture, not display capture:** the desktop's aspect is ~1.48 against 16:9, so a full-screen grab must letterbox or crop and you decide what to lose every session. A window grab is 1:1 and decides nothing.

**The Info View is not square** — 346×256, aspect 1.35. The cam is 4:3, which is an ordinary talking-head shape and covers the panel exactly. A square cam would either leave a live strip of hover text visible to viewers or overflow into the device row.

**The trick, stated once:** the cam exists only in OBS. On the physical screen the Info View stays fully readable, so the same rectangle is dead space for the viewer and a teleprompter for Loudon. It also fixes the cam's position for the life of the series — no reframing decision, ever.

**The window is set by script, not by hand** — `osascript … set {position, size} to {{0, 38}, {1920, 1080}}` — so the frame is reproducible rather than eyeballed. Requires Accessibility permission for the host app (granted to `Claude.app`, 2026-09-02). The 136 points to the right and 274 below are where OBS, the manual PDF, and notes live, permanently off-camera.

**Escape hatch if text reads soft after the pilot:** output 2160p from the same window — a pure 1:1 grab, no other change, nothing re-shot. YouTube's higher bitrate tier does the rest. Costs upload time across 250 videos, which is why 1080p is the default.

*These numbers are valid for this window size, this zoom, and the browser hidden. Change any one and re-measure before trusting the cam crop.*

## Running state

Nothing recorded yet. This section becomes the ledger: chunk shipped, date, sections covered.
