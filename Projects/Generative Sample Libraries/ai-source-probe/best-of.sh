#!/usr/bin/env bash
# Best-of-N instrument on the winning arm (MusicGen-melody + sine guide).
#
#   bash best-of.sh violin 55:91:3 5      # instrument, MIDI LO:HI:STEP, takes
#
# Renders TAKES seeds per note across the grid, grades every take, keeps the
# steadiest per note, and builds a trimmed SFZ + audition under
# instruments/<instrument>_bo<TAKES>/<instrument>/. Needs the venvs
# run-on-mac.sh built. About 10 s per take on an M1 Max.
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PALACE="$(cd "$HERE/../../.." && pwd)"
VENVS="${GSL_VENVS:-$PALACE/.venvs}"
INST="${1:?instrument (a matrix.json row)}"; GRID="${2:?LO:HI:STEP}"; TAKES="${3:-5}"
RUN="${INST}_bo${TAKES}"
export PYTORCH_ENABLE_MPS_FALLBACK=1
exec > >(tee "$HERE/best-of.$RUN.log") 2>&1
cd "$HERE"
"$VENVS/musicgen/bin/python" probe.py render --adapter musicgen_melody \
    --instrument "$INST" --grid "$GRID" --takes "$TAKES" --as "$RUN"
"$VENVS/gsl-probe/bin/python" probe.py verify --adapter musicgen_melody --as "$RUN"
"$VENVS/gsl-probe/bin/python" build_sfz.py "$RUN" --instrument "$INST" --check --trim --audition
