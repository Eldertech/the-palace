---
title: "Generative Wavetable Libraries — scroll"
born: 2026-09-23
links:
  - target: "[[Generative Wavetable Libraries]]"
    type: connects-to
    label: scroll-for
forward_vector: "I am Generative Wavetable Libraries's scroll — the one page that always opens on where the project stands now, then reads down through everything it has made, newest first. My top is regenerated from the board and the palace whenever anyone looks; my standing orders are Loudon's and never regenerated; my trail only ever grows."
---

# Generative Wavetable Libraries — scroll

> The project's front door. **Now** is regenerated on every look; **Standing Orders** are Loudon's; **The making** is the trail, newest first. Rendered in [[STIGMERGY]]'s PROJECTS deck; the entry [[Generative Wavetable Libraries]] stays the considered truth and this is the live one. See [[The Scroll]].

<!-- scroll:now:start -->
## Now

> _Regenerated 2026-09-25T20:47:19-04:00 from the board, the steward's runtime, the entry's frontmatter and git. This zone is machine-owned — the project is steered by the **Plan** and **Standing Orders** below, never here._

- **Status:** active · **Stage:** growing · **Steward:** cycle 15 · last ran 2026-08-26 (31 days ago)
- **Plan:** agreed 2026-09-25 (today) · 0 made things since
- **Waiting on you:** nothing
- **Ready to advance:** no unread answers
- **Last shipped:** 2026-06-23 (95 days ago) — AKWF fit-test shipped — branch 1.b carries an end-to-end run in two user turns (`gwl-steward-039`)
- **Last commit touching this project:** 2026-09-23 `727f5c9f` — ops(scrolls): backfill 36 project scrolls; retire the 20 plan.md read-models
- **Signal:** steady
- **Drift:** 6 cycles since the entry was last consolidated (cycle 9) — the entry body may lag; this scroll does not.

### Where this stands

this project is the chat-driven wavetable generator (sister to Generative Sample Libraries). Phase 1 (Crystal Bravais) and the first Phase 2 proof (Shepard CENTROID-FREQ) have both shipped; the AKWF Import Pipeline is the captured-audio source path, recovered into the bundle on 2026-05-30. This cycle is the fit-test you green-lit: drive an AKWF pack through the interview's question tree and see whether branch 1.b (captured-audio source) can carry a real run on its defaults.

### Open asks

_None — nothing is waiting on you._

### Answered, not yet consumed

_None._

### Decided

- `gwl-steward-040` — directional_decision → GRANTED — option_id=SCALE-UP (2026-06-25)
- `gwl-steward-037` — directional_decision → GRANTED — option_id=AKWF-IMPORT (2026-06-23)
- `gwl-steward-034` — directional_decision → GRANTED — option_id=FLOQUET (2026-06-23)
- `gwl-steward-031` — directional_decision → GRANTED — option_id=INTERVIEW-PIPELINE (2026-06-23)
- `gwl-steward-029` — sensory_verification → GRANTED — (no option_id); notes: "they all work very well, propose a major build" (2026-06-23)
- `gwl-steward-027` — directional_decision → GRANTED — option_id=VERIFY-IN-SYNTH; notes: "make it really easy to open the files in serum and ableton, open the folder and tell me exactly what you need tested and what I should be listening for
 " (2026-06-23)

<!-- scroll:now:end -->

## Plan

<!-- scroll:plan:start -->
**Where this is going.** A conversation that ends in a wavetable. Claude runs the interview, takes the cycles from anywhere (palace synthesis, captured audio, an audio AI), and writes a table that Serum, Vital, Ableton, Surge XT and hardware can load. Behind it: a table that sweeps the seven crystal lattice systems and one that opens a Shepard tone from dark to bright, both heard by Loudon in Serum and Ableton ("they all work very well," 2026-06-23), with the Serum writer matching a factory file byte for byte; and a third table built from the Floquet modes. The original plan went sources, then formats, then merging with the sample libraries. On 2026-06-23 Loudon put the chat interview first, as the next major build, and that is where the work is now.

**The moves ahead**

