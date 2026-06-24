#!/usr/bin/env python3
"""
BLUELINE Animatic — clip-scan simulator for the 6-shot opening (STAND-IN for the
Max for Live "Blueline ClipScan" device on the `Boards` track). Sends the SAME OSC
the real device sends, namespaced by the host track name -> /Boards/*, so the animatic
player can be verified WITHOUT Ableton. The condensed clip names double as the board
cue (the player keyword-matches them to boards/01..06.png).

OSC scan contract (one-shot):
  /Boards/scan     count:int
  /Boards/clip     idx:int  start:float(beats)  length:float(beats)  color:int(0xRRGGBB)  name:string
  /Boards/scan_end

Run:  python3 clip_scan_animatic.py            (placeholder bars; the real song's clips override)
      python3 clip_scan_animatic.py Shot       (send under a different track namespace)
"""
import socket, sys, os, time
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "track-III-clock"))
from osclib import encode

HOST, PORT = "127.0.0.1", 9001
NS = sys.argv[1] if len(sys.argv) > 1 else "Boards"
sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
def send(addr, *args): sock.sendto(encode(addr, *args), (HOST, PORT))

# the 6-shot opening, placeholder timing (bars 1,3,5,7,9,11 -> starts 0,8,16,24,32,40 beats; hold 8).
# name = the condensed prompt/cue; it auto-routes to boards/NN.png and flips `flow` on for leap/plummet/drop.
# color = the Live clip-color spine.
CLIPS = [
    (0.0,  8.0, 0xE0A83A, "01 - noir city, many rooftop fires, high wide, smoke"),
    (8.0,  8.0, 0xC9A06A, "02 - figure on crushed sedan roof, arm out pointing, embers"),
    (16.0, 8.0, 0x6AA0C9, "03 - CU braced legs explode upward, car roof buckling, debris"),
    (24.0, 8.0, 0xB07AC9, "04 - worm's-eye, figure plummeting at camera, coat flaring, fire sky"),
    (32.0, 8.0, 0xC98A8A, "05 - hard crouch landing, radial pavement crack, woman's body, crowd recoiling"),
    (40.0, 8.0, 0x9AA0B0, "06 - POV straight down at dying woman's face, blood and sweat falling, kiss off-frame"),
]

print(f"clip_scan_animatic: sending {len(CLIPS)} clips to /{NS}/* at OSC {HOST}:{PORT}")
send(f"/{NS}/scan", len(CLIPS))
for i, (start, length, color, name) in enumerate(CLIPS):
    send(f"/{NS}/clip", i, start, length, color, name)
    time.sleep(0.01)
send(f"/{NS}/scan_end")
print("scan sent.")
