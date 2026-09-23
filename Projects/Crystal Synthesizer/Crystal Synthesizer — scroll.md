---
title: "Crystal Synthesizer — scroll"
born: 2026-09-23
links:
  - target: "[[Crystal Synthesizer]]"
    type: connects-to
    label: scroll-for
forward_vector: "I am Crystal Synthesizer's scroll — the one page that always opens on where the project stands now, then reads down through everything it has made, newest first. My top is regenerated from the board and the palace whenever anyone looks; my standing orders are Loudon's and never regenerated; my trail only ever grows."
---

# Crystal Synthesizer — scroll

> The project's front door. **Now** is regenerated on every look; **Standing Orders** are Loudon's; **The making** is the trail, newest first. Rendered in [[STIGMERGY]]'s PROJECTS deck; the entry [[Crystal Synthesizer]] stays the considered truth and this is the live one. See [[The Scroll]].

<!-- scroll:now:start -->
## Now

> _Regenerated 2026-09-23T04:36:43.543Z from the board, the steward's runtime, the entry's frontmatter and git. This zone is machine-owned — steer the project in **Standing Orders** below, never here._

- **Status:** active · **Stage:** fruiting · **Steward:** cycle 9 · last ran 2026-08-26 (28 days ago)
- **Waiting on you:** nothing
- **Ready to advance:** no unread answers
- **Last shipped:** 2026-06-25 (90 days ago) — Hypothesis arc closes — diamond and labradorite, same synth, same strike, only the symmetry changes. (`crystal-synth-steward-020`)
- **Last commit touching this project:** 2026-09-22 `fde9e98` — ops(Crystal Synthesizer): flush working proofs, renders + code
- **Signal:** ⚠ the last cycle posted nothing (one barren cycle — the lane will retry before calling it stalled)
- **Drift:** no consolidation marker on the entry — nothing to measure against.

### Where this stands

Crystal Synthesizer is a project that makes the optical properties of crystals audible by deriving partials from real phonon mode structure. Cycle 6 produced the diamond dispersion proof (a click smeared by an isotropic cubic lattice). Cycle 7 produced the anisotropic beryl proof (one crystal, two dispersion laws, depending on direction). Both confirmed by ear. The home entry's load-bearing claim, though, is more general than dispersion: it says symmetry itself determines timbral character. The cleanest test of that is the negative pole — triclinic labradorite, the lowest-symmetry crystal in the mineral palette, where every partial is unique and nothing organises them. This cycle…

### Open asks

_None — nothing is waiting on you._

### Answered, not yet consumed

_None._

### Decided

- `crystal-synth-steward-021` — directional_decision → GRANTED — option_id=FILL-PALETTE (2026-06-25)
- `crystal-synth-steward-018` — directional_decision → GRANTED — option_id=RENDER-LABRADORITE; notes: "make a really nice html menu of the proofs and what we are teaching, use accurate visuals and the audio examples." (2026-06-25)

<!-- scroll:now:end -->

## Standing Orders

<!-- scroll:orders:start -->
_Loudon's standing direction for this project. The steward reads this zone every cycle before anything else, and it is never regenerated. Taste, priorities, "stop asking me about X", "always prefer Y" — write it once here instead of answering it every cycle._
<!-- scroll:orders:end -->

## The making

<!-- scroll:making:start -->
<!-- scroll:entry id="crystal-synth-steward-020" -->
### 2026-06-25 — cycle 8 — Hypothesis arc closes — diamond and labradorite, same synth, same strike, only the symmetry changes.
> shipped · triclinic A/B render + a proofs menu indexing all four crystal proofs to date.

Catch-up — Crystal Synthesizer is a project that makes the optical properties of crystals audible by deriving partials from real phonon mode structure. Cycle 6 produced the diamond dispersion proof (a click smeared by an isotropic cubic lattice). Cycle 7 produced the anisotropic beryl proof (one crystal, two dispersion laws, depending on direction). Both confirmed by ear. The home entry's load-bearing claim, though, is more general than dispersion: it says symmetry itself determines timbral character. The cleanest test of that is the negative pole — triclinic labradorite, the lowest-symmetry crystal in the mineral palette, where every partial is unique and nothing organises them. This cycle's grant was to render that test before any Gen~ work.

What shipped — a pure additive synth (no filters, no dispersion, only sinusoids) struck on A2 and decayed with one envelope. Two voicings of the same engine. Diamond gets 5 partials packed into r_n 1.00–1.65, spanning less than one octave. Labradorite gets 8 partials spanning r_n 1.00–17.5, a 10.6× wider spread covering more than four octaves with no symmetry-related intervals. The diamond strike sits tight, bright, compressed. The labradorite strike rings bell-like but the bell is one you have never heard, because the partials never fold back into a chord.

The proofs-menu.html is the teaching surface — every proof to date in one place: calcite-vs-quartz (paired-partial beating, the haiku claim), the diamond dispersion filter, the beryl birefringent pair, and now the diamond/labradorite symmetry pole comparison. Inline players, partial tables, SVG of the partial spectrum, a final table that lays the hypothesis arc out as four named claims and their verdicts. The instrument it points to is Stage 1 of the staging arc.

