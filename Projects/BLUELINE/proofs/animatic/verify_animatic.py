#!/usr/bin/env python3
"""
BLUELINE Animatic — headless contract verifier (round-trips the live clock loop).

Proves, without a browser or Ableton, that the animatic's clip->frame correlation
holds end to end: it is a WS client of the relay AND a UDP OSC sender. It sends the
bible + a /Boards/* clip scan + a beat sweep into the relay (:9001); the relay
broadcasts them back over WS (:8770/ws); the verifier then checks exactly what the
browser player computes:

  * the BIBLE arrives and frames_per_beat = (fps*60)/tempo is an integer (determinism),
  * the 6 Boards clips arrive and each maps to boards/01..06.png (same keyword logic
    as animatic.html),
  * for every integer beat, frame = clip_start_beats * frames_per_beat lands on a WHOLE
    frame, and the active shot = the latest clip whose start <= playhead.

Run (comfy venv has aiohttp):  <comfy venv python> verify_animatic.py
Requires the relay already running (osc_ws_relay.py).
"""
import asyncio, json, os, re, socket, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "track-III-clock"))
from osclib import encode
from aiohttp import ClientSession, WSMsgType

WS = "ws://127.0.0.1:8770/ws"
OSC = ("127.0.0.1", 9001)
TEMPO, FPS, BPB = 120, 24, 4

# mirror animatic.html's BOARDS keyword routing
KEYS = [
    ("01", re.compile(r"burn|city|wide|establish", re.I)),
    ("02", re.compile(r"car|sedan|point|roof|stand", re.I)),
    ("03", re.compile(r"leap|jump", re.I)),
    ("04", re.compile(r"plummet|fall|plunge|descend|dive", re.I)),
    ("05", re.compile(r"impact|land|crash|shock|crowd|over", re.I)),
    ("06", re.compile(r"kiss|pov|face|down", re.I)),
]
def match_board(name, idx):
    m = re.match(r"\s*0?([1-6])\b", name or "")     # a leading shot number wins — collision-free
    if m:
        return int(m.group(1)) - 1
    if 0 <= idx < len(KEYS):                          # else clip order (linear storyboard)
        return idx
    for i, (bid, rx) in enumerate(KEYS):             # keyword: last resort only
        if rx.search(name or ""):
            return i
    return max(0, min(5, idx))

CLIPS = [  # (start_beats, length_beats, name) — placeholder timing, bars 1,3,5,7,9,11
    (0.0,  8.0, "01 - noir city, many rooftop fires, high wide, smoke"),
    (8.0,  8.0, "02 - figure on crushed sedan roof, arm out pointing, embers"),
    (16.0, 8.0, "03 - CU braced legs explode upward, car roof buckling, debris"),
    (24.0, 8.0, "04 - worm's-eye, figure plummeting at camera, coat flaring, fire sky"),
    (32.0, 8.0, "05 - hard crouch landing, radial pavement crack, woman's body, crowd recoiling"),
    (40.0, 8.0, "06 - POV straight down at dying woman's face, blood and sweat falling, kiss off-frame"),
]

def udp_send(sock, addr, *args):
    sock.sendto(encode(addr, *args), OSC)

