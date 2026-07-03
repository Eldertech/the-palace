"""Generate the dormant + awakening OpenPose rigs to complete the Stage-4
three-state set (triumphant = existing pose-3-openpose-rig.png).

Uses the same BODY_18 / COCO color palette + line widths as make_openpose_rig.py
so the downstream gorey-ink openpose ControlNet pass behaves identically.
"""
from PIL import Image, ImageDraw
from pathlib import Path

W = H = 1024
HERE = Path(__file__).parent

LIMBS = [
    ((1, 2),   (255, 0,   0)),
    ((1, 5),   (255, 85,  0)),
    ((2, 3),   (255, 170, 0)),
    ((3, 4),   (255, 255, 0)),
    ((5, 6),   (170, 255, 0)),
    ((6, 7),   (85,  255, 0)),
    ((1, 8),   (0,   255, 0)),
    ((8, 9),   (0,   255, 85)),
    ((9, 10),  (0,   255, 170)),
    ((1, 11),  (0,   255, 255)),
    ((11, 12), (0,   170, 255)),
    ((12, 13), (0,   85,  255)),
    ((1, 0),   (0,   0,   255)),
    ((0, 14),  (85,  0,   255)),
    ((0, 15),  (170, 0,   255)),
    ((14, 16), (255, 0,   255)),
    ((15, 17), (255, 0,   170)),
]
KP_COLORS = {
    0:(255,0,85), 1:(255,0,0), 2:(255,85,0), 3:(255,170,0), 4:(255,255,0),
    5:(170,255,0), 6:(85,255,0), 7:(0,255,0), 8:(0,255,85), 9:(0,255,170),
    10:(0,255,255), 11:(0,170,255), 12:(0,85,255), 13:(0,0,255),
    14:(85,0,255), 15:(170,0,255), 16:(255,0,255), 17:(255,0,170),
}

cx = W // 2

# DORMANT — gain 0. Cat slouched, head bowed, arms slack at sides, knees bent
# low (sitting/curled posture). Head dropped forward of neck.
DORMANT = {
    0:  (cx,        560),  # nose (head bowed, lower)
    1:  (cx,        540),  # neck (lowered)
    2:  (cx - 90,   555),  # R shoulder
    5:  (cx + 90,   555),  # L shoulder
    3:  (cx - 110,  670),  # R elbow (down)
    6:  (cx + 110,  670),  # L elbow
    4:  (cx - 120,  780),  # R wrist (resting low)
    7:  (cx + 120,  780),  # L wrist
    8:  (cx - 70,   780),  # R hip
    11: (cx + 70,   780),  # L hip
    9:  (cx - 130,  870),  # R knee (bent out, low)
    12: (cx + 130,  870),  # L knee
    10: (cx - 140,  950),  # R ankle
    13: (cx + 140,  950),  # L ankle
    14: (cx - 25,   555),  # R eye
    15: (cx + 25,   555),  # L eye
    16: (cx - 55,   555),  # R ear (drooped level)
    17: (cx + 55,   555),  # L ear
}

# AWAKENING — gain rising. Cat upright, head raised, arms reaching FORWARD-UP
# (not yet the full overhead V). One arm slightly higher than the other to read
# as "reaching, summoning".
AWAKENING = {
    0:  (cx,        360),  # nose (looking up)
    1:  (cx,        460),  # neck
    2:  (cx - 90,   470),  # R shoulder
    5:  (cx + 90,   470),  # L shoulder
    3:  (cx - 180,  390),  # R elbow (out & up, mid)
    6:  (cx + 180,  370),  # L elbow (slightly higher)
    4:  (cx - 250,  280),  # R wrist (reaching forward-up)
    7:  (cx + 250,  240),  # L wrist (higher, leading)
    8:  (cx - 70,   680),  # R hip
    11: (cx + 70,   680),  # L hip
    9:  (cx - 90,   830),  # R knee
    12: (cx + 90,   830),  # L knee
    10: (cx - 100,  960),  # R ankle
    13: (cx + 100,  960),  # L ankle
    14: (cx - 25,   345),  # R eye
    15: (cx + 25,   345),  # L eye
    16: (cx - 55,   355),  # R ear
    17: (cx + 55,   355),  # L ear
}

def render(kp, out_path):
    img = Image.new("RGB", (W, H), (0, 0, 0))
    draw = ImageDraw.Draw(img)
    for (a, b), color in LIMBS:
        draw.line([kp[a], kp[b]], fill=color, width=10)
    R = 8
    for i, (x, y) in kp.items():
        draw.ellipse([x - R, y - R, x + R, y + R], fill=KP_COLORS[i])
    img.save(out_path)
    print(f"wrote {out_path}")

render(DORMANT,   HERE / "pose-dormant-openpose-rig.png")
render(AWAKENING, HERE / "pose-awakening-openpose-rig.png")
