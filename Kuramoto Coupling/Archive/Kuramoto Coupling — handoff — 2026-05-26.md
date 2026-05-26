---
title: "Kuramoto Coupling — handoff"
born: 2026-05-26
links:
  - target: "[[Kuramoto Coupling]]"
    type: connects-to
    label: "handoff-for"
  - target: "[[The Shop]]"
    type: connects-to
    label: "round-1-continued"
  - target: "[[Maker]]"
    type: connects-to
    label: "directs-the-arc"
forward_vector: "I carry the in-progress move on [[Kuramoto Coupling]] across an instance boundary — Cowork → Claude Code at the palace root — for Round 1's continuation: the Kokoro→Whisper→Manim coordination test and the remaining Specialist sweep. Pick me up, then archive me."
session_thread: "Cowork session 2026-05-26 — reviewed the 2026-05-10 Round 1 work, credited Matplotlib, scoped the two follow-on tracks Loudon chose."
---

# Handoff: Kuramoto Coupling — Round 1 continued (sync test + sweep)

## Move

Continue the Kuramoto Round 1 arc with two tracks: (B) the Kokoro→Whisper→Manim coordination test — the Shop's architecture proof — and (A) first jobs for the remaining sweep Specialists on the same arc.

## Why this move matters

Round 1 so far tested Specialists *in isolation*. Track B is the first test of whether they **compose** — whether the Maker's handoff-gating and the Specialists' Job Contracts actually chain. If a narrated math animation falls out of Maker → Kokoro → Whisper → Manim, the Shop is real; if it snags, we learn exactly which seam fails. Track A fills in the rest of the roster so Round 1 is honestly complete instead of three-of-fourteen. Both run on the same Kuramoto material so the arc stays coherent and everything deposits into one bundle.

## Tried and rejected

- Doing the Midjourney-vs-ComfyUI Comparison now — deferred. ComfyUI gets a *solo* first job in this sweep (Step-3 imagery); the head-to-head waits for a dedicated Comparison track so the taste-calibration gets full attention.
- Forcing RNBO codebox~ smith and VCV Patch Generator into the sweep — they need Max/MSP and VCV Rack installed. Left as stretch: do them only if the host apps are present; otherwise they stay stubs awaiting a real brief.
- Fixing the narration loudness with an ffmpeg `loudnorm` pass on the existing file — rejected in favor of re-rendering at Kokoro Study tier, because that also *verifies the Study tier's normalization actually works* (currently unproven) rather than papering over it downstream.

## Current state

Round 1 delivered (in `Kuramoto Coupling/`): `two-phasors-uncoupled-manim.mp4` (canonical, 854×480/15fps), `two-phasors-uncoupled-matplotlib.mp4` (retained Comparison artifact), `two-phasors-coupling-explorer.html` (p5.js, K_c≈0.220, correct ODE), `speech-rhythm-and-groove-narration.wav` (Kokoro, af_heart).

**Open spec miss**: the narration is **−25.6 LUFS**, ~10 dB under the −16 house standard — it shipped unnormalized. Track B re-renders it correctly.

Specialist entries `alive` with dated gotchas: Manim CE, p5.js, Kokoro, Matplotlib (credited 2026-05-26 for the fallback render). Maker has its first Recipe + the host-capability-check gotcha. Remaining roster awaiting first jobs: ffmpeg, Tone.js, Mermaid, Stable Audio Open, ComfyUI, Remotion, Whisper (Whisper gets covered by Track B), plus stretch RNBO / VCV. Midjourney waits for the Comparison track.

## Next move

Do **Track B first** — it's the architecture proof and it fixes the loudness miss:

1. **Kokoro** re-render the *speech rhythm and groove* paragraph at **Study tier, −16 LUFS, af_heart**. Confirm the Self-Check actually fires `spec_miss` if it lands outside ±0.5 LUFS — that assertion is currently unverified.
2. **Whisper** (first job) transcribes that WAV → word-level timings. Suggest `base` or `small` model for a first run; log which, and the alignment accuracy, into `Shop/Whisper.md`.
3. **Manim** (first Study-tier job) renders a "sync arriving" scene — two-to-N oscillators locking with the order parameter R climbing — synced to the narration via `manim-voiceover`. 36s is well under the ~3-min drift threshold the entry warns about; verify no drift anyway.
4. **Maker** must gate: no Manim render starts until Whisper's timing is back (the resource rule the Maker entry already declares). Confirm the Maker *enforces* this rather than just documenting it. Deliver with a standards report on audio/visual alignment.

