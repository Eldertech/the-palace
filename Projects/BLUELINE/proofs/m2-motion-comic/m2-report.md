# BLUELINE M2 — Motion Comic (report)

**Date:** 2026-06-17 · in the `feature/blueline-m2` worktree · [[BLUELINE — Production Plan]] M2, the third
production rung (still the cheap *staging* side — no render-AI; the field moves in the **comic** register,
ahead of the board→layout→render seams).
**Question:** can the held inked panels of M1 *move* — limited, beat-locked motion inside a held shot —
without breaking the determinism that makes BLUELINE an instrument, and without disturbing the staging
vocabulary that is conditioning substrate?

## Answer — yes, verified

`m2-motion-comic.html` plays the same 8-shot r4ng3r storyboard as M1, but each held panel now **breathes,
parallaxes, and runs its flow field** — and every motion is a *pure function of the song playhead*, so the
piece stays an instrument, not a video. Verified in-browser (served from the worktree, no console errors):

- **Determinism is provable, not asserted.** `drawFrame(F)` is a pure function of the frame `F`:
  rendering the same frame twice gives **pixel-identical** output (`toDataURL` equal); rendering a different
  frame **differs**. The motion phase is `F / frames_per_beat` (beats), so the image at any beat position is
  reproducible — an offline render is `for each integer F: drawFrame(F)`, and live playback is the same
  function sampled smoothly. The determinism HUD reads `12 frames/beat · deterministic ✓ · on whole frame ✓`.
- **The continuous playhead.** The clock still arrives as discrete beats; M2 holds the exact frame at the
  last beat and **interpolates** between beats at the true fps via `requestAnimationFrame`, **resnapping to
  the exact frame on every beat** (bounded drift, exact on the beat). Verified live: under self-play the
  playhead read `241.20` just past beat-frame `240`, and `495.34` just past `495` — smooth between, exact on.
- **Three motions, all beat-locked:**
  - **The flow field moves** (the headline) — on flow shots the speed-lines **scroll along the field** and
    the release's impact burst **pulses on the beat accent**. This is the first place [[The Flow Field is the
    Spine]] actually *moves* in the comic register. Verified: panel 07 (release) HUD read `flow: FULL — tearing`.
  - **Held-pose drift** — the figure **breathes** (a 4-beat cycle, applied as a *feet-anchored height
    modulation* so the feet and the contact shadow stay planted while the chest rises) and **sways** (a slow
    8-beat lateral drift). Verified: motion moves pixels even on a *non-flow* shot (panel 01).
  - **Parallax** — the cached static ground drifts least, the figure a little more, the OTS foreground
    shoulder most, on a slow camera drift offset from the sway — depth from a single held panel.
- **Freeze lands exactly on M1.** The `motion ON/OFF` toggle, when off, zeroes every motion term *including
  the flow-scroll phase*, so a frozen panel is **pixel-identical regardless of frame** and equals M1's static
  baseline (verified: `frozenIdenticalAcrossFrames` and `freezeEqualsBaseline` both true). "Look vs
  legibility" made operable: turn motion off to read the staging cleanly; turn it on to feel the beat.
