# AI-source probe — Phase 3 source three

Can an audio model play a note we ask for, steadily enough to multisample?
Loudon's grant on `gsl-steward-037` framed the test: ask a range of
instruments for specific pitches, check each render with librosa. His grant
on `gsl-steward-040` (BOTH-PARALLEL) set the arms: Stable Audio and MusicGen,
head to head, in one report.

## Run it (on the Mac)

```
bash "Projects/Generative Sample Libraries/ai-source-probe/run-on-mac.sh"
```

It builds what it needs on first run, renders every arm, grades every
render, and opens `compare.html`. `--quick` does 8 cells per arm instead of
48; `--only <arm>` reruns one arm and keeps the others' results.

## The arms

| arm | what hears the pitch | runs in |
|---|---|---|
| `crystal` | exact — the shipped Crystal instrument (reference, not a model) | `.venvs/gsl-probe` |
| `stable_audio` | the prompt only ("…playing note C4 (pitch 261.63 Hz)…") | `_tools/stable-audio-3/.venv` |
| `musicgen_melody` | the prompt + a sine at the target as melody guide | `.venvs/musicgen` |
| `musicgen_text` | the prompt only — same model, no guide (the control) | `.venvs/musicgen` |

Every text arm hears the same prompt (`adapters/_common.py`), so the
comparison is between models and guides, not prompts. The two MusicGen arms
share one checkpoint, so the gap between them measures the guide itself.

A prediction the run can falsify: MusicGen reads its guide as a chromagram,
which knows the note but not the octave. The melody arm should land on the
right note more often than in the right octave.

`mock` (a perfect tone) and `mock_flawed` (seeded, simulated flaws) are test
arms for the grader. They never appear in the model comparison.

## The matrix

6 instruments (piano, violin, marimba, flute, bass, choir) × 4 notes
(A2, E3, C4, G5 — four different note names across the same span) ×
2 seeds = 48 cells per arm. `matrix.json` holds it.

## The grade (verify.py)

The grader tracks pitch frame by frame (librosa pyin; a numpy YIN when
librosa is absent) over the body of the note, two octaves either side of
the target. Then it asks two separate questions:

- **Does it hold still?** stable = voiced ≥ 60% ∧ spread ≤ 30¢ ∧ dominance ≥ 80%
  - stable = (share of frames that have a pitch) ≥ 60% ∧ (width of the middle half of the pitch readings) ≤ 30¢ ∧ (share of frames within ±50¢ of their median) ≥ 80%
- **Did it land where we asked?** on_target = stable ∧ |cents_err| ≤ 20¢
  - on_target = stable ∧ |distance from the note we asked for| ≤ 20¢
- **Is it a note at all?** A median within 15¢ of the search band's edge
  is the tracker pinned there; it grades texture.

Three grades follow: **on target**, **retunable** (stable, but off; any
octave), **texture** (not stable). A sampler can fix a wrong note with
`pitch_keycenter` + `tune`. It cannot fix a wandering one. Every stable
render carries the SFZ values it would need.

An instrument passes on an arm when 75% of its cells are on target
(ON TARGET) or at least retunable (RETUNABLE); otherwise TEXTURE ONLY.

For a stable render the exact pitch comes from a YIN median in a ±100¢
band around the tracker's reading, because pyin alone reports on a 10-cent
grid. A whole-window autocorrelation was tried for this job and rejected:
the crystal's inharmonic partials pulled it up to 22¢ flat where pyin, YIN
and an FFT peak agreed within 2¢.

## From graded run to instrument (build_sfz.py)

`run-on-mac.sh` ends by turning each model arm's graded run into a
playable SFZ per instrument row, under `instruments/<arm>/<instrument>/`.

- **Which render.** Only renders that hold still are candidates. Per note:
  on target before retunable, then the octave nearest the one asked for,
  then the steadiest, then the closest pitch class.
- **Where it goes.** By the pitch it actually sounds at (the grader's
  `sfz_keycenter` + `sfz_tune`), not the note we asked for. A render that
  came out an octave high is mapped an octave high, retuned. Two notes that
  came out on the same key keep the better one.
