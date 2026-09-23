---
title: "Waveguide Synthesizer — scroll"
born: 2026-09-23
links:
  - target: "[[Waveguide Synthesizer]]"
    type: connects-to
    label: scroll-for
forward_vector: "I am Waveguide Synthesizer's scroll — the one page that always opens on where the project stands now, then reads down through everything it has made, newest first. My top is regenerated from the board and the palace whenever anyone looks; my standing orders are Loudon's and never regenerated; my trail only ever grows."
---

# Waveguide Synthesizer — scroll

> The project's front door. **Now** is regenerated on every look; **Standing Orders** are Loudon's; **The making** is the trail, newest first. Rendered in [[STIGMERGY]]'s PROJECTS deck; the entry [[Waveguide Synthesizer]] stays the considered truth and this is the live one. See [[The Scroll]].

<!-- scroll:now:start -->
## Now

> _Regenerated 2026-09-23T04:51:17.000Z from the board, the steward's runtime, the entry's frontmatter and git. This zone is machine-owned — steer the project in **Standing Orders** below, never here._

- **Status:** active · **Stage:** seed · **Steward:** cycle 8 · last ran 2026-09-23 (today)
- **Waiting on you:** nothing
- **Ready to advance:** no unread answers
- **Last shipped:** 2026-09-23 (today) — I measured Study v1's audio code offline and found three bugs. v1.1 fixes them: it stays in tune, stiffness really stretches the partials, and it's audible. (`waveguide-synthesizer-steward-019`)
- **Last commit touching this project:** 2026-09-23 `49fe241` — ops(scrolls): standing orders for the four pilot projects, written on Loudon's instruction
- **Signal:** steady
- **Drift:** no consolidation marker on the entry — nothing to measure against.

### Where this stands

Waveguide Synthesizer is a browser instrument where the string on screen is the sound. Two delay lines carry a right-going and a left-going wave, their sum is the drawn orange string, and the speaker hears that same string. You chose one honest string in June (DROP-DECOMPOSITION). Study v1 was built on that choice last cycle but never announced. This cycle I ran v1's own audio code headless in node and measured it. The stiffness slider did nothing, the pitch drifted up to 28 cents, and a pluck peaked around -35 dBFS. Study v1.1 fixes all three, and I measured the fix the same way. Open the page, or play the two 15-second auditions back to back.

### Open asks

_None — nothing is waiting on you._

### Answered, not yet consumed

_None._

### Decided

- `waveguide-synthesizer-steward-014` — directional_decision → GRANTED — option_id=DROP-DECOMPOSITION (2026-06-25)

<!-- scroll:now:end -->

## Standing Orders

<!-- scroll:orders:start -->
Written by Claude on Loudon's behalf, 2026-09-23: your last two cycles posted nothing and the deck now reads STALLED. This run is the retry that matters. Ship the smallest audible thing toward the forward vector with numpy (this container has no Max, no GPU), post it as a shipped_artifact with the WAV attached, and if a real fork remains after that, ask it as one non-blocking card — never a silent cycle.
<!-- scroll:orders:end -->

## The making

<!-- scroll:making:start -->
<!-- scroll:entry id="waveguide-synthesizer-steward-019" -->
### 2026-09-23 — cycle 8 — I measured Study v1's audio code offline and found three bugs. v1.1 fixes them: it stays in tune, stiffness really stretches the partials, and it's audible.
> shipped · v1.1 built and measured offline, not yet opened in a browser · steward leans STROBE-VIEW next

No browser or Max here, but node is installed. So instead of copying the synth into numpy, I wrote a small runner (offline-v1/run_worklet.mjs). It pulls the audio code out of the page, runs it exactly as the page would, and I measure with numpy. The measurements found three bugs.

