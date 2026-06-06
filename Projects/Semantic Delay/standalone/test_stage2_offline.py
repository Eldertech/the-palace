"""
Semantic Delay — Stage 2 offline end-to-end test
=================================================

Proves the standalone instrument works against the Stage-1 pass-through daemon
over a real Unix socket, with no microphone and no model:

  synthetic WAV  ->  PhraseSegmenter  ->  daemon.convert (stub)  ->
  DelayEngine    ->  WAV out

Assertions:
  * the daemon round-trips (hello, prompts.register, convert),
  * exactly one phrase is segmented from one tone burst,
  * the dry copy lands at the original time,
  * a delayed (wet) copy of the phrase appears ~`delay` seconds later,
  * the gap between dry and wet is quiet (the echo is genuinely delayed).

Run directly:  python test_stage2_offline.py
"""

from __future__ import annotations

import os
import subprocess
import sys
import tempfile
import time
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
DAEMON_DIR = HERE.parent / "daemon"
sys.path.insert(0, str(DAEMON_DIR))
sys.path.insert(0, str(HERE))

from audio_io import f32_to_bytes, read_wav_mono, write_wav_mono  # noqa: E402
from client import DaemonClient  # noqa: E402
import instrument  # noqa: E402
from audio_io import WavFileSink, WavFileSource  # noqa: E402


def _make_input(path: Path, sr: int) -> tuple[float, float]:
    """0.5s silence, 0.6s tone burst, 0.5s silence. Returns (burst_start, burst_end) sec."""
    pre, burst, post = 0.5, 0.6, 0.5
    t = np.arange(int(burst * sr)) / sr
    tone = 0.3 * np.sin(2 * np.pi * 220.0 * t).astype(np.float32)
    audio = np.concatenate([
        np.zeros(int(pre * sr), np.float32),
        tone,
        np.zeros(int(post * sr), np.float32),
    ])
    write_wav_mono(path, audio, sr)
    return pre, pre + burst


def _energy_in_window(audio: np.ndarray, sr: int, t0: float, t1: float) -> float:
    a = audio[int(t0 * sr):int(t1 * sr)]
    return float(np.sqrt(np.mean(np.square(a)) + 1e-12)) if len(a) else 0.0


def _wait_for_daemon(sock: Path, timeout: float = 10.0) -> None:
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        if sock.exists():
            try:
                with DaemonClient(sock) as c:
                    info = c.hello()
                    if info.get("model", {}).get("loaded"):
                        return
            except Exception:
                pass
        time.sleep(0.1)
    raise TimeoutError(f"daemon socket {sock} not ready within {timeout}s")


def main() -> int:
    sr = 48000
    delay = 1.0
    with tempfile.TemporaryDirectory() as td:
        td = Path(td)
        sock = td / "daemon.sock"
        pid = td / "daemon.pid"
        prompts = td / "prompts"
        in_wav = td / "in.wav"
        out_wav = td / "out.wav"
        burst_start, burst_end = _make_input(in_wav, sr)

        proc = subprocess.Popen(
            [sys.executable, str(DAEMON_DIR / "semantic_delay_daemon.py"),
             "--sock", str(sock), "--pidfile", str(pid),
             "--prompts-dir", str(prompts), "--log-level", "WARNING"],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        )
        try:
            _wait_for_daemon(sock)

            # Register a dummy prompt so convert() resolves it.
            with DaemonClient(sock) as c:
                dummy = (0.05 * np.random.randn(sr)).astype(np.float32)
                reg = c.prompts_register("spirit.test.v1", "Test", f32_to_bytes(dummy), sr)
                assert reg["ok"], reg
                lst = c.prompts_list()
                assert any(p["id"] == "spirit.test.v1" for p in lst["prompts"]), lst

            converter = instrument.PhraseConverter(sock, "spirit.test.v1", sr)
            info = converter.hello()
            assert info["model"]["loaded"], info
            source = WavFileSource(in_wav, block_size=512)
            sink = WavFileSink(out_wav, sr)
            stats = instrument.run(source, sink, converter,
                                   delay_sec=delay, dry_gain=0.7, wet_gain=0.9,
                                   realtime=False, verbose=True)
            converter.close()
            sink.close()

            assert stats["phrases"] == 1, f"expected 1 phrase, got {stats['phrases']}"

            out, out_sr = read_wav_mono(out_wav)
            assert out_sr == sr
            # The echo is scheduled at (phrase_end + delay); the phrase the
            # segmenter captured ends after its hangover, so derive the wet
            # window from the reported phrase end rather than the raw tone.
            phrase_end_s = stats["phrase_ends"][0] / sr
            wet_start = phrase_end_s + delay
            dry_e = _energy_in_window(out, sr, burst_start, burst_end)
            wet_e = _energy_in_window(out, sr, wet_start, wet_start + 0.6)
            gap_e = _energy_in_window(out, sr, burst_end + 0.4, wet_start - 0.1)

            print(f"\nstats: {stats}")
            print(f"dry energy  [{burst_start:.2f}-{burst_end:.2f}s]      = {dry_e:.4f}")
            print(f"wet energy  [{wet_start:.2f}-{wet_start+0.6:.2f}s] = {wet_e:.4f}")
            print(f"gap energy  (between)                 = {gap_e:.4f}")

            assert dry_e > 0.05, f"dry too quiet: {dry_e}"
            assert wet_e > 0.05, f"wet (delayed) copy missing: {wet_e}"
            assert gap_e < dry_e * 0.3, f"gap not quiet — echo not delayed cleanly: {gap_e}"
            print("\nPASS — Stage 2 offline round-trip verified against the stub daemon.")
            return 0
        finally:
            try:
                with DaemonClient(sock) as c:
                    c.shutdown()
            except Exception:
                pass
            try:
                proc.wait(timeout=3)
            except Exception:
                proc.kill()


if __name__ == "__main__":
    raise SystemExit(main())