- **Key ranges.** Split at the midpoint between neighbours; the outer
  samples reach at most 12 semitones (`--stretch`). Wider gaps stay silent
  and are named in the file header and `picks.json`.
- **Envelope.** `one_shot` for piano and marimba (they ring out),
  `no_loop` for the rest (key-up releases). No loop points yet — that is
  Phase 4.
- **Onset.** −30 dBFS, 2 ms back-off, 3 ms fade-in. This is the third copy
  of the Phoneme Choir trim; `responsive_onset.py` is still unbuilt.

`--check` reads the regions back out of the written `.sfz`, plays every
mapped key through a small numpy sampler using the SFZ pitch rule
(`cents = (key − pitch_keycenter) × 100 + tune`), and grades each key
against its own pitch with `verify.py`. It checks the mapping arithmetic,
not how sforzando sounds (resampling is linear interpolation).
`--audition` writes a rising line across the keyboard.

The shipped proof is `instruments/crystal/reference/`, built from the
crystal arm's `piano` row (the crystal arm plays the crystal on every row,
so the samples keep the row's name): 4 samples, A1–G6, 59 of 59 keys on
target, worst 1.75¢, `one_shot`. WAVs are gitignored in this project
(`.gitignore:53`), so git carries its `.sfz`, `picks.json` and
`keycheck.json` but not its samples; `run-on-mac.sh` rebuilds it.

## What is checked, and on what

Checked here: all 48 `mock_flawed` cells land in the grade their simulated
flaw should earn, under both pyin and YIN; the crystal reference grades 48
of 48 on target, worst 1.85¢, under both trackers; the perfect mock reads
within 0.32¢. The dry-run page is `compare.dry-run.html`.

The instrument builder, checked on `mock_flawed` (built to a scratch
folder, not kept): all six rows build, and every mapped key of every one
plays on target, worst 1.53¢ — including zones made from 30–50¢-off
renders and octave slips, which is the retune claim above tested rather
than assumed. The violin's missing C4 leaves a reported two-key gap
(F4–F♯4). With one region's `tune` zeroed by hand, exactly that zone's 16
keys fail, each 31¢ sharp: the check can fail.

## The first real run (Mac, 2026-09-23)

M1 Max, full matrix, all four arms: 192 renders. Stable Audio takes about
1.4 s a render, MusicGen about 10 s on MPS. The whole run takes about 25
minutes after the one-time venv build and weights download.

| arm | on target | retunable | texture | stable, right note (any octave) | stable, right octave |
|---|---|---|---|---|---|
| crystal (reference) | 48 | 0 | 0 | 48 of 48 | 48 |
| stable_audio | 2 | 7 | 39 | 9 of 9 | 2 |
| musicgen_melody | 5 | 23 | 20 | **28 of 28** | 8 |
| musicgen_text | 1 | 35 | 12 | 9 of 36 | 7 |

What it says:

- **The guide is what makes pitch work.** Every stable melody-arm render
  is the note we asked for. The same model with no guide holds still more
  often (36 vs 28) but picks its own note three times in four.
- **The chroma prediction held.** Right note, wrong octave: only 8 of the
  28 melody-arm notes land in the asked-for octave. That costs nothing,
  because build_sfz maps by the pitch actually heard.
- **Stable Audio mostly makes texture.** 39 of 48 renders never hold a
  pitch. When one does, it is the right note, but that is too rare to
  build on.

Instruments passing on the 75% rule: melody violin + marimba (RETUNABLE),
text piano / violin / flute / bass / choir (RETUNABLE, but the text arm's
"retunable" means "held some note steady", not the one asked for).

Four things the run found that no dry run could:

1. `torchaudio` was missing from the MusicGen venv recipe (the melody
   processor needs it). Added.
2. **MusicGen-melody ignored all conditioning.** Recent transformers
   (4.57 and 5.17 both) hands `generate()` an empty cache before step one,
   and the model's `prepare_inputs_for_generation` drops the conditioning
   prefix whenever a cache exists. So "solo violin" and "heavy metal drums"
   came back byte-identical at one seed. The first "MPS is broken" reading
   was this bug, not the GPU. `adapters/musicgen.py::_keep_conditioning`
   patches it; the venv is pinned `transformers>=4.45,<5`, the tested
   version.