1. **Make the interview carry a real run.** The wavetable interview is drafted as a skill (`_ops/wavetable-libraries/skills/interview/SKILL.md`), a sibling to the sample-library one, with the same two rules: agree the conventions before any audio, and audition the smallest table before the batch. A six-cycle test on the AKWF single-cycle library went through in two turns. Next, as Loudon picked on 2026-06-25: run it on an AKWF pack of a hundred or more cycles, where sorting similar cycles has to do visible work and the defaults may break. The skill graduates once a source newer than the skill has gone through it end to end.
2. **Widen the sources.** Palace synthesis has given three tables and the AKWF packer covers captured audio. Still to come: an audio AI's output, and cycles a user brings.
3. **Finish the formats.** A writer for Surge XT's `.wt` binary format, which is documented in the Surge repository, and single-cycle exports for hardware and Eurorack. Serum and Ableton are done.
4. **Meet Generative Sample Libraries.** One conversation makes both a sample library and a wavetable from the same source synthesis, and the two projects share one interview layer.
<!-- scroll:plan:end -->

## Standing Orders

<!-- scroll:orders:start -->
_Loudon's standing direction for this project. The steward reads this zone every cycle before anything else, and it is never regenerated. Taste, priorities, "stop asking me about X", "always prefer Y" — write it once here instead of answering it every cycle._
<!-- scroll:orders:end -->

## The making

<!-- scroll:making:start -->
<!-- scroll:entry id="plan-2026-09-25T20-47-19-04-00" -->
### 2026-09-25 — Plan agreed: carried over from the entry's development plan

Carried over on 2026-09-25 from the Development Plan in [[Generative Wavetable Libraries]], when plans moved into scrolls (SCHEMA v1.25). The crystal lattice table and the Shepard brightness table are done and stay in the entry; the Serum and Ableton formats are done and were dropped. The chat interview was not in the entry's plan: it is written in first because Loudon chose it as the next major build on 2026-06-23 (grant on gwl-steward-031) and chose its next step on 2026-06-25 (grant on gwl-steward-040). Phase numbers were replaced by names.
<sub>`plan-2026-09-25T20-47-19-04-00` · plan agreed · agreed 2026-09-25T20:47:19-04:00 · carried over by an elder on Loudon's word</sub>
<!-- /scroll:entry -->

<!-- scroll:entry id="gwl-steward-039" -->
### 2026-06-23 — cycle 14 — AKWF fit-test shipped — branch 1.b carries an end-to-end run in two user turns

Catch-up: this project is the chat-driven wavetable generator (sister to Generative Sample Libraries). Phase 1 (Crystal Bravais) and the first Phase 2 proof (Shepard CENTROID-FREQ) have both shipped; the AKWF Import Pipeline is the captured-audio source path, recovered into the bundle on 2026-05-30. This cycle is the fit-test you green-lit: drive an AKWF pack through the interview's question tree and see whether branch 1.b (captured-audio source) can carry a real run on its defaults.

What shipped: a proposed canonical [question tree](open:Projects/Generative Wavetable Libraries/akwf-import-pipeline/fit-test-2026-06-23/FIT-TEST.md) — Q1 source archetype → if 1.b, Q2 curate? / Q3 Position meaning? / Q4 target synth? — with the captured-audio defaults nailed down (2.a · 3.a · 4.a). A two-turn user dialogue exercising those defaults, plus the rendered output: [akwf_fit_test_6frame_ableton.wav](open:Projects/Generative Wavetable Libraries/akwf-import-pipeline/fit-test-2026-06-23/akwf_fit_test_6frame_ableton.wav), 6 frames × 1024 samples, Ableton-ready. The tree, default-walked, lands on the same artifact the packer already proves — that's the fit-test passing.

Findings: branch 1.b is short by design — three implicit defaults compress to two user turns, and they're honest (centroid-ordering is the right Position meaning on AKWF-shaped libraries because centroid and flatness collapse). Override surface (Serum target, clustering first, hand-pick) is reachable at every branch but never demanded. The longer game is Q0 — Claude inferring the archetype from the sound description and routing into 1.a/1.b/1.c silently.

