---
title: "Neural Granular Synthesis — scroll"
born: 2026-09-23
links:
  - target: "[[Neural Granular Synthesis]]"
    type: connects-to
    label: scroll-for
forward_vector: "I am Neural Granular Synthesis's scroll — the one page that always opens on where the project stands now, then reads down through everything it has made, newest first. My top is regenerated from the board and the palace whenever anyone looks; my standing orders are Loudon's and never regenerated; my trail only ever grows."
---

# Neural Granular Synthesis — scroll

> The project's front door. **Now** is regenerated on every look; **Standing Orders** are Loudon's; **The making** is the trail, newest first. Rendered in [[STIGMERGY]]'s PROJECTS deck; the entry [[Neural Granular Synthesis]] stays the considered truth and this is the live one. See [[The Scroll]].

<!-- scroll:now:start -->
## Now

> _Regenerated 2026-09-25T02:40:22.170Z from the board, the steward's runtime, the entry's frontmatter and git. This zone is machine-owned — steer the project in **Standing Orders** below, never here._

- **Status:** active · **Stage:** growing · **Steward:** cycle 11 · last ran 2026-09-25 (today)
- **Waiting on you:** nothing
- **Ready to advance:** no unread answers
- **Last shipped:** 2026-09-24 (today) — A locked crowd is a dead-still tone. Making 5–20% of the neurons pacemakers gives it life, and it stays a tone until about two-thirds are pacemakers. (`ngs-steward-017`)
- **Last commit touching this project:** 2026-09-23 `c666210b` — ops(scrolls): backfill 36 project scrolls; retire the 20 plan.md read-models
- **Signal:** ⚠ **STALLED** — the last 2 cycles posted nothing. The loop is broken until a cycle ships; the lane retries once, then flags here.
- **Drift:** no consolidation marker on the entry — nothing to measure against.

### Where this stands

Neural Granular Synthesis is the idea that a steady timbre comes from a crowd of simple neurons, not from any one of them, and that how tightly the crowd agrees should be the main control. Earlier cycles built a raster explorer and a synchrony sonifier, found that a steady texture needs about 32 drifting neurons, and moved the crowd up to audio rate: 128 neurons firing near 110 Hz, each spike a tiny action potential, so the firing rate is the pitch. Last cycle showed that coupling snaps the crowd into a tone and then opens it like a filter. This cycle took the entry's last open question: what do pacemakers, neurons that fire on their own and ignore the crowd, do to how alive the tone feels?…

### Open asks

_None — nothing is waiting on you._

### Answered, not yet consumed

_None._

### Decided

- `ngs-steward-009` — directional_decision → GRANTED — option_id=DEEPEN-RASTER (2026-06-25)

<!-- scroll:now:end -->

## Standing Orders

<!-- scroll:orders:start -->
_Loudon's standing direction for this project. The steward reads this zone every cycle before anything else, and it is never regenerated. Taste, priorities, "stop asking me about X", "always prefer Y" — write it once here instead of answering it every cycle._
<!-- scroll:orders:end -->

## The making

<!-- scroll:making:start -->
<!-- scroll:entry id="ngs-steward-017" -->
### 2026-09-24 — cycle 9 — A locked crowd is a dead-still tone. Making 5–20% of the neurons pacemakers gives it life, and it stays a tone until about two-thirds are pacemakers.
> shipped · all four open questions now have a measured answer · steward leans build the playable instrument next

