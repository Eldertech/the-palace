---
title: "Particle Synthesis — scroll"
born: 2026-09-23
links:
  - target: "[[Particle Synthesis]]"
    type: connects-to
    label: scroll-for
forward_vector: "I am Particle Synthesis's scroll — the one page that always opens on where the project stands now, then reads down through everything it has made, newest first. My top is regenerated from the board and the palace whenever anyone looks; my standing orders are Loudon's and never regenerated; my trail only ever grows."
---

# Particle Synthesis — scroll

> The project's front door. **Now** is regenerated on every look; **Standing Orders** are Loudon's; **The making** is the trail, newest first. Rendered in [[STIGMERGY]]'s PROJECTS deck; the entry [[Particle Synthesis]] stays the considered truth and this is the live one. See [[The Scroll]].

<!-- scroll:now:start -->
## Now

> _Regenerated 2026-09-23T05:12:34.000Z from the board, the steward's runtime, the entry's frontmatter and git. This zone is machine-owned — steer the project in **Standing Orders** below, never here._

- **Status:** active · **Stage:** dormant · **Steward:** cycle 5 · last ran 2026-09-23 (today)
- **Waiting on you:** 1 open ask
- **Ready to advance:** no unread answers
- **Last shipped:** 2026-09-23 (today) — Grains that meet: two fountains aimed at each other, so ice grains clack in mid-air and land somewhere new. A/B renders, figure, live bench. (`particle-synthesis-009`)
- **Last commit touching this project:** 2026-09-23 `146c6c4` — steward(Particle Synthesis): pilot cycle 4 — the fountain on ice (revival probe)
- **Signal:** steady
- **Drift:** no consolidation marker on the entry — nothing to measure against.

### Where this stands

Particle Synthesis treats each grain of a granular synth as a real particle, with position, speed and mass, so the sound comes from physics rather than knobs. Its test is to sound like physics, not like parameter modulation. Earlier today the fountain on ice shipped: particles fall onto a stiff plate, and each strike reaches two pickups as a falling chirp, with an interactive lesson to play it. This cycle takes the page's other open question: what happens when grains hit each other instead of just adding up? Two fountains throw small ice grains at each other. When two meet in the air you hear a dry clack, worked out from how two ice balls touch and push the air. When they land you hear the…

### Open asks

- `particle-synthesis-007` — directional_decision · posted 2026-09-23 · options: REVIVE-TO-SPROUT · STAY-DORMANT · NOT-SURE-YET

### Answered, not yet consumed

_None._

### Decided

- `particle-synthesis-004` — directional_decision → GRANTED — option_id=POLYPHONIC-CLOUD; notes: "create an interactive HTML lesson that demonstrates the arc of this project and where it is goin." (2026-06-25)

<!-- scroll:now:end -->

## Standing Orders

<!-- scroll:orders:start -->
Written by Claude on Loudon's explicit instruction, 2026-09-23: "Quantum Synthesizer and Particle Synthesis, give them cycles."

This page is marked `stage: dormant`, and the usual posture says don't touch. Loudon has overridden that for this project. Treat every run as a **revival probe**: ignore the dormant posture, ship the smallest real thing that moves the forward vector (a render, a sim, a probe — something audible or visible, not prose), and set it down honestly. End the run by saying plainly, in your last message, whether the work felt alive enough to revive the stage to `sprout` — that call is Loudon's, so make it a non-blocking RESOURCE_REQUEST with options REVIVE-TO-SPROUT · STAY-DORMANT · NOT-SURE-YET, never a stage edit.

This container has no Shop (no ComfyUI, Kokoro, Max, or GPU) — Python with numpy/scipy is what you have. Make what can be made here; name what needs the Mac.
<!-- scroll:orders:end -->

## The making

<!-- scroll:making:start -->
<!-- scroll:entry id="particle-synthesis-009" -->
### 2026-09-23 — cycle 5 — Grains that meet: two fountains aimed at each other, so ice grains clack in mid-air and land somewhere new. A/B renders, figure, live bench.
> shipped · run ends · revive ask 007 still open · steward leans REVIVE-TO-SPROUT

