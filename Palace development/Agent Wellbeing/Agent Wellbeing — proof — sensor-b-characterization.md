---
title: "Agent Wellbeing — proof — sensor-b-characterization"
born: 2026-07-07
links:
  - target: "[[Agent Wellbeing]]"
    type: connects-to
    label: proof-of
forward_vector: "I am the measured evidence that the one token signal the palace can read is a faithful capacity gauge; I exist so the Concierge health dial is built on data, not assumption, and I am done when the dial is calibrated against me."
---

# Sensor B characterization — the Agent tool's `subagent_tokens` as a capacity gauge

**Date:** 2026-07-07 · **Method:** [[Excellent Adventure|Build Session]] with controlled subagent probes.

**Question.** How faithfully does the Agent tool's returned `subagent_tokens`
track a subagent's true context occupancy? It is the **only** fullness sensor
the [[Concierge]] health dial can use — Loudon stays on the Agent tool, with no
API key, so the authoritative `count_tokens` endpoint (Sensor A) is permanently
unreachable. `subagent_tokens` (Sensor B) is what every dispatch returns.

Padding = a deterministic prose block (BASE ≈ 154 tokens on Haiku's tokenizer)
repeated `reps` times, read once by a probe that then replies "ok". Because each
file is BASE×reps, true fill is exactly linear in `reps` regardless of tokenizer
— we need known *relative* fill, not absolute.

## Phase 2 — fresh spawn, linearity (Haiku)

| condition | reps | subagent_tokens | Δ over N0 |
|---|--:|--:|--:|
| N0 (no read) | 0 | 46,241 | — |
| pad_1k | 5 | 50,187 | 3,946 |
| pad_3k | 16 | 51,881 | 5,640 |
| pad_6k | 33 | 54,499 | 8,258 |
| pad_12k | 65 | 59,427 | 13,186 |
| pad_24k | 130 | 64,655 | 18,414 |

Fit (interior points): **Δ = 3,176 + 154·reps** — predicts pad_1k / 3k / 6k / 12k
to the token (per-block increment is a constant 154.0). 3,176 = fixed per-read
framing overhead. pad_24k falls ~4.8K below the line — a confound in the padding
(newline-free 95 KB block hit a Read cap), not the sensor. **Reads as context
occupancy; near-perfectly linear and deterministic in range.**

## Phase 4 — output contamination (Haiku)

| condition | output | subagent_tokens |
|---|---|--:|
| pad_3k | "ok" (~1 tok) | 51,881 |
| pad_3k | ~700-tok essay | 51,917 |

A full essay added **+36 tokens**. `subagent_tokens` tracks INPUT/context, not
input+output — refuting the [[Palace Agent Infrastructure Spec]] §3.3.1 "combined,
approximate" worry.

## Phase 3 — model lock (Opus anchor)

| model | condition | subagent_tokens | vs window |
|---|---|--:|--:|
| Haiku | pad_12k | 59,427 | ÷ 200K = **30%** |
| Opus | pad_12k | 79,950 | ÷ 1M = **8%** |

Same file, Opus reports **1.35×** Haiku (new tokenizer + heavier system); windows
differ 5×. Identical content = 30%-full on Haiku vs 8%-full on Opus. **Neither
numerator (tokenizer) nor denominator (window) ports — calibrate the dial
threshold on the target model only.**

## Phase 1 — resident readability + climb (Haiku, one agent re-addressed)

| address | now carrying | subagent_tokens |
|---|---|--:|
| 1 | pad_1k | 50,210 |
| 2 | + pad_6k | 71,699 |
| 3 | + pad_12k | 86,162 |

**The number is readable on every resume**, not only at terminal completion →
the dial can watch a LIVE resident. Monotonic climb; per-address increment
exceeds the novel content because resume re-loads the whole transcript — the
reading is honest cumulative occupancy (history is ballast). Noisier than
fresh-spawn.

## Bottom line

`subagent_tokens` is a **faithful, near-linear, deterministic, per-resume,
output-free proxy for context occupancy** — far better than the "approximate
heuristic" it was retired as. Design constraints (not disqualifiers): it is a raw
count, not a % (divide by the target model's window); the threshold is
model-specific; a fresh agent already reports ~46K (floor + tool schemas); the
semantics are inferred black-box (undocumented) — treat as calibrated-empirical,
re-check periodically.

## Honest limits of this run

- Measured Haiku fully + one Opus fresh-spawn point. The **Opus resident-climb**
  (the dial's real target) and **other models** are the next runs.
- Padding was newline-free (Read-cap confound at 24K); a v2 with newlines cleans
  the top of the range.
- The ~46K baseline is the auto-loaded floor + tool schemas — its weight is now a
  live design variable (the floor-load audit).
