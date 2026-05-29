---
title: "Artifacts → Projects Migration — handoff"
type: meta
pillars:
  - tools
  - practice
born: 2026-05-28
stage: seed
status: active
links:
  - target: "[[Palace Audit — 2026-05-28]]"
    type: emerged-from
    label: last-open-audit-item
  - target: "[[Palace To-Do]]"
    type: connects-to
    label: queued-from
forward_vector: "I carry the one audit task too big to rush at the tail of a marathon session. Execute me in fresh context, per-entry, verifying as I go — a half-finished sweep is worse than none. When Artifacts holds only shared assets and every reference resolves, I compost."
---

# Artifacts → Projects Migration — handoff

**For a fresh Claude with clean context.** Loudon wants the loose `Artifacts/<Entry>/` artifact dirs folded into their entry's bundle. The 2026-05-28 audit deferred this because, on inspection, it's bigger and more collision-prone than first scoped — and rushing it risks breaking HTML interactives or overwriting files. Do it carefully, per-entry, verifying each before moving on.

## Goal & principle
Fold each per-entry artifact directory under `Artifacts/<Entry>/` into that entry's bundle, so the entry is self-describing and ceremonies can see its artifacts. `Artifacts/` should end up holding only genuinely shared/cross-entry assets. **Add a new entry only when creating new original content or connections** (Loudon's standing rule) — this pass is a *move*, not an authoring pass.

## Destination rule (per entry)
- Entry lives in `Projects/<Entry>.md` → bundle is `Projects/<Entry>/` (often already exists — see collisions).
- Entry lives at root `<Entry>.md` → bundle is `<Entry>/` at root (e.g. `Logarithmic Interface Scaling/`, `Kuramoto Coupling/` already exist as root bundles).
- Match by entry title (Obsidian resolves by filename; `Ohms Law/` → `Ohm's Law.md`, etc. — confirm each).

## EXCLUDE — these `Artifacts/` subdirs are NOT per-entry bundles; leave them
- `Artifacts/Images/` — shared image assets (governed by [[Image Embedding Standard]]).
- `Artifacts/Tools/` — tool guides (e.g. GEMMA4_GUIDE); not an entry's artifacts.
- `Artifacts/4 Pillars Framework/` — holds LIVE entries (Bridges, People, Weekly Themes, Interview Subjects). Do not touch.
- `Artifacts/Full Claude conversation backup/` — a backup, not artifacts.

## COLLISIONS — `Projects/<Entry>/` already exists with content. Merge, never overwrite.
Action Potential Oscillator, Crystal Synthesizer, Floquet Time-Modulated Loops, Piano String Inharmonicity, Quantum Synthesizer, Retrospective Delay, Shepard Tone Synthesizer, Shimmer Cloud. For each: `ls` both sides first; if a filename exists in both, inspect — keep the canonical one, don't clobber. Floquet is the worst (Artifacts side has BUILD_SUMMARY/NOTES/RNBO/audio/interactives/python/static; Projects side has its own — likely a pre-bundle duplicate, so dedupe rather than blind-merge).

## Per-entry procedure
1. `ls -R "Artifacts/<Entry>/"` and `ls "Projects/<Entry>/"` (or root bundle). Note collisions.
2. `git mv` files into the bundle **preserving internal relative structure** — HTML interactives reference `charts/`, `audio/`, `images/` relatively; move the whole unit together so those don't break.
3. Update EVERY external reference (see inventory). `grep -rn "Artifacts/<Entry>" . --include="*.md"` before and after.
4. Give moved `.md` files minimal bundle frontmatter + a `connects-to [[<Entry>]]` link with label `child-of` (SCHEMA §8 / the ratified convention).
5. Verify: open any moved `.html` interactive in a browser to confirm its relative assets still resolve; re-grep to confirm 0 stale `Artifacts/<Entry>/` references remain.
6. Commit per-entry (or per small group), so a crash can't strand a half-migration.

## Reference inventory (update these; re-grep to find more)
- **Action Potential Oscillator**: `neuron_oscillator.html` (×6 refs), `neural_oscillator_dev_plan.md` (×2), `nerve-impulse-waveform-annotated.png` (×1) — referenced from the AP Oscillator entry body. Dest `Projects/Action Potential Oscillator/`.
- **Crystal Synthesizer**: `session-1-interactive.html`, `charts/`, `audio/`, `images/`, `Crystal Sonification Reference.md`. Dest `Projects/Crystal Synthesizer/`.
- **Floquet**: `static/05_strutt_diagram.png` (referenced from Mathieu Equation!), `RNBO/mathieu_resonator.codebox`, BUILD_SUMMARY/NOTES. Dest `Projects/Floquet Time-Modulated Loops/`.
- **Kuramoto Coupling**: quiz series + answer key + `kuramoto-phase-portrait-two-oscillators.svg`. Dest `Kuramoto Coupling/` (root bundle).
- **Logarithmic Interface Scaling**: `logarithmic_scaling_guide.md`, `log_slider_python_pseudocode.md`. Dest `Logarithmic Interface Scaling/` (create root bundle).
- Then sweep the remaining per-entry dirs: Loudon Live, Meadows and Music, Oblique Harvest, Oblique Portrait Method, Ohms Law, Portamento Physical Modeling, Wavetable Torus, Shepard Tone Synthesizer, Piano String Inharmonicity, Quantum Synthesizer — same procedure.

## Gotchas
- The map-builder scripts (`_ops/swarm/build-map-*.py`) list `Artifacts` in `EXCLUDE_DIRS` and `Projects` in `NODE_DIRS`. Bundle content has no `.md` *entry* nodes, so moving is fine — but once `Artifacts/` is mostly empty, the next map build's `EXCLUDE_DIRS` Artifacts entry can be revisited.
- `git mv` only moves tracked files; handle untracked `__pycache__`/build junk with plain `rm` (regenerable) — don't commit caches.
- This is a *move*, not a shorten or rewrite. Don't edit artifact content.

## Done-when
`Artifacts/` holds only the excluded shared/category dirs; `grep -rn "Artifacts/<any-entry>" . --include="*.md"` returns 0 stale references; every moved interactive still opens correctly.
