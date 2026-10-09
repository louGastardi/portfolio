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
img eraserboy_frame.jpg 1200
img eraserboy_thumb.jpg 1200
img curioso_caju.png 900
# Old portfolio photos are circle-masked squares: crop the inscribed square (side = 3616/sqrt2), then export at 900px
career() { # src name
  python3 -c "from PIL import Image; im=Image.open('$SRC/curriculum_old/$1').convert('RGB'); o=530; im.crop((o,o,im.width-o,im.height-o)).save('$SRC/curriculum_old/${1%.*}_sq.jpg', quality=92)"
  cwebp -quiet -q 80 -resize 900 0 "$SRC/curriculum_old/${1%.*}_sq.jpg" -o "$OUT/$2.webp"
}
career foto_01.png career-camera
career foto_02.png career-stopmotion
career foto_03.png career-faces
for n in 24 28 54; do img "biasgap_cover_$n.jpg" 600; done

loop() { # name src
  ffmpeg -v error -y -i "$SRC/$2" -an -c:v libx264 -crf 26 -preset slow -pix_fmt yuv420p -movflags +faststart "$OUT/$1.mp4"
  ffmpeg -v error -y -i "$SRC/$2" -an -c:v libvpx-vp9 -crf 36 -b:v 0 "$OUT/$1.webm"
  ffmpeg -v error -y -ss 1 -i "$SRC/$2" -frames:v 1 -q:v 3 "$OUT/$1-poster.jpg"
}
loop curioso-capybara curioso_loop_capivara.mp4
loop curioso-penguin curioso_loop_penguin.mp4
loop biasgap-halo biasgap_loop_halo.mp4
loop biasgap-diderot biasgap_loop_diderot.mp4
echo "media ready:"; ls -1 "$OUT"
