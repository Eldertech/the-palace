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

## The staging channel — facing + eyeline (added 2026-06-16, Loudon's call)

A featureless head silhouette can't say which way a character faces or what they look at — and **half these
shots *are* eyeline beats** ("senses something off-frame," the OTS reveal of the threat, "turns into it").
That's not a polish gap; it's a **conditioning** gap: in "Blocked, Not Prompted" the board dictates the
composition, so a direction-blind board can't condition facing/gaze and the render picks its own. The
coupling is exact — **OpenPose (the skeleton the Bench emits) encodes head facing in the nose/eyes/ears
keypoints**, so a direction-bearing head in the board *is* those keypoints. The 2D oriented-head is the
proxy that later projects to the 3D/OpenPose head — not throwaway.

So each shot now carries **`facing`** (body/chest yaw) and **`eyeline`** (gaze target), and the figure
renders three new primitives:

- **Oriented head** — a blocking *sphere with a cross* (facing meridian + nose), replacing the blob — head
  yaw + focus read instantly. (Loudon's "even a sphere with a cross indicates direction.")
- **Eyeline ray + target reticle** — an amber gaze line to *what* the subject looks at; off-frame or on a
  subject (verified: panel 02 gaze snaps off-frame-left; panel 03's ray locks across-frame onto the threat).
- **Torso frame (framing-robust)** — body facing as the **shoulder–shoulder–pelvis triangle** with
  color-coded corners (green = char right shoulder, coral = left, violet = pelvis), anchored to real
  OpenPose keypoints (so it's the conditioning data, not an abstraction). Built to survive cropping — *parts
  of the figure are usually out of frame* (OTS, close-ups): the **shoulder line + colored ends + a
  front-normal tick** is the always-visible core (handedness + facing from the shoulders alone), and the
  **pelvis corner completes the triangle only when it's in frame** (adds torso lean). **Verified on a
  close-up** (shot 02, now a CU): body cropped to the shoulders, direction + handedness still read. *(This
  replaced two earlier tries — a chest wedge, then a feet-anchored ground compass — both of which failed
  Loudon's constraint: the feet are the FIRST thing cropped, so a feet-anchored facing read is fragile.)*
- **Principle (Loudon's, 2026-06-16):** every visible part carries its own direction + handedness *locally*,
  and the read **degrades gracefully** — never depends on seeing the whole figure. Each shoulder / hand /
  foot is independently L/R-colored; whatever subset is in frame still tells you which side it is.

These are now fields in [[BLUELINE — Board Record Schema]] (`FACING` / `EYELINE`) — the channel propagates to
the Bench (Track IV) and any future register, not just M1's pixels. **Aesthetic polish stays deferred**;
this is legibility, which is substrate.

## Structural disambiguation — L/R hands & feet + action lines (2026-06-16)

The render errors we kept seeing — swapped/merged hands, a limb on the wrong side, a phantom third arm —
are **left/right ambiguity**. OpenPose has *distinct* L/R keypoints, and the estimator guesses them wrong
exactly when limbs cross the body. So the board now **declares** L/R instead of relying on a guess:

- **L/R hands + feet** — each extremity tagged **anatomically** (the character's own side, the *mirror* of
  screen side when they face you): green = R, coral = L. Maps straight onto OpenPose L/R wrist/ankle — the
  #1 fix. **◯ open hand vs ● grip** (the bow grips both) gives the second-hardest thing for diffusion a
  coarse signal; the Bench later emits the 21-pt hand model. Verified: panel 01 reads L/R on open hands +
  planted feet; panel 05 (draw) shows both hands gripping.
- **Comic action lines** — per-character motion trails on the *acting* limb for the dramatic beats (hero
  turn, draw, release), drawn behind the figure. This is the **comic motion language** — distinct from the
  environmental **flow field** (the project's spine, which stays the M3 layer). Two layers of "lines that
  signify motion," different jobs; don't conflate them.

**Deferred to the next structural pass (proposed):** **near/far** limb ordering (which limb is toward
camera — fixes "arm melts into torso"; it's the `DEPTH` pass) and **foot contact/weight** (kills floaty
feet). Both noted in the board schema.

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
