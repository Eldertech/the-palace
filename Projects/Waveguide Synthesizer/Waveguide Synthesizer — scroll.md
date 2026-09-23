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

> _Regenerated 2026-09-23T05:04:41.000Z from the board, the steward's runtime, the entry's frontmatter and git. This zone is machine-owned — steer the project in **Standing Orders** below, never here._

- **Status:** active · **Stage:** seed · **Steward:** cycle 9 · last ran 2026-09-23 (today)
- **Waiting on you:** 1 open ask
- **Ready to advance:** no unread answers
- **Last shipped:** 2026-09-23 (today) — Which view should the string open in: the strobe (the note you're hearing) or the replay (exact slow motion of the first moments)? (`waveguide-synthesizer-steward-022`)
- **Last commit touching this project:** 2026-09-23 `bbab2d7` — steward(Quantum Synthesizer, Waveguide Synthesizer): pilot cycles 5 and 8 under the run contract
- **Signal:** steady
- **Drift:** no consolidation marker on the entry — nothing to measure against.

### Where this stands

Waveguide Synthesizer is a browser instrument where the string on screen is the sound. Two delay lines carry a right-going and a left-going wave. Their sum is the orange line you see, and the speaker hears that same line at one point, the pickup. Last cycle, v1.1 put it in tune, made stiffness really stretch the partials, and made it loud enough. One problem was left. At 60 frames a second a 196 Hz string goes round its loop about 3.3 times between frames, so the screen showed a jumble. This cycle Study v1.2 adds two slow views. The strobe catches the string at a chosen point in its cycle and moves that point on a sliver each frame. The replay records the first three cycles after a pluck an…

### Open asks

- `waveguide-synthesizer-steward-022` — directional_decision · posted 2026-09-23 · options: STROBE-DEFAULT · REPLAY-DEFAULT · AUTO-BY-STIFFNESS · REDIRECT

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
<!-- scroll:entry id="waveguide-synthesizer-steward-022" -->
### 2026-09-23 — cycle 9 — Which view should the string open in: the strobe (the note you're hearing) or the replay (exact slow motion of the first moments)?
> still working · v1.2 shipped, strobe is the default · steward leans STROBE-DEFAULT

Waveguide Synthesizer is the browser string where what you see is what you hear. At full speed the screen was a jumble, so v1.2 adds two slow views. The strobe shows the note you are hearing, slowed about 392 times. It's exact for a flexible string but churns on a stiff one, because a stiff string never repeats its shape. The replay is exact slow motion at any stiffness, but it shows the first 15 ms after the pluck, looping while the note fades. I shipped the strobe as the default because it keeps the promise that the screen is the sound you hear right now. The trade: stiff-string players would have to find the replay button. Watch the four views side by side in the replay page, then choose. The project keeps moving whether or not you answer.

**Artifacts:**
- [The four views side by side, frame by frame.](Projects/Waveguide Synthesizer/offline-v1.2/screen-replay.html)
- [The same views as a still: strobe churning at stiffness 1, replay clean.](Projects/Waveguide Synthesizer/offline-v1.2/screen-time-four-views.png)
- [index.html](Projects/Waveguide Synthesizer/study-v1.2-strobe/index.html)
<sub>`waveguide-synthesizer-steward-022` · RESOURCE_REQUEST on TRICKSTER</sub>
<!-- /scroll:entry -->

<!-- scroll:entry id="waveguide-synthesizer-steward-021" -->
### 2026-09-23 — cycle 9 — You can now watch the wave travel. Study v1.2 adds a strobe view and a slow replay. The sound is unchanged.
> shipped · v1.2 measured offline, not opened in a browser · steward leans STROBE-DEFAULT

The strobe works the way a timing light does. The string repeats every cycle, since v1.1 tuned the loop to exactly one period. So a frame taken a whole number of cycles later, plus 1/120 of a cycle, shows the real wave moved on by a sliver. At 196 Hz with the slider at 2 seconds per cycle, you're watching the string 392 times slower than life. Each frame is the rail state at that moment. The moment falls between two samples, so the page blends those two. The decay isn't slowed, because loss happens in real time.

The measurements found a limit, and it's physics, not a bug. A stiff string has no single period: its high partials run sharp, so no two cycles have the same shape. At full stiffness, the shape of a sharp strike one cycle later matches the one before by only 0.39 (1.0 is identical). The strobe can't stand that still. It churns, as the third panel of the picture shows. So I added the replay. At each pluck the audio code records the string at every sample for three cycles, about 15 ms at 196 Hz, and hands it to the screen once. The screen plays it back slowly, on a loop. That's true slow motion for any stiffness. It shows the past, not the note you're hearing. The fourth panel shows it at full stiffness: two clean pulses leave the strike, and after the bridge they fan out, highs first. It's cycle 8's picture, now moving.

The controls are a view button (V cycles strobe, replay, live), a slow-motion slider (0.5 to 8 seconds per string cycle, with a readout like '1/392 speed') and hold (H stands the wave still). The live view now really runs at 60 frames a second. v1.1 managed about 54.

How I checked it. I ran the page's own code headless in node with the runner from last cycle, which I extended to keep each frame's capture moment and the replay recording. The audio is identical to v1.1: all 720,000 samples of the 15-second audition, in all three views. Every strobe frame I compared against a sample-by-sample recording of the same note matched to rounding. The replay recording matched exactly. The screen's playback code, pulled out of the page and run headless too, reproduces the true string. Frames arrive 60.06 times a second, give or take one audio block (128 samples).

The alternatives I passed over: a replay-only view (exact, but you'd never see the note you're hearing), and one strobe per partial (that isn't one picture anymore).

**Artifacts:**
- [Watch it here. The four views, 4 seconds each, every frame made headless by the page's own code. No Three.js, no network.](Projects/Waveguide Synthesizer/offline-v1.2/screen-replay.html)
- [2 seconds of screen frames per view, stacked top to bottom: live (jumble), strobe at stiffness 0 (pulses travel and reflect), strobe at stiffness 1 (churns), replay at stiffness 1 (the fan, clean). Each row is scaled to its own peak.](Projects/Waveguide Synthesizer/offline-v1.2/screen-time-four-views.png)
- [Study v1.2, the playable page: strobe, replay and live views, a slow-motion slider and hold. The audio code is v1.1's, unchanged.](Projects/Waveguide Synthesizer/study-v1.2-strobe/index.html)
- [Measurements: audio identical to v1.1, frames exact, the strobe's timing, cycle-to-cycle shape, replay exactness.](Projects/Waveguide Synthesizer/offline-v1.2/measure_strobe.py)
- [The raw numbers behind the table.](Projects/Waveguide Synthesizer/offline-v1.2/measurements.json)
- [Renders the four-view picture and the replay page from headless runs.](Projects/Waveguide Synthesizer/offline-v1.2/render_strobe.py)
- [Runs the page's own screen-side replay code headless, 60 frames a second.](Projects/Waveguide Synthesizer/offline-v1.2/replay_probe.mjs)
- [Last cycle's runner, extended to keep each frame's capture moment and the replay recording. Cycle 8's measurements reproduce with it.](Projects/Waveguide Synthesizer/offline-v1/run_worklet.mjs)

_Three views of one 196 Hz string. Measured by running the page's own code headless._
|  | live | strobe | replay |
| --- | --- | --- | --- |
| how far the wave travels between frames | 3.3 round trips | 1/120 of a round trip | 1/120 of a round trip |
| what a frame is | the string right now | the string now, caught at a chosen point in its cycle | the string in its first three cycles after the pluck |
| is the frame the real string? | yes | yes: matches to 4 parts in 100 million (rounding) | yes: recording exact; playback matches to 3 parts in 100 million |
| flexible string (stiffness 0) | a jumble | one real cycle, slowed 392 times; median phase error 0.2 samples | exact slow motion |
| stiff string (stiffness 1) | a jumble | churns: the shape one cycle later matches only 0.39 | exact slow motion; the fan develops |
| sound | identical to v1.1 | identical to v1.1 | identical to v1.1 |

_Left rough:_ I haven't opened v1.2 in a browser. The 3D scene, the view button, the V and H keys and the replay's status line are unseen, and Three.js still loads from unpkg. Frames go out 60 times a second by the audio clock, so a display running at a slightly different rate will now and then show a frame twice or skip one. The replay records only when you pluck in replay view, so switching to it mid-note shows nothing until the next pluck. My frame-to-frame shape-change number wrongly counts a narrow pulse simply moving as change, so I report distance travelled per frame instead. Last cycle I wrote that a 196 Hz string goes round 3.7 times between frames. It's 3.3.

_Next moves named:_ Open v1.2 in Chrome: check the strobe and replay by eye at 82, 196 and 440 Hz, the hold key, and the replay status line · Settle the default view (card on the TRICKSTER board), then the rest of Study tier: design-system skin, bundle Three.js locally so the page works offline, and polyphony (one worklet with N strings, or N worklets) · Use the replay page as the 2D side of the open question in the entry, whether the 3D string teaches better than a 2D one
<sub>`waveguide-synthesizer-steward-021` · BROADCAST on GENERAL</sub>
<!-- /scroll:entry -->

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
