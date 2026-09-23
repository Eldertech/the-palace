---
title: "Generative Sample Libraries — scroll"
born: 2026-09-23
links:
  - target: "[[Generative Sample Libraries]]"
    type: connects-to
    label: scroll-for
forward_vector: "I am Generative Sample Libraries's scroll — the one page that always opens on where the project stands now, then reads down through everything it has made, newest first. My top is regenerated from the board and the palace whenever anyone looks; my standing orders are Loudon's and never regenerated; my trail only ever grows."
---

# Generative Sample Libraries — scroll

> The project's front door. **Now** is regenerated on every look; **Standing Orders** are Loudon's; **The making** is the trail, newest first. Rendered in [[STIGMERGY]]'s PROJECTS deck; the entry [[Generative Sample Libraries]] stays the considered truth and this is the live one. See [[The Scroll]].

<!-- scroll:now:start -->
## Now

> _Regenerated 2026-09-23T05:23:03.000Z from the board, the steward's runtime, the entry's frontmatter and git. This zone is machine-owned — steer the project in **Standing Orders** below, never here._

- **Status:** active · **Stage:** growing · **Steward:** cycle 21 · last ran 2026-09-23 (today)
- **Waiting on you:** nothing
- **Ready to advance:** no unread answers
- **Last shipped:** 2026-09-23 (today) — The pitch test now ends in a playable instrument. The Crystal reference built from it plays every key in tune, 59 of 59. (`gsl-steward-044`)
- **Last commit touching this project:** 2026-09-23 `27c6d2d` — steward(Generative Sample Libraries): pilot cycle 20 — the BOTH-PARALLEL probe, built to the edge of the weights
- **Signal:** steady
- **Drift:** 4 cycles since the entry was last consolidated (cycle 17) — the entry body may lag; this scroll does not.

### Where this stands

Generative Sample Libraries turns a conversation into a playable sampled instrument. Two non-speech instruments have shipped: Crystal (176 samples) and Shepard-tone. Source three is your June idea: ask an audio AI model for a specific note on a specific instrument, then measure whether it played that note. In August you chose BOTH-PARALLEL, so Stable Audio and MusicGen are tested head to head. Last cycle built that test and checked the grader on real audio; on the Mac it is one command. This cycle added the step after grading. For each instrument it takes the best take of each note, maps it to the pitch it actually sounds at, fixes the tuning, and writes an SFZ you can load in sforzando. I…

### Open asks

_None — nothing is waiting on you._

### Answered, not yet consumed

_None._

### Decided

- `gsl-steward-040` — directional_decision → GRANTED — option_id=BOTH-PARALLEL (2026-08-26)
- `gsl-steward-037` — directional_decision → GRANTED — (no option_id); notes: "try to use an audio generating LLM to create a wide range of sounds from a range of instruments, specify the pitch they should play and  test the result against librosa pitch detect. " (2026-06-25)
- `gsl-steward-034` — directional_decision → GRANTED — option_id=SOURCE-THREE (2026-06-25)

<!-- scroll:now:end -->

## Standing Orders

<!-- scroll:orders:start -->
Written by Claude on Loudon's behalf, 2026-09-23, from his answers this session — not new taste, just what already stands:

- Your 2026-08-26 grant on gsl-steward-040 is BOTH-PARALLEL: wire both Stable Audio Open and MusicGen into the probe and compare head-to-head in one report. That answer was filed and never consumed; consume it now.
- This container has no Shop (no local audio models, no GPU). The Mac has them. So: build everything that does not need the model weights — the two real adapters as code, the comparison report generator, the acceptance thresholds — against the mock adapter, and leave the Mac exactly one command to run. Do not ask which model to wire; the grant already said both.
- Prefer a runnable harness over a longer plan.
<!-- scroll:orders:end -->

## The making

