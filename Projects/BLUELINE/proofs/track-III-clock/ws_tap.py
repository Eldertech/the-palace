#!/usr/bin/env python3
"""
BLUELINE Track III - headless WS tap (verification machinery).

Connects to the relay's WebSocket (ws://127.0.0.1:8770/ws) and reports what the
device(s) are emitting WITHOUT needing a browser.

  TRANSPORT (transport.js, singleton):
    /transport/bible     printed in full, immediately
    /transport/section   printed in full (now sourced from arrangement locators)
    /transport/beat      a once-per-second summary (rate Hz, latest bar.beat, playing, count)

  SCANNER (scanner.js, one per track -- namespace = the host TRACK NAME):
    /<track>/scan  /<track>/clip  /<track>/scan_end    printed as a clip-by-clip scan,
    tagged with the track name, so many scanners on different tracks are all legible at once.
    (idx, start/length in beats, #RRGGBB color, name -- a 4-arg row with no color also handled.)

Robust by design: a malformed/short OSC message is logged, never fatal; the socket
auto-reconnects so it survives a relay restart mid-session. Ctrl-C to stop.

Run (comfy venv has aiohttp):
  <comfy venv python> ws_tap.py
"""
import asyncio, json, time
from aiohttp import ClientSession, WSMsgType

URL = "ws://127.0.0.1:8770/ws"


def g(args, i, default="?"):
    """Safe positional arg access -- a device that sends a short message must not crash us."""
    return args[i] if 0 <= i < len(args) else default


def handle(m, state):
    addr = m.get("address", "")
    args = m.get("args", [])
    parts = addr.strip("/").split("/")
    ns = parts[0] if parts else ""
    verb = parts[1] if len(parts) > 1 else ""

    # --- transport (continuous, singleton) ---
    if ns == "transport":
        if verb == "beat":
            state["beats"] += 1
            state["win"] += 1
            now = time.time()
            if now - state["win_start"] >= 1.0:
                hz = state["win"] / (now - state["win_start"])
                print(f"  beat  {hz:5.1f} Hz   bar {g(args,0)}  beat {g(args,1)}  "
                      f"playing={g(args,2)}   (total {state['beats']})", flush=True)
                state["win_start"] = now
                state["win"] = 0
        elif verb == "bible":
            print(f"BIBLE   tempo={g(args,0)}  fps={g(args,1)}  beats_per_bar={g(args,2)}", flush=True)
        elif verb == "section":
            print(f"SECTION '{g(args,0)}'  start_bar={g(args,1)}  length_bars={g(args,2)}", flush=True)
        else:
            print(f"{addr}  {args}", flush=True)

    # --- any track-namespaced scan (scanner.js, namespace = track name) ---
    elif verb == "scan":
        print(f"\nSCAN [{ns}]  ({g(args,0)} clips)", flush=True)
    elif verb in ("clip", "line"):
        # clip row: idx start length color name  (5 args) | line row: idx start length text (4 args)
        if len(args) >= 5:
            color = g(args, 3, 0)
            try:
                chex = f"#{int(color):06X}"
            except (ValueError, TypeError):
                chex = str(color)
            print(f"  [{ns}] clip {g(args,0):>2}  start {g(args,1):>6}  len {g(args,2):>5}  "
                  f"{chex}  '{g(args,4,'')}'", flush=True)
        else:
            print(f"  [{ns}] row  {g(args,0):>2}  start {g(args,1):>6}  len {g(args,2):>5}  "
                  f"'{g(args,3,'')}'", flush=True)
    elif verb == "scan_end":
        print(f"SCAN [{ns}] END\n", flush=True)

    else:
        print(f"{addr}  {args}", flush=True)


async def main():
    state = {"beats": 0, "win": 0, "win_start": time.time()}
    while True:
        try:
            print(f"ws_tap: connecting to {URL} ...", flush=True)
            async with ClientSession() as sess:
                async with sess.ws_connect(URL) as ws:
                    print("ws_tap: connected. waiting for OSC (press Play, or click scan in Live) ...",
                          flush=True)
                    async for raw in ws:
                        if raw.type != WSMsgType.TEXT:
                            continue
                        try:
                            handle(json.loads(raw.data), state)
                        except Exception as e:
                            print(f"  [skip malformed msg: {e}]", flush=True)
            print("ws_tap: socket closed -- reconnecting in 1s ...", flush=True)
        except Exception as e:
            print(f"ws_tap: connection error ({e}) -- retrying in 1s ...", flush=True)
        await asyncio.sleep(1.0)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
