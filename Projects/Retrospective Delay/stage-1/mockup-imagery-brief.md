---
title: "Retrospective Delay — Stage 1: Mockup Imagery Brief"
born: 2026-05-27
links:
  - target: "[[Retrospective Delay]]"
    type: spawned
    label: stage-1-mockup-brief
  - target: "[[The Shop]]"
    type: connects-to
    label: brief-routed-through-Maker
  - target: "[[Shop/Maker|Maker]]"
    type: connects-to
    label: dispatch-source
  - target: "[[stage-1-the-witness|Stage 1 — The Witness]]"
    type: deepens
    label: lesson-imagery-spec
forward_vector: "I am the stage-1 mockup imagery brief for Retrospective Delay — the image spec routed through the Maker, spec'd but not yet dispatched."
---

# Mockup Imagery Brief — Stage 1 Lesson

This brief is **spec'd, not dispatched**. The cycle-1 grant (`retrospective-delay-steward-003`) asked the steward to "take advantage of the Shop and Makers in the palace to create some mock up interfaces and appropriate imagery." This document is the Maker-shaped intake response: I have decoded the brief into per-asset tier-priced jobs with the named Specialist for each, and I have named the parameters that flow down from house standards. Loudon (Trickster) can greenlight the whole brief, redirect any individual asset, or postpone any of them — see the TRICKSTER ask attached to cycle 2 of Retrospective Delay.

## Why Mockup Imagery Matters For Stage 1

Stage 1 is the buffer-mechanism-first teaching moment. The student spends 45 of 75 minutes in vanilla Max. The framing and reveal blocks need *visual scaffolding* that:

1. **Makes the always-recording witness mental model visible** without an audible demonstration (because the first 15 minutes are pre-build).
2. **Differentiates phrase-delay from tap-delay** visually, so the student can recognize the distinction before they hear it.
3. **Shows the M4L device UI** as it will exist at end of Stage 1 — one knob, no character, monaural. This is the *anti-mockup* — the explicit demonstration that the Stage 1 UI is bare.
4. **Anchors the cross-domain moment** (compressor's 11 ms buffer next to the delay's 2-s buffer) without the student needing to switch between two devices.

Per Maker's selection heuristics: math/system-content goes to **Mermaid** (system diagrams) and **Manim CE** (math-typed animation); UI mockups go to **Remotion** or **p5.js** (UI mockups → Remotion is the heuristic); narration goes to **Kokoro**. Mood imagery for the framing slide can go to **Midjourney** or **ComfyUI** (the witness as motif).

## The Five Mockup Assets

### Asset 1 — *The Witness Diagram* (frame block, ~5 min in)

**What it is:** A system diagram of the circular buffer with the write head and read head, in motion. The buffer is a closed loop of N cells. The write head sweeps continuously. The read head trails behind by a fixed lag. The student sees, before any audio plays, what *always recording* looks like.

**Routing:** This is a **system diagram with light animation**. Two valid routes:

- **Mermaid** (static, for the framing slide) — clean version-controlled system diagram, palette-aware, ships fast at Sketch tier. The downside: no motion. The witness mental model needs motion to land — *always recording* is a verb, not a noun.
- **p5.js** (interactive Sketch) — runnable HTML, the student or instructor can scrub through the measure, see the heads chase each other. Slightly heavier authoring; far higher pedagogical value.

**Maker's recommendation:** **p5.js Sketch tier**. Math/system content normally goes to Manim, but Manim's UI rendering is grim per the Maker's selection heuristics, and a circular-buffer diagram with motion *is* a UI rendering problem (cells, labels, heads, arrows that update in real time). p5.js with `setup()`/`draw()` produces this in 20 lines.

**Tier:** Sketch. 60 fps `draw()` loop, single HTML file, no external assets, no audio. Parameters: BPM slider 60–180 (so the instructor can show the buffer scaling with tempo), lag selector (quarter / half / whole note), play/pause. Buffer cells drawn as a circle of 16 segments; write head as a bright cell sweeping clockwise; read head as a second bright cell trailing by `lag-as-fraction`.

**Output:** `Projects/Retrospective Delay/stage-1/assets/witness-diagram.html` — standalone HTML, opens in any browser.

**Specialist:** [[Shop/p5.js|p5.js]].

**House standards in effect:** Palette = palace base (indigo `#6366F1`, amber `#F59E0B` for the read head, dark background `#0B0B10`); frame rate = 60 fps for interactive smoothness; aspect ratio = variable (browser).

