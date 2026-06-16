#!/usr/bin/env python3
"""
BLUELINE M0 — clip-scan simulator (STAND-IN for the Max for Live "scan clips" pass).

Mimics the device reading its own track's `arrangement_clips` and emitting each MIDI
clip's name + color + start + length over OSC, so the previz can build the storyboard
from Live clips WITHOUT Ableton. The real device sends the SAME messages from a deferred
(low-priority) scan — never from the transport poll (the qmetro lesson).

OSC scan contract (one-shot; not streamed like /transport/beat):
  /board/scan      count:int
  /board/clip      idx:int  start:float(beats)  length:float(beats)  color:int(0xRRGGBB)  name:string
  /board/scan_end

Run:  python3 clip_scan_sim.py        (sends one scan to the relay at 127.0.0.1:9001)
"""
import socket, sys, os, time
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "track-III-clock"))
from osclib import encode

HOST, PORT = "127.0.0.1", 9001
sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
def send(addr, *args): sock.sendto(encode(addr, *args), (HOST, PORT))

# a stand-in "camera track": MIDI clips named for movie cues, with start/length in beats.
# (start,length in beats; color as 0xRRGGBB; name = the cue carried in the clip name)
CLIPS = [
    (0.0,  8.0, 0xE0A83A, "WIDE - misty forest, ranger small"),
    (8.0,  8.0, 0x6AA0C9, "PUSH-IN - she senses something"),
    (16.0, 8.0, 0xC98A8A, "OTS - she spots the threat"),
    (24.0, 8.0, 0xB07AC9, "WORM'S-EYE hero turn"),
    (32.0, 4.0, 0xE0A83A, "DRAW - the drop"),
    (36.0, 4.0, 0x7BBF6A, "COIL - full draw"),
    (40.0, 8.0, 0xE0A83A, "RELEASE - arrow flies"),
    (48.0, 8.0, 0x8B8D96, "AFTERMATH - lowers the bow"),
]

print(f"clip_scan_sim: sending {len(CLIPS)} clips to OSC {HOST}:{PORT}")
send("/board/scan", len(CLIPS))
for i,(start,length,color,name) in enumerate(CLIPS):
    send("/board/clip", i, start, length, color, name)
    time.sleep(0.01)
send("/board/scan_end")
print("scan sent.")
