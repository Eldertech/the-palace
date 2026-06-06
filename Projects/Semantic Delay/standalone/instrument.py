"""
Semantic Delay — Standalone instrument (Stage 2)
================================================

The first playable moment of the Phase 1 plan. Wires the pieces together:

    AudioSource -> PhraseSegmenter -> [daemon.convert over the wire] ->
    DelayEngine (scheduled playback) -> AudioSink

Conversion runs on a **background worker thread** (PhraseConverter) so the
audio loop is never blocked on daemon IPC — the same thread split the VST will
use at Stage 5. Scheduling is by absolute sample index (phrase end + delay), so
a conversion that finishes any time before its scheduled playback sample still
lands in the right place; with the Stage-1 pass-through stub (RTF≈0) that is
always true, and with the real model a delay of several seconds covers the
RTF≈1.65 conversion cost measured at Stage 0.

Two modes share one loop:
  * Offline: `--input file.wav --output out.wav`. Runs anywhere, no hardware.
    This is what the end-to-end test drives against the stub daemon.
  * Live:    `--input mic --output speaker`. Needs sounddevice (Mac path).

Connects to a running daemon (RPC v0.1). Start the daemon first:
    python ../daemon/semantic_delay_daemon.py
"""

from __future__ import annotations

import argparse
import queue
import sys
import threading
import time
from pathlib import Path
from typing import List, Optional, Tuple

import numpy as np

# Import the reference client from the sibling daemon bundle.
_DAEMON_DIR = Path(__file__).resolve().parent.parent / "daemon"
if str(_DAEMON_DIR) not in sys.path:
    sys.path.insert(0, str(_DAEMON_DIR))
from client import DaemonClient  # noqa: E402

from audio_io import (  # noqa: E402
    AudioSink,
    AudioSource,
    LiveMicSource,
    LiveSpeakerSink,
    WavFileSink,
    WavFileSource,
    bytes_to_f32,
    f32_to_bytes,
    read_wav_mono,
)
from delay_engine import DelayEngine  # noqa: E402
from segmenter import Phrase, PhraseSegmenter  # noqa: E402


class PhraseConverter:
    """Sends phrases to the daemon on a worker thread; results drained by index.

    `submit(phrase)` enqueues a conversion. `drain_ready()` returns the
    (phrase, wet_audio) pairs finished so far. `outstanding` counts in-flight
    work so the caller can wait for the tail before draining the delay line.
    """

    def __init__(self, sock_path: Path, prompt_id: str, sample_rate: int,
                 *, n_steps: int = 32, cfg: float = 3.0):
        self._client = DaemonClient(sock_path)
        self._client.connect()
        self.prompt_id = prompt_id
        self.sample_rate = sample_rate
        self.n_steps = n_steps
        self.cfg = cfg
        self._in: "queue.Queue[Optional[Phrase]]" = queue.Queue()
        self._out: "queue.Queue[Tuple[Phrase, np.ndarray]]" = queue.Queue()
        self._outstanding = 0
        self._lock = threading.Lock()
        self._thread = threading.Thread(target=self._run, name="phrase-converter",
                                        daemon=True)
        self._thread.start()

    def hello(self) -> dict:
        return self._client.hello()

    def _run(self) -> None:
        while True:
            ph = self._in.get()
            if ph is None:
                return
            result = self._client.convert(
                self.prompt_id, f32_to_bytes(ph.audio), self.sample_rate,
                n_steps=self.n_steps, cfg=self.cfg,
            )
            wet = bytes_to_f32(result.audio_out)
            self._out.put((ph, wet))

    def submit(self, phrase: Phrase) -> None:
        with self._lock:
            self._outstanding += 1
        self._in.put(phrase)

    def drain_ready(self) -> List[Tuple[Phrase, np.ndarray]]:
        ready: List[Tuple[Phrase, np.ndarray]] = []
        while True:
            try:
                item = self._out.get_nowait()
            except queue.Empty:
                break
            ready.append(item)
            with self._lock:
                self._outstanding -= 1
        return ready

    @property
    def outstanding(self) -> int:
        with self._lock:
            return self._outstanding

    def close(self) -> None:
        self._in.put(None)
        self._thread.join(timeout=2.0)
        self._client.close()


