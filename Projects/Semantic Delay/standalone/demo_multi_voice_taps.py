"""
Semantic Delay — Multi-voice taps demo (Stage 3 wiring proof)
=============================================================

Drives the stub daemon with **N prompt_ids in parallel for each phrase**,
scheduling each returned audio as its own delay tap. This is the spirit-
pantheon affordance from the Phase 1 plan §Stage 3, expressed concretely
*before* the real model is wired Mac-side — the wiring proves out against
the pass-through stub, then comes alive sonically once Stage 1.5 lands.

Since the stub returns input unchanged, the three taps are timing-distinct
but timbre-identical (they all carry the same dry phrase). With the real
SoulX-Singer-SVC behind the socket, each tap inherits the timbre of its
own registered prompt_wav — the same scheduling code, no surgery.

Run (after launching the stub daemon):
    python3 semantic_delay_daemon.py        # in one terminal
    python3 demo_multi_voice_taps.py        # in another
"""

from __future__ import annotations

import os
import subprocess
import sys
import time
from pathlib import Path

import numpy as np

_HERE = Path(__file__).resolve().parent
_DAEMON_DIR = _HERE.parent / "daemon"
sys.path.insert(0, str(_DAEMON_DIR))
sys.path.insert(0, str(_HERE))

from client import DaemonClient  # noqa: E402

from audio_io import WavFileSink, bytes_to_f32, f32_to_bytes  # noqa: E402
from delay_engine import DelayEngine  # noqa: E402
from segmenter import PhraseSegmenter  # noqa: E402


SR = 24000
BS = 512
DELAY_SEC = 0.5
SPIRITS = ["spirit.anansi.v1", "spirit.eshu.v1", "spirit.huehuecoyotl.v1"]


def _synthetic_phrase(sr: int) -> np.ndarray:
    """0.9s of voice-band tone burst with a soft envelope, padded with silence."""
    pre = np.zeros(int(0.5 * sr), dtype=np.float32)
    t = np.arange(int(0.9 * sr), dtype=np.float32) / sr
    burst = 0.4 * np.sin(2 * np.pi * 220 * t).astype(np.float32)
    env = np.minimum(1.0, np.minimum(t * 20, (0.9 - t) * 20)).astype(np.float32)
    burst *= np.clip(env, 0.0, 1.0)
    post = np.zeros(int(0.6 * sr), dtype=np.float32)
    return np.concatenate([pre, burst, post])


def main() -> int:
    sock = Path(f"/tmp/semantic-delay-{os.getuid()}/daemon.sock")
    if not sock.exists():
        print(f"daemon socket not found at {sock}; start semantic_delay_daemon.py first",
              file=sys.stderr)
        return 1

    cli = DaemonClient(sock)
    cli.connect()
    info = cli.hello()
    print(f"daemon: {info.get('build')} model.loaded={info['model']['loaded']}")

    # Register three "spirit" prompts — under the stub, all aliases of one wav.
    spirit_wav = (0.2 * np.random.default_rng(7).standard_normal(SR).astype(np.float32))
    for sid in SPIRITS:
        cli.prompts_register(sid, sid, f32_to_bytes(spirit_wav), SR)
    print(f"registered {len(SPIRITS)} spirits: {SPIRITS}")

    audio = _synthetic_phrase(SR)
    seg = PhraseSegmenter(SR, BS, threshold_db=-45.0)
    phrases = []
    for i in range(0, len(audio), BS):
        block = audio[i:i + BS]
        if len(block) < BS:
            block = np.pad(block, (0, BS - len(block)))
        phrases.extend(seg.push(block))
    phrases.extend(seg.finish())
    assert len(phrases) == 1, f"expected 1 phrase, got {len(phrases)}"
    ph = phrases[0]
    print(f"phrase: {len(ph.audio)/SR:.2f}s @ end={ph.end_sample/SR:.2f}s")

    engine = DelayEngine(SR)
    delay_samples = round(DELAY_SEC * SR)
    base = ph.end_sample

    # The spirit-pantheon move: one convert per spirit, each as its own tap.
    for k, sid in enumerate(SPIRITS):
        t0 = time.monotonic()
        res = cli.convert(sid, f32_to_bytes(ph.audio), SR, n_steps=8, cfg=2.0)
        wet = bytes_to_f32(res.audio_out)
        gain = 0.9 * (0.7 ** k)  # gentle per-tap decay to read as a train
        at = base + (k + 1) * delay_samples
        engine.schedule_phrase(wet, at, wet_gain=gain, taps=1, delay_samples=0)
        print(f"  tap {k+1} [{sid}] gain={gain:.2f} at={at/SR:.2f}s "
              f"({(time.monotonic()-t0)*1000:.0f} ms)")

    # Render the wet output, mixed with the dry phrase placed at its original time.
    total = base + (len(SPIRITS) + 2) * delay_samples
    dry = np.zeros(total, dtype=np.float32)
    dry_start = ph.end_sample - len(ph.audio)
    dry[dry_start:dry_start + len(ph.audio)] = ph.audio * 0.7
    wet = np.zeros(total, dtype=np.float32)
    cursor = 0
    while cursor < total:
        n = min(BS, total - cursor)
        wet[cursor:cursor + n] = engine.render(n)
        cursor += n
    mix = (dry + wet).clip(-1.0, 1.0)

    out_path = _HERE / "demo" / "stage3-multi-voice-taps-demo.wav"
    out_path.parent.mkdir(exist_ok=True)
    sink = WavFileSink(out_path, SR)
    sink.write(mix)
    sink.close()

    # Energy assertions: dry intact, three distinct wet windows.
    def energy(a, t0, t1):
        return float(np.sqrt(np.mean(a[round(t0 * SR):round(t1 * SR)] ** 2)))
    print(f"\noutput: {out_path}")
    print(f"dry  [0.50–1.40s]   = {energy(mix, 0.50, 1.40):.4f}")
    for k in range(len(SPIRITS)):
        lo = 1.41 + (k + 1) * DELAY_SEC
        hi = lo + 0.9
        print(f"tap{k+1} [{lo:.2f}–{hi:.2f}s] = {energy(mix, lo, hi):.4f}")

    cli.close()
    print("\nWIRING PROOF — three spirit converts dispatched, three taps scheduled.")
    print("Stub: timbre identical. Real model (Stage 1.5): each tap inherits its prompt voice.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
