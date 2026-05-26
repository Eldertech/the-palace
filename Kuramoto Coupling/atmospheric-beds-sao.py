"""
Atmospheric Beds — Stable Audio Open, Kuramoto Coupling Track A

Two short SAO renders for the Round 1 teaching reel:

1. opening-bed.wav — ~6 s cinematic opening swell. Plays under the first
   seconds of the uncoupled-narration to mark the start of the lesson
   (one of the rule "every section of an educational video has voiceover"
   — the bed is *additive* to the VO, never a replacement for it).

2. title-bed.wav — ~6 s thoughtful transition under the "Now, couple them"
   title card. Marks the pivot from drift to lock without overwhelming the
   narration.

Both target a single SAO model load. Per the Specialist's Resource
Footprint section the model lives on MPS; first generation includes a
model-load cost of 30–90 s on a fresh boot.

Dispatched by Maker.  Specialist: Stable Audio Open.  Tier: Sketch.
"""

from __future__ import annotations

import json
import sys
import time
from dataclasses import dataclass
from pathlib import Path

import torch
import torchaudio
from stable_audio_tools import get_pretrained_model
from stable_audio_tools.inference.generation import generate_diffusion_cond


BUNDLE = Path(__file__).parent
MODEL_ID = "stabilityai/stable-audio-open-1.0"
DEVICE = "mps" if torch.backends.mps.is_available() else "cpu"
STEPS = 100
CFG_SCALE = 7.0
SAMPLER = "dpmpp-3m-sde"
SIGMA_MIN, SIGMA_MAX = 0.3, 500.0


@dataclass(frozen=True)
class Bed:
    slug: str
    prompt: str
    seconds: int


BEDS = (
    Bed(
        slug="opening-bed",
        prompt=(
            "cinematic film-score opening, ethereal sustained pad, "
            "dark contemplative atmosphere, warm low strings rising slowly, "
            "subtle low bell tones, educational documentary intro, "
            "indigo emotional color, no melody just texture, "
            "builds gently then settles"
        ),
        seconds=6,
    ),
    Bed(
        slug="title-bed",
        prompt=(
            "thoughtful contemplative transition, gentle synthesizer pad "
            "with a soft bell strike at the start, suspended chord that "
            "hints at coming resolution, calm anticipation, "
            "atmospheric texture, amber warm light feel, no rhythm, "
            "spacious and patient"
        ),
        seconds=6,
    ),
)


def main() -> int:
    print(f"loading {MODEL_ID} on {DEVICE}...")
    t0 = time.time()
    model, cfg = get_pretrained_model(MODEL_ID)
    sample_rate = cfg["sample_rate"]
    sample_size = cfg["sample_size"]
    model = model.to(DEVICE)
    print(f"loaded in {time.time() - t0:.1f}s  sr={sample_rate}  sample_size={sample_size}")

    reports = []
    for bed in BEDS:
        t1 = time.time()
        conditioning = [{
            "prompt": bed.prompt,
            "seconds_start": 0,
            "seconds_total": bed.seconds,
        }]
        # generate_diffusion_cond returns shape [B, channels, samples] on CPU.
        output = generate_diffusion_cond(
            model,
            steps=STEPS,
            cfg_scale=CFG_SCALE,
            conditioning=conditioning,
            sample_size=sample_size,
            sigma_min=SIGMA_MIN,
            sigma_max=SIGMA_MAX,
            sampler_type=SAMPLER,
            device=DEVICE,
        )
        wav = output.squeeze(0).to(torch.float32).cpu()
        # Trim to the requested seconds — model always outputs sample_size frames.
        wav = wav[:, : bed.seconds * sample_rate]
        # Peak normalize to -1 dBFS so it lives quietly under a -16 LUFS VO.
        peak = wav.abs().max().item()
        if peak > 0:
            wav = wav * (10 ** (-1.0 / 20) / peak)
        out_path = BUNDLE / f"{bed.slug}.wav"
        torchaudio.save(str(out_path), wav, sample_rate)
        gen_time = time.time() - t1
        report = {
            "slug": bed.slug,
            "prompt": bed.prompt,
            "duration_sec": bed.seconds,
            "sample_rate_hz": sample_rate,
            "channels": int(wav.shape[0]),
            "steps": STEPS,
            "cfg_scale": CFG_SCALE,
            "sampler": SAMPLER,
            "device": DEVICE,
            "model": MODEL_ID,
            "generation_time_sec": round(gen_time, 2),
            "peak_dbfs": -1.0,
            "tier_used": "sketch",
            "status": "ok",
        }
        (BUNDLE / f"{bed.slug}.report.json").write_text(json.dumps(report, indent=2) + "\n")
        reports.append(report)
        print(f"{bed.slug}: {bed.seconds}s, {gen_time:.1f}s generation, {wav.shape}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
