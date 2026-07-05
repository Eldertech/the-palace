---
title: "Semantic Delay — Phase 1 Plan Review 2026-04-20"
born: 2026-04
links:
  - target: "[[Semantic Delay]]"
    type: deepens
    label: pressure-tests
  - target: "[[Kuramoto Coupling]]"
    type: connects-to
  - target: "[[Dub Lineage]]"
    type: connects-to
  - target: "[[Boundary-Crossing Instruments]]"
    type: connects-to
  - target: "[[Whisper]]"
    type: connects-to
forward_vector: "I exist to keep the Phase 1 build honest. My job is to hold Stage 0's pass/fail number in tension with the model choice, to remember that Mac + VST3 is the current platform and Windows is deferred to product phase, and to stay legible as the research snapshot against which future plan revisions can be compared. When Stage 0 runs, I want to be returned to and either vindicated, corrected, or composted — never left floating untested."
---

# Semantic Delay — Phase 1 Plan Review (2026-04-20)

A pressure test of the Phase 1 plan set in [[Semantic Delay]] on 2026-04-20, scoped to the current platform decision: **Mac + VST3 first, PC deferred to product phase**. Based on a research pass across the 2026 SVC landscape, ML-plugin architecture precedents, flow-matching inference benchmarks, and prior art on semantic audio effects.

## Verdict

**The plan is sound and achievable as written. Ship it.** Four specific adjustments sharpen the near-term build; one missing commitment (Stage 0 pass/fail threshold) should be made before Stage 0 runs, not after.

## What the plan gets right

Every load-bearing external claim in the plan holds up:

- `Soul-AILab/SoulX-Singer` exists on HuggingFace, Apache-2.0 licensed, ~2.6K downloads as of mid-March 2026.
- SVC variant (`model-svc.pt`) released 2026-03-16, as stated.
- The architecture is genuinely flow-matching DiT in the F5-TTS family — the paper at `arxiv.org/abs/2602.07803` is real and explicitly acknowledges F5-TTS as architectural parent. Training corpus: 42,000+ hours, Mandarin/English/Cantonese.
- Small correction worth knowing: the paper is fundamentally an **SVS** paper; SVC is a finetuned sibling. That's *good news* for Phase 2, because the Whisper → LLM → re-sing pipeline wants SVS as the first-class citizen and will inherit the same voice prior.

The two-process split (thin VST + Python inference daemon) is the correct architecture for this model class. It's the de facto standard in adjacent projects — w-okada's RVC voice-changer is the closest shipping precedent and uses exactly this shape (FastAPI + python-socketio + uvicorn in a separate process, clients connect over localhost). The alternatives — [[Neutone SDK]]-style TorchScript-in-process or ONNX-to-C++ — were correctly ruled out: Neutone's `forward(buffer) → buffer` contract assumes streaming sample-rate inference, which a multi-hundred-MB flow-matching sampler with 16–32 NFE cannot provide, and ONNX export of F5-TTS is viable (DakeQQ/F5-TTS-ONNX exists and works) but SoulX-specific export has not been done and would be a real R&D project, not a packaging step.

The phrase-delay framing is also doing quiet architectural work. By calling the delay the effect, the plan sidesteps the fundamental incompatibility of offline flow-matching with a musical note-grid delay. This matches the [[Dub Lineage]] correctly — dub was never about zero latency.

## Model choice: stick with SoulX, A/B only if Stage 0 disappoints

Two models deserve a bake-off, but only as a *fallback* plan if Stage 0 reveals quality or robustness problems with SoulX:

**YingMusic-SVC** (arxiv 2512.04793, `GiantAILab/YingMusic-SVC`, Dec 2025) — the real competitor. Targets robust zero-shot SVC explicitly, uses Flow-GRPO RL post-training, appears to handle accompaniment leakage better than SoulX. If SoulX turns out brittle on real source material, this is the swap. Cost: a small Phase 2 tax (different model family, no guaranteed sibling SVS).

**seed-vc (Plachtaa)** — zero-shot, *genuinely* supports streaming (~300–400 ms algorithmic delay). Worth knowing about for a hypothetical future low-latency variant of Semantic Delay — not Phase 1. File it under "if someone ever asks why this can't be a dotted-eighth delay."

**RVC** deserves its own line because it flips the design: not zero-shot, needs 5–10 min of training data per voice. But that's a valid *alternative framing* for the spirit pantheon — instead of swapping prompt singers inside a zero-shot model, each spirit could be its own trained RVC model derived from a dedicated voice-artist session. The community model bank is vast and the plugins built on RVC sound the most convincing in the wild precisely because they're overfit. Keep this option alive as "Phase 1.5 if the spirits feel generic."

Verdict: **SoulX for Phase 1. Run the A/B against YingMusic and seed-vc only if Stage 0 numbers or listening tests disappoint.** Don't pre-empt.