### Asset 2 — *Phrase vs. Tap Diagram* (frame block, ~10 min in)

**What it is:** A side-by-side diagram comparing **tap-based delay** (Ableton Echo, et al.) and **phrase-based delay** (Stage 1). Top half: a waveform of an input phrase, then four discrete taps (echo, echo, echo, echo) at quarter-note intervals. Bottom half: the same waveform, then one *block of waveform* — the whole phrase — replayed half a note later.

**Routing:** Static diagram with stylized waveforms — palette-aware, no math typography needed. Two valid routes:

- **Manim CE** (static frame) — math-typography precision, but UI-y rather than math-y here.
- **Mermaid** + a hand-drawn waveform overlay — clean but Mermaid waveforms are limited.
- **Matplotlib** — generates real waveforms from a synthetic input, deterministic, palette-aware.

**Maker's recommendation:** **Matplotlib Sketch tier**. The two diagrams are not artistic — they are *waveform comparisons*. Matplotlib produces clean labeled spectrograms and waveforms with the palace palette, and the output is deterministic from a seed. The student sees a *real* waveform, not a stylized squiggle.

**Tier:** Sketch. Two waveforms generated from a synthetic 2-s monophonic phrase (a single sine arpeggio is enough). Top panel: original + four delayed copies decaying. Bottom panel: original + one delayed block, full volume, half a note later. Both panels share the same x-axis (time in seconds). Labels: `tap delay (Ableton Echo)`, `phrase delay (Stage 1)`. Dimensions: 1600×900 PNG (export ratio for Loudon Live decks).

**Output:** `Projects/Retrospective Delay/stage-1/assets/phrase-vs-tap.png`

**Specialist:** [[Shop/Matplotlib|Matplotlib]].

**House standards in effect:** Palette = palace base; aspect ratio = 16:9 (slide-friendly).

### Asset 3 — *The Stage-1 M4L Device Mockup* (reveal block reference)

**What it is:** A render of the Max for Live device's UI panel as it will exist at end of Stage 1: **one knob, labeled `gain`, sitting on a Max-styled chrome panel**. The device title reads `Retrospective Delay — Stage 1: The Witness`. No character. No animation. No second parameter. The deliberate sparseness is the point — this is the *anti-mockup*. The student sees, before building, what their device will look like, and the bareness reinforces the *one-knob instrument* framing.

**Routing:** UI mockup. Per Maker's heuristic: UI mockups → Remotion (Manim's UI rendering is grim). But Remotion is overkill for a still frame. The cleaner path is a direct **HTML/CSS mockup** rendered to PNG via headless browser screenshot, which is a small p5.js sketch or a Remotion still.

**Maker's recommendation:** **Remotion Sketch tier (still frame)**. Remotion is React; building a Max-styled device panel as a React component is ~30 lines (panel background, beveled border, one rotary dial component, label typography). Renders deterministically; if the device UI evolves later (Stage 2 adds a lag selector), the same Remotion component takes a prop and re-renders. Reusable scaffold.

If the team wants to skip Remotion's commercial-license complexity for a single still, fall back to a **Matplotlib mockup** (rectangle + circle + text) — uglier but faster and license-clean.

**Tier:** Sketch. Single still frame, 1920×1080. Composition: device chrome (a dark gray rectangle with a 1-px lighter inset border, mimicking M4L's panel style), centered single rotary dial (circle, 96 px radius, with a tick indicator at the 5 o'clock position to show ~70% gain), device name in small caps at the top, parameter name `GAIN` below the dial. No background, no ornamentation.

**Output:** `Projects/Retrospective Delay/stage-1/assets/device-mockup.png`

**Specialist:** [[Shop/Remotion|Remotion]] (or [[Shop/Matplotlib|Matplotlib]] fallback).