async def main():
    fpb = (FPS * 60) / TEMPO
    got = []
    async with ClientSession() as sess:
        async with sess.ws_connect(WS) as ws:
            await asyncio.sleep(0.2)  # let the relay register this WS client before we fire UDP (avoid a broadcast race)
            sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            # 1) bible  2) the Boards scan  3) a beat sweep over bars 1..13
            udp_send(sock, "/transport/bible", TEMPO, FPS, BPB)
            udp_send(sock, "/Boards/scan", len(CLIPS))
            for i, (st, ln, nm) in enumerate(CLIPS):
                udp_send(sock, "/Boards/clip", i, st, ln, 0xE0A83A, nm)
            udp_send(sock, "/Boards/scan_end")
            for bar in range(1, 14):
                udp_send(sock, "/transport/beat", bar, 1.0, 1)
            # drain until a quiet gap (all echoes in) or a close/error frame or a hard deadline
            loop = asyncio.get_event_loop()
            deadline = loop.time() + 2.5
            while loop.time() < deadline:
                try:
                    raw = await asyncio.wait_for(ws.receive(), timeout=0.4)
                except asyncio.TimeoutError:
                    break  # quiet gap -> the burst has all echoed back
                if raw.type == WSMsgType.TEXT:
                    got.append(json.loads(raw.data))
                elif raw.type in (WSMsgType.CLOSE, WSMsgType.CLOSING, WSMsgType.CLOSED, WSMsgType.ERROR):
                    break

    # ---- analyze exactly what the player would ----
    bible = [m for m in got if m.get("address") == "/transport/bible"]
    clips = [m for m in got if m.get("address") == "/Boards/clip"]
    # only the controlled beats we injected (downbeats, bars 1..13) — exclude any live transport bleed-in
    beats = [m for m in got if m.get("address") == "/transport/beat"
             and abs(float(m["args"][1]) - 1.0) < 1e-9 and 1 <= int(m["args"][0]) <= 13]
    seen_bars = set()
    beats = [m for m in beats if not (int(m["args"][0]) in seen_bars or seen_bars.add(int(m["args"][0])))]
    ok = True
    print("=" * 72)
    print("BLUELINE Animatic — contract verification")
    print("=" * 72)

    print(f"\n[bible]  received={len(bible)}")
    if bible:
        t, f, b = bible[0]["args"][:3]
        det = (f * 60) % t == 0
        print(f"  tempo={t}  fps={f}  beats_per_bar={b}  ->  frames_per_beat=(fps*60)/tempo="
              f"({f}*60)/{t}={ (f*60)/t :g}  {'WHOLE ✓' if det else 'DRIFTS ✗'}")
        ok &= det
    else:
        ok = False; print("  ✗ no bible echoed")

    print(f"\n[scan]   /Boards/ clips received={len(clips)} (expected {len(CLIPS)})")
    ok &= (len(clips) == len(CLIPS))
    clips_sorted = sorted(clips, key=lambda m: m["args"][1])
    starts = [c["args"][1] for c in clips_sorted]
    for i, c in enumerate(clips_sorted):
        idx, st, ln = c["args"][0], c["args"][1], c["args"][2]
        nm = c["args"][4] if len(c["args"]) > 4 else ""
        bidx = match_board(nm, i)
        bar = int(st // BPB) + 1
        frame_in = int(round(st * fpb))
        print(f"  clip {idx:>2}  start {st:>5}b (bar {bar})  hold {ln:>4}b  ->  board {KEYS[bidx][0]}  "
              f"frame_IN={frame_in}  '{nm[:46]}'")
        # routing sanity: placeholder names are ordered, so keyword route should equal order here
        if bidx != i:
            ok = False; print(f"     ✗ routed to board {bidx+1}, expected {i+1}")

    print(f"\n[beats]  whole-frame + active-shot check over bars 1..13:")
    allwhole = True
    for m in sorted(beats, key=lambda m: m["args"][0]):
        bar, beat = m["args"][0], m["args"][1]
        tb = (bar - 1) * BPB + (beat - 1)
        frame = tb * fpb
        whole = abs(frame - round(frame)) < 1e-9
        allwhole &= whole
        active = -1
        for i, st in enumerate(starts):
            if tb >= st: active = i
            else: break
        shot = KEYS[match_board(clips_sorted[active]["args"][4], active)][0] if active >= 0 else "—"
        print(f"  bar {bar:>2}.{int(beat)}  tb={tb:>3}b  frame={frame:>4g}  {'whole ✓' if whole else 'OFF ✗'}  active=shot {shot}")
    ok &= allwhole

    print("\n" + "=" * 72)
    print(f"RESULT: {'PASS ✓  — clip→frame correlation verified end to end' if ok else 'FAIL ✗'}")
    print("=" * 72)
    sys.exit(0 if ok else 1)

if __name__ == "__main__":
    asyncio.run(main())
