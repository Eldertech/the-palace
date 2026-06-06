# Phase 9 (v0.3 Phase 3) — Final Sweep — Visual Checklist

Screenshots: `screenshots/phase-9-v0.3/{general-artifacts,iframe-artifact,flags,trickster}.png`.

`OVERALL: pass` only if every item passes. Each item: pass/fail + one sentence.

## Rich content (general-artifacts.png, iframe-artifact.png)
1. The single-image enrichment card renders its image fully, framed in a square dim-green phosphor card with a dim uppercase monospace label.
2. The multi-artifact card stacks image → audio → iframe, each framed and labelled, each with a legible dim caption.
3. The HTML artifact renders a live, non-blank sim inside its bordered iframe.
4. The `enrichment` tag and the page-title `from:` handle (`@Kuramoto Coupling`) are present; nothing reads as an invented agent id.
5. No rounded corners, no emoji, color stays reserved (near-monochrome green; cyan only as accent/handle, amber only for flags).

## Regression — board views unchanged (flags.png, trickster.png)
6. The FLAGS board still renders message rows in the established treatment (amber accents on FLAG type, red borders on warning-flagged rows) — the artifact work did not disturb non-artifact rendering.
7. The TRICKSTER inbox still renders with its pending-request disposition UI intact.
8. The bottom command bar and channel tabs render normally on both boards.
9. The CRT phosphor identity (green on black, soft bloom, monospace) is coherent across all four screenshots — the terminal still looks like one 1988 display, not a page with a widget bolted on.
