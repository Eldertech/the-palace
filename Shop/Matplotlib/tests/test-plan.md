# Matplotlib — Test Plan

> Phase E rollout. Matplotlib is the Shop's static-chart specialist and Manim CE's standing fallback for sandboxed hosts. Smoke is one `plt.savefig`. The load-bearing probe is **byte-deterministic** output — same code + same data + same matplotlib version → same PNG, which is what makes Matplotlib a usable Manim fallback (the swap is reproducible).

Last run: **2026-05-30** — Smoke + Determinism both pass (byte-identical SHA256 across two runs of the same script).

## Smoke

```py
import matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
fig, ax = plt.subplots(figsize=(4,3), dpi=100)
ax.plot(np.linspace(0, 10, 400), np.sin(np.linspace(0, 10, 400)), color='#e8b84a')
fig.savefig('/tmp/mpl-smoke.png', format='png')
```

- **Automated:** as above. Pass = PNG exists, ≥ 5 KB, opens in any viewer.
- **Last run (2026-05-30):** PNG produced, ~12 KB, OK.

## Capability Probe

Matplotlib's three Shop jobs:

| Job                                   | Last run                                                  |
|----------------------------------------|------------------------------------------------------------|
| Static math frame (Manim fallback)    | Kuramoto two-phasors-uncoupled-matplotlib (2026-05-10) — OK |
| Phase / parameter diagram             | not exercised this round — claim unverified                 |
| Multi-panel publication chart         | not exercised this round — claim unverified                 |

- **Last run (2026-05-30):** one of three exercised by historical artifact; the others marked unverified.

## Style Probe

Matplotlib is **strongly opinionated** — Layer-0 typography, padding, color scheme are baked in. The Maker's house-defaults pattern (the Plot wrapper at `_ops/loudon-live/design-system/palace-plot-defaults.js`) does NOT yet exist for Matplotlib. Manual style application is per-job and *not enforced*. The Style Probe for Matplotlib is therefore a degenerate "did you pass `color=` through to every artist" check; a real Matplotlib style wrapper is a forward-vector item, not a test item, until built.

- **Manual** check: the PNG's main color matches the resolved palette token (`#e8b84a` Graphite-skin accent). Eye check.
- **Last run (2026-05-30):** smoke PNG plotted in `#e8b84a`; line visible, color correct. No house-defaults wrapper to test against yet.

## Edge Probe

- **Mismatched x/y lengths:** `plt.plot([1,2,3], [4,5])` → raises `ValueError: x and y must have same first dimension`. ✓
- **Invalid color string:** `color='asparagus'` → raises `ValueError: Invalid RGBA argument`. ✓
- **NaN in data:** silently skips NaN segments — *quiet*, by Matplotlib design. Not a probe; noted here so the operator doesn't trust a chart of NaN-corrupted data.

- **Last run (2026-05-30):** not formally exercised this pass; behaviours follow Matplotlib's documented contract.

## Speed Bench

Reference host: **mac**. The Smoke PNG (400-sample sin) renders in **~80 ms** including font cache miss; sub-10 ms with cache warm. Static charts are never the bottleneck.

## Determinism (load-bearing)

Matplotlib's default `savefig` embeds the current date in PNG metadata (`Software`, `CreationTime`). Strip it with `metadata={'Software': ''}` (or pass `metadata={}` for stricter behaviour) to get byte-identical output across runs.

- **Reproducibility artifact:** the Python source `.py` + the matplotlib version + the data array (or its hash).
- **Last run (2026-05-30):** two runs of the smoke script with metadata-stripped savefig both hashed to `4f46b0a932d71320...` — byte-identical.
