---
title: "Kuramoto Coupling — handoff"
born: 2026-05-10
links:
  - target: "[[Kuramoto Coupling]]"
    type: connects-to
    label: "handoff-for"
  - target: "[[The Shop]]"
    type: connects-to
    label: "round-1-target"
  - target: "[[Maker]]"
    type: connects-to
    label: "directs-the-arc"
forward_vector: "I carry the in-progress move on [[Kuramoto Coupling]] across an instance boundary — Cowork → Claude Code at the palace root — waiting to be picked up by the next Claude and archived once the move is caught."
session_thread: "Cowork session 2026-05-10 — Shop Round 1 Sketch arc, Step 1 delivered as Matplotlib fallback because the Cowork sandbox can't host Manim."
---

# Handoff: Kuramoto Coupling — Round 1 Specialist Battery

## Move

Stand up the Shop locally and finish Round 1 of the Specialist battery — the Kuramoto-themed Sketch arc (two phasors → loose coupling syncs → natural-phenomena mirrors). Cowork delivered Step 1 as a Matplotlib fallback; native Manim render and Steps 2–3 happen here.

## Why this move matters

Cowork's Linux-arm64 sandbox can't host Manim (`manimpango` has no aarch64 wheels and needs `libpangocairo-dev` to build, which is sudo-only). That blew open a real question: every Specialist needs to live on Loudon's actual machine if the Shop is going to mean anything in production. Round 1 is now also the install-and-customize-the-local-Shop pass. Each Specialist exercise doubles as a setup exercise; entries get edited to match the install behavior we discover.

## Tried and rejected

- Manim install in Cowork sandbox — `pip install manim --break-system-packages` fails on `manimpango` build (no aarch64 wheel, no sudo for system deps). Routed Step 1 to Matplotlib for sandbox delivery; canonical Manim render deferred to local.
- Editing `Kuramoto Coupling.md` body to embed the Sketch — deferred until Loudon judges whether the Matplotlib fallback IS the Sketch or a placeholder for the Manim render.
- Running through the Enrichment ceremony's BBS card flow — deferred to Mode (a) for later rounds; this calibration round runs as direct Maker briefs (Mode b).

## Current state

Staged in `Kuramoto Coupling/`:

- `two-phasors-uncoupled.mp4` — Matplotlib render. 1272×720, 30fps, 10.03s, 1.5MB. Indigo phasor at 1.00 Hz, amber at 1.07 Hz, both top of frame, sines drawn together below on a shared time axis with color-matched current-sample dots and faint dashed projection lines from each phasor tip down to its sample point.
- `two-phasors-uncoupled.py` — canonical Manim source, ready to render. Same scene, same colors, same layout. Tier: Sketch (`-pql`). Scene class: `TwoPhasorsUncoupled`.
- `two-phasors-uncoupled-matplotlib-fallback.py` — the script that produced the staged MP4. Keep as a real Matplotlib Specialist recipe; not throwaway.
- `two-phasors-uncoupled-frame-5s.png` — verification still at t=5.0s.

Tasks not started: p5.js Sketch (Step 2 — interactive coupling explorer with K slider), Kokoro Sketch (Step 3 — 30s narration of the *speech rhythm and groove coupling* paragraph from the entry), gotcha capture into Specialist entries, Manim entry's Job Contract correction (says `source/<scene_class>.py`; current palace policy is flat bundle with descriptive names).

## Next move

1. `pip install manim` (will work on Mac arm64 — the Cowork failure is sandbox-specific). While installing, read `Shop/Manim CE.md` Capabilities and Tiers sections so you know what the Maker promised.
2. `cd "Kuramoto Coupling" && manim -pql two-phasors-uncoupled.py TwoPhasorsUncoupled` — produces the canonical Sketch render.
3. Compare to `two-phasors-uncoupled.mp4` (the Matplotlib version). Loudon decides which is the Sketch deliverable, or whether both stay (Matplotlib as a comparison artifact).
4. Then proceed to p5.js Sketch (Step 2) — Maker dispatches with the same close-frequency setup (1.00 / 1.07 Hz) plus a K coupling slider; deliverable is a single HTML file in the same bundle. p5.js's entry is a stub — the first job fills it in.
5. Then Kokoro Sketch (Step 3) — narrate the *speech rhythm and groove coupling* paragraph from `Kuramoto Coupling.md`.
6. After all three Sketches: log dated gotchas to each Specialist's Gotchas section, fill `last_tested:` frontmatter, draft Recipes entries from the working briefs, and propose entry-body edits to `Kuramoto Coupling.md` that embed the artifacts inline near the relevant passages (per Enrichment placement protocol).