Start with [the lesson, now in seven moves](open:Projects/Particle Synthesis/proofs/2026-09-23-particle-synthesis-lesson.html), section 06. It has a live bench with two nozzles, an aim slider, and a switch between 'grains meet' and 'pass through'. Then play [05, grains meet](open:Projects/Particle Synthesis/proofs/2026-09-23-grains-05-crossing-collide.wav) against [04, pass through](open:Projects/Particle Synthesis/proofs/2026-09-23-grains-04-crossing-pass-through.wav). They use the same launches and the same gain, with the aim tightening from 6° of scatter to 0.15° over seven seconds. In [the figure](open:Projects/Particle Synthesis/proofs/2026-09-23-grains-that-meet.png) every meeting is marked on the crossing arch. The ticks above the spectrogram line up with thin bright verticals, which are the clacks among the slanted chirps.

How a clack is made: two ice balls touch for 75 to 160 millionths of a second (Hertz's law with ice's real stiffness, nothing tuned). A ball that gets shoved pushes on the air like a tiny loudspeaker. The two balls are shoved in opposite directions, so their sounds add along the line of impact and cancel off to the side. On one head-on clack at 5 m: 0 dB on the line, −1.9 dB at 45°, −15 dB at 75°, −49 dB side-on. I didn't write that pattern in. It is just the two balls added together.

What meeting changed: 13 meetings in render 05, 2 in the loose-aim half and 11 in the tight half. 24 of 72 grains met at least once, and there were 2 cascades. In one, a grain bouncing back from the crossing knocked a freshly thrown grain straight up over its nozzle. 119 of the 360 landings came from a grain that had been deflected. The average landing distance barely moved (8.00 against 8.05 m), because the fountains are mirror images and a head-on meeting swaps which side each grain lands on. Sideways drift at landing grew fourfold (0.15 to 0.60 m), which widens the stereo picture. Aim is the knob. In the browser bench, over 12 seconds at 8 shots a second, 6° of scatter gives 12 meetings, 1.5° gives 51, 0.5° gives 78 and 0.15° gives 93 of 96 shots, with cascades rising to 11. Grains a centimetre or two across need aim inside about half a degree to meet reliably. That is a property of the instrument I didn't plan.

Checks: at every collision, momentum is conserved to 2e-15, and the energy lost matches the textbook (1−e²)/2·m·v² to 6e-15. The browser clack matches the exact Python render at a correlation of 0.987 to 0.999 on six real meetings ([the test vector](open:Projects/Particle Synthesis/proofs/2026-09-23-grains-clack-testvector.json)). The bench's physics and audio ran headless at four aim settings with no bad samples. Two bugs were caught on the way: a first clack about 85 dB too quiet, and a variable-name clash in the lesson code that stopped its script from parsing. [The render script](open:Projects/Particle Synthesis/proofs/2026-09-23-grains-that-meet.py) reuses cycle 4's plate model unchanged.

My plain read for the revive question, as your standing order asks: this feels alive. The fountain met the page's core test on this CPU. This cycle answered its collision question with something you can play, and it turned up a real property of the instrument that I didn't plan. An idea that keeps producing surprises is still growing. The call is yours, on the open ask particle-synthesis-007.

**Artifacts:**
- [the lesson, now seven moves. Section 06 is the live grains-that-meet bench: aim, crossing distance, shots per second, meet or pass through.](Projects/Particle Synthesis/proofs/2026-09-23-particle-synthesis-lesson.html)
- [05: grains meet. Clacks in the air, deflected chirps on the ice, thickening as the aim tightens. 7 s.](Projects/Particle Synthesis/proofs/2026-09-23-grains-05-crossing-collide.wav)
- [04: the same launches passing through each other. Rain, no meetings. Same gain as 05.](Projects/Particle Synthesis/proofs/2026-09-23-grains-04-crossing-pass-through.wav)
- [top: every flight in 05 around the crossing, meetings marked. ticks: clack arrivals. bottom: spectrogram of 05.](Projects/Particle Synthesis/proofs/2026-09-23-grains-that-meet.png)
- [the render script: two fountains, grain-on-grain collisions, the two-ball clack in air, and every check quoted here.](Projects/Particle Synthesis/proofs/2026-09-23-grains-that-meet.py)
- [six real clacks rendered exactly, the check the browser bench (and a later Gen~ port) is measured against.](Projects/Particle Synthesis/proofs/2026-09-23-grains-clack-testvector.json)

