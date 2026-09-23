#!/usr/bin/env bash
# AI-source probe — the one command, on the Mac.
#
#   bash "Projects/Generative Sample Libraries/ai-source-probe/run-on-mac.sh"
#
# Renders the matrix (6 instruments × 4 notes × 2 seeds) through four arms,
# grades every render, writes compare.html + compare.json here, builds a
# playable SFZ per instrument per model arm under instruments/, opens the page.
#
#   crystal          palace reference — the shipped Crystal instrument
#   stable_audio     Stable Audio 3 small-music, pitch named in the prompt
#   musicgen_melody  MusicGen-melody, prompt + a sine guide at the pitch
#   musicgen_text    MusicGen-melody, prompt only (the control)
#
# Flags:
#   --quick       8 cells per arm instead of 48 (piano + violin, seed 1)
#   --only ARM    run one arm; the report still includes earlier results
#   --no-open     don't open the report at the end
#
# First run: builds two venvs under <palace>/.venvs/ (gsl-probe, musicgen)
# and downloads facebook/musicgen-melody (several GB, CC-BY-NC weights).
# Stable Audio uses its existing install at <palace>/_tools/stable-audio-3.
# Everything printed also lands in run-on-mac.log beside this script.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PALACE="$(cd "$HERE/../../.." && pwd)"
PY="${PYTHON:-$(command -v python3.12 || command -v python3)}"
VENVS="${GSL_VENVS:-$PALACE/.venvs}"
SA3_PY="${GSL_SA3_PY:-$PALACE/_tools/stable-audio-3/.venv/bin/python}"
PROBE_PY="$VENVS/gsl-probe/bin/python"
MG_PY="$VENVS/musicgen/bin/python"
export PYTORCH_ENABLE_MPS_FALLBACK=1

QUICK=""; ONLY=""; OPEN=1
while [ $# -gt 0 ]; do
  case "$1" in
    --quick)   QUICK="--quick" ;;
    --only)    ONLY="$2"; shift ;;
    --no-open) OPEN=0 ;;
    *) echo "unknown flag: $1"; exit 2 ;;
  esac
  shift
done

exec > >(tee "$HERE/run-on-mac.log") 2>&1
echo "AI-source probe · $(date '+%Y-%m-%d %H:%M') · palace $PALACE ${QUICK:+· quick}"

want() { [ -z "$ONLY" ] || [ "$ONLY" = "$1" ]; }

ensure_venv() {  # dir, pip packages...
  local dir="$1"; shift
  if [ ! -f "$dir/.gsl-ready" ]; then
    echo "· building venv $dir (one time)"
    [ -x "$dir/bin/python" ] || "$PY" -m venv "$dir"
    "$dir/bin/pip" install -q --upgrade pip
    "$dir/bin/pip" install -q "$@"
    touch "$dir/.gsl-ready"
  fi
}

RAN=""; FAILED=""
render_arm() {  # arm, python
  echo; echo "── render · $1"
  if (cd "$HERE" && "$2" probe.py render --adapter "$1" $QUICK); then
    RAN="$RAN $1"
  else
    FAILED="$FAILED $1"
    rm -f "$HERE/results.$1.jsonl"   # no stale grades for an arm that did not render
  fi
}

# the grader's venv (also renders the crystal reference)
ensure_venv "$VENVS/gsl-probe" numpy scipy soundfile "librosa>=0.10"

want crystal && render_arm crystal "$PROBE_PY"

if want stable_audio; then
  if [ -x "$SA3_PY" ]; then
    render_arm stable_audio "$SA3_PY"
  else
    echo "── stable_audio skipped: no SA3 venv at $SA3_PY"
    echo "   install recipe: Shop/Stable Audio Open.md, gotcha 2026-05-26"
    FAILED="$FAILED stable_audio"
  fi
fi

if want musicgen_melody || want musicgen_text; then
  ensure_venv "$VENVS/musicgen" torch "transformers>=4.40" numpy scipy sentencepiece protobuf
  want musicgen_melody && render_arm musicgen_melody "$MG_PY"
  want musicgen_text   && render_arm musicgen_text   "$MG_PY"
fi

for arm in $RAN; do
  echo; echo "── grade · $arm"
  (cd "$HERE" && "$PROBE_PY" probe.py verify --adapter "$arm") || echo "   grading failed for $arm"
done

echo; echo "── compare"
(cd "$HERE" && "$PROBE_PY" compare.py crystal stable_audio musicgen_melody musicgen_text \
    --out compare --title "Head to head")

# graded run -> playable SFZ, one per instrument row, every key played + graded.
# WAVs are gitignored in this project, so the crystal reference instrument is
# rebuilt here too — its .sfz is in git, its samples are not.
BUILT=""
for arm in $RAN; do
  echo; echo "── instruments · $arm"
  EXTRA=""   # a plain string, not "$@": macOS bash 3.2 + set -u rejects an empty "$@"
  [ "$arm" = crystal ] && EXTRA="--instrument piano --name reference --loop-mode one_shot"
  if (cd "$HERE" && "$PROBE_PY" build_sfz.py "$arm" $EXTRA --check --audition); then
    BUILT="$BUILT $arm"
  else
    echo "   instrument build failed for $arm"
  fi
done

echo
echo "rendered + graded:${RAN:- none}"
if [ -n "$BUILT" ]; then echo "instruments (SFZ):$BUILT  → instruments/<arm>/<instrument>/"; fi
if [ -n "$FAILED" ]; then echo "did not render:$FAILED  (see renders.<arm>.jsonl and run-on-mac.log)"; fi
if [ "$OPEN" = 1 ] && command -v open >/dev/null; then open "$HERE/compare.html"; fi
