#!/usr/bin/env bash
# Render the note names an instrument's pool is missing, then rebuild it by played note.
#
#   bash fill-names.sh violin 3 56:79:3 57:79:3
#
# Refiling crosses octaves, never note names (DESIGN.md, cycle 31): the violin
# pool was rendered every third semitone, so it holds only E, G, A# and C#.
# Each GRID here is one more every-third-semitone offset; 56 and 57 together
# cover the other eight names. Renders TAKES per note on the winning arm
# (musicgen_melody + sine guide), grades each run, then rebuilds from the
# whole pool and bows the attacks on.
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PALACE="$(cd "$HERE/../../.." && pwd)"
VENVS="${GSL_VENVS:-$PALACE/.venvs}"
INST="${1:?instrument}"; TAKES="${2:?takes}"; shift 2
export PYTORCH_ENABLE_MPS_FALLBACK=1
exec > >(tee "$HERE/fill-names.$INST.log") 2>&1
cd "$HERE"
RUNS=()
for GRID in "$@"; do
  RUN="${INST}_names${GRID%%:*}_bo${TAKES}"
  RUNS+=("$RUN")
  "$VENVS/musicgen/bin/python" probe.py render --adapter musicgen_melody \
      --instrument "$INST" --grid "$GRID" --takes "$TAKES" --as "$RUN"
  "$VENVS/gsl-probe/bin/python" probe.py verify --adapter musicgen_melody --as "$RUN"
done
# the violin and marimba have a best-of-5 run; the others start from the range sweep alone
POOL="range"; [[ -f "results.${INST}_bo5.jsonl" ]] && POOL+="+${INST}_bo5"
POOL+="$(printf '+%s' "${RUNS[@]}")"
"$VENVS/gsl-probe/bin/python" build_sfz.py "$POOL" --instrument "$INST" --by-played \
    --trim --audition --out instruments/by_played_names
"$VENVS/gsl-probe/bin/python" shape_attacks.py --mode bow "instruments/by_played_names/$INST"
