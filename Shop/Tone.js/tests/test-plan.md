---
title: test-plan
born: 2026-05-30
links:
  - { target: "[[Tone.js]]", type: connects-to, label: test-plan-for }
forward_vector: "I hold the test plan for Tone.js; I want every check here to be runnable and to record an honest last-run date."
---

# Tone.js — Test Plan

> Phase E rollout. Tone.js is the Shop's browser-deployable music-software Specialist — instruments, sequencers, effects with first-class musical time. Smoke is the same syntax-parse helper used by the data-viz triad; the *audio* side requires a human ear (browser playback) — that's the Specialist's standing seam between what code can verify and what the eye-or-ear settles.

Last run: **2026-05-30** — Smoke pass on the canonical Tone artifact (`Kuramoto Coupling/two-oscillators-coupling-explorer-audio.html`). Audible-correctness check is human-only and was confirmed during the 2026-05-26 Kuramoto Round 1 (lock criterion at K_c = |f_B − f_A|/2 audibly held — drift / pulling-in / lock all distinguishable by ear).

## Smoke

```sh
node --experimental-vm-modules Shop/Maker/web-smoke.mjs "Kuramoto Coupling/two-oscillators-coupling-explorer-audio.html"
```

- **Automated:** as above. Pass = no `SyntaxError`.
- **Last run (2026-05-30):** `smoke: 1 ok, 0 fail (1 inline script)`.

## Capability Probe

| Role                                       | Last run                                                  |
|---------------------------------------------|------------------------------------------------------------|
| Two-oscillator coupling / synthesis        | `Kuramoto Coupling/two-oscillators-coupling-explorer-audio.html` (2026-05-26) — `Tone.Oscillator` × 2 driven by K slider, Analyser-based oscilloscope, OK |
| Musical sequencing                          | not yet exercised in palace work                          |
| Sample playback                             | not yet exercised                                          |

- **Last run (2026-05-30):** one of three exercised by Kuramoto Round 1; the others marked unverified.

## Style Probe

Tone.js renders to the Web Audio API, not pixels — *style* in the audio sense means loudness (target -16 LUFS for streams meant to publish) and timbral choices. The HTML UI around the audio is bound by the standard `palaceTokens()` discipline.

- **Manual:** the existing Kuramoto explorer's palette pre-dates the [[Loudon Live Design System]] (indigo/amber). When the next Tone artifact is built it should resolve via `palaceTokens()`. Same standing decision as the Phase F Kuramoto palette deviation.
- **Last run (2026-05-30):** Style for the canonical artifact is intentionally pre-system; future artifacts inherit the design-system discipline.

## Edge Probe

- **Click-required AudioContext.** Browsers (correctly) suspend the audio context until a user gesture. Tone artifacts must show a "Start audio" affordance and resume the context on click — silent failure otherwise. The Kuramoto explorer does this.
- **CDN drift.** Tone is loaded from `tone@15.0.4` via CDN. Pinned version → drift-safe; a bare `tone@latest` is the failure mode.

- **Last run (2026-05-30):** click-gesture path verified by use; CDN pinning verified in source.

## Speed Bench

Reference host: **mac** (Chrome stable). The Kuramoto two-oscillator explorer runs at audio-rate with the Analyser polling at ~60 Hz; no perceived lag.

## Determinism

Tone.js's audio output is *not* byte-deterministic — Web Audio's internal scheduling has run-to-run jitter, and sample-level output depends on the host's audio hardware. The right reproducibility artifact for a Tone job is the *source code* + the Tone version + a frozen `seed` for any algorithmic content. The audible behaviour reproduces; the bytes don't.

- **Reproducibility artifact:** Tone version (pinned `tone@15.0.4`), source `.html`, any algorithmic seed.
- **Last run (2026-05-30):** Determinism in the byte sense N/A by design. Audible behaviour reproduces by hand (load the file in two browsers, same lock-criterion text, same K_c, same audible drift→pulling-in→lock progression).