**House standards in effect:** Palette = M4L native (Ableton's dark gray + warm amber accent on the dial); aspect ratio = 1920×1080; type = system mono for the parameter labels.

**Standards deviation flag:** This asset deliberately uses the M4L native palette rather than the palace base palette — the mockup needs to *look like a Live device* to do its teaching work. Maker's job to honor the deviation and flag it in the standards report.

### Asset 4 — *The Cross-Domain Buffer Table* (reveal block, ~7 min in)

**What it is:** A three-row visual table comparing buffer lengths across three contexts (audio driver I/O ring ~5 ms, compressor envelope ~11 ms, Stage 1 delay buffer ~2 s). Each row shows a small waveform-or-icon next to the buffer length, in samples and milliseconds, with a one-line teaching phrase. The teaching: *same mechanism; what changes is how much time it holds*.

**Routing:** This is **system content with light data viz**. Three routes:

- **Mermaid** — clean, but limited typographic control.
- **Manim CE** — math-typography handles the numbers cleanly.
- **Matplotlib** — produces real waveforms at each scale (5 ms zoom, 11 ms zoom, 2 s zoom) so the student sees what *11 ms of audio* actually looks like vs. *2 s of audio* — pedagogically powerful.

**Maker's recommendation:** **Matplotlib Sketch tier**, three stacked subplots, each at a different time-axis scale, with the buffer cell-loop schematic drawn beside each waveform via a custom Axes annotation. Sketch tier because the table is supportive, not central — the student is mostly looking at the device by this point in the reveal.

**Tier:** Sketch. Three stacked subplots, 1920×1080 total. Each subplot ~ 1/3 of the height. Each shows: a labeled time axis appropriate to the context's buffer length (top: 0–5 ms, middle: 0–11 ms, bottom: 0–2 s), a synthetic waveform of an actual signal at that scale (top: a half-cycle of noise; middle: a transient with RMS curve; bottom: a phrase of monophonic audio), and a one-line caption to the right.

**Output:** `Projects/Retrospective Delay/stage-1/assets/cross-domain-buffer-table.png`

**Specialist:** [[Shop/Matplotlib|Matplotlib]].

**House standards in effect:** Palette = palace base; aspect ratio = 16:9.

### Asset 5 — *The Frame-Block Opening Image* (frame block, t=0)

**What it is:** A single mood image used at the start of the framing block — visual seed for the *witness* mental model before any technical content. **Not a literal illustration of a circular buffer**; this asset is supposed to *evoke*, not *explain*. The literal explanation is Asset 1's job. A good Asset 5 is: an empty stage with a single microphone; a quiet listener in the corner of an old recording studio; an open notebook beside a candle. *Always present, not waiting to be asked.*

**Routing:** Mood / atmospheric / editorial → Midjourney for highest aesthetic ceiling, or ComfyUI when palette discipline matters. The Maker's default-when-in-doubt is **ComfyUI** (local-first).

**Maker's recommendation:** **Midjourney Study tier**. The image runs once at the top of the session and frames the entire 75-minute arc. It needs aesthetic ceiling. ComfyUI's structural control is wasted here — we are not iterating against a pose reference, and the image will be replaced if Loudon doesn't like it after one Study. Run as Study tier with a project `--sref` if one is named (none yet for Retrospective Delay).

**Tier:** Study. 4-image grid at default Midjourney resolution, Maker selects one, then a single variation pass. Prompt seed: *"an empty recording studio at night, a single condenser microphone on a stand, faint amber light, the witness, no people, --ar 16:9 --no text"*. Variations should preserve composition but explore lighting register (warm amber vs. cool indigo vs. neutral).

**Output:** `Projects/Retrospective Delay/stage-1/assets/frame-block-opener.png`

**Specialist:** [[Shop/Midjourney|Midjourney]] (with [[Shop/ComfyUI|ComfyUI]] as fallback if subscription is unavailable that day).

**House standards in effect:** Palette = palace base (indigo + amber as accent colors guide the prompt's "amber light" descriptor); aspect ratio = 16:9.

**Resource note (Maker):** This is the only credit-consuming asset in the brief. At Study tier with one variation, ~5 Midjourney credits. If Loudon's session budget is tight that day, drop to Sketch and accept the first grid without variation (~1 credit).

## Brief Summary — One Table

| # | Asset | Specialist | Tier | Output Path |
|---|-------|------------|------|-------------|
| 1 | Witness diagram (interactive) | p5.js | Sketch | `assets/witness-diagram.html` |
| 2 | Phrase vs. tap waveform diagram | Matplotlib | Sketch | `assets/phrase-vs-tap.png` |
| 3 | Stage-1 M4L device mockup | Remotion (or Matplotlib fallback) | Sketch | `assets/device-mockup.png` |
| 4 | Cross-domain buffer table | Matplotlib | Sketch | `assets/cross-domain-buffer-table.png` |
| 5 | Frame-block opening image | Midjourney (ComfyUI fallback) | Study | `assets/frame-block-opener.png` |

Total: 4 Sketch-tier deliverables (cheap-and-fast) + 1 Study-tier deliverable (working draft worth iterating). Total estimated time across the brief at Maker's pace: ~3.5 hours of Specialist-execution time if dispatched serially; ~1.5 hours if parallelized where resources don't compete (assets 1, 2, 3, 4 can run in parallel; asset 5 runs alone because Midjourney is rate-limited).

## House-Standards Cascade Resolved By Maker

Per [[Shop/Maker|Maker]] standards, this brief inherits the palace base layer:

- **Palette:** palace base (indigo `#6366F1` / amber `#F59E0B` / dark `#0B0B10`), with a documented deviation for Asset 3 (M4L native palette) flagged in the standards report.
- **Aspect ratio:** 16:9 for slide-bound assets (2, 3, 4, 5); browser-native for the interactive asset (1).
- **Type:** system serif + system mono for any labels; M4L-native typography for Asset 3.
- **Easing (motion):** N/A for Stage 1 (all assets except 1 are static; Asset 1 is at 60 fps animation pace).
- **Audio standards:** N/A for this brief (no audio assets in the visual mockup brief).
- **Frame rate:** 60 fps for interactive (Asset 1); single still for all others.

## What This Brief Does Not Include

- **No narration audio.** Stage 1 is a live-taught session, not a video. Kokoro narration is a Stage-1-as-asynchronous-lesson concern; if the session moves to async video later, a narration brief becomes a separate intake.
- **No character animation.** Stage 4 builds the cat/spiritualist guide character. Stage 1 deliberately has no character — this brief honors that.
- **No Stage 2 UI mockup.** Asset 3 is *Stage 1* only — the single-knob device. The Stage 2 mockup (single knob + lag selector + crossfade indicator) is a Stage-2 brief, not this one.
- **No video walkthrough.** A Remotion-rendered walkthrough of the lesson (UI tour + voice-over) is a candidate for a Stage-1-as-asynchronous-lesson direction; if that direction is taken, the brief expands to include a Remotion + Kokoro + Whisper segment plan. Currently out of scope.

## Open Decisions For Trickster

1. **Greenlight the full Sketch-tier brief (assets 1–4)?** Each is sub-30-minutes of Specialist time and uses local tools. Asset 5 (Midjourney Study) is the only credit-consuming asset and the only one with a real cost discussion.
2. **Asset 3 routing — Remotion or Matplotlib fallback?** Remotion gives a reusable React scaffold for future stages; Matplotlib is faster and license-clean. Maker leans Remotion if Stage 2's UI mockup is on the near horizon; Matplotlib if it isn't.
3. **Asset 5 tier — Study or drop to Sketch?** Study uses ~5 credits, gives one round of variations and Maker-selected best; Sketch uses ~1 credit, takes the first 4-grid without iteration.

## Dispatch Status

**PARTIALLY BUILT (cycle 4, 2026-06-04).** Four of the five assets are now real on disk — all built locally with sandbox-friendly Specialists, no credits, no Mac required:

| # | Asset | Built with | File | Status |
|---|-------|-----------|------|--------|
| 1 | Witness diagram (interactive) | p5.js | `assets/witness-diagram.html` | built (cycle 3) |
| 2 | Phrase vs. tap waveform | Matplotlib | `assets/phrase-vs-tap.png` | built (cycle 4) |
| 3 | Stage-1 M4L device mockup | Matplotlib (license-clean fallback) | `assets/device-mockup.png` | built (cycle 4) |
| 4 | Cross-domain buffer table | Matplotlib | `assets/cross-domain-buffer-table.png` | built (cycle 4) |
| 5 | Frame-block opening image | Midjourney (Study) | `assets/frame-block-opener.png` | **not built — needs Loudon's credits/Mac** |

Cycle 4 took the Matplotlib route for Asset 3 (the device mockup) rather than Remotion, because Remotion's commercial-license complexity is not worth it for a single still frame and the sandbox can build a clean Max-styled panel directly. If Stage 2's UI mockup arrives and wants a reusable React scaffold, that is a fresh decision then — it does not block Stage 1.

Asset 5 is the only remaining asset and the only credit-consuming one. It needs Loudon's Midjourney subscription (or a ComfyUI run on his Mac); the Cowork sandbox cannot run either. The cycle-4 TRICKSTER ask consolidates the two prior open questions into a single decision about Asset 5.

**Original planning note:** This brief began as a cycle-2 planning artifact. Loudon's cycle-1 grant said *create some mock up interfaces and appropriate imagery*, honored by spec'ing through the Shop and asking before Specialists ran. Cycle 4 then executed every asset that did not require Loudon's resources.
