#!/usr/bin/env bash
# tex-env.sh — Shop machinery. Bridges Homebrew's standalone `dvisvgm` formula to
# the TeX Live tree so the `latex -> dvi -> dvisvgm -> svg` path can resolve the
# PostScript header files (tex.pro / texps.pro / special.pro / color.pro).
#
# Why this exists: brew's standalone `dvisvgm` owns /opt/homebrew/bin/dvisvgm and
# TeX Live's own bin/dvisvgm is just a symlink to it. That binary's kpathsea is
# rooted under its own Cellar and never searches the TeX Live tree, so on-screen
# LaTeX fails with "does not support converting .dvi files to SVG" — no matter how
# complete TeX Live is. Exporting TEXPSHEADERS at the TeX Live dvips dirs fixes it.
#
# Root cause + full rationale: Shop/Manim CE.md and Shop/LaTeX.md, 2026-06-09 gotchas.
# The PDF path (pdflatex / xelatex / latexmk -> PDF) does NOT need this — it never
# invokes dvisvgm. Only the SVG-cutout / MathTex path does.
#
# Usage:
#   Artifacts/Shop/tex-env.sh manim -ql scene.py Probe   # run a command with the bridge
#   Artifacts/Shop/tex-env.sh latex foo.tex && \
#     Artifacts/Shop/tex-env.sh dvisvgm foo.dvi          # raw pipeline with the bridge
#   Artifacts/Shop/tex-env.sh --print                    # emit one eval'able export line
#   eval "$(Artifacts/Shop/tex-env.sh --print)"          # apply to the current shell
set -euo pipefail

if ! command -v kpsewhich >/dev/null 2>&1; then
  echo "tex-env.sh: kpsewhich not found — is TeX Live installed and on PATH?" >&2
  exit 127
fi

texmf="$(kpsewhich -var-value=TEXMFDIST)"
if [ -z "$texmf" ] || [ ! -d "$texmf/dvips/base" ]; then
  echo "tex-env.sh: could not resolve TEXMFDIST/dvips/base (got '$texmf')" >&2
  exit 1
fi

TEXPSHEADERS="$texmf/dvips/base:$texmf/dvips/config"
export TEXPSHEADERS

case "${1:-}" in
  --print)        printf 'export TEXPSHEADERS=%q\n' "$TEXPSHEADERS" ;;
  "")             echo "TEXPSHEADERS=$TEXPSHEADERS" ;;   # no args: report only
  *)              exec "$@" ;;                            # run the given command
esac
