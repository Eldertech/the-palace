# BLUELINE M0 — Previz (report)

**Date:** 2026-06-16 · Mac-side · [[BLUELINE — Production Plan]] M0, the first production rung (the cheap,
reliable *staging* side — no render-AI).
**Question:** can the storyboard be **played in time** with the live clock — beat-locked, deterministic,
shot-accurate — using only the proven substrate (no GPU)?

## Answer — yes, verified end to end against the live clock

The M0 previz player (`previz.html`) ran the full path **relay → WS → browser**, driven by the Track III
transport at 120 BPM @ 24 fps, and rendered correctly:

- **`● transport playing`** — live transport over the markers→clips wire (`/transport/beat` +
  `/transport/section`).
- **frame is exact** — at bar `18.4`, frame `852` = 71 beats × 12 fpb; `deterministic ✓`,
  `on whole frame ✓`, `fpb 12 (exact)`.
- **shot selection is beat-accurate** — shot `#08` active at bar 18 (its span is bars 13–21); exactly
  **1 of 8** filmstrip cells highlighted.
- **section displays live** — `DROP`, updated from the `/transport/section` message (the markers→clips
  rename; the stale `/transport/locator` handler was the one thing that had to be modernized to start M0).

Screenshot proof: the greybox panel (posed figure + slate + letterbox + Live clip-color stripe), the
NOW-PLAYING / LOCKED-CLOCK HUD, and the 8-shot filmstrip with the active shot tracked.

## What M0 is (and isn't)

M0 is the **animatic-grade previz**: rough greybox boards — canvas-drawn stick-figure poses, camera
framing (WIDE / PUSH / OTS / WORM'S-EYE / TIGHT), flow-line speed-lines on the DROP shots, OTS
foreground — played in sync with Ableton. *Rough boards now, pixels later, one timeline.* It deliberately
uses **no render-AI** — that risk lives in later rungs (M2+). This is the useful-early tool that never
depended on the uncertain half.

It speaks the BLUELINE substrate already proven:
- the **clock** (Track III) — the same `(bar,beat)→frame` determinism, now live-validated and clip-addressed;
- the **board record** ([[BLUELINE — Board Record Schema]]) — each shot is `bar`/`beat`/`hold`/`section`
  + camera + pose + flow, the staging-spec shape minus pixels;
- the **markers→clips model** — `clip_scan_sim.py` builds the storyboard from a Live track's MIDI clips
  (`/board/scan` · `/board/clip` name+color+start+length · `/board/scan_end`), the same own-track-clips
  read as the section device. *The storyboard can live in Ableton as clips.*

## What was built / made current this session

| File | Role |
|---|---|
| `previz.html` | the previz player — fetch storyboard, greybox render, filmstrip, live HUD, self-play fallback. **Modernized:** `/transport/locator` → `/transport/section` (markers→clips). |
| `storyboard.json` | the 8-shot r4ng3r board pinned to bars/beats/sections at the 120@24 determinism pair. |
| `clip_scan_sim.py` | the clip-scan stand-in — storyboard *from Live clips*, the deferred (low-priority) scan, never the transport poll (the qmetro lesson). |

## Ships to the palace

- A **beat-synced previz player** for any storyboard — develop here, promote to Shop machinery; reusable
  for any music-synced animatic, not just BLUELINE.
- The **storyboard-as-Live-clips** path (clip-scan → board), the authoring face of the markers→clips bet.

## Run it

```
# relay (serves /previz + storyboard.json + WS; OSC :9001)
_tools/ComfyUI/venv/bin/python Projects/BLUELINE/proofs/track-III-clock/osc_ws_relay.py
# the clock (sim stand-in, or the real M4L device)
_tools/ComfyUI/venv/bin/python Projects/BLUELINE/proofs/track-III-clock/transport_sim.py 120 24
# open http://127.0.0.1:8770/previz   (or preview config `blueline-clock`)
# optional: build the board from Live clips
_tools/ComfyUI/venv/bin/python Projects/BLUELINE/proofs/m0-previz/clip_scan_sim.py
```

## Next — M1 animatic

M0 ships the timed greybox. **M1** raises the boards from stick-figure greybox to *drawn* comic panels
(the comic register) while keeping the exact same timeline + board record — still no render-AI. The seam
to the render side (M2+) stays the board record, so the previz never has to know about pixels.
