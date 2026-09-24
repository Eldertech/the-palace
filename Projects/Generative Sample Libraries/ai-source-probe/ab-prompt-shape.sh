#!/usr/bin/env bash
# Prompt-shape A/B on the winning arm (MusicGen-melody + sine guide).
#
#   bash "Projects/Generative Sample Libraries/ai-source-probe/ab-prompt-shape.sh"
#
# Same matrix, same seeds, same guide; only the pitch wording changes.
# musicgen_melody (note name + Hz, from the head-to-head) is the baseline and
# is not re-rendered. Needs the venvs run-on-mac.sh built. ~30 min on an M1 Max.
# Writes compare.prompt-shape.html/.json; output also lands in ab-prompt-shape.log.
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PALACE="$(cd "$HERE/../../.." && pwd)"
VENVS="${GSL_VENVS:-$PALACE/.venvs}"
export PYTORCH_ENABLE_MPS_FALLBACK=1
exec > >(tee "$HERE/ab-prompt-shape.log") 2>&1
ARMS="${*:-mgm_name mgm_hz mgm_word mgm_bare}"
cd "$HERE"
for arm in $ARMS; do
  echo; echo "── render · $arm"
  "$VENVS/musicgen/bin/python" probe.py render --adapter "$arm"
  echo; echo "── grade · $arm"
  "$VENVS/gsl-probe/bin/python" probe.py verify --adapter "$arm"
done
echo; echo "── compare"
"$VENVS/gsl-probe/bin/python" compare.py musicgen_melody mgm_name mgm_hz mgm_word mgm_bare \
    --out compare.prompt-shape --title "Prompt shape · MusicGen-melody + guide"
