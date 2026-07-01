"""Figure Rig — FACES matrix. Expressions × people (gender/age) × shots × styles."""

EXPR_PROMPT = {
    "neutral":   "a calm neutral expression",
    "smile":     "a warm broad happy smile, joyful",
    "laugh":     "laughing joyfully, open smiling mouth",
    "surprised": "a shocked surprised expression, eyes wide open, mouth agape",
    "angry":     "a furious angry expression, deeply furrowed brows, scowling",
    "sad":       "a sad sorrowful expression, downturned mouth, grief",
    "fear":      "a terrified fearful expression, wide frightened eyes",
    "disgust":   "a disgusted expression, wrinkled nose, sneer",
}

# people for the gender/age sweep (gender 0=female, 1=male; age 0.19=child,0.5=young,0.85=old)
PEOPLE = {
    "young_woman": {"gender": 0.0, "age": 0.5,  "subject": "a young adult woman"},
    "young_man":   {"gender": 1.0, "age": 0.5,  "subject": "a young adult man"},
    "girl":        {"gender": 0.0, "age": 0.16, "subject": "a young girl child"},
    "boy":         {"gender": 1.0, "age": 0.16, "subject": "a young boy child"},
    "old_woman":   {"gender": 0.0, "age": 0.9,  "subject": "an elderly old woman"},
    "old_man":     {"gender": 1.0, "age": 0.9,  "subject": "an elderly old man"},
}

SHOT_DESC = {
    "closeup": "extreme close-up portrait of a face",
    "medium":  "portrait, head and shoulders",
    "full":    "full body standing figure, face visible",
}

STYLES = [
    {"key": "storyboard", "label": "Storyboard ink", "style": "__LOCKED__"},
    {"key": "watercolor", "label": "Watercolor",
     "style": ("soft watercolor portrait, loose wet washes, delicate ink linework over color, "
               "muted palette, textured paper, gentle light, painterly, expressive")},
    {"key": "comic", "label": "Cel comic",
     "style": ("bold graphic novel cel-shaded portrait, thick black ink outlines, flat vivid colors, "
               "dramatic cel shading, halftone shadows, high contrast, expressive")},
]


def prompt_for(person_subject, expression, shot, style_text):
    return (f"{SHOT_DESC[shot]}, {person_subject} with {EXPR_PROMPT[expression]}, "
            f"detailed expressive face, {style_text}")


# plate-sets: (label, person_key, expression, shot). 20 sets → × 3 styles = 60 renders.
def plate_jobs():
    jobs = []
    for ex in ["neutral", "smile", "laugh", "surprised", "angry", "sad", "fear", "disgust"]:
        jobs.append((f"yw_{ex}", "young_woman", ex, "closeup"))        # expression sweep
    for pk in ["young_man", "girl", "boy", "old_woman", "old_man"]:
        for ex in ["smile", "angry"]:
            jobs.append((f"{pk}_{ex}", pk, ex, "closeup"))             # gender/age sweep
    for shot in ["medium", "full"]:
        jobs.append((f"yw_surprised_{shot}", "young_woman", "surprised", shot))  # distance sweep
    return jobs