3. The grader called a tracker pinned at the floor of its search band
   (exactly −2400¢, 0¢ spread) a stable note. Because that floor is the
   same note name two octaves down, it would have inflated the melody
   arm's right-note count (10 cells). verify.py now rejects a median
   within 15¢ of either band edge.
4. build_sfz's audition crashed on a key inside a reported gap. Gap keys
   are now silent.

Also new: `probe.py same_sound` — if every render in an arm has nearly
the same spectrum (all pairs within 1.5 dB), the grades print a warning
that the arm is broken, not the model. It would have flagged bug 2 on
the first pass.

`--quick` overwrites the crystal reference with a one-seed build (58/59).
Run the full matrix, or `--only crystal`, to restore it (59/59, 1.75¢).

MusicGen-melody weights are CC-BY-NC 4.0, so any library sampled from those
two arms cannot be sold.

## Files

`run-on-mac.sh` · `probe.py` (render / verify one arm) · `verify.py` (the
grade) · `compare.py` (the head-to-head page + `compare.json`) ·
`build_sfz.py` (graded run → SFZ) · `matrix.json` · `adapters/`. Each arm
leaves `renders.<arm>.jsonl`, `results.<arm>.jsonl`, WAVs under
`samples/<arm>/`, and (model arms) instruments under `instruments/<arm>/`.

## Prompt shape (Mac, 2026-09-24)

The A/B the first run named, on the winning arm. Same matrix, seeds, and
sine guide; only the words for the pitch change. `ab-prompt-shape.sh` runs
it (192 renders, about 30 min); `ab_table.py` prints the table.

| wording | example | stable | right note (±50¢) | right octave | passing |
|---|---|---|---|---|---|
| name + Hz (the head-to-head) | `note C4 (pitch 261.63 Hz)` | 28 | 28 of 28 | 8 | violin, marimba |
| name | `note C4` | 23 | 23 of 23 | 9 | — |
| Hz | `a 261.63 Hz tone` | 20 | 20 of 20 | 7 | violin |
| words | `middle C` | 23 | 23 of 23 | 9 | — |
| none | (instrument only) | 27 | 27 of 27 | 9 | bass |

What it says:

- **The words don't steer the pitch; the guide does.** Every stable render
  on every wording is the asked-for note. The spread in how often a render
  holds still (20 to 28 of 48) is about what two seeds per cell would
  scatter by chance. Hz-only is lowest, but not by enough to call it.
- **No wording fixes the octave.** Right octave stays at 7–9 of 48 on all
  five. The chroma guide cannot carry an octave and the text doesn't add one.
  The builder's remap-by-heard-pitch is the answer, as before.
- **Takes are the lever.** Pool all ten takes per note (five wordings × two
  seeds) and 23 of 24 notes have at least one steady, right-note take. The
  one miss is choir G5. About half of all takes hold still, so the rule of
  thumb is "render five, keep the steadiest."

`results.mgm_pool.jsonl` is the five arms concatenated; `build_sfz.py
mgm_pool --check --audition` builds from the best of ten. Against the
two-take head-to-head build, per mapped keys on target: violin 35/35
(was 20/32), marimba 35/40 (23/33), bass 36/40 (18/32), flute 43/52
(33/33), choir 27/40 (36/45), piano 23/45 (22/45). The whole-arm
"TEXTURE ONLY" label on the pool is the 75% rule applied to all 80 takes
per instrument, which a best-of pick doesn't need — ignore it for pooled
builds.

Keep the name + Hz wording as the default: best by a nose, and changing it
buys nothing.

## Best of five, one instrument (Mac, 2026-09-24)

`best-of.sh violin 55:91:3 5` asked for 13 notes (G3 to G6, every third
semitone), five takes each, 65 renders at about 9 s apiece. `probe.py` grew
`--instrument`, `--grid LO:HI:STEP`, `--takes N` and `--as NAME`. `build_sfz.py`
grew `--trim`: each zone shrinks to the unbroken run of keys that pass the
keycheck around its own sample, and a sample that fails at its own pitch is
dropped.

