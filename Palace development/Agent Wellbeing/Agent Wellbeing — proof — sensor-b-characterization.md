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

## Phase 5 — cross-model + Opus resident climb (2026-07-08)

Fresh spawn, general-purpose agent, identical floor + tool schemas:

| model | N0 baseline | pad_12k | Δ (content) | vs window (pad_12k) |
|---|--:|--:|--:|--:|
| Haiku (old tokenizer) | 46,241 | 59,427 | 13,186 | 30% of 200K |
| Fable | 61,764 | 80,026 | 18,262 | 8% of 1M |
| Sonnet | 67,169 | 85,657 | 18,488 | 9% of 1M |
| Opus | ~61,000 | 79,950 | ~18,000 | 8% of 1M |

The three current-gen models read identical content at **~18.3K (≈1.39× Haiku)** —
tokenizer generation is the whole story; content cost is model-consistent
*within* a generation. Baseline + content both scale ~1.35–1.45× from the old
(Haiku) to the new (Sonnet/Fable/Opus) tokenizer.

Opus resident climb (the dial's real target — one agent re-addressed):

| address | now carrying | subagent_tokens | vs 1M window |
|---|---|--:|--:|
| 1 | pad_1k | 67,031 | 6.7% |
| 2 | + pad_6k | 74,640 | 7.5% |
| 3 | + pad_12k | 89,106 | 8.9% |

**On Opus the resume increments track novel content cleanly** (+7.6K, +14.5K ≈ the
files read), unlike Haiku's inflated re-count. After ingesting ~19K of documents
across three addresses, the resident is **under 9% full.**

**Headroom conclusion.** On the 1M-window models actually used, the ~62–67K floor
is ~6–7% at spawn and residents climb slowly. **Capacity is rarely the binding
constraint** — a companion would have to ingest *hundreds of K* of tokens to
approach the window. The dial's capacity threshold matters mainly for very
long-lived, heavy-ingestion residents; for ordinary use the *quality* dimension
(deferred) binds first.

## Bottom line

`subagent_tokens` is a **faithful, near-linear, deterministic, per-resume,
output-free proxy for context occupancy** — far better than the "approximate
heuristic" it was retired as. Design constraints (not disqualifiers): it is a raw
count, not a % (divide by the target model's window); the threshold is
model-specific; a fresh agent already reports ~46K (floor + tool schemas); the
semantics are inferred black-box (undocumented) — treat as calibrated-empirical,
re-check periodically.

## Honest limits of this run

- Cross-model (Haiku/Sonnet/Fable/Opus) + the Opus resident climb are now done
  (Phase 5) and confirm the finding on the dial's real target. Remaining gaps:
  resume fidelity is noisier than fresh-spawn (tool_uses crept 1→3 on the Opus
  resident — occasional re-reads); semantics stay inferred black-box.
- Padding was newline-free (Read-cap confound at 24K); a v2 with newlines cleans
  the top of the range.
- **Floor weight, re-assessed:** the auto-loaded floor is ~27K est tokens
  (SCHEMA ~half; ~23% of SCHEMA is archivable change-history). Against the 1M
  windows in use it is ~6–7% at spawn — **not a capacity problem.** The reason to
  trim it, if any, is character clarity and cost-per-call, not headroom. The
  larger under-used load is the ~20K of tool schemas (MCP toolsets a palace agent
  rarely uses) — addressable at dispatch via a leaner agent type, not in canon.