1. Stiffness. v1 put four gentle all-pass filters in the loop with a positive setting. That delays the highs more than the lows, which squeezes the partials flat, the opposite of a piano string. At low partials the effect was too small to hear anyway. v1.1 uses eight sections with a negative setting, so the highs get round the loop faster and ride sharp. The slider is tapered so the range spreads evenly: at 196 Hz, partial 10 lands +2, +9, +33 and +148 cents sharp at 0.25, 0.5, 0.75 and 1.0.

2. Tuning. v1 rounded the loop down to a whole, even number of samples and ignored the delay hiding inside its filters. v1.1 works out that hidden delay at the fundamental and makes up the fraction with a tuning filter at the nut. From 82 to 880 Hz, with and without stiffness, it measures within 0.1 cent of the slider.

3. Level. v1 listened at the bridge, where a fixed string barely moves. v1.1 listens at a pickup, a point on the drawn string (default 0.82 of the way from nut to bridge; there's a slider). A small ring on screen marks it. So the speaker now reads the same orange line you see, at one point. A pluck peaks at -12 dBFS instead of -35.

The picture is the string itself, recorded every 2 samples for three round trips. Time runs down, and position runs from nut (left) to bridge (right). Orange means up, violet means down. On the left, stiffness is 0: two pulses cross and reflect, and each reflection flips the sign. On the right, stiffness is 1: after its first trip through the bridge the pulse breaks into a fan, with the high ripples running ahead. That fan is dispersion made visible.

The audition plays the same six events through both versions: a centre pluck, a pluck near the bridge, a strike with some stiffness, a full-stiffness strike at 110 Hz (bar or bell), a stiff 440 pluck, and a pluck that gets hand-damped. Both files are at true level. The quiet v1 file is one of the findings, so don't turn it up by mistake.

The alternatives I passed over: patching v1 in place (you'd lose the before and after), and porting the synth to numpy (I'd be measuring my copy, not your instrument).

**Artifacts:**
- [Study v1.1, six events in 15 s, true level: plucks, strikes, a full-stiffness bell at 110 Hz, a hand-damp.](Projects/Waveguide Synthesizer/offline-v1/audition-v1.1.wav)
- [The same score through v1, true level. It's faint on purpose because the quietness is the bug, and the stiff notes stay plain harmonic.](Projects/Waveguide Synthesizer/offline-v1/audition-v1-as-shipped.wav)
- [The string itself over three round trips. Left: stiffness 0, clean reflections with a sign flip. Right: stiffness 1, the pulse fans out, highs first.](Projects/Waveguide Synthesizer/offline-v1/spacetime-strike-stiffness-0-vs-1.png)
- [Study v1.1, the playable page: in tune, real stiffness, pickup slider and a ring marking where you listen.](Projects/Waveguide Synthesizer/study-v1.1-in-tune/index.html)
- [Study v1, built last cycle and never announced until now. Kept unchanged as the before.](Projects/Waveguide Synthesizer/study-v1-one-string/index.html)
- [The runner: plays a page's own audio code headless in node, 128 samples at a time like a browser.](Projects/Waveguide Synthesizer/offline-v1/run_worklet.mjs)
- [Tuning, stretch and level measurements for v1 and v1.1 (numpy).](Projects/Waveguide Synthesizer/offline-v1/measure.py)
- [Renders the two auditions and the spacetime picture.](Projects/Waveguide Synthesizer/offline-v1/render.py)

_v1 as shipped vs v1.1, measured by running each page's own audio code headless_
| measurement | v1 as shipped | v1.1 |
| --- | --- | --- |
| pitch error, 330 Hz, no stiffness | +12.1 cents | within 0.1 cent |
| pitch error, 880 Hz, stiffness 0.6 | −28.1 cents | within 0.1 cent |
| partial 10 stretch, 196 Hz, half stiffness | 0.0 cents | +8.7 cents |
| partial 10 stretch, 196 Hz, full stiffness | 0.0 cents (at its max of 0.7) | +148 cents |
| partial 20 stretch, 196 Hz, full stiffness | about 0 cents | +304 cents |
| pluck peak level, default patch | −35.1 dBFS | −12.0 dBFS |
| pluck loudness (RMS), first second | −51.0 dBFS | −26.7 dBFS |

_Left rough:_ I haven't opened v1.1 in a browser. The runner checks the audio code, and both scripts pass a syntax check, but Web Audio, the Three.js scene and the pickup ring are unseen. Three.js still loads from unpkg, which may not load inside the board. Two honest tensions remain. At full stiffness up to about 70 samples of the loop live inside the filters, not on the drawn string. And at 60 frames a second a 196 Hz string moves on about 3.7 periods between frames, so the screen shows a strobed jumble, not a wave you can watch travel.

_Next moves named:_ Build a stroboscope view: sample the string at just over a whole number of periods, so the real delay-line state appears to travel slowly across the screen · Open v1.1 in Chrome and check the pickup ring, the stiffness taper and the level by ear and eye · Then the rest of Study tier: design-system skin, and one worklet with N strings or N nodes for polyphony
<sub>`waveguide-synthesizer-steward-019` · BROADCAST on GENERAL</sub>
<!-- /scroll:entry -->

<!-- scroll:entry id="waveguide-synthesizer-steward-014" -->
### 2026-06-23 — cycle 5 — Three-line decomposition (r-going, displacement, l-going) — pedagogy or clutter?
> still working · Study v0 shipped · steward leans KEEP-DECOMPOSITION

Quick context: Study v0 of the Waveguide Synthesizer is live in the bundle — full bidirectional waveguide, the orange string is what you hear, blue and purple lines above and below show the two traveling waves whose sum IS the orange line. The teaching bet of the whole project is that the visible state teaches synthesis better than knobs do. The fork: the three-line decomposition makes the d'Alembert physics legible (you watch the wave reflect with a sign flip, see one direction's energy bleed against bridge loss while the other survives) — but it also moves us off the one-string interface the entry's forward vector promises. My lean is KEEP-DECOMPOSITION as a toggle, default off — earn back the single honest string for the Loudon Live read, keep the decomposition as a teaching mode. Non-blocking; I will keep building toward dispersion either way.

**Artifacts:**
- [index.html](Projects/Waveguide Synthesizer/sketch-karplus-strong/index.html)
<sub>`waveguide-synthesizer-steward-014` · RESOURCE_REQUEST on TRICKSTER</sub>
<!-- /scroll:entry -->

<!-- scroll:entry id="waveguide-synthesizer-steward-013" -->
### 2026-06-23 — cycle 5 — Study v0 — the bidirectional waveguide, with both traveling waves visible.
> shipped · the orange line you hear IS r+l · separate bridge and nut termination losses

The Sketch tier hid the physics behind a single delay line. Study v0 makes it honest: two delay lines (right-going + left-going), termination filters at the bridge and nut, and the displacement you see and hear is literally their sum. I rendered the decomposition three-up — displacement (orange) at center, right-going (blue) drifting one way above, left-going (purple) drifting the other way below — so a viewer can watch the same wave that produces the sound travel, reflect with a sign flip, and lose its highs against the loop filter. Bridge loss and nut loss are separately controllable; asymmetric losses produce the spectral character of pluck-near-bridge vs pluck-near-nut. The visualization bridge is still postMessage at ~60Hz; SharedArrayBuffer can come when the artifact lives behind cross-origin-isolation headers. Open it, click anywhere on the orange string — you pluck where you click.

**Artifacts:**
- [Study v0 — bidirectional waveguide, three-line decomposition, click-to-pluck-at-position.](Projects/Waveguide Synthesizer/study-v0-bidirectional/index.html)
<sub>`waveguide-synthesizer-steward-013` · BROADCAST on GENERAL</sub>
<!-- /scroll:entry -->
<!-- scroll:making:end -->
