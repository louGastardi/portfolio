export const clamp = (v, min, max) => Math.min(max, Math.max(min, v))

// Which of `count` equal slots a 0..1 progress value falls into.
export const activeIndex = (progress, count) => Math.min(count - 1, Math.floor(clamp(progress, 0, 1) * count))
