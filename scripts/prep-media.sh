#!/usr/bin/env bash
# Converts source assets in assets/ into web-ready files in public/media/.
set -euo pipefail
cd "$(dirname "$0")/.."
SRC=assets
OUT=public/media
mkdir -p "$OUT"

img() { cwebp -quiet -q "${3:-80}" -resize "$2" 0 "$SRC/$1" -o "$OUT/${1%.*}.webp"; }
# About photo: crop the source portrait (less headspace), then export as lou_portrait.webp
python3 -c "from PIL import Image; Image.open('$SRC/lou_portrait.jpg').crop((140,215,796,1050)).save('$SRC/lou_portrait_about.jpg', quality=92)"
cwebp -quiet -q 82 -resize 900 0 "$SRC/lou_portrait_about.jpg" -o "$OUT/lou_portrait.webp"
img edubites_agentic_desktop.jpg 1200 75
img edubites_agentic_mobile.jpg 420 75
img rpg_game.png 800
img encryptor.png 800
# Old portfolio photos are circle-masked squares. Cut the largest 4:5 rectangle that still fits
# inside the circle around the given center (fractions of the side), so the hands, the puppet
# and the camera stay in frame on the tall timeline cards. Exported at 640px wide.
career() { # src name cx cy
  python3 - "$SRC/curriculum_old/$1" "$SRC/curriculum_old/${1%.*}_45.jpg" "$3" "$4" <<'PY'
import sys
from PIL import Image
src, out, cx, cy = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4])
im = Image.open(src).convert('RGB'); n = im.width
fits = lambda w: all((x - .5) ** 2 + (y - .5) ** 2 <= .25 for x in (cx - w / 2, cx + w / 2) for y in (cy - w * .625, cy + w * .625))
lo, hi = 0.0, 1.0
for _ in range(40):
    mid = (lo + hi) / 2
    lo, hi = (mid, hi) if fits(mid) else (lo, mid)
w = lo
im.crop(tuple(round(v * n) for v in (cx - w / 2, cy - w * .625, cx + w / 2, cy + w * .625))).save(out, quality=92)
PY
  cwebp -quiet -q 80 -resize 640 0 "$SRC/curriculum_old/${1%.*}_45.jpg" -o "$OUT/$2.webp"
}
career foto_01.png career-camera 0.45 0.45
career foto_02.png career-stopmotion 0.5 0.5
# Timeline 2022, 2024, 2026: 4:5 crops of the Procrastination game in play, an eduBITES lesson
# opener (rendered headless at 480x600, 2x) and the Bias Gap frames print (Short 58)
crop45() { # src name left top right bottom
  python3 -c "from PIL import Image; Image.open('$SRC/$1').convert('RGB').crop(($3,$4,$5,$6)).save('/tmp/crop45.png')"
  cwebp -quiet -q 80 -resize 640 0 /tmp/crop45.png -o "$OUT/$2.webp"
}
crop45 round6/rpg_game_play.png career-code 565 105 1021 675
crop45 round6/edubites_lesson_beurteilen.png career-edubites 0 0 960 1200
crop45 round7/pipeline/frames.png career-pipeline 6 0 594 735

# Loops are squeezed to limited (tv) range yuv420p with a fixed 1 s GOP. Full range sources
# (yuvj420p, color_range=pc, as the Bias Gap exports are) make a VP9 webm that Chrome's hardware
# decoder rejects with PIPELINE_ERROR_DECODE, the tile then freezes on its first frame and never
# falls back to the mp4. Versioned output names keep browsers from serving a cached broken copy.
LOOPVF="scale=in_range=auto:out_range=tv,format=yuv420p"
loop() { # name src
  ffmpeg -v error -y -i "$SRC/$2" -an -vf "$LOOPVF" -c:v libx264 -crf 24 -preset slow -g 30 -keyint_min 30 -sc_threshold 0 -color_range tv -movflags +faststart "$OUT/$1.mp4"
  ffmpeg -v error -y -i "$SRC/$2" -an -vf "$LOOPVF" -c:v libvpx-vp9 -crf 34 -b:v 0 -g 30 -color_range tv "$OUT/$1.webm"
  ffmpeg -v error -y -ss 1 -i "$SRC/$2" -vf "$LOOPVF" -frames:v 1 -q:v 3 "$OUT/$1-poster.jpg"
}
loop curioso-penguin curioso_loop_penguin.mp4
loop biasgap-halo-r9 biasgap_loop_halo.mp4
# Animation bento loops: cut and encoded by scripts/cut-clips.sh (see assets/round4/clips-v2.md),
# copied here with clean names
[ -f assets/round4/v2/explainer.mp4 ] || scripts/cut-clips.sh
for n in stopmotion aftereffects character compositing motiongraphics explainer fx framebyframe; do
  cp "$SRC/round4/v2/$n.mp4" "$OUT/anim-$n.mp4"
  cp "$SRC/round4/v2/$n.webm" "$OUT/anim-$n.webm"
  cp "$SRC/round4/v2/$n.jpg" "$OUT/anim-$n-poster.jpg"
done
# Pipeline prints, one per step, from published Short 58 (see assets/round7/pipeline.md)
mkdir -p "$OUT/pipeline"
for f in "$SRC"/round7/pipeline/*.png; do n=$(basename "$f" .png); cwebp -quiet -q 78 -resize 1000 0 "$f" -o "$OUT/pipeline/$n.webp"; done
echo "media ready:"; ls -1 "$OUT"
