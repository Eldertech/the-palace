---
title: "Stigmergy Weave A/B — Findings"
type: meta
pillars:
  - tools
  - practice
  - philosophy
born: 2026-05-29
stage: sprout
status: active
links:
  - target: "[[Swarm Weave]]"
    type: connects-to
    label: evidence-for-phase-2
  - target: "[[BBS Blackboard]]"
    type: connects-to
    label: tested
  - target: "[[Pheromone Trail]]"
    type: connects-to
    label: validated-arm
forward_vector: "I carry the verdict: the pheromone trail earns its place in the Weave; the live peer board does not yet. Re-run me blinded before anyone trusts the magnitude of my effect sizes."
---

# Stigmergy Weave A/B — Findings

Ran 2026-05-29. Three arms × two neighborhoods × five entries = 30 worker subagents
(sonnet), coordinated by this session (opus). No real palace entry was modified.

**The one-line answer:** Stigmergy produced something real but smaller than the
workers themselves claimed. Its useful form is the **cross-cycle pheromone trail**
(directs attention, surfaces oblique links, sharpens link *types*) — not live
intra-cycle peer chat, whose unique value mostly duplicates what the coordinator
already does for free and costs a second full round of workers.

---

## What each arm actually did

### Arm A — Control (no stigmergy)
Stronger than expected. With zero coordination the ten isolated workers produced:

- **4-worker convergence on Threshold Conatus** (Hilaritas, Cooperation Yields
  Agency, Striatum, Tristitia all independently proposed a link to it) — an
  unformalized hub, surfaced purely by aggregating independent reports.
- **Bidirectional Lateral Access ↔ Mixture of Experts** (each proposed the other).
- A **palace-wide latent schema defect**: the non-canonical `confidence` value
  (`foundational` / `emerging` / `demonstrated` vs. canonical
  `hypothesis|working|established`) flagged by 5 workers across *both* neighborhoods
  independently.
- The malformed `[[**Endosymbiosis**]]` wikilink, the Mixture-of-Experts hub
  promotion (11 links), two weak forward vectors, and every core unsung path.

This is the H0 evidence: **convergence does not require a live board.** The
coordinator-synthesis design already detects "many workers point at the same gap"
by counting independent reports.

### Arm B — Live peer board (intra-cycle, two-round)
Every round-2 worker reported a delta; **none used the "NO DELTA" option.** Real value:

- **Bilateral-gap detection (the strongest genuine win).** Workers caught that a
  link was missing in *both* directions — Cooperation↔Tristitia, Striatum↔Spinoza,
  the APO→Prism reciprocal — only by seeing a peer's flag from the other side. A
  solo worker auditing entry X sees "X links to Y, fine"; it takes Y's worker
  saying "X is unlinked from me" to expose the symmetric absence.
- **Type sharpening.** Seeing both ends let workers propose `couples-with` / `mirrors`
  where a solo pass defaulted to `connects-to`.
- **Severity calibration.** Workers upgraded the `confidence` defect from "quirk" to
  "systemic" on seeing peers flag it.

The caveat is large: **several "visible only from the board" bridges were
independently produced in Arm A** (Prism→Lateral Access, LA↔MoE). The workers'
introspection that they "could not have found this alone" is partly false — the
control proves they could. And bilateral-gap detection and severity calibration are
both things the **coordinator already does** when it de-duplicates reports. So Arm B's
*worker-unique* contribution is mostly better link-*typing*, bought at the price of a
second full round of API calls.

