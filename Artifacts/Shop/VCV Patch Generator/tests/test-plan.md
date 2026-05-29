# VCV Patch Generator — Test Plan

The probes the Specialist runs to declare a job done. Mirrors the Specialist's Self-Check and the Determinism guarantee. Last run: **2026-05-29** (T7b archetype audition, first Piece-tier job).

## Smoke
Default PDL parses, emits a `.vcv` that is valid JSON, with `module_count > 0`, `cable_count > 0`, zero `skipped` cables, zero `warnings`.
- **Automated:** `verify_t11.js`, `verify_t7a_phase2.js`, `verify_t7b.js` at palace root.

## Capability Probe
Each registry feature emits correctly: numeric `*` params (T7a phase 1), named regions (`CUTOFF = dark`, phase 2), virtual endpoints (`KEYBOARD`/`OUT` auto-bind), and `# archetype:` pragmas (T7b).
- **Automated:** `verify_t7b.js` asserts all 8 archetypes resolve clean and that emitted region values land inside their declared ranges.

## Style Probe (archetype distinctness)
The musical question, which only the ear answers: load three archetype patches and confirm at least three are perceptually distinguishable on first load, no manual knob adjustment.
- **Fixtures:** `recipes/kick-seed-1.{pdl,vcv}`, `recipes/warm_pad-seed-1.{pdl,vcv}`, `recipes/pluck-seed-1.{pdl,vcv}`.
- **Status:** generated and structurally verified; **the Rack audio audition is the open human step** (Mac-side). Success criterion from the project roadmap.

## Edge Probe
Malformed input surfaces as a warning, never a silent drop or crash: unknown module type, unknown archetype name, missing required role, orphan `*` line, non-finite param value, malformed `# archetype` pragma.
- **Automated:** `verify_t7b.js` covers unknown-archetype (with line number) and missing-required-role; `verify_t7a_phase2.js` covers unknown-region and unknown-param.

## Speed Bench
Parse + emit is sub-millisecond at current spec sizes; not a bottleneck. No formal bench until a patch is large enough to matter.

## Determinism (load-bearing)
Same PDL + same registry version + same archetype seed → byte-identical `.vcv`. Any divergence is a versioning/seed bug, not acceptable nondeterminism.
- **Proof:** `tests/determinism.txt` — each audition patch emitted twice in one process and byte-compared. All three byte-identical, zero warnings, zero skipped (2026-05-29).
- The T7b seed path hashes `(seed, archetype, instance, param)` so the position in a region is independent of resolution order — this is what makes determinism hold across runs.