## The four adjustments

### 1. Commit Stage 0's pass/fail threshold in writing, now

The plan names the Stage 0 measurement ("wall-clock seconds per second of input audio") but does not name the number that splits go/no-go. This is the single most important missing piece. Based on F5-TTS family benchmark record:

For a 4-second phrase, end-to-end (F0 extraction + inference + vocoder + scheduling):
- **RTX 4090 24GB:** ~400–700 ms (RTF 0.1–0.2)
- **RTX 3090 / 4070 12GB:** ~700 ms – 1.2 s (RTF 0.2–0.3)
- **M3 Max MPS 36GB:** ~1.5–3 s (RTF 0.4–0.75)
- **M2 Max MPS:** ~2–4 s (RTF 0.5–1.0)
- **8 GB cards / 16 GB unified memory:** marginal, OOM risk on long phrases

Proposed commitment: **if SoulX on an M3 Max hits worse than RTF 0.75 on a 4-second phrase (i.e., > 3 seconds wall-clock), the Stage 2 playable-instrument feel is in trouble and the A/B bake-off activates before Stage 1.** Write that line into the Semantic Delay plan before running Stage 0, not after.

### 2. Platform scope: Mac + VST3 only for Phase 1

The plan already implies this, but the platform decision should be surfaced as an explicit scope choice, because it deletes a lot of concerns:

- **No Windows work.** Windows Defender Firewall first-launch dialogs, `torchaudio`/`einx`/`x-transformers` version-pinning hell, CUDA driver compatibility — all deferred. Windows returns at product phase with its own Stage.
- **No AUv3.** AUv3's app-extension sandbox blocks arbitrary network/IPC without entitlements. Ship VST3 only. AUv2 is a nice-to-have for Logic users later; AUv3 is the route that needs entitlements and is not worth it for a dev build.
- **VST3 on Mac has no system-enforced sandbox** — individual DAW hosts may sandbox plugins (Ableton's plugin bridge, Bitwig's plugin sandbox), but there is no Apple-level sandbox blocking the plugin from opening a local socket. Unix domain sockets are fine in every host.

This collapses the cross-platform matrix down to: one OS, one GPU backend (MPS), one plugin format. That is the correct Phase 1 scope.

### 3. Unix domain sockets, not TCP

Swap the length-prefixed binary frames from TCP-over-localhost to a **Unix domain socket** (`AF_UNIX` / `SOCK_STREAM`). Same framing, same RPC semantics, but:

- No port-binding collisions when multiple DAWs or multiple plugin instances coexist.
- No firewall / network-entitlement prompts at first run, now or when a future AUv3 or sandboxed host is in play.
- Faster — bypasses the loopback TCP stack.
- Naturally scoped to the current user; the socket lives at a known path under `$XDG_RUNTIME_DIR` or `/tmp/semantic-delay-<uid>/daemon.sock`.

Python `asyncio` handles `AF_UNIX` identically to TCP. JUCE exposes it via `socket(AF_UNIX, ...)` directly or through any IPC wrapper. No API change to the daemon RPC v0.1 — just a different transport under the same framing.

Reserve TCP as a *product-phase* option later (e.g., "power users can run the daemon on a separate GPU box over LAN" — a free feature once the product is shipping).

### 4. Mac development hardware

To get honest Stage 0 numbers and avoid shipping an instrument that only works on the dev rig:

- **Dev rig:** M3 Max with 36 GB+ unified memory. Below that is false optimism.
- **End-user floor:** M-series Pro with ≥24 GB unified memory (M3 Pro 18 GB is technically possible but painful — OS takes 4–6 GB, DAW takes 4–8 GB, model takes ~5–6 GB peak; no headroom). M3 Max / M4 Max 36 GB+ is the honest recommendation.
- **Build Stage 0 on the dev rig, but also smoke-test on the floor** before declaring Stage 1 ready.

MPS will run this model class at roughly 30–60% of equivalent CUDA throughput, and a handful of PyTorch ops still fall back to CPU under MPS in 2026 (causing 2–4× slowdowns on specific paths). Expect to patch 1–2 ops or set `PYTORCH_ENABLE_MPS_FALLBACK=1` during Stage 0. SoulX-Singer specifically has not been explicitly validated on MPS — this is a Stage 0 sub-deliverable: does it actually run on Apple Silicon without patches, and if not, what's the diff?

## Risks worth naming

### Training-data license
Apache-2.0 on the code is clean, but F5-TTS-derived models sometimes bundle checkpoints trained on Emilia (CC-BY-NC in parts). Verify SoulX's checkpoint-specific training-data license in the HuggingFace model card before any commercial plan. This is the single biggest product-phase risk. Non-commercial training data means Phase 1 can ship as research/art but cannot be monetized later without retraining on a permissive corpus.

