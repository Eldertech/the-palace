"""
Atmospheric Beds — Stable Audio 3, Kuramoto Coupling Track A

Three SA3 renders for the Round 1 teaching reel + hub entry:

1. opening-bed.wav — ~6 s cinematic opening pad under the uncoupled
   narration (model: small-music).

2. title-bed.wav — ~6 s thoughtful transition under the "Now, couple
   them" title card (model: small-music).

3. synchronization-arriving.wav — ~20 s atmospheric SFX piece probing
   whether SA3 can do narrative arc, not just texture (model: small-sfx).
   This one slots into the hub entry near the sync-arriving video as a
   parallel auditory rendering of the same idea.

Per the new Shop rule, atmospheric beds are additive to voiceover, never
replacements. Output WAVs are peak-normalized to −1 dBFS so they sit
quietly under the −16 LUFS Kokoro voiceover when ffmpeg mixes them.

Dispatched by Maker.  Specialist: Stable Audio 3.  Tier: Sketch.
"""

from __future__ import annotations

import json
import sys
import time
from dataclasses import dataclass
from pathlib import Path

import torch
import torchaudio
from stable_audio_3 import StableAudioModel


BUNDLE = Path(__file__).parent
DEVICE = "mps" if torch.backends.mps.is_available() else "cpu"


@dataclass(frozen=True)
class Job:
    slug: str
    model_id: str   # "small-music" or "small-sfx"
    prompt: str
    seconds: int


JOBS = (
    Job(
        slug="opening-bed",
        model_id="small-music",
        prompt=(
            "cinematic film-score opening, ethereal sustained pad, "
            "dark contemplative atmosphere, warm low strings rising slowly, "
            "subtle low bell tones, educational documentary intro, "
            "no melody just texture, builds gently then settles, "
            "no percussion"
        ),
        seconds=6,
    ),
    Job(
        slug="title-bed",
        model_id="small-music",
        prompt=(
            "thoughtful contemplative transition, gentle synthesizer pad "
            "with a soft bell strike at the start, suspended chord that "
            "hints at coming resolution, calm anticipation, "
            "atmospheric texture, warm amber feel, spacious and patient, "
            "no rhythm, no melody"
        ),
        seconds=6,
    ),
    Job(
        slug="synchronization-arriving",
        model_id="small-sfx",
        prompt=(
            "the sound of synchronization arriving, scattered ticking and "
            "beating pulses at slightly different rates that gradually pull "
            "into a shared rhythm and lock together, mechanical to organic, "
            "phase-locking, coherence emerging from incoherence, "
            "ambient texture with a clear arc from chaos to order"
        ),
        seconds=20,
    ),
)


def main() -> int:
    print(f"device={DEVICE}")
    models_cache: dict[str, StableAudioModel] = {}
    reports = []

    for job in JOBS:
        if job.model_id not in models_cache:
            print(f"loading {job.model_id}...")
            t0 = time.time()
            model = StableAudioModel.from_pretrained(job.model_id)
            print(f"  loaded in {time.time() - t0:.1f}s")
            models_cache[job.model_id] = model
        model = models_cache[job.model_id]

        t1 = time.time()
        audio = model.generate(prompt=job.prompt, duration=job.seconds)
        gen_time = time.time() - t1

        # audio is a torch tensor [channels, samples] or [batch, channels, samples].
        if audio.dim() == 3:
            audio = audio[0]
        # Peak-normalize to -1 dBFS so it sits under -16 LUFS VO.
        peak = audio.abs().max().item()
        if peak > 0:
            audio = audio * (10 ** (-1.0 / 20) / peak)
        sample_rate = 44_100  # SA3 SAME autoencoder native rate

        out_path = BUNDLE / f"{job.slug}.wav"
        torchaudio.save(str(out_path), audio.cpu(), sample_rate)

        report = {
            "slug": job.slug,
            "model_id": job.model_id,
            "prompt": job.prompt,
            "duration_sec": job.seconds,
            "sample_rate_hz": sample_rate,
            "channels": int(audio.shape[0]),
            "device": DEVICE,
            "generation_time_sec": round(gen_time, 2),
            "peak_dbfs": -1.0,
            "tier_used": "sketch",
            "status": "ok",
        }
        (BUNDLE / f"{job.slug}.report.json").write_text(json.dumps(report, indent=2) + "\n")
        reports.append(report)
        print(f"{job.slug}: {job.seconds}s, gen={gen_time:.2f}s, shape={tuple(audio.shape)}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