### Arm C — Pheromone trail (cross-cycle)
Cleaner and more defensible than Arm B, and nearly free. Each worker read one
`worker_trace` block (a prior cycle's high-signal finding) before auditing. Effects:

- **Attention direction changed reading order, which surfaced buried links.** The
  Hilaritas worker, told to look at Threshold Conatus first, read TC's body and found
  the relationship is a **`couples-with` with substantial bidirectional content**
  ("Hilaritas as Practiced Crossing") — richer than the `connects-to` the control
  worker proposed. It also surfaced a Hilaritas→Lateral Access link it said it "would
  not have entered the audit at all" without the trace.
- **A genuinely net-new oblique link.** The APO worker found the
  →`What Claim Does Scientific Sonification Make?` connection that it judged "would
  very likely have been missed cold" — the target's title is oblique and the
  connection lives in a sub-field, so neither body-scan nor link-audit routes to it.
- **Honest negative signal.** The Lateral Access worker found the trace pointed at a
  gap whose topology had *moved* (the real current gap is Oblique Enrichment, born
  two days earlier) — a "productive false trail," not noise, but a reminder that
  stale traces mislead.
- Several workers correctly noted the trace's "revival" reminder added confirmation
  but no surprise (metadata alone surfaces it).

Crucially, the trace is just injected context at the **start of a normal single-pass
worker** — it does NOT add a round, and it does NOT break the parallelism that
justifies the whole swarm architecture.

---

## Metrics

| Metric | Arm A control | Arm B live board | Arm C pheromone |
|---|---|---|---|
| Unsung paths (deterministic) | baseline | ~same | ~same — **stable, as expected** (sanity check passed) |
| New introductions proposed | ~28 | ~28 + bridges | ~28 + trace-specific |
| Convergent findings (≥2 workers) | **high already** (TC×4, LA↔MoE, confidence×5) | same convergence, re-confirmed | same |
| Findings absent from control (net-new) | — | few (bilateral-triad framing) | **a few real** (Hilaritas↔TC couples-with; Hilaritas→Lateral Access; APO→Sonification) |
| Causal-stigmergy evidence | — | weak (cites peer flags for findings control also had) | **stronger** (read-order → richer type; oblique find) |
| Noise / cost | — | **2× worker rounds; demand-char inflation** | one stale-trace false trail; ~0 extra cost |
| Verdict | strong baseline | DIFFERENT-BUT-MOSTLY-REDUNDANT | USEFUL (attention + type quality) |

Replication held: both neighborhoods showed the same shape — control catches
convergence; Arm C adds attention/type value cleanly; Arm B adds narrow value at 2×
cost.

---

## The methodological confound (read this before trusting magnitudes)

**Not one of twenty stigmergy workers used the "NO DELTA" escape hatch.** The prompts
told workers the board/trace was a meaningful stigmergic signal and asked them to find
its effect — classic demand characteristics. The honest correction is to credit only
deltas that are checkable against the control:

- Discount self-reported "I couldn't have found this alone" — control often did.
- Credit a delta only when it produced (a) a finding *absent* from Arm A, or (b) a
  measurably *better link type* than Arm A.

Under that stricter standard, the real effect is **modest**: a handful of net-new
oblique links (mostly Arm C) and a quality improvement in link-typing (both arms).
Before trusting any effect size, re-run **blinded** — workers not told which arm they
are in, traces/boards presented as ordinary context.

---

## Recommendation

1. **Adopt the pheromone trail in the production Weave (Phase 2 of [[Swarm Weave]]).**
   It delivers most of stigmergy's value — attention direction, oblique-link
   surfacing, sharper link types — at near-zero marginal cost and without breaking
   worker parallelism. The coordinator already writes `worker_trace` blocks at
   cycle end; wire workers to read their own trace at cycle start. **Add a staleness
   guard** (timestamp + "verify before trusting") so moved-topology false trails are
   caught, per the Lateral Access result.

2. **Do NOT yet adopt the live intra-cycle peer board for the Weave.** Its
   worker-unique win (bilateral-gap detection) is better captured cheaply by a
   **coordinator-side bilateral pass**: after collecting independent reports, flag any
   pair where A→B and B→? disagree or where only one direction is proposed. That gets
   Arm B's main benefit with no second worker round. Keep the live board where it
   already earns its keep — **songlines**, where agents are genuinely sequential.

3. **Re-run this experiment blinded** before committing engineering to either, to get
   trustworthy effect sizes.

This confirms, with evidence, the architectural hunch from the start of the
investigation: the board's natural Weave role is *cross-cycle memory*, not *live peer
chat*. The Weave is a parallel fan-out; the pheromone trail respects that, the peer
board fights it.

---

*Artifacts: `plan.md`, `reports/dispatch1-control.md`, `blackboards/*.jsonl`,
`traces/pheromone-traces.md`. Raw round-2 and Arm-C worker reports are in this
session's transcript.*
