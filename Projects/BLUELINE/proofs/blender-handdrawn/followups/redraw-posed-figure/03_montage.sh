#!/usr/bin/env bash
# BLUELINE — Redraw Posed Figure Proof · Build labelled comparison montage(s).
# Requires ImageMagick. Run from anywhere.
set -euo pipefail
PROOF="/Users/loudonstearns/Documents/The Palace/Projects/BLUELINE/proofs/blender-handdrawn/followups/redraw-posed-figure"
cd "$PROOF"

echo "Building labelled comparison montage..."

label() {  # src dst "label"
    magick "$1" -resize 416x520 \
        -gravity South -background '#101010' -splice 0x34 \
        -fill white -font /System/Library/Fonts/Supplemental/Arial.ttf -pointsize 17 \
        -annotate +0+7 "$3" "$2"
}

# --- Source plates ---
label "ink_plate.png"   "_ink.png"   "INK plate (Canny src)"
label "toon_plate.png"  "_toon.png"  "TOON plate (img2img init)"
label "depth_plate.png" "_depth.png" "DEPTH plate (ControlNet)"
label "openpose.png"    "_pose.png"  "OPENPOSE (ControlNet)"

# --- A: canny only ---
label "redraw_A_canny_d092.png" "_A92.png" "A canny-only d0.92"
label "redraw_A_canny_d095.png" "_A95.png" "A canny-only d0.95"

# --- B: canny + depth (high strength) ---
label "redraw_B_canny_depth_d092.png" "_B92.png" "B canny+depth d0.92"
label "redraw_B_canny_depth_d095.png" "_B95.png" "B canny+depth d0.95"

# --- C: canny + openpose (low canny, high pose) ---
label "redraw_C_canny_pose_d092.png" "_C92.png" "C canny+pose d0.92"
label "redraw_C_canny_pose_d095.png" "_C95.png" "C canny+pose d0.95"

# --- D: sweet-spot hunt ---
label "redraw_D1_canny035_depth055_toon.png"    "_D1.png" "D1 lowCanny+depth toon"
label "redraw_D2_canny030_depth060_pose070.png" "_D2.png" "D2 canny+depth+pose *WIN*"
label "redraw_D3_canny035_depth055_inkinit.png" "_D3.png" "D3 lowCanny+depth inkInit"

# Row of source plates (4 wide)
montage -font /System/Library/Fonts/Supplemental/Arial.ttf _ink.png _toon.png _depth.png _pose.png -geometry +3+3 -tile 4x1 _row_src.png

# Strategy rows (4 wide): A,B then C,D1,D2 then D3
montage -font /System/Library/Fonts/Supplemental/Arial.ttf _A92.png _A95.png _B92.png _B95.png -geometry +3+3 -tile 4x1 _row_AB.png
montage -font /System/Library/Fonts/Supplemental/Arial.ttf _C92.png _C95.png _D1.png  _D2.png  -geometry +3+3 -tile 4x1 _row_CD.png
cp _D3.png _row_D3.png

# Stack everything
magick _row_src.png _row_AB.png _row_CD.png _row_D3.png -background '#101010' -append comparison_montage.png
echo "  wrote comparison_montage.png"

# Tight pose-survival strip: aggressive end of each strategy + the winner
montage -font /System/Library/Fonts/Supplemental/Arial.ttf _A95.png _B95.png _C95.png _D2.png -geometry +4+4 -tile 4x1 pose_survival_strip.png
echo "  wrote pose_survival_strip.png"

rm -f _ink.png _toon.png _depth.png _pose.png _A92.png _A95.png _B92.png _B95.png \
      _C92.png _C95.png _D1.png _D2.png _D3.png _row_*.png
echo "MONTAGE DONE"