### Python runtime bundling
At product phase, shipping PyTorch + MPS + the model weights as a bundled Mac app is realistic — expect a 2–3 GB installer for Apple-Silicon-only builds (no CUDA bloat). PyInstaller works. Nuitka is leaner but fragile for PyTorch. For Phase 1 dev builds, option (a) from the plan — user installs daemon separately — is right. Don't front-load the packaging problem.

### Notarization (deferred to product phase)
Ship the daemon as a separate signed helper binary with hardened runtime + `com.apple.security.cs.allow-unsigned-executable-memory` (PyTorch JIT requires it). Do not embed an unsigned binary inside the plugin bundle. Irrelevant for Phase 1 dev builds on the local machine; flag now so the product-phase Stage in a future session knows.

### MPS regressions
Each PyTorch 2.x minor version has changed MPS numerics or broken flow-matching samplers at least once. Pin PyTorch to a known-good version in the daemon's `pyproject.toml` / lockfile from Stage 1. "I'll upgrade later" is how this project loses a week.

## Prior art — what to cite, what to stop worrying about

The specific framing — **[[Whisper]] → [[LLM]] → SVS chained as a phrase-delay primitive with F0 preservation and syllable-constrained lyric generation** — is not something anyone has shipped or published as a paper. Every subcomponent is solved. The delay-effect framing is empty territory. This is Phase 2's positioning, and it is genuine.

Adjacent work worth reading and honestly citing rather than claiming novelty of:

- **Text2FX** (DAFx 2024, Martinez Caceres et al.) — natural-language control of effect parameters. Closest DAFx-legible framing.
- **SingSong** (Donahue et al., Google 2023) — vocal-conditioned generation. Different primitive (generation, not delay).
- **LyricJam** (Vechtomova et al., 2021) — rhythm-matched lyric generation. The academic ancestor of pool-then-select.
- **DiffSinger / VISinger2** — SVS backbones, the family the Phase 2 re-synthesizer sits in.
- **Holly Herndon / Mat Dryhurst — Holly+** (2021) and **xhairymutantx** Whitney commission (2024) — voice-cloning-as-art. Conceptual precedent, not an effect primitive.
- **Hexorcismos (Moisés Horta Valenzuela)** — closest in *spirit* to the trickster-transformation framing. Diasporic voice models; cite directly when naming the spirit pantheon.
- **Edward Large's GrFNN toolbox** and **Anirudh Patel's *Music, Language, and the Brain*** — [[Kuramoto Coupling]] theoretical foundations. Theoretical in their hands; Semantic Delay is the first operationalization I could find that uses Kuramoto coupling as an *LLM-generation constraint* rather than a purely perceptual/analytical model.
- **Diana Deutsch — speech-to-song illusion** — the perceptual grounding for why Huehuecoyotl's mode works at all.

Nearest *products* (offline, song-length, lyric-static; none are realtime phrase-scale delays): RVC covers, Suno Covers, Udio, ACE Studio, Synthesizer V Studio 2, Musicfy, ElevenLabs Voice Design. Their gap — the fact that none of them is an effect primitive in a DAW — is exactly the positioning.

## Proposed updates to Semantic Delay plan

Recommended edits to fold into [[Semantic Delay]] when Loudon chooses:

1. Add a "Platform scope" subsection naming: Mac + VST3 only for Phase 1; Windows + PC deferred to product phase; AUv3 skipped.
2. Add Stage 0 pass/fail threshold: M3 Max must hit RTF ≤ 0.75 on a 4s phrase, else A/B bake-off activates before Stage 1.
3. Change Stage 1 "Local TCP, length-prefixed binary frames" to "Unix domain socket, length-prefixed binary frames."
4. Add a "training-data license check" as a sub-task of Stage 0 — the single biggest product-phase risk.
5. Add the YingMusic-SVC + seed-vc bake-off as a named contingency plan attached to Stage 0's threshold.

These are recommendations, not edits. Left for Loudon to apply when he reads this.

## Research snapshot — what to verify again at Stage 0

- SoulX-Singer SR and parameter count from its `config.yaml` (not surfaced on the HF card in a readable spot; F5-family default is 24 kHz but confirm).
- SoulX checkpoint training-data license (the one ship-blocker).
- Whether SoulX runs on MPS without patches, and if not, what the diff is.
- Cold-load time including Paraformer + Whisper + RMVPE stack (expected 8–15 s on NVMe, Apple Silicon may differ).
- Quality on English vocals specifically — demo page is Mandarin-heavy; English samples exist but are fewer.

---

<!-- CLAUDE → LOUDON: Next natural action is Stage 0 itself. If you want, I can also draft a Stage 0 runbook as a separate entry so the smoke test is reproducible when you come back to it — say when. -->
