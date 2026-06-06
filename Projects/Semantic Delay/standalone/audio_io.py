"""
Semantic Delay — Standalone instrument: audio I/O (Stage 2)
===========================================================

Stage 2 of the Phase 1 plan is the first *playable* moment: mic in, phrase
segmentation, daemon call, scheduled-playback delay, audio out. To keep the
core loop testable without a microphone (and without PortAudio, which does not
build in the palace sandbox), all audio I/O hides behind two small interfaces:

    AudioSource.blocks()  -> yields fixed-size float32 mono blocks
    AudioSink.write(block) / .close()

Two backends ship:

  * File backends (`WavFileSource`, `WavFileSink`) — stdlib `wave` + numpy.
    These run anywhere and are what the offline end-to-end test drives.
  * Live backends (`LiveMicSource`, `LiveSpeakerSink`) — thin wrappers over
    `sounddevice`, imported lazily so importing this module never requires
    PortAudio. These are the real-mic path Loudon runs on the Mac.

All audio inside the instrument is **mono float32 in [-1, 1]** at one sample
rate. Sample-rate conversion is the daemon's job (RPC v0.1 §3.2), never ours.
"""

from __future__ import annotations

import wave
from pathlib import Path
from typing import Iterator, Optional

import numpy as np

Block = np.ndarray  # float32, shape (block_size,)


# ----------------------------------------------------------------------------
# float32 <-> pcm_f32le bytes (the daemon's wire encoding, RPC v0.1 §3.2)
# ----------------------------------------------------------------------------

def f32_to_bytes(x: np.ndarray) -> bytes:
    """Mono float32 -> pcm_f32le bytes (little-endian, the daemon's encoding)."""
    return np.ascontiguousarray(x, dtype="<f4").tobytes()


def bytes_to_f32(b: bytes) -> np.ndarray:
    """pcm_f32le bytes -> mono float32 array."""
    return np.frombuffer(b, dtype="<f4").astype(np.float32, copy=True)


# ----------------------------------------------------------------------------
# Interfaces
# ----------------------------------------------------------------------------

class AudioSource:
    sample_rate: int
    block_size: int

    def blocks(self) -> Iterator[Block]:
        raise NotImplementedError


class AudioSink:
    sample_rate: int

    def write(self, block: Block) -> None:
        raise NotImplementedError

    def close(self) -> None:
        pass

    def __enter__(self) -> "AudioSink":
        return self

    def __exit__(self, *exc) -> None:
        self.close()


# ----------------------------------------------------------------------------
# File backends — run anywhere, drive the offline test
# ----------------------------------------------------------------------------

def read_wav_mono(path: Path) -> tuple[np.ndarray, int]:
    """Read a WAV (int16 / int32 / float32) as mono float32 in [-1, 1]."""
    with wave.open(str(path), "rb") as w:
        sr = w.getframerate()
        nch = w.getnchannels()
        sampwidth = w.getsampwidth()
        frames = w.readframes(w.getnframes())
    if sampwidth == 2:
        data = np.frombuffer(frames, dtype="<i2").astype(np.float32) / 32768.0
    elif sampwidth == 4:
        # 32-bit: could be int32 or float32; the stdlib `wave` module only
        # writes int, so we treat width-4 as int32 here. (Float WAVs are read
        # via soundfile on the Mac path; the test only uses int16.)
        data = np.frombuffer(frames, dtype="<i4").astype(np.float32) / 2147483648.0
    elif sampwidth == 1:
        data = (np.frombuffer(frames, dtype="u1").astype(np.float32) - 128.0) / 128.0
    else:
        raise ValueError(f"unsupported sample width {sampwidth}")
    if nch > 1:
        data = data.reshape(-1, nch).mean(axis=1)
    return data.astype(np.float32), sr


def write_wav_mono(path: Path, audio: np.ndarray, sample_rate: int) -> None:
    """Write mono float32 [-1, 1] to a 16-bit PCM WAV."""
    clipped = np.clip(audio, -1.0, 1.0)
    pcm = (clipped * 32767.0).astype("<i2")
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sample_rate)
        w.writeframes(pcm.tobytes())


class WavFileSource(AudioSource):
    """Reads a WAV from disk and yields it in fixed-size blocks."""

    def __init__(self, path: Path, block_size: int = 512):
        self._audio, self.sample_rate = read_wav_mono(Path(path))
        self.block_size = block_size

    def blocks(self) -> Iterator[Block]:
        n = len(self._audio)
        for start in range(0, n, self.block_size):
            chunk = self._audio[start:start + self.block_size]
            if len(chunk) < self.block_size:
                chunk = np.pad(chunk, (0, self.block_size - len(chunk)))
            yield chunk


class WavFileSink(AudioSink):
    """Accumulates blocks and writes a WAV on close."""

    def __init__(self, path: Path, sample_rate: int):
        self.path = Path(path)
        self.sample_rate = sample_rate
        self._chunks: list[np.ndarray] = []

    def write(self, block: Block) -> None:
        self._chunks.append(np.asarray(block, dtype=np.float32))

    def close(self) -> None:
        audio = np.concatenate(self._chunks) if self._chunks else np.zeros(0, np.float32)
        write_wav_mono(self.path, audio, self.sample_rate)


# ----------------------------------------------------------------------------
# Live backends — sounddevice, imported lazily (Mac path only)
# ----------------------------------------------------------------------------

def _import_sounddevice():
    try:
        import sounddevice as sd  # noqa: WPS433
        return sd
    except Exception as e:  # pragma: no cover - sandbox has no PortAudio
        raise RuntimeError(
            "Live mic/speaker requires `sounddevice` (PortAudio). Install with "
            "`pip install sounddevice` on macOS, or use --input/--output WAV "
            "files for the offline path."
        ) from e


class LiveMicSource(AudioSource):
    """Microphone input via sounddevice. Mac path; lazy import."""

    def __init__(self, sample_rate: int = 48000, block_size: int = 512,
                 device: Optional[int] = None):
        self.sample_rate = sample_rate
        self.block_size = block_size
        self.device = device

    def blocks(self) -> Iterator[Block]:  # pragma: no cover - needs hardware
        sd = _import_sounddevice()
        with sd.InputStream(samplerate=self.sample_rate, channels=1,
                            blocksize=self.block_size, dtype="float32",
                            device=self.device) as stream:
            while True:
                data, _ = stream.read(self.block_size)
                yield data[:, 0].copy()


class LiveSpeakerSink(AudioSink):
    """Speaker output via sounddevice. Mac path; lazy import."""

    def __init__(self, sample_rate: int = 48000, block_size: int = 512,
                 device: Optional[int] = None):
        self.sample_rate = sample_rate
        self.block_size = block_size
        self.device = device
        self._stream = None

    def _ensure_stream(self):  # pragma: no cover - needs hardware
        if self._stream is None:
            sd = _import_sounddevice()
            self._stream = sd.OutputStream(
                samplerate=self.sample_rate, channels=1,
                blocksize=self.block_size, dtype="float32", device=self.device)
            self._stream.start()
        return self._stream

    def write(self, block: Block) -> None:  # pragma: no cover - needs hardware
        stream = self._ensure_stream()
        stream.write(np.ascontiguousarray(block, dtype=np.float32).reshape(-1, 1))

    def close(self) -> None:  # pragma: no cover - needs hardware
        if self._stream is not None:
            self._stream.stop()
            self._stream.close()
            self._stream = None
