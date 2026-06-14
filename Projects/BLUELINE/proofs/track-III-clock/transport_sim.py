#!/usr/bin/env python3
"""
BLUELINE Track III — the transport simulator (STAND-IN for the Max for Live device).

Emits the OSC transport contract at a locked tempo so the whole pipeline (relay →
client → determinism) is provable WITHOUT Ableton running. The real M4L device sends
the SAME OSC messages from Live's actual transport — this just generates them on a
free-running clock. Swap this for the device and nothing downstream changes.

OSC contract (address → args):
  /transport/bible   (tempo:float, fps:int, beats_per_bar:int)   # once at start (the BIBLE clock)
  /transport/beat    (bar:int, beat:float, playing:int)          # on every 1/16-of-a-beat tick
  /transport/locator (name:str, bar:int)                         # on section/locator changes

Run:  python3 transport_sim.py [tempo] [fps]
"""
import socket, sys, time
from osclib import encode

TEMPO = float(sys.argv[1]) if len(sys.argv) > 1 else 120.0
FPS   = int(sys.argv[2]) if len(sys.argv) > 2 else 24
BEATS_PER_BAR = 4
SUBDIV = 4                      # ticks per beat the sim emits (1/16-of-a-beat)
HOST, PORT = "127.0.0.1", 9001

sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
def send(addr, *args): sock.sendto(encode(addr, *args), (HOST, PORT))

# a tiny "arrangement": locators at bars 1, 5, 9
LOCATORS = {1: "intro", 5: "verse", 9: "drop"}

print(f"transport_sim: {TEMPO} BPM @ {FPS} fps, emitting /transport/beat at 1/{SUBDIV}-beat over OSC :{PORT}")
send("/transport/bible", TEMPO, FPS, BEATS_PER_BAR)

sec_per_tick = (60.0 / TEMPO) / SUBDIV
total_ticks = 0
t0 = time.time()
last_locator = None
try:
    while True:
        beats_elapsed = total_ticks / SUBDIV
        bar = int(beats_elapsed // BEATS_PER_BAR) + 1
        beat = (beats_elapsed % BEATS_PER_BAR) + 1.0
        if bar in LOCATORS and LOCATORS[bar] != last_locator and abs(beat - 1.0) < 1e-6:
            send("/transport/locator", LOCATORS[bar], bar); last_locator = LOCATORS[bar]
        send("/transport/beat", bar, round(beat, 4), 1)
        total_ticks += 1
        # drift-free sleep: schedule against the absolute start time
        target = t0 + total_ticks * sec_per_tick
        dt = target - time.time()
        if dt > 0: time.sleep(dt)
except KeyboardInterrupt:
    pass