| asked | steady takes of 5 | what they did |
|---|---|---|
| G3–E4 | 4, 4, 4, 5 | mixed: right octave or one up |
| G4 | 1 | one steady take, on target |
| A#4–E5 | 5, 4, 4 | mostly right octave |
| G5 | 2 | one on target, one an octave down |
| A#5–E6 | 5, 4, 1 | **every steady take an octave down** |
| G6 | 0 | nothing held still |

43 of 65 takes held steady; 12 of 13 notes had at least one. The build kept
8 samples, G3 to G5 about every three semitones, and all 49 mapped keys
(G2–G6) play on target, worst 4 cents. Trim cut nothing on this one.

What it says:

- **Best-of works as predicted.** Two takes per note gave a patchy violin;
  five gives one steady take for nearly every note.
- **The guide has a ceiling near G5 on violin.** Above it the model plays
  the note an octave down, every time. The builder handles that honestly:
  those takes sound on keys a lower pick already covers, so they fold away,
  and the top octave (F#5–G6) is the G5 sample stretched up to 12
  semitones. In tune by measurement; how it sounds is for the ear.
- `--trim` on the earlier builds: pool piano loses D#4–A4 (a real gap), and
  flute and bass each lose one sample that failed at its own pitch. The
  crystal reference is untouched (59/59).

## The top-octave ceiling (Mac, 2026-09-24)

`ceiling.sh` asked the violin for its top four notes (A#5, C#6, E6, G6), five
takes each, three ways, against the best-of-five run as baseline: a guide
with 2nd and 3rd harmonics (`mgm_harm`), a prompt that says "in its very
highest register" (`mgm_high`), and guidance 6 instead of 3 (`mgm_cfg6`).
`ceiling_table.py` prints the grid.

| arm | right octave / steady / takes, over the four notes |
|---|---|
| baseline (sine, guidance 3) | 0 / 18 / 20 |
| harmonic guide | 0 / 18 / 20 (byte-identical to baseline) |
| "highest register" prompt | 0 / 17 / 20 |
| guidance 6 | 0 / 17 / 20 |

(Steady counts after the verifier fix below.)

What it says:

- **The guide cannot carry the octave, by construction.** The processor
  turns the guide into a 12-slot chroma and keeps only the loudest slot per
  frame (one-hot). Any guide whose loudest note is the same becomes the same
  input, so the harmonic arm rendered the baseline's exact bytes. Guide
  timbre is not a lever; only which note is loudest is.
- **Words and guidance don't move the register either.** 0 of 60 new takes
  landed in the octave asked for. The model plays this violin no higher than
  about G5. That is the model's ceiling, not a prompt problem.
- **Verifier bias, fixed.** The pitch search stopped exactly two octaves
  below the target, and the high violin takes that go two octaves down sat
  right on that floor, so the edge rule threw them out as "pinned". They
  were steady, fully voiced notes. The floor is now three octaves down
  (`FLOOR_DIV` in verify.py). Regraded best-of-five: steady takes 43 → 54 of
  65, notes with a steady take 12 → 13 of 13, and the verdict moves from
  TEXTURE ONLY to RETUNABLE. One take went the other way (E5 s1 now
  wanders an octave under the wider search). The recovered takes all land two
  octaves down, on keys lower picks already cover, so the build didn't change.

Two violins from the same eight samples, both 100% on target by keycheck:

- `instruments/violin_bo5/violin/`: stretch 12, G2–G6 (49 keys). The top
  seven keys are the G5 sample pushed up as far as 12 semitones.
- `instruments/violin_bo5/violin_cap5/`: stretch 5, D3–C6 (35 keys). Nothing
  stretched past 5 semitones; the top goes silent instead of thin.

Which one is right is for the ear. For more real violin above G5, the
remaining options are a different source or a model that knows the register.
Pitch-shifting the octave-down takes offline is the same stretch by another name.

## After best of five

Next, before any full set: Loudon's ear on the violin's timbre and its
stretched top octave. Candidate fixes for the ceiling, untested: a guide
with a second harmonic at the target (so the chroma has more to hold), or
cap the stretch at 5 semitones and accept a silent top.

## Attacks (Mac, 2026-09-24, cycle 26)

Loudon's ear on gsl-steward-047: MusicGen is ok; the violin "has an odd
attack, but the sustain portion is violin like"; the marimba "sounds like a
marimba with a bunch of audio delays, like there are lots of different
attacks instead of a single attack"; Stable Audio "is horrible" (dropped
from further work).

Measured first. Both faults come from one habit: MusicGen writes music,
not notes. Asked for one sustained tone, it hands back a clip cut out of
the middle of a performance.

- **Violin:** the first 100 ms is already 5-18 dB into the note. No bow
  ever touches the string; the sample starts on a cut.
- **Marimba:** a roll. Median 17 strikes per 5 s take on the old prompt
  (17 takes, 0 with a single strike). A marimbist sustains by rolling, and
  the prompt said "sustained" twice.

Why the render can't be fixed from the guide: transformers'
MusicgenMelody feature extractor turns the guide into chroma and then
argmaxes it — one pitch class per frame, one-hot. Loudness never reaches
the model. A guide can't say "hit once, then fade"; it can only say "this
pitch, every frame", which for a marimba is a roll. (Silence would read
as a note too: the argmax of an all-zero frame is index 0.) A one-hit
prompt (adapter `mgm_struck`, matrix row `marimba_hit`, marked `extra` so
the full matrix skips it) helped a little: 1 clean ring in 12 takes, vs 0.

