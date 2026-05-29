#!/usr/bin/env bash
# Render a standalone TikZ/pgfplots file to editable SVG (+ PNG preview).
# Usage:  ./render.sh diagram.tex            # text -> vector outlines (portable)
#         ./render.sh diagram.tex --text     # keep text editable as text (embeds font)
# Requires: pdflatex, dvisvgm  (both in TeX Live). pdftoppm optional for PNG.
set -euo pipefail
src="${1:?usage: render.sh file.tex [--text]}"
base="${src%.tex}"
mode="${2:-}"

pdflatex -interaction=nonstopmode -halt-on-error "$src" >/dev/null
if [[ "$mode" == "--text" ]]; then
  dvisvgm --pdf --font-format=woff "$base.pdf" -o "$base.svg" >/dev/null 2>&1
else
  dvisvgm --pdf --no-fonts        "$base.pdf" -o "$base.svg" >/dev/null 2>&1
fi
command -v pdftoppm >/dev/null 2>&1 && pdftoppm -png -r 160 "$base.pdf" "$base-preview" >/dev/null 2>&1 || true
echo "wrote: $base.pdf  $base.svg  ($base-preview-1.png if pdftoppm present)"
