"""
Speech Rhythm and Groove Narration — Kuramoto Coupling, Step 3

Reads the *speech rhythm and groove coupling* paragraph from the entry,
synthesizes a Sketch-tier narration via Kokoro, writes a single WAV.

Dispatched by Maker.  Specialist: Kokoro.
Project: Kuramoto Coupling.  Tier: Sketch (af_heart default voice, 24 kHz mono).
"""

from pathlib import Path

import numpy as np
import soundfile as sf
from kokoro import KPipeline


TEXT = (
    "When a speaker's phrases fall into a groove with a listener's attention cycles, "
    "comprehension increases and the interaction feels effortless. "
    "This is Kuramoto coupling. "
    "The listener's attention has a natural frequency, "
    "related to working memory refresh rate, "
    "approximately four to eight hertz in the theta band, "
    "and a well-paced speaker entrains to it. "
    "In music, groove is the condition where the rhythmic information density "
    "matches the listener's coupled attention oscillators. "
    "A drummer who drags or rushes is detuning the coupling. "
    "The coupling constant K is phrasing density and rhythmic clarity."
)

VOICE = "af_heart"
SAMPLE_RATE = 24000
INTER_CHUNK_SILENCE_SEC = 0.25

OUT_PATH = Path(__file__).parent / "speech-rhythm-and-groove-narration.wav"


def main() -> None:
    pipeline = KPipeline(lang_code="a")
    silence = np.zeros(int(SAMPLE_RATE * INTER_CHUNK_SILENCE_SEC), dtype=np.float32)

    chunks = []
    for _grapheme, _phoneme, audio in pipeline(TEXT, voice=VOICE, speed=1.0):
        if hasattr(audio, "detach"):
            audio = audio.detach().cpu().numpy()
        chunks.append(np.asarray(audio, dtype=np.float32))
        chunks.append(silence)

    if chunks and chunks[-1] is silence:
        chunks.pop()

    waveform = np.concatenate(chunks)
    sf.write(OUT_PATH, waveform, SAMPLE_RATE, subtype="PCM_16")

    peak = float(np.max(np.abs(waveform)))
    duration_sec = len(waveform) / SAMPLE_RATE
    print(f"wrote {OUT_PATH.name}  duration={duration_sec:.2f}s  peak={peak:.3f}")


if __name__ == "__main__":
    main()
