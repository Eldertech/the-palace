# p5.js — Test Plan

> Phase E rollout. p5.js is the expressive lens of the data-viz triad. Smoke is a syntax-parse of the artifact's inline JS (Node `vm.Script`, no DOM required). Determinism rests on the shared Mulberry32 seed convention codified in the [[Flocking — Maker's Comparison Recommendation|Flocking shoot-out]].

Last run: **2026-05-30** — Smoke pass on the canonical p5.js artifact (`Flocking/flocking-p5-expressive.html`); informal Determinism verified during the 2026-05-29 Flocking job (Node cross-check against the same Mulberry32 seed 7 model block reproduced the same trajectory).

## Smoke

```sh
node --experimental-vm-modules Artifacts/Shop/web-smoke.mjs Flocking/flocking-p5-expressive.html
```

- **Automated:** the shared `Artifacts/Shop/web-smoke.mjs` helper extracts inline `<script>` blocks and syntax-checks each via Node's `vm` module. Pass = no `SyntaxError` raised, exit 0.
- **Last run (2026-05-30):** `smoke: 1 ok, 0 fail (1 inline script)`.

## Capability Probe

p5.js's two Shop roles, both proven by the Flocking shoot-out:

| Role                                | Last run                                           |
|--------------------------------------|-----------------------------------------------------|
| Expressive generative motion (trails, color-by-velocity) | `flocking-p5-expressive.html` — 80 boids, R climbs 0→0.77, no console errors |
| Parameter explorer (sliders + canvas) | `Kuramoto Coupling/two-phasors-coupling-explorer.html` (Round 1) |

- **Last run (2026-05-30):** Capability covered by historical artifacts; both verified visually.

## Style Probe

p5.js's canvas is fully author-controlled (no Layer-0 to fight). The house-defaults pattern resolves cleanly: read tokens via `palaceTokens()`, never paste a hex. Check the source for any hardcoded `#xxxxxx`:

```sh
grep -E '#[0-9a-fA-F]{3,8}' Flocking/flocking-p5-expressive.html | grep -v 'href\|cdn'
```

- **Manual:** the canvas's colours match the active skin (Strobe variant uses `#ff2a2a`; Graphite the amber `#e8b84a`).
- **Last run (2026-05-30):** the canonical p5 artifact resolves tokens via `palaceTokens()`; the Strobe-skin variant (`flocking-p5-expressive-strobe.html`) renders red trails on black per Strobe.

## Edge Probe

- **`palaceTokens()` returns null** (canonical CSS not linked): p5 sketch must fail loud, not render with browser default colours. The artifact does this via an `assert(tokens)` at sketch top.
- **Window resize**: sketch must not crash; for fixed-size canvases this is N/A. Manual probe.

- **Last run (2026-05-30):** edge probes not formally exercised this round.

## Speed Bench

Reference host: **mac** (Chrome stable).

| Job                              | Frame budget       |
|-----------------------------------|---------------------|
| Flocking p5 expressive, 80 boids  | < 4 ms/frame (240 fps headroom) |
| Two-phasor coupling explorer      | < 2 ms/frame        |

Browser-side; the Specialist's render is not the bottleneck for any Shop brief sized in the dozens-of-agents range.

## Determinism (load-bearing where applicable)

For seeded sims (Flocking), the discipline is the *shared, byte-identical model block* — the rendering layer is non-deterministic in pixel detail (anti-aliasing varies by browser version) but the *trajectory* is identical across the three triad Specialists when run with the same Mulberry32 seed.

- **Reproducibility artifact:** the seed + the model block source (a string match against the canonical model in `Flocking/flocking-d3-interactive-control.html` is the test).
- **Last run (2026-05-30):** informal 2026-05-29 — Node cross-check against the D3 and Plot Specimens at seed 7 produced identical (x, y, θ) sequences for the first 300 frames. The shared model block discipline holds.
