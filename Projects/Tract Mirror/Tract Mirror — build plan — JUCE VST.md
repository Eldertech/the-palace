---
title: Tract Mirror — build plan — JUCE VST
born: 2026-06-09
links:
  - target: "[[Tract Mirror]]"
    type: connects-to
    label: child-of
forward_vector: "I hold the resumable build state for the Tract Mirror VST so that any session — after any pause — can pick up the chain at the exact link where it stopped; I am done when the plugin is verified inside Ableton Live and I become a build log."
---

# Tract Mirror — Build Plan (JUCE VST)

Commissioned 2026-06-09. Loudon's brief: complete monophonic LPC voice-synthesizer VST demonstrating
the LPC <-> waveguide `mirrors` relationship, GUI showing all cylindrical waveguide segments in 3D,
with interactive artifacts / mockups / audio examples / images / short clips generated along the way.
Final link in the chain: the working plugin inside Ableton Live.

## Decisions locked (Loudon, 2026-06-09)

1. **Framework:** JUCE 8 + WebView GUI (three.js renders the 3D tract).
2. **Target DAW:** Ableton Live 12 (VST3 + AU, macOS arm64).
3. **Voice source v1:** built-in vowel morph tables (a e i o u schwa), XY morph; analysis engine deferred to v2.

Working name: **Tract Mirror** (plugin: "Tract Mirror", company "Loudon Live", codes Loud/Trkm). Renameable.

## Single source of truth

`reference/vowels.json` — 64-point physical area functions per vowel + end reflections + losses.
Python reference, web artifacts, and C++ engine all resample this to N(fs) sections and derive
k_i = (A_i - A_{i+1}) / (A_i + A_{i+1}). Never interpolate k directly; interpolate areas in log domain.

## Phase chain

- [x] **Phase 1a — Python DSP reference** (`reference/`): DONE 2026-06-09. All six vowels under 1%
      formant error at 44.1k AND 48k (gate was 5/5/10%). Three independent verifications of the
      lattice==tube identity (state-matrix eigenvalues, Levinson step-up + freqz, impulse FFT).
      See reference/REPORT.md for the C++ porting warnings — read before Phase 3a.
- [x] **Phase 1b — JUCE 8 scaffold** (`plugin/`): DONE 2026-06-09. JUCE pinned 8.0.12 via FetchContent,
      VST3 + AU + Standalone build clean (~50 s cold). Rebuild:
      `cmake --build build --config Release -j$(sysctl -n hw.logicalcpu)` from plugin/.
      NOTE: ad-hoc codesign on VST3 post-build is expected (no Developer ID on this machine).
- [x] **Phase 2a — "The Mirror" artifact**: DONE 2026-06-09. `artifacts/the-mirror/index.html` (90 KB,
      single file): AudioWorklet KL engine (ScriptProcessor fallback tested), XY pad, synced tube +
      lattice views with identical k values, equations in both symbol + worded form, review surface ON
      (`?review=off` to ship clean). JS k vector verified identical to Python reference.
- [x] **Phase 2b — Demo clips**: DONE 2026-06-09. `renders/clips/`: clip_tube_morph.mp4 (10 s),
      clip_scattering_junction.mp4 (14 s), clip_glottal_source.mp4 (14 s); 1080p30 h264+aac, captioned
      for silent comprehension; synth audio is the soundtrack. NOTE: no voiceover — these are component
      demos, not lesson videos; add Kokoro narration if Loudon wants them teachable standalone.
- [x] **Phase 2c — GUI prototype**: DONE 2026-06-09. `plugin/gui/index.html` (694 KB self-contained:
      three.js r128 UMD + OrbitControls + JUCE 8 frontend + vowels.json all inlined). Mock mode verified
      in browser: zero console errors, all 21 interior k values match hand computation to 4 decimals,
      MIRROR lattice panel, energy animation, sliders live. Screenshot: renders/gui-prototype.png.
- [x] **Phase 3a — C++ DSP port**: DONE 2026-06-09. TractEngine + full APVTS + sample-accurate mono MIDI
      + seqlock viz publisher + TractMirrorRender harness. Gate GREEN: engine tract IR recovers
      canonical formants to 0.00% (all six vowels, 48 kHz). Read the agent's deviations in the build
      log below. Editor is GenericAudioProcessorEditor until 3b.
- [x] **Phase 3b — WebView editor**: DONE 2026-06-09. PluginEditor.{h,cpp}: 11 WebSliderRelays bound to
      APVTS, resource provider serving BinaryData index.html, noteEvent native fn -> 64-slot SPSC FIFO
      drained in processBlock, 30 Hz tractFrame emit per INTERFACE.md §3. gui/index.html needed ZERO
      changes — the contract held. createEditor() is JUCE_WEB_BROWSER-guarded (harness builds with it off).
- [x] **Phase 3c — Validation**: DONE 2026-06-09. pluginval strictness 5 PASS and 8 PASS (fuzz + editor
      stress); auval aumu Trkm Loud: AU VALIDATION SUCCEEDED; DSP regression gate re-run: 0.00% all six
      vowels. INSTALLED: ~/Library/Audio/Plug-Ins/VST3/Tract Mirror.vst3 +
      ~/Library/Audio/Plug-Ins/Components/Tract Mirror.component. Standalone launches + quits cleanly;
      screenshot blocked by Screen Recording permission (not faked).
- [ ] **Phase 4 — Ship + verify in Live**: install to ~/Library/Audio/Plug-Ins, load in Ableton Live 12,
      MIDI in -> sound out, GUI renders; screenshot proof.

## Directory layout (bundle)

    Projects/Tract Mirror/
      Tract Mirror — build plan — JUCE VST.md   <- this file (update phase checkboxes as they land)
      reference/        Python reference, vowels.json, REPORT.md, renders/ (wav + png)
      renders/clips/    short mp4 demos
      artifacts/        interactive HTML artifacts (design system)
      plugin/           JUCE CMake project (build/ gitignored), gui/ = WebView assets

## Verification gates

1. Vowel fits within tolerance (F1/F2 +-5%, F3 +-10%) at 44.1k AND 48k — Phase 1a REPORT.md table.
2. Plugin offline render harness produces formants matching the Python reference.
3. pluginval strictness >= 5 passes; auval passes.
4. Ableton Live 12: instantiates, monophonic MIDI plays, 3D GUI live, no audio dropouts.

## Resume protocol (for paused sessions)

Read this file, check the phase boxes, read `reference/REPORT.md` if it exists, then continue the
first unchecked phase. Sub-agent reports and workflow scripts live under the session dir; the palace
bundle holds everything durable. Git commits at each phase boundary carry the archive.

## Build log

- 2026-06-09 — Project entry + bundle created; Phase 1 (reference + scaffold) launched as parallel
  opus/sonnet agents.
- 2026-06-09 — Phase 1 complete, all gates green (see checkboxes). First audio + image deliverables
  sent to Loudon. pluginval installed to /Applications.
- 2026-06-09 — `plugin/INTERFACE.md` written: the binding DSP<->GUI contract (params, vowel-space
  Shepard blend math, tractFrame event schema, relay binding, mock mode). Phases 2a/2b/2c/3a
  launched as FOUR parallel agents (Mirror artifact, clips, GUI prototype, C++ DSP port) with
  disjoint file ownership: src/+CMakeLists vs gui/ vs artifacts/ vs renders/clips/.
