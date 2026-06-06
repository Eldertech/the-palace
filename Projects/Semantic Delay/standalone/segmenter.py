"""
Semantic Delay — Standalone instrument: phrase segmentation (Stage 2)
=====================================================================

The instrument is a *phrase*-delay: it must cut the incoming stream into
phrase-sized units, hand each one to the daemon, and schedule the returned
audio. The Phase 1 plan names webrtcvad / silero-vad as the eventual
segmenters. Those carry native build dependencies that do not build in the
palace sandbox, so Stage 2 ships a pure-numpy **energy-gate** segmenter as the
default. It is honest for iterating on segmentation *feel* — the whole point of
doing Stage 2 in Python first — and it sits behind a one-method interface so a
silero/webrtcvad backend drops in later without touching the instrument loop.

Energy-gate logic (classic VAD with hangover):

  * Per block, compute RMS in dBFS.
  * Speech starts when RMS exceeds `threshold_db` for `onset_blocks` in a row.
  * Speech ends when RMS stays below `threshold_db` for `hangover_blocks`
    in a row (the hangover keeps short gaps inside a phrase from splitting it).
  * A completed phrase shorter than `min_phrase_sec` is discarded as a click.
  * A phrase longer than `max_phrase_sec` is force-flushed so the daemon is
    never handed an unbounded blob.

The segmenter is fed one block at a time and yields completed phrases as
contiguous float32 arrays, each tagged with the global sample index of its
final sample (so the delay engine knows when "now" is for scheduling).
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import List, Optional

import numpy as np


@dataclass
class Phrase:
    audio: np.ndarray          # mono float32
    end_sample: int            # global sample index just past the last sample
    rms_db: float              # mean RMS of the phrase, for logging/feel


def rms_dbfs(block: np.ndarray) -> float:
    rms = float(np.sqrt(np.mean(np.square(block)) + 1e-12))
    return 20.0 * np.log10(max(rms, 1e-9))


class PhraseSegmenter:
    def __init__(
        self,
        sample_rate: int,
        block_size: int,
        *,
        threshold_db: float = -45.0,
        onset_blocks: int = 2,
        hangover_sec: float = 0.30,
        min_phrase_sec: float = 0.20,
        max_phrase_sec: float = 8.0,
    ):
        self.sample_rate = sample_rate
        self.block_size = block_size
        self.threshold_db = threshold_db
        self.onset_blocks = onset_blocks
        self.hangover_blocks = max(1, round(hangover_sec * sample_rate / block_size))
        self.min_phrase_samples = round(min_phrase_sec * sample_rate)
        self.max_phrase_samples = round(max_phrase_sec * sample_rate)

        self._in_phrase = False
        self._above_run = 0
        self._below_run = 0
        self._buf: List[np.ndarray] = []
        self._global = 0  # samples seen so far

    def _buffered_len(self) -> int:
        return sum(len(b) for b in self._buf)

    def _flush(self) -> Optional[Phrase]:
        if not self._buf:
            return None
        audio = np.concatenate(self._buf)
        end = self._global
        self._buf = []
        self._in_phrase = False
        self._above_run = 0
        self._below_run = 0
        if len(audio) < self.min_phrase_samples:
            return None
        return Phrase(audio=audio, end_sample=end, rms_db=rms_dbfs(audio))

    def push(self, block: np.ndarray) -> List[Phrase]:
        """Feed one block; return any phrases that completed on this block."""
        out: List[Phrase] = []
        self._global += len(block)
        loud = rms_dbfs(block) >= self.threshold_db

        if not self._in_phrase:
            self._above_run = self._above_run + 1 if loud else 0
            if self._above_run >= self.onset_blocks:
                self._in_phrase = True
                self._below_run = 0
                # Seed the buffer with the onset blocks we counted.
                self._buf.append(block.copy())
        else:
            self._buf.append(block.copy())
            self._below_run = 0 if loud else self._below_run + 1
            if self._below_run >= self.hangover_blocks:
                ph = self._flush()
                if ph is not None:
                    out.append(ph)
            elif self._buffered_len() >= self.max_phrase_samples:
                ph = self._flush()
                if ph is not None:
                    out.append(ph)
        return out

    def finish(self) -> List[Phrase]:
        """Call once the input ends; flush any phrase still open."""
        if self._in_phrase:
            ph = self._flush()
            return [ph] if ph is not None else []
        return []