_04 vs 05 · the same 72 grains, one shared gain · aim tightening 6° → 0.15°_
| measured | 04 pass through | 05 grains meet |
| --- | --- | --- |
| strikes on the ice | 360 | 360 |
| meetings in the air | 0 | 13 (2 loose aim · 11 tight) |
| grains that met at least once | — | 24 of 72 |
| cascades (a grain already hit, hit again) | — | 2 |
| landings by a deflected grain | — | 119 of 360 |
| average sideways drift at landing | 0.15 m | 0.60 m |
| average landing distance | 8.00 m | 8.05 m |

_Left rough:_ I haven't heard any of it. Each clack lasts about a tenth of a millisecond, so it may come across as a small tick more than a clack. The model treats each ball as small next to the sound's wavelength, which a 1.4 cm ball isn't at 10 kHz and above, so the side-on silence would partly fill in for real. The balance between air mics and plate pickups is my taste, and so is firing each shot as two stones of the same size, which I did because drag keeps unequal partners from ever meeting. I don't know how the live bench runs on your machine's audio.

_Next moves named:_ Grains that ring: hollow shells, each carrying its own small resonator, so a meeting has a pitch set by the grain's size. That is the page's first forward direction, a particle with its own differential equation, and it can be built here. · Write the Gen~ voice spec: the chirp oscillator plus the clack as a two-tap difference of the contact force, checked against the events JSON and the clack test vector. Needs the Mac.
<sub>`particle-synthesis-009` · BROADCAST on GENERAL</sub>
<!-- /scroll:entry -->

<!-- scroll:entry id="particle-synthesis-007" -->
### 2026-09-23 — cycle 4 — The fountain on ice makes its sound from physics, not knobs. Revive Particle Synthesis from dormant to sprout?
> still working · fountain renders and lesson shipped · steward leans REVIVE-TO-SPROUT

Particle Synthesis treats each grain as a real particle whose physics makes the sound. It went dormant in January with the idea intact and the instrument unbuilt. Your standing order asked for revival probes and a plain read at the end. This cycle a fountain of particles strikes an ice-like plate. Where each one lands, how hard and how heavy decide its chirp, and 1000 particles render on this CPU. The lesson lets you play it live and switch the ice off to hear the difference. It feels alive to me. For the first time the test the project set itself, sounding like physics, is met by the physics and not by a mapping. The honest limit is that I've measured it but never heard it. Your ears on the lesson or on render 02 are the real check. I'll keep working on colliding grains whichever you pick.

**Artifacts:**
- [the lesson and live fountain: the one click to judge from.](Projects/Particle Synthesis/proofs/2026-09-23-particle-synthesis-lesson.html)
- [render 02: 64 particles on ice, if you would rather just listen.](Projects/Particle Synthesis/proofs/2026-09-23-fountain-02-cloud64-ice.wav)
- [2026-09-23-fountain-cloud64.png](Projects/Particle Synthesis/proofs/2026-09-23-fountain-cloud64.png)
- [2026-09-23-fountain-03-cloud1000-ice.wav](Projects/Particle Synthesis/proofs/2026-09-23-fountain-03-cloud1000-ice.wav)
- [2026-09-23-fountain-01-cloud64-dry.wav](Projects/Particle Synthesis/proofs/2026-09-23-fountain-01-cloud64-dry.wav)
- [2026-09-23-fountain-00-one-particle.wav](Projects/Particle Synthesis/proofs/2026-09-23-fountain-00-one-particle.wav)
- [2026-06-23-dispersion-02-mild.wav](Projects/Particle Synthesis/proofs/2026-06-23-dispersion-02-mild.wav)
- [2026-06-23-dispersion-03-strong.wav](Projects/Particle Synthesis/proofs/2026-06-23-dispersion-03-strong.wav)
- [2026-05-04-particle-grain-cloud.html](Projects/Particle Synthesis/proofs/2026-05-04-particle-grain-cloud.html)
- [2026-06-08-dispersion-laws.png](Projects/Particle Synthesis/proofs/2026-06-08-dispersion-laws.png)
- [2026-06-08-dispersion-prism.html](Projects/Particle Synthesis/proofs/2026-06-08-dispersion-prism.html)
- [2026-06-23-dispersion-01-no-dispersion.wav](Projects/Particle Synthesis/proofs/2026-06-23-dispersion-01-no-dispersion.wav)
- [Particle Synthesis — icon.png](Projects/Particle Synthesis/Particle Synthesis — icon.png)
- [2026-05-04-particle-grain-cloud-v2.html](Projects/Particle Synthesis/proofs/2026-05-04-particle-grain-cloud-v2.html)
<sub>`particle-synthesis-007` · RESOURCE_REQUEST on TRICKSTER</sub>
<!-- /scroll:entry -->

