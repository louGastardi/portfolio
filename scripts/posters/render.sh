#!/usr/bin/env bash
# Renders the script card posters from poster.html into public/media/*.webp
set -euo pipefail
cd "$(dirname "$0")/../.."
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
TMP="$(mktemp -d)"
for v in aa srt; do
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --virtual-time-budget=3000 \
    --window-size=900,460 --screenshot="$TMP/$v.png" "file://$PWD/scripts/posters/poster.html?v=$v" >/dev/null 2>&1
  cwebp -quiet -q 82 "$TMP/$v.png" -o "public/media/script-$v-poster.webp"
done
rm -rf "$TMP"
