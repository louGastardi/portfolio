#!/bin/sh
# Renders both tutorials and encodes the web files into ../public/media.
# Set REMOTION_CHROME to a Chrome binary if the bundled headless shell fails to start.
set -e
cd "$(dirname "$0")"
M=../public/media
for pair in "AnimationAutomation aa 9.2" "SequenceFromSRT srt 16.2"; do
  set -- $pair
  npx remotion render "$1" "out/$2-master.mp4" --codec=h264 --crf=14 ${REMOTION_CHROME:+--browser-executable="$REMOTION_CHROME"}
  ffmpeg -v error -y -i "out/$2-master.mp4" -vf scale=1350:690:flags=lanczos -c:v libx264 -preset veryslow -tune animation -crf 25 -pix_fmt yuv420p -movflags +faststart -an "$M/tutorial-$2.mp4"
  ffmpeg -v error -y -i "out/$2-master.mp4" -vf scale=1350:690:flags=lanczos -c:v libvpx-vp9 -crf 38 -b:v 0 -row-mt 1 -cpu-used 2 -pass 1 -passlogfile "out/$2" -an -f null /dev/null
  ffmpeg -v error -y -i "out/$2-master.mp4" -vf scale=1350:690:flags=lanczos -c:v libvpx-vp9 -crf 38 -b:v 0 -row-mt 1 -cpu-used 2 -pass 2 -passlogfile "out/$2" -an "$M/tutorial-$2.webm"
  ffmpeg -v error -y -ss "$3" -i "out/$2-master.mp4" -frames:v 1 -vf scale=1350:690:flags=lanczos "out/$2-poster.png"
  cwebp -quiet -q 80 "out/$2-poster.png" -o "$M/script-$2-poster.webp"
done
