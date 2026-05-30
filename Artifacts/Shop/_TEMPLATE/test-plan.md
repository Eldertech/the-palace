# {{Specialist}} — Test Plan

> Canonical Shop test-plan template, abstracted from the VCV Patch Generator plan — the first Specialist to prove the pattern (run + determinism proof, 2026-05-29). Copy this to `Artifacts/Shop/{{Specialist}}/tests/test-plan.md`, fill each probe with something concrete for *this* tool, and replace the `(TODO)` reference in the Specialist entry's Test Suite line with a real path. **Rule: a new Specialist gets a one-smoke-test stub, never a `(TODO)`.** The probes mirror the Specialist's Self-Check and its Determinism guarantee.

Last run: **never (stub)** — replace with the ISO date and a one-line result the first time any probe runs.

## Smoke
The cheapest "did it produce anything valid at all" check. One command, one pass/fail. Define the minimal valid output for this tool (a file that parses, a render with non-zero pixels, an audio file at the right sample rate, a canvas that draws past `setup()`).
- **Automated:** `{{script-or-command}}` — or **Manual:** the one thing a human confirms by eye/ear.

## Capability Probe
Does each feature the entry claims actually emit correctly? Walk the Capabilities section of the Specialist entry and assert one concrete output per claim. This is the probe that catches "the docs say it can, but it can't here."
- **Automated / Manual:** `{{...}}`

## Style Probe
Does the output honor the resolved design-system values the Maker passed in the Job Contract? Palette tokens present (no hardcoded hex), type stack correct, footer signature, no emoji / no CDN icon library. For tools with a strong Layer-0 (Observable Plot), confirm the house-defaults wrapper pushed the locked grammar into the generated surface. The musical/aesthetic half is the part only the eye or ear answers — name the human step explicitly.
- **Automated / Manual:** `{{...}}`

## Edge Probe
Malformed or hostile input surfaces as a *warning*, never a silent drop or a crash. Enumerate this tool's failure modes (bad param, missing input, unsupported feature, oversized job) and confirm each fails loud.
- **Automated / Manual:** `{{...}}`

## Speed Bench
Wall-clock for each tier (Sketch / Study / Piece) on the reference host. Not a gate until a job is large enough to matter — but record the numbers so the Maker's tradeoff conversation ("a Sketch in ten minutes, a Piece tomorrow") is grounded in measured time, not a guess.
- **Reference host:** {{mac | sandbox}}. **Numbers:** `{{...}}`

## Determinism (load-bearing where it applies)
Same input + same tool version + same seed → byte-identical (or perceptually identical) output. For deterministic tools (code generators, seeded sims) this is a byte-compare and any divergence is a bug. For non-deterministic generative tools (Midjourney, Stable Audio, ComfyUI without fixed seed) state that plainly and define the *reproducibility artifact* instead (the workflow JSON, the seed, the prompt) that lets a future run get close.
- **Proof / reproducibility artifact:** `{{path}}`
