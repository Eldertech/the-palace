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
| OBS source | **Application Capture** on `com.ableton.live`, canvas and output both 1920×1080 |
| Cam | **347×337** at (13, 688) in output points — covers the whole Info View widget |

**Why application capture, not display or window.** Display capture is out twice over: the desktop's aspect is ~1.48 against 16:9, so a full-screen grab must letterbox or crop and you re-decide what to lose every session — and cropping it to Live's region is *not* isolation, because anything overlapping that region records too (OBS's own window did, on the first test). Window capture isolates correctly but binds to a window id that changes between launches. Application capture targets the bundle id, isolates Live's windows from whatever sits on top, and survives a relaunch mid-session. *(Corrected 2026-09-02 — this section said "window capture" until a screenshot showed the occlusion.)*

**The Info View is nearly square, and it is taller than it looks** — measured off the running app by colour-matching its fill: a border at y=688, a lighter title strip 690–714, the body 716–1023, all spanning x 14–359. So the widget is **346×335**, not the 346×256 first eyeballed, and the cam is 347×337 to cover it with a point to spare. The first attempt covered only the lower two-thirds, leaving the title and the first wrapped line of hover text visible above Loudon's head — a label changing with every mouse move, caught in the first real recording rather than in any inspection. A 16:9 camera fills this near-square box by cropping its sides, which is the right trade for a close head shot.

**OPEN — the Info View height changes with Live's bottom view, so no single cam size is right.** Found 2026-09-02 while recording: Live's bottom panel is taller in **Clip View** than in **Device / Effects View**, and the Info View sits inside it, so the panel's *top edge* moves while its bottom stays put.

| Live's bottom view | Info View panel (output points) |
|---|---|
| **Clip View** | top **688**, bottom 1023 — height **335** |
| **Device / Effects View** | top **767**, bottom 1022 — height **256** |

Both span x 14–359. The two demands conflict: a cam sized for Clip View (347×337 at 13,688 — what is set now) **overflows into the device row by ~79 points when Effects is showing**; a cam sized for Device View (346×256 at 13,767 — the earlier setting) **leaves the Info View's title and first wrapped line visible above Loudon's head in Clip View**, which is how the problem was first seen.

Not resolved, and deliberately not changed mid-session. The options when it is picked up: fix the bottom view for the whole series so only one geometry exists; size for the shorter panel and accept the label in Clip View; size for the taller and accept covering a strip of the device row; or drive the cam transform from the current view, which is possible over the socket but means the frame is no longer a constant — the thing § The trick claims as its main benefit. **Whatever is chosen, the two measurements above are the ground truth; do not re-derive them.**

**The trick, stated once:** the cam exists only in OBS. On the physical screen the Info View stays fully readable, so the same rectangle is dead space for the viewer and a teleprompter for Loudon. It also fixes the cam's position for the life of the series — no reframing decision, ever.

**The rig is driven, not clicked.** `Projects/LDN RTM/obs/rtm.py` operates OBS over its WebSocket — preflight, roll, stop-and-rename, advance, batch — so no setting is ever hand-entered and every one can be read back. Editing OBS's config files instead produced three silent failures in one afternoon; see [[OBS]] § Gotchas.

**The window is set by script, not by hand** — `osascript … set {position, size} to {{0, 38}, {1920, 1080}}` — so the frame is reproducible rather than eyeballed. Requires Accessibility permission for the host app (granted to `Claude.app`, 2026-09-02). The 136 points to the right and 274 below are where OBS, the manual PDF, and notes live, permanently off-camera.

**Audio, set 2026-09-02.** Loopback trimmed at the Arturia interface so the wire arrives near **−12 dBFS**, with the OBS fader at unity — nothing attenuated inside OBS, so what the meter shows is what records. Boom mic likewise at unity, peaking around −13 while speaking. The earlier arrangement (a hot −1 dBFS input pulled down 20 dB by the OBS fader) looked fine on the meter and was one loud moment from clipping before OBS ever saw it. **Trim at the source; leave the OBS faders alone.** `rtm.py levels` reports both taps and an `active %` so a quiet window is not mistaken for a quiet source.

**Sound, verified 2026-09-02 on the first real take.** Two-stage normalisation, because the stages answer different questions. Stage one sets the **balance** — mic to −16 LUFS, program to −20, so the voice sits 4 LU above whatever Live is playing. Stage two sets the **delivered level** — the mix to −14 LUFS, which is YouTube's own normalisation target, with a −1.0 dBTP ceiling and a limiter behind it. A single-stage pass left delivery to wherever the sum happened to land: −16.7 LUFS on the test, about 3 dB under target, which would have played quieter than every other video a viewer had open. Measured result: **−14.6 LUFS, LRA 3.8**. The video stream is copied, never re-encoded — an 18.9-second take processed in 1.9 seconds.

**Escape hatch if text reads soft after the pilot:** output 2160p from the same window — a pure 1:1 grab, no other change, nothing re-shot. YouTube's higher bitrate tier does the rest. Costs upload time across 250 videos, which is why 1080p is the default.

*These numbers are valid for this window size, this zoom, and the browser hidden. Change any one and re-measure before trusting the cam crop. **And the cam row is not settled** — see the open item above; it is correct for Clip View only.*

## Running state

Nothing recorded yet. This section becomes the ledger: chunk shipped, date, sections covered.