<!-- scroll:entry id="particle-synthesis-006" -->
### 2026-09-23 — cycle 4 — A fountain on ice: particles fall and skip across a stiff plate, and every strike arrives as a chirp. Renders for 64 and 1000 particles, plus an interactive lesson.
> shipped · 64-cloud audition and lesson done · steward leans COLLISIONS next

Start with [the lesson](open:Projects/Particle Synthesis/proofs/2026-09-23-particle-synthesis-lesson.html). It walks the arc in six moves: the idea, the history, the law under the ice with a strike you can play, a live fountain you can start and walk away from, the offline renders, and where it goes next. In the fountain, switch 'ice' off and the same strikes become clicks. That difference is what dispersion adds.

The physics: bending waves in a stiff plate travel faster at high frequencies, so a strike sorts itself into a sweep on the way to you. Twice the distance means a sweep twice as long. Particles fly under gravity and light air drag and lose a bit more than half their bounce on each hop. That gives the skip-skip-skip rhythm. Heavier particles stay in contact longer, so they strike darker (the Hertz contact law).

The renders come from exact frequency-by-frequency Python, with the fountain walking from 3 m to 18 m away over ten seconds. Listen to [02, 64 particles on ice](open:Projects/Particle Synthesis/proofs/2026-09-23-fountain-02-cloud64-ice.wav) against [01, the same strikes with no dispersion](open:Projects/Particle Synthesis/proofs/2026-09-23-fountain-01-cloud64-dry.wav). [00](open:Projects/Particle Synthesis/proofs/2026-09-23-fountain-00-one-particle.wav) is one particle on its own. [03](open:Projects/Particle Synthesis/proofs/2026-09-23-fountain-03-cloud1000-ice.wav) is the page's own number: 1000 particles and 5,005 strikes, where the chirps turn into weather. In [the figure](open:Projects/Particle Synthesis/proofs/2026-09-23-fountain-cloud64.png), each slanted line in the spectrogram is one strike, and the slant grows as the fountain recedes.

What surprised me: flipped around, the law gives a closed form for the pitch you hear at each instant. So each strike can be a single oscillator following that curve, with no FFT. Against the exact render it matched at 0.997–0.999 correlation on 20 strikes, with equal energy. That's what makes the live browser fountain possible, and it's the shape a Gen~ voice or a GPU kernel would take.

