# BLUELINE — Animatic · report (2026-06-23)

**The rung:** storyboard → **animatic**. Sequence the 6 *rendered* new-story boards in time, pinned to a
live song — the convergence the pickup brief named: the `feature/blueline-m3` storyboard **+** the Track III
live-clock-loop, met at the [[BLUELINE — Board Record Schema]]. **Status: built, verified, confirmed live, merged.**

## What it is

A new browser player — `animatic.html`, the **rendered-board register** — that displays the six real boards
(not the M1/M2 *synthetic* comic/motion registers) on a 16:9 cinema stage, sequenced by a live Ableton Set.
It reuses the M0 previz's proven plumbing verbatim (WS connect · `/transport/*` · `/<track>/*` scan · beat /
section / determinism / multi-track lanes) and swaps the synthetic figure-drawing for image blitting
(`object-fit: contain` — portraits pillarbox, landscapes letterbox, on black).

## The architecture (see `architecture.svg`)

```
Ableton Live  ──OSC/UDP :9001──▶  osc_ws_relay.py  ──WS/JSON :8770/ws──▶  animatic.html
  Blueline Transport [MASTER]        (rebroadcast +                          (browser player)
  Blueline ClipScan  [SCANNER]        serves /animatic + /boards)
  on a track named "Boards"
```

- **`Boards`** is the answer to "what do I call the track" — the scanner namespaces every message by its
  host track name (OSC-sanitized), so a track named `Boards` emits `/Boards/*` and the player defaults to it
  (`?track=` overrides). Placement + name is the entire config.
- **Two independent layers.** Timing = the clip's **position + length** in the arrangement (the edit).
  Content = the clip's **name** (the prompt/cue) + `board-records.json` (the reproducible prompt/neg/seed).

## The clip → frame law (what makes it an instrument)

```
frames_per_beat = (fps × 60) ÷ tempo          # (frames/sec × sec/min) ÷ beats/min
frame_IN        = clip_start_beats × frames_per_beat
```
Pick tempo & fps so `frames_per_beat` is **whole** → every clip lands on an exact frame, no drift; sync is an
offline deterministic render + one start-trigger, not elastic alignment. At 120 BPM / 24 fps → **12** (whole ✓).
A clip at bar 5 = 16 beats → frame 192. The board holds from its IN frame to the next clip's IN frame.

## Verification

- **Headless — `verify_animatic.py` → PASS.** Round-trips the live loop (UDP sender + WS client through the
  relay) and checks exactly what the browser computes: bible determinism (`frames_per_beat = 12`, whole), all
  6 `/Boards/` clips received and routed to the right board, and every downbeat over bars 1–13 landing on a
  whole frame with the correct active shot.
- **Live — confirmed.** Loudon's Set (*Ascension_v8*, 120 BPM, fps 24) drove it: transport **playing**,
  the burning-city board on the stage at bar 2.1, all 6 `Boards` clips scanned in, section locators
  (Intro → Bridge A → Verse 1 → Drop B → Riser A) showing as time-aligned lanes, determinism HUD green.

## Two bugs found and fixed in the doing

1. **Keyword routing collided on rich prompts.** Routing clips to boards by keyword mismatched once the names
   carried full prompts — "03 … *car roof* …" matched board 02's `car|roof` key, "06 … *fall*ing …" matched
   board 04's `fall` key. **Fix:** route by the **leading shot-number** in the clip name (collision-free),
   then clip order, with keyword only as last resort. In the player and the verifier.
2. **Title bled from the M0 previz.** The page fetched the relay's `/storyboard.json` (which serves the *M0*
   previz's file), mislabeling the title "M0 Previz · r4ng3r" and briefly showing M0's 8 shots. **Fix:** cut
   the cross-fetch — the animatic runs purely off its own `EMBED` fallback + the live `Boards` scan.

(Also fixed: the verifier's WS drain loop spun on close frames → now breaks on a quiet gap / close / deadline.)

## Run it

```
_tools/ComfyUI/venv/bin/python Projects/BLUELINE/proofs/track-III-clock/osc_ws_relay.py   # the bridge
# open http://127.0.0.1:8770/animatic   (defaults to the Boards track)
```
Standalone preview without Ableton: the `▶ self-play` button. Verify without Ableton: `verify_animatic.py`.
Beat-pulse frame: the `◉ beat pulse` toggle. Full setup card: `SETUP.md`.

## Files

`animatic.html` (player) · `boards/01..06.png` (the six keeper boards) · `board-records.json` (reproducible
prompts) · `verify_animatic.py` (contract verifier) · `clip_scan_animatic.py` (6-board scan sim) ·
`architecture.svg` (the infographic) · `SETUP.md` (Ableton + run) · relay route in `../track-III-clock/osc_ws_relay.py`.

## Next

Level the 6 boards to uniform fidelity (01/03/04 are looser passes); render a shareable **muxed cut** from the
same beat-locked timing; bring the **motion-comic register** onto the live clock; and the standing M3 — the
flow field reaching the render.