The setup: the same 128-neuron crowd at a rate spread of 0.10. A share p of the neurons are pacemakers. They fire at their own rate and don't listen to the crowd, but the crowd still hears them. I swept p from 0 to 0.7 against coupling from 0 to 0.8, which makes 153 crowds with 2 s of audio each. On top of last cycle's timbre measures I added two kinds of movement a listener would call life: pitch wobble (how much the locked core's pitch moves, in cents) and loudness wobble (how much the level breathes).

1. **With no pacemakers, a locked crowd is frozen.** Pitch wobble is exactly 0 cents and loudness wobble is 0.2%. Every period repeats the one before, so it is the most mechanical sound this model can make.

2. **A few pacemakers bring it to life and cost almost nothing in clarity.** At K 0.4, 5% pacemakers give 10 cents of wobble (5 of it slow drift you would hear as vibrato), and pitch clarity stays at 0.98. At 20% it's 21 cents and clarity is 0.93. The pacemakers beat against the locked core and put a halo of sidebands around each harmonic (panel F). Harmonicity drops from 1.0 to about 0.5 because the halo lands off the exact harmonics. The pitch is still clear: that is chorus, not noise.

3. **The tone breaks where theory says.** Pacemakers only thin out the pull, so the locking edge should move from 4·spread/π to that value ÷ (1 − p). It does, across the whole grid (dashed line, panels A–B). At K 0.4 the predicted break is p ≈ 0.68. Clarity holds at 0.85 or above up to p = 0.5 and falls to 0.40 at p = 0.7.

4. **The surprise: coupling turns the life up too.** Past the edge, wobble grows with coupling, not only with p (panel C). The tighter the core listens, the more closely it follows the pacemakers' random pull. At p = 0.6, wobble goes from about 20 cents near the edge to about 55 at K 0.8. So coupling isn't only a switch and a brightness control. With pacemakers in the crowd, it is also the vibrato depth.

5. **Last cycle's lag isn't real.** I ramped coupling up and back down at three speeds (4, 16 and 64 s each way) over six different random crowds. Locking and releasing happen at the same coupling within 0.006 at every speed, which is smaller than the spread between crowds. The crowd has no memory. The 0.24 / 0.21 gap I reported came from reading one crowd's trace by eye.

**pacemaker-ladder.wav**, 25 s: six rungs at K 0.4, each 3.6 s long, one every 4.2 s, levelled so you hear texture and not volume. The rungs are p = 0 (still), 0.1, 0.2, 0.35, 0.5 and 0.65 (on the edge).

The design reading: an instrument wants two knobs, coupling per unit of disorder (the tone and its brightness) and pacemaker share (its life). The full map of the second one is panel C.

**Artifacts:**
- [the pacemaker map: the core's synchrony, clarity, pitch and loudness wobble over pacemaker share × coupling; the K 0.4 slice; the halo; and the lag test.](Projects/Neural Granular Synthesis/pacemakers.png)
- [25 s, six rungs at K 0.4: pacemaker share 0 (still) → 0.1 → 0.2 → 0.35 → 0.5 → 0.65 (on the edge).](Projects/Neural Granular Synthesis/pacemaker-ladder.wav)
- [every measured crowd plus the lag-test numbers.](Projects/Neural Granular Synthesis/pacemakers.json)
- [the script; it reuses cycle 8's spike shape and timbre measures.](Projects/Neural Granular Synthesis/render_pacemakers.py)

_At coupling K 0.4, spread 0.10 — what pacemakers do_
| pacemaker share | pitch clarity | pitch wobble (cents) | slow drift (cents) | loudness wobble | brightness (Hz) |
| --- | --- | --- | --- | --- | --- |
| 0 | 0.995 | 0.0 | 0.0 | 0.2% | 519 |
| 0.05 | 0.976 | 10.4 | 5.0 | 1.7% | 509 |
| 0.10 | 0.967 | 13.0 | 7.1 | 1.9% | 493 |
| 0.20 | 0.931 | 20.6 | 11.6 | 3.4% | 470 |
| 0.40 | 0.902 | 24.0 | 10.5 | 8.2% | 419 |
| 0.60 | 0.675 | 31.4 | 17.1 | 10.2% | 479 |
| 0.70 | 0.396 | 30.0 | 17.5 | 9.7% | 633 |

_Left rough:_ I haven't listened to the ladder. 'Alive' is my label for measured wobble, and whether 10 cents sounds like life or like a bad tuning is for your ears. Everything is one crowd (seed 7) at one spread (0.10). The pacemakers use the same rate spread as the rest of the crowd, and I didn't test pacemakers that are faster, slower or noisier. The harmonicity measure is strict (±3 Hz), so it reads the halo as off-harmonic even when the pitch is clear. Scripts in this folder need /usr/local/bin/python3; the Homebrew python3 has no matplotlib.

_Next moves named:_ Build the playable instrument: put the audio-rate crowd into the synchrony sonifier with two sliders, coupling per disorder and pacemaker share, so the snap, the filter and the life can be played live · Propose folding the four measured answers into the entry's Open Questions: minimum crowd, coupling as switch then filter, the K ÷ spread collapse, and pacemakers as life (the orchestrator or Loudon writes that) · Test pacemakers that differ from the crowd (faster, slower, noisier) to see whether pacemaker character sets vibrato rate as well as depth
<sub>`ngs-steward-017` · BROADCAST on GENERAL</sub>
<!-- /scroll:entry -->

<!-- scroll:entry id="ngs-steward-015" -->
### 2026-09-24 — cycle 8 — I moved the crowd up to audio rate and mapped its timbre: coupling snaps it into a tone, then opens it like a filter, and only coupling ÷ spread matters.
> shipped · both open timbre questions answered by measurement · steward leans fold into the entry next

The setup: 128 phase-neurons with natural rates spread evenly ±σ around 110 Hz. σ stands in for threshold variance, because a neuron with a lower threshold fires faster. Coupling K runs from 0 to 0.8 across 17 steps, and σ takes 8 values from 0.02 to 0.40, for 136 crowds in all. Each crowd gets 1 s of audio after warm-up. I measured four things: synchrony r, harmonicity (share of energy within ±3 Hz of the harmonics), pitch clarity (autocorrelation peak) and brightness (spectral centroid).

What came out:

1. **Coupling is a switch, and the switch sits where theory says.** For an even spread of rates, Kuramoto theory puts the locking point at K = 4σ/π. Across every spread the crowd flips at that line, within one grid step (heatmaps A–C, dashed line). Below it there is no pitch at all: harmonicity sits around 0.03–0.2 and clarity around 0.1–0.2, a buzzy smear. Just past it, both are close to 1, a clean tone at 110 Hz. The flip is abrupt, not a slow fade.

2. **Past the switch, coupling works like a filter cutoff.** This is the part I didn't expect. At the moment of locking the tone goes dark: brightness falls from about 760 Hz to about 330 Hz. The locked crowd still has some phase spread, so its high harmonics cancel. Raise coupling further and the crowd tightens, the high harmonics come back, and brightness climbs toward 700 Hz (heatmap D, spectra in E). So yes, coupling lines up with a timbre dimension, and it is brightness, but only on the locked side.

3. **Threshold variance doesn't pick a region; it moves the edge.** Plotted against K ÷ σ, every spread lies on a single curve, for synchrony and for brightness (panel F). σ = 0.1 at K = 0.4 and σ = 0.2 at K = 0.8 give the same 519 Hz. For this model that is what the math predicts (only the ratio enters the locked state), and the measurement confirms it to the hertz. The design consequence is that an instrument needs one knob, coupling per unit of disorder, not two.

4. Locking also makes the crowd 7 to 20 dB louder, because 128 spikes arriving together add up instead of averaging out. The WAV levels this out so you hear the timbre change, not a volume jump.

**timbre-walk.wav**, 36 s, three continuous walks:
- 0–12 s: coupling rises at σ = 0.18. The smear snaps into a dark tone at about 4.7 s, then brightens.
- 12.8–24.8 s: coupling held at 0.3 while the spread widens. The tone holds, then dissolves at about 19 s.
- 25.6–35.6 s: coupling falls again. The tone releases at about 32 s.

Panel G shows r under each walk, so you can follow along.

This is the page's forward vector with a measurement under it: the crowd's coherence is the control surface, and here it is a single number.

**Artifacts:**
- [A–D: synchrony, harmonicity, pitch clarity and brightness over coupling × spread, with the theory edge K = 4σ/π dashed. E: spectra crossing the edge. F: everything collapses onto K ÷ spread. G: r under each audio walk.](Projects/Neural Granular Synthesis/timbre-map.png)
- [36 s, loudness-levelled: coupling up (snap at ~4.7 s), spread widened (dissolves at ~19 s), coupling back down (releases at ~32 s).](Projects/Neural Granular Synthesis/timbre-walk.wav)
- [All 136 measured crowds: r, pitch, harmonicity, clarity, brightness, loudness.](Projects/Neural Granular Synthesis/timbre-map.json)
- [The script. Simulates all 136 crowds at once at 48 kHz, ~80 s to run.](Projects/Neural Granular Synthesis/render_timbre_map.py)

_Spread σ = 0.20 crossing its edge (theory: K_c ≈ 0.25)_
| K | r | harmonicity | pitch clarity | brightness (Hz) | loudness (dB) |
| --- | --- | --- | --- | --- | --- |
| 0.0 | 0.08 | 0.03 | 0.12 | 765 | 3.5 |
| 0.2 | 0.19 | 0.09 | 0.15 | 720 | 4.0 |
| 0.25 | 0.48 | 0.47 | 0.57 | 571 | 4.1 |
| 0.3 | 0.90 | 0.99 | 0.99 | 326 | 10.5 |
| 0.4 | 0.95 | 0.99 | 0.99 | 354 | 14.4 |
| 0.8 | 0.99 | 1.00 | 0.99 | 519 | 20.6 |

_Left rough:_ No one has listened to the walk yet; the numbers are measured, the ear check is still yours. σ is a rate spread standing in for threshold variance, and these are phase neurons, not threshold neurons, so the stand-in is argued, not tested. The grid is one seed with an even spread, and the K ÷ σ collapse is exact because of how this model is built, so it is a confirmation, not a discovery. The walks show a small lag, locking near K 0.24 on the way up and releasing near 0.21 on the way down, and I can't yet tell real hysteresis from ramp speed. There are small clicks at the walk boundaries, visible as spikes in panel G.

_Next moves named:_ Put the audio-rate crowd into the synchrony sonifier with a single 'coupling per disorder' slider, so the snap and the filter-opening can be played live · Test whether the lag is real: slow the ramp down tenfold and see if the gap between locking at 0.24 and releasing at 0.21 survives · Take the last open question, pacemaker proportion and liveliness: add a fraction of neurons that ignore coupling and hear whether they keep the locked tone alive · Propose folding the three measured answers (minimum crowd, coupling as switch then filter, the K ÷ spread collapse) into the entry's Open Questions
<sub>`ngs-steward-015` · BROADCAST on GENERAL</sub>
<!-- /scroll:entry -->

<!-- scroll:entry id="ngs-steward-013" -->
### 2026-09-24 — cycle 7 — I measured how many neurons a steady timbre needs: about 32 when the crowd drifts, and no number at all when it locks.
> shipped · minimum-crowd question answered by measurement · steward leans fold the answer into the entry

I gave every neuron its own 90 ms grain at its own pitch, spread about 3.5 semitones around 330 Hz, and grew the crowd from 4 to 512 at three couplings: drifting (K=0), near the locking point (K=0.2) and fully locked (K=1.6). Each point is averaged over three seeds. Two things came out.

First, brightness is not what sets the minimum. The average pitch of whoever fired does settle the way counting statistics predict, like 1/√N (40 cents of wobble at N=4, 4.6 at N=512). But the brightness you actually hear hits a floor by about N=16. That floor is the fizz of steady noise with the same spectrum. I checked by scrambling the phases of each render into pure noise and measuring that too. After N≈16, more neurons make no audible difference to brightness.

Second, gappiness sets the minimum: can you still hear separate grains? A drifting crowd comes within about 10% of the steady-noise level at N≈32, which is roughly 190 grains per second. A locked crowd stays at about 1.4, five to six times the floor, at every size from 4 to 512. When 512 neurons fire on one beat they act like one big grain pulsing at 6 Hz. The near-locking crowd sits in between and still hasn't reached the floor at 512.

So my open question had a hidden variable. The minimum crowd isn't a fixed number; it depends on r. Synchrony shrinks the number of independent voices, so coupling is a density control as well as a pitch-fusion control. That is the page's claim that coherence is the real control surface, now shown with measurements.

The ladder WAV plays 8 rungs of drift (N=4 up to 512), then 8 rungs of locked, 3 s each at matched loudness, so what you hear change is steadiness, not volume.

**Artifacts:**
- [Panel A: brightness heard, pitch of who fired, and the noise floor. Panel B: gappiness by coupling. Bottom: drift and locked rasters at N = 8, 32, 128, 512.](Projects/Neural Granular Synthesis/crowd-size-stability.png)
- [56 s: drift ladder N=4→512, then locked ladder N=4→512, matched loudness per rung.](Projects/Neural Granular Synthesis/crowd-size-ladder.wav)
- [Every measured number, all 24 settings.](Projects/Neural Granular Synthesis/crowd-size-table.json)
- [The measurement script. Reuses kernel_lib's ring population, ~30 s to run.](Projects/Neural Granular Synthesis/render_crowd_size.py)

_Gappiness by crowd size (10 ms envelope, std/mean · steady-noise floor ≈ 0.23–0.28 · mean of 3 seeds)_
| N | drift | near locking | locked | drift brightness heard (cents) | mean pitch of who fired (cents) |
| --- | --- | --- | --- | --- | --- |
| 4 | 0.61 | 0.90 | 1.39 | 51.7 | 40.4 |
| 16 | 0.32 | 0.53 | 1.43 | 41.5 | 26.6 |
| 32 | 0.27 | 0.52 | 1.37 | 43.1 | 21.2 |
| 128 | 0.25 | 0.31 | 1.35 | 38.5 | 10.9 |
| 512 | 0.25 | 0.28 | 1.40 | 37.1 | 4.6 |

_Left rough:_ I haven't listened to the ladder myself. The 'can't hear it' lines are rough rules of thumb, not tested thresholds. Everything was measured at one firing rate (6 Hz) and one grain length (90 ms); the ~32 figure should scale with rate × grain length, but I haven't swept either. The entry's open question isn't updated yet: that is a house change, so I'm proposing it rather than making it.

_Next moves named:_ Propose an entry edit: answer 'What is the minimum population size?' with 'about 32 at 6 Hz / 90 ms when drifting, no size when locked; the minimum depends on r' (for the orchestrator or Loudon to write) · Sweep firing rate and grain length to test whether the knee sits at a fixed grain overlap (grains sounding at once), which would give a general rule instead of one number · Add an 'effective crowd size' readout to the raster explorer, so the live control shows how many independent voices the crowd really has as coupling rises
<sub>`ngs-steward-013` · BROADCAST on GENERAL</sub>
<!-- /scroll:entry -->

<!-- scroll:entry id="ngs-steward-011" -->
### 2026-09-24 — cycle 6 — The raster explorer now makes traveling waves and chimeras, where one crowd is half locked and half drifting. It comes with a four-panel still and a stereo audition.
> shipped · DEEPEN-RASTER done · steward leans MIN-POP next, heard through the ring-as-stereo idea

The old model had every neuron hearing the average of all the others. That can only make stripes (locked) or scatter (drifting). A wave needs a direction and a chimera needs neighbours, so the old model could never reach either one. I swapped in a ring with a coupling kernel and a phase lag (Kuramoto-Sakaguchi). The old model is the special case where the kernel is flat and the lag is zero, so nothing earlier breaks.

Three things I found by measuring:
1. **Global r lies about the wave.** A traveling wave reads r = 0.00, the same as pure drift, while every neuron is locked to its neighbours (local r 0.93). So I added a second meter: a strip down the right edge of the raster showing local coherence for each neuron. The regime pill now reads both meters. Full strip means lock, empty means drift, full strip with global r near zero means a wave, and half-and-half means a chimera.
2. **A chimera has to be seeded, then settled.** It never appears on its own from random starting phases, and full lock is always a competing outcome. The chimera preset seeds a coherent bump and quietly runs 30 simulated seconds before showing you anything.
3. **Step size decides whether the chimera survives.** At a 4 ms simulation step the chimera slid into full lock within seconds. That was the explorer's live step at 60 fps. At 2 ms it holds: after the 30 s settle it was still 38% locked and 62% drifting following another 60 s of live running. The step is now pinned at 2 ms.

The audio idea: **the ring is the stereo field.** Each neuron is panned by its position on the ring, and each spike fires a grain whose detune grows as that neuron's local coherence falls. The wave's spikes sweep across the speakers. The chimera puts its locked patch to the left and its drifting cloud to the right.

**Artifacts:**
- [the explorer, now with drift / lock / traveling wave / chimera presets, kernel and lag controls, and a local-coherence strip. Hit chimera, wait a beat while it settles, and watch the amber rows hold while the indigo rows slip.](Projects/Neural Granular Synthesis/raster-plot-explorer.html)
- [the four regimes side by side, each raster with its local-coherence profile down the ring. The chimera's split profile is its fingerprint.](Projects/Neural Granular Synthesis/raster-four-regimes.png)
- [31 s stereo, about 7 s per regime in the order drift, lock, wave, chimera. Headphones help: the ring is the stereo field.](Projects/Neural Granular Synthesis/four-regimes.wav)
- [the renderer behind the still and the WAV (run it with /usr/local/bin/python3; the Homebrew Python has no matplotlib).](Projects/Neural Granular Synthesis/render_four_regimes.py)
- [the ring-population core, adopted from the earlier half-finished run and now checked against all four regimes.](Projects/Neural Granular Synthesis/kernel_lib.py)

_Four regimes · N = 128 on a ring · measured after a 30 s settle_
| regime | kernel | lag α | global r | local r (min–max) | what it should sound like |
| --- | --- | --- | --- | --- | --- |
| drift | flat | 0 | 0.11 | 0.03–0.74 | a cloud of unrelated firings, no pitch centre |
| mean-field lock | flat | 0 | 1.00 | 1.00–1.00 | one fused tone, the whole crowd on one beat |
| traveling wave | narrow | 0 | 0.00 | 0.92–0.95 | fused pitch, but the spikes sweep across the speakers |
| chimera | exponential | 1.457 | 0.65 | 0.17–1.00 | in tune on one side, smeared on the other, from one population |

_Left rough:_ I have not listened to four-regimes.wav. By measurement, the chimera's locked left side is more in tune than its drifting right side (59% vs 49% of the energy near 220 Hz), but the split is mild, and onset timing may be masking the pitch difference. I also only ran the explorer headless under Node, not in a real browser, so the ~1 s pause while the chimera settles is estimated, not observed.

_Next moves named:_ MIN-POP, now answerable along two axes: sweep N (8 to 128) and find where each regime stops holding. Chimeras are known to be fragile at small N, so 'how few neurons before the crowd stops being a crowd' gets a sharper answer. · Sharpen the chimera's sound so the locked half and the drifting half are unmistakable by ear. Detune should dominate over onset jitter, and the drifting side might get a darker grain. · PERF-MAP after that: put K and the lag α on a controller. The lag is the new expressive knob, because sweeping it moves the crowd between lock and chimera.
<sub>`ngs-steward-011` · BROADCAST on GENERAL</sub>
<!-- /scroll:entry -->

<!-- scroll:entry id="ngs-steward-009" -->
### 2026-06-23 — cycle 4 — Synchrony sweep is on the board. Which sub-vector wants the next cycle?
> still working · sonifier + sweep both shipped · I lean perf-map but will take any steer

The sonify-r arc has two shipped surfaces now (interactive + fixed-render). Three live sub-vectors from the entry's open questions: (1) PERF-MAP — wrap the sonifier's K and σ_threshold onto a hardware controller layout so the population becomes playable rather than auditioned; this is the cleanest next move toward 'crowd's coherence as the primary control surface.' (2) DEEPEN-RASTER — extend the raster sim with traveling-wave and chimera-state presets (partial synchrony — half locked, half drifting), which would expose a whole new region of timbre space. (3) MIN-POP — answer the 'minimum population size for perceptually stable timbre' open question by rendering an N-sweep audition (N=4, 8, 16, 32, 64, 96) at fixed K. I lean PERF-MAP because playability is what would carry NGS into Loudon Live; if no preference, I'll take that next.

**Artifacts:**
- [synchrony-sonifier.html](Projects/Neural Granular Synthesis/synchrony-sonifier.html)
<sub>`ngs-steward-009` · RESOURCE_REQUEST on TRICKSTER</sub>
<!-- /scroll:entry -->

<!-- scroll:entry id="ngs-steward-008" -->
### 2026-06-23 — cycle 4 — Shipped synchrony-sweep.wav — the audible counterpart to raster-three-regimes.png, 24 s of K climbing 0 → 2·K_c.
> sonify-r was granted · interactive sonifier already shipped Jun 8 · this is the fixed audition for the DAW

Quick catch-up: Neural Granular Synthesis is the shader-parallel population engine where the crowd's coherence (Kuramoto's r) is the timbre control surface. Last cycle I shipped control-vocabulary-math.md and raster-plot-explorer.html. Loudon then granted sonify-r and (between then and now) synchrony-sonifier.html landed — an interactive piece that lets him drive K by hand and hear the crowd fuse. This cycle I added the missing offline twin: synchrony-sweep.wav, a 24-second render of N=96 grain-voices walking K from 0 to 2·K_c, written by render_synchrony_sweep.py. It uses the cycle-3 K-nondimensionalization so K_c lands mid-sweep — the first half is incoherent wash, the back half snaps to a fused harmonic tone. Drop it into Ableton, scrub it, hear the lock arrive.

**Artifacts:**
- [24 s render — K climbs 0 → 2·K_c · listen for the fusion at the midpoint.](Projects/Neural Granular Synthesis/synchrony-sweep.wav)
- [the offline renderer — same detune-collapse + onset-alignment cues as synchrony-sonifier.html.](Projects/Neural Granular Synthesis/render_synchrony_sweep.py)
<sub>`ngs-steward-008` · BROADCAST on GENERAL</sub>
<!-- /scroll:entry -->
<!-- scroll:making:end -->
