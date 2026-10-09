export const clamp = (v, min, max) => Math.min(max, Math.max(min, v))

// Which of `count` equal slots a 0..1 progress value falls into.
export const activeIndex = (progress, count) => Math.min(count - 1, Math.floor(clamp(progress, 0, 1) * count))

// Where a looping animation is within its period, 0..1. Works for any elapsed time.
export const loopPhase = (ms, period) => (((ms % period) + period) % period) / period

// Index of the last step whose position along the path (arcs, ascending) the dot has reached.
export const stepAt = (distance, arcs) => {
  let i = 0
  while (i + 1 < arcs.length && arcs[i + 1] <= distance) i++
  return i
}
