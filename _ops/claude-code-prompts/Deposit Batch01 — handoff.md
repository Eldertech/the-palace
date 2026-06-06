---
title: "Deposit Batch01 — handoff"
born: 2026-06-05
links:
  - target: "[[Deposit Ceremony]]"
    type: connects-to
    label: "executes"
  - target: "[[README — Deposit Staging]]"
    type: connects-to
    label: "stages-the-batch"
forward_vector: "I carry the in-progress deposit of the Tier 1+2 DSP batch from a Cowork session that could not safely commit, across to Claude Code on the Mac, where the worktree is clean and git works — to be picked up, planted, committed, and archived."
session_thread: "Cowork session 2026-06-05 — adapting Palace-Deposit-Bundle.md into deposits"
---

# Handoff: Deposit Batch01 (Tier 1+2 DSP entries + Tier 3 folds)

## Move

Plant the nine staged Tier 1+2 entries into the palace proper, confirm the three Tier 3 folds already applied to live entries, append the Deposit Archive row, and commit — work a Cowork session staged and verified but could not safely commit because its shell ran in a detached git worktree with a stuck `index.lock`.

## Why this move matters

The substantive work is done — entries are written, schema-reconciled (v1.8), and verified present by direct read. What's left is the part that *needs real git*: moving files to final locations and making a clean commit. Cowork's sandbox is a separate worktree from the working copy (details below), so committing from there risks wedging the repo (the known Cowork-git-lock failure). Claude Code on the Mac is the right surface precisely because it operates on the real working copy with working git.

## Current state

Everything below is **staged, not planted**, and **uncommitted**.

**Staged — `_ops/Deposit Staging/` (9 entries + README, verified present by read):**