**Artifacts:**
- [the interactive lesson: the arc, the law, a strike bench, a live fountain, the renders, the road ahead. Review layer on.](Projects/Particle Synthesis/proofs/2026-09-23-particle-synthesis-lesson.html)
- [02: the audition. 64 particles on ice.](Projects/Particle Synthesis/proofs/2026-09-23-fountain-02-cloud64-ice.wav)
- [01: the same 320 strikes with no dispersion. Clicks, for comparison.](Projects/Particle Synthesis/proofs/2026-09-23-fountain-01-cloud64-dry.wav)
- [00: one particle skipping five times to rest about 12 m away.](Projects/Particle Synthesis/proofs/2026-09-23-fountain-00-one-particle.wav)
- [03: 1000 particles, 5,005 strikes. The forward vector's number, rendered offline on CPU.](Projects/Particle Synthesis/proofs/2026-09-23-fountain-03-cloud1000-ice.wav)
- [top: every flight path of the 64-cloud. bottom: spectrogram of 02, one slanted line per strike.](Projects/Particle Synthesis/proofs/2026-09-23-fountain-cloud64.png)
- [the render script: particle flight, Hertz contact, exact dispersion by FFT, and the closed-form check.](Projects/Particle Synthesis/proofs/2026-09-23-fountain-on-ice.py)
- [every strike and flight path of the 64-cloud, a test vector for a later Gen~ or GPU port.](Projects/Particle Synthesis/proofs/2026-09-23-fountain-cloud64-events.json)

_the four renders · 48 kHz stereo · fountain walks 3 m → 18 m_
| render | particles | strikes | what to listen for |
| --- | --- | --- | --- |
| 00 one particle | 1 | 5 | the unit: one pew per hop, hops shortening |
| 01 cloud, no dispersion | 64 | 320 | the reference: clicks |
| 02 cloud on ice | 64 | 320 | chirps that stretch and darken as the fountain recedes |
| 03 cloud on ice | 1000 | 5,005 | density turns the chirps into weather (34 s CPU for 12 s) |

_Left rough:_ I haven't heard any of this. There's no audio playback or real browser here, so 'sounds like physics' is checked by numbers and the spectrogram, not by ear. I don't know how many live voices your machine can take; above 60 strikes a second the fountain voices a random share and turns each one up to keep the energy. The audio players may not load the WAVs inside the board's frame. The ice stiffness is the one value I chose by taste.

_Next moves named:_ Grains that meet: let particles collide with each other, not just the plate, so a strike can happen at a moving place (the entry's collision direction). Buildable here in Python and in the lesson. · Write the closed-form chirp as a per-strike oscillator spec for Gen~, with the events JSON as its test vector. The Mac-side build needs the Mac.
<sub>`particle-synthesis-006` · BROADCAST on GENERAL</sub>
<!-- /scroll:entry -->

<!-- scroll:entry id="particle-synthesis-004" -->
### 2026-06-23 — cycle 2 — Dispersion core works as audio. Which direction should the next cycle take it?
> still working · 3 audition seeds shipped to GENERAL · steward leans POLYPHONIC-CLOUD

The single-impulse dispersion render proves the physics out: the chirp is in the seeds (see particle-synthesis-003). The entry's forward vector calls for a thousand particles, not one, and names three plausible next moves: (1) a polyphonic grain cloud where N=64 particles each carry their own dispersion path and superpose into a drone — closest to the GPU-compute vision and the cheapest next render; (2) the Particle Fountain Max/MSP teaching device from the entry's pedagogy section — slower to build, but it makes the physics-as-DSP point legible to a learner; (3) particle collision as a compositional primitive — most exploratory, weakest ear-test. I lean POLYPHONIC-CLOUD because it stays in the rendered-audio modality where the dispersion seeds just landed, and a 64-particle cloud is a single afternoon's render to audition before any Max-side handoff. If you have not had a chance to listen to the seeds yet, ignore this — I will run POLYPHONIC-CLOUD by default next cycle.

**Artifacts:**
- [2026-06-08-dispersion-laws.png](Projects/Particle Synthesis/proofs/2026-06-08-dispersion-laws.png)
- [2026-06-08-dispersion-prism.html](Projects/Particle Synthesis/proofs/2026-06-08-dispersion-prism.html)
<sub>`particle-synthesis-004` · RESOURCE_REQUEST on TRICKSTER</sub>
<!-- /scroll:entry -->

<!-- scroll:entry id="particle-synthesis-003" -->
### 2026-06-23 — cycle 2 — Dispersion as audio — three rendered seeds, alpha sweeping from zero to strong.

Catch-up: Particle Synthesis reframes granular synthesis as GPU-style particle physics — each grain a particle with state, dispersion an emergent property of the medium rather than a programmed modulation. Cycle 1 (2026-06-06) asked which substrate to extend; you greenlit EXTEND-WEBAUDIO on 2026-06-09 and a visual dispersion prism shipped that day (proofs/2026-06-08-dispersion-prism.html). This cycle takes the next step the prism couldn't: rendering the physics straight to audio so the chirp is in your DAW, not just on screen.

A wideband impulse pushed through omega(k) = c*k + alpha*k^3. Group velocity vg = c + 3*alpha*k^2, so high-k (high-frequency) components travel faster and arrive first; low frequencies trail. The chirp is not modulated in — it falls out of the dispersion relation itself. Three audition seeds at increasing alpha:

**Artifacts:**
- [alpha = 0 — a clean click, no chirp. Reference.](Projects/Particle Synthesis/proofs/2026-06-23-dispersion-01-no-dispersion.wav)
- [alpha = 3e-9 — mild chirp, the attack lengthens, faint metallic shimmer.](Projects/Particle Synthesis/proofs/2026-06-23-dispersion-02-mild.wav)
- [alpha = 3e-8 — strong dispersion. High partials arrive first; the tail is a low descending sweep. The bell-like signature.](Projects/Particle Synthesis/proofs/2026-06-23-dispersion-03-strong.wav)
- [the render script — 60 lines of numpy, FFT phase shift per omega(k).](Projects/Particle Synthesis/proofs/2026-06-23-dispersion-render.py)
<sub>`particle-synthesis-003` · BROADCAST on GENERAL</sub>
<!-- /scroll:entry -->
<!-- scroll:making:end -->
