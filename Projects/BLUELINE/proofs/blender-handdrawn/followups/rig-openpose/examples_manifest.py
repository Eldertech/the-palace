"""
Figure Rig — examples matrix. 8 people × 3 styles, all guided by OpenPose.

Gender convention (verified from MPFB macro.json): 0.0 = female, 1.0 = male.
age: 0.19 = child boundary, 0.5 = young adult, 1.0 = old.
weight/muscle: 0.5 = average; <0.5 lean/thin, >0.5 heavy/muscular.

Poses are XYZ-Euler degrees on the MPFB `default`-rig bones (v3 convention:
upperleg/lowerleg local-X = sagittal swing (neg = forward), local-Z = abduction;
upperarm local-Z swings the arm up/out from rest, lowerarm-X bends the elbow).
"""

# Each person: macro body + a distinct pose + a prompt subject (the OpenPose holds the pose;
# the subject words tell the model who it is).
PEOPLE = [
    {
        "key": "young_girl", "label": "Young girl",
        "subject": "a young girl, a small child, slim child proportions, big head small body",
        "macro": {"gender": 0.0, "age": 0.12, "muscle": 0.5, "weight": 0.5, "height": 0.22},
        "seed": 3110,
        # skipping/playing — one knee up, arms swung out
        "pose": {
            "spine02": [-4, 0, 4],
            "upperleg01.L": [-58, 0, 12], "lowerleg01.L": [64, 0, 0], "foot.L": [-18, 0, 0],
            "upperleg01.R": [16, 0, -8], "lowerleg01.R": [10, 0, 0],
            "upperarm01.L": [0, 0, -68], "lowerarm01.L": [-28, 0, 0],
            "upperarm01.R": [0, 0, 62], "lowerarm01.R": [-30, 0, 0],
        },
    },
    {
        "key": "young_boy", "label": "Young boy",
        "subject": "a young boy, a small child, slim child proportions",
        "macro": {"gender": 1.0, "age": 0.12, "muscle": 0.5, "weight": 0.5, "height": 0.28},
        "seed": 3120,
        # running — opposed legs, pumping arms
        "pose": {
            "spine02": [9, 0, 0],
            "upperleg01.L": [-46, 0, 6], "lowerleg01.L": [52, 0, 0], "foot.L": [-12, 0, 0],
            "upperleg01.R": [40, 0, -6], "lowerleg01.R": [30, 0, 0],
            "upperarm01.L": [0, 0, -38], "lowerarm01.L": [-82, 0, 0],
            "upperarm01.R": [0, 0, 34], "lowerarm01.R": [-82, 0, 0],
        },
    },
    {
        "key": "thin_woman", "label": "Thin woman",
        "subject": "a slender thin adult woman, lean and graceful, narrow build",
        "macro": {"gender": 0.0, "age": 0.5, "muscle": 0.4, "weight": 0.18, "height": 0.5},
        "seed": 3130,
        # reaching one arm high, contrapposto
        "pose": {
            "spine02": [0, 0, -6], "spine03": [0, 0, -4],
            "upperarm01.R": [0, 0, 150], "lowerarm01.R": [-12, 0, 0],
            "upperarm01.L": [0, 0, -22], "lowerarm01.L": [-18, 0, 0],
            "upperleg01.L": [0, 0, 9], "upperleg01.R": [-6, 0, -7], "lowerleg01.R": [8, 0, 0],
        },
    },
    {
        "key": "thin_man", "label": "Thin man",
        "subject": "a thin lean adult man, slim narrow build, wiry",
        "macro": {"gender": 1.0, "age": 0.5, "muscle": 0.4, "weight": 0.2, "height": 0.6},
        "seed": 3140,
        # walking stride
        "pose": {
            "upperleg01.L": [-35, 0, 8], "lowerleg01.L": [20, 0, 0], "foot.L": [-10, 0, 0],
            "upperleg01.R": [35, 0, -8], "lowerleg01.R": [12, 0, 0], "foot.R": [-8, 0, 0],
            "upperarm01.L": [0, 0, -28], "lowerarm01.L": [-24, 0, 0],
            "upperarm01.R": [0, 0, 24], "lowerarm01.R": [-14, 0, 0],
        },
    },
    {
        "key": "big_woman", "label": "Big woman",
        "subject": "a large heavyset adult woman, full figured plus size, broad and soft",
        "macro": {"gender": 0.0, "age": 0.5, "muscle": 0.5, "weight": 0.92, "height": 0.5},
        "seed": 3150,
        # standing strong, arms out from the body, weight settled
        "pose": {
            "upperleg01.L": [0, 0, 13], "upperleg01.R": [0, 0, -13],
            "upperarm01.L": [0, 0, -46], "lowerarm01.L": [-30, 0, 0],
            "upperarm01.R": [0, 0, 46], "lowerarm01.R": [-30, 0, 0],
            "spine02": [-3, 0, 0],
        },
    },
    {
        "key": "big_man", "label": "Big man",
        "subject": "a large heavyset adult man, big and broad, heavy powerful build, barrel chest",
        "macro": {"gender": 1.0, "age": 0.5, "muscle": 0.5, "weight": 0.92, "height": 0.68},
        "seed": 3160,
        # wide power stance, arms held out
        "pose": {
            "upperleg01.L": [0, 0, 18], "lowerleg01.L": [6, 0, 0],
            "upperleg01.R": [0, 0, -18], "lowerleg01.R": [6, 0, 0],
            "upperarm01.L": [0, 0, -58], "lowerarm01.L": [-22, 0, 0],
            "upperarm01.R": [0, 0, 58], "lowerarm01.R": [-22, 0, 0],
            "spine02": [-5, 0, 0],
        },
    },
    {
        "key": "musc_woman", "label": "Muscular woman",
        "subject": "a muscular athletic adult woman, strong defined muscles, fit and powerful",
        "macro": {"gender": 0.0, "age": 0.5, "muscle": 0.92, "weight": 0.5, "height": 0.55},
        "seed": 3170,
        # action lunge, one arm thrust forward
        "pose": {
            "upperleg01.L": [-60, 0, 10], "lowerleg01.L": [72, 0, 0], "foot.L": [-20, 0, 0],
            "upperleg01.R": [22, 0, -6], "lowerleg01.R": [16, 0, 0],
            "upperarm01.R": [0, 0, 78], "lowerarm01.R": [-22, 0, 0],
            "upperarm01.L": [0, 0, -34], "lowerarm01.L": [-30, 0, 0],
            "spine02": [6, 0, 2],
        },
    },
    {
        "key": "musc_man", "label": "Muscular man",
        "subject": "a muscular bodybuilder adult man, powerful defined muscles, athletic hero physique",
        "macro": {"gender": 1.0, "age": 0.5, "muscle": 0.92, "weight": 0.55, "height": 0.66},
        "seed": 3180,
        # heroic, both arms raised
        "pose": {
            "upperarm01.L": [0, 0, -118], "lowerarm01.L": [-88, 0, 0],
            "upperarm01.R": [0, 0, 118], "lowerarm01.R": [-88, 0, 0],
            "upperleg01.L": [0, 0, 14], "upperleg01.R": [0, 0, -14],
            "spine02": [-4, 0, 0],
        },
    },
]

# 3 styles. style 1 is the locked BLUELINE pen-flow (the "drawing/animatic/storyboard"
# Loudon always wants); "__LOCKED__" tells the renderer to pull render_shot.STYLE_TXT.
STYLES = [
    {
        "key": "storyboard", "label": "Storyboard ink",
        "style": "__LOCKED__",
    },
    {
        "key": "watercolor", "label": "Watercolor concept",
        "style": ("soft watercolor concept art, loose wet washes, delicate ink linework over color, "
                  "muted earthy palette, textured cold-press paper, gentle natural light, painterly, "
                  "illustrative, atmospheric"),
    },
    {
        "key": "comic", "label": "Cel comic",
        "style": ("bold graphic novel cel-shaded illustration, thick confident black ink outlines, "
                  "flat vivid saturated colors, dramatic cel shading, halftone dot shadows, "
                  "dynamic comic book panel, high contrast"),
    },
]
