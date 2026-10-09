export const clamp = (v, min, max) => Math.min(max, Math.max(min, v))

// Which of `count` equal slots a 0..1 progress value falls into.
export const activeIndex = (progress, count) => Math.min(count - 1, Math.floor(clamp(progress, 0, 1) * count))

// Stop-and-go loop over `count` stops: wait `dwell` ms on a stop, then travel `travel` ms
// to the next one (the last stop travels back to the first). Returns the stop the dot is
// on or leaving, and how far along the trip it is (0 while it waits).
export const dwellPhase = (ms, count, dwell, travel) => {
  const slot = dwell + travel
  const lap = ms - Math.floor(ms / (count * slot)) * count * slot
  const step = Math.min(count - 1, Math.floor(lap / slot))
  const inSlot = lap - step * slot
  return { step, trip: inSlot < dwell ? 0 : (inSlot - dwell) / travel }
}
