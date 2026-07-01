"""
Figure Rig — HANDS matrix. Poses (fist, point, multi-angle) + holding objects
(glass of water, fabric, snake, flower), each at closeup / medium / full, in 3 styles.
All guided by the 21-keypoint hand OpenPose from the rig's finger bones.
"""

SUBJECTS = [
    {"key": "fist",       "hand_pose": "fist",  "angle": 0,  "action": "clenched into a tight fist",
     "object": "", "shots": ["closeup", "medium", "full"]},
    {"key": "fist_side",  "hand_pose": "fist",  "angle": 50, "action": "clenched into a tight fist, three-quarter side view",
     "object": "", "shots": ["closeup"]},
    {"key": "point",      "hand_pose": "point", "angle": 0,  "action": "pointing with one extended index finger",
     "object": "", "shots": ["closeup", "medium", "full"]},
    {"key": "point_side", "hand_pose": "point", "angle": 45, "action": "pointing with one extended index finger, three-quarter side view",
     "object": "", "shots": ["closeup"]},
    {"key": "glass",      "hand_pose": "grip",  "angle": 0,  "action": "holding",
     "object": " a clear drinking glass of water", "shots": ["closeup", "medium", "full"]},
    {"key": "fabric",     "hand_pose": "grip",  "angle": 0,  "action": "holding",
     "object": " a piece of soft draping cloth fabric", "shots": ["closeup", "medium", "full"]},
    {"key": "snake",      "hand_pose": "grip",  "angle": 0,  "action": "holding",
     "object": " a small snake coiling around the fingers", "shots": ["closeup", "medium", "full"]},
    {"key": "flower",     "hand_pose": "pinch", "angle": 0,  "action": "holding",
     "object": " a single delicate flower by the stem", "shots": ["closeup", "medium", "full"]},
]

SHOT_DESC = {
    "closeup": "extreme close-up photograph of a single human hand",
    "medium":  "medium shot of a person from the chest up, one hand raised and prominent",
    "full":    "full body shot of a person standing, one hand raised and visible",
}

STYLES = [
    {"key": "storyboard", "label": "Storyboard ink", "style": "__LOCKED__"},
    {"key": "watercolor", "label": "Watercolor concept",
     "style": ("soft watercolor concept art, loose wet washes, delicate ink linework over color, "
               "muted earthy palette, textured cold-press paper, gentle natural light, painterly")},
    {"key": "comic", "label": "Cel comic",
     "style": ("bold graphic novel cel-shaded illustration, thick confident black ink outlines, "
               "flat vivid saturated colors, dramatic cel shading, halftone dot shadows, high contrast")},
]


def prompt_for(subj, shot, style_text):
    obj = subj["object"]
    hand_clause = f"the hand {subj['action']}{obj}" if obj else f"a hand {subj['action']}"
    return f"{SHOT_DESC[shot]}, {hand_clause}, detailed fingers, {style_text}"


# (subject, shot) plate-sets to stage in Blender
def plate_jobs():
    jobs = []
    for s in SUBJECTS:
        for shot in s["shots"]:
            jobs.append({"key": f"{s['key']}_{shot}", "subject": s["key"],
                         "hand_pose": s["hand_pose"], "angle": s["angle"], "shot": shot})
    return jobs