<!-- scroll:making:start -->
<!-- scroll:entry id="gsl-steward-044" -->
### 2026-09-23 — cycle 21 — The pitch test now ends in a playable instrument. The Crystal reference built from it plays every key in tune, 59 of 59.
> shipped · graded run → SFZ builder proven on the Crystal arm · nothing waiting on you · steward leans RUN-ON-MAC

What I built: [build_sfz.py](obsidian://open?vault=The%20Palace&file=Projects/Generative%20Sample%20Libraries/ai-source-probe/build_sfz.py). For every instrument row in a graded run it does four things.

1. It keeps only takes that hold a steady pitch. A sampler can fix a wrong note but can't fix a wandering one.
2. It picks the best take per note: on target first, then the octave nearest the one we asked for, then the steadiest.
3. It places each sample by the pitch it actually sounds at, not the note we asked for. A take that came out an octave high goes in an octave high, retuned.
4. It splits the keys between samples at the midpoint, and lets the outer samples reach at most 12 semitones past their own pitch. Wider gaps stay silent and are named in the file, not papered over.

Piano and marimba ring out after you let go of the key. Bowed, blown and sung notes stop when you let go.

The proof is the Crystal reference instrument ([open in sforzando](open:Projects/Generative Sample Libraries/ai-source-probe/instruments/crystal/reference/crystal_reference.sfz)): 4 samples covering A1 to G6. To check it, I read the regions back out of the written file and played every key through a small sampler that uses the same pitch rule as an SFZ player (equation below). Then I graded each key against its own pitch with the same grader the probe uses. Result: 59 of 59 keys on target, worst 1.75 cents, including the full 12-semitone stretches at both ends. The audition is a rising line across the keyboard.

The Crystal renders never miss, so they can't test the part that matters most for AI models: fixing a wrong note. I ran the builder on the simulated-flaws test set as well (built to scratch space, not kept). It has takes 30 to 50 cents off and takes an octave out. All six instruments built, and every mapped key played on target, worst 1.53 cents. The simulated bass came out mostly an octave low and was mapped an octave low, in tune. The simulated violin had no steady C4, so it has a reported two-key hole (F4 to F#4). Then I zeroed one region's tune value by hand: exactly that zone's 16 keys failed, each 31 cents sharp. So the check can fail.

The Mac command ([DESIGN.md](obsidian://open?vault=The%20Palace&file=Projects/Generative%20Sample%20Libraries/ai-source-probe/DESIGN.md)) now ends by building an instrument per model arm, with the key check and an audition, and rebuilds the Crystal reference there too. It is still one line, and your standing order is met as written: nothing here needed the model weights.

**Artifacts:**
- [the Crystal reference played as a rising line across A1–G6, through the builder's own sampler](Projects/Generative Sample Libraries/ai-source-probe/instruments/crystal/reference/audition.wav)
- [the instrument: 4 regions, keycenter and tune from measured pitch, rings out (one_shot)](Projects/Generative Sample Libraries/ai-source-probe/instruments/crystal/reference/crystal_reference.sfz)
- [every key played and graded: 59 of 59 on target, worst 1.75 cents](Projects/Generative Sample Libraries/ai-source-probe/instruments/crystal/reference/keycheck.json)
- [which take was kept per note, which were passed over, and why](Projects/Generative Sample Libraries/ai-source-probe/instruments/crystal/reference/picks.json)
- [one-line summary per instrument built from the crystal arm](Projects/Generative Sample Libraries/ai-source-probe/instruments/crystal/build.json)
- [sample · A2 zone (the crystal arm's 'piano' row: it plays the crystal on every row)](Projects/Generative Sample Libraries/ai-source-probe/instruments/crystal/reference/samples/piano_A2_s2.wav)
- [sample · E3 zone](Projects/Generative Sample Libraries/ai-source-probe/instruments/crystal/reference/samples/piano_E3_s2.wav)
- [sample · C4 zone](Projects/Generative Sample Libraries/ai-source-probe/instruments/crystal/reference/samples/piano_C4_s2.wav)
- [sample · G5 zone](Projects/Generative Sample Libraries/ai-source-probe/instruments/crystal/reference/samples/piano_G5_s2.wav)
- [the builder: graded run → SFZ per instrument, with --check and --audition](Projects/Generative Sample Libraries/ai-source-probe/build_sfz.py)
- [the one Mac command, now ending in instruments per model arm plus the Crystal reference rebuilt](Projects/Generative Sample Libraries/ai-source-probe/run-on-mac.sh)
- [design notes: new section 'From graded run to instrument', and what was checked](Projects/Generative Sample Libraries/ai-source-probe/DESIGN.md)

_Crystal reference · every key played and graded_
| sample (asked for) | keys | stretch, semitones | worst key | worst error |
| --- | --- | --- | --- | --- |
| A2 | A1–C3 (16) | −12 to +3 | C#2 | 0.97¢ |
| E3 | C#3–G#3 (8) | −3 to +4 | F3 | 0.46¢ |
| C4 | A3–A4 (13) | −3 to +9 | G4 | −0.54¢ |
| G5 | A#4–G6 (22) | −9 to +12 | A#4 | 1.75¢ |

_Left rough:_ Nobody has loaded the SFZ in a real player or listened to the audition yet. My check covers the pitch arithmetic, not how sforzando sounds. WAVs are gitignored in this project (.gitignore:53), so git will carry the .sfz but not its samples until the Mac command rebuilds them. The Crystal build used the hard strike on all four notes (tie broken on steadiness), so the soft layer and the second take never became velocity layers or round-robins. The samples have no loop points, so a held note stops when the render ends. The onset trim is now copied into three scripts.

_Next moves named:_ On the Mac: run the one command in DESIGN.md. It renders both models, grades them, writes the head-to-head page, and builds a playable SFZ for every model and instrument, plus the Crystal reference with its samples. · Load crystal_reference.sfz in sforzando and listen to the 12-semitone stretches at A1 and G6. That is the part my check can't hear. · Once there is a winning model: run the prompt-shape test (note name vs Hz vs 'middle C') on it, and use the second take as a velocity layer or round-robin instead of discarding it. · Fold cycles 18–21 into the home entry's footer (it last consolidated at cycle 17) and pull the onset trim into one shared responsive_onset.py.
<sub>`gsl-steward-044` · BROADCAST on GENERAL</sub>
<!-- /scroll:entry -->

<!-- scroll:entry id="gsl-steward-042" -->
### 2026-09-23 — cycle 20 — The Stable Audio vs MusicGen pitch test is built and checked against the Crystal instrument. On the Mac it's one command.
> shipped · harness ready, no model has run yet · steward leans run it --quick first

I followed your BOTH-PARALLEL answer and the standing orders, and didn't re-ask which model. Here is what I built.

Four ways of asking for each note, run side by side. (1) Stable Audio, with the pitch written into the prompt. (2) MusicGen, with the same prompt plus a sine wave at the target pitch as a melody guide. (3) MusicGen with the prompt only, no guide. Same model as (2), so the difference between them measures the guide itself. (4) The Crystal instrument as a known-good reference. Every model hears the same prompt, so the test compares models, not wording. Each gets 6 instruments × 4 notes × 2 seeds = 48 renders.

I changed the test notes. Cycle 19 used four A's. That can't tell a model that follows the pitch from one that just happens to like A. The notes are now A2, E3, C4 and G5, covering the same range.

I changed the grader too, and this is the part I'd most like you to push on. A sampler can fix a wrong note: `pitch_keycenter` and `tune` remap a sample that's steady but 40 cents flat, or even an octave off. It can't fix a note that wanders. So each render now gets one of three grades: on target, retunable (steady but off) or texture (not steady). Every steady render comes with the SFZ values it would need. The old accuracy numbers are unchanged. Steadiness is new, and it has to pass before accuracy counts.

How I checked the grader. A deliberately flawed simulated source (detuned, octave-off, vibrato, melody, noise): all 48 cells got the grade their flaw should earn, under both pitch trackers. The Crystal instrument: 48 of 48 on target, worst 1.85 cents. Checking against the Crystal also caught a bug in my own first draft. The step I added for exact pitch read the Crystal up to 22 cents flat, because its bell-like partials pulled the measurement off. The other three methods agreed within 2 cents. Harmonic test tones would never have caught that. I replaced the step, and DESIGN.md records why.

One prediction the run can prove wrong: MusicGen's melody guide carries the note name but not the octave. So guided MusicGen should hit the right note more often than the right octave. The report counts octave slips separately so you can see whether that's what happens.

**Artifacts:**
- [the side-by-side report, run on the Crystal and the simulated source. The Mac run writes compare.html in the same format.](Projects/Generative Sample Libraries/ai-source-probe/compare.dry-run.html)
- [the one command: builds its environments on first run, renders all four arms, grades, opens the report. --quick does 8 cells per arm.](Projects/Generative Sample Libraries/ai-source-probe/run-on-mac.sh)
- [the brief as it stands: arms, notes, grade rule, what is checked and what is not.](Projects/Generative Sample Libraries/ai-source-probe/DESIGN.md)
- [the grader: pitch tracked frame by frame, three grades, SFZ keycenter and tune for each steady render.](Projects/Generative Sample Libraries/ai-source-probe/verify.py)
- [builds the side-by-side report page and compare.json.](Projects/Generative Sample Libraries/ai-source-probe/compare.py)
- [renders or grades one arm; the two steps are split so each model can render in its own environment.](Projects/Generative Sample Libraries/ai-source-probe/probe.py)
- [the test grid and pass thresholds: notes now A2 / E3 / C4 / G5, steadiness thresholds added.](Projects/Generative Sample Libraries/ai-source-probe/matrix.json)
- [Stable Audio 3, hardened: passes steps / cfg / seed only if the model accepts them, and always seeds torch.](Projects/Generative Sample Libraries/ai-source-probe/adapters/stable_audio.py)
- [MusicGen-melody, shared by the guided and unguided arms.](Projects/Generative Sample Libraries/ai-source-probe/adapters/musicgen.py)
- [arm: prompt + sine melody guide.](Projects/Generative Sample Libraries/ai-source-probe/adapters/musicgen_melody.py)
- [arm: prompt only, the control.](Projects/Generative Sample Libraries/ai-source-probe/adapters/musicgen_text.py)
- [reference arm: the shipped Crystal instrument through its own approved code.](Projects/Generative Sample Libraries/ai-source-probe/adapters/crystal.py)
- [simulated flawed source, used only to test the grader.](Projects/Generative Sample Libraries/ai-source-probe/adapters/mock_flawed.py)
- [simulated perfect tone, the grader's best case.](Projects/Generative Sample Libraries/ai-source-probe/adapters/mock.py)
- [the shared prompt and a WAV writer that needs only numpy.](Projects/Generative Sample Libraries/ai-source-probe/adapters/_common.py)
- [the test-run verdicts in machine-readable form.](Projects/Generative Sample Libraries/ai-source-probe/compare.dry-run.json)
- [per-cell grades for the Crystal reference.](Projects/Generative Sample Libraries/ai-source-probe/results.crystal.jsonl)
- [per-cell grades for the simulated source.](Projects/Generative Sample Libraries/ai-source-probe/results.mock_flawed.jsonl)
- [render log for the Crystal reference.](Projects/Generative Sample Libraries/ai-source-probe/renders.crystal.jsonl)
- [render log for the simulated source, including which flaw each cell drew.](Projects/Generative Sample Libraries/ai-source-probe/renders.mock_flawed.jsonl)

_Test run of the grader: the Crystal instrument and a simulated flawed source, 48 cells each (no AI models in this table)_
| source | on target | retunable | texture | verdict | median \|cents\| (steady cells) |
| --- | --- | --- | --- | --- | --- |
| crystal (real palace audio) | 48 | 0 | 0 | ON TARGET | 0.6 |
| mock_flawed (simulated) | 18 | 14 | 16 | TEXTURE ONLY | 5.0 |

_Left rough:_ Neither model has run anywhere. I couldn't install torch here, so the MusicGen adapter follows the documented API but has never executed. Stable Audio's load-and-generate call is proven by the Kuramoto beds script, but its steps, cfg and seed options aren't. The grader is only checked on synthetic tones and the Crystal, never on real acoustic or AI audio, and whether its steadiness thresholds match what your ear calls steady is untested. The first Mac run downloads several GB of MusicGen weights, and those weights are non-commercial (CC-BY-NC), so nothing sampled from MusicGen can be sold. The test-run report has no audio players, because those WAVs were rendered in scratch space, not the bundle. I deleted cycle 19's report.mock.html and results.mock.jsonl; this report replaces them.

_Next moves named:_ On the Mac, run the one command with --quick first (8 cells per arm, a few minutes plus the one-time download), then the full run. compare.html opens when it finishes. · Next cycle, build the step that turns a graded run into a playable SFZ: pick the best seed per note, apply the keycenter and tune values, and write the instrument, so a winning model is one step from something you can play. · Once there's a winner, test prompt wording on it: note name (C4) vs frequency (261.63 Hz) vs description (middle C).
<sub>`gsl-steward-042` · BROADCAST on GENERAL</sub>
<!-- /scroll:entry -->

<!-- scroll:entry id="gsl-steward-039" -->
### 2026-07-01 — cycle 19 — Cycle 19 shipped the AI-source-probe harness — a matrix runner that renders an (instrument × pitch × adapter × seed) sweep and grades each cell in cents error against librosa's pitch detection.
> shipped · harness + 48-cell mock smoke test · Stable Audio Open adapter left stubbed pending your model pick

Catch-up — Generative Sample Libraries is the chat-driven multisampled-instrument pipeline. Phase 3 opens the door to non-Kokoro sources. Source one shipped (Crystal Hexagonal, 176 regions). Source two shipped (Shepard tone). Your grant on gsl-steward-037 renamed source three: don't crawl a local WAV folder — hand a target instrument and a target pitch to an audio LLM, render, and use librosa to check how close it landed. If the answer is 'close enough,' AI sub-agents become a real GSL source. If it's 'not really,' we learn that in bulk before we sink a batch into a broken assumption.

What shipped — Projects/Generative Sample Libraries/ai-source-probe/. A tiny four-file harness: probe.py is the matrix runner, verify.py is the pitch checker (librosa.pyin when available, autocorr fallback so it runs today), adapters/mock.py is a sine generator that proves the pipeline, adapters/stable_audio.py is a stub with the SA3 prompt template already written but the model entrypoint left un-wired for you to greenlight. The matrix is 6 instruments (piano · violin · marimba · flute · bass · choir) × 4 pitches (A2 · A3 · A4 · A5) × 2 seeds — 48 cells per adapter. Acceptance rule (informed by Talking Keyboard): |cents_err| ≤ 20 on ≥ 75% of cells, voiced ≥ 60%.

Smoke test — I ran the mock adapter end-to-end (~5 seconds, 48 sine renders). All 48 cells graded usable; median cents error was −0.4¢ at A2 and +3.9¢ at A3/A4/A5 (autocorr lag quantization at sr=44100, which real pyin will resolve). Pipeline is exercised end-to-end. Report at ai-source-probe/report.mock.html.

What I did NOT do — I did not run the SA3 adapter, because (a) SA3's Python entrypoint on this Mac is not obviously discoverable and (b) which audio LLM to commit the ~8 minutes of GPU sweep time to is a fork you should own. That's gsl-steward-040. The probe is designed so a real render is one adapter-file away.

**Artifacts:**
- [the design brief — matrix, acceptance rule, adapter roster, open sub-experiments.](Projects/Generative Sample Libraries/ai-source-probe/DESIGN.md)
- [matrix runner (48 cells) — writes results.jsonl + report.html per adapter.](Projects/Generative Sample Libraries/ai-source-probe/probe.py)
- [librosa.pyin pitch check, cents-space aggregation, autocorr fallback.](Projects/Generative Sample Libraries/ai-source-probe/verify.py)
- [SA3 adapter — prompt template written, model entrypoint left un-wired for cycle 20.](Projects/Generative Sample Libraries/ai-source-probe/adapters/stable_audio.py)
- [the sweep — 6 instruments × 4 A-note pitches × 2 seeds.](Projects/Generative Sample Libraries/ai-source-probe/matrix.json)
- [mock adapter smoke-test report — 48/48 usable, ~4¢ ceiling from autocorr quantization.](Projects/Generative Sample Libraries/ai-source-probe/report.mock.html)
<sub>`gsl-steward-039` · BROADCAST on GENERAL</sub>
<!-- /scroll:entry -->

<!-- scroll:entry id="gsl-steward-037" -->
### 2026-06-25 — cycle 18 — Which WAV folder should I point the source-three scaffold at to validate?
> scaffold shipped · no validation run yet · lean FIELD-RECORDINGS if you have any handy

Catch-up: GSL Phase 3 is sourcing audio from multiple non-Kokoro origins to validate the Interview skill enough to promote it from project-local (_ops/sample-libraries/skills/interview/) to user-skill space (/skills/sample-library-interview/). Crystal and Shepard are sources one and two. The source-three scaffold (librosa pitch detect → keyboard map → SFZ) is now on disk, but it needs a real folder of pitched WAVs to validate. Tradeoffs: a field-recordings or instrument-samples folder is the truest test of the pitch-detect-and-map path; a palace project bundle is convenient but most palace WAVs are already labeled (Crystal/Shepard) so they exercise the mapping less; you can also defer and let me synthesize a test folder myself, but that loses the 'real user material' contract source three exists to prove. Reply non-blocking — I am not parked.

**Artifacts:**
- [Generative Sample Libraries — icon.png](Projects/Generative Sample Libraries/Generative Sample Libraries — icon.png)
- [Generative Sample Libraries — hero.png](Projects/Generative Sample Libraries/Generative Sample Libraries — hero.png)
<sub>`gsl-steward-037` · RESOURCE_REQUEST on TRICKSTER</sub>
<!-- /scroll:entry -->

<!-- scroll:entry id="gsl-steward-036" -->
### 2026-06-25 — cycle 18 — Source three scaffold shipped — local WAV folder adapter

Catch-up: GSL is a chat-driven sample-instrument generator. Phase 3 (multi-source) is in progress — Crystal Hexagonal and Shepard-tone already shipped as sources one and two. Source three is the simplest external case: a folder of WAVs the user already has, mapped onto the keyboard by detected pitch.

Shipped this cycle: a scaffold under _ops/sample-libraries/local-wav-folder/. generate.py uses librosa's pYIN (voiced-frame median) to detect each file's pitch, maps onto MIDI by nearest-neighbor with split-the-difference hikey/lokey boundaries, applies the responsive-onset trim convention from phoneme-choir (−45 dBFS detect, 2 ms cushion, 3 ms ampeg_attack), and writes an SFZ + a JSON mapping report. `--audition` mode keeps one file per octave so the Phase 2 audition-before-batch gate runs here too.

What I couldn't verify this cycle: the scaffold has not been run against a real folder — no .wav material on disk to point it at. Asking Loudon next message which folder to validate against; that pick unblocks both the source-three render and the Interview-skill promotion (gated since cycle 9 on one non-Kokoro, non-palace-synthesis source).

**Artifacts:**
- [the scaffold — librosa pyin + nearest-MIDI mapping + onset-trim + SFZ writer.](_ops/sample-libraries/local-wav-folder/generate.py)
- [build notes; what carries forward; what still needs Loudon.](_ops/sample-libraries/local-wav-folder/BUILD.md)
<sub>`gsl-steward-036` · BROADCAST on GENERAL</sub>
<!-- /scroll:entry -->
<!-- scroll:making:end -->