**Artifacts:**
- [the proofs menu — every audio proof and teaching note in one place.](Projects/Crystal Synthesizer/proofs-menu.html)
- [diamond · 5 partials packed into 0.72 octaves · the cubic signature.](Projects/Crystal Synthesizer/triclinic-proof/diamond_strike.wav)
- [labradorite · 8 partials spread across 4.13 octaves · the triclinic signature.](Projects/Crystal Synthesizer/triclinic-proof/labradorite_strike.wav)
- [diamond then labradorite back to back · only the partial ratios differ.](Projects/Crystal Synthesizer/triclinic-proof/symmetry_arc_AB.wav)
- [diamond partial spectrum on a log frequency axis.](Projects/Crystal Synthesizer/triclinic-proof/diamond_strike.svg)
- [labradorite partial spectrum on a log frequency axis.](Projects/Crystal Synthesizer/triclinic-proof/labradorite_strike.svg)
- [the render script — numpy-only additive synth, partials straight from the Crystal Sonification Reference.](Projects/Crystal Synthesizer/triclinic-proof/render_labradorite.py)

_the symmetry signature, measured_
| crystal | system | unique partials | ratio range | span |
| --- | --- | --- | --- | --- |
| Diamond | cubic Fd-3m | 5 | 1.00 → 1.65 | 0.72 octaves |
| Labradorite | triclinic C-1 | 8 | 1.00 → 17.5 | 4.13 octaves |
<sub>`crystal-synth-steward-020` · BROADCAST on GENERAL</sub>
<!-- /scroll:entry -->

<!-- scroll:entry id="crystal-synth-steward-018" -->
### 2026-06-23 — cycle 7 — Three proof batches in; which way does Stage 1 ripen — Gen~ patch, or one more hypothesis test?
> still working · steward leans BUILD-GENPATCH · non-blocking

Stage 1's hypothesis arc has three of seven Bravais systems audibly tested (cubic implied via baseline, hexagonal via beryl, the dispersion behavior). The arc could ripen two ways: (a) leave hypothesis testing and start the actual Gen~ monophonic patch (Stage 1's named deliverable per the staging doc — a playable Max instrument, not a render farm), or (b) render one more decisive proof — triclinic labradorite, the most uncertain prediction ("chaotic, bell-like, unresolvable into intervals") — before committing to the patch. I lean (a): the patch is the actual Stage 1 product; further auditions are diminishing returns and the labradorite hypothesis is better tested *in* the instrument once we have one. But the triclinic case is the most scientifically interesting one, and rendering it now would close the prediction set before Gen~ work begins.

**Artifacts:**
- [Crystal Synthesizer — icon.png](Projects/Crystal Synthesizer/Crystal Synthesizer — icon.png)
- [Crystal Synthesizer — hero.png](Projects/Crystal Synthesizer/Crystal Synthesizer — hero.png)
- [beryl_birefringence_plot.html](Projects/Crystal Synthesizer/dispersion-filter/beryl_birefringence_plot.html)
- [beryl_birefringent_pair.wav](Projects/Crystal Synthesizer/dispersion-filter/beryl_birefringent_pair.wav)
- [beryl_basal_plane.wav](Projects/Crystal Synthesizer/dispersion-filter/beryl_basal_plane.wav)
- [beryl_c_axis.wav](Projects/Crystal Synthesizer/dispersion-filter/beryl_c_axis.wav)
- [beryl_dry_click.wav](Projects/Crystal Synthesizer/dispersion-filter/beryl_dry_click.wav)
<sub>`crystal-synth-steward-018` · RESOURCE_REQUEST on TRICKSTER</sub>
<!-- /scroll:entry -->

<!-- scroll:entry id="crystal-synth-steward-017" -->
### 2026-06-23 — cycle 7 — Stage 1 proof arc consolidated — cubic partial, birefringent pair, anisotropic dispersion, ready for your ear.
> still working · 3 proof batches rendered across cycles 4–6 · hero+icon landed

Spinning up. HOME: Crystal Synthesizer. Catch-up: this project is the synthesizer whose timbre is chosen by crystal physics, not by design. Stage 1 (monophonic Gen~ partial bank) is the proof-of-hypothesis stage — does each Bravais system actually sound the way we predicted? Cycles 4–6 rendered three independent proof batches: a birefringence pair (ordinary vs extraordinary axis), an anisotropic dispersion render for beryl (c-axis vs basal plane), and a dispersion-filter click sweep. Loudon's hand-drawn hero and icon arrived 2026-06-22 (commit 142911d) — the project now has visual identity. Cycle 7 ships the consolidated audition: the four artifacts that, heard together, tell the Stage 1 story. Nothing blocking; this is the made thing.

**Artifacts:**
- [the project's hand-drawn identity (Haeckel-engraving idiom).](Crystal Synthesizer — hero.png)
- [birefringence arc — ordinary→extraordinary→sum (the doubled shimmer hypothesis).](Projects/Crystal Synthesizer/birefringence-proof/05_birefringence_arc.wav)
- [beryl c-axis vs basal plane — the same click, two propagation directions.](Projects/Crystal Synthesizer/dispersion-filter/beryl_birefringent_pair.wav)
- [dispersion sweep — frequencies arrive at different times, the prism-in-time.](Projects/Crystal Synthesizer/dispersion-filter/03_dispersion_sweep.wav)
- [beryl dispersion curves — ordinary vs extraordinary, visualized.](Projects/Crystal Synthesizer/dispersion-filter/beryl_birefringence_plot.html)
<sub>`crystal-synth-steward-017` · BROADCAST on GENERAL</sub>
<!-- /scroll:entry -->
<!-- scroll:making:end -->
