"""Generate a 1024x1024 OpenPose rig PNG for an upright cat, arms-overhead.

Standard OpenPose-18 keypoint color scheme (BODY_18 / COCO). Black background,
colored circles at joints, colored bone lines. Used as ControlNet input for the
Pose-3 (67% possessed, arms wide overhead) Retrospective Delay character probe.
"""
from PIL import Image, ImageDraw
from pathlib import Path

W = H = 1024
OUT = Path(__file__).parent / "pose-3-openpose-rig.png"

# OpenPose BODY_18 indices (COCO order used by ControlNet OpenPose preprocessors):
# 0 nose, 1 neck, 2 R-shoulder, 3 R-elbow, 4 R-wrist, 5 L-shoulder, 6 L-elbow,
# 7 L-wrist, 8 R-hip, 9 R-knee, 10 R-ankle, 11 L-hip, 12 L-knee, 13 L-ankle,
# 14 R-eye, 15 L-eye, 16 R-ear, 17 L-ear

# Anthropomorphic upright cat, arms stretched wide OVERHEAD (V-shape up).
# Image space: (x, y), y grows downward. Center the figure.
cx = W // 2
# Keypoint coords tuned so both wrists are well above the head (overhead V).
kp = {
    0:  (cx,        320),  # nose (face center, slightly above neck)
    1:  (cx,        420),  # neck
    2:  (cx - 90,   430),  # R shoulder
    5:  (cx + 90,   430),  # L shoulder
    3:  (cx - 230,  300),  # R elbow (out & up)
    6:  (cx + 230,  300),  # L elbow
    4:  (cx - 340,  140),  # R wrist (high overhead)
    7:  (cx + 340,  140),  # L wrist
    8:  (cx - 70,   650),  # R hip
    11: (cx + 70,   650),  # L hip
    9:  (cx - 90,   810),  # R knee
    12: (cx + 90,   810),  # L knee
    10: (cx - 100,  950),  # R ankle
    13: (cx + 100,  950),  # L ankle
    14: (cx - 25,   305),  # R eye
    15: (cx + 25,   305),  # L eye
    16: (cx - 55,   315),  # R ear
    17: (cx + 55,   315),  # L ear
}

# Bone limb pairs and the standard OpenPose limb colors (RGB).
# Colors follow the canonical OpenPose / controlnet-aux palette.
LIMBS = [
    ((1, 2),   (255, 0,   0)),    # neck -> R shoulder
    ((1, 5),   (255, 85,  0)),    # neck -> L shoulder
    ((2, 3),   (255, 170, 0)),    # R shoulder -> R elbow
    ((3, 4),   (255, 255, 0)),    # R elbow -> R wrist
    ((5, 6),   (170, 255, 0)),    # L shoulder -> L elbow
    ((6, 7),   (85,  255, 0)),    # L elbow -> L wrist
    ((1, 8),   (0,   255, 0)),    # neck -> R hip
    ((8, 9),   (0,   255, 85)),   # R hip -> R knee
    ((9, 10),  (0,   255, 170)),  # R knee -> R ankle
    ((1, 11),  (0,   255, 255)),  # neck -> L hip
    ((11, 12), (0,   170, 255)),  # L hip -> L knee
    ((12, 13), (0,   85,  255)),  # L knee -> L ankle
    ((1, 0),   (0,   0,   255)),  # neck -> nose
    ((0, 14),  (85,  0,   255)),  # nose -> R eye
    ((0, 15),  (170, 0,   255)),  # nose -> L eye
    ((14, 16), (255, 0,   255)),  # R eye -> R ear
    ((15, 17), (255, 0,   170)),  # L eye -> L ear
]

# Per-keypoint dot colors (canonical OpenPose).
KP_COLORS = {
    0:  (255, 0,   85),
    1:  (255, 0,   0),
    2:  (255, 85,  0),
    3:  (255, 170, 0),
    4:  (255, 255, 0),
    5:  (170, 255, 0),
    6:  (85,  255, 0),
    7:  (0,   255, 0),
    8:  (0,   255, 85),
    9:  (0,   255, 170),
    10: (0,   255, 255),
    11: (0,   170, 255),
    12: (0,   85,  255),
    13: (0,   0,   255),
    14: (85,  0,   255),
    15: (170, 0,   255),
    16: (255, 0,   255),
    17: (255, 0,   170),
}

img = Image.new("RGB", (W, H), (0, 0, 0))
draw = ImageDraw.Draw(img)

# Bones (thick lines).
LIMB_WIDTH = 10
for (a, b), color in LIMBS:
    draw.line([kp[a], kp[b]], fill=color, width=LIMB_WIDTH)

# Joints (filled circles).
R = 8
for i, (x, y) in kp.items():
    draw.ellipse([x - R, y - R, x + R, y + R], fill=KP_COLORS[i])

img.save(OUT)
print(f"wrote {OUT}")
