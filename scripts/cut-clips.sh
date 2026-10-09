#!/usr/bin/env bash
# Cuts the Animation bento loops from the owner's own videos (see assets/round4/clips-v2.md).
# Sources: assets/round4/src/showreel.mp4 (1080p, 25 fps), assets/round4/src/eraserboy.mp4 (720p, 24 fps).
# Every loop: no audio, 640 px wide, H.264 crf 24 + faststart (.mp4), VP9 crf 36 (.webm), poster (.jpg).
set -euo pipefail
cd "$(dirname "$0")/.."
SRC=assets/round4/src
OUT=assets/round4/v2
mkdir -p "$OUT"

# cut <name> <source> <start> <duration> <mode> <poster time> [crop]
# mode: plain = as is, pingpong = forward then backward (no jump at the loop point),
#       xN = the segment is one seamless cycle, repeated N times
cut() {
  local name=$1 src=$2 ss=$3 dur=$4 mode=$5 poster=$6 crop=${7:-}
  local pre="${crop:+crop=$crop,}scale=640:-2"
  local vf
  case $mode in
    plain) vf="$pre,format=yuv420p" ;;
    pingpong) vf="$pre,split[a][b];[b]reverse,trim=start_frame=1,setpts=PTS-STARTPTS[r];[a][r]concat=n=2:v=1:a=0,format=yuv420p" ;;
    x*) vf="$pre,loop=loop=$(( ${mode#x} - 1 )):size=1000,setpts=N/FRAME_RATE/TB,format=yuv420p" ;;
  esac
  ffmpeg -v error -y -ss "$ss" -t "$dur" -i "$SRC/$src" -an -filter_complex "$vf" -c:v libx264 -crf 24 -preset slow -profile:v high -level 3.1 -movflags +faststart "$OUT/$name.mp4"
  ffmpeg -v error -y -i "$OUT/$name.mp4" -an -c:v libvpx-vp9 -crf 36 -b:v 0 -row-mt 1 "$OUT/$name.webm"
  ffmpeg -v error -y -ss "$poster" -i "$OUT/$name.mp4" -frames:v 1 -q:v 3 "$OUT/$name.jpg"
  echo "$name $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT/$name.mp4")s"
}

cut stopmotion      eraserboy.mp4 20.50 2.17 pingpong 1.4
cut aftereffects    showreel.mp4   5.88 1.64 pingpong 0.6
cut compositing     showreel.mp4  49.12 4.84 plain    4.0
cut character       showreel.mp4  37.12 3.24 plain    2.6
cut motiongraphics  showreel.mp4   7.60 5.64 plain    5.3
cut explainer       showreel.mp4  71.40 6.96 plain    3.3
cut fx              showreel.mp4  67.24 3.88 plain    1.6
# The chick is animated on twos in a 31-frame cycle: one cycle, four times
cut framebyframe    showreel.mp4  13.36 1.24 x4       0.3 1280:720:320:190
