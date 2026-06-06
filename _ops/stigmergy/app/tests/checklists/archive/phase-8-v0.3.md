# Phase 8 (v0.3 Phase 2) — Inline Render — Visual Checklist

Screenshots: `screenshots/phase-8-v0.3/general-artifacts.png`, `screenshots/phase-8-v0.3/iframe-artifact.png`.

The visual-validator returns `OVERALL: pass` only if every item below passes. Each item: pass/fail + one sentence of justification.

## Artifact frame (BBS aesthetic)
1. Each artifact sits in a single-weight phosphor frame (`1px solid` dim-green), **no rounded corners** anywhere.
2. The frame background is the deep-phosphor card tone, distinct from the page black but not bright.
3. A dim, uppercase, monospace label sits above each artifact: `<type> · <filename>` (e.g. `image · fireflies-pond.png`). It does not glow.
4. No emoji anywhere. No cyan used as a fill. Color stays reserved (the board remains near-monochrome green).

## Image artifact
5. The image renders fully and is legible (not broken, not zero-height).
6. The image is width-constrained to the card (no horizontal overflow past the message row).

## Audio artifact
7. A working audio control strip renders (browser-default controls are accepted for v0.3).
8. The audio control spans the card width and does not break the phosphor frame.

## Iframe (HTML) artifact
9. The HTML artifact renders inside a bordered iframe with visible content (the interactive sim/explorer is showing, not a blank/error frame).
10. The iframe is contained within the message row — it does not bleed over the roster sidebar or the page edge.

## Captions + identity
11. Each artifact in the multi-artifact card shows its caption beneath it, dim and legible, wrapped (not overflowing).
12. The enrichment card shows a small `enrichment` tag beside the message type, and the `from:` handle reads as a page title (`@Kuramoto Coupling`), not an invented agent id.

## Coherence
13. The artifact cards read as part of the same terminal as the surrounding messages — same font, same green, same grammar. Nothing looks pasted in from a different design language.
