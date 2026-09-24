#!/usr/bin/env bash
# Fill an instrument's comfortable range at every semitone, then ring-shape it.
#
#   bash fill-middle.sh marimba_hit 54:63:1 5 mgm_struck
#
# Renders TAKES per semitone inside the range the model actually plays
# (marimba: F#3-D#4, per the range sweep), grades, builds, then runs
# shape_attacks.py --mode ring re-picking among every steady take.
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PALACE="$(cd "$HERE/../../.." && pwd)"
VENVS="${GSL_VENVS:-$PALACE/.venvs}"
INST="${1:?instrument}"; GRID="${2:?LO:HI:STEP}"; TAKES="${3:-5}"; ADAPTER="${4:-mgm_struck}"
RUN="${INST}_mid_bo${TAKES}"
export PYTORCH_ENABLE_MPS_FALLBACK=1
exec > >(tee "$HERE/fill-middle.$RUN.log") 2>&1
cd "$HERE"
"$VENVS/musicgen/bin/python" probe.py render --adapter "$ADAPTER" \
    --instrument "$INST" --grid "$GRID" --takes "$TAKES" --as "$RUN"
"$VENVS/gsl-probe/bin/python" probe.py verify --adapter "$ADAPTER" --as "$RUN"
"$VENVS/gsl-probe/bin/python" build_sfz.py "$RUN" --instrument "$INST" --check --trim --audition
"$VENVS/gsl-probe/bin/python" shape_attacks.py --mode ring --takes "$RUN" "instruments/$RUN/$INST"
