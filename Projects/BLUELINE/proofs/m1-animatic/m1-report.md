# BLUELINE M1 — Animatic, the comic register (report)

**Date:** 2026-06-16 · in the `feature/blueline` worktree · [[BLUELINE — Production Plan]] M1, the second
production rung (still the cheap *staging* side — no render-AI).
**Question:** can the boards be raised from M0's greybox to **drawn comic panels** — the comic register —
on the *same* timeline / clock / board record?

## Answer — yes, verified

`m1-animatic.html` renders the same 8-shot r4ng3r storyboard as **inked comic panels** and plays them on
the same beat-locked clock. Verified in-browser (served from the worktree, no console errors):

- **Comic rendering** — each board is an inked figure (solid-ink silhouette, brush-tapered limbs,
  **Ben-Day halftone** shading), bold double **panel border**, comic **caption box** + section lettering,
  and the camera grammar as comic framing (OTS foreground shoulder, worm's-eye low angle, tight coil).
- **The flow leg in comic** — the DROP/RELEASE panels fire **tapered ink/amber speed-lines + a radial
  impact burst** — the *drawn* resolution of [[The Flow Field is the Spine]] ("integrate streamlines →
  tapered speed-lines"). The arrow becomes the wind, in ink.
- **Blue-line → ink** — the *draft* toggle shows the **blue-line rough** (blue-pencil skeleton + bow
  construction); toggling off inks over it. The comic-storyboard workflow itself, and a nod to the
  project's name — the animatic register *is* the blueline.
- **Plays in time** — self-play advances panels on the beat (bar 2.1.75 → frame 57, panel #01 active,
  `on whole frame ✓`); the determinism HUD reads `12 frames/beat · deterministic ✓`.

Loudon Live skin throughout (Anton / Cormorant / JetBrains Mono, graphite ground, amber drama spot).

## What M1 is (and isn't)

M1 is the **comic register** of the same animatic — *comic compresses and abstracts* (vs cinema's
dilation). It is M0's exact substrate (storyboard, `(bar,beat)→frame` clock, board record, the
markers→clips section wire, the Live-clip-scan board path) with the **rendering** raised from greybox to
drawn ink. Deliberately **no render-AI** — that risk still lives in later rungs. The register shift
(greybox → drawn linework) is the whole deliverable.

## Verified vs inherited

- **New + verified here:** the comic rendering (ink + halftone + speed-lines + burst + caption + border),
  the blue-line/ink draft toggle, and that the playback loop advances panels in M1.
- **Inherited from M0 (identical code, proven there):** the transport contract (`/transport/bible` ·
  `/transport/beat` · `/transport/section`), the WS connect, `onBeat`/`applyBible`, determinism. To drive
  M1 from a *live* Ableton session, add an `/m1` route to `osc_ws_relay.py` (one `FileResponse`, exactly
  like `/previz`) — a trivial follow-up; the clock machinery is unchanged.

## Ships to the palace

- A **comic-register animatic player** for any storyboard — the drawn-board half of the comic↔cinema
  transduction; reusable beyond BLUELINE.
- The **blue-line → ink draft toggle** — the storyboard-rough-to-inked workflow as a render mode.

## Run it

```
# static (self-play, embedded storyboard):
python3 -m http.server 8203 --directory Projects/BLUELINE/proofs/m1-animatic
#   → http://127.0.0.1:8203/m1-animatic.html   (click ▶ self-play; toggle the blue-line draft)
# live clock: add an /m1 route to osc_ws_relay.py, then drive with transport_sim.py / the M4L device
```

## Next — M2 motion comic

M1 ships the timed inked boards. **M2** is the *motion comic*: the held comic panels gain limited motion
(parallax, held-pose drift, the speed-lines animating along the field) — the first place the flow field
*moves* in the comic register, still ahead of the render-AI seam (which stays behind the board record).
