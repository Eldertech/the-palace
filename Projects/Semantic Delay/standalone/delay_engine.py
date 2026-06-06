"""
Semantic Delay — Standalone instrument: scheduled-playback delay (Stage 2)
==========================================================================

This is the dub heart of the instrument: a converted phrase comes back from the
daemon, and instead of playing immediately it is *scheduled* to play one delay
time in the future, optionally feeding back into further taps with decay. The
engine works on a single global sample clock and is **block-based and
allocation-light** on the hot path, exactly so this logic ports to C++ at
Stage 5 without a redesign (home entry, "Staged build" §Stage 3).

The dry signal is mixed by the instrument loop; this engine renders only the
*wet* (delayed) sum. A scheduled event is (start_sample, audio, gain). On each
`render(n)` call the engine emits the next `n` samples by summing the slices of
every event overlapping the window [cursor, cursor+n).

Feedback: when a phrase is scheduled with `feedback > 0` and `taps > 1`, the
engine lays down a geometric series of echoes — tap k plays at
start + k*delay_samples with gain * feedback**k — so a single phrase becomes a
decaying train, the classic tape-delay regeneration.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import List

import numpy as np


@dataclass
class _Event:
    start: int            # global sample index where this echo begins
    audio: np.ndarray     # mono float32
    gain: float

    @property
    def end(self) -> int:
        return self.start + len(self.audio)


class DelayEngine:
    def __init__(self, sample_rate: int):
        self.sample_rate = sample_rate
        self._events: List[_Event] = []
        self._cursor = 0  # global sample index of the next sample to render

    def schedule_phrase(
        self,
        audio: np.ndarray,
        at_sample: int,
        *,
        wet_gain: float = 0.9,
        feedback: float = 0.0,
        taps: int = 1,
        delay_samples: int = 0,
    ) -> None:
        """Lay down one phrase plus its feedback train."""
        audio = np.asarray(audio, dtype=np.float32)
        gain = wet_gain
        for k in range(max(1, taps)):
            start = at_sample + k * delay_samples
            if gain < 1e-4:
                break
            self._events.append(_Event(start=start, audio=audio, gain=gain))
            gain *= feedback
            if feedback <= 0.0:
                break

    def render(self, n: int) -> np.ndarray:
        """Render the next `n` wet samples; drop events that are fully past."""
        out = np.zeros(n, dtype=np.float32)
        win_start = self._cursor
        win_end = self._cursor + n
        still_live: List[_Event] = []
        for ev in self._events:
            if ev.end <= win_start:
                continue  # fully in the past; drop
            if ev.start >= win_end:
                still_live.append(ev)  # entirely future; keep, nothing to add now
                continue
            # Overlap [max(starts), min(ends)) mapped into the output window.
            seg_start = max(ev.start, win_start)
            seg_end = min(ev.end, win_end)
            o0 = seg_start - win_start
            o1 = seg_end - win_start
            a0 = seg_start - ev.start
            a1 = seg_end - ev.start
            out[o0:o1] += ev.audio[a0:a1] * ev.gain
            if ev.end > win_end:
                still_live.append(ev)  # tail extends past this window
        self._events = still_live
        self._cursor = win_end
        return out

    def pending(self) -> bool:
        """True if any scheduled audio still lies at or beyond the cursor."""
        return any(ev.end > self._cursor for ev in self._events)

    @property
    def cursor(self) -> int:
        return self._cursor
