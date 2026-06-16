# BLUELINE Track III — The Clock (report)

**Date:** 2026-06-14 · Mac-side Claude Code · [[BLUELINE — Production Plan]] Track III — the
music-time substrate (GPU-free, the highest cross-palace leverage track).
**Question:** is fixed-tempo → frame truly deterministic end to end, and can a browser stay
beat-locked to a live transport?

## Answer — yes, proven end to end (and now live from Ableton, 2026-06-16)

The full pipeline ran live: **transport simulator → OSC/UDP → relay → WebSocket → browser client**,
at 120 BPM @ 24 fps. The client showed:

- **95 / 95 on-beats landed on a whole frame** (residual `0.000`) — `frame = total_beats × 12`, exact.
- **determinism ✓** — frames/beat = 12 (integer); finest whole-frame subdivision = 1/4-of-a-beat (16th note).
- **mean tick jitter 4.6 ms** — the OSC→WS hop delivers transport beat-accurately and stably.
- **sections propagate** — section names ("intro / verse / drop") arrive addressed to their span.

**Live-validated (2026-06-16):** the real M4L device drives this from Loudon's Ableton, round-trip,
running with the patcher edit window closed (the `[qmetro]` + `valid()` fix retired the LiveAPI-thread
bug). The simulator is now a test fixture. **Section addressing moved off locators/markers and onto the
device's own-track MIDI clips** — a clip is a named *span* (start + length), not a point; the OSC message
is renamed `/transport/locator` → `/transport/section` accordingly (the harness rename is the one open
follow-up — see the M4L spec Status banner).

The arithmetic core is proven separately and adversarially in `clock.py` (run it): the **locked pair
120@24** puts every on-beat over 64 bars on a whole frame (0 drift); the **Board-Schema's flagged
128@24** case drifts (192/256 off, max residual 0.5 frame). That contrast *is* the determinism rule.

## What was built (each piece reusable Shop machinery)

| File | Role |
|---|---|
| `clock.py` | the **(bar,beat)→frame determinism recipe** — pure rational arithmetic + self-test. Feeds [[BLUELINE — Board Record Schema]] (`TEMPO`/`FPS`/`FRAMES_PER_BEAT`). |
| `osclib.py` | minimal OSC 1.0 encode/decode (no dependency) — the wire format the M4L device emits. |
| `osc_ws_relay.py` | the **OSC → WebSocket relay** (aiohttp): receives OSC/UDP, rebroadcasts JSON to browser clients; serves the client. |
| `transport_sim.py` | the **M4L stand-in** — emits the OSC transport contract on a free-running locked clock, so the pipeline is testable without Ableton. |
| `clock_client.html` | the **browser clock client** — computes the frame, proves beats-on-whole-frames live, measures delivery jitter. Loudon Live skin. |

## The OSC transport contract (what the live device must emit)

The relay (and any client) speaks this; the simulator and the real M4L device are interchangeable
because they emit the same wire format:

```
/transport/bible    tempo:float  fps:int  beats_per_bar:int                # once at start — the locked clock
/transport/beat     bar:int  beat:float  playing:int                       # per tick (≥1/16-of-a-beat); beat is 1-indexed within the bar
/transport/section  name:string  start_bar:int  length_bars:float          # on entering a named MIDI clip on the device's track (markers→clips)
```

`beat` carries sub-beat position (1.0, 1.25, 1.5, …) so the client can place 8th/16th events; at a
locked pair those still land whole (FPB divisible by the subdivision).

## The live last-mile — the M4L device recipe (✅ live-validated 2026-06-16)

The one piece a headless Mac couldn't test live — the device reading **Live's actual transport** — is now
built and proven round-trip from Loudon's Ableton (see the Answer banner; full build in `M4L-DEVICE-SPEC.md`). Two
ways to build it, both emitting the contract above to UDP `127.0.0.1:9001`:

- **Max for Live (the plan's default):** a `.amxd` with `[live.thisdevice]` → on transport, read
  `[plugsync~]` / a `[live.observer]` on `live_set` `current_song_time` + `song.signature`/`tempo`,
  format the `/transport/beat` message, and `[udpsend 127.0.0.1 9001]`. Sections come from the device's
  **own host track's `arrangement_clips`** (`this_device canonical_parent`) — named MIDI clips, not
  `cue_points`. Build in Max, drop on the section track (placement = config).
- **Ableton Extension SDK (the `ableton-extensions` skill):** a TS extension subscribing to the
  transport tick, posting the same OSC bytes (or JSON straight to the relay's WS). Cleaner typing,
  no Max patch.

Either way **nothing downstream changes** — swap `transport_sim.py` for the device and the relay +
client + determinism are unchanged. That is the win of testing against the contract, not the tool.

## Ships to the palace

- The **relay + client + OSC contract** = a **beat-sync bridge for any music-synced visual** (Loudon
  Live, not just BLUELINE) — develop here, promote to Shop machinery once the live device is wired.
- The **determinism recipe** (`clock.py`) is the `(bar,beat)→frame` guarantee the Board Record Schema
  points at — the thing that makes BLUELINE an *instrument synced to Live*, not a video paired with audio.

## Run it

```
# 1. relay (serves client + WS on :8770, OSC on :9001)
_tools/ComfyUI/venv/bin/python Projects/BLUELINE/proofs/track-III-clock/osc_ws_relay.py
# 2. the M4L stand-in (or the real device)
_tools/ComfyUI/venv/bin/python Projects/BLUELINE/proofs/track-III-clock/transport_sim.py 120 24
# 3. open http://127.0.0.1:8770   (or `preview` config `blueline-clock`)
```

## Next on this track

- ✅ ~~Wire the **real M4L / Extension device** to Live's transport~~ — **done (2026-06-16)**, live-validated
  round-trip; confirmed running with the editor closed.
- **Harness wire rename** (the one open follow-up): `transport_sim.py` + `clock_client.html` still emit/parse
  `/transport/locator`; rename to `/transport/section` (now a name + start_bar + length_bars span) and
  re-run the sim→relay→client proof so the fixture matches the live device. The relay is format-agnostic.
- The **start-trigger sync test**: one short pre-rendered sequence, render-once-and-mux, triggered on
  the **first section clip** — proving offline-deterministic-render + one-trigger == in-sync (no elastic alignment).
- Feed `FRAMES_PER_BEAT` into the runner's output naming (`out/<tier>/<SHOT_ID>_<FRAME>_*.png`), so a
  board's `FRAME` is sync-addressable end to end.
