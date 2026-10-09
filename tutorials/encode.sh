#!/bin/sh
# Renders both tutorials and encodes the web files into ../public/media.
# Set REMOTION_CHROME to a Chrome binary if the bundled headless shell fails to start.
# SKIP_RENDER=1 reuses the masters in out/ and only encodes.
# The web files carry a version in their name (V). Bump it on every re-encode, so no browser
# or CDN cache can mix bytes of the old and the new file under one URL, and update index.html.
set -e
cd "$(dirname "$0")"
M=../public/media
V=r5
# Remotion masters are full range (yuvj420p, pc). Web files: limited range BT.709 yuv420p,
# H.264 High@4.0 (Safari, iOS and Chrome all decode it in hardware), faststart
VF="scale=1350:690:flags=lanczos:out_range=tv:out_color_matrix=bt709,format=yuv420p"
COLOR="-color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709"
for pair in "AnimationAutomation aa 9.2" "SequenceFromSRT srt 16.2"; do
  set -- $pair
  [ -n "${SKIP_RENDER:-}" ] || npx remotion render "$1" "out/$2-master.mp4" --codec=h264 --crf=14 ${REMOTION_CHROME:+--browser-executable="$REMOTION_CHROME"}
  ffmpeg -v error -y -i "out/$2-master.mp4" -vf "$VF" -c:v libx264 -preset veryslow -tune animation -crf 25 -profile:v high -level 4.0 $COLOR -movflags +faststart -an "$M/tutorial-$2-$V.mp4"
  ffmpeg -v error -y -i "out/$2-master.mp4" -vf "$VF" -c:v libvpx-vp9 -crf 38 -b:v 0 -row-mt 1 -cpu-used 2 $COLOR -pass 1 -passlogfile "out/$2" -an -f null /dev/null
  ffmpeg -v error -y -i "out/$2-master.mp4" -vf "$VF" -c:v libvpx-vp9 -crf 38 -b:v 0 -row-mt 1 -cpu-used 2 $COLOR -pass 2 -passlogfile "out/$2" -an "$M/tutorial-$2-$V.webm"
  ffmpeg -v error -y -ss "$3" -i "out/$2-master.mp4" -frames:v 1 -vf scale=1350:690:flags=lanczos "out/$2-poster.png"
  cwebp -quiet -q 80 "out/$2-poster.png" -o "$M/script-$2-poster.webp"
done