def run(
    source: AudioSource,
    sink: AudioSink,
    converter: PhraseConverter,
    *,
    delay_sec: float = 1.0,
    dry_gain: float = 0.7,
    wet_gain: float = 0.9,
    feedback: float = 0.0,
    taps: int = 1,
    threshold_db: float = -45.0,
    realtime: bool = False,
    tail_sec: float = 2.0,
    verbose: bool = True,
) -> dict:
    """Drive one instrument session. Returns a small stats dict."""
    sr = source.sample_rate
    bs = source.block_size
    delay_samples = round(delay_sec * sr)
    seg = PhraseSegmenter(sr, bs, threshold_db=threshold_db)
    engine = DelayEngine(sr)

    n_phrases = 0
    phrase_ends: List[int] = []
    block_period = bs / sr

    def schedule_ready() -> None:
        for ph, wet in converter.drain_ready():
            engine.schedule_phrase(
                wet, ph.end_sample + delay_samples,
                wet_gain=wet_gain, feedback=feedback, taps=taps,
                delay_samples=delay_samples,
            )

    for block in source.blocks():
        t0 = time.monotonic()
        for ph in seg.push(block):
            n_phrases += 1
            phrase_ends.append(ph.end_sample)
            converter.submit(ph)
            if verbose:
                print(f"  phrase {n_phrases}: {len(ph.audio)/sr:.2f}s "
                      f"@ end={ph.end_sample/sr:.2f}s rms={ph.rms_db:.1f}dBFS")
        schedule_ready()
        wet_block = engine.render(bs)
        sink.write(block * dry_gain + wet_block)
        if realtime:
            elapsed = time.monotonic() - t0
            if elapsed < block_period:
                time.sleep(block_period - elapsed)

    # Input ended: flush the open phrase, wait for the tail of conversions,
    # then drain the delay line so trailing echoes are not truncated.
    for ph in seg.finish():
        n_phrases += 1
        phrase_ends.append(ph.end_sample)
        converter.submit(ph)
    deadline = time.monotonic() + 5.0
    while converter.outstanding > 0 and time.monotonic() < deadline:
        schedule_ready()
        time.sleep(0.01)
    schedule_ready()

    tail_blocks = round(tail_sec * sr / bs)
    drained = 0
    while (engine.pending() or drained < tail_blocks):
        sink.write(engine.render(bs))
        drained += 1
        if drained > tail_blocks and not engine.pending():
            break

    return {"phrases": n_phrases, "delay_samples": delay_samples,
            "out_cursor": engine.cursor, "phrase_ends": phrase_ends}


def _build_io(args) -> Tuple[AudioSource, AudioSink, int]:
    if args.input == "mic":
        source: AudioSource = LiveMicSource(args.sample_rate, args.block_size)
        sr = args.sample_rate
    else:
        source = WavFileSource(Path(args.input), args.block_size)
        sr = source.sample_rate
    if args.output == "speaker":
        sink: AudioSink = LiveSpeakerSink(sr, args.block_size)
    else:
        sink = WavFileSink(Path(args.output), sr)
    return source, sink, sr


def main(argv: Optional[List[str]] = None) -> int:
    p = argparse.ArgumentParser(description="Semantic Delay standalone instrument (Stage 2)")
    p.add_argument("--input", default="mic", help="'mic' or a WAV path")
    p.add_argument("--output", default="speaker", help="'speaker' or a WAV path")
    p.add_argument("--sock", type=Path,
                   default=Path(f"/tmp/semantic-delay-{__import__('os').getuid()}/daemon.sock"))
    p.add_argument("--prompt", default="spirit.huehuecoyotl.v1",
                   help="registered prompt_id to convert through")
    p.add_argument("--prompt-wav", type=Path, default=None,
                   help="optional WAV to register under --prompt before running")
    p.add_argument("--delay", type=float, default=1.0, help="delay time in seconds")
    p.add_argument("--feedback", type=float, default=0.0, help="0..1 echo regeneration")
    p.add_argument("--taps", type=int, default=1, help="number of feedback taps")
    p.add_argument("--dry", type=float, default=0.7)
    p.add_argument("--wet", type=float, default=0.9)
    p.add_argument("--threshold-db", type=float, default=-45.0)
    p.add_argument("--block-size", type=int, default=512)
    p.add_argument("--sample-rate", type=int, default=48000, help="live mic rate")
    args = p.parse_args(argv)

    source, sink, sr = _build_io(args)
    converter = PhraseConverter(args.sock, args.prompt, sr)
    info = converter.hello()
    print(f"daemon: {info.get('build')} model.loaded={info['model']['loaded']}")

    if args.prompt_wav is not None:
        pcm, p_sr = read_wav_mono(args.prompt_wav)
        converter._client.prompts_register(args.prompt, args.prompt, f32_to_bytes(pcm), p_sr)
        print(f"registered prompt {args.prompt} from {args.prompt_wav}")

    realtime = (args.input == "mic" or args.output == "speaker")
    try:
        stats = run(source, sink, converter,
                    delay_sec=args.delay, dry_gain=args.dry, wet_gain=args.wet,
                    feedback=args.feedback, taps=args.taps,
                    threshold_db=args.threshold_db, realtime=realtime)
    finally:
        converter.close()
        sink.close()
    print(f"done: {stats}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
