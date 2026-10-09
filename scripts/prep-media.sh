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
# Old portfolio photos are circle-masked squares: crop the inscribed square (side = 3616/sqrt2), then export at 900px
career() { # src name
  python3 -c "from PIL import Image; im=Image.open('$SRC/curriculum_old/$1').convert('RGB'); o=530; im.crop((o,o,im.width-o,im.height-o)).save('$SRC/curriculum_old/${1%.*}_sq.jpg', quality=92)"
  cwebp -quiet -q 80 -resize 900 0 "$SRC/curriculum_old/${1%.*}_sq.jpg" -o "$OUT/$2.webp"
}
career foto_01.png career-camera
career foto_02.png career-stopmotion

loop() { # name src
  ffmpeg -v error -y -i "$SRC/$2" -an -c:v libx264 -crf 26 -preset slow -pix_fmt yuv420p -movflags +faststart "$OUT/$1.mp4"
  ffmpeg -v error -y -i "$SRC/$2" -an -c:v libvpx-vp9 -crf 36 -b:v 0 "$OUT/$1.webm"
  ffmpeg -v error -y -ss 1 -i "$SRC/$2" -frames:v 1 -q:v 3 "$OUT/$1-poster.jpg"
}
loop curioso-penguin curioso_loop_penguin.mp4
loop biasgap-halo biasgap_loop_halo.mp4
# Animation bento loops: cut and encoded by scripts/cut-clips.sh (see assets/round4/clips-v2.md),
# copied here with clean names
[ -f assets/round4/v2/explainer.mp4 ] || scripts/cut-clips.sh
for n in stopmotion aftereffects character compositing motiongraphics explainer fx framebyframe; do
  cp "$SRC/round4/v2/$n.mp4" "$OUT/anim-$n.mp4"
  cp "$SRC/round4/v2/$n.webm" "$OUT/anim-$n.webm"
  cp "$SRC/round4/v2/$n.jpg" "$OUT/anim-$n-poster.jpg"
done
# Pipeline prints, one per step (see assets/round4/pipeline.md)
mkdir -p "$OUT/pipeline"
for f in "$SRC"/round4/pipeline/*.png; do n=$(basename "$f" .png); cwebp -quiet -q 78 -resize 1000 0 "$f" -o "$OUT/pipeline/$n.webp"; done
echo "media ready:"; ls -1 "$OUT"