- **All 8 shots render without throwing** (close-up crop, OTS, worm's-eye, the bow shots), and the
  blue-line → ink draft toggle still works.

Loudon Live skin throughout (Anton / Cormorant / JetBrains Mono, graphite ground, amber drama spot).

## What's new vs M1 — the architecture, not the look

M1 drew each panel **once** on shot change. M2 adds a single `requestAnimationFrame` loop that redraws the
active panel against the interpolated playhead — but **only when the frame signature changes**, so a frozen
panel costs nothing. The expensive part (the Ben-Day halftone background) is **cached per shot** into an
oversized offscreen canvas and blitted with a parallax offset; only the figure, the flow-lines, and the
foreground shoulder are redrawn per frame. That keeps 60 fps cheap while the field runs.

The look is deliberately unchanged from M1 — same storyboard, same inked register, same staging primitives.
M2 is a **register-of-time** shift (held → limited motion), the way M1 was a register-of-medium shift
(greybox → drawn ink). Same substrate, one new axis.

## Staging stays lossless (the conditioning invariant)

The motion is built so it never corrupts the staging vocabulary that the render-AI will later consume:

- **Breath** modulates figure *height* (feet-anchored); facing, eyeline, L/R, and the torso triangle are
  preserved under it. Drift is a whole-figure translate — relative staging is invariant under translation.
- **The bow-tension shimmer** is a **render-only** detail (the amber bowstring trembles); it does **not** move
  the pose keypoints. Aesthetic shimmer is render; keypoints are substrate — the line is held exactly.

So `motion OFF` returns the exact M1 board record's visual, and the keypoints a Bench/OpenPose pass would
read are unchanged by motion. The motion lives entirely in the *comic preview layer*, ahead of the board
record — it does not reach into the conditioning contract.

## What M2 is (and isn't)

M2 is the **motion** register of the same animatic — *limited animation* in the anime sense (held key poses
with life), **staged, not simulated** (no simulated contact, no interpolated re-posing). It is M1's exact
substrate (storyboard, `(bar,beat)→frame` clock, board record, the section wire, self-play + the relay
contract) with a continuous playhead and three beat-locked motions added. Deliberately **no render-AI** —
that risk still lives behind the board→layout→render seams. The flow field *moving in the comic register*
is the whole deliverable; the render-AI's dense motion conditioning is a later rung (M3+).

## Verified vs inherited

- **New + verified here:** the continuous interpolated-and-resnapped playhead; `drawFrame` as a pure
  function of the frame (determinism by construction); the animated flow scroll + beat-pulsed burst; the
  feet-anchored breath, sway, and parallax; the cached-background render path; the freeze≡M1 invariant.
- **Inherited from M0/M1 (identical code, proven there):** the transport contract (`/transport/bible` ·
  `/transport/beat` · `/transport/section`), the WS connect, `applyBible`/`onBeat`, the clip-scan board path,
  the comic primitives (ink, halftone, oriented head, eyeline ray, torso frame, L/R tags), the determinism
  arithmetic. To drive M2 from a *live* Ableton session, add an `/m2` route to `osc_ws_relay.py` (one
  `FileResponse`, exactly like the `/m1` follow-up) — the clock machinery is unchanged; verified here via
  self-play, not a live round-trip.

## Honest limits

- **OTS parallax order.** The over-the-shoulder foreground mass is drawn *behind* the figure (M1's order,
  preserved so freeze is pixel-identical to M1) yet parallaxes the most. Physically the foreground should
  occlude; the trade buys an exact M1 freeze. Reads as depth; revisit if the OTS shot ever needs true
  occlusion.
- **Whole-figure drift.** Breath is feet-anchored (good), but sway/parallax translate the whole figure
  including feet — limited-animation register, not articulated motion. By design (staged, not simulated).
- **Self-play, not live.** Beat-locking verified against the internal clock; the live `/m2` relay route is
  the trivial follow-up above.

## Ships to the palace

- A **motion-comic player** for any beat-locked storyboard — the moving half of the comic register, reusable
  beyond BLUELINE (any music-synced visual that wants limited, deterministic motion).
- A reusable pattern: **motion as a pure function of a resnapped-and-interpolated playhead** — the recipe for
  making *any* canvas animation an instrument synced to Live rather than a video paired with audio.
- The **cached-static-layer + live-figure + parallax-blit** render structure — cheap 60 fps with an
  expensive per-shot background.

## Run it

```
# static (self-play, embedded storyboard):
python3 -m http.server 8204 --directory Projects/BLUELINE/proofs/m2-motion-comic
#   → http://127.0.0.1:8204/m2-motion-comic.html
#     click ▶ self-play; toggle ◉ motion to compare moving vs the M1 held register; toggle the blue-line draft
# live clock: add an /m2 route to osc_ws_relay.py, then drive with transport_sim.py / the M4L device
```

## Next — M3 flow-field FX

M2 makes the flow field *move in the comic register* (drawn speed-lines scrolling along the field). **M3** is
the [[The Flow Field is the Spine]] reaching the **render**: one authored field becomes **dense motion
conditioning** that warps the diffusion across a board *pair* ([[Go-with-the-Flow]] / warped noise) — the
[[BLUELINE — Production Plan]] Track V test, the project's #1 risk (does one field read as *coherent motion*
rather than independent frames?). That is the first rung past the layout→render seam, and the first that
needs the GPU backend (Track I) warm.
