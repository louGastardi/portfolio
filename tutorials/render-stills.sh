#!/bin/sh
# Usage: ./render-stills.sh <CompositionId> <prefix> <frame> [frame...]
# Renders PNG stills into frames/ for visual checks.
id=$1; prefix=$2; shift 2
npx remotion bundle --log=error --out-dir=frames/bundle >/dev/null 2>&1
for fr in "$@"; do
  npx remotion still frames/bundle "$id" "frames/$prefix-$fr.png" --frame="$fr" --log=error ${REMOTION_CHROME:+--browser-executable="$REMOTION_CHROME"}
done
