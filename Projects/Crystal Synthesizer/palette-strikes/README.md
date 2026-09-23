# Palette Strikes — the five middle minerals

Rendered cycle 10 (2026-09-15) on Loudon's FILL-PALETTE grant (`resp-mqszz12v-vj1akr`).

Cycle 8 rendered the two poles of the symmetry arc — diamond (cubic) and labradorite
(triclinic) — in `../triclinic-proof/`. This folder fills the middle: **ruby, amethyst,
fluorite, emerald, topaz**, plus a `palette_tour.wav` that plays all seven struck
minerals back to back in symmetry order.

The controlled-experiment rule: `additive_strike()` in `render_palette.py` is copied
**verbatim** from `../triclinic-proof/render_labradorite.py` — same 80 ms attack, same
per-partial decay shortening, same 0.70 amplitude roll-off, same deterministic phase
seeds, same A2 (110 Hz) root. The only variable across all seven renders is the phonon
ratio table, taken straight from `../Crystal Sonification Reference.md`. Do not "improve"
the engine here; improving it breaks the comparison the proofs rest on.

Obsidian is the eighth entry in the reference but is amorphous — it has a vibrational
density of states, not discrete modes — so it is not a struck additive render. It needs a
noise-band approach and is still unbuilt.

## What the measurements said

| crystal | space group | partials | span | octaves | centroid (Hz) |
|---|---|---|---|---|---|
| Diamond | cubic Fd-3m | 5 | 1.65× | 0.72 | 142 |
| Fluorite | cubic Fm-3m | 6 | 2.48× | 1.31 | 146 |
| Emerald | hexagonal P6/mcc | 7 | 3.33× | 1.74 | 159 |
| Ruby | trigonal R-3c | 7 | 1.98× | 0.99 | 130 |
| Amethyst | trigonal P3₁21 | 9 | 8.32× | 3.06 | 241 |
| Topaz | orthorhombic Pbnm | 8 | 6.05× | 2.60 | 213 |
| Labradorite | triclinic C-1 | 8 | 17.50× | 4.13 | 400 |

Brightness does **not** climb monotonically as symmetry drops. Ruby is the darkest sound
in the palette — darker than cubic diamond — because all seven of its modes sit inside
r_n 1.98. Log-span predicts centroid at r = 0.94; partial count manages only r = 0.60.
Symmetry sets the span; the span sets the brightness; chemistry can override the symmetry
class case by case (diamond and fluorite are both cubic and sound nothing alike).

The ruby doublet is the clean confirmation: 1.10 and 1.14 over A2 are 121.0 and 125.4 Hz,
beating at 4.4 Hz — a slow natural chorus, exactly what the trigonal hypothesis predicted.

## Not done

Nobody has listened yet. The centroid figure is a computed brightness proxy, not an ear.
