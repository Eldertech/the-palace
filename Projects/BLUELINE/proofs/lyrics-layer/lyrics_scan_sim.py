#!/usr/bin/env python3
"""
BLUELINE Text Layer — lyrics scan simulator (STAND-IN for the "Blueline ClipScan" device on a
`Lyrics` track). Emits the SAME OSC the real device sends, namespaced by the host track name ->
/Lyrics/*, so the animatic player's lyrics overlay can be driven WITHOUT Ableton.

Wire (one-shot; lyrics ride the existing /transport/beat for display timing):
  /Lyrics/scan      count:int                                            # number of lines
  /Lyrics/line      idx:int  start:float(beats)  length:float(beats)  text:string
  /Lyrics/word      line_idx:int  word_idx:int  start:float(beats)  text:string   # Tier 2 (karaoke), optional
  /Lyrics/scan_end

Run:  python3 lyrics_scan_sim.py                 (line + word level, to the relay at 127.0.0.1:9001)
      python3 lyrics_scan_sim.py --no-words      (line level only)
      python3 lyrics_scan_sim.py --port 9002     (a test relay on another port)
NOTE: sends no /transport/* — drive beats with transport_sim.py (so it won't disturb a live Set's
transport if you point it at a separate relay/port).
"""
import socket, sys, os, argparse
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "track-III-clock"))
from osclib import encode

ap = argparse.ArgumentParser()
ap.add_argument("--host", default="127.0.0.1"); ap.add_argument("--port", type=int, default=9001)
ap.add_argument("--track", default="Lyrics"); ap.add_argument("--no-words", action="store_true")
a = ap.parse_args()
sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
def send(addr, *args): sock.sendto(encode(addr, *args), (a.host, a.port))

# a sample verse. (start, length) in beats; word onsets placed on the 1/2-beat grid so they stay
# whole-frame at the locked tempos (72/120/180 @ 24fps -> 20/12/8 frames/beat, all divisible by 4).
LINES = [
    (0.0,  8.0, "the city is burning down",            [0.0, 2.0, 3.0, 4.0, 6.0]),
    (8.0,  8.0, "and i am the only sound",             [8.0, 9.0, 10.0, 11.0, 12.5, 14.0]),
    (16.0, 8.0, "i fall through the smoke to find you", [16.0, 17.0, 18.0, 19.0, 20.0, 21.5, 22.5, 23.0]),
    (24.0, 8.0, "too late  too late  too late",        [24.0, 25.0, 27.0, 28.0, 30.0, 31.0]),
]

print(f"lyrics_scan_sim: {len(LINES)} lines -> /{a.track}/* at OSC {a.host}:{a.port}"
      + ("" if a.no_words else " (with word onsets)"))
send(f"/{a.track}/scan", len(LINES))
for i, (start, length, text, onsets) in enumerate(LINES):
    send(f"/{a.track}/line", i, start, length, text)
    if not a.no_words:
        words = text.split()
        for j, w in enumerate(words):
            onset = onsets[j] if j < len(onsets) else start + (length * j / max(1, len(words)))
            send(f"/{a.track}/word", i, j, onset, w)
send(f"/{a.track}/scan_end")
print("scan sent.")
