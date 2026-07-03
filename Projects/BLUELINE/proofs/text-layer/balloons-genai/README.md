# Balloon × gen-AI — four interaction modes (bench, 2026-07-01)

Crossing the balloon catalog (`balloon_lib.py`) with the Lettering specialist's gen-AI
pipeline (`render_text.py`). Two exemplars — **fury** ("NO", shout-spiky) and **fading**
("stay", whisper). Each mode is a different answer to *what does the gen-AI touch?*

| mode | what gen-AI touches | boundary rule | verdict |
|---|---|---|---|
| **A · styled-box** | the container (a material) | text crisp inside | works; keep material subtle for legibility |
| **B · escape** | the word (material register) | overflows the bubble | strong with radial/high-contrast material (fury); busy materials (woodgrain) muddy it |
| **C · clip** | the word | clipped to interior | clean, legible, "contained energy" reads |
| **D · mind-window** | the interior scene (atmosphere) | windowed | **the standout** — inner weather as subtext behind crisp words |

## What we learned
- **D (mind-window) opens the most new territory.** Storm=fury, dawn=fading: the interior
  atmosphere carries the emotion *behind* the words. The balloon becomes a frame-within-a-frame
  — its own stacked sub-scene, which wants its own depth (2.5D) and could open into true 3D.
- **Legibility:** crisp black text over a *lightened* material (A) and white-text-with-dark-halo
  over an atmosphere (D) both read cleanly. B/C reuse the inverted on-black ink renders.
- **Two orthogonal knobs** confirmed: *what gen-AI touches* (box · text · interior-scene) ×
  *the boundary rule* (contained · escaping · windowed).

## Known limits / next
- The interaction compositor strokes a **solid** outline — it does not yet honor the balloon's
  own stroke style (whisper should be dashed, loud double). Fidelity fix.
- **B (escape)** would read stronger if the word *tears the outline* where it breaches, not just
  overflows it. And a **D+escape hybrid** — inner weather spilling past the rim — is the natural
  "emotion overwhelming containment" beat.
- **C could be native:** generate the material register *canny-locked to the balloon shape* (via
  ControlNet) so the energy respects the bubble at generation time, not by post-clip.
- **D wants depth:** the window atmosphere as a real stacked sub-scene with parallax, and the
  break-the-stack beat where it opens into 3D.

## Files
`<exemplar>_<mode>.png` (8 composites) · `gen/` (the 4 generated materials + atmospheres,
cached) · `montage.png` · `contact.html` · harness: `../balloon_genai.py`.