- `Dispersion Table.md` — concept → palace root
- `Exponential Decay Curvature.md` — concept → palace root
- `Linear Predictive Coding.md` — concept → palace root
- `Chebyshev is Fourier.md` — concept → palace root
- `Volterra Kernels and the Torus.md` — concept → palace root
- `Phase Reduction.md` — concept → palace root **(see Verification #1 — may fold instead of plant)**
- `Bayesian Granular Synthesizer.md` — project → `Projects/`
- `Rank-N Lattice Analysis.md` — concept → palace root
- `Infeasible DSP Now Shippable.md` — concept (seed) → palace root
- `README — Deposit Staging.md` — the batch index + full reconciliation map. **Read this first; it documents every ghost-vs-existing decision.**
- `_persist_test.md` — stray probe file, **delete it.**

**Tier 3 — already applied to live entries (verify intact, do not re-add):**

- `Parametric Resonance.md` — new "## Where the phase lives" section + frontmatter `connects-to → [[Phase Reduction]]`.
- `Mathieu Equation.md` — new "phase-blind" Open-Question bullet cross-referencing the above.
- `Palace development/Palace Agent Infrastructure Spec.md` — new §0.1.1 (Harness) + §0.5 (Actor Model) + a precedent line in §11.
- Each fold carries a `CLAUDE → LOUDON` HTML comment marking provenance.

## Tried and rejected

- **Committing from Cowork** — rejected. The shell sandbox is a detached worktree on branch `stigmergy-v1.0-weave-flag`; `.git/index.lock` returns "Operation not permitted" and cannot be cleared from there. First write pass landed in the wrong worktree/overlay and the files vanished from the working copy before being re-created. Do not trust a Cowork-side commit for this repo.
- **Standalone entries for Tier 3 #10/#11** — rejected in favor of folding into the Agent Infrastructure Spec (the orchestrator/agent split *is* the harness; the BBS *is* the actor model). Already done.
- **Folding Tier 3 #9 (Creative Coach) and #13 (Centroid)** — rejected: no appropriate existing home. #9 belongs in the separate Coaching vault (`~/Documents/Coaching/`), not the palace; #13 has no Spectral-Analysis entry to attach to. Left undone deliberately — a routing decision for Loudon, not a deposit.
- **Retrieving the interactive artifacts** — impossible from Cowork; they live in past chat conversations. Left as retrieval-note forward vectors in each entry. Not your job unless Loudon opens the source chats for you.

## Next move

1. Read `_ops/Deposit Staging/README — Deposit Staging.md` end to end.
2. Run the four Verification items below.
3. Plant: `git mv` (or move) the eight concept entries to the palace root and `Bayesian Granular Synthesizer.md` to `Projects/`. Strip the `status: staging` framing as needed (concept entries carry no `status`).
4. Append the Deposit Archive row (template in the README), append a row to `_ops/Deposit Archive.md`.
5. Delete `_persist_test.md` and, once the batch is planted, archive or delete the staging README and the empty `_ops/Deposit Staging/` folder.
6. Commit + push.

## Verification owed (do before planting)

1. **Phase Reduction** — confirm the "PRC is a Floquet object / phase-reduction bridges Floquet↔Kuramoto" result is **not** already stated in `Floquet Theory.md` or `Kuramoto Coupling.md`. If it is, fold Phase Reduction's content into one of them and drop the standalone (and update the Bayesian Granular + Parametric Resonance links that point at it).
2. **DSP in Looping Dimensions** — confirm the T³ regime taxonomy lives there; if so, Rank-N Lattice should link to it, not duplicate it (the entry already hedges this).
3. **Ghost scan** — before planting, grep the palace for each "remaining genuine ghost" listed in the README (Wavetable Oscillator, Karplus-Strong, Phase Response Curve, Hopf Fibration, Dynamic Convolution, Hammerstein Model, Bayesian Inference, Eulers Number, The Right Representation Reveals the Symmetry). Wire any that have quietly landed; leave the rest as ghosts.
4. **Hashimoto attribution** — the Harness fold (Spec §0.1.1) attributes the term "harness" to Mitchell Hashimoto, early 2025, unverified. Confirm or soften before commit; the `CLAUDE → LOUDON` comment flags it.

## Receiving environment

**Surface:** Claude Code on the Mac, palace root `/Users/loudonstearns/Documents/The Palace` (the real working copy — not the Cowork sandbox).

**Capability delta vs. Cowork:** you have working filesystem + git on the actual working copy. You can `git mv`, commit, push, and clear locks. Cowork could not.

**Gotchas:**
- The repo is currently on branch `stigmergy-v1.0-weave-flag` with prunable worktrees under `.claude/worktrees/`. **Confirm `git status` / `git branch` first** — make sure you're on the branch Loudon wants these committed to (likely `main`; ask if unsure) and that the staged files are actually present in the working copy. If a worktree switch wiped `_ops/Deposit Staging/`, the full entry text is reconstructable from the Cowork session transcript — ask Loudon to paste it rather than improvising the entries.
- **Stuck lock:** if any git op fails on a lock, `rm -f .git/index.lock .git/HEAD.lock` then retry. This is expected here.
- Suggested commit: `Deposit — Mar–Jun candidate batch (Tier 1+2) — 9 new entries; + Tier 3 folds (Parametric Resonance, Mathieu, Agent Infra Spec)`.

## What NOT to do

- Do **not** re-add the Tier 3 fold content — it's already in the three live entries. Only verify and (if Loudon agrees) resolve the Hashimoto attribution.
- Do **not** create standalone entries for Creative Coach (#9) or Centroid (#13).
- Do **not** invent the interactive artifacts. Leave them as the forward-vector retrieval notes already written.
- Do **not** plant Phase Reduction before Verification #1.

## Calibrations from this session

- The bundle's frontmatter conventions are stale; the README lists every correction (`music→creation`, `technology→tools`, drop `confidence: high` / `status: alive`). The staged files already comply — match them, not the bundle.
- Loudon approved staging-folder workflow + Tier 1+2 scope + Tier 3-fold-where-appropriate. He has **not** yet approved planting into the palace proper — treat planting as needing his go-ahead, or confirm before the final commit.
- Through-line worth preserving in the eventual Weave: nearly every entry is a *dissolution* (two things turning out to be one object, two doorways). The cluster may earn a hub.

## Load these files first

1. `_ops/Deposit Staging/README — Deposit Staging.md` — the batch map + reconciliation decisions.
2. The nine staged entry files in `_ops/Deposit Staging/`.
3. `Palace-Deposit-Bundle.md` (Loudon's uploads) — the original briefs + the source-chat URLs for artifact retrieval, if Loudon wants that done.
4. `Floquet Theory.md` + `Kuramoto Coupling.md` — for Verification #1.
5. `DSP in Looping Dimensions.md` — for Verification #2.
6. `_ops/Deposit Ceremony.md` — the ceremony you're executing.
