#!/bin/sh
set -e
cd "$(dirname "$0")"
python3 render2.py lead2.html X fr_L2 0 38
mkdir -p out
ffmpeg -v error -y -framerate 30 -i fr_L2/f_%05d.jpg -an -c:v libx264 -preset medium -crf 17 -pix_fmt yuv420p -r 30 -movflags +faststart out/mutrafa-system-explainer-9x16-silent.mp4
echo DONE
