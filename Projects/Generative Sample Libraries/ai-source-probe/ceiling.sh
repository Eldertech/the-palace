#!/usr/bin/env bash
# The violin's top-octave ceiling (cycle 25). Above about G5, MusicGen-melody
# plays every steady violin take an octave down. Three tries at the octave,
# same four notes (A#5 C#6 E6 G6) and seeds 1-5 as best-of.sh violin 55:91:3 5,
# whose results.violin_bo5.jsonl is the baseline (not re-rendered):
#
#   mgm_harm   guide = sine + 2nd/3rd harmonics
#   mgm_high   prompt says "in its very highest register"
#   mgm_cfg6   guidance_scale 6 instead of 3
#
#   bash ceiling.sh [arms...]      # ~10 min on an M1 Max
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PALACE="$(cd "$HERE/../../.." && pwd)"
VENVS="${GSL_VENVS:-$PALACE/.venvs}"
export PYTORCH_ENABLE_MPS_FALLBACK=1
exec > >(tee "$HERE/ceiling.log") 2>&1
ARMS="${*:-mgm_harm mgm_high mgm_cfg6}"
cd "$HERE"
for arm in $ARMS; do
  echo; echo "── render · $arm"
  "$VENVS/musicgen/bin/python" probe.py render --adapter "$arm" \
      --instrument violin --grid 82:91:3 --takes 5 --as "ceil_$arm"
  echo; echo "── grade · $arm"
  "$VENVS/gsl-probe/bin/python" probe.py verify --adapter "$arm" --as "ceil_$arm"
done
echo; echo "── table"
"$VENVS/gsl-probe/bin/python" ceiling_table.py
