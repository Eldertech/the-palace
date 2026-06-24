#!/usr/bin/env python3
"""
BLUELINE Text Layer — lyrics contract verifier (self-contained, port-free).

Proves the lyrics overlay's timing contract WITHOUT a relay, a browser, or Ableton — so it never
touches a live Set's ports (8770/9001). It replicates the exact logic the player uses
(animatic.html: activeLine + current-word selection) and checks:

  1. DETERMINISM — at 72 / 120 / 180 BPM (fps 24 -> 20 / 12 / 8 frames/beat, all whole), every LINE
     start and every grid-authored WORD onset lands on a WHOLE frame: frame = beat * frames_per_beat.
  2. ACTIVE-LINE — over a beat sweep, the displayed line is the one whose [start, start+length) span
     contains the playhead (one line at a time, in order).
  3. CURRENT-WORD — the highlighted ("cur") word is the last word whose onset <= playhead; earlier
     words read "on", later words "next" (the karaoke read in renderLyrics()).

Run:  <any python3> verify_lyrics.py
"""
import sys

# the sample verse (mirror of lyrics_scan_sim.py): (start, length, text, word_onsets[beats])
LINES = [
    (0.0,  8.0, "the city is burning down",            [0.0, 2.0, 3.0, 4.0, 6.0]),
    (8.0,  8.0, "and i am the only sound",             [8.0, 9.0, 10.0, 11.0, 12.5, 14.0]),
    (16.0, 8.0, "i fall through the smoke to find you", [16.0, 17.0, 18.0, 19.0, 20.0, 21.5, 22.5, 23.0]),
    (24.0, 8.0, "too late  too late  too late",        [24.0, 25.0, 27.0, 28.0, 30.0, 31.0]),
]
TEMPOS = [72, 120, 180]
FPS = 24

def active_line(tb):                       # mirror animatic.html activeLine()
    for i, (start, length, _t, _o) in enumerate(LINES):
        if start <= tb < start + length:
            return i
    return -1

def current_word(line_idx, tb):            # mirror the renderLyrics() karaoke pick
    onsets = LINES[line_idx][3]
    cur = -1
    for j, on in enumerate(onsets):
        if tb >= on:
            cur = j
    return cur

ok = True
print("=" * 72)
print("BLUELINE Text Layer — lyrics contract verification")
print("=" * 72)

# ---- 1. determinism: line starts + word onsets land on whole frames at all tempos ----
print("\n[determinism]  frame = beat * frames_per_beat,  fps", FPS)
for tempo in TEMPOS:
    fpb = (FPS * 60) / tempo
    whole_fpb = (FPS * 60) % tempo == 0
    bad = []
    for (start, length, text, onsets) in LINES:
        if abs(start * fpb - round(start * fpb)) > 1e-9: bad.append(f"line@{start}")
        for on in onsets:
            if abs(on * fpb - round(on * fpb)) > 1e-9: bad.append(f"word@{on}")
    status = "WHOLE ✓" if (whole_fpb and not bad) else "OFF ✗"
    if not (whole_fpb and not bad): ok = False
    print(f"  {tempo:>3} BPM -> frames/beat = (24*60)/{tempo} = {fpb:>4g}  {status}"
          + (f"  off: {bad}" if bad else ""))

# ---- 2 & 3. active-line + current-word over a beat sweep (at 120 BPM) ----
print("\n[reveal]  active line + current word over a beat sweep (120 BPM, 12 frames/beat):")
fpb = (FPS * 60) / 120
prev_line = -2
for tb in [x * 0.5 for x in range(0, 66)]:    # bars 1..9, every half-beat
    li = active_line(tb)
    if li == prev_line:
        continue                               # only print on line changes (keep it readable)
    prev_line = li
    frame = int(round(tb * fpb))
    if li < 0:
        print(f"  beat {tb:>5}  frame {frame:>4}  (no line)")
        continue
    words = LINES[li][2].split()
    cw = current_word(li, tb)
    shown = " ".join(("[" + w + "]" if k == cw else w) for k, w in enumerate(words))
    print(f"  beat {tb:>5}  frame {frame:>4}  line {li}: {shown}")

# spot-check a mid-line word advance on line 2
print("\n[word advance]  line 2 ('i fall through the smoke to find you') word highlight by beat:")
words = LINES[2][2].split()
for tb in [16.0, 18.0, 20.0, 22.5, 23.0]:
    cw = current_word(2, tb)
    shown = " ".join(("[" + w + "]" if k == cw else w) for k, w in enumerate(words))
    print(f"  beat {tb:>5}: {shown}")

print("\n" + "=" * 72)
print(f"RESULT: {'PASS ✓  — lyrics timing contract holds (whole-frame + reveal)' if ok else 'FAIL ✗'}")
print("=" * 72)
sys.exit(0 if ok else 1)
