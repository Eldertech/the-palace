#!/usr/bin/env bash
# Range map: where does MusicGen actually play each instrument?
#
#   bash range-sweep.sh            # 6 instruments, MIDI 28-100 every 3, 2 takes
#                                  # (re-run to resume: rendered takes are kept)
#
# Asks for every note across a wide span on the winning arm (MusicGen-melody +
# sine guide), grades every take, then range_map.py draws which octave came
# back for each note asked. About 10 s per take on an M1 Max (~50 min).
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PALACE="$(cd "$HERE/../../.." && pwd)"
VENVS="${GSL_VENVS:-$PALACE/.venvs}"
GRID="${1:-28:100:3}"; TAKES="${2:-2}"; RUN="range"
export PYTORCH_ENABLE_MPS_FALLBACK=1
exec > >(tee "$HERE/range-sweep.log") 2>&1
cd "$HERE"
INST=(); for i in piano violin marimba flute bass choir; do INST+=(--instrument "$i"); done
"$VENVS/musicgen/bin/python" probe.py render --adapter musicgen_melody --resume \
    "${INST[@]}" --grid "$GRID" --takes "$TAKES" --as "$RUN"
"$VENVS/gsl-probe/bin/python" probe.py verify --adapter musicgen_melody --as "$RUN"
python3 range_map.py "$RUN"
