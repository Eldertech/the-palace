---
title: Manim CE — Test Plan
born: 2026-05-30
links:
  - { target: "[[Manim CE]]", type: connects-to, label: test-plan-for }
forward_vector: "I hold the test plan for Manim CE; I want every check here runnable with an honest last-run date."
---

# Manim CE — Test Plan

> Phase E rollout. Manim CE is the math-animation Specialist. Phase A already proved the three-tier ladder (`Kuramoto Coupling/two-phasors-uncoupled-{,study,piece}*.mp4`); this plan adds a trivial smoke + a byte-determinism check, and consolidates Phase A's findings into the test record.

Last run: **2026-05-30** — Smoke pass (12 KB MP4 at 480p15 in 1.45 s); **Determinism pass — byte-identical SHA256 `3715c0c5…` across two runs of the same trivial scene** (confirms the entry's strong determinism claim).

## Smoke

```py
from manim import Scene, Text, FadeIn, config, ManimColor
config.background_color = ManimColor("#0a0a0f")
class SmokeScene(Scene):
    def construct(self):
        self.play(FadeIn(Text("shop manim smoke 2026-05-30", font_size=36, color="#e8b84a")), run_time=0.5)
        self.wait(0.2)
```

```sh
manim -ql scene.py SmokeScene
```

- **Automated:** Pass = MP4 produced, ≥ 5 KB, opens in a player.
- **Last run (2026-05-30):** 12 KB MP4 at 480p15, 1.45 s wall-clock, OK.

## Capability Probe

| Capability                                  | Last run                                          |
|----------------------------------------------|----------------------------------------------------|
| ValueTracker-driven animations              | Phase A two-phasor renders (2026-05-30) — OK       |
| `always_redraw` factories (for moving arrows)| `sync-arriving.py` (2026-05-26) — OK              |
| MathTex + LaTeX typesetting                  | Phase A Piece tier (2026-05-30) — OK              |
| `manim-voiceover` Whisper sync               | Kuramoto Round 1 narrated reel (2026-05-26) — OK   |
| Eased FadeIn entrances (`rate_func=smooth`)  | Phase A Piece tier (2026-05-30) — OK              |

- **Last run (2026-05-30):** all five capabilities covered by historical artifacts.

## Style Probe

Manim is fully author-controlled — palette, type stack, easing, footer all flow from the source. The house pattern (resolve from [[Loudon Live Design System]] tokens; named Loudon Live type stack; footer signature) is exercised in the Phase A Piece script. Style Probe = read a Piece-tier source, confirm:

- Colours are token constants (`ACCENT = "#e8b84a"`), not magic literals scattered across the source.
- The locked type stack is named even when system fonts may fall back.
- Footer `Loudon Live · Autodidact Polymaths` is present in any shipped Piece.

- **Last run (2026-05-30):** Phase A `two-phasors-uncoupled-piece.py` passes manual style review.

## Edge Probe

- **Missing LaTeX** (calling `MathTex` without a TeX distribution): raises a `RuntimeError: latex failed but did not produce a log file. Check your LaTeX installation.` — verified during the Phase A basictex install pass.
- **basictex without dvisvgm path bridge** (the cross-tool kpathsea issue): raises *"Your installation does not support converting .dvi files to SVG. Consider updating dvisvgm to at least version 2.4."* — misleading; the actual fix is `TEXPSHEADERS` env (see entry's 2026-05-30 gotcha). Manual probe; mitigation documented.
- **Foreign-updater point mutation** (the 2026-05-26 bug): silent freeze of mutated mobjects; only visible by extracting frames. The fix is `always_redraw(factory)` — documented in entry gotchas.

- **Last run (2026-05-30):** all three exercised at some point (the LaTeX two in Phase A this round; the foreign-updater bug in Kuramoto Round 1).

## Speed Bench

Reference host: **mac** (Python 3.13 pipx, MPS-irrelevant; Manim is CPU-bound + ffmpeg). Same Mac, same 10 s two-phasor content (Phase A tier ladder):

| Tier   | Wall-clock                        |
|--------|------------------------------------|
| Sketch | 5.4 s (-ql 480p15)                 |
| Study  | 11.2 s (-qh 1080p30)               |
| Piece  | 15.9 s warm-cache / 75–90 s cold (LaTeX Metafont gen on first encounter) |

See entry's 2026-05-30 tier-cost gotcha for the full story.

## Determinism (load-bearing — the entry's strongest claim)

The entry says: *"Determinism is the strongest of any specialist's: same `.py` + same Manim version → byte-identical output."*

- **Probe:** render the same trivial scene twice with `-ql`, compare SHA256.
- **Last run (2026-05-30):** both runs hashed to `3715c0c5495e34cb634eb44a2e61265e0d58ba46196197bf9d20f8056214a37f` — byte-identical. Claim confirmed.
- **Reproducibility artifact:** the `.py` source + Manim CE version (0.20.1) + Python version (3.13).