So the fix is after the render, in `shape_attacks.py`:

| mode | for | what it does |
|---|---|---|
| bow | sustained instruments | skip into the steady sustain (≥150 ms, within 3 dB of it); the SFZ bows it on: `ampeg_attack=0.14 ampeg_vel2attack=-0.10` (140 ms soft, 40 ms full) |
| strike | struck, cut only | find every strike, keep the one that rings longest before the next, re-check inside it, fade out |
| ring | struck, rung out | the strike above, then its own partials (only those on the note's harmonic series, ≤6) fitted by least squares just before the next hit and left to decay, lowest slowest (fundamental τ ≈ 1.2·√(262/f) s) |

`--takes RUN` re-picks each note among every steady take by longest clean
strike. `strike_census.py` counts strikes per take so two prompts can be
compared by the thing Loudon heard. `attack_figure.py` draws the before/
after waveforms. Every output folder has `ab.wav`: each sample as rendered,
then reshaped.

Keycheck after shaping: violin 35/35 keys on target (worst 4.0 c); the
4-note marimba pool 40/40 (worst 5.6 c). The ring is a hybrid — AI mallet,
modelled bar — and says so in the SFZ header.

### Marimba middle filled (cycle 28, RING granted)

`fill-middle.sh marimba_hit 54:63:1 5 mgm_struck` renders every semitone
F#3–D#4 (the octave MusicGen actually plays marimba in), five takes each,
grades, builds, and ring-shapes. 50 takes: 28 on target, 5 retunable, 17
texture. Every one of the 10 semitones kept a sample, so the instrument
now stretches at most one semitone inside its middle, not up to 12.

`shape_attacks.py` re-pick now asks `holds_pitch()` first, then clean,
then length. Before, it ranked by ring length alone and A#3 picked a
2.18 s strike that glided (keycheck 33/34). Now it's 34/34, worst 8.65 c.
Of the ten: 5 rang on their own (left alone, ≥1.2 s), 4 ring-modelled,
A#3 kept as a plain 1.07 s cut (ring fit too loose), and D#4/F#3 carry
the long modelled tails. The keys outside F#3–D#4 are still stretched
up to 12 semitones from the edge samples.

## Filed by the note it played (cycle 31)

The range sweep (cycle 30) showed MusicGen keeps the note name and picks
its own octave. So `build_sfz.py --by-played` files every steady take under
the key it sounds at, pooling runs with `+`, and keeps the steadiest take
per key. Before a pick is final it is played back at its own key; if it
fails, the next take at that key gets a turn (`screen()`).

    build_sfz.py marimba_hit_ab+marimba_hit_bo3+marimba_hit_mid_bo5 \
        --instrument marimba_hit --by-played --trim --audition --loop-mode one_shot \
        --out instruments/by_played
    shape_attacks.py --mode ring --takes <same pool> instruments/by_played/marimba_hit
    build_sfz.py range+violin_bo5 --instrument violin --by-played --trim --audition \
        --out instruments/by_played
    shape_attacks.py --mode bow instruments/by_played/violin

| | before (asked) | after (played) |
|---|---|---|
| marimba, rung | 10 samples · 34 keys · 34/34 | 15 samples · 40 keys · 40/40, worst 1.5 c |
| violin, bowed | 8 samples · 35 keys · 35/35 | 11 samples · 55 keys · 55/55, worst 7.5 c |

Two things learned on the way:

- **Refiling crosses octaves, never note names.** Both violin runs were
  rendered every third semitone from the same start, so every violin take
  is an E, G, A# or C#. The pool can't fill the other eight note names;
  only new renders on those notes can. The marimba middle, rendered every
  semitone, doesn't have this limit.
- **A roll can read an octave above its own strike.** The marimba take
  filed at E4 sounded E4 as a roll and E3 once cut to one hit.
  `holds_pitch()` now refuses a strike that is an octave off, since
  `retune()` only corrects within 60 c; the re-pick found another E4 take
  whose strike really is E4. This also applies to asked-mode builds,
  which were not rebuilt.

Range sweep, refiled (steady takes only; no new renders): piano 8 keys →
8, flute 15 → 16, bass 9 → 10, choir 8 → 9, marimba (roll prompt) 9 → 9.
Refiling helps most where a run has many takes per note.

## Filling the missing note names (cycle 32)

Cycle 31 found the violin pool held only E, G, A# and C#. `fill-names.sh`
renders the other eight: two more every-third-semitone grids (56:79:3 and
57:79:3, G#3–F#5), 3 takes each on the winning arm, then rebuilds by played
note from the whole pool and bows the attacks on.

    bash fill-names.sh violin 3 56:79:3 57:79:3
    # → instruments/by_played_names/violin{,_shaped}

48 takes, about 8 minutes of rendering. 45 steady, 3 texture. Only 14 came
back in the octave asked; 27 were an octave off (12 up, 15 down), 4 near
enough to retune. Filed by played note, the octave misses are not waste —
they land on other keys.

| | cycle 31 | cycle 32 |
|---|---|---|
| violin, bowed | 11 samples · 55 keys · 55/55, worst 7.5 c | 25 samples · 57 keys · 57/57, worst 7.5 c |

Every semitone from A3 to C5 (MIDI 57–72) now has its own sample, no
stretching; F4 and F#4 above that too. The outer zones are unchanged: E2–F3
still stretch one E5-asked take down 13 keys, and C6 up stretches a C5 take.
Some new takes open quietly and the bow cut goes deep (C5 s2 cut in at
1.64 s) — fine for the keycheck, worth an ear.

## The fix carries to the flute (cycle 33)

Same move on a second instrument. The flute had only the range sweep (two
takes on every third semitone, so again just E, G, A# and C#). `fill-names.sh`
now starts from the range sweep alone when an instrument has no best-of-5 run.

    bash fill-names.sh flute 3 56:79:3 57:79:3
    # → instruments/by_played_names/flute{,_shaped}
    # baseline for comparison: instruments/by_played_range/flute{,_shaped}

48 takes: 16 on target, 22 retunable (mostly octave misses: 14 up, 6 down,
1 two down), 10 texture. Filed by played note, the retunable ones land on
other keys.

| | range sweep only | + missing names |
|---|---|---|
| flute, bowed | 11 samples · 58 keys (E2–C#7) · 58/58, worst 6.0 c | 26 samples · 59 keys (D#2–C#7) · 59/59, worst 4.7 c |

From A#3 to C#6 no key is more than one semitone from its own sample (before:
zones up to five keys wide). Deepest bow cut 0.42 s — the flute takes open
cleaner than the violin's. The outer tails still stretch one sample about an
octave each way (D#2–D#3 below, C#6–C#7 above).

Why the violin's low end was left alone: E2–F3 sits below a real violin's
lowest string (G3), and the flute's low tail sits below a real flute (C4).
Rendering real samples there would be asking MusicGen for notes the
instrument cannot play. The honest move is to trim those tails, not fill them.