Then **Track A**, cheap sandbox-friendly ones first, Mac-GPU ones after:

- **Mermaid** — coupling-regime diagram (K<Kc drift / K≈Kc critical / K>Kc lock), or the asymmetric stubbornness ladder (K_receive 0→∞).
- **Tone.js** — audio coupling explorer (detune + K slider, hear beating slow to lock); pairs with the p5.js visual and tests the entry's own open question about reconciling Tone's musical clock with p5's draw clock.
- **ffmpeg** (first job) — concat the uncoupled Manim clip + a render of the coupling explorer + the Track-B narrated animation into one teaching reel; `loudnorm` any stray audio to −16.
- **ComfyUI** (Mac GPU) — Step-3 image, "fireflies synchronizing over a forest pond at dusk," palace palette, local palette discipline. This is half the deferred Comparison; running it solo gives it a first job.
- **Stable Audio Open** (Mac GPU) — speculative: "the sound of synchronization arriving," ~20s, scattered → coherent. Tests whether it does narrative arc or only texture.
- **Remotion** (Mac/Node) — short titled UI walk through the natural-phenomena cards (fireflies, neurons, jazz bassist, tidal friction).
- **Stretch** — RNBO codebox~ Kuramoto ODE; VCV two-LFO coupling — only if the host apps are installed.

After each job: date gotchas, set `last_tested`, promote stubs → alive, draft a Recipe, and embed inline near the relevant passage in `Kuramoto Coupling.md` per the Enrichment placement protocol.

## Calibrations from this session

- **Mode (b)** still — direct Maker briefs, not the BBS — until recipes accumulate.
- **Install reality**: Manim needs `brew install cairo pkg-config pango` and Python ≤3.13 (3.14 has no wheels). Kokoro needs Python 3.12 (3.13 fails on a blis compile). Carry these forward; they're in the Specialist entries' gotchas now.
- **Whisper model size** is the Manim entry's standing open question (tiny/base/small/medium/large) — this run is where you pick a working default.
- **Commits / FIRST ACTION**: clear stale git locks before anything else — `rm -f .git/HEAD.lock .git/index.lock`. The Cowork session committed the Matplotlib credit (`1acfb79`) but the sandbox couldn't unlink the lock files afterward (macOS-side `.git` permissions), so git is currently wedged: **this handoff file and the Active Handoff edit to `Kuramoto Coupling.md` are written to disk but uncommitted.** After clearing the locks, `git add` + commit them, then proceed. Do all commits Mac-side from now on.
- **Matplotlib is now `alive`** — don't re-stub it; its static-chart Capability Probe (the Bode-plot Forward Vector job) is still the real unexercised test.
- Descriptive flat-bundle filenames; new deposits to the `Kuramoto Coupling/` sibling bundle, never under `Artifacts/`.

## Gotchas to watch

- Does Kokoro's Study-tier −16 LUFS normalization actually land, and does the Self-Check fire on a miss? (The whole reason for re-rendering.)
- Does the Maker *enforce* the Whisper-before-Manim gate, or only describe it?
- `manim-voiceover` drift over the narration length (should be safe at 36s).
- Tone.js mobile audio-context unlock if the explorer is ever promoted past Sketch.

## Load these files first

Tier 1: `Kuramoto Coupling.md`, `Shop/Maker.md`, this handoff.
Tier 2 (Track B): `Shop/Kokoro.md`, `Shop/Whisper.md`, `Shop/Manim CE.md`; the existing `speech-rhythm-and-groove-narration.*` and `two-phasors-uncoupled.py` in the bundle.
Tier 2 (Track A): `Shop/ffmpeg.md`, `Shop/Tone.js.md`, `Shop/Mermaid.md`, `Shop/Stable Audio Open.md`, `Shop/ComfyUI.md`, `Shop/Remotion.md`.
Tier 3: `Enrichment.md` (placement protocol), `SCHEMA.md` §8 (bundle conventions).

## Note to incoming Claude

The broader 8-round battery (Smoke / Tier Calibration / Comparison Mode / Cross-Specialist Coordination / Wrong-Medium Refusal / Gap Briefs / Style Probe / Maker Brief Decoding) lives in the originating Cowork conversation. This handoff carries only Round 1's continuation. Track B is effectively the first Cross-Specialist Coordination test pulled forward; the rest of the battery stays out of scope unless Loudon re-introduces it.

Archive this handoff to `Kuramoto Coupling/Archive/Kuramoto Coupling — handoff — 2026-05-26.md` once you've picked up the move, and remove the "Active Handoff" section from `Kuramoto Coupling.md`.
