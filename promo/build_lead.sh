#!/bin/sh
set -e
cd "$(dirname "$0")"
python3 render2.py lead.html A fr_A 0 40
python3 render2.py lead.html B fr_B 0 3
rm -rf fr_BB && mkdir fr_BB && cp -l fr_A/f_*.jpg fr_BB/ && cp -f fr_B/f_*.jpg fr_BB/
mkdir -p out
for v in A BB; do
  d=fr_$v; n=$([ $v = A ] && echo A || echo B)
  ffmpeg -v error -y -framerate 30 -i $d/f_%05d.jpg -an -c:v libx264 -preset medium -crf 17 -pix_fmt yuv420p -r 30 -movflags +faststart out/mutrafa-lead-9x16-hook$n-silent.mp4
done
echo DONE