## Calibrations from this session

- **Mode (b)** — direct Maker briefs in chat, not the Enrichment BBS — for the calibration window. Switch to Mode (a) once recipes accumulate.
- **Pedagogical arc**: 2 phasors → loose coupling, sync → relate to natural phenomena.
- **Round 1 uses real Kuramoto briefs**, not invented test briefs — real briefs surface real gotchas.
- **House-taste choices for Step 1**: frequencies close-but-detectable (1.00/1.07 Hz); stacked layout (phasors share top, sines share bottom on a common time axis); continuous trace drawn rightward; colors indigo `#6366F1` / amber `#F59E0B`; dark background `#0B0B10`.
- **Local-install priority**: Loudon wants tools used regularly to live on his machine and be customized to his needs where appropriate. Each Specialist entry's Resource Footprint and Charter sections should be updated against actual local-install behavior, not hypothesized behavior.
- **Filename / bundle convention**: descriptive filenames at the bundle root; no `proofs/` or `source/` subfolders. New deposits go to the entry's *sibling* bundle (`Kuramoto Coupling/`), not under `Artifacts/`. The Quiz Series files at `Artifacts/Kuramoto Coupling/` are pre-v1.5 and stay where they are.
- **Vocabulary**: "blocking" is wire-level JSON jargon, not natural speech.

## Gotchas to log

1. **`Shop/Manim CE.md`** — Resource Footprint section claims no special setup; reality on aarch64 Linux without sudo is that `manimpango` cannot build (no wheels, requires `libpangocairo-dev`). Add: "On macOS arm64, wheels exist and `pip install manim` works. On Linux arm64 in a sandboxed/no-sudo container, manim cannot install." Date the gotcha to today.
2. **`Shop/Maker.md`** — no documented routing protocol for "chosen Specialist can't host on the current machine." Propose: a `host_capability_check` step in the Job Contract intake that catches this before dispatch, plus a fallback-Specialist field per medium.
3. **`Shop/Manim CE.md`** — Job Contract Output section says source archives to `source/<scene_class>.py`. Current palace policy (per Enrichment v1.5 / *descriptive filenames* feedback) is flat bundle root with descriptive names. Update wording to: `<descriptive-slug>.py` at bundle root.

## Load these files first

Tier 1 (load before doing anything):

- `Kuramoto Coupling.md` — the target hub
- `The Shop.md` — pattern + vocabulary
- `Shop/Maker.md` — Voice, Brief Intake, Selection Heuristics
- `Kuramoto Coupling/two-phasors-uncoupled.py` — Manim source about to render
- `Kuramoto Coupling/two-phasors-uncoupled.mp4` — what's already in the bundle

Tier 2 (load before next Specialist):

- `Shop/Manim CE.md` (gotchas to log here first)
- `Shop/p5.js.md` (Step 2)
- `Shop/Kokoro.md` (Step 3)

Tier 3 (load before deposit):

- `Enrichment.md` — placement protocol for inline references
- `SCHEMA.md` §8 — bundle conventions

## Note to incoming Claude

The bigger arc this Round 1 sits inside — an 8-round Specialist test battery (Smoke / Tier Calibration / Comparison Mode / Cross-Specialist Coordination / Wrong-Medium Refusal / Gap Briefs / Style Probe / Maker Brief Decoding) — lives in the originating Cowork conversation and is not carried by this handoff. Loudon will re-introduce that frame if he wants the bigger battery in scope; this handoff stays focused on Round 1's three Sketches + gotcha capture.

Archive this handoff to `Kuramoto Coupling/Archive/Kuramoto Coupling — handoff — 2026-05-10.md` once you've picked up the move, and remove the "Active Handoff" section from `Kuramoto Coupling.md`.
