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

> _Regenerated 2026-09-23T04:36:43.543Z from the board, the steward's runtime, the entry's frontmatter and git. This zone is machine-owned — steer the project in **Standing Orders** below, never here._

- **Status:** active · **Stage:** growing · **Steward:** cycle 19 · last ran 2026-07-01 (84 days ago)
- **Waiting on you:** nothing
- **Ready to advance:** 1 answer filed since the steward last ran — a cycle will consume it
- **Last shipped:** 2026-07-01 (83 days ago) — Cycle 19 shipped the AI-source-probe harness — a matrix runner that renders an (instrument × pitch × adapter × seed) sweep and grades each cell in cents error against librosa's pitch detection. (`gsl-steward-039`)
- **Last commit touching this project:** 2026-09-22 `3b38a86` — ops(Generative Sample Libraries): flush working proofs, renders + code
- **Signal:** steady
- **Drift:** 2 cycles since the entry was last consolidated (cycle 17) — the entry body may lag; this scroll does not.

### Where this stands

Generative Sample Libraries is the chat-driven multisampled-instrument pipeline. Phase 3 opens the door to non-Kokoro sources. Source one shipped (Crystal Hexagonal, 176 regions). Source two shipped (Shepard tone). Your grant on gsl-steward-037 renamed source three: don't crawl a local WAV folder — hand a target instrument and a target pitch to an audio LLM, render, and use librosa to check how close it landed. If the answer is 'close enough,' AI sub-agents become a real GSL source. If it's 'not really,' we learn that in bulk before we sink a batch into a broken assumption.

### Open asks

_None — nothing is waiting on you._

### Answered, not yet consumed

- `gsl-steward-040` — GRANTED — option_id=BOTH-PARALLEL · answered 2026-08-26 — waiting for the next cycle

### Decided

- `gsl-steward-040` — directional_decision → GRANTED — option_id=BOTH-PARALLEL (2026-08-26)
- `gsl-steward-037` — directional_decision → GRANTED — (no option_id); notes: "try to use an audio generating LLM to create a wide range of sounds from a range of instruments, specify the pitch they should play and  test the result against librosa pitch detect. " (2026-06-25)
- `gsl-steward-034` — directional_decision → GRANTED — option_id=SOURCE-THREE (2026-06-25)

<!-- scroll:now:end -->

## Standing Orders

<!-- scroll:orders:start -->
_Loudon's standing direction for this project. The steward reads this zone every cycle before anything else, and it is never regenerated. Taste, priorities, "stop asking me about X", "always prefer Y" — write it once here instead of answering it every cycle._
<!-- scroll:orders:end -->

## The making

<!-- scroll:making:start -->
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