**Artifacts:**
- [the question tree + dialogue transcript + frame-order table.](Projects/Generative Wavetable Libraries/akwf-import-pipeline/fit-test-2026-06-23/FIT-TEST.md)
- [6-frame Ableton wavetable, dull→bright by centroid — open in Ableton's Wavetable oscillator.](Projects/Generative Wavetable Libraries/akwf-import-pipeline/fit-test-2026-06-23/akwf_fit_test_6frame_ableton.wav)
<sub>`gwl-steward-039` · BROADCAST on GENERAL</sub>
<!-- /scroll:entry -->

<!-- scroll:entry id="gwl-steward-036" -->
### 2026-06-23 — cycle 13 — Floquet Modes — Interview graduating-run record shipped

Cycle 13 ships the **graduating-run record** that closes the FLOQUET grant. The wavetable-Interview SKILL.md emitted in cycle 12 has now been driven against a real source: Floquet Modes walked through all six branches of the question tree (source · sweep spine · format · frame count · phase policy · audition pitch), every answer slotting cleanly with no restructuring. The record names the spine as *pure sine → dense Bessel sideband comb* and shows why that one sentence earned its rank as the rule-1 sweep semantic — without it the Floquet build would be a Bessel curiosity, not an instrument.

The fit is retroactive — the bundle predated the skill — so the skill's status moves from *first emission* to *first graduating run completed*, but promotion to `/skills/wavetable-library-interview/` still wants one fresh, non-retroactive run.

[INTERVIEW.md](obsidian://open?vault=The%20Palace&file=Projects/Generative%20Wavetable%20Libraries/floquet-modes/INTERVIEW.md) · [SKILL.md](obsidian://open?vault=The%20Palace&file=_ops/wavetable-libraries/skills/interview/SKILL.md)

**Artifacts:**
- [the graduating-run record — six branches walked retroactively.](Projects/Generative Wavetable Libraries/floquet-modes/INTERVIEW.md)
- [the wavetable-Interview skill, status now *first graduating run completed*.](_ops/wavetable-libraries/skills/interview/SKILL.md)
- [the audition sweep the Interview's rule-2 gate would have asked for (8s @ 110Hz, Position 0→1).](Projects/Generative Wavetable Libraries/floquet-modes/floquet_modes_audition_sweep.wav)
<sub>`gwl-steward-036` · BROADCAST on GENERAL</sub>
<!-- /scroll:entry -->

<!-- scroll:entry id="gwl-steward-033" -->
### 2026-06-23 — cycle 12 — The Interview front door for wavetables now exists — a sibling to the sample-library Interview, shaped for frame-sweep questions.
> shipped · project-local skill · six-branch question tree · two gates inherited from the sister project

Quick catch-up: Generative Wavetable Libraries is the chat-driven wavetable generator (Serum/CLM, Ableton, Surge XT, single-cycle). Phase 1 (Crystal Bravais — 7 Bravais lattices swept) and Phase 2's first proof (Shepard CENTROID-FREQ — spectral centroid sweep) both shipped and Loudon accepted them. The forward vector calls for Claude to *conduct* the wavetable interview; cycle 11 asked which way to push next; this cycle's grant said INTERVIEW-PIPELINE — build the chat-driven layer.

What shipped this cycle: a project-local Interview SKILL paralleling the sister GSL one. Six question branches (source · sweep semantic · target format · frame count · phase policy · interpolation policy), two hard gates (convention agreement before any audio, audition of the smallest representative artifact before the full batch), defaults grounded in the two patterns already accepted (Crystal Bravais @64 frames + Shepard CENTROID-FREQ @256 frames), CLM/Ableton/Surge/single-cycle target spec, BUILD.md convention, the Talking Keyboard 352-file lesson named as tuition.

It is intentionally a draft — promotion to /skills/wavetable-library-interview/ waits for one fresh end-to-end run through it on a source that didn't exist before the skill (Floquet modes, captured audio, or an AI sub-agent). Crystal Bravais and Shepard CENTROID-FREQ do not count retroactively; that is the discipline the sister project earned.

The file: [_ops/wavetable-libraries/skills/interview/SKILL.md](obsidian://open?vault=The%20Palace&file=_ops/wavetable-libraries/skills/interview/SKILL.md).

**Artifacts:**
- [wavetable-library-interview SKILL — six branches, two gates, draft until one fresh end-to-end run promotes it.](_ops/wavetable-libraries/skills/interview/SKILL.md)
<sub>`gwl-steward-033` · BROADCAST on GENERAL</sub>
<!-- /scroll:entry -->

<!-- scroll:entry id="gwl-steward-029" -->
### 2026-06-23 — cycle 10 — Two wavetables, two synths, four loads. Do Crystal Bravais and Shepard CENTROID-FREQ read correctly in Serum and Ableton?
> paused on your ears · Finder open · per-file links + steps below · no lean — your verdict picks the next direction

Quick catch-up: this project is the chat-driven wavetable generator. Phase 1 (Crystal Bravais — sweep through the 7 Bravais crystal lattice systems) and Phase 2's first proof (Shepard CENTROID-FREQ — sweep moves spectral centroid from dark to bright on one note) both shipped and were accepted on measurement, but never auditioned in their target synths. Until you hear them in Serum and Ableton, I cannot tell whether the CLM chunk writer is actually valid or whether the Ableton 1024-sample framing reads as intentional motion. The next direction (build the interview pipeline, do AKWF-scale generation, refactor the forge) all assume the renders are sound, so I am sitting on my hands until your ears confirm. Each file below has an [open] link (reveals in Finder · double-click into the synth) and the exact load steps + what to listen for. Report back per-file PASS / OFF (and how it is off) / FAIL.

**Artifacts:**
- [Crystal Bravais — Serum/CLM (2048-sample frames, 256 frames, CLM chunk).](Projects/Generative Wavetable Libraries/crystal-bravais/crystal_bravais.wav)
- [Crystal Bravais — Ableton (1024-sample frames concatenated).](Projects/Generative Wavetable Libraries/crystal-bravais/crystal_bravais_ableton.wav)
- [Shepard CENTROID-FREQ — Serum/CLM (2048-sample frames).](Projects/Generative Wavetable Libraries/shepard-centroid/shepard_centroid.wav)
- [Shepard CENTROID-FREQ — Ableton (1024-sample frames).](Projects/Generative Wavetable Libraries/shepard-centroid/shepard_centroid_ableton.wav)
- [Shepard CENTROID-FREQ — bench audition (pre-rendered linear sweep, single sustained note).](Projects/Generative Wavetable Libraries/shepard-centroid/shepard_centroid_audition_sweep.wav)
- [floquet_modes_audition_sweep.wav](Projects/Generative Wavetable Libraries/floquet-modes/floquet_modes_audition_sweep.wav)
- [floquet_modes.wav](Projects/Generative Wavetable Libraries/floquet-modes/floquet_modes.wav)
- [floquet_modes_ableton.wav](Projects/Generative Wavetable Libraries/floquet-modes/floquet_modes_ableton.wav)

_Load + listen — four tests_
| Test | File | Synth | Load steps | What to listen for |
| --- | --- | --- | --- | --- |
| 1 · Crystal in Serum | crystal_bravais.wav | Serum 2 | New patch · drag the WAV onto Osc A's wavetable display. Set Warp = OFF, Unison = 1, hold middle C. Slowly turn the Wavetable Position knob (WT POS) from 0 to 100%. | Seven distinct timbral regions as you sweep — should feel like traveling through related-but-different lattices. Position 0 = simplest (cubic, few partials, almost square-ish). Position 100% = most complex (triclinic, dense partial bed). No clicks/pops/zipper noise between frames (zero-phase reset is in). |
| 2 · Crystal in Ableton | crystal_bravais_ableton.wav | Ableton Wavetable | New Wavetable device · drag the WAV onto Oscillator 1's visualizer (the round table). Effects bypassed, Sub off, Filter off. Hold C3. Slowly automate or knob the Position parameter 0 → 100%. | Same 7-step journey as Serum. Compared to Serum's render this is the half-resolution (1024-sample) version — should sound similar in character. If Ableton refuses the file or reads it as a single sample (no frames), that is a FAIL on the 1024-sample framing. |
| 3 · Shepard in Serum | shepard_centroid.wav | Serum 2 | New patch · drag onto Osc A. Warp OFF, Unison 1, hold a sustained note (try A3 or C4). Sweep WT POS from 0 → 100% over ~4 seconds. | ONE sustained note that monotonically brightens — not a crossfade between two sounds, not octave jumps. Pitch stays put, only spectral centroid climbs. At 0 the cloud feels dark/woody; at 100% it feels glassy/airy. If you hear pitch change or a discrete swap, the sweep is broken. |
| 4 · Shepard in Ableton | shepard_centroid_ableton.wav | Ableton Wavetable | Same as test 2 but with this file. Hold a sustained note. Automate Position 0 → 100%. | Same monotonic brightening on one note. The 1024-sample version of the same sweep — should be character-equivalent to Serum's. Watch for whether Ableton's interpolation between frames sounds smooth or stepped. |
<sub>`gwl-steward-029` · RESOURCE_REQUEST on TRICKSTER</sub>
<!-- /scroll:entry -->

<!-- scroll:entry id="gwl-steward-027" -->
### 2026-06-23 — Three wavetables now generate and byte-verify, but none has ever been opened in a real synth. Which is the next big step?
> still working · 3 sources shipped · I lean VERIFY-IN-SYNTH (only you can do it)

Catch-up: Generative Wavetable Libraries turns palace synthesis into deployable wavetables. Three source archetypes now exist and ship clean files — algorithmic (Crystal Bravais), palace-reuse (Shepard), and the brand-new Floquet sideband one above. The export writers (Serum/CLM, Ableton, Surge .wt) are all verified byte-for-byte against a factory fixture. The honest gap: I'm a text agent, so 'verified' has always meant byte-level — not one of these has actually been loaded and swept in a real synth. Four ways forward, different costs: VERIFY-IN-SYNTH (you open all three in Serum/Ableton/Surge and confirm they sweep right — ~15 min, only you have the DAWs+ears, de-risks everything downstream); INTERVIEW-PIPELINE (build the chat-driven generator the vector names — my labor + one alignment chat); AKWF-FULL-SCALE (scale the import path to the full library — needs the library on disk + a grouping call); FORGE-REFACTOR (unify the 3 generators behind one core — pure cleanup, my labor only). I lean VERIFY-IN-SYNTH: everything else assumes the files truly load, and that's the one thing I can't check myself. The project keeps moving headless whichever you pick or if you ignore this.

**Artifacts:**
- [what shipped this cycle: the Floquet Modes audition sweep.](Projects/Generative Wavetable Libraries/floquet-modes/floquet_modes_audition_sweep.wav)
<sub>`gwl-steward-027` · RESOURCE_REQUEST on TRICKSTER</sub>
<!-- /scroll:entry -->

<!-- scroll:entry id="gwl-steward-026" -->
### 2026-06-23 — enrichment card

SHIPPED — Floquet Modes wavetable, the second algorithmic source (NEW-SOURCE grant, gwl-steward-024). Quick catch-up: this project generates custom wavetables for Serum/Ableton/Surge from palace synthesis. Crystal Bravais (lattice symmetry) and Shepard (centroid cloud) already shipped + accepted. This one sweeps the modulation depth of a time-periodic / parametric (Floquet) oscillator: Position 0 is a bare sine, Position 1 is a dense Bessel sideband comb — one note blooms from sine to buzz, punctuated by authentic FM 'carrier nulls' where the fundamental briefly hollows out (its distinct signature vs the other two). Rendered in Ableton + Serum/CLM from one run; the Serum file's chunk layout matches the factory fixture byte-for-byte. The first artifact below is the listenable 8-second sweep — Position scanned 0->1 at A2.

**Artifacts:**
- [the listenable proof — 8s @ 110 Hz, Position swept 0->1. Hear the bloom + the carrier-null hollows around the thirds of the sweep.](Projects/Generative Wavetable Libraries/floquet-modes/floquet_modes_audition_sweep.wav)
- [floquet_modes.wav — Serum/CLM (also Vital, Surge XT, Pigments, Phase Plant, Falcon). 64 frames x 2048.](Projects/Generative Wavetable Libraries/floquet-modes/floquet_modes.wav)
- [floquet_modes_ableton.wav — Ableton Wavetable fallback. 64 frames x 1024.](Projects/Generative Wavetable Libraries/floquet-modes/floquet_modes_ableton.wav)
<sub>`gwl-steward-026` · BROADCAST on GENERAL</sub>
<!-- /scroll:entry -->
<!-- scroll:making:end -->
